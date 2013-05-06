function getRand(limit) {
	if(limit) {
		return Math.round(Math.random() * limit-1)+1;
	} else {
		return Math.round(Math.random() * 13);	
	}
}	

function randomBool() {
	return Boolean(getRand(1));
}