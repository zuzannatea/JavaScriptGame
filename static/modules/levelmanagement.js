import { canvas, player } from "../main.js";
import { add_entity, Enemy } from "./entities.js";

const level_details = {
    1 : {
        enemy_count : 2
    },
}
/* const level_details = {
    1 : {
        Enemy : 3
        Player : 2
        ...etc
    },
}
 */
const TileType = {
    wall : "red",
    floor : "green"
}
let TILE_SIZE = 32;
let COLLIDER_TILES = [TileType.wall];

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
/*         for (let enemy of this.enemies){
            enemy.wander();
        }
 */    }
}

let MAP_SIZE_MODIFIER = 1.5;
class Level{
    constructor(id){
        this.id = id;
        this.map = [];
    }
    draw(context){
        let startX = Math.floor(canvas.width/2);
        let startY = Math.floor(canvas.height/2);
        let x2; let y2;
        let playerPosX = Math.floor(player.x);
        let playerPosY = Math.floor(player.y);
        let offsetX = ((startX - playerPosX) / TILE_SIZE);
        let offsetY = ((startY - playerPosY) / TILE_SIZE);
        for (let r = 0; r < (canvas.width)/TILE_SIZE; r += 1){
            for (let c = 0; c < (canvas.height)/TILE_SIZE; c += 1){
                context.fillStyle = this.map[r][c] === TileType.floor ? "green" : "red";
                let player_tiles = player.get_current_tiles();
                for (let tile of player_tiles){
                    if (r === tile[0] && c === tile[1]){
                        context.fillStyle = "purple";

                    }
                }
                context.fillRect((r)*TILE_SIZE, (c)*TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }


    }
    get_tile(x,y){
        if (this.map[x]){
            return this.map[x][y];
        }
    }

    generate_level(){
        this.map = [];
        for (let r = 0; r < (canvas.width)/TILE_SIZE; r+= 1){
            this.map.push([]);
            for (let c = 0; c < (canvas.height)/TILE_SIZE; c += 1){
                let chance = Math.random();
                if (chance > 0.65){
                    this.map[this.map.length - 1][c] = TileType.wall;
                }
                else{
                    this.map[this.map.length - 1][c] = TileType.floor;
                }
            }
        }
         for (let i = 0; i < 5; i += 1){
            this.clean_map();
        }
        this.add_presets();
        this.flood_fill();
        if (!this.check_viability()){
            this.generate_level();
        }
        this.add_world_border();

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
    add_world_border(){
        for (let i = 0; i < canvas.width/TILE_SIZE; i++){
            this.map[i][0] = TileType.wall;
            this.map[i][1] = TileType.wall;
            this.map[i][Math.floor(canvas.height/TILE_SIZE)] = TileType.wall;
            this.map[i][Math.floor(canvas.height/TILE_SIZE) - 1] = TileType.wall;
        }
        for (let j = 0; j < canvas.height/TILE_SIZE; j++){
            this.map[0][j] = TileType.wall;
            this.map[1][j] = TileType.wall;
            this.map[Math.floor(canvas.width/TILE_SIZE)][j] = TileType.wall;
            this.map[Math.floor(canvas.width/TILE_SIZE) - 1][j] = TileType.wall;
        }

    }
    clean_map(){
        let newMap = this.map;
        for (let x = 0; x < canvas.width/TILE_SIZE; x += 1){
            for (let y = 0; y < canvas.height/TILE_SIZE; y += 1){
                let wallCount = this.count_wall_neighbours(x,y,8);
                if (this.map[x][y] === TileType.wall){
                    newMap[x][y] = wallCount >= 2 ? TileType.wall : TileType.floor;
                }
                else{
                    newMap[x][y] = wallCount >= 8 ? TileType.wall : TileType.floor;

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
/* 	remember_wall_neighbours_coords(x,y,num_of_neighbours){
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
 */}

export { GameManager, TILE_SIZE, COLLIDER_TILES };
