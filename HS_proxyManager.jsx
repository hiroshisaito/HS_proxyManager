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



hs_proxyManager.saveProjectProxyPref = function(projectFile, proxyFolder) {
    var currentProjectProxyPref = hs_proxyManager.projectProxyPrefFile(projectFile);
    return hsUtil.savePref(currentProjectProxyPref, projectFile.parent, proxyFolder.fsName);
}



hs_proxyManager.templateExists = function(templateList, templateName) {
    for(var i = 0; i < templateList.length; i++){
        if(templateList[i].toString() === templateName) { return true; }
    }
    return false;
}


// hs_proxyManager.checkProxyFolder(path)
// Check the root proxy folder for current project.
// This method returns Folder Object.
//
// arguments:
// path : Full path to proxy root folder. (string)
// onlycheck (Option): If you like to use this method to check whether the folder already exists. (Boolean)
// useCurrentFile (Option): If true, prefer the current project's .proxy file. (Boolean)

hs_proxyManager.checkProxyFolder = function(path, onlycheck, useCurrentFile){
    if(app.project.file !== null){

        var projectRoot = app.project.file.parent;
        var projectProxyFolderName = "(" + app.project.file.name +")";
        var proxyRootPath;
        var proxyRoot =null;


        //Define the proxy folder setting file.
        var projectProxySettingFile = new File(projectRoot.fsName + "/" + app.project.file.name + ".proxy");

        //Seek proxy root folder.
        // The priority is;
        //  1. dot proxy file and read that path.
        //  2. check default path in pref file.
        //  3. if the default path in pref file was 'null' or there was NOT being pref file, same as project(aep) root path.

        if(projectProxySettingFile.exists && (useCurrentFile)){
            proxyRootPath = hs_proxyManager.normalizePrefPath(hsUtil.loadPref(projectProxySettingFile));
            if(proxyRootPath !== null) {
                proxyRoot = new Folder(proxyRootPath);
            }
        }

        path = hs_proxyManager.normalizePrefPath(path);

        if(proxyRoot === null && path !== null) {
            proxyRoot = new Folder(path + "/" +  hs_proxyManager.folderName + "/" + projectProxyFolderName);
        } else if(proxyRoot === null) {
            proxyRoot = new Folder(projectRoot.fsName + "/" +  hs_proxyManager.folderName + "/" + projectProxyFolderName);
        }

        if(proxyRoot.exists){

            return proxyRoot;

        } else {


            if(onlycheck === undefined || onlycheck === null || onlycheck === false){

                var created = false;
                try{
                    if(proxyRoot.parent !== null && !proxyRoot.parent.exists) {
                        proxyRoot.parent.create();
                    }
                    created = proxyRoot.create();
                } catch(e) {
                    alert(e);
                }

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



// folder must be Folder item but pFolderName must be string.
// Returns Folder item object.

hs_proxyManager.chkFolderNameExists = function(folder, pFolderName){
    //alert("hs_chkFolderNameExists:" + folder.exists);
    if(!folder.exists) {
		return folder;
	} else {
		for(var exNum = 1; (Folder(folder.parent.fsName+"/"+pFolderName+"_"+exNum).exists); exNum++) {};
		var newPFolder = new Folder(folder.parent.fsName+"/"+pFolderName+"_"+exNum);
        //alert(newPFolder.fsName)
        return newPFolder;
	}
}



// Check item folder.
// (subfolders of proxy Folder)
//
// hs_proxyManager.checkProxyResFolder(path)
// path: Fullpath to proxy folder. (string)

hs_proxyManager.checkProxyResFolder= function(path) {

    var proxyResFolder = new Folder(path);

    if(!proxyResFolder.exists){
        var created = proxyResFolder.create();
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



//Remove Proxy Resolution Folders
//path: Fullpath to resolution folders (1,2,3 and 4) in proxy folder. (string)

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
// alpha: 0=guessAlphaMode, 1=Straight, 2=Premultiplied, 3=Ignore
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
// arguments:
//
// val: Proxy resolution (Int)
//      1: 100%
//      2: 50%
//      3: 33%
//      4: 25%
//
// alpha: Aplha mode.(Int)
//      0:guessAlphaMode()
//      1:AlphaMode.STRAIGHT
//      2:AlphaMode.PREMULTIPLIED
//      3:AlphaMode.IGNORE
//
// path: Path to proxy folder(string)
//

hs_proxyManager.setProxy = function(val, alpha, path){

    //alert(sel);
    var proxyFolderItems;

    for(var i=1, itemsLength =app.project.numItems ;i<=itemsLength; i++){

        var curItem = app.project.item(i);

        if(curItem.selected && hs_proxyManager.isProxyableItem(curItem)){
            if(val === 0){ curItem.setProxyToNone(); continue; }

            var proxyRootFolder = hs_proxyManager.checkProxyFolder(path, true, true);
            if(proxyRootFolder){
                proxyFolderItems = Folder(proxyRootFolder.fsName).getFiles();
            } else {
                proxyFolderItems = null;
            }

            if(proxyFolderItems === null){
                return;
            } else {

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
                        //Set Proxy

                        curItem.setProxyWithSequence(File(proxyFiles[0]),false);

                        //Fix frame rate
                        hs_proxyManager.applyProxyFrameRate(curItem);

                        //Set Alpha mode
                        //(if the proxy has apha)
                        hs_proxyManager.applyAlphaMode(curItem.proxySource, alpha);



                    } else if(proxyFiles.length === 1){
                        //Set Proxy
                        curItem.setProxy(File(proxyFiles[0]));

                        //Fix frame rate
                        hs_proxyManager.applyProxyFrameRate(curItem);

                        //Set Alpha mode
                        //(if the proxy has apha)

                        hs_proxyManager.applyAlphaMode(curItem.proxySource, alpha);


                    } else {
                        ;
                    }

                }
            }


        }
    }
    return;
}


/*
hs_proxyManager.applyTemplate = function(item) {
    var cq = [];
    pQItem.applyTemplate("[HS_PROXY_1/1]")
}
*/

/*
//proxy_canHave() is a function for devlopment and debugging.
//Not in use current version but still be here just in case.


function proxy_canHave(item) {
    if(item instanceof CompItem || (item.mainSource instanceof FileSource && item.width > 0)){
        return true;
    } else {
        return false;
    }
}
*/






// Rendering Dialog:
//   This window is setting for rendering output module and some other reindering stuff.
//   After Effects should be locked while this window appears.
//
// hs_proxyManager.proxyRender(outputFolder, usound, uom, unotrend)
// arguments:
// outputFolder: Proxy-Root Foder. (Folder)
// usound:Enable/Disable Sound option. (Boolean)
// uom:Default rendering output mobule index. (Int)
// unotrend: Enable/Disable render later option. (Boolean)

hs_proxyManager.proxyRender = function(outputFolder, usound, uom, unotrend) {

    if(app.project.renderQueue.numItems < 1){
        alert("There's no item in render queue.");
        return false;
    }

    var rqOMT = app.project.renderQueue.item(1).outputModule(1).templates;
    var rqTemplates = app.project.renderQueue.item(1).templates;
    var requiredProxyTemplates = ["[HS_PROXY_1/1]", "[HS_PROXY_1/2]", "[HS_PROXY_1/3]", "[HS_PROXY_1/4]"];

    for(var rt = 0; rt < requiredProxyTemplates.length; rt++){
        if(!hs_proxyManager.templateExists(rqTemplates, requiredProxyTemplates[rt])){
            alert("Missing render settings template:\n" + requiredProxyTemplates[rt] + "\nImport HS_proxyManager.ars and try again.");
            return false;
        }
    }

    if(rqOMT.length < 1){
        alert("There's no output module template.");
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

    renderWin.sound =  renderWin.add('checkbox', [125, 45, 380, 65], 'Sound Option');
    renderWin.sound.value = usound;
    renderWin.notrend =  renderWin.add('checkbox', [125, 70, 380, 90], 'Render later');
    renderWin.notrend.value = unotrend;

    renderWin.OMDesc = renderWin.add('statictext', [20, 130, 380, 310],"Choose an output module and press 'OK' button.\nIf you press 'OK' or return key, background rendering would start. You may continue to work on After Efefcts while background rendering is running.\n\nNOTICE: You can not modify the output module setting in this panel. If you would like to do that, press 'Cancel' button and back to After Effects to save your output module template(s) in advance.\n\n If 'Not render immediately' is checked, proxy rendering won't start, just export project file for proxy-rendering. (This option might be useful to use render farm.) ", {multiline: true})

    renderWin.OK = renderWin.add('button', [280, 330, 380, 350], 'OK', {name:'ok'});
    renderWin.CANCEL = renderWin.add('button', [170,330,270,350], 'Cancel', {name:'cancel'});
    renderWin.SAVEPREF = renderWin.add('button', [20, 330, 150, 350], 'Save As Default');

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


                                    /* version 0.8: Currently disable skip 1/1 option due to PostRenderAction issue
                                    ==========================================
                                    // Skip '1/1' resolution rendering option
                                    if(renderWin.OMBtn.value == true && omNameSplit[1] == "1"){
                                          curQItem.render = false;
                                    }

                                    if(renderWin.OMBtn.value == false && omNameSplit[1] == "1"){
                                          curQItem.outputModule(1).postRenderAction = PostRenderAction.IMPORT_AND_REPLACE_USAGE;

                                    } else if(renderWin.OMBtn.value == true && omNameSplit[1] == "2"){
                                          curQItem.outputModule(1).postRenderAction = PostRenderAction.IMPORT_AND_REPLACE_USAGE;
                                    }

                                    if(renderWin.OMBtn.value == true && omNameSplit[1] != "1" && omNameSplit[1] != "2"){

                                          curQItem.comp.width = curQItem.comp.width/2;
                                          curQItem.comp.height = curQItem.comp.height/2;
                                          curQItem.comp.layers[1].property("position").setValue([curQItem.comp.width/2,curQItem.comp.height/2])
                                    }
                                    ==========================================
                                    */


                                    if(omNameSplit[1] === "1"){
                                          curQItem.outputModule(1).postRenderAction = PostRenderAction.IMPORT_AND_REPLACE_USAGE;
                                    }


                                }

                                if(!renderWin.notrend.value){

                                    var project2go = app.project.file;
                                    var batFilePath;

                                    // hs_renderCore.aebatMakeCommand() --> HS_renderCore.jsx
                                    var proxyRenderTxt = hs_renderCore.aebatMakeCommand(renderWin.sound.value, 80, 45, 1, false, project2go);

                                    if(proxyRenderTxt === null) { return; }


                                    if(hsUtil.osType() === "Mac") {
                                        batFilePath = project2go.parent.fsName + "/" + "HS_proxyManager"+ ".term";
                                        hs_renderCore.aebat_fileExport(batFilePath, proxyRenderTxt, true, true) // HS_renderCore.jsx
                                    } else if (hsUtil.osType() === "Win") {
                                        batFilePath = project2go.parent.fsName + "/" + "HS_proxyManager" + ".bat";
                                        hs_renderCore.aebat_fileExport(batFilePath,proxyRenderTxt, true, false) // HS_renderCore.jsx
                                    }
                                }

                                this.parent.close();
                            }

    renderWin.CANCEL.onClick = function() { this.parent.close();}

    renderWin.SAVEPREF.onClick = function() {
        var saveDefaultCheck = confirm("Are you going to save current settings as default ?");
        if(saveDefaultCheck === true) {
            var prefWriteTxt = "sound = " + renderWin.sound.value + ";\n" + "notrend = " + renderWin.notrend.value + ";\n" + "om = " + renderWin.OMList.selection.index + ";\n" ;
            hsUtil.savePref(hs_proxyManager.prefFile, hs_proxyManager.prefFolder, prefWriteTxt);
            alert("Current settings were saved as default.");
        }
    }

    renderWin.show();
    return true;
}



// HS_ProxyManager_UI:
// (ScriptUI Panel function)
// Note that the script ui panel is called from main.

hs_proxyManager.buildUIPanel = function(HS_ProxyWin){

    // Pref default
    var sound = true;
    var om = 0;
    var proxyDefaultPath = null;
    var notrend = false;


    //Override pref setting from pref file.
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
        proxyDefaultPath = hs_proxyManager.normalizePrefPath(proxyPrefTxt);
    }

    //Check again proxyDefaltPath...

    if(proxyDefaultPath !== null) {

        (File(proxyDefaultPath).exists) ? proxyDefaultPath = Folder(proxyDefaultPath).fsName : proxyDefaultPath = null ;

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


        HS_ProxyWin.folderSetting = HS_ProxyWin.add('panel',[5, 110, 340, 220], 'Proxy-Set Folder Setting:');

        if(proxyDefaultPath === null){
            HS_ProxyWin.folderSetting.pathText = './(Same as project file.)';
        } else {
            HS_ProxyWin.folderSetting.pathText = proxyDefaultPath;
        }

        HS_ProxyWin.folderSetting.pathTxt = HS_ProxyWin.folderSetting.add('edittext', [15,15,285,35],   HS_ProxyWin.folderSetting.pathText ,{readonly:true});

        HS_ProxyWin.folderSetting.button1  = HS_ProxyWin.folderSetting.add('button',  [290,15, 315,35], '...');
        HS_ProxyWin.folderSetting.button2  = HS_ProxyWin.folderSetting.add('button',  [15,40, 160,60],  'Same as project');
        HS_ProxyWin.folderSetting.button3  = HS_ProxyWin.folderSetting.add('button',  [165,40, 315,60], 'Save as default');

        HS_ProxyWin.folderSetting.button9  = HS_ProxyWin.folderSetting.add('button',  [15,65,315,85],   'Apply to current project');

    var HS_ProxyUIMatteVer = HS_ProxyWin.add('statictext', [5, 250, 340, 270],'HS_ProxyManager Version '+ HS_ProxyManager_VERSION);

    // Set proxy

    HS_ProxyUIBtn_1.onClick = function() {hs_proxyManager.setProxy(1, hs_alphaSelection, proxyDefaultPath);}
    HS_ProxyUIBtn_2.onClick = function() {hs_proxyManager.setProxy(2, hs_alphaSelection, proxyDefaultPath);}
    HS_ProxyUIBtn_3.onClick = function() {hs_proxyManager.setProxy(3, hs_alphaSelection, proxyDefaultPath);}
    HS_ProxyUIBtn_4.onClick = function() {hs_proxyManager.setProxy(4, hs_alphaSelection, proxyDefaultPath);}
    HS_ProxyUIBtn_0.onClick = function() {hs_proxyManager.setProxy(0, hs_alphaSelection, proxyDefaultPath);}



    // Change Proxy-set Path (Press "..." button)

    HS_ProxyWin.folderSetting.button1.onClick = function() {

        var newProxyFolder = Folder.selectDialog();

        if(newProxyFolder){
            var catchErr = false;
            var trial = new Folder(newProxyFolder.fsName + "/__hs_proxymanager_trial_folder__");

            trial.create();

            if(!trial.exists) {
                alert('Could not create folder. Check permission and try again');
                catchErr = true;
            }


            if(catchErr === false) {
                proxyDefaultPath = newProxyFolder.fsName;
                HS_ProxyWin.folderSetting.pathTxt.text = proxyDefaultPath;
                trial.remove();
            }

            return;

        } else {

            return;
        }
    }

    // Change Proxy-Set Path to project's root (Same as project)
    HS_ProxyWin.folderSetting.button2.onClick = function(){

            proxyDefaultPath = null;
            HS_ProxyWin.folderSetting.pathTxt.text = './(Same as project file.)';

    }


    // Save default proxy-set folder
    HS_ProxyWin.folderSetting.button3.onClick = function(){

            var prefTextContent = (proxyDefaultPath === null) ? "null" : proxyDefaultPath;

            var canSavePref = hsUtil.savePref(hs_proxyManager.defaultProxyPath, hs_proxyManager.prefFolder, prefTextContent);

            if(canSavePref !== null) {
                if(proxyDefaultPath === null) {
                    alert("Proxy-set folder will be placed in same direcoty of the project file.");
                } else {
                    alert("Changed default proxy-set folder path to:\n" + proxyDefaultPath + "\n");
                }
            } else {
                 alert("Can't save preference. Check the permission.");
            }
    }


    HS_ProxyWin.folderSetting.button9.onClick = function(){

        var newDefultPath = proxyDefaultPath;

        //Only check option is 'true'.
        var folderExists = (hs_proxyManager.checkProxyFolder(proxyDefaultPath, true))
        var saveUntitled;

        if(folderExists !== null) {}

        if(app.project.file === null) {
            saveUntitled = app.project.save();
        }

        if(app.project.file === null && saveUntitled === null){
            alert("This project file does not exist. Save this project and try again.");
        }


        if(app.project.file){

            var originalProject = new File(app.project.file);
            var proxyOutputFolder = hs_proxyManager.checkProxyFolder(newDefultPath, false, false);
            if(proxyOutputFolder === null) { return; }

            var confirmDialog = confirm("All proxies in this project will be reset. Would you really execute?", true);

            if(confirmDialog === true){

                for(var i = 1; i<=app.project.items.length; i++){

                    var curItem = app.project.item(i);
                    if(hs_proxyManager.isProxyableItem(curItem)){
                        curItem.setProxyToNone();
                    }
                }

                if(hs_proxyManager.saveProjectProxyPref(originalProject, proxyOutputFolder) === null) {
                    alert("Can't save current project proxy setting. Check the permission.");
                }
           }

        }


    }


    HS_ProxyUIBtn_make.onClick = function() {

        //load Pref file (again).
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

			alert("This project is never saved before:");
			var saveFlag;
			try { app.project.save(); saveFlag = (app.project.file !== null); }
			catch(e) { saveFlag = false; }

		} else {

            var overWriteFlag = confirm("Save current project before creating proxies:\n Overwrite current project?");
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
            var proxyOutputFolder = hs_proxyManager.checkProxyFolder(proxyDefaultPath);

            if(proxyOutputFolder === null) { return; }

            if(hs_proxyManager.saveProjectProxyPref(originalProject, proxyOutputFolder) === null) {
                alert("Can't save current project proxy setting. Check the permission.");
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
                } // Create "(proxy_temp)" Folder.


                var proxyTempProject = new File(proxyProjectFolder.fsName + "/[proxy]" + app.project.file.name);

                // Turn off selected proxies only in the temporary render project.
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
                        //alert(qi - i);
                        app.project.renderQueue.item(1).remove();
                    }
                }


                for(var nm = 1; nm <= pLength; nm++){
                    pArray.push(app.project.item(nm));
                }


                // Build Composition for proxies and add them to render queue.
                for(var nn=0; nn < pLength; nn++){

                    if (pArray[nn].selected && hs_proxyManager.isRenderableProxyItem(pArray[nn])) {
                        pAddFlag = true;
                    } else {
                        pAddFlag = false;
                    }


                    if (pAddFlag == true) {

                        // Make new comps for rendering
                        // Comp1 100% Scaling

                        if(!(pArray[nn] instanceof CompItem) && pArray[nn].mainSource.isStill) { //If the fottage source is still Image;

                            pCompDuration = 1/1;
                            pCompFrameRate = 1;

                        } else {

                            pCompDuration = pArray[nn].duration;
                            pCompFrameRate = pArray[nn].frameRate;

                        }

                        // Begin make new comp for rendeing proxies.
                        pArray[nn].name = hs_proxyManager.fixPSDLayers (pArray[nn].name);

                        // Build nested comps for each proxy resolution (1=100% .. 4=25%).
                        // Each comp nests the previous one; the [HS_PROXY_1/n] templates do
                        // the actual scaling. Output paths are set to the Desktop as a dummy
                        // because a 'Not yet specified' output would error when queued.
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
                    alert("There's no selected item or Current selected items could not have proxies.");
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



//(So, guess what? WHAT? WHAT? WHAT? WHAT? WHAT?)

if(parseFloat(app.version) >= 8) {
    app.project.renderQueue.templates

        hs_proxyManager.version = "1.1";
        hs_proxyManager.folderName = "(_HS_proxy_)";

        // Pref folder

        hs_proxyManager.prefFolderHome = new Folder(Folder.myDocuments.fsName + "/" +"(hs_pref)");

        if(hs_proxyManager.prefFolderHome.exists){
            hs_proxyManager.prefFolder = hs_proxyManager.prefFolderHome; //Check user document folder
        } else {
            hs_proxyManager.prefFolder = new Folder(Folder.current.fsName + "/" + "(hs_pref)");
        }

        // Script pref file and proxy path setting file
        hs_proxyManager.prefFileName = "hs_proxyManager.pref";
        hs_proxyManager.prefProxyFileName = "hs_proxyManager.proxy"; // Pref file for proxy-set folder
        hs_proxyManager.prefFile =  new File(hs_proxyManager.prefFolder.fsName +"/"+ hs_proxyManager.prefFileName);
        hs_proxyManager.defaultProxyPath = new File(hs_proxyManager.prefFolder.fsName +"/"+ hs_proxyManager.prefProxyFileName);

        hs_proxyManager.start = hs_proxyManager.buildUIPanel(this); //pray...


} else {

        hs_proxyManager.start = undefined;
        alert("Error: This script does support After Effects CS3 or above)");

}
