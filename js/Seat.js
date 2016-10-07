
function Seat(key, posX, posY, name, seat, numSeats) {
		this.key = key;
		this.posX = Number(posX);
		this.posY = Number(posY);
		/*this.velX = 0;
		this.velY = 0;
		this.accelX = 0;
		this.accelY = 0;*/
		this.color = "lightblue";
		this.name = name;
		this.seat = Number(seat);
		this.n = numSeats;
		this.lg_radius = numSeats * 10;
		this.lg_rad = this.lg_radius * .85;
	    this.lg_circ = 2*Math.PI*this.lg_rad;
	    this.radius = (this.lg_circ / this.n) / 2;
	    this.angle = this.seat*2*Math.PI/this.n;
	    if(this.posX == 0 && this.posY == 0){
	    	this.canv = 'unassigned';
	    	this.x = 20;
	    	this.y = (this.seat) * 30;
	    	//this.x = 60 + ((this.seat - 1) % 2) * 80;
			//this.y = (this.seat) * 35 + 35 *(this.seat % 2) + 20;
	    } else {
			this.canv = 'seating';
	    	this.x = this.posX + Math.cos(this.angle) * this.lg_rad;
	    	this.y = this.posY + Math.sin(this.angle) * this.lg_rad;
	    }
}

//The function below returns a Boolean value representing whether the point with the coordinates supplied "hits" the particle.
Seat.prototype.hitTest = function(hitX,hitY) {
	var dx = this.x - hitX;
	var dy = this.y - hitY;
	return(dx*dx + dy*dy < this.radius*this.radius);
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';

    for(var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  }

//A function for drawing the particle.
Seat.prototype.drawToContext = function(theRoom, theList) {

	if (this.canv == 'unassigned'){
		theList.beginPath();
		theList.fillStyle = this.color;
		theList.arc(this.x, this.y, 12, 0, 2*Math.PI, false);
		theList.fill();
		theList.textAlign = 'left';
		theList.textBaseline = 'middle';
		maxWidth = 170;
		lineHeight = 12;
		theList.fillStyle = "#333333";
		theList.font="13px Arial";
		wrapText(theList, this.name, this.x + 15, this.y, maxWidth, lineHeight);
	} else {
		theRoom.beginPath();
		theRoom.fillStyle = this.color;
		theRoom.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false);
		theRoom.fill();
		theRoom.textAlign = 'center';
		theRoom.textBaseline = 'middle';
		maxWidth = 60;
		lineHeight = 12;
		theRoom.fillStyle = "#333333";
		theRoom.font="11px Arial";
		wrapText(theRoom, this.name, this.x, this.y-2, maxWidth, lineHeight);
	}
}

