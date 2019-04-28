var http = require('http');
var WebSocketServer = require('websocket').server;
var userHandler = require('./userHandler');
var spotsyncUtils = require('./spotsyncUtils');

var connectionList = []

http.createServer(function(request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("Hello World");
    response.end();
}).listen(8888);

var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(1337, function() { });

// create the server
wsServer = new WebSocketServer({
	httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);
	connection.id = Math.floor(Math.random() * 1000000);
	connectionList[connection.id] = connection
    log(connection, "Hi from websocket server")
	connection.on('message', function(message) {
        try {
			if (message.type === 'utf8') {	
				logIncomming(connection, message.utf8Data)
	            var jsonRecv = JSON.parse(message.utf8Data);
	            switch(jsonRecv.type.toLowerCase()) {
	                case "exit":
	                	console.log(colorBgRed+"Restarting server"+colorReset)
	                    process.exit();
	                    break;
	                case "spotcode":
	                	connection.spotCode = jsonRecv.spotCode
	                	userHandler.newUser(connection)
	                    break;
	                case "spot-currentplaying":
	                	userHandler.currentInfo(connection)
	                    break;
	                case "spot-sync":
	                	userHandler.joinSync(connection, jsonRecv.userid)
	                	log(connection, "Syncing with: "+jsonRecv.userid)
	                    break;
	                case "utils-base64fromurl":
	                	spotsyncUtils.getBase64FromUrl(connection, jsonRecv.data, jsonRecv.dataid, function(id, base64){
	                		sendToConnection(connection, JSON.stringify({type:'utils-base64img', data:base64, dataid:id }))
	                	})
	                    break;
	                case "room-createroom":
	                	userHandler.createRoom(connection, jsonRecv.data)
	                    break;
	                case "room-addtrack":
	                	userHandler.addTrackToRoom(connection, jsonRecv.data)
	                    break;
	                case "room-skip":
	                	userHandler.roomSkipTrack(connection)
	                    break;
	                case "setsettings":
	                	userHandler.setSettings(connection, jsonRecv.data)
	                    break;
	                case "asdasdasdasdsd":
	                	userHandler.joinSync(connection, jsonRecv.userid)
	                    break;
	                case "asdasdasdasdsd":
	                	userHandler.joinSync(connection, jsonRecv.userid)
	                    break;
	                case "savetokens":
	                	userHandler.saveSpotSessions()
	                	log(connection, "saved Tokens")
	                    break;
	                default:
	                    log(connection, colorBgYellow+"Received unknow message: "+message.utf8Data+colorReset);
	            }
			}
        } catch (e) {
            console.log('Error: ', e);
            return;
        }
	});
	
	connection.on('close', function(connection) {
		connectionList[connection.id] = null
		console.log("Connection closed: ", connection)
	});
});


function log(connection, text){
    sendToConnection(connection, JSON.stringify({ type:'log', data: text }))
}
function logIncomming(connection, text){
    console.log(colorReset+"["+colorBgBlue+"incomming"+colorReset+"]"+colorFgCyan+connection.remoteAddress+colorReset+": "+text)
}
function sendToConnection(connection, text){
    //console.log(colorReset+"["+colorBgMagenta+"outgoing"+colorReset+"]"+colorFgCyan+connection.remoteAddress+colorReset+": "+text)
    connection.sendUTF(text)
}

var colorReset = "\x1b[0m"
var colorBright = "\x1b[1m"
var colorDim = "\x1b[2m"
var colorUnderscore = "\x1b[4m"
var colorBlink = "\x1b[5m"
var colorReverse = "\x1b[7m"
var colorHidden = "\x1b[8m"

var colorFgBlack = "\x1b[30m"
var colorFgRed = "\x1b[31m"
var colorFgGreen = "\x1b[32m"
var colorFgYellow = "\x1b[33m"
var colorFgBlue = "\x1b[34m"
var colorFgMagenta = "\x1b[35m"
var colorFgCyan = "\x1b[36m"
var colorFgWhite = "\x1b[37m"

var colorBgBlack = "\x1b[40m"
var colorBgRed = "\x1b[41m"
var colorBgGreen = "\x1b[42m"
var colorBgYellow = "\x1b[43m"
var colorBgBlue = "\x1b[44m"
var colorBgMagenta = "\x1b[45m"
var colorBgCyan = "\x1b[46m"
var colorBgWhite = "\x1b[47m"