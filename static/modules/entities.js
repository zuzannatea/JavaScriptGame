import { canvas, game_manager, player } from "../main.js";
import {TILE_SIZE, COLLIDER_TILES} from "./levelmanagement.js";
import {dist as calcDist,randint} from "./utils.js";


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
		if (Date.now() - this.last_attack < 500 || this.curr_health <= 0){
			return;
		}
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
		console.log("Died", this);
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
	constructor(width, height) {
		super();
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
		if (calcDist(this,player) > 300){
			this.colour = "purple";
			
			this.wander();
		}
		else if (calcDist(this,player) < 50){
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
		if (calcDist(this,player) >= 25){
			let xMove; let yMove;
			let dx = player.x - this.x;
			let dy = player.y - this.y;
			let dist = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
			dx = dx/dist;
			dy = dy/dist;
			xMove = (dx*this.speed);
			yMove = (dy*this.speed);
			this.try_move(xMove, yMove);
		}

		if (calcDist(this,player) < 25){
			this.colour = "black";
			player.take_damage(this.strength);
		}else{this.colour = "orange";}

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
	check_proximity(){
		if (dist(this,player) < 100){
			this.target = {x : player.x, y : player.y};
			console.log("Detected");
		}
		if (is_in_range(this,player)){
			player.health = player.health - 10;
			console.log("Attacked");
		}
		
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
		if (calcDist(this,player) < 50){
			console.log("now");
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
		if (calcDist(this,player) < 50){
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
			context.lineTo(player.x+(player.length/2),player.y+(player.height/2));
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
		let player_distance = calcDist(this,player);
		if (player_distance >= 32){
			this.target = {x : player.x, y : player.y};
			this.move_towards_target();
		}

		if (player_distance < 32){
			this.colour = "black";
			player.take_damage(this.strength);
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
		if (this.exists_straight_path(current_level.distance_to_player)){
			this.colour = "brown";
			this.attack_charge();
		}
		else if (calcDist(this,player) > 300){
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
	constructor(width, height) {
		super(width, height);
		this.colour = "pink";
		this.buffering_timestamp;
	}
	move_instantly(x,y){}
	set_waiting_time(timestamp){}
	update(current_level, priority=0){
		if (calcDist(this,player) > 300){
			this.colour = "purple";
			this.wander();
		}
		else if(calcDist(this,player) > 50){
			this.teleport(current_level);
		}
		else if (calcDist(this,player) < 50){
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
		this.pauseCooldown = 0;
		this.longQTap = false;
		this.shortQTap = false;

		this.running = true;

		this.invulnerability = false;
		this.invulnerability_timestamp;
		this.speeding_timestamp;

		this.colour = "cyan";
	
	}
	take_damage(amount=10){
		if (this.invulnerability){return;}

		if (Date.now() - this.last_attack < 500 || this.curr_health <= 0){
			return;
		}
		
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
		this.check_abilities();
		this.pauseCooldown = Math.max(this.pauseCooldown - 1,0);
		if (this.pauseCooldown <= 0){
			if (this.pressedKeys.has("running")){
				this.running = !this.running;
				this.pauseCooldown = 5;
			}
		}
		if (!this.running){
			return;
		}

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
		if (this.pressedKeys.has("isAttacking")){
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

	}


}

class AbilityManager{
	constructor(player){
		this.player = player;
		this.all_abilities = [Smash, Roll, Charge];
		this.current_abilities = {
			smash : 0, 
			roll : 0, 
			charge : 0
		};
	}
	gain_ability(name){
		if (this.current_abilities[name]){
			if (this.current_abilities[name] === 0){
				this.current_abilities[name] = new name(this.player);
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
		this[this.levels[this.level]]();
	}
	level_up(){
		if (this.level < this.max_level){
			this.level = this.level + 1;
		}
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


function is_colliding(object1, object2){
	if (object1.x + object1.length < object2.x + 5 ||
		object2.x + object2.length < object1.x + 5 ||
		object1.y > object2.y + object2.height ||
		object2.y > object1.y + object1.height){
			return false;
		}
	else{
		return true;
	}
}

function is_in_range(object1, object2, attack_range=20){
	if (calcDist(object1, object2) < attack_range){
		return true;
	}
	return false;
}




export { Enemy, Player, Zombie, Charger, Splitter, Swarmer, Teleporter };

