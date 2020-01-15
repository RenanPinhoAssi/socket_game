module.exports = {
	create_bullet: function(PLAYER,PLAYER_SIZE,WEAPON_SETTINGS,BULLET_DISTANCE,BULLETS) {
		let size = PLAYER_SIZE + WEAPON_SETTINGS[PLAYER["weapon"]]["SIZE"];
		let angle = PLAYER["angle"];
		let bullet = {
			xi: PLAYER["coordinates"].x + size * Math.cos(angle),
			yi: PLAYER["coordinates"].y + size * Math.sin(angle),
			x: PLAYER["coordinates"].x + size * Math.cos(angle),
			y: PLAYER["coordinates"].y + size * Math.sin(angle),
			angle: angle,
			shoot_date: new Date().getTime(),
			distance_time: BULLET_DISTANCE,
			alive: true,
			owner: PLAYER
		};
		BULLETS.push(bullet);
	},
	perform_shoot: function(PLAYER,PLAYER_SIZE,WEAPON_SETTINGS,BULLET_DISTANCE,BULLETS){
		let self = this;
		if (PLAYER["alive"] && PLAYER["shooting"]) {
			// DEFAULT - AUTO
			PLAYER["next_shoot_time"] = new Date().getTime() + 100;
			self.create_bullet(PLAYER,PLAYER_SIZE,WEAPON_SETTINGS,BULLET_DISTANCE,BULLETS);

			if(PLAYER["weapon_mode"] == 0){
				// MANUAL - STOP SHOOTING
				PLAYER["shooting"] = false;

			}else if(PLAYER["weapon_mode"] == 1){
				// BURST - FIRE 2 MORE BULLETS
				PLAYER["shooting_burst"] = true;
				setTimeout(function(){self.create_bullet(PLAYER,PLAYER_SIZE,WEAPON_SETTINGS,BULLET_DISTANCE,BULLETS)},100);
				setTimeout(function(){
					self.create_bullet(PLAYER,PLAYER_SIZE,WEAPON_SETTINGS,BULLET_DISTANCE,BULLETS);
				},200);
				
				PLAYER["next_shoot_time"] += 600;
			}
		}
	}
};
