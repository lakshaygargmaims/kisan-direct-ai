#!/bin/bash
# ═══════════════════════════════════════════════════════════
# KisanDirect AI - Tunnel Keepalive (SSH via serveo.net)
# ═══════════════════════════════════════════════════════════
# Auto-restarts SSH tunnel if it drops.
# No external tools needed — just SSH.
#
# Usage:
#   bash tunnel-keepalive.sh              # default port 5173
#   bash tunnel-keepalive.sh 8080         # custom port
#
# The current URL is always written to:
#   .freebuff/tunnel-url.txt
# ═══════════════════════════════════════════════════════════

PORT=${1:-5173}
BACKEND_PORT=3001
CHECK_INTERVAL=20
MAX_FAILURES=3

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/.freebuff"
TUNNEL_URL_FILE="${LOG_DIR}/tunnel-url.txt"
TUNNEL_LOG="${LOG_DIR}/tunnel-keepalive.log"
CF_BIN=""

mkdir -p "$LOG_DIR"
echo "" > "$TUNNEL_LOG"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [$1] $2"
    echo "$msg"
    echo "$msg" >> "$TUNNEL_LOG"
}

kill_all_tunnels() {
    # Kill any existing SSH tunnel to serveo
    pkill -f "ssh.*serveo.net" 2>/dev/null
    # Kill cloudflared if any
    taskkill //F //IM cloudflared.exe 2>/dev/null
    # Kill any localtunnel
    pkill -f "localtunnel" 2>/dev/null
    sleep 2
}

check_server() {
    curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:$1/" 2>/dev/null | grep -q "200"
}

start_ssh_tunnel() {
    kill_all_tunnels

    log "INFO" "Starting SSH tunnel to serveo.net for port $PORT..."

    # Use serveo.net (free, no account needed)
    ssh -o StrictHostKeyChecking=no \
        -o ServerAliveInterval=30 \
        -o ServerAliveCountMax=3 \
        -o ExitOnForwardFailure=yes \
        -R 80:localhost:$PORT \
        serveo.net > "${LOG_DIR}/serveo-output.log" 2>&1 &
    SSH_PID=$!

    # Wait up to 15 seconds for the URL
    local url=""
    for i in $(seq 1 15); do
        sleep 1
        url=$(grep -oP "https://[a-zA-Z0-9\-]+\.serveousercontent\.com" "${LOG_DIR}/serveo-output.log" 2>/dev/null | head -1)
        if [ -n "$url" ]; then
            break
        fi
        # Check if SSH process died
        if ! kill -0 $SSH_PID 2>/dev/null; then
            log "ERROR" "SSH process died unexpectedly"
            return 1
        fi
    done

    if [ -z "$url" ]; then
        log "ERROR" "Failed to get tunnel URL within 15 seconds"
        kill $SSH_PID 2>/dev/null
        return 1
    fi

    echo "$url" > "$TUNNEL_URL_FILE"
    log "OK" "Tunnel URL: $url"
    return 0
}

check_tunnel() {
    local url="$1"
    if [ -z "$url" ]; then
        return 1
    fi
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url/" 2>/dev/null)
    [ "$code" = "200" ]
}

# ═══════════════════════════════════════
# MAIN
# ═══════════════════════════════════════
echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║   KisanDirect AI - Tunnel Keepalive          ║"
echo "  ║   SSH tunnel via serveo.net (auto-restart)   ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""

# Check local servers
if check_server $PORT; then
    log "OK" "Frontend running on port $PORT"
else
    log "WARN" "Frontend NOT running on port $PORT — start it first"
fi

if check_server $BACKEND_PORT; then
    log "OK" "Backend running on port $BACKEND_PORT"
else
    log "WARN" "Backend NOT running on port $BACKEND_PORT — start it first"
fi

# Start initial tunnel
if ! start_ssh_tunnel; then
    log "ERROR" "Could not start initial tunnel. Exiting."
    exit 1
fi

CURRENT_URL=$(cat "$TUNNEL_URL_FILE" 2>/dev/null)
FAILURES=0

echo ""
log "INFO" "Monitoring every ${CHECK_INTERVAL}s. Press Ctrl+C to stop."
echo ""

# ── Trap cleanup ──
cleanup() {
    log "INFO" "Shutting down..."
    kill_all_tunnels
    echo "" > "$TUNNEL_URL_FILE"
    exit 0
}
trap cleanup INT TERM

# ── Monitoring loop ──
while true; do
    sleep $CHECK_INTERVAL

    # Check servers
    if ! check_server $PORT; then
        log "WARN" "Frontend down on port $PORT"
    fi
    if ! check_server $BACKEND_PORT; then
        log "WARN" "Backend down on port $BACKEND_PORT"
    fi

    # Check if SSH process is alive
    if ! kill -0 $SSH_PID 2>/dev/null; then
        log "WARN" "SSH tunnel process died"
        FAILURES=$MAX_FAILURES
    fi

    # Health check the tunnel URL
    if check_tunnel "$CURRENT_URL"; then
        if [ $FAILURES -gt 0 ]; then
            log "OK" "Tunnel recovered after $FAILURES failures"
        fi
        FAILURES=0
        log "OK" "Tunnel healthy: $CURRENT_URL"
    else
        FAILURES=$((FAILURES + 1))
        log "WARN" "Tunnel check failed ($FAILURES/$MAX_FAILURES)"

        if [ $FAILURES -ge $MAX_FAILURES ]; then
            log "WARN" "Restarting tunnel..."
            if start_ssh_tunnel; then
                CURRENT_URL=$(cat "$TUNNEL_URL_FILE" 2>/dev/null)
                FAILURES=0
                log "OK" "New tunnel: $CURRENT_URL"
            else
                log "ERROR" "Failed to restart. Will retry in ${CHECK_INTERVAL}s..."
            fi
        fi
    fi
done
