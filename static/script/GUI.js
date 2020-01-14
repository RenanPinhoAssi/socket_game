var draw_player = function(context,color,x,y,size){
    context.lineWidth = 4;
    context.strokeStyle = "black";
    context.fillStyle = color;
    context.beginPath();
    context.arc(x,y,size,0,2*Math.PI);
    context.fill();
    context.stroke();
}

var draw_weapon = function(context,x,y,color,size_player,size_weapon,angle){
    let size = size_player + size_weapon;
    let hand_size = size_player/3;
    let xi = x + size_player*0.8*Math.cos(angle);
    let yi = y + size_player*0.8*Math.sin(angle);
    let xf = x + size*Math.cos(angle);
    let yf = y + size*Math.sin(angle);

    context.strokeStyle = "black";
    context.lineWidth = 15;
    context.beginPath();
    context.moveTo(xi, yi);
    context.lineTo(xf, yf);
    context.stroke();

    draw_hand(context,xi,yi,size_weapon,color,angle,hand_size);
}

var draw_hand = function(context,xi,yi,size_weapon,color,angle,hand_size){
    let half_hand = hand_size/2;

    let xf = xi + size_weapon*0.6*Math.cos(angle);
    let yf = yi + size_weapon*0.6*Math.sin(angle);

    xi += (5)*Math.sin(-angle);
    yi += (5)*Math.cos(-angle);
    xf += (half_hand)*Math.sin(-angle);
    yf += (half_hand)*Math.cos(-angle);


    context.lineWidth = 4;
    context.strokeStyle = "black";
    context.fillStyle = color;
    context.beginPath();
    context.arc(xi,yi,hand_size,0,2*Math.PI);
    context.fill();
    context.stroke();

    context.beginPath();
    context.arc(xf,yf,hand_size,0,2*Math.PI);
    context.fill();
    context.stroke();
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

var draw_picture_tile = function(path,x,y,map_size){
    let new_image = new Image();
    new_image.src = "/static/assets/tiles/" + path;
    new_image.onload = function() {
        map_layer_context.drawImage(new_image, x, y);
        map_layer_context.beginPath();
        map_layer_context.strokeStyle = "black";
        map_layer_context.strokeRect(x, y, map_size, map_size);
    };
}

var draw_tile_from_sprite_sheet = function(path,rotation,spritsheet,x,y,map_size){
    let angle = (rotation * Math.PI) / 180;
    map_layer_context.translate(x, y);
    map_layer_context.rotate(angle);
    map_layer_context.drawImage(spritsheet, path.x, path.y, map_size, map_size, -map_size/2, -map_size/2, map_size, map_size);
    map_layer_context.rotate(-angle);
    map_layer_context.strokeStyle = "black";
    map_layer_context.strokeRect(-map_size/2, -map_size/2, map_size, map_size);
    map_layer_context.translate(-x, -y);
    map_layer_context.beginPath();
}
