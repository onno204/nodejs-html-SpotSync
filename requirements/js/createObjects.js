function getTimeFromSeconds(mstime, inString = true){
    var minutes = Math.floor(Math.round(mstime/1000) / 60);
    var seconds = Math.round(mstime/1000) - minutes * 60;
    if (isNaN(minutes)) { minutes = 0; }
    if (isNaN(seconds)) { seconds = 0; }
    if(inString){
    	minutes = minutes.toString();
    	seconds = seconds.toString();
    	if(minutes.length <= 1){ minutes = minutes; }
    	if(seconds.length <= 1){ seconds = "0"+seconds; }
    }
    return [minutes, seconds];
}
function createTimeText(mstime){
	var minutes = getTimeFromSeconds(mstime)[0] 
	var seconds = getTimeFromSeconds(mstime)[1]
	return minutes+":"+seconds;
}
function createAhref(text, href, objClass="", id=""){
	return "<a target=\"_blank\" href=\""+href+"\" class=\""+objClass+"\">"+text+"</a>";
}
function createButton(text, onclick, objClass="", id=""){
	return "<input class=\"inline "+objClass+"\" type=\"submit\" value=\""+text+"\" id=\""+id+"\" onclick=\""+onclick+"\">";
}
function doesElementExist(id){
	return document.getElementById(id) != null
}
function newTabClick(href){	return " onclick=\""+newTab(href)+"\" " }
function newTab(href){	return "window.open('"+href+"','_blank')" }

function showQueueFromroom(roomName){
	$('#queue').html("<input type='submit' class='buttonNoBorder' value='Queue weergave sluiten' onclick=\"$('#queue').toggle();\">");
	Object.values(rooms[roomName].tracks).forEach(function(track){
    	addToQueue(track.album_img, track.trackName, track.artist_name, track.album_name, track.trackLengthMS)
	})
	$('#queue').toggle();
}

