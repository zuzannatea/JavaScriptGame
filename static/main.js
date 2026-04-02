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

    window.addEventListener("keydown",activate,false);
    window.addEventListener("keyup",deactivate,false);
    draw();
    game_manager = new GameManager();
    player = add_entity(Player);
    game_manager.construct_enemies();
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



function activate(event){
    let key = event.key;
    if (event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === " "){
            event.preventDefault();
        }
    if (key === " "){
        player.isAttacking = true; 
    }
    if (key === "ArrowLeft"){
        player.moveLeft = true; 
    }
    else if (key === "ArrowUp"){
        player.moveUp = true;
    }
    else if (key === "ArrowRight"){
        player.moveRight = true;
    }
    else if (key === "ArrowDown"){
        player.moveDown = true;
    }

}
function deactivate(event){
    let key = event.key;
    if (key === "ArrowLeft"){
        player.moveLeft = false; 
    }
    else if (key === "ArrowUp"){
        player.moveUp = false;
    }
    else if (key === "ArrowRight"){
        player.moveRight = false;
    }
    else if (key === "ArrowDown"){
        player.moveDown = false;
    }
    if (key === " "){
        player.isAttacking = false;
    }

}

/* function remove_item(item,array){
    let index = array.indexOf(item);
    if (index === -1){
        return array;
    }
    else{
        array.splice(index,1);
        return array;
    }
}

 */ 
/* function stop(){
    window.cancelAnimationFrame(request);
    window.removeEventListener("keydown", activate);
    window.removeEventListener("keyup", deactivate)

}
 */
export { canvas };
