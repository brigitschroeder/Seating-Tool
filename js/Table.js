function Table(key, table, rad) {
		this.key = key;
		this.x = Number(table['loc'].split(" ")[0]);
		this.y = Number(table['loc'].split(" ")[1]);
		this.n = table['seats'];
		this.name = table['name'];
		this.seated = table['seated'];
		/*this.velX = 0;
		this.velY = 0;
		this.accelX = 0;
		this.accelY = 0;*/
		this.color = "rgba(49,112,130,0.8)";
		this.radius = rad;
}

//The function below returns a Boolean value representing whether the point with the coordinates supplied "hits" the particle.
Table.prototype.hitTest = function(hitX,hitY) {
	var dx = this.x - hitX;
	var dy = this.y - hitY;
	
	return(dx*dx + dy*dy < this.radius*this.radius);
}


//A function for drawing the particle.
Table.prototype.drawToContext = function(theRoom) {
	theRoom.textAlign = 'center';
	theRoom.textBaseline = 'middle';
	theRoom.font="11px Arial";

	var lg_rad = this.radius * .85;
	var lg_circ = 2*Math.PI*lg_rad;
	var sm_rad = (lg_circ / this.n) / 2;
	var cx = this.x;
	var cy = this.y;

	for (var i = 1; i <= this.n; ++i) {
		theRoom.beginPath();
		var angle = i*2*Math.PI/this.n;
		var x = cx + Math.cos(angle) * lg_rad;
		var y = cy + Math.sin(angle) * lg_rad;
		theRoom.arc(x, y, sm_rad, 0, 2*Math.PI, false);
		theRoom.fillStyle = this.color;
		theRoom.fill();

		theRoom.fillStyle = "#ffffff";

		theRoom.fillText(i, x, y);
	}
	theRoom.fillStyle = this.color;
	theRoom.fillText(this.name, this.x, this.y);
}