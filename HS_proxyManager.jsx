/* ********
MIT License
Copyright (c) 2024 Hiroshi Saito

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


// hs_proxyManager.checkProxyFolder(path)
// Check the root proxy folder for current project.
// This method returns Folder Object.
//
// arguments:
// path : Full path to proxy root folder. (string)
// onlycheck (Option): If you like to use this method to check whether the folder already exists. (Boolean)

hs_proxyManager.checkProxyFolder = function(path, onlycheck, disableCurrentFile){
    if(app.project.file !== null){

        var projectRoot = app.project.file.parent;
        var projectProxyFolderName = "(" + app.project.file.name +")";
        var proxyRootPath;
        var proxyRootTmp;
        var proxyRoot =null;


        //Define the proxy folder setting file.
        var projectProxySettingFile = new File(projectRoot.fsName + "/" + app.project.file.name + ".proxy");

        //Seek proxy root folder.
        // The priority is;
        //  1. dot proxy file and read that path.
        //  2. check default path in pref file.
        //  3. if the default path in pref file was 'null' or there was NOT being pref file, same as project(aep) root path.

        if(projectProxySettingFile.exists && (disableCurrentFile)){
            proxyRootPath = hsUtil.loadPref(projectProxySettingFile);
            proxyRoot = new Folder(proxyRootPath);

        } else if(path !== null) {
            proxyRootTmp = new Folder(path + "/" +  hs_proxyManager.folderName + "/" + projectProxyFolderName);
            proxyRoot = hs_proxyManager.chkFolderNameExists(proxyRootTmp, projectProxyFolderName);
        } else {
            proxyRoot = new Folder(projectRoot.fsName + "/" +  hs_proxyManager.folderName + "/" + projectProxyFolderName);
        }

        if(proxyRoot.exists){

            return proxyRoot;

        } else {


            if(onlycheck === undefined || onlycheck === null || onlycheck === false){

                try{
                    proxyRoot.create();
                } catch(e) {
                    alert(e)
                } finally {
                    return proxyRoot;
                }

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
        proxyResFolder.create();
    }
    return proxyResFolder;
}



//Remove Proxy Resolution Folders
//path: Fullpath to resolution folders (1,2,3 and 4) in proxy folder. (string)

hs_proxyManager.removeResolutionFolder = function(path) {

    var resolutionFolder = new Folder(path);

    if(resolutionFolder.exists){
        if(hsUtil.osType() === 'Mac'){
            system.callSystem('rm -rf'+' "'+resolutionFolder.fsName+'"');
             return;
        } else if (hsUtil.osType() === 'Win') {
            system.callSystem('cmd /c \"rmdir /s /q '+' \"'+resolutionFolder.fsName+'\"\"');
             return;
        } else {
             return;
        }
    }
    return;
}



hs_proxyManager.changeProxyAlphaMode = function(alpha){

    for(var i=0,itemsLength=app.project.selection.length ;i<itemsLength;i++){

       var curItem = app.project.selection[i];

       if(curItem.proxySource !== null && curItem.proxySource.hasAlpha && curItem.selected){
            if (alpha === 0) { curItem.proxySource.guessAlphaMode(); }
            else if (alpha === 1) { curItem.proxySource.alphaMode =  AlphaMode.STRAIGHT; }
            else if (alpha === 2) { curItem.proxySource.alphaMode =  AlphaMode.PREMULTIPLIED; }
            else if (alpha === 3) { curItem.proxySource.alphaMode =  AlphaMode.IGNORE; }
            else {}
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

        if(curItem.selected && (curItem instanceof CompItem || curItem.mainSource instanceof FileSource)){
            if(val === 0){ curItem.setProxyToNone(); }

            if(hs_proxyManager.checkProxyFolder(path, true, true)){
                proxyFolderItems = Folder(hs_proxyManager.checkProxyFolder(path, true, true).fsName).getFiles();
            } else {
                proxyFolderItems = null;
            }

            if(proxyFolderItems === null){
                return;
            } else {

                var itemProxyFolder = Folder(hs_proxyManager.checkProxyFolder(path, true, true).fsName + "/"+ curItem.id);

                if(itemProxyFolder.exists){

                    // Remove '.DS_Store' File.

                    if(Folder(itemProxyFolder.fsName+"/"+val).getFiles(path).length > 1) {

                        var firstFile = File(Folder(itemProxyFolder.fsName+"/"+val).getFiles()[0]);
                        if(firstFile.name === '.DS_Store'){
                        firstFile.remove();

                        }
                    }


                    if(Folder(itemProxyFolder.fsName+"/"+val).getFiles().length > 1) {
                        //Set Proxy

                        curItem.setProxyWithSequence(File(Folder(itemProxyFolder.fsName+"/"+val).getFiles()[0]),false);

                        //Fix frame rate
                        if(curItem.mainSource instanceof FileSource) {

                            curItem.proxySource.conformFrameRate = curItem.mainSource.displayFrameRate;

                        } else if(curItem instanceof CompItem){

                             curItem.proxySource.conformFrameRate =  curItem.frameRate;

                        } else {

                            alert('[?] Error: Footage Frame Rate');
                        }

                        //Set Alpha mode
                        //(if the proxy has apha)
                        if(curItem.proxySource.hasAlpha){
                            // 'Straight','Premult','Ignore'
                            if (alpha === 0) { curItem.proxySource.guessAlphaMode(); }
                            else if (alpha === 1) { curItem.proxySource.alphaMode = AlphaMode.STRAIGHT; }
                            else if (alpha === 2) {  curItem.proxySource.alphaMode =  AlphaMode.PREMULTIPLIED; }
                            else if (alpha === 3)  {  curItem.proxySource.alphaMode =  AlphaMode.IGNORE; }
                            else {}
                        }



                    } else if(Folder(itemProxyFolder.fsName+"/"+val).getFiles().length === 1){
                        //Set Proxy
                        curItem.setProxy(File(Folder(itemProxyFolder.fsName+"/"+val).getFiles()[0]));

                        //Fix frame rate
                        if(curItem.mainSource instanceof FileSource && !curItem.mainSource.isStill) {
                            curItem.proxySource.conformFrameRate = curItem.mainSource.displayFrameRate;
                        } else if(curItem instanceof CompItem){
                            curItem.proxySource.conformFrameRate =  curItem.frameRate;
                        } else {
                            //alert('[?] Frame Rate is Undefined, source file is probably still image.');
                        }

                        //Set Alpha mode
                        //(if the proxy has apha)

                        if(curItem.proxySource.hasAlpha){
                            // 'Straight','Premult','Ignore'
                            if (alpha === 0) { curItem.proxySource.guessAlphaMode(); }
                            else if (alpha === 1) { curItem.proxySource.alphaMode = AlphaMode.STRAIGHT; }
                            else if (alpha === 2) {  curItem.proxySource.alphaMode =  AlphaMode.PREMULTIPLIED; }
                            else if (alpha === 3)  {  curItem.proxySource.alphaMode =  AlphaMode.IGNORE; }
                            else {}
                        }


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
// hs_proxyManager.proxyRender(outputFolder, ump, usound, uom, unotrend)
// arguments:
// outputFolder: Proxy-Root Foder. (Folder)
// ump: Enable/Disable Multi-Processor option. (Boolean)
// usound:Enable/Disable Sound option. (Boolean)
// uom:Default rendering output mobule index. (Int)
// unotrend: Enable/Disable render later option. (Boolean)

hs_proxyManager.proxyRender = function(outputFolder, ump, usound, uom, unotrend) {

    var rqOMT = app.project.renderQueue.item(1).outputModule(1).templates;
    var renderWin = new Window('dialog', 'Proxy Rendering Setup');

    renderWin.location = [200,200];
    renderWin.size = [400,365];
    renderWin.OMText = renderWin.add('statictext', [20, 15, 120, 35],"Output Module:")
    renderWin.OMList = renderWin.add('dropdownlist', [125, 15, 380, 35],rqOMT);
    renderWin.OMList.selection =  uom;

    renderWin.mp =  renderWin.add('checkbox', [125, 45, 380, 65], 'Enable Multiprocessing');
    renderWin.mp.value = ump;
    renderWin.sound =  renderWin.add('checkbox', [125, 70, 380, 90], 'Sound Option');
    renderWin.sound.value = usound;
    renderWin.notrend =  renderWin.add('checkbox', [125, 95, 380, 115], 'Render later');
    renderWin.notrend.value = unotrend;

    renderWin.OMDesc = renderWin.add('statictext', [20, 130, 380, 310],"Choose an output module and press 'OK' button.\nIf you press 'OK' or return key, background rendering would start. You may continue to work on After Efefcts while background rendering is running.\n\nNOTICE: You can not modify the output module setting in this panel. If you would like to do that, press 'Cancel' button and back to After Effects to save your output module template(s) in advance.\n\n If 'Not render immediately' is checked, proxy rendering won't start, just export project file for proxy-rendering. (This option might be useful to use render farm.) ", {multiline: true})

    renderWin.OK = renderWin.add('button', [280, 330, 380, 350], 'OK', {name:'ok'});
    renderWin.CANCEL = renderWin.add('button', [170,330,270,350], 'Cancel', {name:'cancel'});
    renderWin.SAVEPREF = renderWin.add('button', [20, 330, 150, 350], 'Save As Default');

    renderWin.OK.onClick =  function(){
                                for (var i = 1, RqLength= app.project.renderQueue.numItems; i <= RqLength; i++) {

                                    var curQItem = app.project.renderQueue.item(i);
                                    curQItem.outputModules[1].applyTemplate(renderWin.OMList.selection);

                                    var omNameSplit = curQItem.outputModule(1).file.name.split("_")
                                    var extSplit = curQItem.outputModule(1).file.name.split(".")
                                    var proxyItemFolder_parent = hs_proxyManager.checkProxyResFolder(outputFolder.fsName+"/"+ omNameSplit[0]);

                                    hs_proxyManager.removeResolutionFolder(proxyItemFolder_parent.fsName+"/"+omNameSplit[1]);


                                    var proxyItemFolder = hs_proxyManager.checkProxyResFolder(proxyItemFolder_parent.fsName+"/"+omNameSplit[1]);

                                    curQItem.outputModules[1].file = new File(proxyItemFolder.fsName+"/"+ curQItem.outputModule(1).file.name)

                                    curQItem.applyTemplate('[HS_PROXY_1/'+omNameSplit[1]+']');


                                    /* version 0.8: Currently disable skip 1/1 option due to PostRenderAction issue
                                    ==========================================
                                    // Skip '1/1' resolution rendering option
                                    if(renderWin.OMBtn.value == true && omNameSplit[1] == "1"){
                                          curQItem.render = false;
                                    }

                                    if(renderWin.OMBtn.value == false && omNameSplit[1] == "1"){
                                          curQItem.outputModules[1].postRenderAction = PostRenderAction.IMPORT_AND_REPLACE_USAGE;

                                    } else if(renderWin.OMBtn.value == true && omNameSplit[1] == "2"){
                                          curQItem.outputModules[1].postRenderAction = PostRenderAction.IMPORT_AND_REPLACE_USAGE;
                                    }

                                    if(renderWin.OMBtn.value == true && omNameSplit[1] != "1" && omNameSplit[1] != "2"){

                                          curQItem.comp.width = curQItem.comp.width/2;
                                          curQItem.comp.height = curQItem.comp.height/2;
                                          curQItem.comp.layers[1].property("position").setValue([curQItem.comp.width/2,curQItem.comp.height/2])
                                    }
                                    ==========================================
                                    */


                                    if(omNameSplit[1] === "1"){
                                          curQItem.outputModules[1].postRenderAction = PostRenderAction.IMPORT_AND_REPLACE_USAGE;
                                    }


                                }

                                if(!renderWin.notrend.value){

                                    var project2go = app.project.file;
                                    var batFilePath;

                                    // hs_renderCore.aebatMakeCommand() --> HS_renderCore.jsx
                                    var proxyRenderTxt = hs_renderCore.aebatMakeCommand(renderWin.sound.value, 80, 45, 1, renderWin.mp.value, project2go);


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
            var prefWriteTxt = "mp = " + renderWin.mp.value + ";\n" + "sound = " + renderWin.sound.value + ";\n" + "notrend = " + renderWin.notrend.value + ";\n" + "om = " + renderWin.OMList.selection.index + ";\n" ;
            hsUtil.savePref(hs_proxyManager.prefFile, hs_proxyManager.prefFolder, prefWriteTxt);
            alert("Current settings were saved as default.");
        }
    }

    renderWin.show();
}



