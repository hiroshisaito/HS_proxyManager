<#
  screenshot.ps1 - launch AE, build the real ScriptUI panel, capture JUST the
  panel window (by title, via PrintWindow so it works even when occluded), then
  close AE GRACEFULLY (WM_CLOSE -> the jsx calls app.quit()).

  Usage:
    powershell -ExecutionPolicy Bypass -File .\.claude\skills\run-hs-proxymanager\screenshot.ps1

  Produces panel-screenshot.png next to this script.

  IMPORTANT: AE.exe cannot initialize its GPU/display while a fullscreen GPU app
  (e.g. a game) owns the screen -- AfterFX.exe dies on launch and only
  AfterFX.com lingers. This script detects that (AfterFX.exe never appears) and
  aborts fast instead of hanging. Close fullscreen GPU apps first.
#>
param(
    [string]$AePath = "D:\Program Files\Adobe After Effects 2025\Support Files\AfterFX.com",
    [string]$TitleMatch = "HS_ProxyManager",
    [int]$LaunchBudgetSec = 90,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$here   = $PSScriptRoot
$script = Join-Path $here "screenshot.jsx"
$outPng = Join-Path $here "panel-screenshot.png"
$marker = Join-Path $env:TEMP "hs_pm_panel_up.txt"

if (-not (Test-Path $AePath)) { Write-Error "AfterFX.com not found at $AePath (pass -AePath)"; exit 2 }
$running = Get-Process AfterFX -ErrorAction SilentlyContinue
if ($running -and -not $Force) { Write-Error "AE already running; close it or pass -Force."; exit 2 }

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;using System.Text;using System.Runtime.InteropServices;
public class Win {
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint f);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; }
}
"@

function Find-PanelWindow([string]$match) {
    $found = New-Object System.Collections.ArrayList
    $cb = [Win+EnumProc]{
        param($h,$l)
        if ([Win]::IsWindowVisible($h)) {
            $len = [Win]::GetWindowTextLength($h)
            if ($len -gt 0) {
                $sb = New-Object System.Text.StringBuilder ($len+1)
                [void][Win]::GetWindowText($h, $sb, $sb.Capacity)
                $t = $sb.ToString()
                if ($t -like "*$match*") { [void]$found.Add([pscustomobject]@{H=$h; T=$t}) }
            }
        }
        return $true
    }
    [void][Win]::EnumWindows($cb, [IntPtr]::Zero)
    return $found
}

function Cleanup-AE {
    Get-Process AfterFX -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
    Get-Process AfterFX.com -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

Remove-Item $marker, $outPng -ErrorAction SilentlyContinue
Write-Host "Launching AE to build the panel..."
$proc = Start-Process -FilePath $AePath -ArgumentList @("-r", "`"$script`"") -PassThru -NoNewWindow

# Wait for the panel-up marker, but fail fast if AfterFX.exe never even starts
# (GPU/display contended by a fullscreen app).
$deadline = (Get-Date).AddSeconds($LaunchBudgetSec)
$exeSeen = $false
while ((Get-Date) -lt $deadline) {
    if (-not $exeSeen -and (Get-Process AfterFX -ErrorAction SilentlyContinue)) { $exeSeen = $true }
    if (Test-Path $marker) { break }
    Start-Sleep -Milliseconds 500
}
if (-not (Test-Path $marker)) {
    Cleanup-AE
    if (-not $exeSeen) {
        Write-Error "AfterFX.exe never started within ${LaunchBudgetSec}s -- AE.exe likely cannot init its GPU/display. Close any fullscreen GPU app (game/video) and retry."
    } else {
        Write-Error "Panel marker not seen within ${LaunchBudgetSec}s (AE started but the panel did not build)."
    }
    exit 1
}
Write-Host "Panel marker seen; waiting 6s for paint..."
Start-Sleep -Seconds 6

$wins = Find-PanelWindow $TitleMatch
if ($wins.Count -eq 0) { Cleanup-AE; Write-Error "Panel window '*$TitleMatch*' not found."; exit 1 }

$w = $wins[0]
Write-Host "Found panel window: '$($w.T)'"
try { [void][Win]::SetForegroundWindow($w.H); Start-Sleep -Milliseconds 600 } catch {}
$r = New-Object Win+RECT
[void][Win]::GetWindowRect($w.H, [ref]$r)
$width = $r.R - $r.L; $height = $r.B - $r.T
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $gfx.GetHdc()
$okp = [Win]::PrintWindow($w.H, $hdc, 2)   # 2 = PW_RENDERFULLCONTENT
$gfx.ReleaseHdc($hdc); $gfx.Dispose()
$bmp.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
Write-Host "PrintWindow ok=$okp -> $outPng (${width}x${height})"

# Close the dialog gracefully: WM_CLOSE (0x0010) -> show() returns -> jsx app.quit()
[void][Win]::PostMessage($w.H, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero)
if (-not $proc.WaitForExit(15000)) {
    Write-Warning "AE did not exit after WM_CLOSE; forcing."
    Cleanup-AE
}
Remove-Item $marker -ErrorAction SilentlyContinue
Write-Host "Done."
