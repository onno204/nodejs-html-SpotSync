

class spotAPI {
    constructor() {
        this.text = 'Hello World!'
        this.SpotifyWebApi = require('spotify-web-api-node');
        this.testID = Math.random()*100000;
        this.settings = []
        this.settings['scopes'] = 'user-read-private user-read-email';
        this.settings['connection'] = null;
        this.settings['userid'] = null;
        this.settings['userInfo'] = null;
        this.settings['access_token'] = null;
        this.settings['refresh_token'] = null;
        // credentials are optional
        this.spotifyApi = new this.SpotifyWebApi({
            clientId: '',
            clientSecret: '',
            redirectUri: 'http://spotsync.onno204.nl'
        });
        this.intervalID = 0;
    }
    destoryClass(){
        clearInterval(this.intervalID)
    }



    setup(connection, cbRemoveOldUsers, access_token){
        this.settings['connection'] = connection
        this.log("Setting up user...")
        this.initialize()
        if(access_token != null){
            console.log("Using refresh tokin: ", access_token)
            this.enterRefreshToken(access_token, cbRemoveOldUsers)
        }else{
            this.enterCode(connection.spotCode, cbRemoveOldUsers)
        }
    }
    enterCode(code, cbRemoveOldUsers){
        this.settings['code'] = code
        var that = this
        this.spotifyApi.authorizationCodeGrant(code).then(
            function(data) {
                // console.log('The token expires in ' + data.body['expires_in']);
                // console.log('The access token is ' + data.body['access_token']);
                // console.log('The refresh token is ' + data.body['refresh_token']);
				if(data.body == undefined){ data.body = data }
				that.spotifyApi.setAccessToken(data.body['access_token']);
				that.spotifyApi.setRefreshToken(data.body['refresh_token']);
				that.settings['access_token'] = data.body['access_token'];
				that.settings['refresh_token'] = data.body['refresh_token'];
				that.enterRefreshToken(data.body['refresh_token'], cbRemoveOldUsers)
            },
            function(err) {
                console.log('err[authorizationCodeGrant | enterCode] ', err); 
                cbRemoveOldUsers("Invalid code");
            }
        ).catch(function(err) { 
			console.log('err[enterCode|catch]', err); 
			cbRemoveOldUsers("unknown error 1");
		});
    }
    enterRefreshToken(refreshToken, cbRemoveOldUsers){
        this.settings['code'] = ""
        this.settings['refreshToken'] = refreshToken
        this.spotifyApi.setRefreshToken(refreshToken);
        var that = this
        this.refreshToken(function(){
            setTimeout(function() {
                that.spotifyApi.getMe().then(function(data) {
                    if(data.body == undefined){ data.body = data }
                    var info = data.body
                    that.settings['userid'] = info['id'];
                    that.settings['userInfo'] = info;
                    cbRemoveOldUsers(info)
                }).catch(function(err) { 
                    console.log('err[enterRefreshToken|getMe]', err); 
                    cbRemoveOldUsers("Invalid refresh token"); 
                });
            }, 600);

        });
    }
    getCurrentSong(cb){
        this.spotifyApi.getMyCurrentPlaybackState({ }).then(function(data) {
			if(data.body == undefined){ data.body = data }
            cb(data.body)
        }).catch(function(err) { console.log('err[getMyCurrentPlaybackState|getCurrentSong] ', err); });
    }
    async getCurrentSongSync(cb){
        var data = await this.spotifyApi.getMyCurrentPlaybackState({ })
        if(data.body == undefined){ data.body = data }
        cb(data.body)
    }
    getSongInfo(trackID, cb){
        this.spotifyApi.getTrack(trackID).then(function(data) {
			if(data.body == undefined){ data.body = data }
            cb(data.body)
        }).catch(function(err) { console.log('err[getTrack|getSongInfo] ', err); });
    }
    playSong(songId){
        this.spotifyApi.play({"uris":[songId]}).then(function(data) {
			if(data.body == undefined){ data.body = data }
        }).catch(function(err) { console.log('err[play|playSong] ', err); });
    }
    setTiming(timing){
        this.spotifyApi.seek(timing, {}, function(){ });
    }

