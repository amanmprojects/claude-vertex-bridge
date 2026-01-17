#!/usr/bin/env python3
"""
Anthropic-to-OpenAI proxy for Claude Code with Vertex AI Model Garden
"""
import json
import time
from flask import Flask, request, Response
import requests
from google.oauth2 import service_account
import google.auth.transport.requests

app = Flask(__name__)

# Configuration
SERVICE_ACCOUNT_FILE = "/home/aman/Code/claude-code-debug-vertex/key.json"

API_BASE_URL = "https://aiplatform.googleapis.com/v1beta1/projects/chatapp-by-amanm/locations/global/endpoints/openapi"

class TokenManager:
    def __init__(self, sa_file):
        with open(sa_file, 'r') as f:
            sa_info = json.load(f)
        self.creds = service_account.Credentials.from_service_account_info(
            sa_info,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        self._token = None
        self._expiry = 0
    
    def get_token(self):
        if time.time() >= self._expiry - 300:  # Refresh 5 min before expiry
            auth_req = google.auth.transport.requests.Request()
            self.creds.refresh(auth_req)
            self._token = self.creds.token
            self._expiry = time.time() + 3600
        return self._token

token_mgr = TokenManager(SERVICE_ACCOUNT_FILE)

def anthropic_to_openai(anthropic_msg):
    """Convert Anthropic message format to OpenAI format"""
    openai_msgs = []
    
    # Handle system message
    system_content = anthropic_msg.get("system", "")
    if system_content:
        openai_msgs.append({"role": "system", "content": system_content})
    
    # Convert messages
    for msg in anthropic_msg.get("messages", []):
        openai_msgs.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    
    return {
        "model": "minimaxai/minimax-m2-maas",  # Default model
        "messages": openai_msgs,
        "max_tokens": anthropic_msg.get("max_tokens", 8192),
        "temperature": anthropic_msg.get("temperature", 1.0),
        "stream": anthropic_msg.get("stream", False),
    }

@app.route('/v1/messages', methods=['POST'])
def proxy_completion():
    try:
        anthropic_req = request.json
        openai_req = anthropic_to_openai(anthropic_req)
        
        # Get fresh token
        token = token_mgr.get_token()
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        
        url = f"{API_BASE_URL}/chat/completions"
        
        # Forward request
        if openai_req.get("stream"):
            resp = requests.post(url, json=openai_req, headers=headers, stream=True)
            
            def generate():
                for line in resp.iter_lines():
                    if line:
                        # Convert OpenAI SSE to Anthropic format
                        yield line.decode('utf-8') + '\n'
            
            return Response(generate(), mimetype='text/event-stream')
        else:
            resp = requests.post(url, json=openai_req, headers=headers)
            
            if resp.status_code != 200:
                return {"error": resp.text}, resp.status_code
            
            # Convert OpenAI response to Anthropic format
            openai_resp = resp.json()
            anthropic_resp = {
                "id": openai_resp["id"],
                "type": "message",
                "role": "assistant",
                "content": [{"type": "text", "text": openai_resp["choices"][0]["message"]["content"]}],
                "model": openai_resp["model"],
                "stop_reason": "end_turn",
                "usage": {
                    "input_tokens": openai_resp["usage"]["prompt_tokens"],
                    "output_tokens": openai_resp["usage"]["completion_tokens"]
                }
            }
            return anthropic_resp
            
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)

