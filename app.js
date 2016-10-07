/**
 * Created by bschroeder on 10/6/16.
 */

function canvasSupport() {
    return Modernizr.canvas;
}

function canvasApp() {
    if (!canvasSupport()) {
        return;
    }

    var myData = JSON.parse(document.getElementById("savedModel").textContent);

    var theCanvas = document.getElementById("theRoom");
    var context = theCanvas.getContext("2d");

    var theList = document.getElementById("theList");
    var context2 = theList.getContext("2d");

    init();

    var numShapes;
    var shapes;
    var dragIndex;
    var dragging;
    var mouseX;
    var mouseY;
    var dragHoldX;
    var dragHoldY;
    var timer;
    var targetX;
    var targetY;
    var easeAmount;

    function init() {
        numTables = myData.tables.length;
        numAttendees = myData.attendees.length;
        numShapes = numTables + numAttendees + 1;
        //easeAmount = 0.45;
        easeAmount = 1;
        shapes = [];
        makeShapes();
        drawScreen();
        window.addEventListener("mousedown", mouseDownListener, false);
    }

    function makeShapes() {
        var i;
        var tempX;
        var tempY;
        var tempRad = 80;

        //unassigned area
        tempShape = new Unassigned(100, 250, 190, 490);
        shapes.push(tempShape);

        //generate tables from data
        for (i=0; i < numTables; i++) {
            tempRad = myData.tables[i]['seats']*10;
            tempShape = new Table(i, myData.tables[i], tempRad);
            shapes.push(tempShape);
        }

        //generate attendees from data
        var unassigned = 0;
        for (i=0; i < numAttendees; i++) {
            if (myData.attendees[i]['table'] === undefined || myData.attendees[i]['table'] === null){
                unassigned++;
                tempX = 0; //used to indicate unassigned seating area
                tempY = 0; //actual coordinates are calculated in Seat.js
                tempSeat = unassigned;
                numSeats = 8;
            } else {
                tempTable = myData.attendees[i]['table'];
                tempSeat = myData.attendees[i]['seat'];
                numSeats = myData.tables[tempTable]['seats'];
                tempX = myData.tables[tempTable]['loc'].split(" ")[0];
                tempY = myData.tables[tempTable]['loc'].split(" ")[1];
            }
            tempName = myData.attendees[i]['name'];
            tempShape = new Seat(i, tempX, tempY, tempName, tempSeat, numSeats);
            shapes.push(tempShape);
        }
    }

    function mouseDownListener(evt) {
        var i;

        //getting mouse position correctly
        //detect which canvas mouse is over
        var aRect = theList.getBoundingClientRect();
        var bRect = theRoom.getBoundingClientRect();

        if ((evt.clientX > aRect.left - theList.width/2)&&(evt.clientX < aRect.left + theList.width/2)&&(evt.clientY > aRect.top - theList.height/2)&&(evt.clientY < aRect.top + theList.height/2)) {
            mouseX = (evt.clientX - aRect.left)*(theList.width/aRect.width);
            mouseY = (evt.clientY - aRect.top)*(theList.height/aRect.height);
        }
        else if ((evt.clientY > bRect.left - theRoom.width/2)&&(evt.clientX < bRect.left + theRoom.width/2)&&(evt.clientY > bRect.top - theRoom.height/2)&&(evt.clientY < bRect.top + theRoom.height/2)) {
            mouseX = (evt.clientX - bRect.left)*(theRoom.width/bRect.width);
            mouseY = (evt.clientY - bRect.top)*(theRoom.height/bRect.height);
        }

        /*
         Below, we find if a shape was clicked. Since a "hit" on a seat or a table has to be measured differently, the
         hit test is done using the hitTest() function associated to the type of particle. This function is an instance method
         for both the Table and Seat classes we have defined with the external JavaScript sources.
         */
        for (i=0; i < numShapes; i++) {
            if (shapes[i].hitTest(mouseX, mouseY) && !(shapes[i] instanceof Unassigned)) {
                dragging = true;

                //the following variable will be reset if this loop repeats with another successful hit:
                dragIndex = i;
            }
        }

        if (dragging) {
            window.addEventListener("mousemove", mouseMoveListener, false);

            //place currently dragged shape on top
            shapes.push(shapes.splice(dragIndex,1)[0]);

            //store last clicked info for editing tool
            var lastClicked =[];
            if (shapes[numShapes-1] instanceof Table){
                lastClicked.push({'type':'Table', 'key':shapes[numShapes-1]['key'], 'name': shapes[numShapes-1]['name'], 'seats': shapes[numShapes-1]['n']});
            } else {
                lastClicked.push({'type':'Person', 'key':shapes[numShapes-1]['key'], 'name': shapes[numShapes-1]['name']});
            }
            document.getElementById("lastClicked").textContent = JSON.stringify(lastClicked, null, '\t');

            //shape to drag is now last one in array
            dragHoldX = mouseX - shapes[numShapes-1].x;
            dragHoldY = mouseY - shapes[numShapes-1].y;

            //The "target" position is where the object should be if it were to move there instantaneously. But we will
            //set up the code so that this target position is approached gradually, producing a smooth motion.
            targetX = mouseX - dragHoldX;
            targetY = mouseY - dragHoldY;

            //start timer
            timer = setInterval(onTimerTick, 1000/30);
        }
        //theRoom.removeEventListener("mousedown", mouseDownListener, false);
        window.removeEventListener("mousedown", mouseDownListener, false);
        window.addEventListener("mouseup", mouseUpListener, false);

        //code below prevents the mouse down from having an effect on the main browser window:
        if (evt.preventDefault) {
            evt.preventDefault();
        } //standard
        else if (evt.returnValue) {
            evt.returnValue = false;
        } //older IE
        return false;

    }

    function onTimerTick() {
        //because of reordering, the dragging shape is the last one in the array.
        shapes[numShapes-1].x = shapes[numShapes-1].x + easeAmount*(targetX - shapes[numShapes-1].x);
        shapes[numShapes-1].y = shapes[numShapes-1].y + easeAmount*(targetY - shapes[numShapes-1].y);

        //stop the timer when the target position is reached (close enough)
        if ((!dragging)&&(Math.abs(shapes[numShapes-1].x - targetX) < 0.1) && (Math.abs(shapes[numShapes-1].y - targetY) < 0.1)) {
            shapes[numShapes-1].x = targetX;
            shapes[numShapes-1].y = targetY;
            //stop timer:
            clearInterval(timer);

            //update data and redraw canvas
            if (shapes[numShapes-1] instanceof Table){
                //write table to new location
                myData.tables[shapes[numShapes-1].key]['loc'] = shapes[numShapes-1].x + " " + shapes[numShapes-1].y;
            } else if (shapes[numShapes-1] instanceof Seat){
                //find new seat
                movedSeat = false;
                newTable = myData.attendees[shapes[numShapes-1].key]['table'];
                newSeat = myData.attendees[shapes[numShapes-1].key]['seat'];
                for (i=0; i < numShapes; i++) {
                    //the following variables will be reset if this loop repeats with another successful hit:
                    if (shapes[i].hitTest(targetX, targetY)) {
                        movedSeat = true;
                        if (shapes[i] instanceof Table){
                            newTable = Number(shapes[i].key);
                            //loop through seats to find the closest seat at this table
                            for (var k = 1; k <= shapes[i].n; ++k) {
                                angle = k*2*Math.PI/shapes[i].n;
                                sm_rad = Math.PI*shapes[i].radius * .85 / shapes[i].n;
                                sm_x = shapes[i].x + Math.cos(angle) * shapes[i].radius * .85;
                                sm_y = shapes[i].y + Math.sin(angle) * shapes[i].radius * .85;

                                dx = this.sm_x - targetX;
                                dy = this.sm_y - targetY;

                                if(dx*dx + dy*dy < this.sm_rad*this.sm_rad){
                                    newSeat = k;
                                    //check if seat already occupied
                                    for (var j=0; j < myData.attendees.length; j++){
                                        if (myData.attendees[j]['table'] == newTable
                                        && myData.attendees[j]['seat'] == newSeat
                                        && j != shapes[numShapes-1].key) {
                                            alert("Seat occupied!");
                                            newTable = myData.attendees[shapes[numShapes-1].key]['table'];
                                            newSeat = myData.attendees[shapes[numShapes-1].key]['seat'];
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        //check if unassigning this seat
                        if (shapes[i] instanceof Unassigned){
                            newTable = null;
                            newSeat = null;
                        }
                    }
                }
                if (movedSeat) {
                    myData.attendees[shapes[numShapes-1].key]['table'] = newTable;
                    myData.attendees[shapes[numShapes-1].key]['seat'] = newSeat;
                }
            }
            document.getElementById("savedModel").textContent = JSON.stringify(myData, null, '\t');
            init();
        }
        drawScreen();
    }

    function mouseUpListener(evt) {
        window.addEventListener("mousedown", mouseDownListener, false);
        window.removeEventListener("mouseup", mouseUpListener, false);
        if (dragging) {
            dragging = false;
            window.removeEventListener("mousemove", mouseMoveListener, false);
        }
    }

    function mouseMoveListener(evt) {
        var posX;
        var posY;

        //getting mouse position correctly
        //detect which canvas mouse is over
        var aRect = theList.getBoundingClientRect();
        //var aRect = document.getElementsByClassName('theListWrapper');
        var bRect = theRoom.getBoundingClientRect();
        //var bRect = document.getElementsByClassName('theRoomWrapper');

        if ((evt.clientX > aRect.left)&&(evt.clientX < aRect.left + aRect.width)&&(evt.clientY > aRect.top)&&(evt.clientY < aRect.top + aRect.height)) {
            shapes[numShapes-1].canv = 'unassigned';
            mouseX = (evt.clientX - aRect.left)*(theList.width/aRect.width);
            mouseY = (evt.clientY - aRect.top)*(theList.height/aRect.height);
        }
        else if ((evt.clientX > bRect.left)&&(evt.clientX < bRect.left + bRect.width)&&(evt.clientY > bRect.top)&&(evt.clientY < bRect.top + bRect.height)) {
            shapes[numShapes-1].canv = 'seating';
            mouseX = (evt.clientX - bRect.left)*(theRoom.width/bRect.width);
            mouseY = (evt.clientY - bRect.top)*(theRoom.height/bRect.height);
        }

        //console.log(shapes[numShapes-1].canv);
        //console.log(aRect.height);

        posX = mouseX - dragHoldX;
        posY = mouseY - dragHoldY;

        targetX = posX;
        targetY = posY;
    }

    function drawShapes() {
        //context.scale(2, 2);
        //context.translate(panX,panY);
        var i;

        for (i=0; i < numShapes; i++) {
            //the drawing of the shape is handled by a function inside the external class.
            //we must pass as an argument the context to which we are drawing the shape.
            shapes[i].drawToContext(context, context2);

        }
    }

    function drawScreen() {
        //bg
        context.fillStyle = "#FAF7F8";
        context.fillRect(0,0,theRoom.width,theRoom.height);


        context2.fillStyle = "#FAF7F8";
        context2.fillRect(0,0,theList.width,theList.height);

        drawShapes();
    }


    //Disable canvas event listener while modal is shown
    $(".modal").on('shown.bs.modal', function () {
        window.removeEventListener("mousedown", mouseDownListener, false);
    });
     $(".modal").on('hidden.bs.modal', function () {
        window.addEventListener("mousedown", mouseDownListener, false);
     });

    //Add person or table
    $('input[type=radio][name=optionsRadios]').change(function() {
        if (this.value == 'person') {
            $('.numberSeatsGroup').hide();
        }
        else if (this.value == 'table') {
            $('.numberSeatsGroup').show();
        }
    });
    $("#modalAdd").on('shown.bs.modal', function () {
        var addType = $('input[name=optionsRadios]:checked', '#formAdd').val();
        if (addType == 'person') {
            $('.numberSeatsGroup').hide();
        }
        else if (addType == 'table') {
            $('.numberSeatsGroup').show();
        }
    });

    //Edit person or table
    $("#modalEdit").on('shown.bs.modal', function () {
        if (document.getElementById("lastClicked").textContent.length){
            var editTarget = JSON.parse(document.getElementById("lastClicked").textContent);
            if (editTarget[0]['type'] == 'Person'){
                $('.modal-edit-title').text('Edit Person: ' + editTarget[0]['name']);
                $('#editShapeName').val(editTarget[0]['name']);
                $('.editNumberSeatsGroup').hide();
            } else if (editTarget[0]['type'] == 'Table'){
                $('.modal-edit-title').text('Edit Table: ' + editTarget[0]['name']);
                $('#editShapeName').val(editTarget[0]['name']);
                $('#editNumberSeats').val(Number(editTarget[0]['seats']));
                $('.editNumberSeatsGroup').show();
            }
        } else {
            alert("Please select a person or table before clicking the edit button.");
            $('#modalEdit').modal('hide');
        }
    });

    //Delete person or table
    $("#modalDelete").on('shown.bs.modal', function () {
        if (document.getElementById("lastClicked").textContent.length){
            var editTarget = JSON.parse(document.getElementById("lastClicked").textContent);
            if (editTarget[0]['type'] == 'Person'){
                $('.modal-delete-title').text('Delete Person: ' + editTarget[0]['name']);
            } else if (editTarget[0]['type'] == 'Table'){
                $('.modal-delete-title').text('Delete Table: ' + editTarget[0]['name']);
            }
        } else {
            alert("Please select a person or table before clicking the delete button.");
            $('#modalDelete').modal('hide');
        }
    });

    $('.save-changes').click(function () {
        var modalName = $(this).parents('.modal').attr('id');
        //Add person or table
        if (modalName == 'modalAdd'){
            var addType = $('input[name=optionsRadios]:checked', '#formAdd').val();
            var name = $('#addShapeName').val();
            if (addType == 'person'){
                myData.attendees.push({'key':myData.attendees.length, 'name':name});
            } else if (addType == 'table'){
                var numberSeats = $('#numberSeats').val();
                myData.tables.push({'key':myData.tables.length, 'name':name, 'seats':numberSeats, 'loc':'100 100'});
            }
            $('#modalAdd').modal('hide');
            document.getElementById("savedModel").textContent = JSON.stringify(myData, null, '\t');
            init();
        }
        //Edit person or table
        if (modalName == 'modalEdit'){
            var editTarget = JSON.parse(document.getElementById("lastClicked").textContent);
            var shapekey = editTarget[0]['key'];
            if (editTarget[0]['type'] == 'Person'){
                for (i=0; i < myData.attendees.length; i++){
                    if (myData.attendees[i]['key'] == shapekey){
                        myData.attendees[i]['name'] = $('#editShapeName').val();
                        break;
                    }
                }
            } else if (editTarget[0]['type'] == 'Table'){
                for (i=0; i < myData.tables.length; i++){
                    if (myData.tables[i]['key'] == shapekey){
                        myData.tables[i]['name'] = $('#editShapeName').val();
                        myData.tables[i]['seats'] = $('#editNumberSeats').val();
                        break;
                    }
                }
            }
            $('#modalEdit').modal('hide');
            document.getElementById("savedModel").textContent = JSON.stringify(myData, null, '\t');
            init();
        }
        //Delete person or table
        if (modalName == 'modalDelete'){
            var editTarget = JSON.parse(document.getElementById("lastClicked").textContent);
            var shapekey = editTarget[0]['key'];
            if (editTarget[0]['type'] == 'Person'){
                for (i=0; i < myData.attendees.length; i++){
                    if (myData.attendees[i]['key'] == shapekey){
                        myData.attendees.splice( $.inArray(myData.attendees[i], myData.attendees), 1 );
                        break;
                    }
                }
            } else if (editTarget[0]['type'] == 'Table'){
                //remove table from array
                for (i=0; i < myData.tables.length; i++){
                    if (myData.tables[i]['key'] == shapekey){
                        myData.tables.splice( $.inArray(myData.tables[i], myData.tables), 1 );
                        break;
                    }
                }
                //unassign people seated at this table
                for (i=0; i < myData.attendees.length; i++){
                    if (myData.attendees[i]['table'] == shapekey){
                        thisKey = myData.attendees[i]['key'];
                        thisName = myData.attendees[i]['name'];
                        myData.attendees.splice( $.inArray(myData.attendees[i], myData.attendees), 1 );
                        myData.attendees.push({'key':thisKey, 'name':thisName});
                        break;
                    }
                }
            }
            $('#modalDelete').modal('hide');
            document.getElementById("savedModel").textContent = JSON.stringify(myData, null, '\t');
            init();
        }
    });
}