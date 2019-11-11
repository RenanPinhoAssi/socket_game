var socket = io();

var viewport;
var map_layer;
var player_layer;

var viewport_context;
var map_layer_context;
var player_layer_context;

var movement = {
	up: false,
	down: false,
	left: false,
	right: false
};
var change = false;
var shooting = false;
var aim_direction;

var MAP_SETTINGS;
var TURF_SETTINGS;
var PLAYER_SETTINGS;

var VIEWPORT_HEIGHT;
var VIEWPORT_WIDTH;
var VIEWPORT_CENTER_X;
var VIEWPORT_CENTER_Y;
var PLAYER_SIZE;

var MAP_HEIGHT;
var MAP_WIDTH;

var initialize_player = function() {
	draw_player(
		player_layer_context,
		PLAYER_INFO["color"],
		VIEWPORT_CENTER_X,
		VIEWPORT_CENTER_Y,
		PLAYER_SIZE
	);
};

var initialize_map = function() {
	let image_cache = {};
	let map_data = MAP_SETTINGS["tile-map"];
	let map_size = MAP_SETTINGS["tile-size"];
	let columns = MAP_SETTINGS["columns"];
	let x;
	let y = 0;
	for (var j = 0; j < columns; j++) {
		for (var i = 0; i < columns; i++) {
			x = map_size * i;
			let tile_key = map_data[i + columns * j];
			let this_turf = TURF_SETTINGS[tile_key];
			if(this_turf["color"]){
				map_layer_context.fillStyle = this_turf["color"];
				map_layer_context.beginPath();
				map_layer_context.fillRect(x, y, map_size, map_size);
				map_layer_context.strokeStyle = "black";
				map_layer_context.strokeRect(x, y, map_size, map_size);
			}else{
				if(!image_cache[tile_key]){
					let new_image = new Image();
					new_image.src = "/static/assets/tiles/"+this_turf["image"];
					image_cache[tile_key] = new_image;
					console.log(image_cache[tile_key])
				}
				console.log("(" + x + " - " + y + ")");
				map_layer_context.drawImage(image_cache[tile_key], x, y, map_size, map_size);
			}
		}
		y += map_size;
	}
};

var initialize_game = function(data) {
	VIEWPORT_HEIGHT = $(window).height();
	VIEWPORT_WIDTH = $(window).width();

	MAP_SETTINGS = data["MAP"];
	TURF_SETTINGS = data["TURF"];
	PLAYER_SETTINGS = data["PLAYER"]["GLOBAL"];
	PLAYER_INFO = data["PLAYER"]["PERSONAL"];

	PLAYER_SIZE = PLAYER_SETTINGS["SIZE"];

	MAP_HEIGHT = MAP_SETTINGS["height"];
	MAP_WIDTH = MAP_SETTINGS["width"];

	VIEWPORT_CENTER_X = VIEWPORT_WIDTH / 2 + PLAYER_SIZE / 2;
	VIEWPORT_CENTER_Y = VIEWPORT_HEIGHT / 2 + PLAYER_SIZE / 2;

	viewport = document.getElementById("viewport");
	map_layer = document.getElementById("map_layer");
	player_layer = document.getElementById("player_layer");
	effects_layer = document.getElementById("effects_layer");

	viewport_context = viewport.getContext("2d");
	map_layer_context = map_layer.getContext("2d");
	player_layer_context = player_layer.getContext("2d");
	effects_layer_context = effects_layer.getContext("2d");

	viewport.width = VIEWPORT_WIDTH;
	viewport.height = VIEWPORT_HEIGHT;

	player_layer.width = VIEWPORT_WIDTH;
	player_layer.height = VIEWPORT_HEIGHT;

	effects_layer.width = VIEWPORT_WIDTH;
	effects_layer.height = VIEWPORT_HEIGHT;

	map_layer.width = MAP_WIDTH;
	map_layer.height = MAP_HEIGHT;

	viewport_context.translate(VIEWPORT_CENTER_X, VIEWPORT_CENTER_Y);
	$("#map_layer").css("left", -PLAYER_INFO["xi"] - VIEWPORT_CENTER_X);
	$("#map_layer").css("top", -PLAYER_INFO["yi"] - VIEWPORT_CENTER_Y);

	initialize_map();
	initialize_player();

	document.addEventListener("keydown", function(event) {
		switch (event.keyCode) {
			case 65: // A
				change = !movement.left;
				movement.left = true;
				break;
			case 87: // W
				change = !movement.up;
				movement.up = true;
				break;
			case 68: // D
				change = !movement.right;
				movement.right = true;
				break;
			case 83: // S
				change = !movement.down;
				movement.down = true;
				break;
		}

		if (change) {
			socket.emit("movement", movement);
			change = false;
		}
	});
	document.addEventListener("keyup", function(event) {
		switch (event.keyCode) {
			case 65: // A
				movement.left = false;
				break;
			case 87: // W
				movement.up = false;
				break;
			case 68: // D
				movement.right = false;
				break;
			case 83: // S
				movement.down = false;
				break;
		}
		socket.emit("movement", movement);
	});
	document
		.getElementById("player_layer")
		.addEventListener("mouseup", function(event) {
			let dx = event.clientX - VIEWPORT_CENTER_X;
			let dy = event.clientY - VIEWPORT_CENTER_Y;
			let angle = Math.atan2(dy, dx);
			socket.emit("shoot", angle);
			
		});
};

$(document).ready(function() {
	socket.emit("new player");
	socket.on("startgame", function(data) {
		initialize_game(data);
		socket.on("renderUpdate", function(data) {
			viewport_context.clearRect(
				-VIEWPORT_WIDTH,
				-VIEWPORT_HEIGHT,
				2 * VIEWPORT_WIDTH,
				2 * VIEWPORT_HEIGHT
			);
			let players_set = data["players"];
			let x = players_set[PLAYER_INFO["key"]]["coordinates"].x;
			let y = players_set[PLAYER_INFO["key"]]["coordinates"].y;

			$("#map_layer").css(
				"left",
				-(players_set[PLAYER_INFO["key"]]["coordinates"].x - VIEWPORT_CENTER_X)
			);
			$("#map_layer").css(
				"top",
				-(players_set[PLAYER_INFO["key"]]["coordinates"].y - VIEWPORT_CENTER_Y)
			);

			delete players_set[PLAYER_INFO["key"]];
			for (var id in players_set) {
				if (players_set[id]["alive"]) {
					let player = players_set[id]["coordinates"];
					let dx = player.x - x;
					let dy = player.y - y;
					viewport_context.fillStyle = players_set[id]["color"];
					viewport_context.beginPath();
					draw_player(
						viewport_context,
						players_set[id]["color"],
						dx,
						dy,
						PLAYER_SIZE
					);
					viewport_context.fill();
				}
			}
			for (var i in data["bullets"]) {
				let bullet = data["bullets"][i];
				let dx = bullet.x - x;
				let dy = bullet.y - y;
				let dxi = bullet.xi - x;
				let dyi = bullet.yi - y;
				let dxe = dxi - 15*Math.cos(bullet.angle);
				let dye = dyi - 15*Math.sin(bullet.angle);
				let grad = viewport_context.createLinearGradient(dxe, dye, dx, dy);
				grad.addColorStop(0, "orange");
				grad.addColorStop(1, "white");
				viewport_context.strokeStyle = grad;
				viewport_context.lineWidth = 4;
				viewport_context.beginPath();
				viewport_context.moveTo(dxe, dye);
				viewport_context.lineTo(dx, dy);
				viewport_context.stroke();
			}
		});
	});
});
