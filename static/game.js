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

var X_OFF_AJUST;
var Y_OFF_AJUST;

var initialize_player = function() {
	player_layer_context.fillStyle = PLAYER_INFO["color"];
	player_layer_context.beginPath();
	console.log(PLAYER_INFO)
	player_layer_context.arc(
		0,
		0,
		PLAYER_SIZE,
		0,
		2*Math.PI
	);
	player_layer_context.fill();
};

var initialize_map = function() {
	let map_data = MAP_SETTINGS["tile-map"];
	let map_size = MAP_SETTINGS["tile-size"];
	let x;
	let y = 0;
	for (var j = 0; j < map_size; j++) {
		for (var i = 0; i < map_size; i++) {
			x = map_size * i;
			let this_turf = TURF_SETTINGS[map_data[i + 100 * j]];
			map_layer_context.fillStyle = this_turf["color"];
			map_layer_context.beginPath();
			map_layer_context.fillRect(x, y, map_size, map_size);
			map_layer_context.strokeStyle = "#fff";
			map_layer_context.strokeRect(x, y, map_size, map_size);
		}
		y += map_size;
	};
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
	
	VIEWPORT_CENTER_X = (VIEWPORT_WIDTH / 2) - (PLAYER_SIZE/2);
	VIEWPORT_CENTER_Y = (VIEWPORT_HEIGHT / 2) - (PLAYER_SIZE/2);

	viewport = document.getElementById("viewport");
	map_layer = document.getElementById("map_layer");
	player_layer = document.getElementById("player_layer");

	viewport_context = viewport.getContext("2d");
	map_layer_context = map_layer.getContext("2d");
	player_layer_context = player_layer.getContext("2d");
	
	viewport.width = VIEWPORT_WIDTH;
	viewport.height = VIEWPORT_HEIGHT;

	player_layer.width = VIEWPORT_WIDTH;
	player_layer.height = VIEWPORT_HEIGHT;

	map_layer.width = MAP_WIDTH;
	map_layer.height = MAP_HEIGHT;

	X_OFF_AJUST = PLAYER_INFO["xi"]-VIEWPORT_WIDTH/2+ PLAYER_SIZE/2;
	Y_OFF_AJUST = PLAYER_INFO["yi"]-VIEWPORT_HEIGHT/2+ PLAYER_SIZE/2;

	viewport_context.translate(VIEWPORT_WIDTH/2 - PLAYER_SIZE/2,VIEWPORT_HEIGHT/2- PLAYER_SIZE/2);
	player_layer_context.translate(VIEWPORT_WIDTH/2 - PLAYER_SIZE/2,VIEWPORT_HEIGHT/2- PLAYER_SIZE/2);
	$("#map_layer").css("left",-X_OFF_AJUST);
	$("#map_layer").css("top",-Y_OFF_AJUST);

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
	document.getElementById("player_layer").addEventListener("mouseup", function(event) {
		let dx = event.clientX - VIEWPORT_CENTER_X;
		let dy = event.clientY - VIEWPORT_CENTER_Y;
		let angle = Math.atan2(dy,dx);
		socket.emit("shoot", angle);
	});
};

$(document).ready(function() {
	socket.emit("new player");
	socket.on("startgame", function(data) {
		initialize_game(data);
		let test = $("#map_layer");
		socket.on("renderUpdate", function(data) {
			viewport_context.clearRect(-VIEWPORT_WIDTH/2,-VIEWPORT_HEIGHT/2,2*VIEWPORT_WIDTH,2*VIEWPORT_HEIGHT);
			
			let players_set = data["players"];
			
			$("#map_layer").css("left",-(players_set[PLAYER_INFO["key"]]["coordinates"].x-VIEWPORT_WIDTH/2+ PLAYER_SIZE/2));
			$("#map_layer").css("top",-(players_set[PLAYER_INFO["key"]]["coordinates"].y-VIEWPORT_HEIGHT/2+ PLAYER_SIZE/2));
			delete players_set[PLAYER_INFO["key"]];
			for (var id in players_set) {
				if (players_set[id]["alive"]) {
					var player = players_set[id]["coordinates"];
					viewport_context.fillStyle = players_set[id]["color"];
					viewport_context.beginPath();
					viewport_context.arc(
						player.x,
						player.y,
						PLAYER_SIZE,
						0,
						2 * Math.PI
					);
					viewport_context.fill();
				}
			}
			for (var i in data["bullets"]) {
				let bullet = data["bullets"][i];
				viewport_context.fillStyle = "black";
				viewport_context.beginPath();
				viewport_context.arc(bullet.x, bullet.y, 3, 0, 2 * Math.PI);
				viewport_context.fill();
			}
		});
	});
});
