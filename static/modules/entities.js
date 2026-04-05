import { canvas, game_manager } from "../main.js";
import {TILE_SIZE, COLLIDER_TILES} from "./levelmanagement.js";

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
		this.health;
	}
	try_move(xMove,yMove){
		//console.log(this.current_tile());
		if (yMove === undefined){yMove = 0;}
		if (xMove === undefined){xMove = 0;}
		if (this.x + this.length + xMove >= this.canvas[0] ||
			this.x + xMove < 0 ||
			this.y + this.height + yMove >= this.canvas[1] ||
			this.y + yMove < 0){
				return false;
		}
		
		this.move_by(xMove,yMove);
		let tile_colliding = this.tile_colliding();
		if (tile_colliding){
			this.move_by(-xMove,-yMove);
	/* 		let distance = this.estimate_distance(tile_colliding,this,xMove,yMove);
			this.move_by(distance[0],distance[1]);
	*/        return false; 
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
/* 		console.log(object, entity_colliding, xMove, yMove);
 */		//check all values. check how it acts w entities vs tiles
		if (xMove < 0){
			xMove = (object.x - entity_colliding.x - entity_colliding.length) * -1;
/* 			console.log(object.x, entity_colliding.x, entity_colliding.length);
			console.log("xMove < 0: ", xMove);
 */		}
		else if (xMove > 0){
			xMove = entity_colliding.x - object.x - object.length;
/* 			console.log(entity_colliding.x, object.x, object.length);
			console.log("xMove > 0: ", xMove);
 */		}
		if (yMove < 0){
			yMove = (object.y - object.height - entity_colliding.y) * -1;
/* 			console.log(object.y, object.height, entity_colliding.y);
			console.log("yMove < 0: ", yMove);
 */		}
		else if (yMove > 0){
			yMove = entity_colliding.y - entity_colliding.height - object.y;
/* 			console.log(entity_colliding.y, entity_colliding.height, object.y);
			console.log("yMove > 0: ", yMove);
 */		}
/* 		console.log(xMove,yMove, entity_colliding);
 */		return [xMove, yMove];
	
	}
  tile_colliding(){
	let all_tiles = this.get_current_tiles();
	let collisions = [];
	console.log(all_tiles);
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
	this.target = {x : randint(this.length, width - this.length), y : randint(this.height, height - this.height)};
    this.health = 50;
  }
  
  pick_a_point(){
	let cleared = false; 
	let checker = false;
	let point = {x : randint(this.length, this.canvas[0] - this.length), y : randint(this.height, this.canvas[1] - this.height)};
 	let tiles = this.get_current_tiles(point.x, point.y);
 	while (!cleared){
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
		point = {x : randint(this.length, this.canvas[0] - this.length), y : randint(this.height, this.canvas[1] - this.height)};
		tiles = this.get_current_tiles(point.x, point.y);

 
	}
 	return point;
  }
  wander(){

	if (this.target.length === 0 || is_in_range(this,this.target, 40)){
		this.target = this.pick_a_point();}
	let xMove;
	let yMove;
	let dx = this.target.x - this.x;
	let dy = this.target.y - this.y;
	let dist = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
	dx = dx/dist;
	dy = dy/dist;

	xMove = dx*this.xChange;
	yMove = dy*this.yChange;

	this.try_move(xMove,yMove);
	}
  
  draw(context){
    context.fillStyle = "orange";
    context.fillRect(this.x, this.y - 10, this.health/this.length, 5);
    context.fillStyle = "yellow";
    context.fillRect(this.x, this.y, this.length, this.height);
  }
  //PLACEHOLDER METHODS! so enemies don't get stuck in collision
  entity_colliding(){
    for (let entity of all_entities){
        if (is_colliding(this,entity) && this != entity){
			this.target = this.pick_a_point();
            return entity;
        }
    }
    return false;
  }
  tile_colliding(){
	let all_tiles = this.get_current_tiles();
	let collisions = [];
	console.log(all_tiles);
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
		this.target = this.pick_a_point();

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
  }
  draw(context){
    if (this.isAttacking){context.fillStyle = "purple";}
    else{context.fillStyle = "cyan";}
    context.fillRect(this.x, this.y, this.length, this.height);
    context.fillStyle = "red";
    context.fillRect(this.x, this.y - 10, (this.curr_health/this.max_health)*this.length, 5);

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

function randint(min,max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function add_entity(entity_class){
    let entity = new entity_class(canvas.width, canvas.height);
    all_entities.push(entity);
    return entity;
}
function remove_entity(entity_instance){
    let index = all_entities.indexOf(entity_instance);
    if (index > -1){
        all_entities.splice(index,1);
        return true;
    }
    else{
        return false;
    }
}

function dist(p1,p2){
    return Math.sqrt(Math.pow((p1.x-p2.x),2)) + Math.pow((p1.y-p2.y),2);
}
function remove_item(item,array){
    let index = array.indexOf(item);
    if (index === -1){
        return array;
    }
    else{
        array.splice(index,1);
        return array;
    }
}


export { Enemy, Player, add_entity };

