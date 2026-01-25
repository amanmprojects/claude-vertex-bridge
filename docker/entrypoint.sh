#!/bin/bash
set -e

# Configurable port (default 8765)
export LITELLM_PORT=${LITELLM_PORT:-8765}

# Set PYTHONPATH for token_logger
export PYTHONPATH=/app:$PYTHONPATH

# Function to refresh token periodically
refresh_token() {
    while true; do
        sleep 3000  # 50 minutes
        export VERTEX_TOKEN=$(python3 /app/vertex/get_vertex_token.py)
        echo "[$(date)] Token refreshed"
    done
}

# Initial token generation
export VERTEX_TOKEN=$(python3 /app/vertex/get_vertex_token.py)

# Start token refresh in background
refresh_token &

# Start LiteLLM
exec litellm --config /app/config/litellm_config.yaml --port "$LITELLM_PORT"
