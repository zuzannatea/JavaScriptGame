function dist(p1,p2){
	
	return Math.sqrt((Math.pow(p1.x-p2.x, 2)+Math.pow(p1.y-p2.y, 2)));
}
function remove_item(item,array){
	let index = array.indexOf(item);
	if (index === -1){
		return array;
	}
	else{
		array.splice(index,1);
		return array;
	}
}
function randint(min,max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
function wait(ms){
	var start = new Date().getTime();
	var end = start;
	while(end < start + ms) {
		end = new Date().getTime();
	}
}
function choose(choices){
	let index = Math.floor(Math.random() * choices.length);
	return choices[index];
}
function is_colliding(object1, object2){
	if (object1.x + object1.length < object2.x + 5 ||
		object2.x + object2.length < object1.x + 5 ||
		object1.y > object2.y + object2.height ||
		object2.y > object1.y + object1.height){
			return false;
		}
	else{
		return true;
	}
}

export {dist,randint,wait,choose, remove_item, is_colliding}