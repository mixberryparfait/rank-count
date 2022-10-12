
$('#import').on('change', function () {
	var file = $(this).prop('files')[0];
	importFile(file);
});

function importFile(file) {
	var zipReader = new FileReader();
	zipReader.onload = function () {
		try {
			var zip = new Zlib.Zip();
			var zipArr = new Uint8Array(zipReader.result);
			var unzip = new Zlib.Unzip(zipArr);
			var importFileList = unzip.getFilenames();

			console.log(importFileList);

			for (var i in importFileList) {
				var content = utf8ArrayToStr(unzip.decompress(importFileList[i]));
				console.log(content);
				var lines = content.split(/\r\n|\n/);
				for(var j in lines) {
					if(lines[j].trim().length > 0 && !lines[j].endsWith(",1"))
						lines[j] += j == 0 ? ',1,1' : ',1,0';
				}
				content = lines.join("\n");

				zip.addFile(strToUtf8Array(content), {
					filename: strToUtf8Array(importFileList[i])
				});
			}

			var compressData = zip.compress();
			var blob = new Blob([compressData], { 'type': 'application/zip' });
			if (window.navigator.msSaveBlob) {
				window.navigator.msSaveBlob(blob, 'result.zip');
				window.navigator.msSaveOrOpenBlob(blob, 'result.zip');
			} else {
				$('body').append($('<a href="' + window.URL.createObjectURL(blob) + '">').text('download'));
			}

		} catch (e) {
			console.log(e.message);
		}
	}
	zipReader.readAsArrayBuffer(file);
}

function utf8ArrayToStr(array) {
	var len = array.length;
	var out = "";
	var i = 0;
	var char1, char2, char3;

	while (i < len) {
		char1 = array[i++];
		switch (char1 >> 4) {
			case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
			out += String.fromCharCode(char1);
			break;
			case 12: case 13:
			char2 = array[i++];
			out += String.fromCharCode(((char1 & 0x1F) << 6) | (char2 & 0x3F));
			break;
			case 14:
			char2 = array[i++];
			char3 = array[i++];
			out += String.fromCharCode(((char1 & 0x0F) << 12) |
				((char2 & 0x3F) << 6) |
				((char3 & 0x3F) << 0));
			break;
		}
	}
	return out;
}

function strToUtf8Array(str) {
	var n = str.length,
	idx = -1,
	bytes = [],
	i, j, c;

	for (i = 0; i < n; ++i) {
		c = str.charCodeAt(i);
		if (c <= 0x7F) {
			bytes[++idx] = c;
		} else if (c <= 0x7FF) {
			bytes[++idx] = 0xC0 | (c >>> 6);
			bytes[++idx] = 0x80 | (c & 0x3F);
		} else if (c <= 0xFFFF) {
			bytes[++idx] = 0xE0 | (c >>> 12);
			bytes[++idx] = 0x80 | ((c >>> 6) & 0x3F);
			bytes[++idx] = 0x80 | (c & 0x3F);
		} else {
			bytes[++idx] = 0xF0 | (c >>> 18);
			bytes[++idx] = 0x80 | ((c >>> 12) & 0x3F);
			bytes[++idx] = 0x80 | ((c >>> 6) & 0x3F);
			bytes[++idx] = 0x80 | (c & 0x3F);
		}
	}
	return bytes;
};