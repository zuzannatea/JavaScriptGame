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
	this.current_tile();
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
	console.log(object, entity_colliding, xMove, yMove);
	//check all values. check how it acts w entities vs tiles
	if (xMove < 0){
		xMove = (object.x - entity_colliding.x - entity_colliding.length) * -1;
		console.log(object.x, entity_colliding.x, entity_colliding.length);
		console.log("xMove < 0: ", xMove);
	}
	else if (xMove > 0){
		xMove = entity_colliding.x - object.x - object.length;
		console.log(entity_colliding.x, object.x, object.length);
		console.log("xMove > 0: ", xMove);
	}
	if (yMove < 0){
		yMove = (object.y - object.height - entity_colliding.y) * -1;
		console.log(object.y, object.height, entity_colliding.y);
		console.log("yMove < 0: ", yMove);
	}
	else if (yMove > 0){
		yMove = entity_colliding.y - entity_colliding.height - object.y;
		console.log(entity_colliding.y, entity_colliding.height, object.y);
		console.log("yMove > 0: ", yMove);
	}
	console.log(xMove,yMove, entity_colliding);
	return [xMove, yMove];
	
  }
  tile_colliding(){
return;
//removed for enemies
  }
  current_tile(){
    let startX = Math.floor(canvas.width/2);
    let startY = Math.floor(canvas.height/2);
    let playerPosX = Math.floor(this.x);
    let playerPosY = Math.floor(this.y);
    let offsetX = ((playerPosX - startX) * -1 / TILE_SIZE) * 4;
    let offsetY = ((playerPosY - startY) * -1 / TILE_SIZE) * 4;

	let posX = Math.floor((this.x/TILE_SIZE)-offsetX);
	let posY = Math.floor((this.y/TILE_SIZE)-offsetY);
	return [posX,posY];	
}
	current_pixels(x,y){
		let startX = (canvas.width/2);
		let startY = (canvas.height/2);
		let playerPosX = (this.x);
		let playerPosY = (this.y);
		let offsetX = ((playerPosX - startX) * -1 / TILE_SIZE) * 4;
		let offsetY = ((playerPosY - startY) * -1 / TILE_SIZE) * 4;
		let posX = ((x*TILE_SIZE));
		let posY = ((y*TILE_SIZE));
		return [posX,posY];	
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
    this.x = randint(this.length, width - this.length);
    this.y = randint(this.height, height - this.height);
	this.xChange = 5;
	this.yChange = 5;
	this.target = {x : randint(this.length, width - this.length), y : randint(this.height, height - this.height)};
    this.health = 50;
  }
  pick_a_point(){
	return {x : randint(this.length, this.canvas[0] - this.length), y : randint(this.height, this.canvas[1] - this.height)};
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
  //PLACEHOLDER METHOD! so enemies don't get stuck in collision
  entity_colliding(){
    for (let entity of all_entities){
        if (is_colliding(this,entity) && this != entity){
			this.target = this.pick_a_point();
            return entity;
        }
    }
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
  tile_colliding(){
	let current_tileX; let curren_tileY;
	let pixelX; let pixelY;
	[current_tileX, curren_tileY] = this.current_tile();
	let tile_type = game_manager.current_level.get_tile(current_tileX, curren_tileY);
	console.log(tile_type, COLLIDER_TILES);
	if (tile_type === "red"){
		[pixelX,pixelY] = this.current_pixels(current_tileX,curren_tileY);
 		return {x : pixelX, 
			y : pixelY,
			xTile : current_tileX,
			yTile : curren_tileY,
			length : TILE_SIZE,
			height : TILE_SIZE};
 	}
	return false;
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

