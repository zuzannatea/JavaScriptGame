import { canvas, player } from "../main.js";
import { Enemy, Zombie, Charger, Splitter, Swarmer, Teleporter } from "./entities.js";
import { dist } from "./utils.js";

const level_details = {
    1 : {
        Charger : 1
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
        this.final_level = 5;
    }
    construct_enemies(){
        for (let enemy in level_details[this.current_level.id]){
            for (let num = 0; num < level_details[this.current_level.id][enemy]; num++){
                console.log("For",enemy,"number",num);
                this.add_entity(enemy);
            }
        }
        console.log("CREATED",this.enemies);
/*         for (let i = 0; i < amt_of_enemies; i++) {
            this.enemies.push(this.add_entity(Enemy));
        }
 */    }
    draw(context){
        this.current_level.draw(context);
        this.draw_enemies(context);
    }
    draw_enemies(context){
        for (let enemy of this.enemies){
            enemy.draw(context);
        }
    }
    update_enemies(){
        for (let enemy of this.enemies){
            enemy.update(this.current_level);
        }
    }
    remove_entity(entity_instance){
        let index = this.enemies.indexOf(entity_instance);

        if (index > -1){
            console.log(this.enemies);
            this.enemies.splice(index,1);
            console.log("REMOVED", entity_instance);
            console.log(this.enemies);
            return true;
        }
        else{
            return false;
        }
    }
    add_entity(entity_class, ...args){
        entity_class = eval(entity_class);
        let entity;
        if (args.length === 0){
            entity = new entity_class(canvas.width, canvas.height);
        }
        else{
            entity = new entity_class(canvas.width, canvas.height, args);
        }
        this.enemies.push(entity);
        return entity;
    }
    entities_in_range(object, range=30){
        let entities = [];
        for (let entity of this.enemies){
            if (entity != object){
                if (dist(entity, object) <= range){
                    entities.push(entity);
                }
            }
        }
        return entities;
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
        return dist;
    }


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
        if (dist(this.player_pos, player) > TILE_SIZE*2){
            this.distance_to_player = this.get_shortest_path([y,x], [y,x]);
            //console.log([y,x], this.distance_to_player);
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
        this.add_world_border();
        this.flood_fill();
        if (!this.check_viability()){
            this.generate_level();
        }
        
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
    add_world_border(){
        for (let col = 0; col < this.map[0].length; col++){
            this.map[0][col] = TileType.wall;
            this.map[this.map.length-1][col] = TileType.wall;
                
        }
        for (let row = 0; row < this.map.length; row++){
            this.map[row][0] = TileType.wall;
            this.map[row][this.map[0].length-1] = TileType.wall;
        }
    }
    clean_map(){
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
