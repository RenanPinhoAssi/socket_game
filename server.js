// Dependencies
var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set("port", 5000);
app.use("/static", express.static(__dirname + "/static"));

// Routing
app.get("/", function(request, response) {
	response.sendFile(path.join(__dirname, "/static/index.html"));
});

// Starts the server.
server.listen(5000, function() {
	console.log("Starting server on port 5000");
});

var PLAYERS = {};
var BULLETS = [];
var SPEED = 0.5;
var BULLET_SPEED = 0.7;
var COLORS = ["green","red","blue","pink","cyan","black","gray","purple","brown"];

io.on("connection", function(socket) {
	socket.on("disconnect", function() {
        delete PLAYERS[socket.id];
	});

	socket.on("new player", function() {
        PLAYERS[socket.id] = {};        
        PLAYERS[socket.id]["coordinates"] = {x: 300,y: 300};
        PLAYERS[socket.id]["color"] = COLORS[Math.floor(Math.random()*COLORS.length)];
        PLAYERS[socket.id]["data"] = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
    });
    
    socket.on("movement", function(data) {
        try{
            PLAYERS[socket.id]["data"] = data;
        }catch(e){}
    });

    socket.on("changes", function(data) {
        socket.broadcast.emit('update', data);   
    });

    socket.on("shoot", function(data) {
        let xi = PLAYERS[socket.id]["coordinates"].x;
        let yi = PLAYERS[socket.id]["coordinates"].y;
        let xDelta = data.x - xi;
        let yDelta = data.y - yi;
        let angle = yDelta/xDelta;
        let bullet = 
        {
            "x": xi,
            "y": yi,
            "angle": angle
        }
        BULLETS.push(bullet);
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
            player["coordinates"].x -= SPEED*timeDifference;
        }
        if (data.up) {
            player["coordinates"].y -= SPEED*timeDifference;
        }
        if (data.right) {
            player["coordinates"].x += SPEED*timeDifference;
        }
        if (data.down) {
            player["coordinates"].y += SPEED*timeDifference;
        }
        lastUpdateTime = currentTime;
    }

    for(var i in BULLETS){
        BULLETS[i]["x"] = BULLETS[i]["x"] + BULLET_SPEED*timeDifference*Math.cos(BULLETS[i]["angle"]);
        BULLETS[i]["y"] = BULLETS[i]["y"] + BULLET_SPEED*timeDifference*Math.sin(BULLETS[i]["angle"]);
        lastUpdateTime = currentTime;
    }
    
    io.sockets.emit('state', {"players": PLAYERS, "bullets": BULLETS});       
}, 1000 / 60);

