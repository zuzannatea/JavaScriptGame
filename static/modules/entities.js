let all_entities = [];

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
		console.log(distance);
        return false; 
    }
    return true;
  }
  move_by(xMove,yMove){
		console.log(this.x,this.y);
        this.x = this.x + xMove;
        this.y = this.y + yMove;
		console.log(this.x,this.y);
  }
  estimate_distance(object, entity_colliding, xMove, yMove){
	if (xMove < 0){
		xMove = (object.x - entity_colliding.x - entity_colliding.length) * -1;
	}
	else if (xMove > 0){
		xMove = entity_colliding.x - object.x - object.length;
	}
	if (yMove < 0){
		console.log("yMove < 0");
		console.log(yMove);
		yMove = (object.y - object.height - entity_colliding.y) * -1;
		console.log(yMove);
	}
	else if (yMove > 0){
		console.log("yMove > 0");

		yMove = entity_colliding.y - entity_colliding.height - object.y;
	}

/* 
	let moveX;
	let moveY;
	//object | entity
    if (object.x + object.length + xMove > entity_colliding.x && 
		object.x + object.length + xMove < entity_colliding.x + entity_colliding.length){
		moveX = entity_colliding.x - object.length - object.x;
	}
	else if (object.x + xMove < entity_colliding.x + entity_colliding.length && 
		object.x + xMove > entity_colliding.x){
		moveX = object.x - entity_colliding.x - entity_colliding.length;
	}
	else{
		moveX = xMove;
	}

 	if (object.y + yMove > entity_colliding.y - entity_colliding.height && 
		object.y + yMove < entity_colliding.y){
		moveY = entity_colliding.y - entity_colliding.height - object.y;
	}
	else if (object.y - object.height + yMove < entity_colliding.y && 
		object.y - object.height + yMove > entity_colliding.y - entity_colliding.height){
		moveY = object.y - object.height - entity_colliding.y;

	}
	else{
		moveY = yMove;
	}

 */    console.log(xMove, yMove);
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
    this.x = randint(10, width - 10);
    this.y = randint(10, height - 10);
	this.target = [];
    this.health = 50;
  }
  pick_a_point(){
	return [randint(0,this.canvas[0]), randint(0,this.canvas[1])];
  }
  wander(){
	if (this.target.length === 0){
		this.target = this.pick_a_point();
	}

    let chanceOfMovement = randint(0,10);
    if (chanceOfMovement > 7){
        let xMove = randint(-1,1) * this.xChange;
        let yMove = randint(-1,1) * this.yChange;
        this.try_move(xMove, yMove);
    }
  }
}

class Player extends Entity{
  constructor(width, height) {
    super();
	this.canvas = [width,height];
    this.x = randint(10, width - 10);
    this.y = randint(15, height - 15);
    this.health = 100;
    this.score = 0;
    this.extraMoves = [];
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
    if (object1.x + object1.length + attack_range < object2.x ||
        object2.x + object2.length + attack_range < object1.x ||
        object1.y + attack_range > object2.y + object2.height ||
        object2.y + attack_range > object1.y + object1.height){
            return true;
        }
    else{
        return false;
    }
}

function randint(min,max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function dist(p1,p2){
    return Math.sqrt((Math.pow((p1.x-p2.x),2)) + Math.pow((p1.y-p2.y),2));
}

export { all_entities, Enemy, Player, is_colliding, randint, is_in_range };

