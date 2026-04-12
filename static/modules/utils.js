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

export {dist,randint,wait,choose, remove_item}