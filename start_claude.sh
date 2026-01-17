#!/bin/bash

# Set environment for Claude Code
export ANTHROPIC_BASE_URL="http://localhost:8000"
export ANTHROPIC_API_KEY="dummy"

# Define the list of models based on the provided configuration
MODELS=("minimax" "deepseek" "kimi" "qwen" "glm-4.7")

echo "=== Claude Code with LiteLLM Proxy ==="
echo "Base URL: $ANTHROPIC_BASE_URL"
echo ""
echo "Please select a model to use:"

# Interactive menu prompt
PS3="Enter model number: "
select selected_model in "${MODELS[@]}"; do
    if [ -n "$selected_model" ]; then
        export ANTHROPIC_MODEL="$selected_model"
        break
    else
        echo "Invalid selection. Please try again."
    fi
done

echo ""
echo "Selected Model: $ANTHROPIC_MODEL"
echo "Note: Ensure your LiteLLM config.yaml contains the mapping for '$ANTHROPIC_MODEL'."
echo ""

# Start Claude Code
claude
