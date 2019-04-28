function createAhref(text, href, objClass="", id=""){ return "<a target=\"_blank\" href=\""+href+"\" class=\""+objClass+"\">"+text+"</a>"; }
function doesElementExist(id){ return document.getElementById(id) != null }
function newTabOnClick(href){ return " onclick=\""+newTab(href)+"\" " }
function newTab(href){ return "window.open('"+href+"','_blank')" }
function showQueueFromroom(roomName){
	// $('#queue').html("<input type='submit' class='buttonNoBorder' value='Queue weergave sluiten' onclick=\"$('#queue').toggle();\">");
	// Object.values(rooms[roomName].tracks).forEach(function(track){
 //    	addToQueue(track.album_img, track.trackName, track.artist_name, track.album_name, track.trackLengthMS)
	// })
	// $('#queue').toggle();
}


function updateRoom(roomName, users, songName, songImg, artistName, albumName, songCurrentTime, songTotalTime, tracks){
    var idObj = 'room_'+roomName;
    idObj = replaceAll(idObj, " ", "_")
}

function updateUser(userID, username, userHref, syncedUsername, syncedHref, songName, songHref, songImg, artistName, artistHref, albumName, albumHref, songCurrentTime, songTotalTime, currentlyPlaying){
    var idObj = 'user_'+userID;
    if(songName == undefined || (currentlyPlaying==false)){
	    if (doesElementExist(idObj)){ $("#"+idObj).remove() }
    }else{
	    if (!doesElementExist(idObj)){ 
	    	$(".users").append('<div class="user" id="'+idObj+'">'+
				'<div class="user-overlay">'+
					'<div class="fa fa-headphones-alt inline" onclick="connection.send(JSON.stringify({type:\'spot-sync\',userid:\''+userID+'\'}));"></div>'+
				'</div>'+
				'<div class="user-username" id="'+idObj+'_username">'+username+'</div>'+
				'<div class="user-info">'+
					'<div class="song-info-title" id="'+idObj+'_song_title">'+songName+'</div>'+
					'<div class="song-info-artist" id="'+idObj+'_song_artist">'+artistName+'</div>'+
					'<div class="song-info-album" id="'+idObj+'_song_album">'+albumName+'</div>'+
				'</div>'+
				'<div class="user-albumimg" data-src="'+songImg+'" id="'+idObj+'_song_img" style="background: linear-gradient(to left, rgba(89,89,89,0) 0, rgba(89,89,89,0.4) 40%, rgba(89,89,89,1) 100%), url('+songImg+') no-repeat;"></div>'+
				'<div class="song-progress"><div class="song-progress-bar" id="'+idObj+'_song_progress" style="width:'+(songCurrentTime/songTotalTime)*100+'%"></div></div>'+
			'</div>')
	    }else{
	    	if($("#"+idObj+"_song_img").attr("data-src") != songImg){
	    		$("#"+idObj+"_song_title").text(songName)
	    		$("#"+idObj+"_song_artist").text(artistName)
	    		$("#"+idObj+"_song_album").text(albumName)
	    		$("#"+idObj+"_song_img").attr("data-src", songImg)
	    		$("#"+idObj+"_song_img").attr("style", 'background: linear-gradient(to left, rgba(89,89,89,0) 0, rgba(89,89,89,0.4) 40%, rgba(89,89,89,1) 100%), url('+songImg+') no-repeat;')
	    	}
	    	$("#"+idObj+"_song_progress").attr("style", "width:"+(songCurrentTime/songTotalTime)*100+"%")
	    }
    }
    if(showStatusFrom == userID){
    	if($(".CPlayer-img").attr("data-src") != songImg){
    		$(".CPlayer-info-title").text(songName)
    		$(".CPlayer-info-artist").text(artistName)
    		$(".CPlayer-info-album").text(albumName)
    		$(".CPlayer-img").attr("data-src", songImg)
    		$(".CPlayer-img").attr("style", 'background: linear-gradient(to right, rgba(89,89,89,0) 0, rgba(89,89,89,0.4) 20%, rgba(89,89,89,1) 100%), url('+songImg+') no-repeat;')
    	}
    	$(".CPlayer-progress-bar").attr("style", "width:"+(songCurrentTime/songTotalTime)*100+"%")
    }
}