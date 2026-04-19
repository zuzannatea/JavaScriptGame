import { canvas, game_manager, player } from "../main.js";
import {TILE_SIZE, COLLIDER_TILES} from "./levelmanagement.js";
import {dist as calcDist,randint, choose, is_colliding} from "./utils.js";


let all_entities = [];

class Entity{
	constructor(width, height) {
		this.canvas = [width, height];
		this.x;
		this.y;
		this.length = 20;
		this.height = 20;

		this.speed = 5;
		this.strength = 10;
		this.max_health = 50;

		this.curr_health = this.max_health;

		this.last_attack = Date.now(); 
	}
	take_damage(amount=10){
		if (Date.now() - this.last_attack < 750 || this.curr_health <= 0){
			return;
		}
		this.last_attack = Date.now();
		if (this.curr_health - amount <= 0){
			this.curr_health = 0;
			this.die();
			return true;
		}
		else{
			this.curr_health = this.curr_health - amount;
			return false;
		}
	}
	die(){
		game_manager.remove_entity(this);
	}
	try_move(xMove,yMove){
		if (this.x + this.length + xMove >= this.canvas[0] ||
			this.x + xMove < 0 ||
			this.y + this.height + yMove >= this.canvas[1] ||
			this.y + yMove < 0){
				return false;
		}

		let moved = false;

		if (xMove !== 0){
			this.move_by(xMove,0);
			if (this.tile_colliding()){
				this.move_by(-xMove,0);
			} else {
				moved = true;
			}
		}
		if (yMove !== 0){
			this.move_by(0,yMove);
			if (this.tile_colliding()){
				this.move_by(0,-yMove);
			} else {
				moved = true;
			}
		}
		if (!moved){
			return false;
		}
		let entity_colliding = this.entity_colliding();
		if (entity_colliding){
			this.move_by(-xMove,-yMove);
			let distance = this.estimate_distance(this,entity_colliding,xMove,yMove);
			this.move_by(distance[0],distance[1]);
			return false; 
		}

		return true;
	}
	move_by(xMove,yMove){
		this.x = this.x + xMove;
		this.y = this.y + yMove;
	}
	estimate_distance(object, entity_colliding, xMove, yMove){
		if (xMove < 0){
			xMove = (object.x - entity_colliding.x - entity_colliding.length) * -1;
		}
		else if (xMove > 0){
			xMove = entity_colliding.x - object.x - object.length;
		}
		if (yMove < 0){
			yMove = (object.y - object.height - entity_colliding.y) * -1;
		}
		else if (yMove > 0){
			yMove = entity_colliding.y - entity_colliding.height - object.y;
		}
		return [xMove, yMove];
	
	}
	tile_colliding(){
		let all_tiles = this.get_current_tiles();
		let collisions = [];
		for (let tile of all_tiles){
			if (game_manager.current_level.get_tile(tile[0], tile[1]) === "red"){
				collisions.push({
					x : tile[0],
					y : tile[1],
					length : TILE_SIZE,
					height : TILE_SIZE,
				});
			}
		}
		if (collisions.length > 0){return collisions;}
		return false;
	}
	get_current_tiles(x = this.x, y = this.y, length = this.length, height = this.height){
		let pos1 = [Math.floor(x/TILE_SIZE), Math.floor(y/TILE_SIZE)];
		let pos2 = [Math.floor((x+length)/TILE_SIZE), Math.floor(y/TILE_SIZE)];
		let pos3 = [Math.floor((x+length)/TILE_SIZE), Math.floor((y+height)/TILE_SIZE)];
		let pos4 = [Math.floor(x/TILE_SIZE), Math.floor((y+height)/TILE_SIZE)];
		return [pos1, pos2, pos3, pos4];	
	}
	
	entity_colliding(){
		for (let entity of game_manager.enemies){
			if (is_colliding(this,entity) && this != entity){
				return entity;
			}
		}
		return false;
	}

}

class Enemy extends Entity{
	constructor(width, height, player) {
		super();
		this.player = player;

		this.canvas = [width, height];
		this.x;
		this.y;
		this.points = 10;
		let point = this.pick_a_point();
		[this.x, this.y] = [point.x, point.y];
		this.speed = 2.5;
		this.target = {x : this.x, y : this.y};

		this.colour = "yellow";
	}

