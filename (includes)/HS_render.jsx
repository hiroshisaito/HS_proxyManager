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

var hs_render = new Object();

hs_render.chkRQueue = function(alrt) {
	var qIndex = 0;
	var qArray = new Array();
	var noQ = "There's no item in render queue.";
	var qQ = app.project.renderQueue.numItems;
	if(qQ >= 1) {
		for (var i = 1; i <= qQ; i++) {
			var cQ = app.project.renderQueue.items[i];
			if (cQ.status ==RQItemStatus.QUEUED) {
					qArray[qIndex] = cQ.comp;
					qIndex= qIndex+1;
			}
		}
	}
	if(qIndex < 1) {
			if(alrt === true) { alert(noQ); }
			qCheck = false;
			return null;
	} else {
			qCheck = true;
			return qArray;
	}
}
