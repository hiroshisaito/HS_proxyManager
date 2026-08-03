---
name: run-hs-proxymanager
description: Run, test, smoke-test, drive, or screenshot HS_proxyManager — the After Effects ExtendScript proxy panel. Launches AE 2025 headless via AfterFX.com -r, loads the real .jsx code, exercises its logic, and reports PASS/FAIL. Use when asked to run/test/verify/screenshot the script or check a change to proxy/path/pref/render logic.
---

# Run HS_proxyManager

`HS_proxyManager` is an Adobe After Effects **ScriptUI panel** written in
ExtendScript (Adobe's ES3 engine). It has **no build step** and cannot run
outside After Effects — there is no Node/browser path. The way to drive it
programmatically is to run a script **inside AE** via the console launcher
`AfterFX.com -r <script.jsx>`, which blocks until AE exits.

Almost every change in this repo touches **internal logic** — path resolution
(`normalizeProxyPathText`, `resolvePathFromProject`), preferences
(`loadRenderPref`/`savePref`), proxy folder management, and the aerender
command builder. So the primary harness is a **direct-invocation test runner**
([driver.jsx](.claude/skills/run-hs-proxymanager/driver.jsx)) that loads the
real source and asserts behavior in the real engine — not a UI clicker.

> All paths below are relative to the repo root (`<unit>` = this repo).
> The driver/wrapper live in `.claude/skills/run-hs-proxymanager/`.

## Prerequisites

- **Windows** with **After Effects 2025** installed. Tested with AE
  **25.6.5x3** at:
  `D:\Program Files\Adobe After Effects 2025\Support Files\AfterFX.com`
  (the `.com` console launcher — it blocks until AE exits; `.exe` does not).
  If AE is elsewhere, pass `-AePath "...\AfterFX.com"`.
- **PowerShell** (Windows PowerShell 5.1 is fine).
- No build, no package install. The `.jsx` files are interpreted by AE.

## Build

None. ExtendScript is interpreted inside AE. Do not "compile" anything.

## Run (agent path) — the test runner

From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\.claude\skills\run-hs-proxymanager\runner.ps1
```

What it does:
1. Verifies AE isn't already open (refuses otherwise — the driver quits AE on
   finish; pass `-Force` to override).
2. Runs `AfterFX.com -r driver.jsx`. The driver reads the real source files,
   **strips the `// ******** Main ********` ScriptUI bootstrap** (so no panel
   window is built) and `eval`s the rest at global scope, then runs ~59
   assertions over pure + DOM functions in the live AE engine, and
   `app.quit()`s cleanly.
3. Writes results to `.claude\skills\run-hs-proxymanager\last-run.log` and
   prints them. **Exit code 0 = all passed, 1 = failures/no result, 2 = setup.**

Cold start to full result is ~12–35 s. Expected tail:

```
DRIVER_DONE pass=59 fail=0
ALL TESTS PASSED
```

To add coverage, add `check(...)`/`ok(...)` lines in
[driver.jsx](.claude/skills/run-hs-proxymanager/driver.jsx). It already covers:
`trim`, `normalizePrefPath`, `normalizeProxyPathText`, `isAbsolutePath`,
`resolvePathFromProject`, `fixPSDLayers`, `templateExists`,
`projectProxyPrefFile`/`projectProxyPrefText`, `loadRenderPref`/`applyRenderPref`,
`quoteUnixArg`/`quoteWinArg`/`xmlEscape`, `osType`/`checkOSEncode`,
`getIndex`/`checkItemNameExists`, `loadPref`/`savePref`, `isProxyableItem`,
`isRenderableProxyItem`, `getCurrentProxyResolution`, `checkProxyFolder`,
`createFolderWithParents`, `removeFolderRecursive`, `checkProxyResFolder`.

### How direct invocation works (reuse this pattern)

The driver loads the production code **without running the UI** like this
(it cannot `#include` the main file, because that would build the panel and
also because `eval` of a string does not run the ExtendScript preprocessor):

```javascript
function readStrip(path, cutMain) {
    var f = new File(path); f.open("r"); var s = f.read(); f.close();
    if (cutMain) { var i = s.indexOf("// ******** Main ********"); if (i>=0) s = s.substring(0,i); }
    return s.replace(/^[ \t]*#.*$/mg, "");   // drop #include / #includepath lines
}
var ROOT = new File($.fileName).parent.parent.parent.parent; // -> repo root
eval(                                                        // top-level eval = global scope
    readStrip(ROOT.fsName + "/(includes)/HS_util.jsx", false) + "\n" +
    readStrip(ROOT.fsName + "/(includes)/HS_renderCore.jsx", false) + "\n" +
    readStrip(ROOT.fsName + "/HS_proxyManager.jsx", true));
hs_proxyManager.folderName = "(_HS_proxy_)";  // normally set by the stripped Main block
```

