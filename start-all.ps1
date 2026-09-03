# KisanDirect AI - Full Launcher
# Starts backend, frontend, and tunnel keepalive all at once.
# Usage: powershell -ExecutionPolicy Bypass -File start-all.ps1

param(
    [int]$BackendPort = 3001,
    [int]$FrontendPort = 5173,
    [string]$LogDir = ".freebuff"
)

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$logDir = Join-Path $scriptDir $LogDir
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

function Write-Status {
    param([string]$Msg, [string]$Color = "White")
    Write-Host "[$( Get-Date -Format 'HH:mm:ss' )] $Msg" -ForegroundColor $Color
}

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║   KisanDirect AI - Full Launcher         ║" -ForegroundColor Green
Write-Host "  ║   Backend + Frontend + Public Tunnel     ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# ── Step 1: Check & start backend ──
Write-Status "Checking backend on port $BackendPort..."

$backendRunning = $false
try {
    $r = Invoke-WebRequest -Uri "http://localhost:$BackendPort/api/auth/me" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    $backendRunning = $true
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) { $backendRunning = $true }
}

if ($backendRunning) {
    Write-Status "Backend already running on port $BackendPort" "Green"
} else {
    Write-Status "Starting backend server..." "Yellow"
    $backendDir = Join-Path $scriptDir "backend"
    Start-Process -FilePath "node" -ArgumentList "dist/server.js" `
        -WorkingDirectory $backendDir `
        -RedirectStandardOutput (Join-Path $logDir "backend.log") `
        -RedirectStandardError (Join-Path $logDir "backend-err.log") `
        -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Status "Backend started" "Green"
}

# ── Step 2: Check & start frontend ──
Write-Status "Checking frontend on port $FrontendPort..."

$frontendRunning = $false
try {
    $r = Invoke-WebRequest -Uri "http://localhost:$FrontendPort/" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    if ($r.StatusCode -eq 200) { $frontendRunning = $true }
} catch {}

if ($frontendRunning) {
    Write-Status "Frontend already running on port $FrontendPort" "Green"
} else {
    Write-Status "Starting frontend dev server..." "Yellow"
    $frontendDir = Join-Path $scriptDir "frontend"
    Start-Process -FilePath "npx.cmd" -ArgumentList "vite", "--host" `
        -WorkingDirectory $frontendDir `
        -RedirectStandardOutput (Join-Path $logDir "frontend.log") `
        -RedirectStandardError (Join-Path $logDir "frontend-err.log") `
        -WindowStyle Hidden
    Start-Sleep -Seconds 5
    Write-Status "Frontend started" "Green"
}

# ── Step 3: Print demo credentials ──
Write-Host ""
Write-Status "────────────────────────────────────────" "Cyan"
Write-Status " DEMO CREDENTIALS (password: demo123)" "Cyan"
Write-Status "────────────────────────────────────────" "Cyan"
Write-Status " 👨‍🌾 Farmer:   farmer@demo.com" "White"
Write-Status " 🛒 Consumer:  consumer@demo.com" "White"
Write-Status " 🏢 B2B Buyer: buyer@demo.com" "White"
Write-Status " 📦 Logistics: logistics@demo.com" "White"
Write-Status " 🏛️  Admin:    admin@demo.com" "White"
Write-Status " 👥 FPO:       fpo@demo.com" "White"
Write-Status "────────────────────────────────────────" "Cyan"
Write-Host ""

# ── Step 4: Start tunnel keepalive ──
Write-Status "Starting Cloudflare tunnel with keepalive..." "Yellow"
Write-Status "(The tunnel auto-restarts if it drops)" "Gray"
Write-Host ""

$tunnelScript = Join-Path $scriptDir "tunnel-keepalive.ps1"
& $tunnelScript -LocalPort $FrontendPort -BackendCheckPort $BackendPort -LogDir $LogDir
