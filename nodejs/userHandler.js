var users = {}
var rooms = {}
exports.createRoom = function(connection, roomName){
	if (rooms[roomName] == null){
		rooms[roomName] = {}
		rooms[roomName]['name'] = roomName
		rooms[roomName]['tracks'] = []
		rooms[roomName]['currentTrack'] = {
			trackID: undefined,
			startTime: (new Date().getTime()),
			currentTime: 0,
			endTime: (new Date().getTime() + 1000),
			trackLengthMS: 1000,
			trackName: "Geen nummer",
			album_img: "",
			album_name: "",
						uri: "",
			artist_name: "",
			trackId: "notPLaying"
		}
	}
}
exports.roomSkipTrack = function(connection){
	var roomName = getRoomFromCon(connection)
	if (roomName != null){
		var nextTrack = rooms[roomName]['tracks'].shift();
		rooms[roomName]['currentTrack'] = nextTrack
		rooms[roomName]['currentTrack'].startTime= (new Date().getTime())
		rooms[roomName]['currentTrack'].currentTime= 0
		rooms[roomName]['currentTrack'].endTime= (new Date().getTime() + nextTrack.trackLengthMS)
	}
}
exports.addTrackToRoom = function(connection, trackId){
	var roomName = getRoomFromCon(connection)
	if (roomName != null){
		var userData = users[connection.id]
		userData['spotSyncAPI'].getSongInfo(trackId, function(data){
			var album_img = ""
			if (data.album['images'].length >= 1){
				album_img = data.album['images'][0]['url']
			}
			rooms[roomName]['tracks'].push({
				album_img: album_img,
				album_name: data.album.name,
				artist_name: data.artists[0].name,
				uri: data.external_urls.spotify,
				trackId: data.id,
				trackLengthMS: data.duration_ms,
				trackName: data.name
			})
		})
		
	}
}
//Room timers
setInterval(function(){
	Object.values(rooms).forEach(function(roomInfo){
		rooms[roomInfo.name]['currentTrack'].currentTime += 500
		var currentTrack = roomInfo['currentTrack']
		if(currentTrack.currentTime >= currentTrack.trackLengthMS){
			if(roomInfo['tracks'].length <= 0){
				rooms[roomInfo.name]['currentTrack'] = {
					trackID: undefined,
					startTime: (new Date().getTime()),
					currentTime: 0,
					trackLengthMS: 1000,
					endTime: (new Date().getTime() + 1000),
					trackName: "Geen nummer",
					album_img: "",
					album_name: "",
					uri: "",
					artist_name: "",
					trackId: "nothingPlaying",
				}
				if(exports.getUsersInRoom(roomInfo.name).length <= 0){
					rooms[roomInfo.name]['currentTrack'].afkTimer += 1
				}
				if(rooms[roomInfo.name]['currentTrack'].afkTimer >= 600){
					delete rooms[roomInfo.name]
				}
			}else{
				rooms[roomInfo.name]['currentTrack'].afkTimer = 0
				var nextTrack = roomInfo['tracks'].shift();
				rooms[roomInfo.name]['currentTrack'] = nextTrack
				rooms[roomInfo.name]['currentTrack'].startTime= (new Date().getTime())
				rooms[roomInfo.name]['currentTrack'].currentTime= 0
				rooms[roomInfo.name]['currentTrack'].endTime= (new Date().getTime() + nextTrack.trackLengthMS)
			}
		}
	})
}, 500)
setInterval(function(){
	var rtnRoomObj = []
	Object.values(rooms).forEach(function(roomInfo){
	    roomInfo['listeningUsers'] = exports.getUsersInRoom(roomInfo.name)
		rtnRoomObj.push(roomInfo)
	})
	sendToAllConnections(JSON.stringify({type:"rooms-update", data:rtnRoomObj}))
}, 2000)
exports.getUsersInRoom = function(roomName){
	var listeningUser = []
    Object.values(users).forEach(function(userData){
    	if(userData['syncedWith']['userID'] == "room_"+roomName){
    		listeningUser.push(userInfos[userData['spotSyncAPI'].settings['userid']])
    	}
    })
	return listeningUser
}

