import { canvas, player } from "../main.js";

let all_entities = [];

const level_details = {
	1 : {
		enemy_count : 2
	},
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
	draw(context){
		this.current_level.draw(context);
		this.draw_enemies(context);
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

const TileType = {
	wall : "red",
	floor : "green"
}
let TILE_SIZE = 32;
class Level{
	constructor(id){
		this.id = id;
		this.map = [];
	}
	draw(context){
		let startX = Math.floor(canvas.width/2);
		let startY = Math.floor(canvas.height/2);
		let playerPosX = Math.floor(player.x);
		let playerPosY = Math.floor(player.y);
		let offsetX = (playerPosX - startX) * -1 / TILE_SIZE;
		let offsetY = (playerPosY - startY) * -1 / TILE_SIZE;
		for (let r = 0; r < canvas.width/TILE_SIZE; r += 1){
			for (let c = 0; c < canvas.height/TILE_SIZE; c += 1){
				if (startX === r && startY === c){
					context.fillStyle = "purple";
				}
				else{
					context.fillStyle = this.map[r][c] === TileType.floor ? "green" : "red";
				}
				context.fillRect((r+offsetX)*TILE_SIZE, (c+offsetY)*TILE_SIZE, TILE_SIZE, TILE_SIZE);
			}
		}


	}
	generate_level(){
		this.map = [];
		for (let r = 0; r < canvas.width/TILE_SIZE; r+= 1){
			this.map.push([]);
			for (let c = 0; c < canvas.height/TILE_SIZE; c += 1){
				let chance = Math.random();
				if (chance > 0.55){
					this.map[this.map.length - 1][c] = TileType.wall;
				}
				else{
					this.map[this.map.length - 1][c] = TileType.floor;
				}
			}
		}
		for (let i = 0; i < 2; i += 1){
			this.clean_map();
		}
	this.add_presets();
  	this.flood_fill();
	if (!this.check_viability()){
		this.generate_level();
	}

 	}
	check_viability(){
		let floor_counter = 0;
		let general_counter = 0;
		for (let r = 0; r < canvas.width/TILE_SIZE; r += 1){
			for (let c = 0; c < canvas.height/TILE_SIZE; c += 1){
				if (this.map[r][c] === TileType.floor){
					floor_counter += 1;
				}
				general_counter += 1;
			}
		}
		if (floor_counter/general_counter > 0.65){
			return true;
		}
		else{ return false;}
	}
	add_presets(){
		let startX = Math.floor(canvas.width/TILE_SIZE/2);
		let startY = Math.floor(canvas.height/TILE_SIZE/2);
		if (this.map[startX][startY] != TileType.floor){
			let queue = [];
			let connection = false;
			this.map[startX][startY] = TileType.floor;
			let neighbours = this.get_neighbours(startX,startY,4);
			while (!connection){
				for (let neighbour of neighbours){
					this.map[neighbour[0]][neighbour[1]] = TileType.floor;
					queue.push(neighbour);
					if (this.map[neighbour[0]][neighbour[1]] === TileType.floor){
						connection = true;
					}
				}
				let next = queue.pop();
				neighbours = this.get_neighbours(next[0],next[1],4);
			}


		}


	}
	clean_map(){
		let newMap = this.map;
		for (let x = 0; x < canvas.width/TILE_SIZE; x += 1){
			for (let y = 0; y < canvas.height/TILE_SIZE; y += 1){
				let wallCount = this.count_wall_neighbours(x,y,8);
				if (this.map[x][y] === TileType.wall){
					newMap[x][y] = wallCount >= 3 ? TileType.wall : TileType.floor;
				}
				else{
					newMap[x][y] = wallCount >= 5 ? TileType.wall : TileType.floor;

				}
			}
		}
		this.map = newMap;
	}
	flood_fill(){
		let startX = Math.floor(canvas.width/TILE_SIZE/2);
		let startY = Math.floor(canvas.height/TILE_SIZE/2);
		let visited = [];
		for (let x = 0; x < canvas.width/TILE_SIZE; x += 1){
			visited.push([])
			for (let y = 0; y < canvas.height/TILE_SIZE; y += 1){
				visited[visited.length - 1][y] = [];
			}
		}
		let queue = [];
		queue.push([startX,startY]);
		visited[startX][startY] = true;

		while (queue.length > 0){
			queue.reverse();
			let curr_cords = queue.pop();
			queue.reverse();
			let neighbours = this.get_neighbours(curr_cords[0],curr_cords[1],4);
			for (let neighbour of neighbours){
/* 				console.log(this.in_bounds(neighbour[0],neighbour[1]), !(visited[neighbour[0]][neighbour[1]] === true), this.map[neighbour[0]][neighbour[1]] === TileType.floor);
 */
				if (this.in_bounds(neighbour[0],neighbour[1]) && !(visited[neighbour[0]][neighbour[1]] === true) && this.map[neighbour[0]][neighbour[1]] === TileType.floor){
					visited[neighbour[0]][neighbour[1]] = true;
					queue.push([neighbour[0],neighbour[1]]);
				}
			}
		}
    for (let r = 0; r < canvas.width/TILE_SIZE; r += 1){
        for (let c = 0; c < canvas.height/TILE_SIZE; c += 1){
			if (this.map[r][c] === TileType.floor && !(visited[r][c] === true)){
				this.map[r][c] = TileType.wall;
			}
		}
	}
	}
	get_neighbours(x,y,amt){
		let neighbours = [];
		for (let r = -1; r < 2; r += 1){
			for (let c = -1; c < 2; c += 1){
				if (r === 0 && c === 0){
					//ie dont count itself
					continue;
				}
				else{
					if (amt === 4 && (r != 0 && c != 0)){
						//bc we want to discount diagonals, so -1,1 or 1,1 etcc
						continue;
					}
					if (x+r > 0 && x+r < canvas.width/TILE_SIZE && y+c > 0 && y + c < canvas.height/TILE_SIZE){
						neighbours.push([x+r, y+c]);
					}
				}
			}
		}
		return neighbours;

	}
	in_bounds(x,y){
		if (x > 0 && x < canvas.width/TILE_SIZE && y > 0 && y < canvas.height/TILE_SIZE){
			return true;
		}
		return false;
	}
	count_wall_neighbours(x,y,num_of_neighbours){
		let counter = -1;
		for (let r = -1; r < 2; r += 1){
			for (let c = -1; c < 2; c += 1){
				if (num_of_neighbours === 4){
					if (r != 0 && c != 0){
						continue;
					}
				}
				//if (this.map[x+r][y+c] != undefined){ <<<< throws an error, fix!!
				if ((x+r > 0 && x+r < (canvas.width/TILE_SIZE) && y+c > 0 && y+c < (canvas.height/TILE_SIZE))){ 
					if (this.map[x+r][y+c] === TileType.wall){
						counter += 1;
				}}
			}
		}
		return counter;
	}
	remember_wall_neighbours_coords(x,y,num_of_neighbours){
		let array = [];
		for (let r = -1; r < 2; r += 1){
			for (let c = -1; c < 2; c += 1){
				if (num_of_neighbours === 4){
					if (r != 0 && c != 0){
						continue;
					}
				}
				//console.log("this",x,r,y,c, x+r >= 0, x+r < (canvas.width/TILE_SIZE), y+c >= 0, y+c < (canvas.height/TILE_SIZE),(x+r >= 0 && x+r < (canvas.width/TILE_SIZE) && y+c >= 0 && y+c < (canvas.height/TILE_SIZE)));
				if (x+r >= 0 && x+r < (canvas.width/TILE_SIZE) && y+c >= 0 && y+c < (canvas.height/TILE_SIZE)){
					if (this.map[x+r][y+c] === TileType.wall && (r != 0 && c != 0)){
					array.push([x+r,y+c]);
				}}
			}
		}
		return array;
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
    this.xChange = 5;
    this.yChange = 5;
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

	this.xChange = 5;
	this.xChange = 5;
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


export { all_entities, Enemy, Player, is_colliding, randint, is_in_range, GameManager,add_entity,remove_entity };