## Screenshot the real panel

To capture the actual ScriptUI panel (built via the real
`hs_proxyManager.buildUIPanel`):

```powershell
powershell -ExecutionPolicy Bypass -File .\.claude\skills\run-hs-proxymanager\screenshot.ps1
```

It launches AE, builds the panel inside a **modal `dialog`** (a modeless
`palette` is destroyed the instant the `-r` script ends, so it can't be
captured), finds the window titled `HS_ProxyManager*`, captures it with
`PrintWindow` (flag `PW_RENDERFULLCONTENT` — works even when occluded), then
sends `WM_CLOSE` so the script `app.quit()`s **cleanly**. Output:
`panel-screenshot.png` next to the script. See
[panel-screenshot.png](.claude/skills/run-hs-proxymanager/panel-screenshot.png).

## Run (human path) — load the panel in AE

This is the real end-user flow (not automated):
1. Copy the repo's `HS_proxyManager.jsx` **and** the `(includes)` folder into
   AE's `Scripts/ScriptUI Panels` folder
   (`...\Adobe After Effects 2025\Support Files\Scripts\ScriptUI Panels\`).
2. Import the render templates: **Edit > Templates > Render Settings… >
   Import…** → select `HS_proxyManager.ars` (must provide `[HS_PROXY_1/1]`..
   `[HS_PROXY_1/4]`).
3. Restart AE → **Window > HS_proxyManager.jsx** to dock the panel.
Useless headless; needs an interactive AE session.

## Gotchas (battle scars from this container)

- **A fullscreen GPU app blocks AE entirely.** While a game/video owns the
  display (observed: "Endzone"), `AfterFX.exe` fails its GPU init
  (`*** GPU Warning: GPU3 failed sanity test ***`) and dies on launch — only
  `AfterFX.com` lingers and the run hangs. `runner.ps1`/`screenshot.ps1`
  fast-abort when `AfterFX.exe` never appears. **Close fullscreen GPU apps
  first.**
- **Never force-kill AE while a modal dialog is open.** It leaves AE thinking
  it crashed, so the *next* launch shows a recovery dialog that blocks `-r`
  forever (every run then times out at 240 s). The wrappers avoid this:
  the driver `app.quit()`s itself; the screenshot wrapper closes the dialog
  with `WM_CLOSE` so the script can `app.quit()` cleanly. If you ever hit the
  recovery state, you must dismiss that dialog interactively.
- **`File.name` / `Folder.name` URI-encode spaces as `%20`** (e.g.
  `"My Project.aep"` → `"My%20Project.aep"`). The proxy folder name is built
  from `projectFile.name`, so it carries `%20`; use `.fsName` / `.displayName`
  for decoded paths. (Pinned by a driver test.)
- **`eval` of a string does NOT run the `#include`/`#includepath` preprocessor**
  — those lines must be stripped or you get a syntax error. Load includes
  yourself.
- **Top-level `eval` defines globals; `eval` inside a function does not** (ES3
  function-scoped `var`). The loader must `eval` at script top level.
- **Use `AfterFX.com`, not `AfterFX.exe`, for automation** — `.com` is the
  console launcher that blocks until AE exits and returns an exit code; `.exe`
  returns immediately.
- **The bootstrap props aren't set when you strip Main.** After loading, set
  `hs_proxyManager.folderName` (and `version`, `prefFile`, `defaultProxyPath`
  for the panel) yourself.
- **Locale matters for encoding tests.** This host is `$.locale === "ja_JP"`,
  so `checkOSEncode()` returns `"CP932"` (it's `"ASCII"` on non-JP Windows).
- **Benign launch noise:** `GPU3 ... sanity test`, `Prefs [...] items found`,
  and `asio ... connection ... refused` lines always print; ignore them.

## Troubleshooting

| Symptom | Cause → Fix |
|---|---|
| Run hangs ~240 s, "No result file produced" | A fullscreen GPU app is blocking AE, **or** AE is stuck on a crash-recovery dialog. Close the fullscreen app; if recovery dialog, dismiss it interactively. Then `Get-Process AfterFX* | Stop-Process -Force` and retry. |
| "After Effects is already running" | Real AE session open (driver would quit it). Close AE, or pass `-Force`. |
| Only `AfterFX.com` in process list, no `AfterFX.exe` | AE.exe died on launch (GPU/display contended). Free the GPU and retry. |
| screenshot.ps1: "AfterFX.exe never started" | Same GPU-contention abort. Close fullscreen apps. |
| A driver test FAILs after editing code | Read `last-run.log`; each FAIL prints `expected=[...] actual=[...]`. |
| Wrong AE path | Pass `-AePath "C:\...\AfterFX.com"`; the wrappers also auto-search Program Files. |
