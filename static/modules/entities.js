import { canvas } from "../main.js";

let all_entities = [];

const level_details = {
	1 : {enemy_count : 2},
}

class GameManager{
	constructor(){
		this.enemies = [];
		this.current_level = new Level(1);
	}
	construct_enemies(){
		let amt_of_enemies = level_details[this.current_level.id].enemy_count;
		for (let i = 0; i < amt_of_enemies; i++) {
			this.enemies.push(add_entity(Enemy));
		}
	}
	draw_enemies(context){
		for (let enemy of this.enemies){
			enemy.draw(context);
		}
	}
	wander_enemies(){
		for (let enemy of this.enemies){
			enemy.wander();
		}

	}
}
class Level{
	constructor(id){
		this.id = id;
	}
}

class Entity{
  constructor(width, height) {
    this.canvas = [width, height];
	this.width = width;
    this.x;
    this.y;
    this.length = 20;
    this.height = 35;
    this.xChange = 10;
    this.yChange = 10;
    this.health;
  }
  try_move(xMove,yMove){
	if (yMove === undefined){yMove = 0;}
	if (xMove === undefined){xMove = 0;}
	if (this.x + this.length + xMove >= this.canvas[0] ||
        this.x + xMove < 0 ||
        this.y + this.height + yMove >= this.canvas[1] ||
        this.y + yMove < 0){
    		return false;
    }
	this.move_by(xMove,yMove);
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

    console.log(xMove, yMove);
	return [xMove, yMove];
	
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
	if (this.x < this.target.x){xMove = this.xChange;}
	else if (this.x > this.target.x){xMove = -this.xChange;}
	else{xMove = 0;}

	if (this.y < this.target.y){yMove = this.yChange;}
	else if (this.y > this.target.y){yMove = -this.yChange;}
	else{yMove = 0;}
	this.try_move(xMove,yMove);
	}
  
  draw(context){
    context.fillStyle = "orange";
    context.fillRect(this.x, this.y - 10, this.health/this.length, 5);
    context.fillStyle = "yellow";
    context.fillRect(this.x, this.y, this.length, this.height);
  }
}

class Player extends Entity{
  constructor(width, height) {
    super();
	this.canvas = [width,height];
    this.x = randint(10, width - 10);
    this.y = randint(15, height - 15);
	this.max_health = 100;
    this.curr_health = 100;
    this.score = 0;
    this.extraMoves = [];

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
    context.fillRect(this.x, this.y - 10, this.curr_health/this.length, 5);

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

export { all_entities, Enemy, Player, is_colliding, randint, is_in_range, GameManager,add_entity,remove_entity };

