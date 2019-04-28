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
                case "log":
                    console.log(json.data);
                    break;
                case "spot-authorized":
                    if (json.data.startsWith("invalid_") == false){
                        $("#spotify-status").text("Spotify Login: authorisatie goedgekeurd.")
                        $(".login-overlay").slideUp()
                        myId = json.data
                        showStatusFrom = myId
                    }else{
                        var spotError = json.data.slice(8);
                        $("#spotify-status").text("Spotify authorisatie-login error: ", spotError)
                    }
                    break;
                case "updateusers":
                    Object.values(json.data).forEach(function(d){
                        if(d.user_id === showStatusFrom){
                            if(d.syncedWith_username.startsWith("Room")){
                                $(".CPlayer-info2-listenswith").removeClass("fa-user").removeClass("fa-user-friends").addClass("fa-users").text(" "+d.syncedWith_username)
                            }else if(d.syncedWith_username == "Niemand"){
                                $(".CPlayer-info2-listenswith").removeClass("fa-users").removeClass("fa-user-friends").addClass("fa-user").text(" "+d.syncedWith_username)
                            }else{
                                $(".CPlayer-info2-listenswith").removeClass("fa-user").removeClass("fa-users").addClass("fa-user-friends").text(" "+d.syncedWith_username)
                            }
                        }
                        if(d != undefined && d.playing != undefined){
                            updateUser(d.user_id, d.user_DisplayName, d.user_url, d.syncedWith_username, d.syncedWith_url, d.playing.name, d.playing.url, d.playing.album_img, d.playing.artist_name, d.playing.artist_url, d.playing.album_name, d.playing.album_url, d.playing.time, d.playing.totaltime, d.playing.isplaying)
                        }
                    })
                    break;
                case "settings-update":
                    var settingsUpdate = json.data
                    var settings = ['miliseconds_correction_range']
                    $(".setSettings").html("")
                    Object.keys(settingsUpdate).forEach(function(key){
                        if(settings.includes(key)){
                            var value = settingsUpdate[key]
                            if(typeof value == "number"){
                                $(".setSettings").append('<label>'+key+'</label> <input type="number" id="setting_'+key+'" value="'+value+'"><br>')
                            }else{
                                $(".setSettings").append('<label>'+key+'</label> <input type="text" id="setting_'+key+'" value="'+value+'"><br>')
                            }
                        }
                    })
                    break;
                case "spot-playlists":
                    myPlayslists = json.data
                    // $("#myplaylists").html('<label class="fa fa-times" onclick="$(\'#myplaylists\').toggle();"></label>')
                    // Object.values(json.data).forEach(function(playList){
                    //     $("#myplaylists").append("<div class=\"myplaylists-playlist\">"+playList.name+
                    //         "<div class=\"myplaylists-songlist\" id=\"myplaylists-songlist"+playList.id+"\"></div></div>")
                    //     playList.tracks.forEach(function(track){
                    //         $("#myplaylists-songlist"+playList.id).append("<div class=\"myplaylists-song\"><input onclick=\"connection.send(JSON.stringify({type:'room-addtrack',data:'"+track.id+"'}));\" type=\"submit\" value=\"Toevoegen aan de queue\"> <a href=\""+track.href+"\" target=\"_blank\">"+track.name+"</a> - <a href=\""+track.artist_href+"\" target=\"_blank\">"+track.artist_name+"</a></div>")
                    //     })
                    // })
                    // $(".myplaylists-playlist").on('click', function(e) {
                    //     if (e.target !== this){ return; }
                    //     $('.myplaylists-songlist').slideUp(); 
                    //     $(this).children().first().slideDown()
                    // });
                    break;
                case "rooms-update":
                    var list = {}
                    Object.values(json.data).forEach(function(room){
                        list[room.name] = room
                        updateRoom(room.name, room.listeningUsers, room.currentTrack.trackName, room.currentTrack.album_img, room.currentTrack.artist_name, room.currentTrack.album_name, room.currentTrack.currentTime, room.currentTrack.endTime-room.currentTrack.startTime, room.tracks)
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