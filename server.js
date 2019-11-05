// Dependencies
var SHOW_MODE = false;
var PORT = (SHOW_MODE ? 5000 : 5010);

var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set("port", PORT);
app.use("/static", express.static(__dirname + "/static"));

// Routing
app.get("/", function(request, response) {
	response.sendFile(path.join(__dirname, "/static/index.html"));
});

// Starts the server.
server.listen(PORT, function() {
	console.log("Starting server on port " + PORT);
});

var PLAYER_SETTINGS = require('./player/player.json');
var MAP_SETTINGS    = require('./maps/regular.json');
var TURF_SETTINGS  = require('./maps/turfs.json');



var PLAYERS = {};
var BULLETS = [];

var BULLET_PLAYER_SPEED = 2;
var BULLET_DISTANCE = 800;

var PLAYER_SPEED = PLAYER_SETTINGS["SPEED"];
var PLAYER_SKIN  = PLAYER_SETTINGS["SKIN"];
var PLAYER_SIZE  = PLAYER_SETTINGS["SIZE"];

io.on("connection", function(socket) {
	socket.on("disconnect", function() {
        delete PLAYERS[socket.id];
	});

	socket.on("new player", function() {
        PLAYERS[socket.id] = {};        
        PLAYERS[socket.id]["coordinates"] = {
            x: PLAYER_SIZE,//Math.random() * MAP_SETTINGS["width"],
            y: PLAYER_SIZE//Math.random() * MAP_SETTINGS["height"]
        };
        PLAYERS[socket.id]["color"] = PLAYER_SKIN[Math.floor(Math.random()*PLAYER_SKIN.length)];
        PLAYERS[socket.id]["data"] = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        PLAYERS[socket.id]["alive"] = true;
        PLAYERS[socket.id]["key"] = socket.id;
        socket.emit('startgame', 
            {
                "MAP": MAP_SETTINGS,
                "TURF": TURF_SETTINGS,
                "PLAYER": {
                    "GLOBAL": PLAYER_SETTINGS,
                    "PERSONAL": {
                        "key": socket.id,
                        "color": PLAYERS[socket.id]["color"],
                        "xi": PLAYERS[socket.id]["coordinates"].x,
                        "yi": PLAYERS[socket.id]["coordinates"].y,
                    }
                }
            }
        );      
    });
    
    socket.on("movement", function(data) {
        try{
            if(PLAYERS[socket.id]["alive"]){
                PLAYERS[socket.id]["data"] = data;
            }
        }catch(e){}
    });

    socket.on("shoot", function(data) {
        if(PLAYERS[socket.id]["alive"]){
            let angle = data;
            let bullet = 
            {
                "x": PLAYERS[socket.id]["coordinates"].x,
                "y": PLAYERS[socket.id]["coordinates"].y,
                "angle": angle,
                "shoot_date": new Date().getTime(),
                "distance_time": BULLET_DISTANCE,
                "owner": PLAYERS[socket.id]
            }
            BULLETS.push(bullet);
        }
    });
});

var lastUpdateTime = new Date().getTime();
setInterval(function() {
	var currentTime = new Date().getTime();
	var timeDifference = currentTime - lastUpdateTime;
    var player;
    for(var key in PLAYERS){
        player = PLAYERS[key];
        let data = player["data"];
        if (data.left) {
            player["coordinates"].x -= PLAYER_SPEED*timeDifference;
        }
        if (data.up) {
            player["coordinates"].y -= PLAYER_SPEED*timeDifference;
        }
        if (data.right) {
            player["coordinates"].x += PLAYER_SPEED*timeDifference;
        }
        if (data.down) {
            player["coordinates"].y += PLAYER_SPEED*timeDifference;
        }
        lastUpdateTime = currentTime;
        console.log(player["coordinates"])
    }

    for(var i in BULLETS){
        if(currentTime - BULLETS[i]["shoot_date"] > BULLETS[i]["distance_time"]){
            BULLETS.splice(i,1);
        }else{
            let line_components = {};
            line_components.xi = BULLETS[i]["x"];
            line_components.yi = BULLETS[i]["y"];
            BULLETS[i]["x"] += ( BULLET_PLAYER_SPEED*Math.cos( BULLETS[i]["angle"] ) )*timeDifference;
            BULLETS[i]["y"] += ( BULLET_PLAYER_SPEED*Math.sin( BULLETS[i]["angle"] ) )*timeDifference;
            line_components.xf = BULLETS[i]["x"];
            line_components.yf = BULLETS[i]["y"];

            for(var key in PLAYERS){
                if(PLAYERS[key] != BULLETS[i]["owner"]){
                    player = PLAYERS[key];
                    let p_xc = player["coordinates"].x + (PLAYER_SIZE/2);
                    let p_yc = player["coordinates"].y + (PLAYER_SIZE/2);
                    let distance = (p_xc - line_components.xf)*(p_xc - line_components.xf) + (p_yc - line_components.yf)*(p_yc - line_components.yf)
                    distance = Math.sqrt(distance);
                    if(distance < PLAYER_SIZE*1.5){
                        PLAYERS[key]["alive"] = false;
                    }
                }
            }

            
        }
        lastUpdateTime = currentTime;
    }
    
    io.sockets.emit('renderUpdate', {"players": PLAYERS, "bullets": BULLETS});       
}, 1000 / 60);

