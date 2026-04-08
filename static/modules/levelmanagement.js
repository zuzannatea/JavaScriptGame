import { canvas, player } from "../main.js";
import { add_entity, Enemy } from "./entities.js";
import { dist } from "./utils.js";

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

class PriorityQueue {
    constructor() {
        this.values = [];
    }
    enqueue(val, priority) {
        let newNode = {val : val, priority : priority};
        this.values.push(newNode);
        let index = this.values.length - 1;
        const current = this.values[index];

        while (index > 0) {
        let parentIndex = Math.floor((index - 1) / 2);
        let parent = this.values[parentIndex];

        if (parent.priority <= current.priority) {
            this.values[parentIndex] = current;
            this.values[index] = parent;
            index = parentIndex;
        } else break;
        }
    }
    dequeue() {
        const max = this.values[0];
        const end = this.values.pop();
        this.values[0] = end;

        let index = 0;
        const length = this.values.length;
        const current = this.values[0];
        while (true) {
        let leftChildIndex = 2 * index + 1;
        let rightChildIndex = 2 * index + 2;
        let leftChild, rightChild;
        let swap = null;

        if (leftChildIndex < length) {
            leftChild = this.values[leftChildIndex];
            if (leftChild.priority > current.priority) swap = leftChildIndex;
        }
        if (rightChildIndex < length) {
            rightChild = this.values[rightChildIndex];
            if (
            (swap === null && rightChild.priority > current.priority) ||
            (swap !== null && rightChild.priority > leftChild.priority)
            )
            swap = rightChildIndex;
        }

        if (swap === null) {break;}
        this.values[index] = this.values[swap];
        this.values[swap] = current;
        index = swap;
        }

        return max;
    }
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
            enemy.wander(this.current_level);
        }
    }
}

let MAP_SIZE_MODIFIER = 1.5;
class Level{
    constructor(id){
        this.id = id;
        this.map = [];
        //for pathfindi g
        this.to_be_drawn = [];
        this.player_pos = {x:0, y:0};
        this.distance_to_player = [];
    }
    get_adjacent_tiles_with_weight(row,col){
        let adj_tiles = [];
        let type;
        if (row > 0){
            type = String(this.map[row-1][col]) === "green" ? 1 : Number.MAX_SAFE_INTEGER; 
            adj_tiles.push({
                tile : [row-1, col],
                value : type
            });
        }
        if (row < this.map.length - 1){
            type = String(this.map[row+1][col]) === "green" ? 1 : Number.MAX_SAFE_INTEGER; 
            adj_tiles.push({
                tile : [row+1, col],
                value : type
            });
        }
        if (col > 0){
            type = String(this.map[row][col-1]) === "green" ? 1 : Number.MAX_SAFE_INTEGER; 
            adj_tiles.push({
                tile : [row, col-1],
                value : type
            });
        }
        if (col < this.map[0].length - 1){
            type = String(this.map[row][col+1]) === "green" ? 1 : Number.MAX_SAFE_INTEGER; 
            adj_tiles.push({
                tile : [row, col+1],
                value : type
            });
        }
        return adj_tiles;
    }
    sort_queue(pq){
        return pq.sort((a, b) => a.value - b.value);
    }
    get_shortest_path(source_tile, destination_tile){
        //console.log("Ran");
        let [sourceX, sourceY] = source_tile;
        let [destX, destY] = destination_tile;
        if (this.get_tile(destX, destY) === "red" || this.get_tile(sourceX,sourceY) === "red"){
            console.log("No path");
            return -1;
        }
        let adj = [];
        //console.log("input read");
        for (let row = 0; row < this.map.length; row++){
            adj.push([]);
            for (let col = 0; col < this.map[0].length; col++){
                let adj_tiles = this.get_adjacent_tiles_with_weight(row,col);
                adj[row].push([]);
                for (let tile of adj_tiles){
                    adj[row][col].push(tile);
                }
            }
        }
        let pq = [];
        //console.log("got to adj; ", adj);
        let dist = [];
        for (let row = 0; row < this.map.length; row++){
            dist.push([]);
            for (let col = 0; col < this.map[0].length; col++){
                dist[row].push(Number.MAX_SAFE_INTEGER);
            }
        }
        dist[sourceX][sourceY] = 0;
        pq.push({value : 0,
            tile : [sourceX,sourceY]});
        pq = this.sort_queue(pq);
        while (!(pq.length===0)){
            let item = pq.pop();
            let [y,x] = item.tile;
            if (item.value > dist[y][x]){
                continue;
            }
            for (let tile of adj[y][x]){
                let [tile_row, tile_col] = tile.tile;
                if (dist[y][x] + tile.value < dist[tile_row][tile_col]){
                    dist[tile_row][tile_col] = dist[y][x] + tile.value;
                    pq.push(
                        {value : dist[tile_row][tile_col],
                        tile : tile.tile
                        });
                    pq = this.sort_queue(pq);
                }

            }
        }
/*         let curr_tile = [sourceX,sourceY];
        let path = [curr_tile];
        let best_choice = 0;
        if (dist[destX][destY] === Number.MAX_SAFE_INTEGER){
            console.log("no path"); return;
        }
        while (best_choice < dist[destX][destY]){
            let [curr_x, curr_y] = curr_tile;
            let adj_tiles = this.get_adjacent_tiles_with_weight(curr_x, curr_y);
            for (let tile of adj_tiles){
                let [tile_row, tile_col] = tile.tile;
                if (Number(dist[tile_row][tile_col]) === best_choice + 1){
                    best_choice = dist[tile_row][tile_col];
                    curr_tile = [tile_row, tile_col];
                    path.push(curr_tile);
                } 
            }
        }
        console.log(path);
        return path;

 */    
        console.log(dist);
        return dist;
    }

