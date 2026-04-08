function dist(p1,p2){
	//console.log(Math.sqrt(Math.pow((p1.x-p2.x),2)) + Math.pow((p1.y-p2.y),2));
	return Math.sqrt(Math.pow((p1.x-p2.x),2)) + Math.pow((p1.y-p2.y),2);
}

export {dist}