exports.newUser = function(connection){
	exports.createArraytable(connection.id, connection)
    users[connection.id]['spotSyncAPI'].setup(connection, function(cbRemoveOldUsers){
    	if(typeof cbRemoveOldUsers == "string"){
			sendToConnection(connection, JSON.stringify({type:'spot-authorized', data:"invalid_"+cbRemoveOldUsers }))
    	}else{
		    Object.values(users).forEach(function(userData){
		    	if (userData['connection'] == null){
		    		userData['connection'] = []
		    		userData['connection']['id'] = 0
		    	}
		    	if (userData['connection'].id != connection.id){
		        	if (userData['spotSyncAPI'].settings['userid'] == cbRemoveOldUsers.id){
					    users[connection.id]['syncedWith']['userID'] = userData['syncedWith']['userID'];
					    users[connection.id]['syncedWith']['init'] = userData['syncedWith']['init'];
					    users[connection.id]['settings'] = userData['settings'];
					    users[userData.id]['spotSyncAPI'].destoryClass();
		        		delete users[userData.id];
		        		log(connection, "Removed old authorized user")
		        	}
		        }
		    });
			sendToConnection(connection, JSON.stringify({type:'spot-authorized', data:cbRemoveOldUsers.id }))
	        users[connection.id]['spotSyncAPI'].getSongsAndPlaylists(function(playlistsAndSongs){
				sendToConnection(connection, JSON.stringify({type:'spot-playlists', data:playlistsAndSongs }))
	        })
			exports.sendSettingsToConnection(connection)
	    	exports.saveSpotSessions()
    	}
    })
}
exports.sendSettingsToConnection = function(connection){
	sendToConnection(connection, JSON.stringify({type:'settings-update', data:users[connection.id]['settings'] }))
}
exports.setSettings = function(connection, settings){
    var customSettingList = ['miliseconds_correction_range']
    Object.keys(settings).forEach(function(key){
        if(customSettingList.includes(key)){
            users[connection.id]['settings'][key] = settings[key]
        }
    })
    exports.sendSettingsToConnection(connection)
}

exports.createArraytable = function(id, connection){
    users[id] = [];
    users[id]['connection'] = connection;
    users[id]['syncedWith'] = [];
    users[id]['id'] = id;
    users[id]['syncedWith']['userID'] = "Niemand";
    users[id]['syncedWith']['userName'] = "Niemand";
    users[id]['syncedWith']['userurl'] = "";
    users[id]['syncedWith']['init'] = false;
	users[id]['syncedWith']['timer'] = 0
	users[id]['settings'] = {}
	users[id]['settings']['miliseconds_correction_range'] = 1000
    users[id]['spotSyncAPI'] = new (require('./spotSyncAPI')).spotAPI();
}

exports.currentInfo = function(connection){
	users[connection.id]['spotSyncAPI'].getCurrentSong(function(cbData){
   		sendToConnection(connection, JSON.stringify({type:'currentSong', data:cbData }))
	})
}

exports.joinSync = function(connection, userID){
	users[connection.id]['syncedWith']['timer'] = 0
    users[connection.id]['syncedWith']['userID'] = userID;
    users[connection.id]['syncedWith']['userurl'] = "";
    users[connection.id]['syncedWith']['userName'] = userID;
    users[connection.id]['syncedWith']['init'] = false;
}


/////////////////////////////////////////////////////////////////////////////
///                     SAVES
/////////////////////////////////////////////////////////////////////////////

const fs = require('fs');
exports.saveSpotSessions = function(){
	var uDateSave = []
    Object.values(users).forEach(function(userData){
    	if (userData['spotSyncAPI'].settings['refresh_token'] != null){
    		userData['settings']['token'] = userData['spotSyncAPI'].settings['refresh_token']
    		userData['settings']['username'] = userData['spotSyncAPI'].settings['userInfo']['display_name']
	    	uDateSave.push(userData['settings']);
	    }
		var data = JSON.stringify(userData['settings']);  
		fs.writeFileSync("saves/"+userData['settings']['username']+".json", data); 
		console.log("Saving: ", data) 
    })
}
exports.loadspotSessions = function(){
	exports.getSavedSessions(function(savedSessionsNames){
		savedSessionsNames.forEach(function(fileName){
			var rawdata = fs.readFileSync("saves/"+fileName);  
			var loadedSettings = JSON.parse(rawdata)
			if (loadedSettings.token != null){
		    	var newID = Math.floor(Math.random() * 1000000)
		    	var OldUsers = users
		    	var userCounter = 0
		    	exports.createArraytable(newID, null)
    			Object.keys(loadedSettings).forEach(function(key){
    				users[newID]['settings'][key] = loadedSettings[key]
    			})
			    users[newID]['spotSyncAPI'].setup(null, function(cbRemoveOldUsers){
				    Object.values(users).forEach(function(userData){
			        	if (userData['spotSyncAPI'].settings['userid'] == cbRemoveOldUsers.id){
						    userCounter += 1
			        	}
				    });
				    if(userCounter >= 2){
					    users[newID]['spotSyncAPI'].destoryClass();
		        		delete users[newID];
		        		log(null, "Removed new-old authorized user")
				    }
			    }, access_token= loadedSettings.token)
		    }
		})
	})
}

