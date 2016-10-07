// Simple class example

function Unassigned(posX, posY, width, height) {
		this.x = posX;
		this.y = posY;
		this.width = width;
		this.height = height;
		this.name = "Unassigned";
		/*this.velX = 0;
		this.velY = 0;
		this.accelX = 0;
		this.accelY = 0;*/
		/*this.color = "gray";*/
		this.radius = width;
}

//The function below returns a Boolean value representing whether the point with the coordinates supplied "hits" the particle.
Unassigned.prototype.hitTest = function(hitX,hitY) {
	return((hitX > this.x - this.width/2)&&(hitX < this.x + this.width/2)&&(hitY > this.y - this.height/2)&&(hitY < this.y + this.height/2));
}

//A function for drawing the particle.
Unassigned.prototype.drawToContext = function(theRoom, theList) {
}