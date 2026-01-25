#!/bin/bash
set -e

# Docker-based LiteLLM Proxy Setup Script

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "   LiteLLM Docker Setup Script"
echo "========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed."
    echo ""
    echo "Please install Docker:"
    echo "  - Ubuntu/Debian: curl -fsSL https://get.docker.com | sh"
    echo "  - Or visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "Docker installation found."
docker --version
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "ERROR: docker-compose is not installed."
    echo ""
    echo "Please install docker-compose:"
    echo "  - pip install docker-compose"
    echo "  - Or visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "docker-compose installation found."
echo ""

# Check for required files
echo "Checking required files..."
REQUIRED_FILES=(
    "$PROJECT_ROOT/vertex/key.json"
    "$PROJECT_ROOT/config/litellm_config.yaml"
    "$PROJECT_ROOT/requirements.txt"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Required file not found: $file"
        exit 1
    fi
done

echo "All required files found."
echo ""

# Build and start the container
echo "Building Docker image..."
cd "$PROJECT_ROOT"

# Use docker compose if available, otherwise fall back to docker-compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD build

echo ""
echo "Starting container..."
$COMPOSE_CMD up -d

echo ""
echo "========================================="
echo "   Setup Complete!"
echo "========================================="
echo ""
echo "Container is now running."
echo ""
echo "Commands for management:"
echo "  - View logs:     $COMPOSE_CMD logs -f litellm"
echo "  - Check status:  docker ps | grep modclaude-litellm"
echo "  - Stop service:  $COMPOSE_CMD down"
echo "  - Restart:       $COMPOSE_CMD restart"
echo ""
echo "Testing the proxy:"
echo "  curl http://localhost:8765/health"
echo "  curl http://localhost:8765/v1/models"
echo ""
echo "Using modclaude or modoc:"
echo "  ./modclaude [directory]"
echo "  ./modoc [directory]"
echo ""
echo "========================================="
echo "   Auto-Start on Boot"
echo "========================================="
echo ""
echo "The container is configured with 'restart: unless-stopped'"
echo "which means it will:"
echo "  - Restart automatically if it crashes"
echo "  - Start automatically on system boot"
echo ""
echo "To verify the restart policy:"
echo "  docker inspect modclaude-litellm | grep -A 10 RestartPolicy"
echo ""
echo "Note: Your system must have Docker configured to start on boot."
echo "  - Ubuntu: sudo systemctl enable docker"
echo ""
