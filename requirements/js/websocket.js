var connection = null;
function setupWebSocket() {
    // if user is running mozilla then use it's built-in WebSocket
    loadingScreenType(LoadingScreenType.CONNECTING)
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    connection = new WebSocket('ws://'+window.location.hostname+':1337');

    connection.onopen = function () {
        console.log("Websocket connected")
        loadingScreenType(LoadingScreenType.CONNECTED)
    };

    connection.onerror = function (error) {
        console.log("Websocket error: ", error)
    };
    connection.onclose = function (error) {
        setTimeout(setupWebSocket, 500);
        console.log("Websocket closed")
        loadingScreenType(LoadingScreenType.CONNECTING)
    };

    connection.onmessage = function (message) {
        try {
            var json = JSON.parse(message.data);
            console.log(json)
            switch(json.type.toLowerCase()) {
                case "currentsong":
                    var d = json.data
                    console.log(d)
                    $(".info").html(""+
                        "Name: <a href='"+d.item.external_urls.spotify+"'>"+d.item.name +"</a>"+ "<br>" +
                        "Lengte: "+d.item.duration_ms/1000 + "<br>" +
                        "Huidige: "+d.progress_ms/1000 + "<br>" +
                        "Currently Playing: "+d.is_playing +  "<br>" 
                    )
                    break;
                case "log":
                    console.log(json.data);
                    break;
                case "updateuser":
                    var d = json.data;
                    updateUser(d.user_id, d.user_DisplayName, d.user_url, d.syncedWith_username, d.syncedWith_url, d.playing.name, d.playing.url, d.playing.album_img, d.playing.artist_name, d.playing.artist_url, d.playing.album_name, d.playing.album_url, d.playing.time, d.playing.totaltime, d.playing.isplaying)
                    if (true){
                        return true;
                    }
                    var idObj = 'oUser'+d.user_id;
                    var myElem = document.getElementById(idObj);
                    if (myElem === null){ $(".otherUsers").append("<div class=\"oUser\" id=\""+idObj+"\"> </div>") }
                    var minutes_playing = Math.floor(Math.round(d.playing.time/1000) / 60);
                    var seconds_playing = Math.round(d.playing.time/1000) - minutes_playing * 60;
                    var minutes_played = Math.floor(Math.round(d.playing.totaltime/1000) / 60);
                    var seconds_played = Math.round(d.playing.totaltime/1000) - minutes_played * 60;
                    if (isNaN(minutes_playing)) { minutes_playing = 0; }
                    if (isNaN(seconds_playing)) { seconds_playing = 0; }
                    if (isNaN(minutes_played)) { minutes_played = 0; }
                    if (isNaN(seconds_played)) { seconds_played = 0; }
                    if (d.playing.name == undefined) { d.playing.name = "Niks" }
                    if (d.playing.artist_name == undefined) { d.playing.artist_name = "Niks" }
                    if (d.playing.isplaying == undefined || d.playing.isplaying == false){ 
                        $("#"+idObj).html("<h1 style=\"margin: 0px;\">"+d.user_DisplayName+"</h1><h2 style=\"margin: 0px;\"> Speelt niks af </h2>"); 
                        if(d.user_id == showStatusFrom){
                            $("#currentSong").html("<h1>gepauzeerd</h1>"); 
                            $("#selectedUserName").html("<a target=\"_blank\" href=\""+d.user_url+"\">"+d.user_DisplayName+"</a>"); 
                            $("#currentListening").html("<a target=\"_blank\" href=\""+d.user_url+"\">"+d.user_DisplayName+"</a> -> <a target=\"_blank\" href=\""+d.syncedWith_url+"\">"+d.syncedWith_username+"</a>"); 
                        }
                    }else{
                        $("#"+idObj).html("")
                        $("#"+idObj).append("<h1 style=\"margin: 0px;\">"+d.user_DisplayName+"</h1>")
                        $("#"+idObj).append("<div class=\"OUser-Info\"><h2 style=\"margin: 0px;\"><a target=\"_blank\" href=\""+d.playing.url+"\">"+d.playing.name+"</a> - <a target=\"_blank\" href=\""+d.playing.artist_url+"\">"+d.playing.artist_name+"</a></h2>"+
                        "<div class=\"timer\">"+minutes_playing+":"+seconds_playing+"/"+minutes_played+":"+seconds_played+"</div>" +
                        "<div>Luistert mee met: "+d.syncedWith_username+"</div>" +
                        "<input class=\"inline\" type=\"submit\" value=\"Join\" onclick=\"connection.send(JSON.stringify({type:'spot-sync',userid:'"+d.user_id+"'}));\">" +
                        "<input class=\"inline\" type=\"submit\" value=\"Informatie weergeven\" onclick=\"showStatusFrom='"+d.user_id+"'\">" + 
                        "</div>");
                    }
                    if(d.user_id == showStatusFrom){
                        $("#currentSong").html("<a target=\"_blank\" href=\""+d.playing.url+"\">"+d.playing.name+"</a> - <a target=\"_blank\" href=\""+d.playing.artist_url+"\">"+d.playing.artist_name+"</a><br>"+minutes_playing+":"+seconds_playing+"/"+minutes_played+":"+seconds_played); 
                        $("#currentListening").html("<a target=\"_blank\" href=\""+d.user_url+"\">"+d.user_DisplayName+"</a> -> <a target=\"_blank\" href=\""+d.syncedWith_url+"\">"+d.syncedWith_username+"</a>");
                        $("#selectedUserName").html("<a target=\"_blank\" href=\""+d.user_url+"\">"+d.user_DisplayName+"</a>");  
                    }
                    break;
                case "spot-authorized":
                    if (json.data.startsWith("invalid_") == false){
                        $("#spotify-status").text("Spotify Login: code accepted")
                        $(".login-overlay").slideUp()
                        myId = json.data
                        showStatusFrom = myId
                    }else{
						var spotError = json.data.slice(8);
                        $("#spotify-status").text("Spotify Login error: ", spotError)
                    }
                    break;
                case "spot-playlists":
                    myPlayslists = json.data
                    $("#myplaylists").html('<label class="fa fa-times" onclick="$(\'#myplaylists\').toggle();"></label>')
                    Object.values(json.data).forEach(function(playList){
                        $("#myplaylists").append("<div class=\"myplaylists-playlist\">"+playList.name+
                            "<div class=\"myplaylists-songlist\" id=\"myplaylists-songlist"+playList.id+"\"></div></div>")
                        playList.tracks.forEach(function(track){
                            $("#myplaylists-songlist"+playList.id).append("<div class=\"myplaylists-song\"><input onclick=\"connection.send(JSON.stringify({type:'room-addtrack',data:'"+track.id+"'}));\" type=\"submit\" value=\"Toevoegen aan de queue\"> <a href=\""+track.href+"\" target=\"_blank\">"+track.name+"</a> - <a href=\""+track.artist_href+"\" target=\"_blank\">"+track.artist_name+"</a></div>")
                        })
                    })
                    $(".myplaylists-playlist").on('click', function(e) {
                        if (e.target !== this){ return; }
                        $('.myplaylists-songlist').slideUp(); 
                        $(this).children().first().slideDown()
                    });
                    break;
                case "rooms-update":
                    //rooms = json.data
                    //$("#rooms").html("")
                    var list = {}
                    Object.values(json.data).forEach(function(room){
                        list[room.name] = room
                        updateRoom(room.name, room.listeningUsers, room.currentTrack.trackName, room.currentTrack.album_img, room.currentTrack.artist_name, room.currentTrack.album_name, room.currentTrack.currentTime, room.currentTrack.endTime-room.currentTrack.startTime, room.tracks)
                        //$("#rooms").append("<div class=\"room\" id=\""+room.name+"\">"+room.name+"<input type=\"submit\" value=\"Join room\">")
                    })
                    rooms = list
                    break;
                case "utils-base64img":
                    albumColors = new AlbumColors(json.data)
                    albumColors.getColors(function(colors) {
                        console.log("user:",json.dataid,colors);
                        if (doesElementExist("user_"+json.dataid)){
                            $("#user_"+json.dataid).css("background-color", "rgba("+colors[0][0]+","+colors[0][1]+","+colors[0][2]+",1)");
                            $("#user_"+json.dataid+"_miniplayer_username").css("color", "rgba("+colors[1][0]+","+colors[1][1]+","+colors[1][2]+",1)");

                            $("#user_"+json.dataid+"_miniplayer_info_title").css("color", "rgba("+colors[2][0]+","+colors[2][1]+","+colors[2][2]+",1)");
                            $("#user_"+json.dataid+"_miniplayer_info_artist").css("color", "rgba("+colors[2][0]+","+colors[2][1]+","+colors[2][2]+",1)");
                            $("#user_"+json.dataid+"_miniplayer_info_album").css("color", "rgba("+colors[2][0]+","+colors[2][1]+","+colors[2][2]+",1)");
                            $("#user_"+json.dataid+"_miniplayer_progress_current").css("color", "rgba("+colors[2][0]+","+colors[2][1]+","+colors[2][2]+",1)");
                            $("#user_"+json.dataid+"_miniplayer_progress_total").css("color", "rgba("+colors[2][0]+","+colors[2][1]+","+colors[2][2]+",1)");
                        }
                        if (json.dataid.startsWith("room_")){
                            var roomName = json.dataid.slice(5);
                            console.log("Room colors", json.dataid)
                            if (doesElementExist("room_"+roomName)){
                            console.log("Room exists")
                                $("#room_"+roomName).css("background-color", "rgba("+colors[0][0]+","+colors[0][1]+","+colors[0][2]+",1)");
                                $("#room_"+roomName+"_users").css("color", "rgba("+colors[1][0]+","+colors[1][1]+","+colors[1][2]+",1)");

                                $("#room_"+roomName+"_miniplayer_info_title").css("color", "rgba("+colors[2][0]+","+colors[2][1]+","+colors[2][2]+",1)");
                                $("#room_"+roomName+"_miniplayer_info_artist").css("color", "rgba("+colors[2][0]+","+colors[2][1]+","+colors[2][2]+",1)");
                                $("#room_"+roomName+"_miniplayer_info_album").css("color", "rgba("+colors[2][0]+","+colors[2][1]+","+colors[2][2]+",1)");
                                $("#room_"+roomName+"_miniplayer_progress_current").css("color", "rgba("+colors[2][0]+","+colors[2][1]+","+colors[2][2]+",1)");
                                $("#room_"+roomName+"_miniplayer_progress_total").css("color", "rgba("+colors[2][0]+","+colors[2][1]+","+colors[2][2]+",1)");
                            }
                        }
                        // Result: [[254, 254, 254], [2, 138, 14], [4, 171, 21]]
                    });
                    break;
                case "sasdadaasdas":
                    console.log(json.data);
                    break;
                case "sasdadaasdas":
                    console.log(json.data);
                    break;
                case "sasdadaasdas":
                    console.log(json.data);
                    break;
                case "sasdadaasdas":
                    console.log(json.data);
                    break;
                case "sasdadaasdas":
                    console.log(json.data);
                    break;
                default:
                    console.log("Unknown message: ", json)
            }
        } catch (e) {
            console.log('Error: ', e);
            return;
        }
        // handle incoming message
    };
};
setupWebSocket()