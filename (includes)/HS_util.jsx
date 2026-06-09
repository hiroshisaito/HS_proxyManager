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


var hsUtil = new Object();


hsUtil.osType = function() {

    if($.os.match("Mac")== "Mac") {
        return "Mac";
    } else if($.os.match("Win")== "Win") {
        return "Win";
    } else {
        return null;
    }
}


hsUtil.checkOSEncode = function() {

    var myEncoding;
	if(hsUtil.osType() === "Win") {
		myEncoding = ($.locale === "ja_JP") ? "CP932" : "ASCII";
	} else if(hsUtil.osType() === "Mac") {
		myEncoding = "UTF-8";
	} else {
        myEncoding = null;
    }
	return myEncoding;
}


hsUtil.getDateStamp = function(sep) {

	var today = new Date();
	var strYear = today.getFullYear().toString();
	var numMonth = (today.getMonth()+1);
	var numDate =today.getDate();

	if(numMonth < 10){
		var strMonth = "0"+ numMonth.toString();
	} else {
		var strMonth = numMonth.toString();
	}

	if(numDate < 10){

		var strDate = "0"+numDate.toString();
	} else {
		var strDate = numDate.toString();
	}

	if(sep === null){ sep = "/";}
	var dateStamp = strYear  +sep+ strMonth  +sep+ strDate;
	return dateStamp;
}


// Prefer $.locale for new code.
hsUtil.chkJPN = function() {

	if(app.language == 1613) {
		return true;
	} else {
		return false;
	}
}


hsUtil.checkMethod = function(methodDescription){

	if(methodDescription){
		 return true;
	}
	if(!methodDescription){
		return false;
	}
}


hsUtil.getIndex = function(itemName){

	var i;
	for (i=1; i<=app.project.items.length; i++){
		if (app.project.items[i].name == itemName)
		return i;
	}

	return -1;

}

hsUtil.checkItemNameExists = function(chkItemName){

	if(hsUtil.getIndex(chkItemName) < 0) {
		return chkItemName;
	} else {
		for(var exNum = 1; 0 < hsUtil.getIndex(chkItemName+"_"+exNum); exNum++) {};
		var newName = chkItemName + "_" + exNum;
		return newName;
	}
}

hsUtil.loadPref = function(file){

    if(file.exists){

        var opened = file.open("r");
        if(!opened){ return null; }
        var fileContent = file.read();
        file.close();

        return fileContent;

    } else {
        return null;
    }

}

hsUtil.savePref = function(file, folder, confTxt) {

    if(!folder.exists) {
        var created = folder.create();
        if(!created || !folder.exists){
            alert("Could not create preference folder:\n" + folder.fsName);
            return null;
        }
    }

    var opened = file.open("w");   // "w" truncates existing content.
    if(!opened){
        return null;
    }

    var wrote = file.write(confTxt);
    file.close();

    if(!wrote){
        return null;
    }

    return file;

}
