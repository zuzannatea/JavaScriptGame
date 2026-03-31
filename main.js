let canvas;
let context;

let fpsInterval = 100 / 30;
let now;
let then = Date.now();

let obstacles = [];
let request;
/* let player = {
    x : 0,
    y : 150,
    length : 10,
    height : 15,
    xChange : 10,
    yChange : 10,
    extraMoves : [],
    health : 100,
    score : 0
};
 *//* let enemy = {
    x : 100,
    y : 150,
    length : 10,
    height : 15,
    xChange : 10,
    yChange : 10,
    health : 50
};
 */
let enemy;
let player;

let moveLeft = false;
let moveUp = false;
let moveRight = false;
let moveDown = false; 
let isAttacking = false;

document.addEventListener("DOMContentLoaded", init, false);

function init(){
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");
    window.addEventListener("keydown",activate,false);
    window.addEventListener("keyup",deactivate,false);
    draw();
    enemy = new Enemy(canvas.width, canvas.height);
    player = new Player(canvas.width, canvas.height);

}


function draw(){
    window.requestAnimationFrame(draw);
    let now = Date.now();
    let elapsed = now - then;
    if (elapsed <= fpsInterval){
        return;
    }
    then = now - (elapsed % fpsInterval);
    

    if (enemy.health <= 0){
        enemy = 0;
        console.log("DAGHJSK");
    }


    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "cyan";
    context.fillRect(player.x, player.y, player.length, player.height);
    context.fillStyle = "red";
    context.fillRect(player.x, player.y - 10, player.health/player.length, 5);

    console.log(enemy.x,enemy.y, enemy.length, enemy.height);
    context.fillStyle = "orange";
    context.fillRect(enemy.x, enemy.y - 10, enemy.health/enemy.length, 5);
    context.fillStyle = "yellow";
    context.fillRect(enemy.x, enemy.y, enemy.length, enemy.height);

    if (is_colliding(player,enemy) && isAttacking){
        enemy.x = enemy.x - 5;
        enemy.health = enemy.health - 10;
    }


    if (player.x + player.length >= canvas.width ||
        player.x < 0 || 
        player.y - player.height < 0 || 
        player.y + player.height >= canvas.height){
            stop();
            return;
    }
    if (moveRight){
        player.x = player.x + player.xChange;
    }
    if (moveLeft){
        player.x = player.x - player.xChange;
    }
    if (moveUp){
        player.y = player.y - player.yChange;
    }
    if (moveDown){
        player.y = player.y + player.yChange;
    }
}

function randint(min,max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
        isAttacking = true; 
    }
    if (key === "ArrowLeft"){
        moveLeft = true; 
    }
    else if (key === "ArrowUp"){
        moveUp = true;
    }
    else if (key === "ArrowRight"){
        moveRight = true;
    }
    else if (key === "ArrowDown"){
        moveDown = true;
    }

}
function deactivate(event){
    let key = event.key;
    if (key === "ArrowLeft"){
        moveLeft = false; 
    }
    else if (key === "ArrowUp"){
        moveUp = false;
    }
    else if (key === "ArrowRight"){
        moveRight = false;
    }
    else if (key === "ArrowDown"){
        moveDown = false;
    }
    if (key === " "){
        isAttacking = false;
    }

}

function add_entity(){
    
}


function stop(){
    window.cancelAnimationFrame(request);
    window.removeEventListener("keydown", activate);
    window.removeEventListener("keyup", deactivate)

}
