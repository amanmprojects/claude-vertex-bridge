# Claude Vertex Bridge

Use Google Cloud Vertex AI Model Garden models with AI coding tools like [Claude Code](https://claude.ai/claude-code) and [OpenCode](https://opencode.ai).

This project sets up a LiteLLM proxy that bridges Vertex AI endpoints to OpenAI-compatible API, allowing you to use open-source models with tools that only support standard APIs.

## Features

- **Multi-model support**: MiniMax M2, DeepSeek V3, Kimi K2, Qwen Coder, GLM-4.7
- **Shared LiteLLM manager**: Run Claude Code and OpenCode simultaneously without conflicts
- **CLI wrappers**: `modclaude` and `modoc` to launch tools from anywhere
- **Automatic token refresh**: Vertex tokens refresh automatically (every 50 minutes)

## Setup

### Prerequisites

- Google Cloud project with Vertex AI enabled
- Service account key with Vertex AI permissions
- Python 3.12+
- Python virtual environment

### Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd claude-vertex-bridge
```

2. Create a Python virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

3. Install dependencies:
```bash
pip install litellm google-cloud-aiplatform
```

4. Configure your credentials:

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/key.json"
VERTEX_PROJECT_ID="your-project-id"
```

5. Create the LiteLLM config:
```bash
cp config/litellm_config.yaml.example config/litellm_config.yaml
```

Edit `config/litellm_config.yaml` and replace `YOUR-PROJECT` with your Google Cloud project ID.

6. Make scripts executable:
```bash
chmod +x modclaude modoc manage_litellm.sh
```

## Usage

### Using modclaude (Claude Code)

Run Claude Code from any directory:

```bash
# Current directory
./modclaude

# Or from a specific directory
./modclaude /path/to/your/project
```

### Using modoc (OpenCode)

Run OpenCode from any directory:

```bash
# Current directory - will prompt for model selection
./modoc

# Or from a specific directory
./modoc /path/to/your/project
```

You can choose from these models:
- minimax (MiniMax M2)
- deepseek (DeepSeek V3)
- kimi (Kimi K2)
- qwen (Qwen Coder)
- glm-4.7 (GLM-4.7)

### Running Both Simultaneously

The shared LiteLLM manager handles multiple clients safely:

```bash
# Terminal 1
./modclaude

# Terminal 2 (in different directory if needed)
./modoc
```

Both will share the same LiteLLM proxy on port 8000. Closing one won't affect the other.

### Managing LiteLLM

Check LiteLLM status:
```bash
./manage_litellm.sh status
```

Force stop LiteLLM:
```bash
./manage_litellm.sh stop
```

## Project Structure

```
claude-vertex-bridge/
├── modclaude                  # Claude Code wrapper
├── modoc                      # OpenCode wrapper
├── manage_litellm.sh          # Shared LiteLLM manager
├── start_claude.sh            # Claude Code launcher
├── run_litellm_all.sh         # Legacy LiteLLM starter
├── config/
│   └── litellm_config.yaml.example  # LiteLLM config template
├── vertex/
│   ├── get_vertex_token.py    # Vertex AI token generator
│   └── claude_vertex_proxy.py # Claude wrapper for Vertex
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## Configuration Files

The following files are **NOT** tracked by git (see `.gitignore`):
- `.env` - Contains your credentials
- `config/litellm_config.yaml` - Contains your project ID
- `vertex/key.json` - Your service account key
- All `*.yaml` config files with credentials

## Troubleshooting

### LiteLLM won't start

Check the manager log:
```bash
cat .litellm_manager.log
```

Force stop and restart:
```bash
./manage_litellm.sh stop
./manage_litellm.sh connect
```

### Vertex token expired

The token refreshes automatically every 50 minutes. If issues persist, check that your service account key is valid and has the right permissions.

### Port 8000 already in use

If another process is using port 8000:
```bash
lsof -i :8000
kill <PID>
```

Then start fresh:
```bash
./manage_litellm.sh stop
```

## Security

- Never commit `.env`, `config/litellm_config.yaml`, or `vertex/key.json`
- Use environment variables for sensitive data
- Rotate your service account keys regularly
- Restrict service account permissions to only what's needed

## License

MIT

## Contributing

Feel free to open issues or pull requests!
