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


// hs_renderCore.aebat_fileExport(PATH_TO_BATCHFILE, BATCH_COMMAND_STR, BATCH_EXECUTE_FLAG, MAC_FLAG)
//
// exports aerender's command batch file, if BATCH_EXECUTE_FLAG was true,
// the batch file is going to execure immediately.
//

#includepath "./"
#include "HS_util.jsx"

var hs_renderCore = new Object();

hs_renderCore.aebat_fileExport =  function(path, battxt, batExecFlag, mac) {

	var batFile = new File(path);


	batFile.open("w");
	batFile.encoding =  hsUtil.checkOSEncode();
	batFile.write(battxt);
	batFile.close();

	if(mac === true) {
		system.callSystem("chmod u+x " + batFile.fsName);
	}
	//alert("File exported to:\ "+path);
	if(batExecFlag === true) {

		batFile.execute();
	}
    return;
}



// hs_renderCore.aerenderPath
//
// returns aerender command path(str).
// NOTICE: This return value is NOT file object.
// the string is converted SPACE to "\ "(back-slash and space) for Mac.
//


hs_renderCore.aerenderPath = function() {

    var aerenderFolderPath;
    var aeCommand;
    var aerenderCmdPath;

	if(parseFloat(app.version) < 8) {
		 alert("HS_renderCore.jsxinc supports AfterEffects CS3 or above.");
         return null;
	} else {

		if(hsUtil.osType() === "Mac"){ // Mac OS X

            aerenderFolderPath = Folder.startup.parent.parent.parent;
            //alert(aerenderFolderPath);
            aeCommand = File(aerenderFolderPath.fsName + "/aerender");


            if(aeCommand.exists){
                aerenderCmdPath = aeCommand.fsName.replace(/\\\s/g, " ");
                return aerenderCmdPath;
            } else {
                return null;
            }


		} else if(hsUtil.osType() === "Win") { //Windows
            aerenderFolderPath = Folder.startup;
            aeCommand = File(aerenderFolderPath + "\aerender.exe");

            if(aeCommand.exists){
                aerenderCmdPath = aeCommand.fsName;
                return aerenderCmdPath;

            } else {
                return null;
            }

		} else {

            alert("This OS is not supported") //...just'n case
            return null;

		}
    }
}


