# PHASE-30C / PHASE-33D: Kill stale dev servers, restart clean, verify cinematic API routes.
$ErrorActionPreference = 'Continue'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot

function Stop-ListenersOnPort {
    param([int]$Port)

    $pids = New-Object System.Collections.Generic.HashSet[int]

    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            if ($conn.OwningProcess -gt 0) {
                [void]$pids.Add([int]$conn.OwningProcess)
            }
        }
    } catch {
        Write-Host "[dev-reset] Get-NetTCPConnection unavailable for port $Port; using netstat fallback."
    }

    if ($pids.Count -eq 0) {
        $netstat = netstat -ano | Select-String ":$Port\s"
        foreach ($line in $netstat) {
            if ($line -match '\s+(\d+)\s*$') {
                [void]$pids.Add([int]$matches[1])
            }
        }
    }

    foreach ($procId in $pids) {
        try {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if (-not $proc) { continue }
            Write-Host "[dev-reset] Stopping PID $procId ($($proc.ProcessName)) on port $Port"
            Stop-Process -Id $procId -Force -ErrorAction Stop
        } catch {
            Write-Host "[dev-reset] Could not stop PID $procId on port $Port : $($_.Exception.Message)"
        }
    }

    if ($pids.Count -eq 0) {
        Write-Host "[dev-reset] No listener found on port $Port"
    }
}

function Test-RouteHttp200 {
    param(
        [string]$Url,
        [int]$MaxWaitSeconds = 90
    )

    for ($i = 0; $i -lt $MaxWaitSeconds; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 8
            if ($resp.StatusCode -eq 200) {
                return $true
            }
        } catch {
            # server still starting
        }
        Start-Sleep -Seconds 1
    }
    return $false
}

Write-Host "[dev-reset] Project root: $ProjectRoot"
Write-Host "[dev-reset] Clearing port 3000 (Express/tsx dev server)..."
Stop-ListenersOnPort -Port 3000
Write-Host "[dev-reset] Clearing port 24678 (Vite HMR)..."
Stop-ListenersOnPort -Port 24678

Write-Host "[dev-reset] Waiting 1 second..."
Start-Sleep -Seconds 1

$routesPreviewUrl = 'http://localhost:3000/api/cinematic/routes-preview'
$singleCanvasUrl = 'http://localhost:3000/api/cinematic/single-canvas-identity-preview'

Write-Host "[dev-reset] Starting npm run dev (background) for route verification..."
$devProcess = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev' -WorkingDirectory $ProjectRoot -PassThru -WindowStyle Hidden

Write-Host "[dev-reset] Waiting for $routesPreviewUrl ..."
if (-not (Test-RouteHttp200 -Url $routesPreviewUrl)) {
    Write-Error "[dev-reset] FAIL: routes-preview did not return HTTP 200 within timeout"
    if (-not $devProcess.HasExited) { Stop-Process -Id $devProcess.Id -Force -ErrorAction SilentlyContinue }
    exit 1
}
Write-Host "[dev-reset] OK routes-preview → 200"

try {
    $routesBody = Invoke-WebRequest -Uri $routesPreviewUrl -UseBasicParsing -TimeoutSec 8
    $routesJson = $routesBody.Content | ConvertFrom-Json
    if ($routesJson.has_single_canvas_identity_preview -ne $true) {
        Write-Error "[dev-reset] FAIL: routes-preview missing single-canvas-identity-preview registration"
        if (-not $devProcess.HasExited) { Stop-Process -Id $devProcess.Id -Force -ErrorAction SilentlyContinue }
        exit 1
    }
    Write-Host "[dev-reset] OK routes-preview lists single-canvas-identity-preview (count=$($routesJson.count))"
} catch {
    Write-Error "[dev-reset] FAIL: could not parse routes-preview JSON — $($_.Exception.Message)"
    if (-not $devProcess.HasExited) { Stop-Process -Id $devProcess.Id -Force -ErrorAction SilentlyContinue }
    exit 1
}

Write-Host "[dev-reset] Waiting for $singleCanvasUrl ..."
if (-not (Test-RouteHttp200 -Url $singleCanvasUrl)) {
    Write-Error "[dev-reset] FAIL: single-canvas-identity-preview did not return HTTP 200 within timeout"
    if (-not $devProcess.HasExited) { Stop-Process -Id $devProcess.Id -Force -ErrorAction SilentlyContinue }
    exit 1
}
Write-Host "[dev-reset] OK single-canvas-identity-preview → 200"
Write-Host "[dev-reset] Cinematic route verification passed."

if (-not $devProcess.HasExited) {
    Write-Host "[dev-reset] Stopping background dev process; starting foreground npm run dev..."
    Stop-Process -Id $devProcess.Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Stop-ListenersOnPort -Port 3000
    Stop-ListenersOnPort -Port 24678
    Start-Sleep -Seconds 1
}

Write-Host "[dev-reset] Starting npm run dev (foreground)..."
npm run dev
