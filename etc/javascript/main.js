var sliderCounter = 0;
var showStatusFrom = "";
var myId = "";
$.mobile.autoInitializePage = false;
$(document).ready(function(){
	$(".slider").on("swipeleft",function(){
		if($(".selectedSlider").nextAll().length != 0){
			setSliderTo(sliderCounter+1)
		}
	});
	$(".slider").on("swiperight",function(){
		if($(".selectedSlider").prevAll().length != 0){
			setSliderTo(sliderCounter-1)
		}
	});
	$(".slider").children().first().addClass("selectedSlider")
	var counter = 0;
	$(".slider").children().each(function(){
		$('.sliderStatus').append('<div class="sliderdot" onclick="setSliderTo('+counter+')"></div> ')
		counter+=1
	})
	$('.sliderStatus').children().removeClass("sliderdot-selected").eq(0).addClass("sliderdot-selected");
});
function setSliderTo(newCounter){
	sliderCounter = newCounter
	$(".slider").first().animate({ 'margin-left': parseInt(-1*sliderCounter*$(".container").width())}, 400);
	$(".slider").children().removeClass("selectedSlider").eq(sliderCounter).addClass("selectedSlider")
	$('.sliderStatus').children().removeClass("sliderdot-selected").eq(sliderCounter).addClass("sliderdot-selected");
}
//  Loading screen Stuff
var LoadingScreenType = {
    CONNECTING: "verbinden",
    CONNECTED: "verbonden"
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
        if (connection != undefined){
            if(connection.readyState == 1){
                connection.send(JSON.stringify({type:'spotcode',spotCode:code}));
                $("#spotify-status").text("Spotify Login: authorisatie code wordt bekeken...")
                $("#loginSpotImg").css('animation-name', "spin")
                setCookie("lastcode", code, 200)
                clearInterval(intervalll)
            }else{ $("#spotify-status").text("Spotify Login: Wachten op verbinding met de server..") }
        }else{ $("#spotify-status").text("Spotify Login: Wachten op verbinding met de server..") }
    }else{
        clearInterval(intervalll)
    }
}, 300);

function replaceAll(from, search, replacement) {
    return from.replace(new RegExp(search, 'g'), replacement);
};


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

function sendUpdateSettings(){
    var output = {};
    $(".setSettings").children('input').each(function(){
        output[($(this).attr("id")).replace('setting_', '')] = $(this).val();
    })
    console.log(output)
    connection.send(JSON.stringify({type:'setSettings',data:output}));
}
