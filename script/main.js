var words = prompt("Please enter a comma separated list of words\n\nEx: fish, ball, cat").replace(/ /g, "").split(",");
var startX = $('#wrapper').offset().left;
var startY = $('#wrapper').offset().top;
var boxSize = 54;
var hIndex = 0;
var vIndex = 0;
var gridSizeX = 12;
var gridSizeY = 10;

var wordObjects = new Array();

function buildGrid() {
	var grid = new Array(gridSizeX);
	for(var i = 0; i < grid.length; i++) {
		grid[i] = new Array(gridSizeY);
	}
	return grid;
}

function randomOrientation() {
	switch(getRand(3)) {
		case 1:
			return "up";
		case 2:
			return "right";
		case 3:
			return "down";
	}
}

function hasAvailableSpace(x, y, hookOrg, hookNew, word, isHorizontal) {
      	var begin = (isHorizontal? y : x) - (hookNew+1);
      	for(var i = begin; i <= begin + word.length; i++) {
      		var searchId = (isHorizontal? x : i)+'x'+(isHorizontal? i : x)+'y';
      		if(i != (isHorizontal? y : x)) {
      			if(!document.getElementById(searchId)) {
      				console.log(searchId + ' is empty');		
      			} else {
      				console.log(searchId + ' is NOT empty');
      				return false;
      			}
      		} else {
      			console.log('skipped hook place ' + searchId);	
      		}
      	}
      	return {x:(isHorizontal? x : begin), y:(isHorizontal? begin : y)};
}

function renderWords() {
	var word = words[getRand(words.length-1)];
	var orientation = randomOrientation();	
	var wordStartX;
	var wordStartY;
	var hookX;
	var hookY;
	
	main:
	for(var i = 0; i < words.length; i++) {
	//for(var i = 0; i < 4; i++) { //
		var currentWord = words[i].toUpperCase();
		var isHorizontal = randomBool();
		wordStartX = getRand(gridSizeX);;
		wordStartY = getRand(gridSizeY);	
		outer2:
		for(var j = 0; j < wordObjects.length; j++) { // walks through the already rendered words
			searchWord = wordObjects[j].word.toUpperCase();
			for(var k = 0; k < currentWord.length; k++) { // walks through each character of the current word
				var charIndex = searchWord.indexOf(currentWord.charAt(k));
				if(charIndex >= 0) {
					console.log("going to hook " + currentWord + " to the " + (charIndex+1)
						+ "th letter of " + searchWord + ", which is " + searchWord.charAt(charIndex));

					hookOrg = wordObjects[j].letters[charIndex].x;
					hookX = wordObjects[j].letters[charIndex].x;
					hookY = wordObjects[j].letters[charIndex].y;
					console.log('gonna hook to ' + hookX + 'x' + hookY + 'y');
					isHorizontal = !wordObjects[j].isHorizontal;

					result = hasAvailableSpace(hookX, hookY, hookOrg, k, searchWord, wordObjects[j].isHorizontal);
					console.log(result);

					if(result) {
						wordStartX = result.x
						wordStartY = result.y
						break;
					} else {
						console.error('couldn\'t place ' + currentWord);
						continue main;
					}
				}
			}
		}

		var $word = $('<div class="tip ' + (isHorizontal? "right" : "down") + '-arrow" id="'
			+ wordStartX + 'x' + wordStartY + 'y' + '" ><span>' + words[i] + '</span></div>',
			{
				css: {
					left: (startX + (boxSize * wordStartX)) + 'px',
					top: (startY + (boxSize * wordStartY)) + 'px'
				}
			});
		$('#wrapper').append($word);

		wordObjects[i] = {
			word: words[i],
			isHorizontal: isHorizontal
		}
		
		var letters = new Array();

		for(var j = 0; j < words[i].length; j++) {
			letters[j] = {
				letter: words[i].charAt(j),
				x: isHorizontal? wordStartX+1 : wordStartX,
				y: isHorizontal? wordStartY : wordStartY+1 
			}

			$letter = $('<input type="text" value="' + words[i].charAt(j)
				         + '"maxlength="1" id="' + (isHorizontal? ++wordStartX : wordStartX)
				         + 'x' + (isHorizontal? wordStartY : ++wordStartY) + 'y" />', {
				css:{
					left: (startX + (boxSize * wordStartX)) + 'px',
					top: (startY + (boxSize * wordStartY)) + 'px'
				}
			});
			if(wordStartX == hookX && wordStartY == hookY) {
				
			} else {
				$('#wrapper').append($letter);	
			}
			
		}
		wordObjects[i].letters = letters;
	}
	console.log(wordObjects);
}

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

renderWords();

$('input').on('keypress', function(event) {
	this.value = "";
	var currentX = parseInt($(this).attr('id').split('x')[0]);
	var currentY = parseInt($(this).attr('id').split('x')[1].replace('y', ''));
	jumpToNext(currentX, currentY, event.shiftKey);
});

function jumpToNext(x, y, vertical) {
	if(document.getElementById((x+1) + "x" + y + "y") && !vertical) {
		$('#' + (x+1) + "x" + y + "y").focus();
	} else if(document.getElementById(x + "x" + (y+1) + "y") && vertical) {
		$('#' + x + "x" + (y+1) + "y").focus();
	}
}

$('input').on('keydown', function(event) {
	var currentX = parseInt($(this).attr('id').split('x')[0]);
	var currentY = parseInt($(this).attr('id').split('x')[1].replace('y', ''));

	switch(event.keyCode) {
    	case 37: //left
    		if(document.getElementById((currentX-1) + "x" + currentY + "y")) {
    			$('#' + (currentX-1) + "x" + currentY + "y").focus();
    		}
    		break;
    	case 38: // up
    		if(document.getElementById(currentX + "x" + (currentY-1) + "y")) {
    			$('#' + currentX + "x" + (currentY-1) + "y").focus();
    		}
    		break;
    	case 39: // right
    		if(document.getElementById((currentX+1) + "x" + currentY + "y")) {
    			$('#' + (currentX+1) + "x" + currentY + "y").focus();
    		}
    		break;
    	case 40: // down
    		if(document.getElementById(currentX + "x" + (currentY+1) + "y")) {
    			$('#' + currentX + "x" + (currentY+1) + "y").focus();
    		}
    		break;
    }	
});