// HS_ProxyManager_UI:
// (ScriptUI Panel function)
// Note that the script ui panel is called from main.

hs_proxyManager.buildUIPanel = function(HS_ProxyWin){

    // Pref default
    var mp = false;
    var sound = true;
    var om = 0;
    var proxyDefaultPath = null;
    var notrend = false;


    //Override pref setting from pref file.
    var prefTxt = hsUtil.loadPref(hs_proxyManager.prefFile);
    var proxyPrefTxt = hsUtil.loadPref(hs_proxyManager.defaultProxyPath);

    //----leave this code for the present.(probaby this could be removed)----
    if(prefTxt !== null){
        eval(prefTxt);
    }
    //-----------------------------------------------------------------------


    if(proxyPrefTxt !== null){
        proxyDefaultPath = proxyPrefTxt.replace(/\\/g,"/");
        proxyDefaultPath = proxyPrefTxt.replace(/\'/g,"\\\'");
        proxyDefaultPath = proxyPrefTxt.replace(/\"/g,"\\\"");
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

            var prefTextContent = proxyDefaultPath;

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
            var currentProjectProxyPath;
            var currentProjectProxyPref;

            var confirmDialog = confirm("All proxies in this project will be reset. Would you really execute?", true);

            if(confirmDialog === true){
                alert("New folder is " +proxyOutputFolder.fsName);

                for(var i = 1; i<=app.project.items.length; i++){

                    curItem = app.project.item(i);
                        if(curItem instanceof CompItem || curItem.mainSource instanceof FileSource){
                                curItem.setProxyToNone();
                        }
                }

                currentProjectProxyPath = originalProject.fsName;
                currentProjectProxyPref = new File(originalProject.parent.fsName + "/" + app.project.file.name + ".proxy");
                var currentProjectProxyPrefText = proxyOutputFolder.fsName;
                hsUtil.savePref(currentProjectProxyPref, originalProject.parent, currentProjectProxyPrefText);
           }

        }


    }


    HS_ProxyUIBtn_make.onClick = function() {

        //load Pref file (again).
        prefTxt = hsUtil.loadPref(hs_proxyManager.prefFile);

        if(prefTxt !== null){
            eval(prefTxt);
        }

		if(app.project.file === null) {

			alert("This project is never saved before:");
			var saveFlag = app.project.save();

		} else {

            var overWriteFlag = confirm("Turn off selected proxies and save current project:\n Overwrite current project?");
            var curItem;
            var saveFlag;

            if(overWriteFlag === true) {

                for(var i = 0,itemsLength=app.project.selection.length ; i<itemsLength; i++){

                    curItem = app.project.selection[i];

                        if(curItem instanceof CompItem || curItem.mainSource instanceof FileSource){
                            if(curItem.proxySource !== null && curItem.selected){
                                curItem.setProxyToNone();
                            }
                        }
                }

                saveFlag = app.project.save();

            } else {

                for(var i=0,itemsLength=app.project.selection.length ;i<itemsLength;i++){

                    curItem = app.project.selection[i];

                        if(curItem instanceof CompItem || curItem.mainSource instanceof FileSource){
                            if(curItem.proxySource !== null && curItem.selected){
                                curItem.setProxyToNone();
                            }
                        }
                }

                saveFlag = app.project.saveWithDialog();
            }

        }


        if(saveFlag === true){

            var originalProject = new File(app.project.file);
            var proxyOutputFolder = hs_proxyManager.checkProxyFolder(proxyDefaultPath);
            var currentProjectProxyPath;
            var currentProjectProxyPref;

            if(proxyOutputFolder.parent !== originalProject.parent){

                currentProjectProxyPath = originalProject.fsName;
                currentProjectProxyPref = new File(originalProject.parent.fsName + "/" + app.project.file.name + ".proxy");

                if(!currentProjectProxyPref.exists){

                    var currentProjectProxyPrefText = proxyOutputFolder.fsName;
                    hsUtil.savePref(currentProjectProxyPref, originalProject.parent, currentProjectProxyPrefText);

                }

            } else {

                currentProjectProxyPath = originalProject.fsName;
                currentProjectProxyPref = new File(originalProject.parent.fsName + "/" + app.project.file.name + ".proxy");

                if(currentProjectProxyPref.exists){

                    currentProjectProxyPref.open(e);
                    currentProjectProxyPref.rename(app.project.file.name.proxy_bk);
                    currentProjectProxyPref.close();
                    hsUtil.savePref(currentProjectProxyPref, originalProject.parent, currentProjectProxyPrefText);

                }
            }

            if(hs_proxyManager.checkProxyFolder(proxyDefaultPath) !== null){

                var pLength =app.project.numItems;
                var pArray = new Array();
                var pQItem;
                var pRenderFlag = false;
                var pAddFlag = false;
                var pCompDuration;
                var pCompFrameRate;

                var proxyProjectFolder = new Folder(hs_proxyManager.checkProxyFolder(proxyDefaultPath).fsName+"/(proxy_temp)");


                if(!proxyProjectFolder.exists) { proxyProjectFolder.create(); } // Create "(proxy_temp)" Folder.


                var proxyTempProject = new File(proxyProjectFolder.fsName + "/[proxy]" + app.project.file.name);

                var saveProxyProject = app.project.save(proxyTempProject);
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

                    if (pArray[nn].selected && pArray[nn].mainSource && pArray[nn].width > 0) {
                        pAddFlag = true; // Footage Item detected.
                    } else if (pArray[nn].selected &&  pArray[nn] instanceof CompItem ) {
                        pAddFlag = true; //CompItem detected.
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

                        var pComp_1 = app.project.items.addComp(
                                    hsUtil.checkItemNameExists(pArray[nn].id + "_1_" + pArray[nn].name),
                                    pArray[nn].width,
                                    pArray[nn].height,
                                    pArray[nn].pixelAspect,
                                    pCompDuration,
                                    pCompFrameRate        );

                        pComp_1.layers.add(pArray[nn]);
                        pQItem = app.project.renderQueue.items.add(pComp_1);


                        // Rendering output file-path is going to be set on Desktop folder as
                        // dummy path because of 'Not yet specifed' would bring error.
                        pQItem.outputModule(1).file = File(Folder.desktop.fsName + "/"+pComp_1.name);

                        //alert(Folder.desktop.fsName);
                        //alert(pQItem.outputModule(1).file);
                        // Comp2 50% Scaling

                        var pComp_2 = app.project.items.addComp(
                                    hsUtil.checkItemNameExists(pArray[nn].id + "_2_" + pArray[nn].name),
                                    pArray[nn].width,
                                    pArray[nn].height,
                                    pArray[nn].pixelAspect,
                                    pCompDuration,
                                    pCompFrameRate        );

                        pComp_2.layers.add(pComp_1);

                        pQItem = app.project.renderQueue.items.add(pComp_2);

                        pQItem.outputModule(1).file = File(Folder.desktop.fsName + "/"+pComp_2.name);


                        // Comp2 33.33% Scaling
                        var pComp_3 = app.project.items.addComp(
                                    hsUtil.checkItemNameExists(pArray[nn].id + "_3_" + pArray[nn].name),
                                    pArray[nn].width,
                                    pArray[nn].height,
                                    pArray[nn].pixelAspect,
                                    pCompDuration,
                                    pCompFrameRate        );

                        pComp_3.layers.add(pComp_2);

                        pQItem = app.project.renderQueue.items.add(pComp_3);

                        pQItem.outputModule(1).file = File(Folder.desktop.fsName + "/"+pComp_3.name);

                        // Comp2 25% Scaling
                        var pComp_4 = app.project.items.addComp(
                                    hsUtil.checkItemNameExists(pArray[nn].id + "_4_" + pArray[nn].name),
                                    pArray[nn].width,
                                    pArray[nn].height,
                                    pArray[nn].pixelAspect,
                                    pCompDuration,
                                    pCompFrameRate       );

                        pComp_4.layers.add(pComp_2);
                        pQItem = app.project.renderQueue.items.add(pComp_4);

                        //if(pQItem.outputModule(1).file == null) {
                            pQItem.outputModule(1).file = File(Folder.desktop.fsName + "/"+pComp_4.name);
                        //}

                        pRenderFlag = true;


                    } else {

                    }
                }


                if(pRenderFlag === true) {

                    hs_proxyManager.proxyRender(proxyOutputFolder,mp, sound, om, notrend);

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

        hs_proxyManager.version = "1.0.0_rc1";
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
