#!/bin/bash

# Centralized LiteLLM Manager - Handles shared LiteLLM proxy for multiple clients

# Get the directory where this script is located
LITELLM_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LITELLM_PORT=8000

# Config file location - user must create this from the example
LITELLM_CONFIG="$LITELLM_HOME/config/litellm_config.yaml"

# Fallback to old location for backwards compatibility
if [ ! -f "$LITELLM_CONFIG" ] && [ -f "$LITELLM_HOME/"$LITELLM_CONFIG"" ]; then
    LITELLM_CONFIG="$LITELLM_HOME/"$LITELLM_CONFIG""
fi

# State files
REF_COUNT_FILE="$LITELLM_HOME/.litellm_ref_count"
LITELLM_PID_FILE="$LITELLM_HOME/.litellm_pid"
REFRESH_PID_FILE="$LITELLM_HOME/.litellm_refresh_pid"

# Logging
LOG_FILE="$LITELLM_HOME/.litellm_manager.log"
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# Initialize or read reference count
get_ref_count() {
    if [ ! -f "$REF_COUNT_FILE" ]; then
        echo 0
    else
        cat "$REF_COUNT_FILE" 2>/dev/null || echo 0
    fi
}

# Increment reference count
increment_ref() {
    local count=$(get_ref_count)
    echo $((count + 1)) > "$REF_COUNT_FILE"
    log "Reference count incremented: $(get_ref_count)"
}

# Decrement reference count
decrement_ref() {
    local count=$(get_ref_count)
    if [ "$count" -gt 0 ]; then
        echo $((count - 1)) > "$REF_COUNT_FILE"
        log "Reference count decremented: $(get_ref_count)"
    fi
    get_ref_count
}

# Check if LiteLLM is running
is_litellm_running() {
    if [ -f "$LITELLM_PID_FILE" ]; then
        local pid=$(cat "$LITELLM_PID_FILE" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# Check if refresh process is running
is_refresh_running() {
    if [ -f "$REFRESH_PID_FILE" ]; then
        local pid=$(cat "$REFRESH_PID_FILE" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# Start LiteLLM
start_litellm() {
    if is_litellm_running; then
        log "LiteLLM already running (PID: $(cat $LITELLM_PID_FILE))"
        return 0
    fi

    log "Starting LiteLLM on port $LITELLM_PORT..."

    cd "$LITELLM_HOME" || return 1

    # Generate initial token
    export VERTEX_TOKEN=$(python3 vertex/get_vertex_token.py 2>> "$LOG_FILE")

    # Start refresh process
    refresh_token &
    local refresh_pid=$!
    echo $refresh_pid > "$REFRESH_PID_FILE"
    log "Refresh token process started (PID: $refresh_pid)"

    # Start LiteLLM
    litellm --config "$LITELLM_CONFIG" --port "$LITELLM_PORT" >> "$LOG_FILE" 2>&1 &
    local litellm_pid=$!
    echo $litellm_pid > "$LITELLM_PID_FILE"
    log "LiteLLM started (PID: $litellm_pid)"

    # Wait for LiteLLM to be ready
    local max_wait=10
    local waited=0
    while [ $waited -lt $max_wait ]; do
        if curl -s "http://localhost:$LITELLM_PORT/health" >/dev/null 2>&1; then
            log "LiteLLM is ready"
            return 0
        fi
        if ! kill -0 $litellm_pid 2>/dev/null; then
            log "ERROR: LiteLLM process died"
            return 1
        fi
        sleep 1
        waited=$((waited + 1))
    done

    log "WARNING: LiteLLM health check timed out"
    return 0  # Continue anyway, might still be starting
}

# Stop LiteLLM and refresh process
stop_litellm() {
    local ref_count=$(get_ref_count)
    if [ "$ref_count" -gt 0 ]; then
        log "Not stopping LiteLLM - $ref_count client(s) still connected"
        return 0
    fi

    log "Stopping LiteLLM (no more clients)"

    if [ -f "$REFRESH_PID_FILE" ]; then
        local refresh_pid=$(cat "$REFRESH_PID_FILE")
        if kill -0 "$refresh_pid" 2>/dev/null; then
            kill "$refresh_pid" 2>/dev/null
            log "Refresh token process stopped (PID: $refresh_pid)"
        fi
        rm -f "$REFRESH_PID_FILE"
    fi

    if [ -f "$LITELLM_PID_FILE" ]; then
        local litellm_pid=$(cat "$LITELLM_PID_FILE")
        if kill -0 "$litellm_pid" 2>/dev/null; then
            kill "$litellm_pid" 2>/dev/null
            # Wait for process to exit
            local count=0
            while kill -0 "$litellm_pid" 2>/dev/null && [ $count -lt 5 ]; do
                sleep 1
                count=$((count + 1))
            done
            if kill -0 "$litellm_pid" 2>/dev/null; then
                kill -9 "$litellm_pid" 2>/dev/null
            fi
            log "LiteLLM stopped (PID: $litellm_pid)"
        fi
        rm -f "$LITELLM_PID_FILE"
    fi

    # Reset ref count to 0
    echo 0 > "$REF_COUNT_FILE"
}

# Refresh token function (runs in background)
refresh_token() {
    while true; do
        sleep 3000  # Refresh every 50 minutes
        log "Refreshing Vertex token..."

        cd "$LITELLM_HOME" || exit 1
        export VERTEX_TOKEN=$(python3 vertex/get_vertex_token.py 2>> "$LOG_FILE")

        # Restart LiteLLM
        if [ -f "$LITELLM_PID_FILE" ]; then
            local litellm_pid=$(cat "$LITELLM_PID_FILE")
            if kill -0 "$litellm_pid" 2>/dev/null; then
                kill "$litellm_pid" 2>/dev/null
                log "Restarting LiteLLM with new token..."
                litellm --config "$LITELLM_CONFIG" --port "$LITELLM_PORT" >> "$LOG_FILE" 2>&1 &
                echo $! > "$LITELLM_PID_FILE"
            fi
        fi
    done
}

# Main command handling
case "${1:-connect}" in
    connect)
        increment_ref
        start_litellm
        ;;
    disconnect)
        local count=$(decrement_ref)
        if [ "$count" -le 0 ]; then
            stop_litellm
        fi
        ;;
    status)
        if is_litellm_running; then
            echo "LiteLLM running (PID: $(cat $LITELLM_PID_FILE))"
            echo "Active clients: $(get_ref_count)"
        else
            echo "LiteLLM not running"
        fi
        ;;
    stop)
        force_stop=1
        echo 0 > "$REF_COUNT_FILE"
        stop_litellm
        ;;
    *)
        echo "Usage: $0 {connect|disconnect|status|stop}"
        exit 1
        ;;
esac
