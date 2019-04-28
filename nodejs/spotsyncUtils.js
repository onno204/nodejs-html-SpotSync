exports.getBase64FromUrl = function(connection, url, id, cb){
	var request = require('request').defaults({ encoding: null });
	request.get(url, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
	        data = "data:" + response.headers["content-type"] + ";base64," + Buffer.from(body).toString('base64')
	        cb(id, data);
	    }
	});
}