function updateRoom(roomName, users, songName, songImg, artistName, albumName, songCurrentTime, songTotalTime, tracks){
    var idObj = 'room_'+roomName;
    idObj = replaceAll(idObj, " ", "_")
    var CTime = createTimeText(songCurrentTime)
	var TTime = createTimeText(songTotalTime)
    if (!doesElementExist(idObj)){ $(".rooms").append("<div class=\"room\" id=\""+idObj+"\"></div>"); }
    if (!doesElementExist(idObj+"_roomplayer")){ $("#"+idObj).append("<div class=\"room-player\" id=\""+idObj+"_roomplayer\"></div>"); }

    if (!doesElementExist(idObj+"_roomplayer_miniplayer")){ $("#"+idObj+"_roomplayer").append("<div class=\"miniplayer\" id=\""+idObj+"_roomplayer_miniplayer\"></div>"); }
    if (!doesElementExist(idObj+"_miniplayer_img")){ 
    	$("#"+idObj+"_roomplayer_miniplayer").append("<img src=\""+songImg+"\" class=\"miniplayer-img\" id=\""+idObj+"_miniplayer_img\">"); 
    	connection.send(JSON.stringify({type:'utils-base64fromurl',data:songImg, dataid:"room_"+roomName }));
    }else{
		$("#"+idObj+"_miniplayer_img").html("<img src=\""+songImg+"\" class=\"miniplayer-img\" id=\""+idObj+"_miniplayer_img\">"); 
    	if($("#"+idObj+"_miniplayer_img").attr("src") != songImg){
    		$("#"+idObj+"_miniplayer_img").attr("src", songImg)
        	connection.send(JSON.stringify({type:'utils-base64fromurl',data:songImg, dataid:"room_"+roomName }));
    	}
	}
    if (!doesElementExist(idObj+"_miniplayer_info")){ $("#"+idObj+"_roomplayer_miniplayer").append("<div class=\"miniplayer-info\" id=\""+idObj+"_miniplayer_info\"></div>"); }
    if (!doesElementExist(idObj+"_miniplayer_info_title")){ 
    	$("#"+idObj+"_miniplayer_info").append("<div class=\"miniplayer-info-title\" id=\""+idObj+"_miniplayer_info_title\">"+songName+"</div>"); 
    }else{
    	$("#"+idObj+"_miniplayer_info_title").text(songName)
	}
    if (!doesElementExist(idObj+"_miniplayer_info_artist")){ 
    	$("#"+idObj+"_miniplayer_info").append("<div class=\"miniplayer-info-artist\" id=\""+idObj+"_miniplayer_info_artist\">"+artistName+"</div>"); 
	}else{
    	$("#"+idObj+"_miniplayer_info_artist").text(artistName)
	}
    if (!doesElementExist(idObj+"_miniplayer_info_album")){ 
    	$("#"+idObj+"_miniplayer_info").append("<div class=\"miniplayer-info-album\" id=\""+idObj+"_miniplayer_info_album\">"+albumName+"</div>"); 
	}else{
    	$("#"+idObj+"_miniplayer_info_album").text(albumName)
	}
    if (!doesElementExist(idObj+"_miniplayer_progress")){ $("#"+idObj+"_roomplayer_miniplayer").append("<div class=\"miniplayer-progress\" id=\""+idObj+"_miniplayer_progress\"></div>"); }
    if (!doesElementExist(idObj+"_miniplayer_progress_bar")){ 
    	$("#"+idObj+"_miniplayer_progress").append("<div class=\"miniplayer-progress-bar\" id=\""+idObj+"_miniplayer_progress_bar\" style=\"width:"+(songCurrentTime/songTotalTime)*100+"%\"></div>"); 
    }else{
    	$("#"+idObj+"_miniplayer_progress_bar").attr("style", "width:"+(songCurrentTime/songTotalTime)*100+"%"); 
    }
    if (!doesElementExist(idObj+"_miniplayer_progress_current")){ 
    	$("#"+idObj+"_roomplayer_miniplayer").append("<div class=\"miniplayer-progress-current\" id=\""+idObj+"_miniplayer_progress_current\">"+CTime+"</div>"); 
	}else{
    	$("#"+idObj+"_miniplayer_progress_current").text(CTime)
	}
    if (!doesElementExist(idObj+"_miniplayer_progress_total")){ 
    	$("#"+idObj+"_roomplayer_miniplayer").append("<div class=\"miniplayer-progress-total\" id=\""+idObj+"_miniplayer_progress_total\">"+TTime+"</div>"); 
	}else{
    	$("#"+idObj+"_miniplayer_progress_total").text(TTime)
	}

    if (!doesElementExist(idObj+"_users")){ 
    	$("#"+idObj).append("<hr><div class=\"room-users\" id=\""+idObj+"_users\"></div>"); 
    }else{
    	var usersString = "";
    	Object.values(users).forEach(function(user){
	    	usersString += user.user_DisplayName+"<br>"
		})
    	$("#"+idObj+"_users").html(usersString)
    }

	$("#"+idObj).hover(function() {
		$(".randomOverlay").width($(this).outerWidth()).height($(this).outerHeight()).css('left', ($(this).offset().left)).css('top', ($(this).offset().top)).css('background-color', "rgba(0,0,0,0.8)")
		$(".randomOverlay").html("<div class='options-room'>"+
			"<div title='Mee luisteren' class='fa fa-headphones-alt inline' onclick=\"connection.send(JSON.stringify({type:'spot-sync',userid:'room_"+roomName+"'})); $('.randomOverlay').fadeOut();\"></div>"+
			"<div title='Queue' class='fa fa-list inline' onclick=\"showQueueFromroom('"+roomName+"'); $('.randomOverlay').fadeOut();\"></div>"+
			"<div title='add song to Queue' class='fa fa-plus-circle inline' onclick=\"$('#myplaylists').toggle(); $('.randomOverlay').fadeOut();\"></div>"+
			"<div title='Volgende Nummer' class='fa fa-forward inline' onclick=\"connection.send(JSON.stringify({type:'room-skip',data:'123'})); $('.randomOverlay').fadeOut();\"></div>"+
			"</div>")
		$(".randomOverlay").fadeIn()
		$(".randomOverlay").hover(function() { }, function() {
			$(".randomOverlay").fadeOut()
		});
	});

    if(idObj == showStatusFrom){
    	if(songName == undefined || (currentlyPlaying==false)){
	    	$("#cPlaying_miniplayer_progress_bar").attr("style", "width:100%");
	    	$("#cPlaying_miniplayer_progress_current").text("00:00")
	    	$("#cPlaying_miniplayer_progress_total").text("00:00")
	    	$("#cPlaying_miniplayer_info_title").text("-").attr("onclick", "")
	    	$("#cPlaying_miniplayer_info_artist").text("-").attr("onclick", "")
	    	$("#cPlaying_miniplayer_info_album").text("-").attr("onclick", "")

	    	if($("#cPlaying_miniplayer_img").attr("src") != songImg){
	    		$("#cPlaying_miniplayer_img").attr("src", songImg)
	    	}
	    	$("#cPlaying_syncUsername").removeClass("fa-user").removeClass("fa-users").addClass("fa-user-friends").text(" "+syncedUsername).attr("onclick", newTab(syncedHref))
    	}else{
	    	var CTime = createTimeText(songCurrentTime)
	    	var TTime = createTimeText(songTotalTime)
	    	$("#cPlaying_miniplayer_progress_bar").attr("style", "width:"+(songCurrentTime/songTotalTime)*100+"%");
	    	$("#cPlaying_miniplayer_progress_current").text(CTime)
	    	$("#cPlaying_miniplayer_progress_total").text(TTime)

	    	$("#cPlaying_miniplayer_info_title").text(songName).attr("onclick", newTab("#"))
	    	$("#cPlaying_miniplayer_info_artist").text(artistName).attr("onclick", newTab("#"))
	    	$("#cPlaying_miniplayer_info_album").text(albumName).attr("onclick", newTab("#"))
	    	if(syncedUsername.startsWith("Room")){
	    		$("#cPlaying_syncUsername").removeClass("fa-user").removeClass("fa-user-friends").addClass("fa-users").text(" "+syncedUsername).attr("onclick", newTab(syncedHref))
	    	}else if(syncedUsername == "Niemand"){
	    		$("#cPlaying_syncUsername").removeClass("fa-users").removeClass("fa-user-friends").addClass("fa-user").text(" "+syncedUsername).attr("onclick", newTab(syncedHref))
	    	}else{
	    		$("#cPlaying_syncUsername").removeClass("fa-user").removeClass("fa-users").addClass("fa-user-friends").text(" "+syncedUsername).attr("onclick", newTab(syncedHref))
	    	}
    	}
    }
}





