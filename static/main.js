import { all_entities, Enemy, Player, is_colliding, is_in_range, randint, GameManager, add_entity, remove_entity } from './modules/entities.js';


let canvas;
let context;

let fpsInterval = 100 / 30;
let now;
let then = Date.now();

let request;
let player;
let game_manager;

/* let moveLeft = false;
let moveUp = false;
let moveRight = false;
let moveDown = false; 
let isAttacking = false;
 */

document.addEventListener("DOMContentLoaded", init, false);

function init(){
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");

    canvas.width = window.screen.availWidth;
    canvas.height = window.screen.availHeight;

    draw();
    game_manager = new GameManager();
    player = add_entity(Player);
    game_manager.construct_enemies();
    game_manager.current_level.generate_level();
    window.addEventListener("keydown",activate,false);
    window.addEventListener("keyup",deactivate,false);
}


function draw(){
    window.requestAnimationFrame(draw);
    let now = Date.now();
    let elapsed = now - then;
    if (elapsed <= fpsInterval){
        return;
    }
    then = now - (elapsed % fpsInterval);
    

    context.clearRect(0, 0, canvas.width, canvas.height);
    player.move();
    game_manager.current_level.draw(context);
    //enemy.wander();
    player.draw(context);
    game_manager.draw_enemies(context);
    game_manager.wander_enemies();



/*     if (is_in_range(player,enemy) && player.isAttacking){
        enemy.x = enemy.x - 5;
        enemy.health = enemy.health - 25;
    }
 *//*     enemy.wander();
 */
}


let keybinds = {
    " " : "isAttacking",
    "ArrowLeft" : "moveLeft",
    "ArrowUp" : "moveUp",
    "ArrowRight" : "moveRight",
    "ArrowDown" : "moveDown"
}

function activate(event){
    let key = event.key;
    if (event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === " "){
            event.preventDefault();
        }
    if (keybinds[key]){
        let value = keybinds[key];
        player[value] = true;
    }
}
function deactivate(event){
    let key = event.key;
    if (keybinds[key]){
        let value = keybinds[key];
        player[value] = false;
    }

}

/* function stop(){
    window.cancelAnimationFrame(request);
    window.removeEventListener("keydown", activate);
    window.removeEventListener("keyup", deactivate)

}
 */
export { canvas };
