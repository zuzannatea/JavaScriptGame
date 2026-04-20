import { canvas, player, stop as stopGame } from "../main.js";
import { Player, Enemy, Zombie, Charger, Splitter, Swarmer, Teleporter, StatBoost } from "./entities.js";
import { dist, remove_item, is_colliding, choose, load_assets } from "./utils.js";
import { UIManager } from "./ui.js";


const level_details = {
    1 : {
        enemies : {Teleporter : 1},
        stat_boosts : 2,
        score_needed : 0
    },
    2 : {
        enemies : {Zombie : 2},
        stat_boosts : 3,
        score_needed : 10
    },
    3 : {
        enemies : {Charger : 2,
            Zombie : 1
        },
        stat_boosts : 1,
        score_needed : 10
    }

}

let water_tile = new Image();
let floor_tile = new Image();
let portal_tile = new Image();
let warning_tile = new Image();
const TileType = {
    wall : {img : water_tile, access : false},
    floor : {img : floor_tile, access : true},
    portal : {img : portal_tile, access : true},
    warning : {img : warning_tile, access : true},
}
let TILE_SIZE = 32;
let COLLIDER_TILES = [TileType.wall];

let xhttp;

let actions = {
    isAttacking : {target : "player"},
    moveLeft : {target : "player"},
    moveUp : {target : "player"},
    moveRight : {target : "player"},
    moveDown : {target : "player"},
    specialMove : {target : "player"},
    specialMoveModifier : {target : "player"},
    running : { target : "global"}
};
function blank(){return;}

class GameManager{
    constructor(){
        this.enemies = [];
        this.player = new Player();
        this.current_level = new Level(1, this.player);
        this.final_level_id = 2;
        this.stat_boosts = [];
        this.exit_tiles;

        this.running = false;
		this.pause_cooldown = 0;
		this.pressedKeys = new Set();
        this.keybinds = {
            isAttacking: [" "],
            moveLeft: ["ArrowLeft"],
            moveUp: ["ArrowUp"],
            moveRight: ["ArrowRight"],
            moveDown: ["ArrowDown"],
            specialMove: ["q"],
            specialMoveModifier: ["Q"],
            running: ["f"]
        }

        this.key_to_action = this.rebuild_keymap();
        this.ui_manager = new UIManager(this.keybinds);

        this.tile_frame_counter; 
        load_assets([
            {"var" : floor_tile, "url" : "static/assets/tiles/floor_tiles/green_quadruple_tile.png"},
            {"var" : water_tile, "url" : "static/assets/tiles/water_tiles/water_tile1.png"},
            {"var" : portal_tile, "url" : "static/assets/tiles/portal_tiles/portal_tile1.png"},
            {"var" : warning_tile, "url" : "static/assets/tiles/floor_tiles/shiny_sandy_quadruple_tile.png"},
            
        ], blank)


    }
    rebuild_keymap(){
        let key_to_action = {};
        for (let action in this.keybinds){
            for (let key of this.keybinds[action]){
                key_to_action[key] = action;
            }
        }
        console.log(key_to_action);
        this.key_to_action = key_to_action;
        return key_to_action;
    }
    handle_key_presses(key){
        let action = this.key_to_action[key];
        if (!action) return;
        let meta = actions[action];
        if (!meta) return;

        if (meta.target === "global") {
            this.pressedKeys.add(action);
            this.player.handle_key_presses(action);
            return;
        }

        if (meta.target === "player") {
            this.player.handle_key_presses(action);
            return;
        }

        if (meta.target === "game") {
            this.pressedKeys.add(action);
            return;
        }

        
    }
    handle_key_releases(key){
        let action = this.key_to_action[key];
        if (!action) return;
        let meta = actions[action];
        if (!meta) return;

        if (meta.target === "global") {
            this.pressedKeys.delete(action);
            this.player.handle_key_releases(action);
            return;
        }

        if (meta.target === "player") {
            this.player.handle_key_releases(action);
            return;
        }

        if (meta.target === "game") {
            this.pressedKeys.delete(action);
            return;
        }

    }
    end(){
        let data = new FormData();
        data.append("score",this.player.score);
        xhttp = new XMLHttpRequest();
        xhttp.addEventListener("readystatechange", this.handle_response, false);
        xhttp.open("POST", "/store_result", true);
        xhttp.send(data);


        this.ui_manager.end_game(this.player.score);
        //stopGame();
    }
    handle_response() {
        if ( xhttp.readyState === 4 ) {
            if ( xhttp.status === 200 ) {
                if (xhttp.responseText === "success"){
                    return;
                }
            } 
            else {
                console.log("Problem " + xhttp.status);
            }
        }
    }

