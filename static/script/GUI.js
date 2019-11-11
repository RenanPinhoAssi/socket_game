var draw_player = function(context,color,x,y,size){
    context.fillStyle = color;
    context.beginPath();
    context.arc(x,y,size,0,2*Math.PI);
    context.fill();
}

var draw_bullet = function(bullet,x,y){
    let dx = bullet.x - x;
    let dy = bullet.y - y;
    let dxi = bullet.xi - x;
    let dyi = bullet.yi - y;
    let grad = viewport_context.createLinearGradient(dxi, dyi, dx, dy);
    grad.addColorStop(0, "#00000050");
    grad.addColorStop(0.7, "#00000080");
    grad.addColorStop(1, "#000000");
    viewport_context.strokeStyle = grad;
    viewport_context.lineWidth = 4;
    viewport_context.beginPath();
    viewport_context.moveTo(dxi, dyi);
    viewport_context.lineTo(dx, dy);
    viewport_context.stroke();
}


var draw_bullet_shell = function(context,color,x,y,size){
    context.fillStyle = color;
    context.beginPath();
    context.arc(x,y,size,0,2*Math.PI);
    context.fill();
}

var draw_picture_tile = function(path,x,y){
    let new_image = new Image();
    new_image.src = "/static/assets/tiles/" + path;
    new_image.onload = function() {
        map_layer_context.drawImage(new_image, x, y);
        map_layer_context.beginPath();
        map_layer_context.strokeStyle = "black";
        map_layer_context.strokeRect(x, y, map_size, map_size);
    };
}