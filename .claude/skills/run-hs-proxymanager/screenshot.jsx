/* ============================================================================
 * HS_proxyManager screenshot helper (ExtendScript, runs INSIDE After Effects)
 *
 * Builds the REAL ScriptUI panel via hs_proxyManager.buildUIPanel() inside a
 * floating window and shows it, so screenshot.ps1 can capture the desktop.
 * It does NOT quit AE (the window must stay on screen); screenshot.ps1 kills
 * AfterFX after capturing.
 *
 * Launched by screenshot.ps1:  Start-Process AfterFX.com -r screenshot.jsx
 * ==========================================================================*/

(function () {
    function readStrip(path, cutMain) {
        var f = new File(path);
        f.open("r"); var s = f.read(); f.close();
        if (cutMain) {
            var i = s.indexOf("// ******** Main ********");
            if (i >= 0) { s = s.substring(0, i); }
        }
        s = s.replace(/^[ \t]*#.*$/mg, "");
        return s;
    }

    var ROOT = new File($.fileName).parent.parent.parent.parent;  // -> <repo>
    var combined =
        readStrip(ROOT.fsName + "/(includes)/HS_util.jsx", false) + "\n" +
        readStrip(ROOT.fsName + "/(includes)/HS_renderCore.jsx", false) + "\n" +
        readStrip(ROOT.fsName + "/HS_proxyManager.jsx", true);
    eval(combined);

    // values the bootstrap normally sets:
    hs_proxyManager.version = "demo";
    hs_proxyManager.folderName = "(_HS_proxy_)";
    hs_proxyManager.prefFolder = Folder.temp;
    hs_proxyManager.prefFile = new File(Folder.temp.fsName + "/hs_demo.pref");
    hs_proxyManager.defaultProxyPath = new File(Folder.temp.fsName + "/hs_demo.proxy");

    // Build the real panel into a window sized to hold its controls.
    // Use a modal "dialog": show() BLOCKS, so the window stays on screen and the
    // script stays alive until screenshot.ps1 kills AfterFX. (A modeless
    // "palette" is destroyed the instant the -r script ends, so it can't be
    // captured.)
    var win = new Window("dialog", "HS_ProxyManager " + hs_proxyManager.version, undefined);
    hs_proxyManager.buildUIPanel(win);
    // Panel controls span x:5..380, y:5..310. ScriptUI shrink-fits a window with
    // absolute-positioned children, so pin BOTH preferredSize and bounds wide
    // enough that nothing clips on the right/bottom.
    // Display is high-DPI (~1.5x): children lay out at scaled pixels, so the
    // window client must be ~1.5x the logical extent (380x320) to avoid clipping.
    win.preferredSize = [600, 510];
    win.bounds = [50, 40, 50 + 600, 40 + 510];

    // marker so the PS wrapper knows the panel is up (written before the
    // blocking show()).
    var mk = new File(Folder.temp.fsName + "/hs_pm_panel_up.txt");
    mk.open("w"); mk.write("up\n"); mk.close();

    win.center();
    win.show();   // blocks until the wrapper sends WM_CLOSE to this dialog
    // After the dialog closes, quit AE CLEANLY so the next launch does not show
    // a crash-recovery dialog (force-killing AE mid-dialog corrupts that state).
    app.quit();
})();