    async getSongsAndPlaylists(cb){ 
        var that = this
        var playlistSongOutput = {}
        var data = await this.spotifyApi.getUserPlaylists(undefined, {})
		if(data.body == undefined){ data.body = data }
        var playlists = data.body.items
        for (const playlist of playlists) {
            playlistSongOutput[playlist.name] = {}
            playlistSongOutput[playlist.name]['tracks'] = []
            playlistSongOutput[playlist.name]['name'] = playlist.name
            playlistSongOutput[playlist.name]['id'] = playlist.id
            playlistSongOutput[playlist.name]['href'] = playlist.href
            var keepGoing = true
            var keepGoingOffset = 0
            var keepGoingCounter = 0
            while (keepGoing && (keepGoingCounter <= 10)) {
                keepGoingCounter = keepGoingCounter + 1;
                var data2 = await this.spotifyApi.getPlaylistTracks(playlist.id, {offset:keepGoingOffset})
			    if(data2.body == undefined){ data2.body = data2 }
                if((data2.body.limit+data2.body.offset ) >= data2.body.total){ keepGoing = false
                }else{ keepGoingOffset += 100 }
                var retreivedSongs = data2.body.items
                for (var key in retreivedSongs) {
                    if (retreivedSongs.hasOwnProperty(key)) {           
                        var songinfo = retreivedSongs[key]
                        var track = songinfo.track
                        if(track != null){
                            if(track.is_local == false){
                                playlistSongOutput[playlist.name]['tracks'].push({
                                    name: track.name,
                                    href: track.href,
                                    id: track.id,
                                    duration_ms: track.duration_ms,
                                    preview: track.preview_url,
                                    artist_name: track.artists[0].name,
                                    artist_href: track.artists[0].href
                                })
                            }
                        }
                    } 
                }
            }
        }
        cb(playlistSongOutput)
    }




    // Can wrap the following methods in a class for ease of use
    async initialize() {
        const token = await this.getToken()
        this.spotifyApi.setAccessToken(token)
    }
    setToken(token) {
        this.spotifyApi.setAccessToken(token)
    }
    async refreshToken(cb) {
        if (this.settings['userInfo'] == null){ this.settings['userInfo'] = {display_name: "Null" } }
        const token = await this.getRefreshToken()
        if(token != null){
            this.spotifyApi.setAccessToken(token)
            console.log("refreshing token for user: ", this.settings['userInfo']['display_name'])
        }else{
            console.log("failed token refresh for user: ", this.settings['userInfo']['display_name'])
        }
        if(cb!= undefined){ cb() }
    }
    async getToken() {
        const result = await this.spotifyApi.clientCredentialsGrant()
        if(result.body == undefined){ result.body = result }
        return result.body.access_token
    }
    async getRefreshToken() {
        const result = await this.spotifyApi.refreshAccessToken()
        if(result.body == undefined){ result.body = result }
        if(result == null) {
            return null
        }
        return result.body.access_token
    }
    async useApi() {
        // initialize or refreshToken as desired
        await this.spotifyApi.initialize()
        // use api 
        //await this.spotifyApi.search(....)
    }
    //Connection logging
    log(text){
        this.sendToConnection(JSON.stringify({ type:'log', data: text }))
    }
    sendToConnection(text){
        if (this.settings['connection'] != null){
            console.log("\x1b[0m"+"["+"\x1b[45m"+"outgoing"+"\x1b[0m"+"]"+"\x1b[36m"+this.settings['connection'].remoteAddress+"\x1b[0m"+": "+text)
            this.settings['connection'].sendUTF(text)
        }else{
            console.log("[ConNull]", text)
        }
    }
}
exports.spotAPI = spotAPI