function updateUser(userID, username, userHref, syncedUsername, syncedHref, songName, songHref, songImg, artistName, artistHref, albumName, albumHref, songCurrentTime, songTotalTime, currentlyPlaying){
    var idObj = 'user_'+userID;
    if(songName == undefined || (currentlyPlaying==false)){
	    if (doesElementExist(idObj)){ $(idObj).remove() }
    }else{
    	var CTime = createTimeText(songCurrentTime)
    	var TTime = createTimeText(songTotalTime)

	    if (!doesElementExist(idObj)){ $(".users").append("<div class=\"user\" id=\""+idObj+"\"></div>"); }
	    if (!doesElementExist(idObj+"_username")){ $("#"+idObj).append("<div class=\"user-name\" id=\""+idObj+"_username\">"+username+"</div>"); }
	    if (!doesElementExist(idObj+"_miniplayer")){ $("#"+idObj).append("<div class=\"miniplayer\" id=\""+idObj+"_miniplayer\"></div>"); }
	    if (!doesElementExist(idObj+"_miniplayer_img")){ 
	    	$("#"+idObj+"_miniplayer").append("<img src=\""+songImg+"\" class=\"miniplayer-img\" id=\""+idObj+"_miniplayer_img\">"); 
        	connection.send(JSON.stringify({type:'utils-base64fromurl',data:songImg, dataid:userID }));
	    }else{
			$("#"+idObj+"_miniplayer_img").html("<img src=\""+songImg+"\" class=\"miniplayer-img\" id=\""+idObj+"_miniplayer_img\">"); 
	    	if($("#"+idObj+"_miniplayer_img").attr("src") != songImg){
	    		$("#"+idObj+"_miniplayer_img").attr("src", songImg)
            	connection.send(JSON.stringify({type:'utils-base64fromurl',data:songImg, dataid:userID }));
	    	}
		}
	    if (!doesElementExist(idObj+"_miniplayer_info")){ $("#"+idObj+"_miniplayer").append("<div class=\"miniplayer-info\" id=\""+idObj+"_miniplayer_info\"></div>"); }
	    if (!doesElementExist(idObj+"_miniplayer_info_title")){ 
	    	$("#"+idObj+"_miniplayer_info").append("<div class=\"miniplayer-info-title\" id=\""+idObj+"_miniplayer_info_title\">"+songName+"</div>"); 
	    }else{
	    	$("#"+idObj+"_miniplayer_info_title").text(songName)
		}
	    if (!doesElementExist(idObj+"_miniplayer_info_artist")){ 
	    	$("#"+idObj+"_miniplayer_info").append("<div class=\"miniplayer-info-artist\" id=\""+idObj+"_miniplayer_info_artist\">"+artistName+"</div>"); 
		}else{
	    	$("#"+idObj+"_miniplayer_info_artist").text(artistName)
		}
	    if (!doesElementExist(idObj+"_miniplayer_info_album")){ 
	    	$("#"+idObj+"_miniplayer_info").append("<div class=\"miniplayer-info-album\" id=\""+idObj+"_miniplayer_info_album\">"+albumName+"</div>"); 
		}else{
	    	$("#"+idObj+"_miniplayer_info_album").text(albumName)
		}
	    if (!doesElementExist(idObj+"_miniplayer_progress")){ $("#"+idObj+"_miniplayer").append("<div class=\"miniplayer-progress\" id=\""+idObj+"_miniplayer_progress\"></div>"); }
	    if (!doesElementExist(idObj+"_miniplayer_progress_bar")){ 
	    	$("#"+idObj+"_miniplayer_progress").append("<div class=\"miniplayer-progress-bar\" id=\""+idObj+"_miniplayer_progress_bar\" style=\"width:"+(songCurrentTime/songTotalTime)*100+"%\"></div>"); 
	    }else{
	    	$("#"+idObj+"_miniplayer_progress_bar").attr("style", "width:"+(songCurrentTime/songTotalTime)*100+"%"); 
	    }
	    if (!doesElementExist(idObj+"_miniplayer_progress_current")){ 
	    	$("#"+idObj+"_miniplayer").append("<div class=\"miniplayer-progress-current\" id=\""+idObj+"_miniplayer_progress_current\">"+CTime+"</div>"); 
		}else{
	    	$("#"+idObj+"_miniplayer_progress_current").text(CTime)
		}
	    if (!doesElementExist(idObj+"_miniplayer_progress_total")){ 
	    	$("#"+idObj+"_miniplayer").append("<div class=\"miniplayer-progress-total\" id=\""+idObj+"_miniplayer_progress_total\">"+TTime+"</div>"); 
		}else{
	    	$("#"+idObj+"_miniplayer_progress_total").text(TTime)
		}
	 //    if (!doesElementExist(idObj+"_sync")){ 
	 //    	$("#"+idObj+"").append("<input type='submit', value='mee luisteren' class=\"\" onclick=\"connection.send(JSON.stringify({type:'spot-sync',userid:'"+userID+"'}))\" id=\""+idObj+"_sync\">"); 
		// }


		$("#"+idObj).hover(function() {
			$(".randomOverlay").width($(this).outerWidth()).height($(this).outerHeight()).css('left', ($(this).offset().left)).css('top', ($(this).offset().top)).css('background-color', "rgba(0,0,0,0.8)")
			$(".randomOverlay").html("<div class='options-room'>"+
				"<div title='Mee luisteren' class='fa fa-headphones-alt inline' onclick=\"connection.send(JSON.stringify({type:'spot-sync',userid:'"+userID+"'})); $('.randomOverlay').fadeOut();\"></div>"+
				"</div>")
			$(".randomOverlay").fadeIn()
			$(".randomOverlay").hover(function() { }, function() {
				$(".randomOverlay").fadeOut()
			});
		});

    }
    if(userID == showStatusFrom){
    	if(songName == undefined || (currentlyPlaying==false)){
	    	$("#cPlaying_miniplayer_progress_bar").attr("style", "width:100%");
	    	$("#cPlaying_miniplayer_progress_current").text("00:00")
	    	$("#cPlaying_miniplayer_progress_total").text("00:00")

	    	$("#cPlaying_miniplayer_info_title").text("-").attr("onclick", "")
	    	$("#cPlaying_miniplayer_info_artist").text("-").attr("onclick", "")
	    	$("#cPlaying_miniplayer_info_album").text("-").attr("onclick", "")

	    	$("#cPlaying_syncUsername").removeClass("fa-user").removeClass("fa-users").addClass("fa-user-friends").text(" "+syncedUsername).attr("onclick", newTab(syncedHref))
    	}else{
	    	var CTime = createTimeText(songCurrentTime)
	    	var TTime = createTimeText(songTotalTime)
	    	$("#cPlaying_miniplayer_progress_bar").attr("style", "width:"+(songCurrentTime/songTotalTime)*100+"%");
	    	$("#cPlaying_miniplayer_progress_current").text(CTime)
	    	$("#cPlaying_miniplayer_progress_total").text(TTime)

	    	if($("#cPlaying_miniplayer_img").attr("src") != songImg){
	    		$("#cPlaying_miniplayer_img").attr("src", songImg)
	    	}

	    	$("#cPlaying_miniplayer_info_title").text(songName).attr("onclick", newTab(songHref))
	    	$("#cPlaying_miniplayer_info_artist").text(artistName).attr("onclick", newTab(artistHref))
	    	$("#cPlaying_miniplayer_info_album").text(albumName).attr("onclick", newTab(albumHref))

	    	if(syncedUsername.startsWith("Room")){
	    		$("#cPlaying_syncUsername").removeClass("fa-user").removeClass("fa-user-friends").addClass("fa-users").text(" "+syncedUsername).attr("onclick", newTab(syncedHref))
	    	}else if(syncedUsername == "Niemand"){
	    		$("#cPlaying_syncUsername").removeClass("fa-users").removeClass("fa-user-friends").addClass("fa-user").text(" "+syncedUsername).attr("onclick", newTab(syncedHref))
	    	}else{
	    		$("#cPlaying_syncUsername").removeClass("fa-user").removeClass("fa-users").addClass("fa-user-friends").text(" "+syncedUsername).attr("onclick", newTab(syncedHref))
	    	}
    	}
    }
}


function addToQueue(albumImg, songname, artists, albumname, totaltime){
	var id = "queuesong_"+Math.abs(Math.random()*1000).toString() + songname; 
	$("#queue").append(""+
		"<div class=\"queue-song\" id=\""+id+"\">"+
			"<img src=\""+albumImg+"\" class=\"inline queue-song-img\">"+
			"<div class=\"inline\">"+
				"<div class=\"queue-song-title\" id=\""+id+"_title\">"+songname+"</div>"+
				"<div class=\"queue-song-artist\" id=\""+id+"_artist\">"+artists+"</div>"+
				"<div class=\"queue-song-album\" id=\""+id+"_album\">"+albumname+"</div>"+
				"<div class=\"queue-song-time\" id=\""+id+"_time\">"+createTimeText(totaltime)+"</div>"+
			"</div>"+
		"</div>")
	connection.send(JSON.stringify({type:'utils-base64fromurl',data:albumImg, dataid:id }));
}
