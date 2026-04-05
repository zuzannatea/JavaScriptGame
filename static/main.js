import { Player, add_entity } from './modules/entities.js';
import { GameManager } from './modules/levelmanagement.js';


let canvas;
let context;

let fpsInterval = 100 / 30;
let then = Date.now();

let player;
let game_manager;

document.addEventListener("DOMContentLoaded", init, false);

function init(){
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;


    game_manager = new GameManager();
    player = add_entity(Player);

    
    game_manager.construct_enemies();
    game_manager.current_level.generate_level();

    draw();
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
    game_manager.wander_enemies();

    game_manager.draw(context);
    player.draw(context);

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
    if (key in keybinds){
        event.preventDefault();
    }
    if (keybinds[key]){
        player[keybinds[key]] = true;
    }
}
function deactivate(event){
    let key = event.key;
    if (keybinds[key]){
        player[keybinds[key]] = false;
    }

}

/* function stop(){
    window.cancelAnimationFrame(request);
    window.removeEventListener("keydown", activate);
    window.removeEventListener("keyup", deactivate)

}
 */
export { canvas, player, game_manager };