hs_renderCore.aebatMakeCommand = function(sound, memusage, imgcache, priority, mpOption, aep) {

    var cpuPriority;
    var cmdPath;
    var targetFile;
    var termHeader;
    var termFooter;
    var output;
    var prefixLangCode;
    var soundoption;
    var mp;

    if(sound === true) { soundoption = "-sound ON";}
    if(sound === false){ soundoption = "-sound OFF";}

    var hs_aebatFile = aep;
    var hs_aebat_memusage = "-mem_usage" + " " + memusage + " " + imgcache;

    //var cmdPath = hs_renderCore.aerenderPath();
    //alert(hs_aebatFile);

    if(parseFloat(app.version) >= 8 && mpOption === true) {
		mp = "-mp";
	} else if(parseFloat(app.version) >= 8 && mpOption === false) {
		mp = "";
	} else {
		mp ="";
	}


	if(hsUtil.osType() === "Mac"){

		if(priority === 1) { cpuPriority = "nice -20";
		} else if (priority === 2) { cpuPriority = "nice -10";
		} else if (priority === 3) { cpuPriority = "";
		} else { alert("Error: CPU Priority (hs_aebat_makeCmd)");
		}

        cmdPath = hs_renderCore.aerenderPath();
        targetFile = hs_aebatFile.fsName.replace(/\\\s/g, " ");
        termHeader = "\<?xml version=\"1.0\" encoding=\"UTF-8\"?\>\<!DOCTYPE plist PUBLIC \"-\/\/Apple Computer\/\/DTD PLIST 1.0\/\/EN\" \"http:\/\/www.apple.com\/DTDs\/PropertyList-1.0.dtd\"\>\<plist version=\"1.0\"\>\<dict\>\<key\>WindowSettings\<\/key\>\<array\>\<dict\>\<key\>AutoFocus\<\/key\>\<string\>YES\<\/string\>\<key\>Autowrap\<\/key\>\<string\>YES\<\/string\>\<key\>BackgroundImagePath\<\/key\>\<string\>\<\/string\>\<key\>Backwrap\<\/key\>\<string\>YES\<\/string\>\<key\>Bell\<\/key\>\<string\>YES\<\/string\>\<key\>BlinkCursor\<\/key\>\<string\>YES\<\/string\>\<key\>BlinkText\<\/key\>\<string\>YES\<\/string\>\<key\>CleanCommands\<\/key\>\<string\>rlogin\;telnet\;ssh\;slogin\<\/string\>\<key\>Columns\<\/key\>\<string\>80\<\/string\>\<key\>CursorShape\<\/key\>\<string\>1\<\/string\>\<key\>CustomTitle\<\/key\>\<string\>Terminal\<\/string\>\<key\>DeleteKeySendsBackspace\<\/key\>\<string\>NO\<\/string\>\<key\>DisableAnsiColors\<\/key\>\<string\>NO\<\/string\>\<key\>DoubleBold\<\/key\>\<string\>YES\<\/string\>\<key\>DoubleColumnsForDoubleWide\<\/key\>\<string\>NO\<\/string\>\<key\>DoubleWideChars\<\/key\>\<string\>YES\<\/string\>\<key\>EnableDragCopy\<\/key\>\<string\>YES\<\/string\>\<key\>ExecutionString\<\/key\>\<string\>";
        termFooter = "\<\/string\>\<key\>FontAntialiasing\<\/key\>\<string\>YES\<\/string\>\<key\>FontHeightSpacing\<\/key\>\<string\>1\<\/string\>\<key\>FontWidthSpacing\<\/key\>\<string\>1.023592\<\/string\>\<key\>IsMiniaturized\<\/key\>\<string\>NO\<\/string\>\<key\>KeyBindings\<\/key\>\<dict\>\<key\>$F708\<\/key\>\<string\>[25~\<\/string\>\<key\>$F709\<\/key\>\<string\>[26~\<\/string\>\<key\>$F70A\<\/key\>\<string\>[28~\<\/string\>\<key\>$F70B\<\/key\>\<string\>[29~\<\/string\>\<key\>$F70C\<\/key\>\<string\>[31~\<\/string\>\<key\>$F70D\<\/key\>\<string\>[22~\<\/string\>\<key\>$F70E\<\/key\>\<string\>[33~\<\/string\>\<key\>$F70F\<\/key\>\<string\>[34~\<\/string\>\<key\>$F729\<\/key\>\<string\>[H\<\/string\>\<key\>$F72B\<\/key\>\<string\>[F\<\/string\>\<key\>$F72C\<\/key\>\<string\>[5~\<\/string\>\<key\>$F72D\<\/key\>\<string\>[6~\<\/string\>\<key\>F704\<\/key\>\<string\>OP\<\/string\>\<key\>F705\<\/key\>\<string\>OQ\<\/string\>\<key\>F706\<\/key\>\<string\>OR\<\/string\>\<key\>F707\<\/key\>\<string\>OS\<\/string\>\<key\>F708\<\/key\>\<string\>[15~\<\/string\>\<key\>F709\<\/key\>\<string\>[17~\<\/string\>\<key\>F70A\<\/key\>\<string\>[18~\<\/string\>\<key\>F70B\<\/key\>\<string\>[19~\<\/string\>\<key\>F70C\<\/key\>\<string\>[20~\<\/string\>\<key\>F70D\<\/key\>\<string\>[21~\<\/string\>\<key\>F70E\<\/key\>\<string\>[23~\<\/string\>\<key\>F70F\<\/key\>\<string\>[24~\<\/string\>\<key\>F710\<\/key\>\<string\>[25~\<\/string\>\<key\>F711\<\/key\>\<string\>[26~\<\/string\>\<key\>F712\<\/key\>\<string\>[28~\<\/string\>\<key\>F713\<\/key\>\<string\>[29~\<\/string\>\<key\>F714\<\/key\>\<string\>[31~\<\/string\>\<key\>F715\<\/key\>\<string\>[32~\<\/string\>\<key\>F716\<\/key\>\<string\>[33~\<\/string\>\<key\>F717\<\/key\>\<string\>[34~\<\/string\>\<key\>F728\<\/key\>\<string\>[3~\<\/string\>\<key\>F729\<\/key\>\<string\>scrollToBeginningOfDocument:\<\/string\>\<key\>F72B\<\/key\>\<string\>scrollToEndOfDocument:\<\/string\>\<key\>F72C\<\/key\>\<string\>scrollPageUp:\<\/string\>\<key\>F72D\<\/key\>\<string\>scrollPageDown:\<\/string\>\<key\>^F702\<\/key\>\<string\>[5D\<\/string\>\<key\>^F703\<\/key\>\<string\>[5C\<\/string\>\<key\>~F704\<\/key\>\<string\>[17~\<\/string\>\<key\>~F705\<\/key\>\<string\>[18~\<\/string\>\<key\>~F706\<\/key\>\<string\>[19~\<\/string\>\<key\>~F707\<\/key\>\<string\>[20~\<\/string\>\<key\>~F708\<\/key\>\<string\>[21~\<\/string\>\<key\>~F709\<\/key\>\<string\>[23~\<\/string\>\<key\>~F70A\<\/key\>\<string\>[24~\<\/string\>\<key\>~F70B\<\/key\>\<string\>[25~\<\/string\>\<key\>~F70C\<\/key\>\<string\>[26~\<\/string\>\<key\>~F70D\<\/key\>\<string\>[28~\<\/string\>\<key\>~F70E\<\/key\>\<string\>[29~\<\/string\>\<key\>~F70F\<\/key\>\<string\>[31~\<\/string\>\<key\>~F710\<\/key\>\<string\>[32~\<\/string\>\<key\>~F711\<\/key\>\<string\>[33~\<\/string\>\<key\>~F712\<\/key\>\<string\>[34~\<\/string\>\<\/dict\>\<key\>Meta\<\/key\>\<string\>-1\<\/string\>\<key\>NSFixedPitchFont\<\/key\>\<string\>Monaco\<\/string\>\<key\>NSFixedPitchFontSize\<\/key\>\<real\>14\<\/real\>\<key\>OptionClickToMoveCursor\<\/key\>\<string\>NO\<\/string\>\<key\>PadBottom\<\/key\>\<string\>3\<\/string\>\<key\>PadLeft\<\/key\>\<string\>5\<\/string\>\<key\>PadRight\<\/key\>\<string\>3\<\/string\>\<key\>PadTop\<\/key\>\<string\>3\<\/string\>\<key\>RewrapOnResize\<\/key\>\<string\>YES\<\/string\>\<key\>Rows\<\/key\>\<string\>24\<\/string\>\<key\>SaveLines\<\/key\>\<string\>10000\<\/string\>\<key\>ScrollRegionCompat\<\/key\>\<string\>NO\<\/string\>\<key\>ScrollRows\<\/key\>\<string\>0\<\/string\>\<key\>Scrollback\<\/key\>\<string\>YES\<\/string\>\<key\>Scrollbar\<\/key\>\<string\>YES\<\/string\>\<key\>Shell\<\/key\>\<string\>\<\/string\>\<key\>ShellExitAction\<\/key\>\<string\>2\<\/string\>\<key\>StrictEmulation\<\/key\>\<string\>NO\<\/string\>\<key\>StringEncoding\<\/key\>\<string\>4\<\/string\>\<key\>TermCapString\<\/key\>\<string\>xterm-color\<\/string\>\<key\>TerminalOpaqueness\<\/key\>\<real\>0.86645126342773438\<\/real\>\<key\>TextColors\<\/key\>\<string\>0.857 0.857 0.857 0.000 0.000 0.405 1.000 1.000 1.000 1.000 1.000 1.000 0.000 0.000 0.405 0.857 0.857 0.857 0.097 0.401 0.776 0.945 0.949 1.000 \<\/string\>\<key\>TitleBits\<\/key\>\<string\>76\<\/string\>\<key\>Translate\<\/key\>\<string\>YES\<\/string\>\<key\>UseCtrlVEscapes\<\/key\>\<string\>YES\<\/string\>\<key\>VisualBell\<\/key\>\<string\>NO\<\/string\>\<key\>WinLocULY\<\/key\>\<string\>1083\<\/string\>\<key\>WinLocX\<\/key\>\<string\>662\<\/string\>\<key\>WinLocY\<\/key\>\<string\>0\<\/string\>\<key\>WindowCloseAction\<\/key\>\<string\>1\<\/string\>\<\/dict\>\<\/array\>\<\/dict\>\<\/plist\>";
        output = termHeader + cpuPriority +" \""+ cmdPath + "\" " + hs_aebat_memusage +" "+soundoption+" "+ mp +" " +"-project \""+ targetFile +"\""+ termFooter;

        //alert(output);
        return output;

	} else {

		if(priority === 1) { cpuPriority = "/low";
		} else if (priority === 2) { cpuPriority = "/belownormal";
		} else if (priority === 3) { cpuPriority = "/normal";
		} else { alert("Error: CPU Priority (hs_renderCore.aebatMakeCommand)");
		}
        cmdPath = Folder.startup.fsName;
        targetFile = hs_aebatFile.fsName;

        prefixLangCode = "";

        ($.locale === "ja_JP")? (prefixLangCode = "chcp 932") : (prefixLangCode = "");
        output = prefixLangCode+"\n"+"start \"aerender\" /W " + cpuPriority +" "+ prefixLangCode+"|"+ "\"" + cmdPath + "\\"+"aerender.exe\"" +" "+ hs_aebat_memusage +" "+ soundoption +" "+ mp +" "+ "-project "+ "\""+targetFile+"\"";
        return output;
    }


    //alert(output);
	return output;

}