    /*     get_adjacent_tiles_with_weight(row,col){
        let adj_tiles = [];
        let type;
        if (row > 0){
            type = this.map.get_tile(col,row-1) === "green" ? 1 : Number.MAX_SAFE_INTEGER; 
            adj_tiles.push({
                tile : [row-1, col],
                value : type
            });
        }
        if (row < this.map.length - 1){
            type = this.map.get_tile(col,row+1) === "green" ? 1 : Number.MAX_SAFE_INTEGER; 
            adj_tiles.push({
                tile : [row+1, col],
                value : type
            });
        }
        if (col > 0){
            type = this.map.get_tile(col-1,row) === "green" ? 1 : Number.MAX_SAFE_INTEGER; 
            adj_tiles.push({
                tile : [row, col-1],
                value : type
            });
        }
        if (col < this.map[0].length - 1){
            type = this.map.get_tile(col+1,row) === "green" ? 1 : Number.MAX_SAFE_INTEGER; 
            adj_tiles.push({
                tile : [row, col+1],
                value : type
            });
        }
        return adj_tiles;
    }
    get_shortest_path(source_tile, destination_tile){
        let [sourceX, sourceY] = source_tile;
        let [destX, destY] = destination_tile;
        let adj = [];
        for (let row = 0; row < this.map.length; row++){
            adj.push([]);
            for (let col = 0; col < this.map[0].length; col++){
                let adj_tiles = this.get_adjacent_tiles_with_weight(row,col);
                adj[row].push([]);
                for (let tile of adj_tiles){
                    //tile = {tile, value}
                    adj[row][col].push(tile);
                }
            }
        }
        let pq = new MinHeap();
        let dist = [];
        for (let row = 0; row < this.map.length; row++){
            dist.push([]);
            for (let col = 0; col < this.map[0].length; col++){
                dist[row].push(Number.MAX_SAFE_INTEGER);
            }
        }
        dist[sourceY][sourceX] = 0;
        pq.push([0, [sourceY,sourceX]]);
        while (!pq.isEmpty()){
            let [d,u] = pq.pop();
            //d = distance int, u = tile(x,y)
            let [x,y] = u;
            if (d > dist[y,x]){
                continue;
            }
            for (let tile of adj[y][x]){
                let [tile_row, tile_col] = tile.tile;
                if (dist[y,x] + tile.value < dist[tile_row][tile_col]){
                    dist[tile_row][tile_col] = dist[y,x] + tile.value;
                    pq.push([dist[tile_row][tile_col], tile.tile]);
                }

            }
        }
        return dist;
    }
 */    

