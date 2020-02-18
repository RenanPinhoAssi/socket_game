// Dependencies
var SHOW_MODE = true;
var PORT = SHOW_MODE ? 5000 : 5010;

var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");
var app = express();
var server = http.Server(app);
var io = socketIO(server);
var MAP_NAME = "clear_water_island";
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

var SHOOT_FUNCTIONS = require("./script/shoot");

var MAP_SETTINGS = require("./config/maps/" + MAP_NAME + ".json");
var TURF_SETTINGS = require("./config/maps/" + MAP_NAME + "_turfs.json");

var PLAYER_SETTINGS = require("./config/player/player.json");
var WEAPON_SETTINGS = require("./config/weapon/weapon.json");

var PLAYERS = {};
var BULLETS = [];

var BULLET_PLAYER_SPEED = 2;
var BULLET_DISTANCE = 2800;

var PLAYER_SPEED = PLAYER_SETTINGS["SPEED"];
var PLAYER_SKIN = PLAYER_SETTINGS["SKIN"];
var PLAYER_SIZE = PLAYER_SETTINGS["SIZE"];

io.on("connection", function(socket) {
	socket.on("disconnect", function() {
		console.log("Player [" + socket.id + "] left the game");
		delete PLAYERS[socket.id];
	});

	socket.on("new player", function() {
		console.log("Player [" + socket.id + "] has joined the game");
		PLAYERS[socket.id] = {};
		let tile_size = MAP_SETTINGS["tile-size"];
		let rx = Math.random() * MAP_SETTINGS["width"];
		let ry = Math.random() * MAP_SETTINGS["height"];

		rx =
			rx > tile_size
				? rx > MAP_SETTINGS["width"] - tile_size
					? MAP_SETTINGS["width"] - tile_size - 50
					: rx
				: 450;
		ry =
			ry > tile_size
				? ry > MAP_SETTINGS["height"] - tile_size
					? MAP_SETTINGS["height"] - tile_size - 50
					: ry
				: 450;

		PLAYERS[socket.id]["coordinates"] = {
			dx: rx,
			dy: ry,
			x: rx,
			y: ry
		};
		PLAYERS[socket.id]["color"] =
			PLAYER_SKIN[Math.floor(Math.random() * PLAYER_SKIN.length)];
		PLAYERS[socket.id]["data"] = {
			up: false,
			down: false,
			left: false,
			right: false
		};
		PLAYERS[socket.id]["weapon"] = "regular_rifle";
		PLAYERS[socket.id]["weapon_mode"] = 0;
		PLAYERS[socket.id]["shooting"] = false;
		PLAYERS[socket.id]["next_shoot_time"] = 0;

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
		PLAYERS[socket.id]["shooting"] = true;
	});

	socket.on("hold_fire", function(data) {
		PLAYERS[socket.id]["shooting"] = false;
	});

	socket.on("angle_register", function(data) {
		if (PLAYERS[socket.id]["alive"]) {
			PLAYERS[socket.id]["angle"] = data;
		}
	});

	socket.on("change_weapon_mode", function() {
		PLAYERS[socket.id]["weapon_mode"] =
			(PLAYERS[socket.id]["weapon_mode"] + 1) % 3;
		PLAYERS[socket.id]["shooting"] = false;
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

		if (currentTime >= player["next_shoot_time"]) {
			SHOOT_FUNCTIONS.perform_shoot(
				player,
				PLAYER_SIZE,
				WEAPON_SETTINGS,
				BULLET_DISTANCE,
				BULLETS
			);
		}

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

		index =
			Math.floor((xn + xa) / MAP_SETTINGS["tile-size"]) +
			Math.floor((yn + ya) / MAP_SETTINGS["tile-size"]) *
				MAP_SETTINGS["columns"];

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
			BULLETS[i]["xi"] = line_components.xi;
			BULLETS[i]["yi"] = line_components.yi;
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
				Math.floor(line_components.xf / MAP_SETTINGS["tile-size"]) +
				Math.floor(line_components.yf / MAP_SETTINGS["tile-size"]) *
					MAP_SETTINGS["columns"];
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
