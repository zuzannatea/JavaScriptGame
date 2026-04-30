import { canvas, player, stop as stopGame } from "../main.js";
import { Player, Enemy, Zombie, Charger, Splitter, Swarmer, Teleporter, StatBoost } from "./entities.js";
import { dist, remove_item, is_colliding, choose, load_assets } from "./utils.js";
import { UIManager } from "./ui.js";
import { SFXManager } from "./sfx.js";


const level_details = {
    1 : {
        enemies : {
            Zombie : 3
        },
        stat_boosts : 3,
        score_needed : 20
    },
    2 : {
        enemies : {Zombie : 2, Charger : 2},
        stat_boosts : 3,
        score_needed : 50
    },
    3 : {
        enemies : {Swarmer : 6},
        stat_boosts : 3,
        score_needed : 100
    },
    4 : {
        enemies : {Teleporter : 2,
            Zombie : 1
        },
        stat_boosts : 2,
        score_needed : 120
    },
    5 : {
        enemies : {Splitter : 2,
            Zombie : 1
        },
        stat_boosts : 3,
        score_needed : 140
    },
    6 : {
        enemies : {Charger : 1,
            Teleporter : 1,
            Swarmer : 5,
            Splitter : 2,
            Zombie : 1
        },
        stat_boosts : 5,
        score_needed : 170
    }

}

let water_tile1 = new Image();
let water_tile2 = new Image();
let water_tile3 = new Image();

let floor_tile = new Image();

let portal_tile1 = new Image();
let portal_tile2 = new Image();
let portal_tile3 = new Image();
let portal_tile4 = new Image();
let portal_tile5 = new Image();
let portal_tile6 = new Image();

