import { Player } from './modules/entities.js';
import { GameManager, TILE_SIZE } from './modules/levelmanagement.js';

let canvas;
let context;
let request;

let fpsInterval = 100 / 30;
let then = Date.now();

let player;
let game_manager;
let html_overlay;
document.addEventListener("DOMContentLoaded", init, false);

function init(){
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");
    html_overlay = document.getElementById("html-overlay");

    const w = Math.floor(window.innerWidth / TILE_SIZE) * TILE_SIZE;
    const h = Math.floor(window.innerHeight / TILE_SIZE) * TILE_SIZE; 
    canvas.width = w;
    canvas.height = h;
    html_overlay.style.width = `${w}px`;
    html_overlay.style.height = `${h}px`;

    game_manager = new GameManager();
    //player = new Player();

    game_manager.construct_game(context);
    game_manager.draw(context);
    draw();
    window.addEventListener("keydown",activate,false);
    window.addEventListener("keyup",deactivate,false);

}


function draw(){
    request = window.requestAnimationFrame(draw);
    let now = Date.now();
    let elapsed = now - then;
    if (elapsed <= fpsInterval){
        return;
    }
    then = now - (elapsed % fpsInterval);
    game_manager.update();

    if (game_manager.running){
        context.clearRect(0, 0, canvas.width, canvas.height);
        game_manager.draw(context);

    }

}



function activate(event){
    event.preventDefault();
    game_manager.handle_key_presses(event.key);
}
function deactivate(event){
    game_manager.handle_key_releases(event.key);
}

function stop(){
    window.cancelAnimationFrame(request);
    window.removeEventListener("keydown", activate);
    window.removeEventListener("keyup", deactivate)

}
export { canvas, player, game_manager, stop };