	pick_a_point(){
		let cleared = false; 
		let point;
		let tiles;
		let checker = false;
		while (!cleared){
			point = {x : randint(this.length, this.canvas[0] - this.length), y : randint(this.height, this.canvas[1] - this.height)};
			tiles = this.get_current_tiles(point.x, point.y);
			checker = true;
			for (let tile of tiles){
				if (game_manager.current_level.get_tile(tile[0],tile[1]) === "red"){
					checker = false;
					continue;
				}
			}
			if (checker === true){
				cleared = true;
			}
		}
		return point;
	}

	update(current_level, priority=0){
		if (current_level.distance_to_player.length===0){return;}

		if (calcDist(this,this.player) > 300){
			this.colour = "purple";
			
			this.wander();
		}
		else if (calcDist(this,this.player) < 50){
			this.colour = "orange";
			this.attack_charge();
		}
		else{
			this.hunt(current_level, priority);
		}
	}
	hunt(current_level, priority){
		let [xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
		while(!this.try_move(xMove * this.speed/2, yMove * this.speed/2)){
			this.snap_to_tile();
			[xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
		} 
	}
	wander(){
		if (this.target.length === 0 || is_in_range(this,this.target, 30)){
			this.target = this.pick_a_point();
		}
		let xMove;
		let yMove;
		let dx = this.target.x - this.x;
		let dy = this.target.y - this.y;
		let distance = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
		if (distance <= 0.1){
			this.target = this.pick_a_point();
			return;
		}
		dx = dx/distance;
		dy = dy/distance;
		xMove = dx*this.speed/4;
		yMove = dy*this.speed/4;
		if (!(this.try_move(xMove,0) && this.try_move(0, yMove))){
			this.snap_to_tile();
			this.target = this.pick_a_point();
		}
	}

	get_next_best_move(distance,priority){
		
		let current_tiles = this.get_current_tiles();
		let possible_tiles = [];
		if (distance.length===0){return;}

		let [y_current, x_current] = current_tiles[0];
		if (y_current < distance.length-1){
			possible_tiles.push({
				move : [1,0],
				tile : [y_current+1,x_current],
				value : distance[y_current+1][x_current]});
		}
		if (y_current > 0){
			possible_tiles.push({
				move : [-1,0],
				tile : [y_current-1, x_current],
				value : distance[y_current-1][x_current]});
		}
		if (x_current < distance[0].length-1){
			possible_tiles.push({
				move : [0,-1],
				tile : [y_current, x_current-1],
				value : distance[y_current][x_current-1]});
		}
		if (x_current > 0){
			possible_tiles.push({
				move : [0,1],
				tile : [y_current, x_current+1],
				value : distance[y_current][x_current+1]});
		}
		if (priority > possible_tiles.length-1){
			priority = 0;
		}
		possible_tiles.sort((a, b) => a.value - b.value);

		if (possible_tiles.length === 0){console.log("length 0");return [0,0];}
		if (possible_tiles[priority].value === Number.MAX_SAFE_INTEGER){
			console.log("infinity");return [0,0];
		}
		return possible_tiles[priority].move;
	}

	attack_charge(){

		if (calcDist(this,this.player) >= 25){
			let xMove; let yMove;
			let dx = this.player.x - this.x;
			let dy = this.player.y - this.y;
			let dist = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
			dx = dx/dist;
			dy = dy/dist;
			xMove = (dx*this.speed);
			yMove = (dy*this.speed);
			this.try_move(xMove, yMove);
		}

		if (calcDist(this,this.player) < 25){
			this.colour = "black";
			this.player.take_damage(this.strength);
		}
		else{this.colour = "orange";}

	}
	snap_to_tile(){
		this.x = Math.floor(this.x / TILE_SIZE) * TILE_SIZE + (TILE_SIZE - this.length) / 2;
		this.y = Math.floor(this.y / TILE_SIZE) * TILE_SIZE + (TILE_SIZE - this.height) / 2;
		
	}	
	
	draw(context){
		context.fillStyle = "red";
		context.fillRect(this.x, this.y - 10, (this.curr_health/this.max_health)*this.length, 5);
		context.fillStyle = this.colour;
		context.fillRect(this.x, this.y, this.length, this.height);
	}

	tile_colliding(){
		let all_tiles = this.get_current_tiles();
		let collisions = [];
		for (let tile of all_tiles){
			if (game_manager.current_level.get_tile(tile[0], tile[1]) === "red"){
				collisions.push({
					x : tile[0],
					y : tile[1],
					length : TILE_SIZE,
					height : TILE_SIZE,
				});
			}
		}
		if (collisions.length > 0){
			return collisions;}
		return false;
	}

}

class Zombie extends Enemy{
	constructor(width, height) {
		super(width, height);

		this.colour = "teal";
	}
	update(current_level, priority=0){
		if (current_level.distance_to_player.length===0){return;}
		if (calcDist(this,this.player) < 50){
			this.colour = "orange";
			this.attack_charge();
		}
		else{
			let [xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
			while(!this.try_move(xMove * this.speed/2, yMove * this.speed/2)){
				this.snap_to_tile();
				[xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
			} 
		}
	}

}

class Swarmer extends Enemy{
	constructor(width, height) {
		super(width, height);
		this.speed = 3;
		this.speed_modifier = 1.05;
		this.base_speed = 3;
		this.max_health = 25;
		this.colour = "liliac";
		this.friends = [];

	}
	count_friends(){
		let counter = 0;
		for (let enemy of game_manager.enemies){
			if (enemy instanceof Swarmer && enemy != this){
				counter = counter + 1;
			}
		}
		return counter;
	}
	find_a_friend(){
		let best_friend = {entity : undefined, distance : 0}
		for (let enemy of game_manager.enemies){
			if (enemy instanceof Swarmer && enemy != this && (!enemy in this.friends)){
				let distance = calcDist(this,entity);
				if (distance < best_friend.distance){
					best_friend = {entity : enemy, distance : distance};
				}
			}
		}
		if (best_friend.entity){
			return {x : best_friend.entity.x, y : best_friend.entity.y};
		}
		return this.pick_a_point;
	}
	hunt_a_friend(){
		if (this.target.length === 0 || is_in_range(this,this.target, 30)){
			this.target = this.find_a_friend();
		}
		let xMove;
		let yMove;
		let dx = this.target.x - this.x;
		let dy = this.target.y - this.y;
		let distance = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
		if (distance <= 0.1){
			this.target = this.find_a_friend();
			return;
		}
		dx = dx/distance;
		dy = dy/distance;
		xMove = dx*this.speed/4;
		yMove = dy*this.speed/4;
		if (!(this.try_move(xMove,0) && this.try_move(0, yMove))){
			this.snap_to_tile();
			this.target = this.find_a_friend();
		}
	}
	update_current_friends(){
		let entities = game_manager.entities_in_range(this);
		let current_friends = [];
		for (let entity of entities){
			if (entity instanceof Swarmer && entity != this){
				current_friends.push(entity);
			}
		}
		if (current_friends.length != this.friends.length){
			this.friends = current_friends;
		}
	}
	update(current_level, priority=0){
		if (current_level.distance_to_player.length===0){return;}
		this.update_current_friends();
		//spped modifier 
		if (this.friends.length > 3){
			this.speed = this.speed * (this.speed_modifier*this.friends.length);
		}
		else{
			this.speed = this.base_speed;
		}
		//behaviour 
		if (this.count_friends() < 1 && this.count_friends() > 0){
			this.target = this.find_a_friend();
		}
		else if (this.count_friends() < 5){
			this.wander();
		}
		else{
			this.hunt(current_level, priority);
		}
		//standard attack 
		if (calcDist(this,this.player) < 50){
				this.colour = "orange";
				this.attack_charge();
		}

		
	}
}
class Charger extends Enemy{
	constructor(width, height) {
		super(width, height);
		this.speed = 1.5;
		this.colour = "maroon";
		this.charging = false;
	}
	draw(context){
		context.fillStyle = "red";
		context.fillRect(this.x, this.y - 10, (this.curr_health/this.max_health)*this.length, 5);
		context.fillStyle = this.colour;
		context.fillRect(this.x, this.y, this.length, this.height);
		if (this.charging){
			context.beginPath();
			context.moveTo(this.x+(this.length/2),this.y+(this.height/2));
			context.lineTo(this.player.x+(this.player.length/2),this.player.y+(this.player.height/2));
			context.strokeStyle = "orange";
			context.lineWidth = 1;
			context.stroke();
		}
	}

	exists_straight_path(distance){
		let current_tiles = this.get_current_tiles();
		let [y_current, x_current] = current_tiles[0];
		let counter = distance[y_current][x_current];
		if (x_current > 0){
			for (let x = x_current - 1; x >= 0; x--){
				if (distance[y_current][x] === counter - 1){
					counter = counter - 1; 
					if (counter === 0){
						return true;
					}
				}
				else{
					break;
				}
			}
		}
		counter = distance[y_current][x_current];
		if (x_current < distance[0].length - 1){
			for (let x = x_current + 1; x < distance[0].length; x++){
				if (distance[y_current][x] === counter - 1){
					counter = counter - 1;
					if (counter === 0){
						return true;
					}
				}
				else{
					break;
				}
			}
		}
		counter = distance[y_current][x_current];
		if (y_current > 0){
			for (let y = y_current - 1; y >= 0; y--){
				if (distance[y][x_current] === counter - 1){
					counter = counter - 1; 
					if (counter === 0){
						return true;
					}
				}
				else{
					break;
				}
			}
		}
		counter = distance[y_current][x_current];
		if (y_current < distance.length - 1){
			for (let y = y_current + 1; y < distance.length; y++){
				if (distance[y][x_current] === counter - 1){
					counter = counter - 1; 
					if (counter === 0){
						return true;
					}
				}
				else{
					break;
				}
			}
		}
		return false;
	}
	attack_charge(){
		this.charging = true;
		let player_distance = calcDist(this,this.player);
		if (player_distance >= 32){
			this.target = {x : this.player.x, y : this.player.y};
			this.move_towards_target();
		}

		if (player_distance < 32){
			this.colour = "black";
			this.player.take_damage(this.strength);
		}
		else{this.colour = "maroon";}

	}
	move_towards_target(){
		if (this.target.length === 0 || is_in_range(this,this.target, 30)){
			return;
		}
		let xMove;
		let yMove;
		let dx = this.target.x - this.x;
		let dy = this.target.y - this.y;
		let distance = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
		if (distance <= 0.1){
			return;
		}
		dx = dx/distance;
		dy = dy/distance;
		xMove = dx*this.speed*4;
		yMove = dy*this.speed*4;
		if (!(this.try_move(xMove,0) && this.try_move(0, yMove))){
			this.snap_to_tile();
		}
	}
	update(current_level, priority=0){
		if (current_level.distance_to_player.length===0){return;}

		if (this.exists_straight_path(current_level.distance_to_player)){
			this.colour = "brown";
			this.attack_charge();
		}
		else if (calcDist(this,this.player) > 300){
			this.charging = false;
			this.wander();
		}
		else{
			this.charging = false;
			let [xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
			while(!this.try_move(xMove * this.speed/2, yMove * this.speed/2)){
				this.snap_to_tile();
				[xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
			} 
		}
	}

}
class Splitter extends Enemy{
	constructor(width, height,lives=3) {
		super(width, height);
		this.colour = "lime";
		if (lives != 3){
			[this.lives, this.x, this.y, this.width, this.height] = lives;
		}
		else{
			this.lives = lives;
		}
	}
	die(){
		if (this.lives > 1){
			game_manager.add_entity(Splitter,this.lives-1,this.x+(randint(-1,1)*TILE_SIZE),this.y+(randint(-1,1)*TILE_SIZE), this.width*0.75, this.height*0.75);
			game_manager.add_entity(Splitter,this.lives-1, this.x+(randint(-1,1)*TILE_SIZE), this.y+(randint(-1,1)*TILE_SIZE), this.width*0.75, this.height*0.75);
		}
		game_manager.remove_entity(this);
	}


}
class Teleporter extends Enemy{
	constructor(width, height,player) {
		super(width, height, player);
		this.colour = "pink";
		this.speed = 2;
		this.buffering_timestamp;
		this.teleporting_timestamp = Date.now() + 2500;
	}
	move_instantly(x,y){
		this.x = x;
		this.y = y;
		this.snap_to_tile();
	}
	check_buffering_time(){
		if (!this.buffering_timestamp){return false;}
		if (this.buffering_timestamp - Date.now() < 0){
			this.buffering_timestamp = undefined;
			this.colour = "black";
			return false;
		}
		return true;
	}

	teleport(current_level){
		let distance = current_level.distance_to_player;
		let possible_choice_in_tiles = []; 
		for (let row = 0; row < distance.length; row++){
			for (let col = 0; col < distance[0].length; col++){
				let curr_dist = distance[row][col];
				if (curr_dist === 4 || curr_dist === 5){
					possible_choice_in_tiles.push({
						x : row, 
						y : col,
						value : curr_dist
					})
				}
			}
		}
		let chosen = choose(possible_choice_in_tiles);
		current_level.set_warning_tiles(chosen.x, chosen.y, Date.now() + 2000);
		this.buffering_timestamp = Date.now()+2000;
		this.teleporting_timestamp = Date.now() + 15000;
		this.colour = "white";//placeholder!!
		let [chosen_x, chosen_y] = [chosen.x * TILE_SIZE, chosen.y * TILE_SIZE];
		this.move_instantly(chosen_x, chosen_y);
		return;
	}
	can_teleport(){
		if (!this.teleporting_timestamp){return true;}
		if (this.teleporting_timestamp - Date.now() < 0){
			return true;
		}
		return false;
	}
	draw(context){
		if (this.check_buffering_time()){return;}
		context.fillStyle = "red";
		context.fillRect(this.x, this.y - 10, (this.curr_health/this.max_health)*this.length, 5);
		context.fillStyle = this.colour;
		context.fillRect(this.x, this.y, this.length, this.height);
	}

	update(current_level, priority=0){
		if (current_level.distance_to_player.length===0){return;}

		if (this.check_buffering_time()){return;}
			//console.log(this,this.player);

		if (calcDist(this,this.player) > 300){
			this.wander();
		}
		else if(calcDist(this,this.player) > 150){
			if (this.can_teleport()){
				this.teleport(current_level);
			}
			else{
				this.hunt(current_level, priority);
			}
		}
		else if (calcDist(this,this.player) < 50){
			this.colour = "orange";
			this.attack_charge();
		}
	}


}

class Player extends Entity{
	constructor(width, height) {
		super();
		this.ability_manager = new AbilityManager(this);
		this.canvas = [width,height];
		this.x = Math.floor(canvas.width/2);
		this.y = Math.floor(canvas.height/2);

		this.max_health = 100;
		this.curr_health = 100;
		this.score = 0;
		this.extraMoves = [];

		this.speed = 5;
		
		this.pressedKeys = new Set();

		this.keyPressTimer;
		this.cooldown = 0; 
		this.longQTap = false;
		this.shortQTap = false;


		this.invincibility = false;
		this.kill_aura = false; 
		this.invulnerability = false;
		this.invulnerability_timestamp;
		this.speeding_timestamp;

		this.colour = "cyan";
	
	}
	handle_key_presses(action){
        if (action === "specialMove" && !this.pressedKeys.has("specialMove")){
            this.keyPressTimer = Date.now();
        }
		this.pressedKeys.add(action);
		return;
	}
	handle_key_releases(action){
		if (action === "specialMove"){
			if (Date.now()-this.keyPressTimer < 850){
				this.shortQTap = true;
			}
			else{
				this.longQTap = true;
			}
			this.keyPressTimer = 0;
		}
		this.pressedKeys.delete(action);
		return;
	}
	take_damage(amount=10){
		if (this.invulnerability){return;}
		if (this.invincibility){return;}

		if (Date.now() - this.last_attack < 750 || this.curr_health <= 0){
			return;
		}
		this.last_attack = Date.now();
		if (this.curr_health - amount <= 0){
			this.curr_health = 0;
			this.die();
			return true;
		}
		else{
			this.curr_health = this.curr_health - amount;
			return false;
		}
	}

	check_rolling(){
		if (!this.invulnerability_timestamp){return;}
		let distance = this.invulnerability_timestamp - Date.now();
		if (distance < 0){
			this.invulnerability_timestamp = undefined;
			this.invulnerability = false; 
			return true;
		}
		return false;
	}
	check_charging(){
		if (!this.speeding_timestamp){return;}
		let distance = this.speeding_timestamp - Date.now();
		if (distance < 0){
			this.speeding_timestamp = undefined;
			this.speed = Math.ceil(this.speed/2);
			return true;
		}
		return false;

	}
	check_abilities(){
		this.check_rolling();
		this.check_charging();
	}


	update(){
		//console.log("RUNS PLAYER");
		this.check_abilities();
		this.cooldown = Math.max(this.cooldown - 1,0);

		if (this.pressedKeys.has("moveRight")){
			this.try_move(this.speed,0);
		}
		if (this.pressedKeys.has("moveLeft")){
			this.try_move(-this.speed,0);
		}
		if (this.pressedKeys.has("moveUp")){
			this.try_move(0,-this.speed);
		}
		if (this.pressedKeys.has("moveDown")){
			this.try_move(0,this.speed);
		}
		if (this.pressedKeys.has("isAttacking") || this.kill_aura){
			this.attack();
		}

		if (this.cooldown <= 0){
			if (this.pressedKeys.has("specialMoveModifier")){
				this.ability_manager.perform("roll");
				this.cooldown = 25;
			
			}
			else if (this.longQTap){
				this.ability_manager.perform("roll");
				this.longQTap = false;
				this.cooldown = 25;
			}
			else if (this.shortQTap){
				this.ability_manager.perform("roll");
				this.shortQTap = false;
				this.cooldown = 25;
			}
		}
	}
	ranged_attack(range=45){
		let entities = game_manager.entities_in_range(this,range);
		for (let entity of entities){
			this.attack(entity);
		}
	}
	attack(){
		let entities = game_manager.entities_in_range(this);
		if (entities.length != 0){
			let entity = entities.pop();
			this.attack_entity(entity);
			return true;
		}
		return false;
	}
	attack_entity(target){
		if (target.take_damage(this.strength)){
			this.score += target.points;
		}
	}

	draw(context){
		context.fillStyle = this.colour;
		context.fillRect(this.x, this.y, this.length, this.height);
		context.fillStyle = "red";
		context.fillRect(this.x, this.y - 10, (this.curr_health/this.max_health)*this.length, 5);
		context.font = "50px Arial";
		context.fillStyle = "black";
		context.fillText("Score: "+this.score,10,80);
		context.font = "20px Arial";
		context.fillText("Curr Health: "+this.curr_health, 10, 130);
		context.fillText("Max Health: "+this.max_health, 10, 130+20);
		context.fillText("Speed: "+this.speed, 10, 130+40);
		context.fillText("Strength: "+this.strength, 10, 130+60);


	}
	claim_boost(boost){
		let garbage_can = boost.get_claimed();
		let [amount, type] = [garbage_can.amount, garbage_can.type];
		this[type] = this[type] + amount;
		console.log("Claimed boost of",type,"with value",amount,"which amounts to",this[type]);
	}


}

class AbilityManager{
	constructor(player){
		this.player = player;
		this.all_abilities = {
			smash : Smash,
			roll : Roll,
			charge : Charge
		};
		this.current_abilities = {
			smash : 0, 
			roll : 0, 
			charge : 0
		};
	}
	gain_ability(name){
		if (name in this.current_abilities){
			if (this.current_abilities[name] === 0){
				let construct = this.all_abilities[name];
				this.current_abilities[name] = new construct(this.player);
				return true;
			}
		}
		return false;
	}
	perform(name){
		if (this.current_abilities[name]){
			if (this.current_abilities[name] === 0){
				return;
			}
			else{
				this.current_abilities[name].use();
			}
		}
	}
	level_up(name){
		if (this.current_abilities[name]){
			if (this.current_abilities[name] === 0){
				this.gain_ability(name);
			}
			else{
				this.current_abilities[name].level_up();
			}
		}
	}
	set_level(name,level){
		if (name in this.current_abilities && level > 0 && level <= 3){
			if (this.current_abilities[name]){
				this.current_abilities[name].set_level(level);
			}
			else{
				this.gain_ability(name);
				this.current_abilities[name].set_level(level);

			}
		}
	}
}

class Ability{
	constructor(player){
		this.player = player;
		this.damage_per_use; 
		this.level = 1;
		this.max_level = 3;
		this.levels = {}
	}
	use(){
		console.log("Used",this,this.level);
		this[this.levels[this.level]]();
	}
	level_up(){
		if (this.level < this.max_level){
			this.level = this.level + 1;
		}
	}
	set_level(lvl){
		this.level = lvl;
	}
}

class Smash extends Ability{
	constructor(player){
		super(player);
		this.levels = {
			1 : "smash", 
			2 : "double_smash",
			3 : "mega_smash"
		}
	}
	smash(){
		this.player.ranged_attack();
	}
	double_smash(){
		this.player.ranged_attack(60);
	}
	mega_smash(){
		this.player.ranged_attack(75);
		this.player.invulnerability_timestamp = Date.now() + 250;
	}

}
class Roll extends Ability{
	constructor(player){
		super(player);
		this.levels = {
			1 : "roll", 
			2 : "prolonged_roll",
			3 : "damage_roll"
		}
	}
	roll(){
		this.player.invulnerability = true;
		this.player.invulnerability_timestamp = Date.now() + 250;
	}
	prolonged_roll(){
		this.player.invulnerability = true;
		this.player.invulnerability_timestamp = Date.now() + 500;
	}
	damage_roll(){
		this.player.invulnerability = true;
		this.player.invulnerability_timestamp = Date.now() + 750;
		this.player.ranged_attack();
	}
}
class Charge extends Ability{
	constructor(player){
		super(player);
		this.levels = {
			1 : "charge", 
			2 : "faster_charge",
			3 : "explosion_charge"
		}
	}
	charge(){
		this.player.speed = this.player.speed*1.5;
		this.player.speeding_timestamp = Date.now() + 250;
		this.player.attack();
	}
	faster_charge(){
		this.player.speed = this.player.speed*2;
		this.player.speeding_timestamp = Date.now() + 500;
		this.player.attack();
	}
	explosion_charge(){
		this.player.speed = this.player.speed*2.5;
		this.player.speeding_timestamp = Date.now() + 750;
		this.player.ranged_attack(60);
	}

}

class StatBoost{
	constructor(){
		this.available_boosts = [
			{type : "speed", colour: "yellow"}, 
			{type : "strength", colour : "brown"}, 
			{type : "curr_health", colour : "pink"}, 
			{type : "max_health", colour : "orange"}];
		this.boost = choose(this.available_boosts);
		this.amount = randint(1,5);
		this.x; this.y;
		//[this.x,this.y] = this.find_a_spawn_place();
		this.height = 15;
		this.length = 15;
	}
	find_a_spawn_place(){
		let distance = game_manager.current_level.distance_to_player;
		let possible_choice_in_tiles = [];
		console.log(distance);
		for (let row = 2; row < distance.length-2; row++){
			for (let col = 2; col < distance[0].length-2; col++){
				let curr_dist = distance[row][col];
				if (curr_dist > 5 && curr_dist < Number.MAX_SAFE_INTEGER){
					possible_choice_in_tiles.push({
						x : row, 
						y : col,
						value : curr_dist
					})
				}
			}
		}
		let chosen = choose(possible_choice_in_tiles);
		//let tile_x = (TILE_SIZE/2 + chosen.x) - (this.length/TILE_SIZE)/2;
		let pixel_x = chosen.x * TILE_SIZE;
		//let tile_y = (TILE_SIZE/2 + chosen.y) - (this.height/TILE_SIZE)/2;
		let pixel_y = chosen.y * TILE_SIZE;
		return [pixel_x, pixel_y]


	}
	draw(context){
		if (!this.x){
			[this.x,this.y] = this.find_a_spawn_place();
		}
		context.fillStyle = this.boost.colour;
		context.fillRect(this.x, this.y, this.length,this.height);
	}
	get_claimed(){
		return {amount : this.amount, type : this.boost.type};
	}
}


function is_in_range(object1, object2, attack_range=20){
	if (calcDist(object1, object2) < attack_range){
		return true;
	}
	return false;
}




export { Enemy, Player, Zombie, Charger, Splitter, Swarmer, Teleporter, StatBoost };

