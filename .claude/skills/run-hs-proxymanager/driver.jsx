/* ============================================================================
 * HS_proxyManager driver / smoke-test  (ExtendScript, runs INSIDE After Effects)
 *
 * Launched headless by runner.ps1 via:  AfterFX.com -r driver.jsx
 *
 * What it does:
 *   1. Loads the REAL project source (HS_util / HS_renderCore / HS_proxyManager)
 *      WITHOUT running the ScriptUI bootstrap (the "// ******** Main ********"
 *      block that builds the panel is stripped, so no window is created).
 *   2. Exercises the internal logic in the real AE ES3 engine:
 *        - pure path / pref / quoting functions (deterministic)
 *        - DOM-dependent helpers (project items, folder create/remove)
 *   3. Writes "PASS|FAIL" lines + a summary to the result file named by the
 *      HS_DRIVER_OUT env var (fallback: <temp>/hs_pm_driver_result.txt) and
 *      echoes the same to the console (captured by AfterFX.com).
 *   4. Closes the project WITHOUT saving and quits AE, so the run never hangs
 *      on a "Save changes?" dialog.
 *
 * It deliberately does NOT touch the user's projects: it only adds throwaway
 * items to the launch-time untitled project and writes folders under <temp>.
 * ==========================================================================*/

(function () {

    // ---- result sink ---------------------------------------------------------
    var outPath = null;
    try { outPath = $.getenv("HS_DRIVER_OUT"); } catch (e) { outPath = null; }
    if (!outPath || outPath === "") {
        outPath = Folder.temp.fsName + "/hs_pm_driver_result.txt";
    }
    var lines = [];
    var pass = 0, fail = 0;

    function S(v) {
        if (v === null) { return "(null)"; }
        if (v === undefined) { return "(undef)"; }
        return String(v);
    }
    function log(s) { lines.push(s); try { $.writeln(s); } catch (e) {} }
    function check(name, actual, expected) {
        var ok = (S(actual) === S(expected));
        if (ok) { pass++; } else { fail++; }
        log((ok ? "PASS" : "FAIL") + " | " + name +
            (ok ? "" : ("  | expected=[" + S(expected) + "] actual=[" + S(actual) + "]")));
    }
    function ok(name, cond) { check(name, !!cond, true); }

    function flush(extra) {
        var f = new File(outPath);
        f.encoding = "UTF-8";
        f.open("w");
        f.write("HS_proxyManager driver result\n");
        f.write("ae_version=" + app.version + "  locale=" + $.locale + "  os=" + $.os + "\n");
        if (extra) { f.write(extra + "\n"); }
        f.write("----\n");
        f.write(lines.join("\n") + "\n");
        f.write("----\n");
        f.write("DRIVER_DONE pass=" + pass + " fail=" + fail + "\n");
        f.close();
        log("DRIVER_DONE pass=" + pass + " fail=" + fail);
    }

    function safeQuit() {
        try { app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES); } catch (e) {}
        try { app.quit(); } catch (e) {}
    }

    // ---- load source without the UI bootstrap -------------------------------
    function readStrip(path, cutMain) {
        var f = new File(path);
        if (!f.exists) { throw new Error("source not found: " + path); }
        f.open("r"); var s = f.read(); f.close();
        if (cutMain) {
            var i = s.indexOf("// ******** Main ********");
            if (i >= 0) { s = s.substring(0, i); }
        }
        // strip preprocessor directives (#include / #includepath) -- eval() of a
        // string does not run the ExtendScript preprocessor, so these would be
        // syntax errors. We load the includes ourselves below.
        s = s.replace(/^[ \t]*#.*$/mg, "");
        return s;
    }

    var ROOT;
    try {
        // driver.jsx lives at <repo>/.claude/skills/run-hs-proxymanager/driver.jsx
        ROOT = new File($.fileName).parent.parent.parent.parent;  // -> <repo>
        var combined =
            readStrip(ROOT.fsName + "/(includes)/HS_util.jsx", false) + "\n" +
            readStrip(ROOT.fsName + "/(includes)/HS_renderCore.jsx", false) + "\n" +
            readStrip(ROOT.fsName + "/HS_proxyManager.jsx", true);
        eval(combined);   // top-level eval -> defines globals hsUtil / hs_renderCore / hs_proxyManager
    } catch (e) {
        log("FATAL load error: " + e.toString());
        fail++;
        flush("LOAD FAILED from root=" + (ROOT ? ROOT.fsName : "?"));
        safeQuit();
        return;
    }

    if (typeof hs_proxyManager === "undefined" || typeof hsUtil === "undefined" || typeof hs_renderCore === "undefined") {
        log("FATAL: globals not defined after eval (hs_proxyManager/hsUtil/hs_renderCore)");
        fail++;
        flush("EVAL SCOPE PROBLEM");
        safeQuit();
        return;
    }

    // values normally set by the stripped Main block:
    hs_proxyManager.folderName = "(_HS_proxy_)";
    hs_proxyManager.version = "driver-test";

    // ---- the tests ----------------------------------------------------------
    try {
        log("== loaded src from " + ROOT.fsName + " ==");

        // --- pure: trim / normalizePrefPath ---
        check("trim trims both ends", hs_proxyManager.trim("  hello  "), "hello");
        check("normalizePrefPath(null)", hs_proxyManager.normalizePrefPath(null), null);
        check("normalizePrefPath('')", hs_proxyManager.normalizePrefPath(""), null);
        check("normalizePrefPath('null')", hs_proxyManager.normalizePrefPath("null"), null);
        check("normalizePrefPath('  abc  ')", hs_proxyManager.normalizePrefPath("  abc  "), "abc");

        // --- pure: normalizeProxyPathText ---
        check("npp backslashes->slashes", hs_proxyManager.normalizeProxyPathText("C:\\Temp\\Proxy"), "C:/Temp/Proxy");
        check("npp collapse + trailing", hs_proxyManager.normalizeProxyPathText("C:/a//b/"), "C:/a/b");
        check("npp UNC preserved", hs_proxyManager.normalizeProxyPathText("\\\\srv\\share\\"), "//srv/share");
        check("npp drive root kept", hs_proxyManager.normalizeProxyPathText("C:\\"), "C:/");
        check("npp '.' -> null", hs_proxyManager.normalizeProxyPathText("."), null);
        check("npp same-as-project -> null", hs_proxyManager.normalizeProxyPathText("./(Same as project file.)"), null);

        // --- pure: isAbsolutePath ---
        ok("abs drive backslash", hs_proxyManager.isAbsolutePath("C:\\x"));
        ok("abs drive slash", hs_proxyManager.isAbsolutePath("C:/x"));
        ok("abs UNC", hs_proxyManager.isAbsolutePath("\\\\srv\\share"));
        ok("abs posix", hs_proxyManager.isAbsolutePath("/abs/x"));
        check("abs './rel' false", hs_proxyManager.isAbsolutePath("./rel"), false);
        check("abs 'rel' false", hs_proxyManager.isAbsolutePath("rel"), false);

        // --- pure: resolvePathFromProject ---
        var pr = new Folder("D:/tmp/hs_proj");
        check("resolve null -> project root", hs_proxyManager.resolvePathFromProject(null, pr), pr.fsName);
        check("resolve absolute passthrough", hs_proxyManager.resolvePathFromProject("D:/abs/out", pr), "D:/abs/out");
        check("resolve relative joins", hs_proxyManager.resolvePathFromProject("sub/dir", pr), pr.fsName + "/sub/dir");
        check("resolve same-as-project -> root", hs_proxyManager.resolvePathFromProject("./(Same as project file.)", pr), pr.fsName);

        // --- pure: fixPSDLayers / templateExists ---
        check("fixPSDLayers slash->dash", hs_proxyManager.fixPSDLayers("a/b/c"), "a-b-c");
        check("fixPSDLayers plain", hs_proxyManager.fixPSDLayers("plain"), "plain");
        ok("templateExists hit", hs_proxyManager.templateExists(["[HS_PROXY_1/1]", "[HS_PROXY_1/2]"], "[HS_PROXY_1/2]"));
        check("templateExists miss", hs_proxyManager.templateExists(["[HS_PROXY_1/1]"], "[NOPE]"), false);

        // GOTCHA: ExtendScript File/Folder .name URI-encodes spaces (%20).
        // The production code uses projectFile.name, so the proxy folder name
        // carries that encoding; .fsName / .displayName decode it. We use a
        // space-free name here for a crisp format assertion, plus one explicit
        // test pinning the %20 behavior.
        check("File.name URI-encodes spaces", new File("D:/t/A B.aep").name, "A%20B.aep");

        // --- pure: projectProxyPrefFile / projectProxyPrefText ---
        var pf = new File("D:/tmp/hs_proj/MyProject.aep");
        var expPrefFile = new File(pf.parent.fsName + "/" + pf.name + ".proxy");
        check("projectProxyPrefFile path", hs_proxyManager.projectProxyPrefFile(pf).fsName, expPrefFile.fsName);
        check("prefText 3-arg null root", hs_proxyManager.projectProxyPrefText(pf, new Folder("D:/x"), null),
              "(_HS_proxy_)/(MyProject.aep)");
        check("prefText 3-arg relative root", hs_proxyManager.projectProxyPrefText(pf, new Folder("D:/x"), "sub"),
              "sub/(_HS_proxy_)/(MyProject.aep)");
        var absOut = new Folder("D:/abs/out");
        check("prefText 3-arg absolute root -> folder", hs_proxyManager.projectProxyPrefText(pf, absOut, "D:/abs/parent"),
              hs_proxyManager.normalizeProxyPathText(absOut.fsName));
        check("prefText 2-arg -> folder", hs_proxyManager.projectProxyPrefText(pf, absOut),
              hs_proxyManager.normalizeProxyPathText(absOut.fsName));

        // --- renderCore: quoting / escaping ---
        check("quoteUnixArg plain", hs_renderCore.quoteUnixArg("plain"), "'plain'");
        check("quoteUnixArg apostrophe", hs_renderCore.quoteUnixArg("it's"), "'it'\\''s'");
        check("quoteWinArg spaces", hs_renderCore.quoteWinArg("a b"), '"a b"');
        check("quoteWinArg percent", hs_renderCore.quoteWinArg("50%"), '"50%%"');
        check("xmlEscape angles/amp", hs_renderCore.xmlEscape("a<b>&c"), "a&lt;b&gt;&amp;c");
        check("xmlEscape quotes", hs_renderCore.xmlEscape('"q"'), "&quot;q&quot;");

        // --- util: osType / checkOSEncode (environment-dependent) ---
        check("osType is Win (this host)", hsUtil.osType(), "Win");
        check("checkOSEncode CP932 (Win+ja_JP)", hsUtil.checkOSEncode(), "CP932");

        // --- util: loadRenderPref / applyRenderPref (file round-trip) ---
        var prefF = new File(Folder.temp.fsName + "/hs_pm_renderpref.txt");
        prefF.open("w"); prefF.write("sound = true;\nnotrend = false;\nom = 3;\n"); prefF.close();
        var rp = hs_proxyManager.loadRenderPref(prefF);
        check("loadRenderPref sound", rp.sound, true);
        check("loadRenderPref notrend", rp.notrend, false);
        check("loadRenderPref om", rp.om, 3);
        var settings = { sound: false, notrend: true, om: 0 };
        hs_proxyManager.applyRenderPref(rp, settings);
        check("applyRenderPref merges sound", settings.sound, true);
        check("applyRenderPref merges om", settings.om, 3);
        prefF.remove();

        // --- util: savePref / loadPref round-trip ---
        var spFile = new File(Folder.temp.fsName + "/hs_pm_savepref.txt");
        var saved = hsUtil.savePref(spFile, Folder.temp, "HELLO=世界");
        ok("savePref returns File", saved !== null);
        check("loadPref reads back", hsUtil.loadPref(spFile), "HELLO=世界");
        spFile.remove();

        // --- DOM: items / isProxyableItem / getIndex / checkItemNameExists ---
        var comp = app.project.items.addComp("HS_DRIVER_COMP", 100, 100, 1.0, 1.0, 24);
        ok("isProxyableItem(comp)", hs_proxyManager.isProxyableItem(comp));
        ok("isRenderableProxyItem(comp)", hs_proxyManager.isRenderableProxyItem(comp));
        var fld = app.project.items.addFolder("HS_DRIVER_FOLDER");
        check("isProxyableItem(folder) false", hs_proxyManager.isProxyableItem(fld), false);
        ok("getIndex finds comp", hsUtil.getIndex("HS_DRIVER_COMP") >= 1);
        check("checkItemNameExists uniquifies", hsUtil.checkItemNameExists("HS_DRIVER_COMP"), "HS_DRIVER_COMP_1");
        check("checkItemNameExists passthrough", hsUtil.checkItemNameExists("HS_NoSuchItem_zzz"), "HS_NoSuchItem_zzz");
        check("getCurrentProxyResolution(no proxy) null", hs_proxyManager.getCurrentProxyResolution(comp), null);

        // --- DOM: checkProxyFolder with no saved project -> null ---
        check("checkProxyFolder(untitled) null", hs_proxyManager.checkProxyFolder("D:/x", true), null);

        // --- DOM: createFolderWithParents / removeFolderRecursive ---
        var testRoot = new Folder(Folder.temp.fsName + "/hs_pm_test_" + comp.id);
        var deep = new Folder(testRoot.fsName + "/a/b/c");
        ok("createFolderWithParents returns true", hs_proxyManager.createFolderWithParents(deep));
        ok("createFolderWithParents made dir", deep.exists);
        ok("removeFolderRecursive returns true", hs_proxyManager.removeFolderRecursive(testRoot));
        check("removeFolderRecursive removed dir", testRoot.exists, false);

        // --- DOM: checkProxyResFolder ---
        var resRoot = new Folder(Folder.temp.fsName + "/hs_pm_test2_" + comp.id);
        var resF = hs_proxyManager.checkProxyResFolder(resRoot.fsName + "/x");
        ok("checkProxyResFolder returns folder", resF !== null && resF.exists);
        hs_proxyManager.removeFolderRecursive(resRoot);

    } catch (e) {
        log("EXCEPTION during tests: " + e.toString() + (e.line ? (" @line " + e.line) : ""));
        fail++;
    }

    flush(null);
    safeQuit();
})();
