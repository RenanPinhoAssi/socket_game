// Dependencies
var SHOW_MODE = false;
var PORT = SHOW_MODE ? 5000 : 5010;

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

var PLAYER_SETTINGS = require("./player/player.json");
var MAP_SETTINGS = require("./maps/regular.json");
var TURF_SETTINGS = require("./maps/turfs.json");

var PLAYERS = {};
var BULLETS = [];

var BULLET_PLAYER_SPEED = 2;
var BULLET_DISTANCE = 800;

var PLAYER_SPEED = PLAYER_SETTINGS["SPEED"];
var PLAYER_SKIN = PLAYER_SETTINGS["SKIN"];
var PLAYER_SIZE = PLAYER_SETTINGS["SIZE"];

io.on("connection", function(socket) {
	socket.on("disconnect", function() {
		delete PLAYERS[socket.id];
	});

	socket.on("new player", function() {
		PLAYERS[socket.id] = {};
		PLAYERS[socket.id]["coordinates"] = {
			dx: Math.random() * MAP_SETTINGS["width"],
			dy: Math.random() * MAP_SETTINGS["height"],
			x: Math.random() * MAP_SETTINGS["width"],
			y: Math.random() * MAP_SETTINGS["height"]
		};
		PLAYERS[socket.id]["color"] =
			PLAYER_SKIN[Math.floor(Math.random() * PLAYER_SKIN.length)];
		PLAYERS[socket.id]["data"] = {
			up: false,
			down: false,
			left: false,
			right: false
		};
		PLAYERS[socket.id]["alive"] = true;
		PLAYERS[socket.id]["key"] = socket.id;
		socket.emit("startgame", {
			MAP: MAP_SETTINGS,
			TURF: TURF_SETTINGS,
			PLAYER: {
				GLOBAL: PLAYER_SETTINGS,
				PERSONAL: {
					key: socket.id,
					color: PLAYERS[socket.id]["color"],
					xi: PLAYERS[socket.id]["coordinates"].x,
					yi: PLAYERS[socket.id]["coordinates"].y
				}
			}
		});
	});

	socket.on("movement", function(data) {
		try {
			if (PLAYERS[socket.id]["alive"]) {
				PLAYERS[socket.id]["data"] = data;
			}
		} catch (e) {}
	});

	socket.on("shoot", function(data) {
		if (PLAYERS[socket.id]["alive"]) {
			let angle = data;
			let bullet = {
				x: PLAYERS[socket.id]["coordinates"].x,
				y: PLAYERS[socket.id]["coordinates"].y,
				angle: angle,
				shoot_date: new Date().getTime(),
				distance_time: BULLET_DISTANCE,
				alive: true,
				owner: PLAYERS[socket.id]
			};
			BULLETS.push(bullet);
		}
	});
});

var lastUpdateTime = new Date().getTime();
setInterval(function() {
	var currentTime = new Date().getTime();
	var timeDifference = currentTime - lastUpdateTime;
	var player;
	for (var key in PLAYERS) {
		player = PLAYERS[key];
		let data = player["data"];
		let xi = player["coordinates"].x;
		let yi = player["coordinates"].y;
		let xn = player["coordinates"].x;
		let yn = player["coordinates"].y;
		let xa = 0;
		let ya = 0;
		let index;
		let map_tile_id;
		let map_turf;

		if (data.left) {
			xn -= PLAYER_SPEED * timeDifference;
			xa = -PLAYER_SIZE;
		}
		if (data.up) {
			yn -= PLAYER_SPEED * timeDifference;
			ya = -PLAYER_SIZE;
		}
		if (data.right) {
			xn += PLAYER_SPEED * timeDifference;
			xa = PLAYER_SIZE;
		}
		if (data.down) {
			yn += PLAYER_SPEED * timeDifference;
			ya = PLAYER_SIZE;
		}

		index = Math.floor((xn + xa) / 100) + Math.floor((yn + ya) / 100) * 100;

		map_tile_id = MAP_SETTINGS["tile-map"][index];
		map_turf = TURF_SETTINGS[map_tile_id];
		if (!map_turf["collision"]) {
			player["coordinates"].dx = xn - xi;
			player["coordinates"].dy = yn - yi;
			player["coordinates"].x = xn;
			player["coordinates"].y = yn;
		}
		lastUpdateTime = currentTime;
	}

	for (var i in BULLETS) {
		if (
			currentTime - BULLETS[i]["shoot_date"] > BULLETS[i]["distance_time"] ||
			!BULLETS[i]["alive"]
		) {
			BULLETS.splice(i, 1);
		} else {
			let line_components = {};
			line_components.xi = BULLETS[i]["x"] + 1.5;
			line_components.yi = BULLETS[i]["y"] + 1.5;
			BULLETS[i]["x"] +=
				BULLET_PLAYER_SPEED * Math.cos(BULLETS[i]["angle"]) * timeDifference;
			BULLETS[i]["y"] +=
				BULLET_PLAYER_SPEED * Math.sin(BULLETS[i]["angle"]) * timeDifference;
			line_components.xf = BULLETS[i]["x"] + 1.5;
			line_components.yf = BULLETS[i]["y"] + 1.5;

			killed_player = false;
			last_distance = PLAYER_SIZE + 1;
			for (var key in PLAYERS) {
				if (PLAYERS[key] != BULLETS[i]["owner"]) {
					player = PLAYERS[key];
					let p_xc = player["coordinates"].x + PLAYER_SIZE / 2;
					let p_yc = player["coordinates"].y + PLAYER_SIZE / 2;
					let distance =
						(p_xc - line_components.xf) * (p_xc - line_components.xf) +
						(p_yc - line_components.yf) * (p_yc - line_components.yf);
					distance = Math.sqrt(distance);
					if (distance <= PLAYER_SIZE && distance < last_distance) {
						killed_player = key;
						last_distance = distance;
					}
				}
			}
			if (killed_player) {
				PLAYERS[killed_player]["alive"] = false;
				BULLETS[i]["alive"] = false;
			}

			index =
				Math.floor(line_components.xf / 100) +
				Math.floor(line_components.yf / 100) * 100;
			map_tile_id = MAP_SETTINGS["tile-map"][index];
            map_turf = TURF_SETTINGS[map_tile_id];
			if (map_turf["collision"]) {
				BULLETS[i]["alive"] = false;
			}
		}
		lastUpdateTime = currentTime;
	}

	io.sockets.emit("renderUpdate", { players: PLAYERS, bullets: BULLETS });
}, 1000 / 60);
