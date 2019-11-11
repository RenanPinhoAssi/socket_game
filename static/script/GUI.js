var draw_player = function(context,color,x,y,size){
    context.fillStyle = color;
    context.beginPath();
    context.arc(x,y,size,0,2*Math.PI);
    context.fill();
}

var draw_bullet_shell = function(context,color,x,y,size){
    context.fillStyle = color;
    context.beginPath();
    context.arc(x,y,size,0,2*Math.PI);
    context.fill();
}