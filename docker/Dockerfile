FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy configuration and scripts
COPY config/litellm_config.yaml ./config/
COPY config/token_logger.py ./config/
COPY vertex/ ./vertex/
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Expose port (will be configurable via env var)
EXPOSE 8765

# Run with custom entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
