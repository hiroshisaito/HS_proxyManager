<#
  runner.ps1 - launch After Effects headless, run driver.jsx, report results.

  Usage (from anywhere):
    powershell -ExecutionPolicy Bypass -File .\.claude\skills\run-hs-proxymanager\runner.ps1
    powershell ... runner.ps1 -AePath "C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\AfterFX.com"
    powershell ... runner.ps1 -TimeoutSec 180 -Force

  It uses AfterFX.com (the console launcher that BLOCKS until AE exits) with -r
  to run the driver, which writes PASS/FAIL lines to last-run.log next to this
  script. Exit code 0 = all passed, 1 = failures or no result, 2 = setup error.

  Safety: refuses to run if AE is already open (the driver quits AE on finish,
  which would close your live session). Pass -Force to override.
#>
param(
    [string]$AePath = "D:\Program Files\Adobe After Effects 2025\Support Files\AfterFX.com",
    [int]$TimeoutSec = 240,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$here   = $PSScriptRoot
$driver = Join-Path $here "driver.jsx"
$outLog = Join-Path $here "last-run.log"

if (-not (Test-Path $driver)) { Write-Error "driver.jsx not found at $driver"; exit 2 }

# --- locate AfterFX.com ---
if (-not (Test-Path $AePath)) {
    Write-Host "Default AE path not found, searching..."
    $cand = @()
    foreach ($root in @("D:\Program Files","C:\Program Files")) {
        $cand += Get-ChildItem -Path $root -Recurse -Filter "AfterFX.com" -ErrorAction SilentlyContinue -Depth 4 |
                 Select-Object -ExpandProperty FullName
    }
    if ($cand.Count -gt 0) { $AePath = $cand[0]; Write-Host "Found: $AePath" }
    else { Write-Error "AfterFX.com not found. Pass -AePath explicitly."; exit 2 }
}

# --- refuse to clobber a live AE session ---
$running = Get-Process AfterFX -ErrorAction SilentlyContinue
if ($running -and -not $Force) {
    Write-Error "After Effects is already running (pid $($running.Id -join ',')). The driver quits AE on finish. Close AE or pass -Force."
    exit 2
}

# --- run ---
Remove-Item $outLog -ErrorAction SilentlyContinue
$env:HS_DRIVER_OUT = $outLog
Write-Host "Launching AE headless (cold start ~30-60s)..."
Write-Host "  $AePath -r $driver"

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$proc = Start-Process -FilePath $AePath -ArgumentList @("-r", "`"$driver`"") -PassThru -NoNewWindow
if (-not $proc.WaitForExit($TimeoutSec * 1000)) {
    Write-Warning "Timed out after ${TimeoutSec}s; killing AfterFX."
    Get-Process AfterFX -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    try { $proc | Stop-Process -Force -ErrorAction SilentlyContinue } catch {}
}
$sw.Stop()
Write-Host ("AE exited after {0}s" -f [math]::Round($sw.Elapsed.TotalSeconds,1))

# --- report ---
if (-not (Test-Path $outLog)) {
    Write-Error "No result file produced ($outLog). The driver did not complete."
    exit 1
}
Write-Host "----- last-run.log -----"
Get-Content $outLog | ForEach-Object { Write-Host $_ }
Write-Host "------------------------"

$summary = Select-String -Path $outLog -Pattern "DRIVER_DONE pass=(\d+) fail=(\d+)" | Select-Object -Last 1
if ($summary) {
    $failCount = [int]$summary.Matches[0].Groups[2].Value
    if ($failCount -eq 0) { Write-Host "ALL TESTS PASSED"; exit 0 }
    else { Write-Host "$failCount TEST(S) FAILED"; exit 1 }
}
Write-Error "Could not find DRIVER_DONE summary; driver likely crashed."
exit 1
