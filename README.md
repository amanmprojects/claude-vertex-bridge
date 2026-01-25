# Claude Vertex Bridge

A Docker-based proxy that bridges Claude Code/VS Code/Claude Desktop to Google Vertex AI Model Garden, enabling use of open-source AI models (GLM-4.7, Qwen, MiniMax, DeepSeek, Kimi) with Claude's native interface.

## Features

- **Seamless Integration**: Use Claude Code, VS Code Anthropic extension, or Claude Desktop with Vertex AI models
- **Auto-Start**: Docker container automatically starts on boot and stays running
- **Token Refresh**: Automatic Vertex token refresh every 50 minutes
- **Multiple Models**: GLM-4.7, Qwen Coder, MiniMax M2, DeepSeek V3, Kimi K2
- **Cost Tracking**: Logs token usage and estimated costs for each request
- **Simple Wrappers**: `modclaude` and `modoc` scripts for easy CLI usage

## Quick Start

### Prerequisites

- Docker and docker-compose installed
- Google Cloud project with Vertex AI Model Garden enabled
- Google Cloud service account key (JSON format)

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd claude-code-debug-vertex
   ```

2. **Place your Vertex AI service account key:**
   ```bash
   cp /path/to/your/service-account-key.json vertex/key.json
   ```

3. **Build and start the Docker container:**
   ```bash
   docker compose up -d --build
   # Or run the setup script:
   ./scripts/docker_setup.sh
   ```

4. **Verify the proxy is running:**
   ```bash
   curl http://localhost:8765/health
   curl http://localhost:8765/v1/models
   ```

## Usage

There are two ways to use the proxy with Claude tools:

### Option 1: Set Environment Variables (Recommended)

Add to your `~/.profile` or `~/.bashrc`:

```bash
export ANTHROPIC_BASE_URL="http://localhost:8765"
export ANTHROPIC_API_KEY="dummy"  # LiteLLM doesn't validate this
```

Then reload your shell and use Claude tools directly:

```bash
# Claude Code (if installed globally)
claude

# OpenCode (if installed globally)
opencode -m glm-4.7
```

This is the simplest approach if you use Vertex models most of the time.

### Option 2: Use Wrapper Scripts

The wrapper scripts are convenience for switching between Vertex and default APIs without changing your environment variables.

```bash
# Run Claude Code with Vertex models
./modclaude [directory]

# Run Claude Code with --dsp flag
./modclaude --dsp [directory]

# Run OpenCode with model selection
./modoc [directory]
```

### Using VS Code Extension

Install the Anthropic VS Code extension and configure:

```json
{
  "anthropic.baseUrl": "http://localhost:8765",
  "anthropic.useBrowserLogin": false
}
```

### Using Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "baseUrl": "http://localhost:8765"
}
```

## Docker Management

```bash
# View logs
docker logs -f modclaude-litellm

# Check status
docker ps | grep modclaude-litellm

# Stop the container
docker compose down

# Restart the container
docker compose restart

# Rebuild after changes
docker compose up -d --build

# Check restart policy (auto-start on boot)
docker inspect modclaude-litellm | grep -A 5 RestartPolicy
```

## Available Models

| Claude Name (VS Code) | Direct Name | Actual Model |
|----------------------|-------------|--------------|
| claude-opus-4-5-20251101 | glm-4.7 | GLM-4.7 (ZhiPu AI) |
| claude-sonnet-4-5-20250929 | qwen | Qwen3 Coder (Alibaba) |
| claude-haiku-4-5-20251001 | minimax | MiniMax M2 |
| - | deepseek | DeepSeek V3.2 |
| - | kimi | Kimi K2 (Moonshot AI) |

## Configuration

### Proxy Port

Default port is **8765**. To change:
- Edit `docker-compose.yml` and change `"8765:8765"` to `"YOUR_PORT:8765"`
- Restart the container

### Token Refresh Interval

Token is refreshed every 50 minutes (3000 seconds) inside the container. To change:
- Edit `docker/entrypoint.sh` and modify `sleep 3000`
- Rebuild the container

### Logging

Token usage and cost logs are written to:
- `_token_usage.log` in the working directory where Claude Code/OpenCode runs

## Project Structure

```
claude-code-debug-vertex/
├── docker/
│   ├── Dockerfile          # Container image definition
│   └── entrypoint.sh       # Container startup script with token refresh
├── config/
│   ├── litellm_config.yaml # LiteLLM model configuration
│   └── token_logger.py     # Token usage and cost logger
├── scripts/
│   └── docker_setup.sh     # Automated setup script
├── vertex/
│   ├── key.json           # Your Google Cloud service account key (not in git)
│   └── get_vertex_token.py # Token generation script
├── modclaude              # Claude Code wrapper script
├── modoc                  # OpenCode wrapper script
├── start_claude.sh        # Claude Code startup script
├── docker-compose.yml     # Docker Compose configuration
└── requirements.txt       # Python dependencies
```

## Troubleshooting

### Container won't start

Check logs: `docker logs modclaude-litellm`

Common issues:
- Missing `vertex/key.json` - Ensure your service account key is in place
- Invalid service account - Verify the key has Vertex AI permissions
- Port conflict - Change port in `docker-compose.yml`

### Token refresh not working

The token refresh runs in the background inside the container. Check logs:
```bash
docker logs modclaude-litellm | grep "Token refreshed"
```

### Claude Code not connecting

- Verify proxy is running: `curl http://localhost:8765/health`
- Check `start_claude.sh` has correct `ANTHROPIC_BASE_URL` (should be `http://localhost:8765`)

## Feature Compatibility

LiteLLM translates Anthropic API calls to OpenAI-compatible format. Here's what works:

| Feature | Status | Notes |
|---------|--------|-------|
| Basic chat completion | Full | Text generation, streaming |
| System prompts | Full | Vertex models respect system prompts |
| Tool calling | Full | LiteLLM translates tool format |
| Temperature, top_p, max_tokens | Full | Standard parameters work |
| Images/Vision | Mostly | Depends on model support |
| Prompt caching | No | Anthropic cache control headers not preserved |
| Citation sources | No | Anthropic-specific citation format not preserved |
| Extended reasoning/beta features | No | Anthropic-specific features may not work |

For coding tasks (file edits, terminal commands, tool use), all core functionality works as expected.

Token usage is logged with estimated costs:

| Model | Input ($/1M tokens) | Output ($/1M tokens) |
|-------|---------------------|----------------------|
| GLM-4.7 | $0.60 | $2.20 |

View logs from any directory where you ran Claude: `cat _token_usage.log`

## License

MIT

## Security Notes

- Service account key contains sensitive credentials - never commit it to git
- The `.gitignore` file excludes `vertex/key.json`
- Keep the key file secure with proper file permissions
