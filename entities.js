all_entities = [];

class Enemy {
  constructor(width, height) {
    this.x = randint(0, width);
    this.y = randint(0, height);
    this.length = 10;
    this.height = 15;
    this.xChange = 10;
    this.yChange = 10;
    this.health = 50;
  }
  wander(){
    chanceOfMovement = randint(0,10);
    if (chanceOfMovement > 7){
        let xMove = randint(-1,1) * this.xChange;
        let yMove = randint(-1,1) * this.yChange;
        this.move_by(xMove,yMove);
        if (this.entity_colliding()){
            this.move_by(-xMove,-yMove);
        }
    }
  }
  move_by(xMove,yMove){
        this.x = this.x + xMove;
        this.y = this.y + yMove;
  }
  entity_colliding(){
    for (let entity of all_entities){
        if (is_colliding(this,entity)){
            return true;
        }
    }
    return false;
  }
}

class Player {
  constructor(width, height) {
    this.x = randint(0, width);
    this.y = randint(0, height);
    this.length = 10;
    this.height = 15;
    this.xChange = 10;
    this.yChange = 10;
    this.health = 50;
    this.score = 0;
    this.extraMoves = [];
  }
}

function is_colliding(object1, object2){
    if (object1.x + object1.length < object2.x ||
        object2.x + object2.length < object1.x ||
        object1.y > object2.y + object2.height ||
        object2.y > object1.y + object1.height){
            return false;
        }
    else{
        return true;
    }
}
