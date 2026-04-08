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
		this.xChange = 5;
		this.yChange = 5;
		this.max_health = 50;
		this.curr_health = 50;
	}
	hurt(amount=10){
		if (this.curr_health - amount >= 0){
			this.die();
		}
		else{
			this.curr_health = this.curr_health - amount;
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
		for (let entity of all_entities){
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
		let point = this.pick_a_point();
		[this.x, this.y] = [point.x, point.y];
		this.xChange = 5;
		this.yChange = 5;
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
		if (calcDist(this,player) >= 90){
			let xMove; let yMove;
			let dx = player.x - this.x;
			let dy = player.y - this.y;
			let dist = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
			dx = dx/dist;
			dy = dy/dist;
			xMove = (dx*this.xChange);
			yMove = (dy*this.yChange);
			this.try_move(xMove, yMove);
		}

		if (calcDist(this,player) < 90){
			this.colour = "black";
			player.curr_health -= 10;
		}else{this.colour = "orange";}

	}
	snap_to_tile(){
		this.x = Math.floor(this.x / TILE_SIZE) * TILE_SIZE + (TILE_SIZE - this.length) / 2;
		this.y = Math.floor(this.y / TILE_SIZE) * TILE_SIZE + (TILE_SIZE - this.height) / 2;
	}
	wander(current_level, priority=0){
		if (calcDist(this,player) < 124){
			console.log("now");
			this.colour = "orange";
			this.attack_charge();
		}
		else{
			let [xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
			while(!this.try_move(xMove * this.xChange/2, yMove * this.yChange/2)){
				this.snap_to_tile();
				[xMove, yMove] = this.get_next_best_move(current_level.distance_to_player, priority);
			} 
		}

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

class Player extends Entity{
	constructor(width, height) {
		super();
		this.canvas = [width,height];
		this.x = Math.floor(canvas.width/2);
		this.y = Math.floor(canvas.height/2);

		this.max_health = 100;
		this.curr_health = 100;
		this.score = 0;
		this.extraMoves = [];

		this.xChange = 2;
		this.yChange = 2;
		this.moveLeft = false;
		this.moveUp = false;
		this.moveRight = false;
		this.moveDown = false; 
		this.isAttacking = false;

		this.colour = "cyan";
	
	}
	move(){
		if (this.moveRight){
			this.try_move(this.xChange,0);
		}
		if (this.moveLeft){
			this.try_move(-this.xChange,0);
		}
		if (this.moveUp){
			this.try_move(0,-this.yChange);
		}
		if (this.moveDown){
			this.try_move(0,this.yChange);
		}
		if (this.isAttacking){
			console.log("Is");
			let entities = game_manager.entities_in_range(this);
			console.log(entities);
			if (entities.length != 0){
				console.log("Happens");
				this.colour = "yellow";
				let entity = entities.pop();
				entity.hurt(25);
				//console.log(entity.health);
			}
			else{this.colour = "cyan";}
		}
	}
	draw(context){
		context.fillStyle = this.colour;
		context.fillRect(this.x, this.y, this.length, this.height);
		context.fillStyle = "red";
		context.fillRect(this.x, this.y - 10, (this.curr_health/this.max_health)*this.length, 5);

	}


}

class MoveManager{
	constructor(){
		this.all_moves = [];
		this.current_moves = [];
	}
}

class Move{
	constructor(){
		this.damage_per_use; 
		this.level = 1;
	}
	use(){}
	upgrade(){}
}

class Smash extends Move{
	use(){

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
	if (dist(object1, object2) < attack_range){
		return true;
	}
	return false;
}




export { Enemy, Player };