exports.getSavedSessions = function(cb){
	fs.readdir("saves/", (err, files) => {
		cb(files)
	});
}
exports.loadspotSessions()


var userInfos = {}
setInterval(function(){ 
	sendToAllConnections(JSON.stringify({type:'updateUsers', data:userInfos}));
    Object.values(users).forEach(function(userData){
		//console.log("ID: ", userData['spotSyncAPI'].testID)
    	var userID = userData['spotSyncAPI'].settings['userid']
    	if (userID != null){
    		if(userInfos[userID] == undefined){
	    		userInfos[userID] = {}
	    	}
	    	var continueProsess = true;
	    	if(userInfos[userID]['playing'] != undefined && userInfos[userID]['syncedWith_username'] == "Niemand"){
	    		if (userInfos[userID]['playing']['isplaying'] == false){
	    			if(userInfos[userID]['playing']['lastUpdated'] != undefined){
	    				if(userInfos[userID]['playing']['lastUpdated'] >= (new Date().getTime()-30000)){
	    					continueProsess = false;
	    				}
	    			}
	    		}
	    	}
	    	if (continueProsess){
		    	if (userData['spotSyncAPI'].settings['userInfo']['images'][0] != null){
					userInfos[userID]['user_Img'] = userData['spotSyncAPI'].settings['userInfo']['images'][0]['url']
				}else{
					userInfos[userID]['user_Img'] = ""
				}
				userInfos[userID]['user_Href'] = userData['spotSyncAPI'].settings['userInfo']['href']
				userInfos[userID]['user_url'] = userData['spotSyncAPI'].settings['userInfo']['external_urls']['spotify']
				userInfos[userID]['user_img'] = ""
				if (userData['spotSyncAPI'].settings['userInfo']['images'].length >= 1){
					userInfos[userID]['user_img'] = userData['spotSyncAPI'].settings['userInfo']['images'][0]['url']
				}
				userInfos[userID]['syncedWith_id'] = userData['syncedWith']['userID']
				userInfos[userID]['syncedWith_username'] = userData['syncedWith']['userName']
				userInfos[userID]['syncedWith_url'] = userData['syncedWith']['userurl']
				userInfos[userID]['user_DisplayName'] = userData['spotSyncAPI'].settings['userInfo']['display_name']
				userInfos[userID]['user_id'] = userID
				userData['spotSyncAPI'].getCurrentSong(function(cbData){ 
					userInfos[userID]['playing'] = {};
					if (cbData.item != null) {
						userInfos[userID]['playing']['name'] = cbData.item.name;
						userInfos[userID]['playing']['url'] = cbData.item.external_urls.spotify;
						userInfos[userID]['playing']['time'] = cbData.progress_ms;
						userInfos[userID]['playing']['totaltime'] = cbData.item.duration_ms;
						userInfos[userID]['playing']['isplaying'] = cbData.is_playing;
						userInfos[userID]['playing']['artist_name'] = cbData.item.artists[0].name;
						userInfos[userID]['playing']['artist_url'] = cbData.item.artists[0].uri;
						userInfos[userID]['playing']['album_name'] = cbData.item.album.name;
						userInfos[userID]['playing']['album_url'] = cbData.item.album.uri;
						userInfos[userID]['playing']['album_img'] = ""
						userInfos[userID]['playing']['lastUpdated'] = (new Date().getTime())
						if (cbData.item.album['images'].length >= 1){
							userInfos[userID]['playing']['album_img'] = cbData.item.album['images'][0]['url']
						}
					}
					//Send currently playing update to everyone
					// sendToAllConnections(JSON.stringify({type:'updateUser', data:userInfos[userID] }));

					// Listen allong
	    			Object.values(users).forEach(function(userData2){
	    				if ((userData2['syncedWith']['userID'] != null) && (userData2['syncedWith']['userID'] == userID)){
	    					users[userData2.id]['syncedWith']['userName'] = userData['spotSyncAPI'].settings['userInfo']['display_name']
	    					users[userData2.id]['syncedWith']['userurl'] = userData['spotSyncAPI'].settings['userInfo']['external_urls']['spotify']
							users[userData2.id]['spotSyncAPI'].getCurrentSong(function(cbData2){ 
								if (cbData.item == undefined){
									cbData.item = {
										external_urls: {
											spotify: ""
										}
									}
								}
								if (cbData2.item == undefined){
									cbData2.item = {
										external_urls: {
											spotify: ""
										}
									}
								}
								syncUserWithSong(userData2.id, cbData.item.external_urls.spotify, cbData2.item.external_urls.spotify, cbData.progress_ms, cbData2.progress_ms, cbData2.is_playing)
							});
	    				}
	    			})

					if ((userData['syncedWith']['userID'] != null) && (userData['syncedWith']['userID'].startsWith("room_"))){
						var roomName = userData['syncedWith']['userID'].slice(5);
						users[userData.id]['syncedWith']['userName'] = "Room " + roomName
						users[userData.id]['syncedWith']['userurl'] = "#"
						var currentTrack = rooms[roomName]['currentTrack']
						if (currentTrack.trackLengthMS != 1000){
							if (cbData.item == undefined){
								syncUserWithSong(userData.id, currentTrack.uri, "", currentTrack.currentTime, cbData.progress_ms, false)
							}else{
								syncUserWithSong(userData.id, currentTrack.uri, cbData.item.external_urls.spotify, currentTrack.currentTime, cbData.progress_ms, cbData.is_playing)
							}
						}

					}
				})
			}
		}
    });
    //console.log(Object.keys(users).length)
}, 3000);
function getRoomFromCon(connection){
	var userData = users[connection.id]
	if ((userData['syncedWith']['userID'] != null) && (userData['syncedWith']['userID'].startsWith("room_"))){
		var roomName = userData['syncedWith']['userID'].slice(5);
		return roomName
	}
	return null
}
function syncUserWithSong(userID, originalURL, currentURL, orTiming, curTiming, isPlaying){
	if(isPlaying == false && users[userID]['syncedWith']['timer'] <= (new Date().getTime() - 6000)){
		if (users[userID]['syncedWith']['init'] == true){
			users[userID]['syncedWith']['userID'] = null;
		}
	}else if(isPlaying == true){
		users[userID]['syncedWith']['timer'] = new Date().getTime()
	}
	if (users[userID]['syncedWith']['init'] == false){
		users[userID]['spotSyncAPI'].playSong(originalURL)
	    users[userID]['syncedWith']['init'] = true;
	}
	if(originalURL != undefined){
		if (currentURL == undefined){
			users[userID]['spotSyncAPI'].playSong(originalURL)
			setTimeout(function(){
				users[userID]['spotSyncAPI'].setTiming(orTiming+600)
			},500)
		}else if (currentURL == undefined){ 
			users[userID]['spotSyncAPI'].playSong(originalURL)
			setTimeout(function(){
				users[userID]['spotSyncAPI'].setTiming(orTiming+600)
			},500)
		}else if (originalURL != currentURL){
			users[userID]['spotSyncAPI'].playSong(originalURL)
			setTimeout(function(){
				users[userID]['spotSyncAPI'].setTiming(orTiming+600)
			},500)
		}
		if ((curTiming ==undefined ) || orTiming-users[userID]['settings']['miliseconds_correction_range']+500 >= curTiming || orTiming+users[userID]['settings']['miliseconds_correction_range']+500 <= curTiming){
			setTimeout(function(){
				users[userID]['spotSyncAPI'].setTiming(orTiming+600)
			},500)
		}
	}
}

setInterval(function(){ 
    Object.values(users).forEach(function(userData){
    	if(userData['spotSyncAPI'].settings != null){
	    	if(userData['spotSyncAPI'].settings['userInfo'] != null){
		    	if(userData['spotSyncAPI'].settings['userInfo']['display_name'] != null){
			    	if(userData['spotSyncAPI'].settings['userInfo']['display_name'] != "Null"){
			    		userData['spotSyncAPI'].refreshToken()
			    	}
		    	}
		    }
	    }
    })
}, 59*60*1000)














//Connection logging
function log(connection, text){
    sendToConnection(connection, JSON.stringify({ type:'log', data: text }))
}
function sendToConnection(connection, text){
    if (connection != null){
	    //console.log(colorReset+"["+colorBgMagenta+"outgoing"+colorReset+"]"+colorFgCyan+connection.remoteAddress+colorReset+": "+text)
	    connection.sendUTF(text)
    }else{
        console.log("[ConNull]", text)
    }
}
function sendToAllConnections(text){
    Object.values(users).forEach(function(userData){
        if (userData.connection != null && userData.connection.state == "open"){
            sendToConnection(userData.connection, text);
        }
    });
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