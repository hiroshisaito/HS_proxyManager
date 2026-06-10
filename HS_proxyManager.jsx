/* ********
MIT License
Copyright (c) 2025 Hiroshi Saito

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
******** */

#includepath "./(includes)"
#include "HS_util.jsx"
#include "HS_render.jsx"
#include "HS_renderCore.jsx"

var hs_proxyManager = new Object();

// ******** Methods ********

hs_proxyManager.trim = function(str) {
    return str.toString().replace(/^\s+|\s+$/g, "");
}



hs_proxyManager.normalizePrefPath = function(pathText) {
    if(pathText === undefined || pathText === null) { return null; }

    pathText = hs_proxyManager.trim(pathText);

    if(pathText === "" || pathText === "null") { return null; }

    return pathText;
}



hs_proxyManager.sameAsProjectProxyText = "./(Same as project file.)";



hs_proxyManager.normalizeProxyPathText = function(pathText) {
    pathText = hs_proxyManager.normalizePrefPath(pathText);

    if(pathText === null || pathText === hs_proxyManager.sameAsProjectProxyText) { return null; }

    pathText = pathText.replace(/\\/g, "/");

    if(pathText === "." || pathText === "./") { return null; }

    return pathText;
}



hs_proxyManager.isAbsolutePath = function(pathText) {
    pathText = hs_proxyManager.normalizeProxyPathText(pathText);

    if(pathText === null) { return false; }
    if(pathText.match(/^[A-Za-z]:\//) !== null) { return true; }
    if(pathText.indexOf("/") === 0) { return true; }

    return false;
}



hs_proxyManager.resolvePathFromProject = function(pathText, projectRoot) {
    pathText = hs_proxyManager.normalizeProxyPathText(pathText);

    if(pathText === null) { return projectRoot.fsName; }
    if(hs_proxyManager.isAbsolutePath(pathText)) { return pathText; }

    return projectRoot.fsName + "/" + pathText;
}



hs_proxyManager.loadRenderPref = function(prefFile) {
    var pref = new Object();
    pref.sound = null;
    pref.notrend = null;
    pref.om = null;

    var prefTxt = hsUtil.loadPref(prefFile);

    if(prefTxt === null) { return pref; }

    var prefLines = prefTxt.split(/\r\n|\r|\n/);

    for(var i = 0; i < prefLines.length; i++) {
        var prefLine = prefLines[i];
        var eqIndex = prefLine.indexOf("=");

        if(eqIndex < 0) { continue; }

        var key = hs_proxyManager.trim(prefLine.substring(0, eqIndex));
        var value = hs_proxyManager.trim(prefLine.substring(eqIndex + 1)).replace(/;$/, "");

        if(key === "sound") {
            pref.sound = (value === "true");
        } else if(key === "notrend") {
            pref.notrend = (value === "true");
        } else if(key === "om") {
            var omIndex = parseInt(value, 10);
            if(!isNaN(omIndex)) { pref.om = omIndex; }
        }
    }

    return pref;
}



hs_proxyManager.applyRenderPref = function(pref, settings) {
    if(pref.sound !== null) { settings.sound = pref.sound; }
    if(pref.notrend !== null) { settings.notrend = pref.notrend; }
    if(pref.om !== null) { settings.om = pref.om; }
    return settings;
}



hs_proxyManager.isProxyableItem = function(item) {
    try {
        return (item instanceof CompItem || item.mainSource instanceof FileSource);
    } catch(e) {
        return false;
    }
}



hs_proxyManager.isRenderableProxyItem = function(item) {
    try {
        return (item instanceof CompItem || (item.mainSource instanceof FileSource && item.width > 0));
    } catch(e) {
        return false;
    }
}



hs_proxyManager.projectProxyPrefFile = function(projectFile) {
    return new File(projectFile.parent.fsName + "/" + projectFile.name + ".proxy");
}



hs_proxyManager.projectProxyPrefText = function(projectFile, proxyFolder, proxyRootPath) {
    if(arguments.length >= 3) {
        proxyRootPath = hs_proxyManager.normalizeProxyPathText(proxyRootPath);
        var projectProxyFolderName = "(" + projectFile.name +")";

        if(proxyRootPath === null) {
            return hs_proxyManager.folderName + "/" + projectProxyFolderName;
        }

        if(!hs_proxyManager.isAbsolutePath(proxyRootPath)) {
            return proxyRootPath + "/" + hs_proxyManager.folderName + "/" + projectProxyFolderName;
        }
    }

    return hs_proxyManager.normalizeProxyPathText(proxyFolder.fsName);
}



hs_proxyManager.saveProjectProxyPref = function(projectFile, proxyFolder, proxyRootPath) {
    var currentProjectProxyPref = hs_proxyManager.projectProxyPrefFile(projectFile);
    return hsUtil.savePref(currentProjectProxyPref, projectFile.parent, hs_proxyManager.projectProxyPrefText(projectFile, proxyFolder, proxyRootPath));
}



hs_proxyManager.templateExists = function(templateList, templateName) {
    for(var i = 0; i < templateList.length; i++){
        if(templateList[i].toString() === templateName) { return true; }
    }
    return false;
}



hs_proxyManager.createFolderWithParents = function(folder) {
    if(folder.exists) { return true; }

    if(folder.parent !== null && folder.parent.fsName !== folder.fsName && !folder.parent.exists) {
        if(!hs_proxyManager.createFolderWithParents(folder.parent)) { return false; }
    }

    try {
        return (folder.create() || folder.exists);
    } catch(e) {
        return false;
    }
}


// hs_proxyManager.checkProxyFolder(path)
// Resolve the proxy root folder for the current project.
// Returns a Folder object.
//
// Arguments:
// path: Proxy root path. Relative paths start from the AEP folder. (string)
// onlycheck: If true, do not create missing folders. (Boolean)
// useCurrentFile: If true, prefer the current project's .proxy file. (Boolean)

hs_proxyManager.checkProxyFolder = function(path, onlycheck, useCurrentFile){
    if(app.project.file !== null){

        var projectRoot = app.project.file.parent;
        var projectProxyFolderName = "(" + app.project.file.name +")";
        var proxyRootPath;
        var proxyRoot =null;


        // Project proxy setting file.
        var projectProxySettingFile = new File(projectRoot.fsName + "/" + app.project.file.name + ".proxy");

        // Resolve the proxy root in this order:
        //  1. Current project's .proxy file.
        //  2. Default path from preferences.
        //  3. Project folder.

        if(projectProxySettingFile.exists && (useCurrentFile)){
            proxyRootPath = hs_proxyManager.normalizeProxyPathText(hsUtil.loadPref(projectProxySettingFile));
            if(proxyRootPath !== null) {
                proxyRoot = new Folder(hs_proxyManager.resolvePathFromProject(proxyRootPath, projectRoot));
            }
        }

        path = hs_proxyManager.normalizeProxyPathText(path);

        if(proxyRoot === null && path !== null) {
            proxyRoot = new Folder(hs_proxyManager.resolvePathFromProject(path, projectRoot) + "/" +  hs_proxyManager.folderName + "/" + projectProxyFolderName);
        } else if(proxyRoot === null) {
            proxyRoot = new Folder(projectRoot.fsName + "/" +  hs_proxyManager.folderName + "/" + projectProxyFolderName);
        }

        if(proxyRoot.exists){

            return proxyRoot;

        } else {


            if(onlycheck === undefined || onlycheck === null || onlycheck === false){

                var created = hs_proxyManager.createFolderWithParents(proxyRoot);

                if(!created || !proxyRoot.exists){
                    alert("Could not create proxy folder:\n" + proxyRoot.fsName);
                    return null;
                }
                return proxyRoot;

            }

            return null;
        }

    } else {
        return null;
    }
}



// Returns a unique Folder path based on pFolderName.

hs_proxyManager.chkFolderNameExists = function(folder, pFolderName){
    if(!folder.exists) {
		return folder;
	} else {
		for(var exNum = 1; (Folder(folder.parent.fsName+"/"+pFolderName+"_"+exNum).exists); exNum++) {};
		var newPFolder = new Folder(folder.parent.fsName+"/"+pFolderName+"_"+exNum);
        return newPFolder;
	}
}



// hs_proxyManager.checkProxyResFolder(path)
// Ensure a proxy subfolder exists.

hs_proxyManager.checkProxyResFolder= function(path) {

    var proxyResFolder = new Folder(path);

    if(!proxyResFolder.exists){
        var created = hs_proxyManager.createFolderWithParents(proxyResFolder);
        if(!created || !proxyResFolder.exists){
            alert("Could not create proxy folder:\n" + proxyResFolder.fsName);
            return null;
        }
    }
    return proxyResFolder;
}



hs_proxyManager.removeFolderRecursive = function(folder) {
    if(folder === null || !folder.exists) { return true; }

    var folderItems = folder.getFiles();
    for(var i = 0; i < folderItems.length; i++){
        if(folderItems[i] instanceof Folder){
            if(!hs_proxyManager.removeFolderRecursive(folderItems[i])) { return false; }
        } else if(folderItems[i] instanceof File) {
            if(!folderItems[i].remove()) { return false; }
        }
    }

    return folder.remove();
}



// Remove a proxy resolution folder.

hs_proxyManager.removeResolutionFolder = function(path) {

    var resolutionFolder = new Folder(path);

    if(resolutionFolder.exists){
        if(!hs_proxyManager.removeFolderRecursive(resolutionFolder)){
            alert("Could not remove proxy folder:\n" + resolutionFolder.fsName);
            return false;
        }
    }
    return true;
}



// Apply an alpha interpretation mode to a proxy source.
// alpha: 0=Auto, 1=Straight, 2=Premultiplied, 3=Ignore
hs_proxyManager.applyAlphaMode = function(proxySource, alpha){
    if(proxySource === null || !proxySource.hasAlpha){ return; }
    if (alpha === 0) { proxySource.guessAlphaMode(); }
    else if (alpha === 1) { proxySource.alphaMode = AlphaMode.STRAIGHT; }
    else if (alpha === 2) { proxySource.alphaMode = AlphaMode.PREMULTIPLIED; }
    else if (alpha === 3) { proxySource.alphaMode = AlphaMode.IGNORE; }
}


hs_proxyManager.applyProxyFrameRate = function(curItem){
    if(curItem.proxySource === null) { return; }

    if(curItem instanceof CompItem){
        curItem.proxySource.conformFrameRate = curItem.frameRate;
    } else if(curItem.mainSource instanceof FileSource && !curItem.mainSource.isStill) {
        curItem.proxySource.conformFrameRate = curItem.mainSource.displayFrameRate;
    }
}


hs_proxyManager.changeProxyAlphaMode = function(alpha){

    for(var i=0,itemsLength=app.project.selection.length ;i<itemsLength;i++){

       var curItem = app.project.selection[i];

       if(hs_proxyManager.isProxyableItem(curItem) && curItem.proxySource !== null){
            hs_proxyManager.applyAlphaMode(curItem.proxySource, alpha);
       }
    }

    return;
}




hs_proxyManager.fixPSDLayers = function(layerName) {
    var fixedName = layerName;
    if(layerName.match(/\//g) !== null) { fixedName = layerName.replace(/\//g, "-") };
    return fixedName;

}



// hs_proxyManager.setProxy(val, alpha, path)
//
// Arguments:
//
// val: Proxy resolution (Int)
//      1: 100%
//      2: 50%
//      3: 33%
//      4: 25%
//
// alpha: Alpha mode. (Int)
//      0:guessAlphaMode()
//      1:AlphaMode.STRAIGHT
//      2:AlphaMode.PREMULTIPLIED
//      3:AlphaMode.IGNORE
//
// path: Proxy folder path. (string)
// applyAll: If true, apply to every proxyable project item. (Boolean)
//

hs_proxyManager.setProxy = function(val, alpha, path, applyAll){

    var proxyFolderItems;
    var proxyRootFolder = null;

    applyAll = (applyAll === true);

    if(val !== 0){
        proxyRootFolder = hs_proxyManager.checkProxyFolder(path, true, true);
        if(proxyRootFolder){
            proxyFolderItems = Folder(proxyRootFolder.fsName).getFiles();
        } else {
            proxyFolderItems = null;
        }

        if(proxyFolderItems === null){
            return;
        }
    }

    for(var i=1, itemsLength =app.project.numItems ;i<=itemsLength; i++){

        var curItem = app.project.item(i);

        if((applyAll || curItem.selected) && hs_proxyManager.isProxyableItem(curItem)){
            if(val === 0){ curItem.setProxyToNone(); continue; }

            var itemProxyFolder = Folder(proxyRootFolder.fsName + "/"+ curItem.id);

            if(itemProxyFolder.exists){

                var proxyResFolder = Folder(itemProxyFolder.fsName+"/"+val);

                if(!proxyResFolder.exists) { continue; }

                var proxyFolderItems = proxyResFolder.getFiles();
                var proxyFiles = new Array();

                for(var pf = 0; pf < proxyFolderItems.length; pf++){
                    if(proxyFolderItems[pf] instanceof File && proxyFolderItems[pf].name.match(/^(\.DS_Store|Thumbs\.db|desktop\.ini)$/i)){
                        proxyFolderItems[pf].remove();
                    } else if(proxyFolderItems[pf] instanceof File) {
                        proxyFiles.push(proxyFolderItems[pf]);
                    }
                }

                proxyFiles.sort(function(a, b) {
                    var aName = a.name.toLowerCase();
                    var bName = b.name.toLowerCase();
                    if(aName < bName) { return -1; }
                    if(aName > bName) { return 1; }
                    return 0;
                });

                if(proxyFiles.length > 1) {
                    // Set proxy.

                    curItem.setProxyWithSequence(File(proxyFiles[0]),false);

                    // Match frame rate.
                    hs_proxyManager.applyProxyFrameRate(curItem);

                    // Set alpha mode when available.
                    hs_proxyManager.applyAlphaMode(curItem.proxySource, alpha);



                } else if(proxyFiles.length === 1){
                    // Set proxy.
                    curItem.setProxy(File(proxyFiles[0]));

                    // Match frame rate.
                    hs_proxyManager.applyProxyFrameRate(curItem);

                    // Set alpha mode when available.

                    hs_proxyManager.applyAlphaMode(curItem.proxySource, alpha);


                } else {
                    ;
                }
            }


        }
    }
    return;
}


// Rendering dialog.
// Sets the output module and render options.
//
// hs_proxyManager.proxyRender(outputFolder, usound, uom, unotrend)
// Arguments:
// outputFolder: Proxy root folder. (Folder)
// usound: Enable audio. (Boolean)
// uom: Default output module index. (Int)
// unotrend: Save the render project without starting aerender. (Boolean)

hs_proxyManager.proxyRender = function(outputFolder, usound, uom, unotrend) {

    if(app.project.renderQueue.numItems < 1){
        alert("No items are in the render queue.");
        return false;
    }

    var rqOMT = app.project.renderQueue.item(1).outputModule(1).templates;
    var rqTemplates = app.project.renderQueue.item(1).templates;
    var requiredProxyTemplates = ["[HS_PROXY_1/1]", "[HS_PROXY_1/2]", "[HS_PROXY_1/3]", "[HS_PROXY_1/4]"];

    for(var rt = 0; rt < requiredProxyTemplates.length; rt++){
        if(!hs_proxyManager.templateExists(rqTemplates, requiredProxyTemplates[rt])){
            alert("Missing render settings template:\n" + requiredProxyTemplates[rt] + "\nImport HS_proxyManager.ars, then try again.");
            return false;
        }
    }

    if(rqOMT.length < 1){
        alert("No output module templates are available.");
        return false;
    }

    if(uom === null || uom === undefined || uom < 0 || uom >= rqOMT.length) {
        uom = 0;
    }

    var renderWin = new Window('dialog', 'Proxy Rendering Setup');

    renderWin.location = [200,200];
    renderWin.size = [400,365];
    renderWin.OMText = renderWin.add('statictext', [20, 15, 120, 35],"Output Module:")
    renderWin.OMList = renderWin.add('dropdownlist', [125, 15, 380, 35],rqOMT);
    renderWin.OMList.selection =  uom;

    renderWin.sound =  renderWin.add('checkbox', [125, 45, 380, 65], 'Include Audio');
    renderWin.sound.value = usound;
    renderWin.notrend =  renderWin.add('checkbox', [125, 70, 380, 90], 'Queue Only');
    renderWin.notrend.value = unotrend;

    renderWin.OMDesc = renderWin.add('statictext', [20, 130, 380, 310],"Choose an output module, then click OK.\n\nOK prepares the render queue and starts background rendering. You can keep working in After Effects.\n\nTo edit output module templates, cancel this dialog and update them in After Effects first.\n\nIf Queue Only is checked, the script saves the proxy render project but does not start aerender.", {multiline: true})

    renderWin.OK = renderWin.add('button', [280, 330, 380, 350], 'OK', {name:'ok'});
    renderWin.CANCEL = renderWin.add('button', [170,330,270,350], 'Cancel', {name:'cancel'});
    renderWin.SAVEPREF = renderWin.add('button', [20, 330, 150, 350], 'Save Defaults');

    renderWin.OK.onClick =  function(){
                                for (var i = 1, RqLength= app.project.renderQueue.numItems; i <= RqLength; i++) {

                                    var curQItem = app.project.renderQueue.item(i);
                                    curQItem.outputModule(1).applyTemplate(renderWin.OMList.selection);

                                    var omNameSplit = curQItem.outputModule(1).file.name.split("_")
                                    var extSplit = curQItem.outputModule(1).file.name.split(".")
                                    if(omNameSplit.length < 2){
                                        alert("Unexpected proxy output name:\n" + curQItem.outputModule(1).file.name);
                                        return;
                                    }
                                    var proxyItemFolder_parent = hs_proxyManager.checkProxyResFolder(outputFolder.fsName+"/"+ omNameSplit[0]);
                                    if(proxyItemFolder_parent === null) { return; }

                                    if(!hs_proxyManager.removeResolutionFolder(proxyItemFolder_parent.fsName+"/"+omNameSplit[1])) { return; }


                                    var proxyItemFolder = hs_proxyManager.checkProxyResFolder(proxyItemFolder_parent.fsName+"/"+omNameSplit[1]);
                                    if(proxyItemFolder === null) { return; }

                                    curQItem.outputModule(1).file = new File(proxyItemFolder.fsName+"/"+ curQItem.outputModule(1).file.name)

                                    curQItem.applyTemplate('[HS_PROXY_1/'+omNameSplit[1]+']');


                                    if(omNameSplit[1] === "1"){
                                          curQItem.outputModule(1).postRenderAction = PostRenderAction.IMPORT_AND_REPLACE_USAGE;
                                    }


                                }

                                if(!renderWin.notrend.value){

                                    var project2go = app.project.file;
                                    var batFilePath;

                                    var proxyRenderTxt = hs_renderCore.aebatMakeCommand(renderWin.sound.value, 80, 45, 1, false, project2go);

                                    if(proxyRenderTxt === null) { return; }


                                    if(hsUtil.osType() === "Mac") {
                                        batFilePath = project2go.parent.fsName + "/" + "HS_proxyManager"+ ".term";
                                        hs_renderCore.aebat_fileExport(batFilePath, proxyRenderTxt, true, true)
                                    } else if (hsUtil.osType() === "Win") {
                                        batFilePath = project2go.parent.fsName + "/" + "HS_proxyManager" + ".bat";
                                        hs_renderCore.aebat_fileExport(batFilePath,proxyRenderTxt, true, false)
                                    }
                                }

                                this.parent.close();
                            }

    renderWin.CANCEL.onClick = function() { this.parent.close();}

    renderWin.SAVEPREF.onClick = function() {
        var saveDefaultCheck = confirm("Save these settings as defaults?");
        if(saveDefaultCheck === true) {
            var prefWriteTxt = "sound = " + renderWin.sound.value + ";\n" + "notrend = " + renderWin.notrend.value + ";\n" + "om = " + renderWin.OMList.selection.index + ";\n" ;
            hsUtil.savePref(hs_proxyManager.prefFile, hs_proxyManager.prefFolder, prefWriteTxt);
            alert("Default settings saved.");
        }
    }

    renderWin.show();
    return true;
}



// Main ScriptUI panel.

hs_proxyManager.buildUIPanel = function(HS_ProxyWin){

    // Preference defaults.
    var sound = true;
    var om = 0;
    var proxyDefaultPath = null;
    var notrend = false;


    // Load saved preferences.
    var proxyPrefTxt = hsUtil.loadPref(hs_proxyManager.defaultProxyPath);
    var renderPref = hs_proxyManager.loadRenderPref(hs_proxyManager.prefFile);
    var renderSettings = new Object();
    renderSettings.sound = sound;
    renderSettings.notrend = notrend;
    renderSettings.om = om;
    renderSettings = hs_proxyManager.applyRenderPref(renderPref, renderSettings);
    sound = renderSettings.sound;
    notrend = renderSettings.notrend;
    om = renderSettings.om;


    if(proxyPrefTxt !== null){
        proxyDefaultPath = hs_proxyManager.normalizeProxyPathText(proxyPrefTxt);
    }


    var HS_ProxyManager_VERSION = hs_proxyManager.version;

    var HS_ProxyUIBtn_1 = HS_ProxyWin.add('button', [5, 2, 45, 25], "100%");
    var HS_ProxyUIBtn_2 = HS_ProxyWin.add('button', [50, 2, 90, 25], "50%");
    var HS_ProxyUIBtn_3 = HS_ProxyWin.add('button', [95, 2, 135, 25], "33%");
    var HS_ProxyUIBtn_4 = HS_ProxyWin.add('button', [140, 2, 180, 25], "25%");
    var HS_ProxyUIBtn_0 = HS_ProxyWin.add('button', [185, 2, 230, 25], "Main");

    var HS_ProxyUIBtn_make = HS_ProxyWin.add('button', [240, 2, 340, 25], "Make Proxy");

    var hs_radioButtonUI = true;
    var hs_alphaSelection = 0;
    var HS_ProxyUIApplyAll = HS_ProxyWin.add('checkbox', [5, 88, 170, 108], 'Apply to All Items');

        HS_ProxyWin.btnPanel = HS_ProxyWin.add('panel',[5, 35, 340, 85], 'Proxy Alpha Mode:');
        HS_ProxyWin.btnPanel.btn1 = HS_ProxyWin.btnPanel.add('radiobutton', [10, 10, 90, 35], 'Auto');
        HS_ProxyWin.btnPanel.btn2 = HS_ProxyWin.btnPanel.add('radiobutton', [95, 10, 175, 35], 'Straight');
        HS_ProxyWin.btnPanel.btn3 = HS_ProxyWin.btnPanel.add('radiobutton', [180, 10, 260, 35], 'Premult');
        HS_ProxyWin.btnPanel.btn4 = HS_ProxyWin.btnPanel.add('radiobutton', [265, 10, 340, 35], 'Ignore');

        HS_ProxyWin.btnPanel.btn1.value = (hs_alphaSelection == 0);
        HS_ProxyWin.btnPanel.btn2.value = (hs_alphaSelection == 1);
        HS_ProxyWin.btnPanel.btn3.value = (hs_alphaSelection == 2);
        HS_ProxyWin.btnPanel.btn4.value = (hs_alphaSelection == 3);


        HS_ProxyWin.btnPanel.btn1.onClick = function(){hs_alphaSelection = 0;
                                                       hs_proxyManager.changeProxyAlphaMode(hs_alphaSelection);}
        HS_ProxyWin.btnPanel.btn2.onClick = function(){hs_alphaSelection = 1;
                                                       hs_proxyManager.changeProxyAlphaMode(hs_alphaSelection);}
        HS_ProxyWin.btnPanel.btn3.onClick = function(){hs_alphaSelection = 2;
                                                       hs_proxyManager.changeProxyAlphaMode(hs_alphaSelection);}
        HS_ProxyWin.btnPanel.btn4.onClick = function(){hs_alphaSelection = 3;
                                                       hs_proxyManager.changeProxyAlphaMode(hs_alphaSelection);}


        HS_ProxyWin.folderSetting = HS_ProxyWin.add('panel',[5, 110, 340, 220], 'Proxy Folder:');

        if(proxyDefaultPath === null){
            HS_ProxyWin.folderSetting.pathText = hs_proxyManager.sameAsProjectProxyText;
        } else {
            HS_ProxyWin.folderSetting.pathText = proxyDefaultPath;
        }

        HS_ProxyWin.folderSetting.pathTxt = HS_ProxyWin.folderSetting.add('edittext', [15,15,285,35],   HS_ProxyWin.folderSetting.pathText);
        HS_ProxyWin.folderSetting.pathTxt.helpTip = "Relative paths start from the AEP folder. Use / as the separator.";

        HS_ProxyWin.folderSetting.button1  = HS_ProxyWin.folderSetting.add('button',  [290,15, 315,35], '...');
        HS_ProxyWin.folderSetting.button2  = HS_ProxyWin.folderSetting.add('button',  [15,40, 160,60],  'Same as project');
        HS_ProxyWin.folderSetting.button3  = HS_ProxyWin.folderSetting.add('button',  [165,40, 315,60], 'Save as default');

        HS_ProxyWin.folderSetting.button9  = HS_ProxyWin.folderSetting.add('button',  [15,65,315,85],   'Apply to current project');

    var HS_ProxyUIMatteVer = HS_ProxyWin.add('statictext', [5, 250, 340, 270],'HS_ProxyManager Version '+ HS_ProxyManager_VERSION);

    // Set proxy

    var syncProxyPathFromUI = function() {
        proxyDefaultPath = hs_proxyManager.normalizeProxyPathText(HS_ProxyWin.folderSetting.pathTxt.text);
        HS_ProxyWin.folderSetting.pathTxt.text = (proxyDefaultPath === null) ? hs_proxyManager.sameAsProjectProxyText : proxyDefaultPath;
        return proxyDefaultPath;
    }

    HS_ProxyWin.folderSetting.pathTxt.onChange = function() { syncProxyPathFromUI(); }

    HS_ProxyUIBtn_1.onClick = function() {hs_proxyManager.setProxy(1, hs_alphaSelection, syncProxyPathFromUI(), HS_ProxyUIApplyAll.value);}
    HS_ProxyUIBtn_2.onClick = function() {hs_proxyManager.setProxy(2, hs_alphaSelection, syncProxyPathFromUI(), HS_ProxyUIApplyAll.value);}
    HS_ProxyUIBtn_3.onClick = function() {hs_proxyManager.setProxy(3, hs_alphaSelection, syncProxyPathFromUI(), HS_ProxyUIApplyAll.value);}
    HS_ProxyUIBtn_4.onClick = function() {hs_proxyManager.setProxy(4, hs_alphaSelection, syncProxyPathFromUI(), HS_ProxyUIApplyAll.value);}
    HS_ProxyUIBtn_0.onClick = function() {hs_proxyManager.setProxy(0, hs_alphaSelection, syncProxyPathFromUI(), HS_ProxyUIApplyAll.value);}



    // Choose a proxy root.

    HS_ProxyWin.folderSetting.button1.onClick = function() {

        var newProxyFolder = Folder.selectDialog();

        if(newProxyFolder){
            var catchErr = false;
            var trial = new Folder(newProxyFolder.fsName + "/__hs_proxymanager_trial_folder__");

            trial.create();

            if(!trial.exists) {
                alert('Could not create the folder. Check permissions and try again.');
                catchErr = true;
            }


            if(catchErr === false) {
                proxyDefaultPath = hs_proxyManager.normalizeProxyPathText(newProxyFolder.fsName);
                HS_ProxyWin.folderSetting.pathTxt.text = proxyDefaultPath;
                trial.remove();
            }

            return;

        } else {

            return;
        }
    }

    // Use the project folder as the proxy root.
    HS_ProxyWin.folderSetting.button2.onClick = function(){

            proxyDefaultPath = null;
            HS_ProxyWin.folderSetting.pathTxt.text = hs_proxyManager.sameAsProjectProxyText;

    }


    // Save the default proxy root.
    HS_ProxyWin.folderSetting.button3.onClick = function(){

            syncProxyPathFromUI();
            var prefTextContent = (proxyDefaultPath === null) ? "null" : proxyDefaultPath;

            var canSavePref = hsUtil.savePref(hs_proxyManager.defaultProxyPath, hs_proxyManager.prefFolder, prefTextContent);

            if(canSavePref !== null) {
                if(proxyDefaultPath === null) {
                    alert("Proxy files will be saved next to the project file.");
                } else {
                    alert("Default proxy folder changed to:\n" + proxyDefaultPath);
                }
            } else {
                 alert("Could not save preferences. Check permissions.");
            }
    }


    HS_ProxyWin.folderSetting.button9.onClick = function(){

        var newDefaultPath = syncProxyPathFromUI();
        var saveUntitled;

        if(app.project.file === null) {
            saveUntitled = app.project.save();
        }

        if(app.project.file === null && saveUntitled === null){
            alert("Save this project, then try again.");
        }


        if(app.project.file){

            var originalProject = new File(app.project.file);
            var proxyOutputFolder = hs_proxyManager.checkProxyFolder(newDefaultPath, false, false);
            if(proxyOutputFolder === null) { return; }

            var confirmDialog = confirm("Reset all proxies in this project?", true);

            if(confirmDialog === true){

                for(var i = 1; i<=app.project.items.length; i++){

                    var curItem = app.project.item(i);
                    if(hs_proxyManager.isProxyableItem(curItem)){
                        curItem.setProxyToNone();
                    }
                }

                if(hs_proxyManager.saveProjectProxyPref(originalProject, proxyOutputFolder, newDefaultPath) === null) {
                    alert("Could not save this project's proxy setting. Check permissions.");
                }
           }

        }


    }


    HS_ProxyUIBtn_make.onClick = function() {

        // Reload render preferences.
        var currentRenderPref = hs_proxyManager.loadRenderPref(hs_proxyManager.prefFile);
        var currentRenderSettings = new Object();
        currentRenderSettings.sound = sound;
        currentRenderSettings.notrend = notrend;
        currentRenderSettings.om = om;
        currentRenderSettings = hs_proxyManager.applyRenderPref(currentRenderPref, currentRenderSettings);
        sound = currentRenderSettings.sound;
        notrend = currentRenderSettings.notrend;
        om = currentRenderSettings.om;

		if(app.project.file === null) {

			alert("Save this project before creating proxies.");
			var saveFlag;
			try { app.project.save(); saveFlag = (app.project.file !== null); }
			catch(e) { saveFlag = false; }

		} else {

            var overWriteFlag = confirm("Save the current project before creating proxies?\nOverwrite the project file?");
            var saveFlag;

            if(overWriteFlag === true) {

                try { app.project.save(); saveFlag = true; }
                catch(e) { saveFlag = false; }

            } else {

                saveFlag = app.project.saveWithDialog();
            }

        }


        if(saveFlag === true){

            var originalProject = new File(app.project.file);
            var currentProxyPath = syncProxyPathFromUI();
            var proxyOutputFolder = hs_proxyManager.checkProxyFolder(currentProxyPath);

            if(proxyOutputFolder === null) { return; }

            if(hs_proxyManager.saveProjectProxyPref(originalProject, proxyOutputFolder, currentProxyPath) === null) {
                alert("Could not save this project's proxy setting. Check permissions.");
                return;
            }

            if(proxyOutputFolder !== null){

                var pLength =app.project.numItems;
                var pArray = new Array();
                var pQItem;
                var pRenderFlag = false;
                var pAddFlag = false;
                var pCompDuration;
                var pCompFrameRate;

                var proxyProjectFolder = new Folder(proxyOutputFolder.fsName+"/(proxy_temp)");


                if(!proxyProjectFolder.exists) {
                    var createdProxyProjectFolder = proxyProjectFolder.create();
                    if(!createdProxyProjectFolder || !proxyProjectFolder.exists){
                        alert("Could not create proxy temp folder:\n" + proxyProjectFolder.fsName);
                        return;
                    }
                } // Create "(proxy_temp)".


                var proxyTempProject = new File(proxyProjectFolder.fsName + "/[proxy]" + app.project.file.name);

                // Disable selected proxies only in the temporary render project.
                for(var sp = 0, selLength = app.project.selection.length; sp < selLength; sp++){
                    var selectedItem = app.project.selection[sp];
                    if(hs_proxyManager.isProxyableItem(selectedItem) && selectedItem.proxySource !== null){
                        selectedItem.setProxyToNone();
                    }
                }

                var saveProxyProject = false;
                try {
                    app.project.save(proxyTempProject);
                    saveProxyProject = true;
                } catch(e) {
                    saveProxyProject = false;
                }

                if(saveProxyProject !== true){
                    alert("Could not save proxy render project:\n" + proxyTempProject.fsName);
                    try { app.open(File(originalProject.fsName)); } catch(e) {}
                    return;
                }

                var qi = app.project.renderQueue.numItems;

                if(qi != null && qi > 0) {
                    for (var i = 0; i < qi; i++) {
                        app.project.renderQueue.item(1).remove();
                    }
                }


                for(var nm = 1; nm <= pLength; nm++){
                    pArray.push(app.project.item(nm));
                }


                // Build proxy comps and add them to the render queue.
                for(var nn=0; nn < pLength; nn++){

                    if (pArray[nn].selected && hs_proxyManager.isRenderableProxyItem(pArray[nn])) {
                        pAddFlag = true;
                    } else {
                        pAddFlag = false;
                    }


                    if (pAddFlag == true) {

                        // Create proxy render comps.

                        if(!(pArray[nn] instanceof CompItem) && pArray[nn].mainSource.isStill) { // Still footage.

                            pCompDuration = 1/1;
                            pCompFrameRate = 1;

                        } else {

                            pCompDuration = pArray[nn].duration;
                            pCompFrameRate = pArray[nn].frameRate;

                        }

                        // Sanitize the source name for generated comps.
                        pArray[nn].name = hs_proxyManager.fixPSDLayers (pArray[nn].name);

                        // Nest each proxy comp; [HS_PROXY_1/n] templates handle scaling.
                        // Desktop paths are placeholders to avoid queue errors.
                        var pPrevLayer = pArray[nn];
                        for(var pr = 1; pr <= 4; pr++){

                            var pComp = app.project.items.addComp(
                                        hsUtil.checkItemNameExists(pArray[nn].id + "_" + pr + "_" + pArray[nn].name),
                                        pArray[nn].width,
                                        pArray[nn].height,
                                        pArray[nn].pixelAspect,
                                        pCompDuration,
                                        pCompFrameRate        );

                            pComp.layers.add(pPrevLayer);

                            pQItem = app.project.renderQueue.items.add(pComp);
                            pQItem.outputModule(1).file = File(Folder.desktop.fsName + "/" + pComp.name);

                            pPrevLayer = pComp;
                        }

                        pRenderFlag = true;


                    } else {

                    }
                }


                if(pRenderFlag === true) {

                    hs_proxyManager.proxyRender(proxyOutputFolder, sound, om, notrend);

                } else {
                    alert("Select footage or comps that can use proxies.");
                }

                app.project.save();
                app.open(File(originalProject.fsName));
                pRenderFlag = false;
            }

        } else {
            ;
            ;
        }

    }
}




// ******** Main ********



if(parseFloat(app.version) >= 8) {
    app.project.renderQueue.templates

        hs_proxyManager.version = "1.2";
        hs_proxyManager.folderName = "(_HS_proxy_)";

        // Pref folder

        hs_proxyManager.prefFolderHome = new Folder(Folder.myDocuments.fsName + "/" +"(hs_pref)");

        if(hs_proxyManager.prefFolderHome.exists){
            hs_proxyManager.prefFolder = hs_proxyManager.prefFolderHome; // Use the Documents preference folder.
        } else {
            hs_proxyManager.prefFolder = new Folder(Folder.current.fsName + "/" + "(hs_pref)");
        }

        // Script pref file and proxy path setting file
        hs_proxyManager.prefFileName = "hs_proxyManager.pref";
        hs_proxyManager.prefProxyFileName = "hs_proxyManager.proxy"; // Default proxy root setting.
        hs_proxyManager.prefFile =  new File(hs_proxyManager.prefFolder.fsName +"/"+ hs_proxyManager.prefFileName);
        hs_proxyManager.defaultProxyPath = new File(hs_proxyManager.prefFolder.fsName +"/"+ hs_proxyManager.prefProxyFileName);

        hs_proxyManager.start = hs_proxyManager.buildUIPanel(this);


} else {

        hs_proxyManager.start = undefined;
        alert("Error: This script requires After Effects CS3 or later.");

}
