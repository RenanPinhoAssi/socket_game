var start_healthbox = function(context,VW,VH) {
	let new_image = new Image();
	new_image.src = "/static/assets/icons/heartbeat.png";
	new_image.onload = function() {
        console.log(new_image)
		context.drawImage(new_image, VW/2, VH/2);
		context.beginPath();
	};

};
