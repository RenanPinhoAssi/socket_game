var socket = io();

var movement = {
	up: false,
	down: false,
	left: false,
	right: false
};
var change = false;
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
	var dom_obj = document.getElementById("test").value;
	socket.emit("changes", dom_obj);  
    if(change){
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

document.getElementById("canvas").addEventListener("click", function(event){
	let aim_direction = {x:event.clientX, y:event.clientY};
	socket.emit("shoot", aim_direction);  
});

socket.emit("new player");
var canvas = document.getElementById("canvas");
canvas.width = 800;
canvas.height = 600;
var context = canvas.getContext("2d");

socket.on("state", function(data) {
	context.clearRect(0, 0, 800, 600);
	for (var id in data["players"]) {
		console.log(data["players"][id])
		var player = data["players"][id]["coordinates"];
        context.fillStyle = data["players"][id]["color"];
		context.beginPath();
		context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
		context.fill();
	}
	
	for (var i in data["bullets"]) {
		let bullet = data["bullets"][i];
		context.fillStyle = "black";
		context.beginPath();
		context.arc(bullet.x, bullet.y, 3, 0, 2 * Math.PI);
		context.fill();
	}
});

socket.on("update", function(data) {
	document.getElementById("test").value = data;
})
