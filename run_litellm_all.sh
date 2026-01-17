#!/bin/bash

# Generate Vertex token
export VERTEX_TOKEN=$(python3 vertex/get_vertex_token.py)

# Function to refresh Vertex token
refresh_token() {
    while true; do
        sleep 3000  # Refresh every 50 minutes
        echo "Refreshing Vertex token..."
        export VERTEX_TOKEN=$(python3 vertex/get_vertex_token.py)
        pkill -f "litellm --config"
        litellm --config litellm_config_all.yaml --port 8000 &
    done
}

# Start background refresh
refresh_token &

# Start LiteLLM with all models
litellm --config litellm_config_all.yaml --port 8000