    check_progression(){
        if (!this.exit_tiles && this.player.score >= level_details[this.current_level.id].score_needed){
            this.exit_tiles = this.current_level.spawn_exit();
                    }
        if (this.exit_tiles){
            if (this.check_exiting()){
                this.progress_to_next_level();
                console.log("Progressed");
                return;
            }
        }
        
    }
    check_exiting(){
        let player_tiles = this.player.get_current_tiles();
        for (let tile of player_tiles){
            if ((tile[1] === this.exit_tiles.x1 || tile[1] === this.exit_tiles.x2) && tile[0] === this.exit_tiles.y){
                return true;
            }
        }
        return false;
    }
    progress_to_next_level(){
        this.enemies = [];
        this.stat_boosts = [];
        this.exit_tiles = undefined;
        this.player.x = Math.floor(canvas.width/2);
        this.player.y = Math.floor(canvas.height/2);
        this.player.curr_health = this.player.max_health;
        if (this.current_level.id === this.final_level_id){
            console.log("Done");
            this.end();
            return;
        }
        let new_level_id = this.current_level.id + 1;
        this.current_level = new Level(new_level_id, this.player);
        this.construct_game();
        this.ui_manager.create_choice_screen(this.player.ability_manager);
        return;
    }
    construct_game(context){
        this.current_level.generate_level();
        this.construct_enemies();
        this.construct_stat_boosts();
        return;
    }
    construct_enemies(){
        for (let enemy in level_details[this.current_level.id].enemies){
            for (let num = 0; num < level_details[this.current_level.id].enemies[enemy]; num++){
                this.add_entity(enemy);
            }
        }
        return;
        
    }
    construct_stat_boosts(){
        let num_of_boosts = level_details[this.current_level.id].stat_boosts;
        let curr_boosts = this.stat_boosts.length;
        console.log(curr_boosts,num_of_boosts);
        for (let i = curr_boosts; i < num_of_boosts; i++){
            this.stat_boosts.push(new StatBoost());
        }
    }
    draw(context){
        this.current_level.draw(context);
        this.player.draw(context);
        this.draw_enemies(context);
        this.draw_stat_boosts(context);
    }
    check_ui(){
        if (this.ui_manager.made_choice){
            //console.log(this.ui_manager.made_choice);
            this.player.ability_manager.level_up(this.ui_manager.made_choice.value);
            this.ui_manager.made_choice = null;
        }
        if (this.ui_manager.changed_rebind){
            this.ui_manager.changed_rebind = false;
            this.keybinds = this.ui_manager.keybinds;
            this.rebuild_keymap();
        }
        if (this.ui_manager.cheats.on){
            console.log("updating cheats");
            this.ui_manager.cheats.on = false;
            this.player.kill_aura = this.ui_manager.cheats.kill_aura;
            this.player.invincibility = this.ui_manager.cheats.invincibility;
            if (this.ui_manager.cheats.set_score){
                console.log(this.ui_manager.cheats.set_score);
                this.player.score = this.ui_manager.cheats.set_score;
            }
            for (let boost in this.ui_manager.cheats.boosts){
                if (this.ui_manager.cheats.boosts[boost]){
                    console.log(this.ui_manager.cheats.boosts[boost], boost);
                    this.player.ability_manager.set_level(boost, this.ui_manager.cheats.boosts[boost]);
                }
            }
        }
    }
    update(){
        
        if (this.player.curr_health <= 0){
            this.end();
            return;

        }
        if (this.ui_manager.ready === true){
            this.running = true;
            this.ui_manager.ready = false;
        }
        this.check_ui();
		this.pause_cooldown = Math.max(this.pause_cooldown - 1,0);
		if (this.pause_cooldown <= 0){
			if (this.pressedKeys.has("running")){
				this.running = !this.running;
				this.pause_cooldown = 5;
                if (!this.running){
                    this.ui_manager.pause_game();
                }
                else{
                    this.ui_manager.resume_game();
                }

			}
		}

        if (!this.running){return;}
        this.update_player();
        this.check_progression();
        this.update_enemies();
        this.update_stat_boosts();
    }
    update_player(){
        this.player.update();
    }
    update_stat_boosts(){
        let to_be_removed = []
        for (let boost of this.stat_boosts){
            if (is_colliding(boost, this.player)){
                this.player.claim_boost(boost);
                to_be_removed.push(boost);
            }
        }
        for (let item of to_be_removed){
            this.stat_boosts = remove_item(item,this.stat_boosts);
        }
        if (this.stat_boosts.length < level_details[this.current_level.id].stat_boosts){
            this.construct_stat_boosts();
        }

    }
    draw_stat_boosts(context){
        for (let boost of this.stat_boosts){
            boost.draw(context);
        }
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
            this.enemies.splice(index,1);
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
            entity = new entity_class(canvas.width, canvas.height, this.player);
        }
        else{
            entity = new entity_class(canvas.width, canvas.height, this.player, args);
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
    constructor(id, player){
        this.id = id;
        console.log(id);
        this.map = [];
        //for pathfindi g
        this.player_pos = {x:0, y:0};
        this.distance_to_player = [];
        this.warning_tiles = [];
        this.exit;
        this.player = player;
    }
    spawn_exit(){
        if (this.exit){return;}
        let possible_choice_in_tiles = [];
        let distance = this.distance_to_player;
		for (let row = 0; row < distance.length - 1; row++){
			for (let col = 0; col < distance[0].length; col++){
				if ((distance[row][col] === 4) && distance[row+1][col] < Number.MAX_SAFE_INTEGER){
					possible_choice_in_tiles.push({
						x1 : row, 
						y : col,
						x2 : row+1,
                        value : distance[row][col]
					})
				}
			}
		}
        console.log(possible_choice_in_tiles);
		let chosen = choose(possible_choice_in_tiles);
        console.log(chosen);
        this.map[chosen.y][chosen.x1] = TileType.portal;
        this.map[chosen.y][chosen.x2] = TileType.portal;
        
        this.exit = {x1 : chosen.x1, x2 : chosen.x2, y : chosen.y}
        return this.exit;
    }
    get_adjacent_tiles_with_weight(row,col){
        let adj_tiles = [];
        let type;
        if (row > 0){
            type = this.map[row-1][col].access ? 1 : Number.MAX_SAFE_INTEGER; 
            adj_tiles.push({
                tile : [row-1, col],
                value : type
            });
        }
        if (row < this.map.length - 1){
            type = this.map[row+1][col].access ? 1 : Number.MAX_SAFE_INTEGER; 
            adj_tiles.push({
                tile : [row+1, col],
                value : type
            });
        }
        if (col > 0){
            type = this.map[row][col-1].access ? 1 : Number.MAX_SAFE_INTEGER; 
            adj_tiles.push({
                tile : [row, col-1],
                value : type
            });
        }
        if (col < this.map[0].length - 1){
            type = this.map[row][col+1].access ? 1 : Number.MAX_SAFE_INTEGER; 
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
        let [sourceX, sourceY] = source_tile;
        let [destX, destY] = destination_tile;
        if ((!this.get_tile(destX, destY).access) || (!this.get_tile(sourceX,sourceY).access)){
            console.log("No path");
            return -1;
        }
        let adj = [];
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
    update_warning_tiles(){
        for (let tile of this.warning_tiles){
            if (tile.timestamp - Date.now() < 0){
                this.map[tile.x][tile.y] = TileType.floor;
                this.warning_tiles = remove_item(tile, this.warning_tiles);
            }
        }
    }
    set_warning_tiles(x,y,timestamp){
        this.warning_tiles.push({
            x : x,
            y : y,
            timestamp : timestamp
        });
        this.map[x][y] = TileType.warning;
        return;
    }


    draw(context){
        this.update_warning_tiles();
        let startX = Math.floor(canvas.width/2);
        let startY = Math.floor(canvas.height/2);
        let playerPosX = Math.floor(this.player.x);
        let playerPosY = Math.floor(this.player.y);
/*         let offsetX = ((startX - playerPosX) / TILE_SIZE);
        let offsetY = ((startY - playerPosY) / TILE_SIZE);
 */   

        let player_tiles = this.player.get_current_tiles();
        let [y,x] = player_tiles[0];
        //console.log("RAN HERE AT LEAST TOO");

        if (dist(this.player_pos, this.player) > TILE_SIZE*2){
            this.distance_to_player = this.get_shortest_path([y,x], [y,x]);
            //console.log("RAN HERE TOO");
            this.player_pos = {x : this.player.x, y : this.player.y};
        }
        for (let r = 0; r < Math.floor((canvas.width)/TILE_SIZE); r += 1){
            for (let c = 0; c < Math.floor((canvas.height)/TILE_SIZE); c += 1){
                //context.fillStyle = this.map[r][c];
                context.drawImage(this.map[r][c].img, (r)*TILE_SIZE, (c)*TILE_SIZE, TILE_SIZE, TILE_SIZE);
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
        let start_tiles = this.player.get_current_tiles();
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
