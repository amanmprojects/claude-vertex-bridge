#!/usr/bin/env python3
import json
import time
from google.oauth2 import service_account
import google.auth.transport.requests

SERVICE_ACCOUNT_FILE = "vertex/key.json"

def get_token():
    with open(SERVICE_ACCOUNT_FILE, 'r') as f:
        sa_info = json.load(f)
    
    creds = service_account.Credentials.from_service_account_info(
        sa_info,
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    
    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    return creds.token

if __name__ == "__main__":
    print(get_token())

