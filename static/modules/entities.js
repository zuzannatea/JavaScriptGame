import { canvas, game_manager, player } from "../main.js";
import {TILE_SIZE, COLLIDER_TILES} from "./levelmanagement.js";
import {dist as calcDist,randint, choose, blank, is_colliding, load_assets} from "./utils.js";


let all_entities = [];

class Entity{
	constructor(width, height) {
		this.canvas = [width, height];
		this.x;
		this.y;
		this.length = 20;
		this.height = 20;

		this.speed = 1;
		this.strength = 2;
		this.max_health = 30;

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
	animate(){
		if (this.isMoving){
			this.frameTimer++;

			if (this.frameTimer > 10){
				this.frame = (this.frame + 1) % 3;
				this.frameTimer = 0;
			}
		} else {
			this.frame = 1;
		}

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
		return moved;
/* 		if (!moved){
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
 */	}
	resolve_entity_overlap(){
		for (let entity of game_manager.enemies){
			if (!is_colliding(this, entity)) continue;

			//push player in smallest overlap 
			let overlapX = Math.min(this.x + this.length - entity.x, entity.x + entity.length - this.x);
			let overlapY = Math.min(this.y + this.height - entity.y, entity.y + entity.height - this.y);

			if (overlapX < overlapY){
				if (this.x < entity.x){
					this.x -= overlapX;
				} else {
					this.x += overlapX;
				}
			} else {
				if (this.y < entity.y){
					this.y -= overlapY;
				} else {
					this.y += overlapY;
				}
			}
		}
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
			if (!game_manager.current_level.get_tile(tile[0], tile[1]).access){
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
		let pos1 = [Math.floor(y/TILE_SIZE), Math.floor(x/TILE_SIZE)];
		let pos2 = [Math.floor(y/TILE_SIZE), Math.floor((x+length)/TILE_SIZE)];
		let pos3 = [Math.floor((y+height)/TILE_SIZE), Math.floor((x+length)/TILE_SIZE)];
		let pos4 = [Math.floor((y+height)/TILE_SIZE), Math.floor(x/TILE_SIZE)];
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
		this.sprite = new Image();

		this.canvas = [width, height];
		this.x = 0;
		this.y = 0;
		this.spawn_set = false;
		this.points = 10;
		//let point = this.pick_a_point();
		this.speed = 2;
		this.target = {x : this.x, y : this.y};

		this.colour = "yellow";
		this.frame = 1;
		this.frameTimer = 0;
		this.direction = 0;
		this.isMoving = false;

	}
	try_move(xMove,yMove){
		const startX = this.x;
		const startY = this.y;

		if (this.x + this.length + xMove >= this.canvas[0] ||
			this.x + xMove < 0 ||
			this.y + this.height + yMove >= this.canvas[1] ||
			this.y + yMove < 0){
				return false;
		}

		let moved = false;

		if (xMove !== 0){
			this.move_by(xMove,0);
			if (this.tile_colliding() || this.entity_colliding()){
				this.move_by(-xMove,0);
			} else {
				moved = true;
			}
		}
		if (yMove !== 0){
			this.move_by(0,yMove);
			if (this.tile_colliding() || this.entity_colliding()){
				this.move_by(0,-yMove);
			} else {
				moved = true;
			}
		}
		if (!moved){
			return false;
		}
/* 		let entity_colliding = this.entity_colliding();
		if (entity_colliding){
			this.move_by(-xMove,-yMove);
			//let distance = this.estimate_distance(this,entity_colliding,xMove,yMove);
			//this.move_by(distance[0],distance[1]);
			return false; 
		}
 */		let dx = this.x - startX;
		let dy = this.y - startY;

		if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001){
			this.setDirection(dx, dy);
			this.isMoving = true;
		} else {
			this.isMoving = false;
		}
		return true;
	}

	setDirection(xMove, yMove){
		if (Math.abs(xMove) > Math.abs(yMove)){
			if (xMove > 0) this.direction = 2;
			else this.direction = 1; 
		} else {
			if (yMove > 0) this.direction = 0; 
			else this.direction = 3; 
		}
	}
	pick_a_spawn_point(){
		let distance = game_manager.current_level.distance_to_player;
		if (!distance || distance.length === 0){ 
			let point = this.pick_a_point();
			this.x = point.x;
			this.y = point.y;
			return;
		}
		let possible_choices = [];
		for (let row = 1; row < distance.length - 1; row++){
			for (let col = 1; col < distance[0].length - 1; col++){
				let curr_dist = distance[row][col];
				if (curr_dist > 8 && curr_dist < Number.MAX_SAFE_INTEGER){
					possible_choices.push({ row, col });
				}
			}
		}

		if (possible_choices.length === 0){
			for (let row = 1; row < distance.length - 1; row++){
				for (let col = 1; col < distance[0].length - 1; col++){
					if (distance[row][col] < Number.MAX_SAFE_INTEGER){
						possible_choices.push({ row, col });
					}
				}
			}
		}

		let chosen = choose(possible_choices);
		console.log(chosen);
		this.x = chosen.col * TILE_SIZE;
		this.y = chosen.row * TILE_SIZE;
		return;
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
				if (!game_manager.current_level.get_tile(tile[0],tile[1]).access){
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
		if (!this.spawn_set){
			this.spawn_set = true;
			this.pick_a_spawn_point();
			return;
		}
		if (current_level.distance_to_player.length===0){return;}

		this.isMoving = false;

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
		this.animate();

	}
	hunt(current_level, priority){
		let [xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
		this.setDirection(xMove, yMove);

		let attempts = 0;
		while(!this.try_move(xMove * this.speed/2, yMove * this.speed/2)){
			this.snap_to_tile();
			[xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
			if (++attempts > 4){break;}
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
		this.setDirection(xMove, yMove);

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
				move : [0,1],
				tile : [y_current+1,x_current],
				value : distance[y_current+1][x_current]});
		}
		if (y_current > 0){
			possible_tiles.push({
				move : [0,-1],
				tile : [y_current-1, x_current],
				value : distance[y_current-1][x_current]});
		}
		if (x_current < distance[0].length-1){
			possible_tiles.push({
				move : [-1,0],
				tile : [y_current, x_current-1],
				value : distance[y_current][x_current-1]});
		}
		if (x_current > 0){
			possible_tiles.push({
				move : [1,0],
				tile : [y_current, x_current+1],
				value : distance[y_current][x_current+1]});
		}
		if (priority > possible_tiles.length-1){
			priority = 0;
		}
		possible_tiles.sort((a, b) => a.value - b.value);

		if (possible_tiles.length === 0){return [0,0];}
		if (possible_tiles[priority].value === Number.MAX_SAFE_INTEGER){
			return [0,0];
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
		if (!this.spawn_set){return;}
		context.drawImage(
			this.sprite,
			this.frame * TILE_SIZE,
			this.direction * TILE_SIZE,
			TILE_SIZE,
			TILE_SIZE,
			this.x,
			this.y,
			this.length,
			this.height
		);

		context.fillStyle = "red";
		context.fillRect(this.x, this.y - 10, (this.curr_health/this.max_health)*this.length, 5);
/* 		context.fillStyle = this.colour;
		context.fillRect(this.x, this.y, this.length, this.height);
 */	}

	tile_colliding(){
		let all_tiles = this.get_current_tiles();
		let collisions = [];
		for (let tile of all_tiles){
			if (!game_manager.current_level.get_tile(tile[0], tile[1]).access){
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
	constructor(width, height,player) {
		super(width, height,player);
        load_assets([
			{"var" : this.sprite, "url" : "static/assets/sprites/devout-green.png"}
		], blank)

		this.speed = 1;
		this.colour = "teal";
	}
	update(current_level, priority=0){
		if (!this.spawn_set){
			this.spawn_set = true;
			this.pick_a_spawn_point();
			return;
		}

		this.isMoving = false;

		if (current_level.distance_to_player.length===0){return;}
		if (calcDist(this,this.player) < 50){
			this.colour = "orange";
			this.attack_charge();
		}
		else{
			let [xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
			let attempts = 0;
			while(!this.try_move(xMove * this.speed/2, yMove * this.speed/2)){
				this.snap_to_tile();
				[xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
				if (++attempts > 4){break;}
			} 
		}
		this.animate();
	}

}

class Swarmer extends Enemy{
	constructor(width, height,player) {
		super(width, height,player);
		this.speed = 2;
		this.speed_modifier = 1.05;
		this.base_speed = 2;
		this.max_health = 15;
		this.colour = "liliac";
		this.friends = [];
        load_assets([
			{"var" : this.sprite, "url" : "static/assets/sprites/conjurer-red.png"}
		], blank)

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
		return this.pick_a_point();
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
		this.setDirection(xMove, yMove);

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
		if (!this.spawn_set){
			this.spawn_set = true;
			this.pick_a_spawn_point();
			console.log("SWARMER - picked spawn point", this.x,this.y);
			return;
		}

		this.isMoving = false;

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
		if (this.count_friends() <= 1){
			this.target = this.find_a_friend();
		}
		else if (this.count_friends() < 3){
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

		this.animate();

	}
}
class Charger extends Enemy{
	constructor(width, height,player) {
		super(width, height,player);
		this.speed = 1.5;
		this.max_health = 40;
        load_assets([
			{"var" : this.sprite, "url" : "static/assets/sprites/conjurer-green.png"}
		], blank)

		this.colour = "maroon";
		this.charging = false;
	}
	draw(context){
		context.fillStyle = "red";
		context.fillRect(this.x, this.y - 10, (this.curr_health/this.max_health)*this.length, 5);
		context.drawImage(
			this.sprite,
			this.frame * TILE_SIZE,
			this.direction * TILE_SIZE,
			TILE_SIZE,
			TILE_SIZE,
			this.x,
			this.y,
			this.length,
			this.height
		);
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
		this.setDirection(xMove, yMove);

		if (!(this.try_move(xMove,0) && this.try_move(0, yMove))){
			this.snap_to_tile();
		}
	}
	update(current_level, priority=0){
		if (!this.spawn_set){
			this.spawn_set = true;
			this.pick_a_spawn_point();
			return;
		}

		this.isMoving = false;

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
			this.setDirection(xMove, yMove);
			let attempts = 0;
			while(!this.try_move(xMove * this.speed/2, yMove * this.speed/2)){
				this.snap_to_tile();
				[xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
				if (++attempts > 4){break;}
			} 
		}
		this.animate();

	}

}
class Splitter extends Enemy{
	constructor(length, height,player,lives=3) {
		super(length, height,player);
		this.colour = "lime";
        load_assets([
			{"var" : this.sprite, "url" : "static/assets/sprites/conjurer-blue.png"}
		], blank)
		this.speed = 1.5;
		if (lives != 3){
			[this.lives, this.x, this.y, this.length, this.height] = lives;
		}
		else{
			this.lives = lives;
		}
		if (lives === 2){this.max_health = 20;}
		if (lives === 1){this.max_health = 10;}
		
	}
	die(){
    if (this.lives > 1){
        let offsets = [
            [-1,  0],
            [ 1,  0],
            [ 0, -1],
            [ 0,  1],
        ];
        for (let child = 0; child < 2; child++){
            let spawned = false;
            for (let [dr, dc] of offsets){
                let try_x = this.x + dc * TILE_SIZE;
                let try_y = this.y + dr * TILE_SIZE;
                let new_length = Math.max(Math.floor(this.length * 0.75), 8);
                let new_height = Math.max(Math.floor(this.height * 0.75), 8);
                //for all 4 corners!!!
                let tiles = [
                    [Math.floor(try_y / TILE_SIZE),Math.floor(try_x / TILE_SIZE)],
                    [Math.floor(try_y / TILE_SIZE),Math.floor((try_x + new_length) / TILE_SIZE)],
                    [Math.floor((try_y + new_height) / TILE_SIZE),Math.floor(try_x / TILE_SIZE)],
                    [Math.floor((try_y + new_height) / TILE_SIZE),Math.floor((try_x + new_length) / TILE_SIZE)],
                ];
                let clear = true;
                for (let [row, col] of tiles){
                    if (!game_manager.current_level.get_tile(row, col).access){
                        clear = false;
                        break;
                    }
                }
                if (clear){
                    let child_entity = new Splitter(
                        canvas.width, canvas.height, this.player,
                        [this.lives-1, try_x, try_y, new_length, new_height]
                    );
                    child_entity.spawn_set = true;
                    game_manager.enemies.push(child_entity);
                    spawned = true;
                    break;
                }
            }
            //if no adj tile free
            if (!spawned){
                let child_entity = new Splitter(
                    canvas.width, canvas.height, this.player,
                    [this.lives-1, this.x, this.y, 
                     Math.max(Math.floor(this.length * 0.75), 8), 
                     Math.max(Math.floor(this.height * 0.75), 8)]
                );
                child_entity.spawn_set = true;
                game_manager.enemies.push(child_entity);
            }
        }
    }
    game_manager.remove_entity(this);
	}


}
class Teleporter extends Enemy{
	constructor(width, height,player) {
		super(width, height, player);
		this.colour = "pink";
		this.speed = 2;
		this.max_health = 45;
		this.buffering_timestamp;
		this.teleporting_timestamp = Date.now() + 2500;
        load_assets([
			{"var" : this.sprite, "url" : "static/assets/sprites/conjurer-burgundy.png"}
		], blank)

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
		//placeholder!!
		this.colour = "white";
		let [pixel_y, pixel_x] = [chosen.x * TILE_SIZE, chosen.y * TILE_SIZE];
		this.move_instantly(pixel_x, pixel_y);
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
		if (!this.spawn_set){return;}
		if (this.check_buffering_time()){return;}
		context.fillStyle = "red";
		context.fillRect(this.x, this.y - 10, (this.curr_health/this.max_health)*this.length, 5);
		context.drawImage(
			this.sprite,
			this.frame * TILE_SIZE,
			this.direction * TILE_SIZE,
			TILE_SIZE,
			TILE_SIZE,
			this.x,
			this.y,
			this.length,
			this.height
		);
	}

	update(current_level, priority=0){
		if (!this.spawn_set){
			this.spawn_set = true;
			this.pick_a_spawn_point();
			return;
		}

		this.isMoving = false;

		if (current_level.distance_to_player.length===0){return;}

		if (this.check_buffering_time()){return;}

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
		else{
			this.hunt(current_level,priority);
		}
		this.animate();

	}


}

class Player extends Entity{
	constructor(width, height,sfx_manager) {
		super(width, height);
		this.sfx_manager = sfx_manager;
		this.ability_manager = new AbilityManager(this, this.sfx_manager);
		this.canvas = [width,height];
		this.x = Math.floor(canvas.width/2);
		this.y = Math.floor(canvas.height/2);

		this.max_health = 100;
		this.curr_health = 100;
		this.score = 0;
		this.extraMoves = [];

		this.speed = 4;
		this.base_speed = this.speed;
		this.strength = 8;
		
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

		this.sprite = new Image();
        load_assets([
			{"var" : this.sprite, "url" : "static/assets/sprites/conjurer-pink-girl.png"}
		], blank)

		this.frame = 0;
		this.frameTimer = 0;
		this.direction = 0;
		this.isMoving = false;

	
	}
	handle_key_presses(action){
        if (action === "specialMove" && !this.pressedKeys.has("specialMove")){
            this.sfx_manager.loop_sound("player_charging");
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
            this.sfx_manager.unloop_sound("player_charging");

			this.keyPressTimer = 0;
		}
		this.pressedKeys.delete(action);
		return;
	}
	take_damage(amount=10){
		if (this.invulnerability){return;}
		if (this.invincibility){return;}

		this.sfx_manager.play_sound("player_damage");
		if (Date.now() - this.last_attack < 750 || this.curr_health <= 0){
			return;
		}
		this.last_attack = Date.now();
		if (this.curr_health - amount <= 0){
			this.curr_health = 0;
			this.sfx_manager.play_sound("player_death");

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
			this.speed = this.base_speed;
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
		this.cooldown = Math.max(this.cooldown - 1,0);

		this.isMoving = false;


		if (this.pressedKeys.has("moveRight")){
			this.try_move(this.speed,0);
			this.direction = 2;
			this.isMoving = true;

		}
		if (this.pressedKeys.has("moveLeft")){
			this.try_move(-this.speed,0);
			this.direction = 1;
			this.isMoving = true;
		}
		if (this.pressedKeys.has("moveUp")){
			this.try_move(0,-this.speed);
			this.direction = 3;
			this.isMoving = true;
		}
		if (this.pressedKeys.has("moveDown")){
			this.try_move(0,this.speed);
			this.direction = 0;
			this.isMoving = true;
		}
		if (this.pressedKeys.has("isAttacking") || this.kill_aura){
			this.attack();
		}
		this.animate();
		this.resolve_entity_overlap();

		if (this.cooldown <= 0){
			this.check_rescue();
			if (this.pressedKeys.has("specialMoveModifier")){
				console.log("SPECIAL");
				this.ability_manager.perform("roll");
				this.cooldown = 25;
			
			}
			else if (this.longQTap){
				console.log("LONGTAP");
				this.ability_manager.perform("smash");
				this.longQTap = false;
				this.shortQTap = false;
				this.cooldown = 25;
			}
			else if (this.shortQTap){
				console.log("SHORTAP");
				this.ability_manager.perform("charge");
				this.longQTap = false;
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
		context.drawImage(
			this.sprite,
			this.frame * TILE_SIZE,
			this.direction * TILE_SIZE,
			TILE_SIZE,
			TILE_SIZE,

			this.x,
			this.y,
			this.length,
			this.height
		);

		// health bar
		context.fillStyle = "red";
		context.fillRect(
			this.x,
			this.y - 10,
			(this.curr_health / this.max_health) * this.length,
			5
		);


		this.draw_player_stats(context);
		this.ability_manager.draw_abilities_ui(context, this.width);
		
	}
	draw_player_stats(context){
		const panelX = 20;
		const panelY = 20;
		const panelW = 300;
		const panelH = 220;

		const bg = "#14181652";
		const panel = "#1d241f80";
		const panelLight = "#283128";
		const stone = "#3a443d";
		const moss = "#5e7a52";
		const accent = "#8fbf72";
		const gold = "#d7c27a";
		const text = "#e6e2d3";
		const muted = "#9ea08f";

		context.shadowColor = "rgba(0,0,0,0.45)";
		context.shadowBlur = 10;
		context.shadowOffsetY = 4;

		context.fillStyle = panel;
		context.fillRect(panelX, panelY, panelW, panelH);

		context.shadowBlur = 0;
		context.shadowOffsetY = 0;

		context.strokeStyle = stone;
		context.lineWidth = 3;
		context.strokeRect(panelX, panelY, panelW, panelH);

		context.fillStyle = panelLight;
		context.fillRect(panelX, panelY, panelW, 36);

		context.font = "bold 20px Georgia";
		context.fillStyle = gold;
		context.fillText("PLAYER STATS", panelX + 16, panelY + 24);


		const scoreX = panelX + 15;
		const scoreY = panelY + 48;
		const scoreW = panelW - 30;
		const scoreH = 52;

		context.fillStyle = bg;
		context.fillRect(scoreX, scoreY, scoreW, scoreH);

		context.strokeStyle = gold;
		context.lineWidth = 2;
		context.strokeRect(scoreX, scoreY, scoreW, scoreH);

		context.font = "14px Arial";
		context.fillStyle = muted;
		context.textAlign = "center";
		context.fillText(
			"SCORE",
			scoreX + scoreW / 2,
			scoreY + 16
		);

		context.font = "bold 30px Georgia";
		context.fillStyle = gold;
		context.fillText(
			this.score,
			scoreX + scoreW / 2,
			scoreY + 40
		);

		context.textAlign = "left";

		context.font = "18px Arial";
		context.fillStyle = text;
		context.fillText("Health", panelX + 18, panelY + 125);

		context.fillStyle = bg;
		context.fillRect(panelX + 95, panelY + 110, 160, 18);

		let hpWidth = (this.curr_health / this.max_health) * 160;

		context.fillStyle = moss;
		context.fillRect(panelX + 95, panelY + 110, hpWidth, 18);

		context.strokeStyle = stone;
		context.strokeRect(panelX + 95, panelY + 110, 160, 18);

		context.font = "14px Arial";
		context.fillStyle = muted;
		context.fillText(
			this.curr_health + " / " + this.max_health,
			panelX + 112,
			panelY + 124
		);

		context.font = "18px Arial";
		context.fillStyle = text;
		context.fillText("Speed", panelX + 18, panelY + 160);

		context.fillStyle = accent;
		context.fillText(this.speed, panelX + 220, panelY + 160);


		context.fillStyle = text;
		context.fillText("Strength", panelX + 18, panelY + 192);

		context.fillStyle = accent;
		context.fillText(this.strength, panelX + 220, panelY + 192);
	}
	claim_boost(boost){
		let garbage_can = boost.get_claimed();
		let [amount, type] = [garbage_can.amount, garbage_can.type];
		this[type] = this[type] + amount;
	}
	check_rescue(){
		let tiles = this.get_current_tiles();
		let blocked = false;
		for (let [row, col] of tiles){
			if (!game_manager.current_level.get_tile(row, col).access){
				blocked = true;
				break;
			}
		}
		if (!blocked){return;}

		let start_row = Math.floor(this.y / TILE_SIZE);
		let start_col = Math.floor(this.x / TILE_SIZE);
		let rows = game_manager.current_level.map.length;
		let cols = game_manager.current_level.map[0].length;
		let visited = [];
		for (let r = 0; r < rows; r++){
			visited.push([]);
			for (let c = 0; c < cols; c++){
				visited[r][c] = false;
			}
		}
		let queue = [[start_row, start_col]];
		visited[start_row][start_col] = true;
		while (queue.length > 0){
			let [row,col] = queue.shift();
			let tile = game_manager.current_level.get_tile(row,col);
			if (tile.access){
				this.x = col * TILE_SIZE;
				this.y = row * TILE_SIZE;
				return;
			}
			for (let [nr,nc] of [[row-1,col], [row+1,col], [row,col-1],[row,col+1]]){
				if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && !visited[nr][nc]){
					visited[nr][nc] = true;
					queue.push([nr, nc]);
			}
		}

	}

	}
}

class AbilityManager{
	constructor(player, sfx_manager){
		this.player = player;
		this.sfx_manager = sfx_manager;
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
				this.sfx_manager.play_sound("player_dash");

				this.current_abilities[name].use();
			}
		}
	}
	level_up(name){
		if (name in this.current_abilities){
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
	draw_abilities_ui(context, canvas_width) {
		context.save();
		canvas_width = canvas.width;
		const padding = 10;

		let x = canvas_width - padding - TILE_SIZE*2;
		let y = padding;

		for (let name in this.current_abilities) {
			let ability = this.current_abilities[name];

			if (!ability || ability === 0) continue;

			// icon
			context.drawImage(
				ability.image,
				x,
				y,
				TILE_SIZE,
				TILE_SIZE
			);

			// level badge (bottom-right corner)
			context.fillStyle = "white";
			context.font = "bold 14px Arial";
			context.textAlign = "right";
			context.textBaseline = "bottom";

			context.fillText(
				this.to_roman(ability.level),
				x + TILE_SIZE - 4,
				y + TILE_SIZE - 2
			);

			x -= TILE_SIZE + padding;
		}
		context.restore();
	}
	to_roman(num) {
		const roman = {
			1: "I",
			2: "II",
			3: "III"
		};
		return roman[num] || "";
	}


}

class Ability{
	constructor(player){
		this.player = player;
		this.damage_per_use; 
		this.level = 1;
		this.max_level = 3;
		this.levels = {}
		this.image = new Image();
	}
	use(){
		console.log("USED ",this[this.levels[this.level]]);
		this[this.levels[this.level]]();
	}
	level_up(){
		if (this.level < this.max_level){
			this.level = this.level + 1;
		}
	}
	set_level(lvl){
		console.log("SET LEVEL ",lvl);
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
        load_assets([
			{"var" : this.image, "url" : "static/assets/extra/smash_icon.png"}
		], blank)

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
        load_assets([
			{"var" : this.image, "url" : "static/assets/extra/roll_icon.png"}
		], blank)

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
        load_assets([
			{"var" : this.image, "url" : "static/assets/extra/charge_icon.png"}
		], blank)

	}
	charge(){
		this.player.base_speed = this.player.speed;
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
	constructor(sfx_manager){
		this.sfx_manager = sfx_manager;
		this.available_boosts = [
			{type : "speed", colour: "yellow"}, 
			{type : "strength", colour : "brown"}, 
			{type : "curr_health", colour : "pink"}, 
			{type : "max_health", colour : "orange"}];
		this.boost = choose(this.available_boosts);
		this.amount = randint(1,2);
		this.x; this.y;
		//[this.x,this.y] = this.find_a_spawn_place();
		this.height = 15;
		this.length = 15;
	}
	find_a_spawn_place(){
		console.log("OOKING FOR SPAWN PLACE");
		let distance = game_manager.current_level.distance_to_player;
		//console.log("distance length:", distance.length);

		let possible_choice_in_tiles = [];
		for (let row = 2; row < distance.length-2; row++){
			for (let col = 2; col < distance[0].length-2; col++){
				let curr_dist = distance[row][col];
            	//console.log(`row:${row} col:${col} dist:${curr_dist}`);

				if (curr_dist > 5 && curr_dist < Number.MAX_SAFE_INTEGER){
					possible_choice_in_tiles.push({
						x : row, 
						y : col,
						value : curr_dist
					})
				}
			}
		}
		//console.log(possible_choice_in_tiles);
		let chosen = choose(possible_choice_in_tiles);
		//let tile_x = (TILE_SIZE/2 + chosen.x) - (this.length/TILE_SIZE)/2;
		let pixel_y = chosen.x * TILE_SIZE;
		//let tile_y = (TILE_SIZE/2 + chosen.y) - (this.height/TILE_SIZE)/2;
		let pixel_x = chosen.y * TILE_SIZE;
    	//console.log("possible choices:", possible_choice_in_tiles.length);
		//return null;
		return [pixel_x, pixel_y]


	}
	draw(context){
		context.save();
		if (!this.x){
			return;
			//[this.x, this.y] = this.find_a_spawn_place();
		}

		const size = this.length;

		// center inside tile
		const drawX = this.x + (TILE_SIZE - size) / 2;
		const drawY = this.y + (TILE_SIZE - size) / 2;

		// rounded rectangle helper (inline so you don’t need extra code)
		const r = 4;
		context.beginPath();
		context.moveTo(drawX + r, drawY);
		context.arcTo(drawX + size, drawY, drawX + size, drawY + size, r);
		context.arcTo(drawX + size, drawY + size, drawX, drawY + size, r);
		context.arcTo(drawX, drawY + size, drawX, drawY, r);
		context.arcTo(drawX, drawY, drawX + size, drawY, r);
		context.closePath();

		// fill
		context.fillStyle = this.boost.colour;
		context.fill();

		// border (makes it pop)
		context.strokeStyle = "rgba(0,0,0,0.35)";
		context.stroke();

		// text
		context.font = `${Math.floor(size / 1.4)}px Arial`;
		context.textAlign = "center";
		context.textBaseline = "middle";

		context.fillStyle = (this.boost.colour === "brown") ? "white" : "black";

		context.fillText(
			"X",
			drawX + size / 2,
			drawY + size / 2
		);
		context.restore();
	}
	

	get_claimed(){
		this.sfx_manager.play_sound("boost_collect_sound");
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

