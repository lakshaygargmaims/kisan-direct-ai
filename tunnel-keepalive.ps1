# KisanDirect AI - Cloudflare Tunnel Keepalive
# Auto-restarts tunnel if it drops. Prints the current public URL.
# Usage: powershell -ExecutionPolicy Bypass -File tunnel-keepalive.ps1

param(
    [int]$LocalPort = 5173,
    [int]$HealthCheckIntervalSec = 30,
    [int]$MaxFailuresBeforeRestart = 3,
    [int]$BackendCheckPort = 3001,
    [string]$LogDir = ".freebuff"
)

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$logDir = Join-Path $scriptDir $LogDir
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

$tunnelLog = Join-Path $logDir "tunnel-keepalive.log"
$urlFile = Join-Path $logDir "tunnel-url.txt"
$running = $true

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] [$Level] $Message"
    Write-Host $line -ForegroundColor $(
        switch ($Level) {
            "ERROR" { "Red" }
            "WARN"  { "Yellow" }
            "OK"    { "Green" }
            default { "White" }
        }
    )
    Add-Content -Path $tunnelLog -Value $line
}

function Test-ServerAlive {
    param([int]$Port, [string]$Name)
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:$Port/" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        return $resp.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Test-TunnelAlive {
    param([string]$Url)
    if (-not $Url) { return $false }
    try {
        $resp = Invoke-WebRequest -Uri $Url -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
        return $resp.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Start-Tunnel {
    param([int]$Port)

    Write-Log "Starting cloudflared tunnel on port $Port..."

    # Kill any existing cloudflared
    Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    # Start cloudflared as a background job
    $job = Start-Job -ScriptBlock {
        param($p)
        npx cloudflared tunnel --url "http://localhost:$p" 2>&1
    } -ArgumentList $Port

    # Wait up to 20 seconds for the URL to appear
    $url = $null
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 1
        $output = Receive-Job -Job $job -ErrorAction SilentlyContinue
        foreach ($line in $output) {
            if ($line -match "https://[a-zA-Z0-9\-]+\.trycloudflare\.com") {
                $url = $Matches[0]
                break
            }
        }
        if ($url) { break }
    }

    if (-not $url) {
        Write-Log "Failed to get tunnel URL within 20 seconds" "ERROR"
        Stop-Job -Job $job -ErrorAction SilentlyContinue
        Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
        return $null
    }

    Write-Log "Tunnel URL: $url" "OK"
    Set-Content -Path $urlFile -Value $url
    return @{ Job = $job; Url = $url }
}

# ─── MAIN ───
Write-Log "========================================"
Write-Log "KisanDirect AI - Tunnel Keepalive"
Write-Log "Port: $LocalPort | Health check: every ${HealthCheckIntervalSec}s"
Write-Log "========================================"

# Ensure servers are running
if (-not (Test-ServerAlive -Port $LocalPort -Name "frontend")) {
    Write-Log "Frontend not running on port $LocalPort!" "ERROR"
}
if (-not (Test-ServerAlive -Port $BackendCheckPort -Name "backend")) {
    Write-Log "Backend not running on port $BackendCheckPort!" "ERROR"
}

$tunnel = Start-Tunnel -Port $LocalPort
if (-not $tunnel) {
    Write-Log "Could not start tunnel. Exiting." "ERROR"
    exit 1
}

$currentUrl = $tunnel.Url
$consecutiveFailures = 0

Write-Log "Keepalive monitoring started. Press Ctrl+C to stop."

try {
    while ($running) {
        Start-Sleep -Seconds $HealthCheckIntervalSec

        # First check local servers are alive
        if (-not (Test-ServerAlive -Port $LocalPort -Name "frontend")) {
            Write-Log "Frontend server died on port $LocalPort!" "WARN"
        }
        if (-not (Test-ServerAlive -Port $BackendCheckPort -Name "backend")) {
            Write-Log "Backend server died on port $BackendCheckPort!" "WARN"
        }

        # Check tunnel health
        $alive = Test-TunnelAlive -Url $currentUrl

        if ($alive) {
            if ($consecutiveFailures -gt 0) {
                Write-Log "Tunnel recovered after $consecutiveFailures failures" "OK"
            }
            $consecutiveFailures = 0
            Write-Log "Tunnel healthy: $currentUrl"
        } else {
            $consecutiveFailures++
            Write-Log "Tunnel check failed ($consecutiveFailures/$MaxFailuresBeforeRestart)" "WARN"

            if ($consecutiveFailures -ge $MaxFailuresBeforeRestart) {
                Write-Log "Max failures reached. Restarting tunnel..." "WARN"

                # Kill old tunnel job
                if ($tunnel.Job) {
                    Stop-Job -Job $tunnel.Job -ErrorAction SilentlyContinue
                    Remove-Job -Job $tunnel.Job -Force -ErrorAction SilentlyContinue
                }
                Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 3

                # Start new tunnel
                $tunnel = Start-Tunnel -Port $LocalPort
                if ($tunnel) {
                    $currentUrl = $tunnel.Url
                    $consecutiveFailures = 0
                    Write-Log "New tunnel URL: $currentUrl" "OK"
                } else {
                    Write-Log "Failed to restart tunnel. Will retry in ${HealthCheckIntervalSec}s..." "ERROR"
                }
            }
        }
    }
} finally {
    Write-Log "Shutting down tunnel keepalive..."
    if ($tunnel -and $tunnel.Job) {
        Stop-Job -Job $tunnel.Job -ErrorAction SilentlyContinue
        Remove-Job -Job $tunnel.Job -Force -ErrorAction SilentlyContinue
    }
    Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Log "Tunnel stopped."
}
