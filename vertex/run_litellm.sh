#!/bin/bash

# Generate initial token
export VERTEX_TOKEN=$(python3 get_vertex_token.py)

# Function to refresh token and restart LiteLLM
refresh_and_restart() {
    while true; do
        sleep 3000  # Refresh every 50 minutes (before 1-hour expiry)
        echo "Refreshing token..."
        export VERTEX_TOKEN=$(python3 get_vertex_token.py)
        pkill -f "litellm --config"
        litellm --config litellm_config.yaml --port 8000 &
    done
}

# Start background refresh
refresh_and_restart &

export ANTHROPIC_BASE_URL="http://localhost:8000"
export ANTHROPIC_API_KEY="sk-1234"
export ANTHROPIC_MODEL="minimax"

# Start LiteLLM
litellm --config litellm_config.yaml --port 8000