    draw(context){
        let startX = Math.floor(canvas.width/2);
        let startY = Math.floor(canvas.height/2);
        let playerPosX = Math.floor(player.x);
        let playerPosY = Math.floor(player.y);
/*         let offsetX = ((startX - playerPosX) / TILE_SIZE);
        let offsetY = ((startY - playerPosY) / TILE_SIZE);
 */   

        let player_tiles = player.get_current_tiles();
        let [y,x] = player_tiles[0];
        if (dist(this.player_pos, player) > 500){
            this.distance_to_player = this.get_shortest_path([y,x], [y,x]);
            console.log([y,x], this.distance_to_player);
            this.player_pos = {x : player.x, y : player.y};
        }
        for (let r = 0; r < Math.floor((canvas.width)/TILE_SIZE); r += 1){
            for (let c = 0; c < Math.floor((canvas.height)/TILE_SIZE); c += 1){
                context.fillStyle = this.map[r][c] === TileType.floor ? "green" : "red";
                let player_tiles = player.get_current_tiles();
                for (let tile of player_tiles){
                    for (let place of this.to_be_drawn){
                        if (r === place[0] && c === place[1]){
                            context.fillStyle = 'yellow';
                        }
                    }
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
        for (let r = 0; r < Math.floor((canvas.width)/TILE_SIZE); r+= 1){
            this.map.push([]);
            for (let c = 0; c < Math.floor((canvas.height)/TILE_SIZE); c += 1){
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
        //this.add_world_border();
        //console.log(get_shortest_path([0,0],[this.map.length, this.map[0].length]));
    }
    check_viability(){
        let floor_counter = 0;
        let general_counter = 0;
        for (let r = 0; r < Math.floor(canvas.width/TILE_SIZE); r += 1){
            for (let c = 0; c < Math.floor(canvas.height/TILE_SIZE); c += 1){
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
/*     add_world_border(){
        for (let i = 0; i < Math.floor(canvas.width/TILE_SIZE); i++){
            this.map[i][0] = TileType.wall;
            this.map[i][1] = TileType.wall;
            this.map[i][Math.floor(canvas.height/TILE_SIZE)] = TileType.wall;
            this.map[i][Math.floor(canvas.height/TILE_SIZE) - 1] = TileType.wall;
        }
        for (let j = 0; j < Math.floor(canvas.height/TILE_SIZE); j++){
            this.map[0][j] = TileType.wall;
            this.map[1][j] = TileType.wall;
            this.map[canvas.width/TILE_SIZE][j] = TileType.wall;
            this.map[canvas.width/TILE_SIZE - 1][j] = TileType.wall;
        }

    }
 */    clean_map(){
        let newMap = this.map;
        for (let x = 0; x < Math.floor(canvas.width/TILE_SIZE); x += 1){
            for (let y = 0; y < Math.floor(canvas.height/TILE_SIZE); y += 1){
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
        let start_tiles = player.get_current_tiles();
        let visited = [];
        for (let x = 0; x < this.map.length; x += 1){
            visited.push([])
            for (let y = 0; y < this.map[0].length; y += 1){
                visited[x][y] = false;
            }
        }
        let queue = [];
        for (let tile of start_tiles){
            queue.push([tile[0],tile[1]]);
            visited[tile[0]][tile[1]] = true;
        }

        while (queue.length > 0){
            queue.reverse();
            let curr_cords = queue.pop();
            queue.reverse();
            let neighbours = this.get_neighbours(curr_cords[0],curr_cords[1],4);
            for (let neighbour of neighbours){
                if (this.in_bounds(neighbour[0] - 1,neighbour[1] - 1) && !(visited[neighbour[0]][neighbour[1]]) && this.map[neighbour[0]][neighbour[1]] === TileType.floor){
                    visited[neighbour[0]][neighbour[1]] = true;
                    queue.push([neighbour[0],neighbour[1]]);
                }
            }
        }
    for (let r = 0; r < this.map.length; r += 1){
        for (let c = 0; c < this.map[0].length; c += 1){
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
                    if (x+r > 0 && x+r < Math.floor(canvas.width/TILE_SIZE) && y+c > 0 && y + c < Math.floor(canvas.height/TILE_SIZE)){
                        neighbours.push([x+r, y+c]);
                    }
                }
            }
        }
        return neighbours;

    }
    in_bounds(x,y){
        if (x > 0 && x < this.map.length && y > 0 && y < this.map[0].length){
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
                if ((x+c > 0 && x+c < Math.floor(canvas.width/TILE_SIZE) && y+r > 0 && y+r < Math.floor(canvas.height/TILE_SIZE))){ 
                    if (this.map[x+c][y+r] === TileType.wall){
                        counter += 1;
                }}
            }
        }
        return counter;
    }
 }

export { GameManager, TILE_SIZE, COLLIDER_TILES };
