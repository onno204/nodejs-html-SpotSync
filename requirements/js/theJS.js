//Utils
var myId = "123"
var showStatusFrom = "123"
var myPlayslists = {}
var rooms = []

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname, convertojsonstring=false) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    if (convertojsonstring) {
        return "{}";
    }
    return "";
}

//  Loading screen Stuff
var LoadingScreenType = {
    CONNECTING: "CONNECTING",
    SELECTSERVER: "SELECTSERVER",
    SWITCHGAME: "SWITCHGAME",
    PLAYGAME: "PLAYGAME",
    CONNECTED: "CONNECTED"
};

var currentLoadingScreenState = "123"
function loadingScreenType(loadingType){
    if (currentLoadingScreenState != loadingType){
        currentLoadingScreenState = loadingType
        $("#status").html("Server Status: "+loadingType);
    }
}

// Check if authorized
var intervalll = setInterval(function() {
    var url = new URL(window.location);
    var code = url.searchParams.get("code");
    if ((code!= null) && (code.length >= 10) && (code != getCookie("lastcode"))) {
        //$("#spotAuthorize").hide();
        if (connection.readyState == 1){
            connection.send(JSON.stringify({type:'spotcode',spotCode:code}));
            $("#spotify-status").text("Spotify Login: code send to server for review")
            $("#loginSpotImg").css('animation-name', "spin")
            setCookie("lastcode", code, 200)
            clearInterval(intervalll)
        }else{
            $("#spotify-status").text("Spotify Login: Waiting for server connection...")
        }
    }else{
        clearInterval(intervalll)
    }
}, 300);

function replaceAll(from, search, replacement) {
    return from.replace(new RegExp(search, 'g'), replacement);
};