let warning_tile = new Image();
const TileType = {
    wall : {frames: [water_tile1, water_tile2, water_tile3], access : false, frequency : 3},
    floor : {img : floor_tile, access : true},
    portal : {frames: [portal_tile1, portal_tile2, portal_tile3, portal_tile4, portal_tile5, portal_tile6], access : true, frequency : 6},
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
        this.sfx_manager = new SFXManager();

        this.player = new Player(canvas.width,canvas.height,this.sfx_manager);
        this.current_level = new Level(1, this.player);
        this.final_level_id = 6;
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
        this.ended = false;
        this.tile_frame_counter; 
        load_assets([
            {"var" : floor_tile, "url" : "static/assets/tiles/floor_tiles/green_quadruple_tile.png"},
            {"var": water_tile1, "url": "static/assets/tiles/water_tiles/water_tile1.png"},
            {"var": water_tile2, "url": "static/assets/tiles/water_tiles/water_tile2.png"},
            {"var": water_tile3, "url": "static/assets/tiles/water_tiles/water_tile3.png"},
            {"var" : portal_tile1, "url" : "static/assets/tiles/portal_tiles/portal_tile1.png"},
            {"var" : portal_tile2, "url" : "static/assets/tiles/portal_tiles/portal_tile2.png"},
            {"var" : portal_tile3, "url" : "static/assets/tiles/portal_tiles/portal_tile3.png"},
            {"var" : portal_tile4, "url" : "static/assets/tiles/portal_tiles/portal_tile4.png"},
            {"var" : portal_tile5, "url" : "static/assets/tiles/portal_tiles/portal_tile5.png"},
            {"var" : portal_tile6, "url" : "static/assets/tiles/portal_tiles/portal_tile6.png"},
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
        if (this.ended){return;}
        this.ended = true;
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

                return;
            }
        }
        
    }
    check_exiting(){
        let player_tiles = this.player.get_current_tiles();
        for (let tile of player_tiles){
            let [row,col] = tile;
            if (col === this.exit_tiles.col && 
                (row === this.exit_tiles.row1 || row === this.exit_tiles.row2)
            ){
                return true; 
            }
/*             if ((tile[1] === this.exit_tiles.x1 || tile[1] === this.exit_tiles.x2) && tile[0] === this.exit_tiles.y){
                return true;
            }
 */     }
        return false;
    }
    progress_to_next_level(){
        this.sfx_manager.play_sound("level_up_sound");
        this.enemies = [];
        this.stat_boosts = [];
        this.exit_tiles = undefined;
        this.player.x = Math.floor(canvas.width/2);
        this.player.y = Math.floor(canvas.height/2);
        this.player.curr_health = this.player.max_health;
        if (this.current_level.id === this.final_level_id){
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

        let player_tiles = this.player.get_current_tiles();
        let [row, col] = player_tiles[0];
        let check_path = this.current_level.get_shortest_path([row,col],[row,col])
        if (check_path === -1){
            this.construct_game();
            return;
        }
        this.current_level.distance_to_player = check_path;
        this.current_level.player_pos = { x: this.player.x, y: this.player.y };

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
        for (let i = curr_boosts; i < num_of_boosts; i++){
            let boost = new StatBoost(this.sfx_manager);
            let spawn = boost.find_a_spawn_place();
            if (spawn){[boost.x, boost.y] = spawn};
            this.stat_boosts.push(boost);
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
            this.ui_manager.cheats.on = false;
            this.player.kill_aura = this.ui_manager.cheats.kill_aura;
            this.player.invincibility = this.ui_manager.cheats.invincibility;
            if (this.ui_manager.cheats.set_score){
                this.player.score = this.ui_manager.cheats.set_score;
                this.ui_manager.cheats.set_score = null;
            }
            for (let boost in this.ui_manager.cheats.boosts){
                if (this.ui_manager.cheats.boosts[boost]){
                    this.player.ability_manager.set_level(boost, this.ui_manager.cheats.boosts[boost]);
                    this.ui_manager.cheats.boosts[boost] = null;
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
                    this.sfx_manager.change_music("chill_music");
                    this.ui_manager.pause_game();
                }
                else{
                    this.sfx_manager.change_music("game_music");
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
        this.map = [];
        //for pathfindi g
        this.player_pos = {x:0, y:0};
        this.distance_to_player = [];
        this.warning_tiles = [];
        this.exit;
        this.player = player;
    }
    spawn_exit(){
        if (this.exit){return this.exit;}
        if (!this.distance_to_player || this.distance_to_player.length === 0){return;}
        let possible_choice_in_tiles = [];
        let distance = this.distance_to_player;
		for (let row = 0; row < distance.length - 1; row++){
			for (let col = 0; col < distance[0].length; col++){
				if ((distance[row][col] === 4) && distance[row+1][col] < Number.MAX_SAFE_INTEGER){
					possible_choice_in_tiles.push({
						row : row, 
						col : col,
						row2 : row+1,
                        x : col * TILE_SIZE,
                        y : row * TILE_SIZE,
                        length : TILE_SIZE,
                        height : TILE_SIZE,
                        value : distance[row][col]
					})
				}
			}
		}
		let chosen = choose(possible_choice_in_tiles);
        if (dist(this.player,chosen) > 300){
            chosen = choose(possible_choice_in_tiles);
        }
        this.map[chosen.row][chosen.col] = TileType.portal;
        this.map[chosen.row2][chosen.col] = TileType.portal;
        
        this.exit = {row1 : chosen.row, row2 : chosen.row2, col : chosen.col}
        return this.exit;
    }
    get_adjacent_tiles_with_weight(row,col){
        if (!this.map[row] || !this.map[row][col]) {
            console.error(`Bad tile access at row:${row} col:${col}, map is ${this.map.length}x${this.map[0].length}`);
            return [];
        }

        let adj_tiles = [];
        let type;
        let max_row = this.map.length - 1;
        let max_col = this.map[0].length - 1;
        if (row > 0){
            type = this.map[row-1][col].access ? 1 : Number.MAX_SAFE_INTEGER; 
            adj_tiles.push({
                tile : [row-1, col],
                value : type
            });
        }
        if (row < max_row){
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
        if (col < max_col){
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
            return -1;
        }
        let adj = [];
        for (let row = 0; row < this.map.length; row++){
            adj.push([]);
            for (let col = 0; col < this.map[row].length; col++){
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

        let player_tiles = this.player.get_current_tiles();
        let [y,x] = player_tiles[0];

        if ((dist(this.player_pos, this.player) > TILE_SIZE*2) || (this.distance_to_player.length === 0)){
            this.distance_to_player = this.get_shortest_path([y,x], [y,x]);
            this.player_pos = {x : this.player.x, y : this.player.y};
        }
        for (let row = 0; row < Math.floor(canvas.height/TILE_SIZE); row++){
            for (let col = 0; col < Math.floor(canvas.width/TILE_SIZE); col++){
                //context.fillStyle = this.map[r][c];
                let tile = this.map[row][col];
                let img;
                if (tile.frames) {
                    let frame = Math.floor(Date.now() / 250) % tile.frequency;
                    img = tile.frames[frame];
                } else {
                    img = tile.img;
                }

                context.drawImage(img, col*TILE_SIZE, row*TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }


    }
    get_tile(x,y){
        if (!this.map[x] || this.map[x][y] === undefined){
            console.log(`get_tile out of bounds: x=${x}, y=${y}, map=${this.map.length}x${this.map[0].length}`);
            return { access: false };
        }

        if (this.map[x]){
            return this.map[x][y];
        }
    }

    generate_level(){
        this.map = [];
        for (let row = 0; row < Math.floor(canvas.height/TILE_SIZE); row++){
            this.map.push([]);
            for (let col = 0; col < Math.floor(canvas.width/TILE_SIZE); col++){
                let chance = Math.random();
                this.map[row][col] = Math.random() > 0.65 ? TileType.wall : TileType.floor;
/*                 if (chance > 0.65){
                    this.map[this.map.length - 1][c] = TileType.wall;
                }
                else{
                    this.map[this.map.length - 1][c] = TileType.floor;
                }
 */            }
        }
        for (let i = 0; i < 5; i += 1){
            this.clean_map();
        }
        this.add_presets();
        this.flood_fill();
        this.add_world_border();
        //CHECK CHECK CHECK
        for (let row = 0; row < this.map.length; row++) {
            if (!this.map[row] || this.map[row].length !== this.map[0].length) {
                console.log(`Row ${row} is bad:`, this.map[row]);
            }
        }

        //END OF CHECK END OF CHE
        if (!this.check_viability()){
            this.generate_level();
        }
        console.log("LEVLE GNERATED");
        
    }
    check_viability(){
        let floor_counter = 0;
        let general_counter = 0;
        for (let row = 0; row < Math.floor(canvas.height/TILE_SIZE); row++){
            for (let col = 0; col < Math.floor(canvas.width/TILE_SIZE); col++){
                if (this.map[row][col] === TileType.floor){
                    floor_counter += 1;
                }
                general_counter += 1;
            }
        }
        console.log(floor_counter/general_counter);
        if (floor_counter/general_counter > 0.45){
            return true;
        }
        else{ return false;}
    }
    //for making sure player isnt stuck
    add_presets(){
        let startCol = Math.floor(canvas.width/2);
        let startRow = Math.floor(canvas.height/2);
        let player_length = 20;
        let player_height = 20;

        let player_tiles = [
            [Math.floor(startRow / TILE_SIZE), Math.floor(startCol / TILE_SIZE)],
            [Math.floor(startRow / TILE_SIZE), Math.floor((startCol + player_length) / TILE_SIZE)],
            [Math.floor((startRow + player_height) / TILE_SIZE),Math.floor(startCol / TILE_SIZE)],
            [Math.floor((startRow + player_height) / TILE_SIZE),Math.floor((startCol + player_length) / TILE_SIZE)],
        ];

        for (let [row,col] of player_tiles){
            this.map[row][col] = TileType.floor;
        }


        for (let start_tile of player_tiles){
            if (this.is_connected_to_floor(start_tile)){continue;}

            let queue = [start_tile];
            let connected = false; 

            while (!connected && queue.length > 0){
                let [row,col] = queue.shift();
                let neighbours = this.get_neighbours(row,col,4);

                for (let [nr,nc] of neighbours){
                    if (this.map[nr][nc] === TileType.floor){
                        connected = true;
                        break;
                    }
                    this.map[nr][nc] = TileType.floor;
                    queue.push([nr,nc]);
                }
            }
        }
/*         if (this.map[startRow][startCol] != TileType.floor){
            let queue = [];
            let connection = false;
            this.map[startRow][startCol] = TileType.floor;
            let neighbours = this.get_neighbours(startRow,startCol,4);
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
 */
    }
    is_connected_to_floor([row,col]){
        let neighbours = this.get_neighbours(row, col, 4);
        for (let [nr, nc] of neighbours){
            if (this.map[nr][nc] === TileType.floor) return true;
        }
        return false;
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
        let newMap = [];
        for (let row = 0; row < this.map.length; row++){
            newMap.push([]);
            for (let col = 0; col < this.map[0].length; col++){
                let wallCount = this.count_wall_neighbours(row,col,8);
                if (this.map[row][col] === TileType.wall){
                    newMap[row][col] = wallCount >= 2 ? TileType.wall : TileType.floor;
                }
                else{
                    newMap[row][col] = wallCount >= 8 ? TileType.wall : TileType.floor;

                }
            }
        }
        this.map = newMap;
        return;
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
                    if (x+r >= 0 && x+r < Math.floor(canvas.height/TILE_SIZE) && y+c >= 0 && y + c < Math.floor(canvas.width/TILE_SIZE)){
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
        let counter = 0;
        let max_row = this.map.length;
        let max_col = this.map[0].length;
        for (let row = -1; row < 2; row++){
            for (let col = -1; col < 2; col++){
                if (row === 0 && col === 0){continue;}
                if (num_of_neighbours === 4 && row !== 0 && col !== 0){
                        continue;
                }
                let nr = x + row;
                let nc = y + col;
                if (nr >= 0 && nr < max_row && nc >= 0 && nc < max_col){
                    if (this.map[nr][nc] === TileType.wall){
                        counter++;
                    }
                }
                //if (this.map[x+r][y+c] != undefined){ <<<< throws an error, fix!!
/*                 if ((x+c > 0 && x+c < Math.floor(canvas.width/TILE_SIZE) && y+r > 0 && y+r < Math.floor(canvas.height/TILE_SIZE))){ 
                    if (this.map[x+c][y+r] === TileType.wall){
                        counter += 1;
                }}
 */            }
        }
        return counter;
    }
}

export { GameManager, TILE_SIZE, COLLIDER_TILES };
