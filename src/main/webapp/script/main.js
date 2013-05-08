var gridSizeX = 14;//Math.floor($(window).width() / 60)-1;
var gridSizeY = 10;//Math.floor($(window).height() / 60)-1;
var tabIndex = 1;
var maximumPlacingAttempts = 10000;
//var words = prompt("Please enter a comma separated list of words\n\nEx: fish, ball, cat").toUpperCase().replace(/ /g, "").split(",");
var words;// = loadWords();
var wordObjects = new Array();
var grid = new Array(gridSizeY);

$('#wrapper').css('width', (gridSizeX * 60)+2);
$('#wrapper').css('height', (gridSizeY*60)+2);
var html;

function loadWords() {
	pt = "getwords?source=dic-aberto";
	en = "getwords?source=word-generator";
	url = "EN"//prompt("PT or EN?");
	if(url == "PT") {
		url = pt;
	} else if(url == "EN") {
		url = en;
	}
	$.ajax({
		type: "GET",
		async: false,
		url: url,
		dataType: "json",
		success: function(response, status, xhr) {
			words = response;
		},
		error: function(xhr, type) {
			alert('error');
		}
	});
	//words = [{"palavra":"coração","definicao":"alguma coisa acontece"}, {"palavra":"avenida", "definicao":"quando cruzo."}];
}


function setupGrid() {
	for(var i = 0; i < gridSizeY; i++) {
		grid[i] = new Array(gridSizeX);
		for(var j = 0; j < gridSizeX; j++) {
			$box = $('<div class="box" id="' + j + 'x' + i + 'y' + '"></div>');
			$('#wrapper').append($box);
		}
	}
}

function getInitialCoords(word) {
	var placingAttempts = 0;
	while(++placingAttempts < maximumPlacingAttempts) {
		var x = getRand(gridSizeX);
		var y = getRand(gridSizeY);
		var h = randomBool(); // horizontal flag
		if(h) {
			if(y == 0 || ((x+word.length) > (gridSizeX-1))) {
				continue;
			}
		} else {
			if(x == 0 || ((y+word.length) > (gridSizeY-1))) {
				continue;
			}
		}
		return {"x": x, "y": y, "isHorizontal": h};
	}
	return false; // gives up upon reaching maximum attempt count
}

function getHookCoords(word) {
	var isHorizontal, skips =[];

	for(var i = 0; i < word.length; i++) { // chars of the current word
		searchWords:
		for(var j = 0; j < wordObjects.length; j++) { // words already rendered
			if(typeof wordObjects[j] == "undefined"){
				continue;
			}
			var searchWord = wordObjects[j].word;

			if(word.charAt(i) == "R" && wordObjects[j].word == "AMET") {
				console.log("stopme");
			}

			console.log("seeing if i can hook  " + word + "'s [" + word.charAt(i) + "] char to " + wordObjects[j].word);
		
			var matchIndex = searchWord.indexOf(word.charAt(i));
			if(matchIndex >= 0) {
				console.log("opa, trying to hook to " + wordObjects[j].word);
				if(wordObjects[j].word == "lorem") {
					console.log(wordObjects[j].letters);
				}
				var x = wordObjects[j].letters[matchIndex].x;
				var y = wordObjects[j].letters[matchIndex].y;
				isHorizontal = !wordObjects[j].isHorizontal;
				var begin = isHorizontal? x-(i+1) : y-(i+1);
				var end = begin+word.length;


				for(var k = begin; k <= end; k++) {
					var skipCount = 0;
					var checkY = (isHorizontal? y : k);
					var checkX = (isHorizontal? k : x);

					if(checkX < 0 || checkY < 0 || end+1 > (isHorizontal? gridSizeX : gridSizeY)) {
						continue searchWords; // o começo estouraria a grid
					}
					if(typeof grid[checkY] != "object") {
						continue searchWords;
					}

					console.log("checking " + checkX + 'x' + checkY + "y");

					
					if(typeof grid[checkY][checkX] != "undefined") {
						console.log(checkX + 'x' + checkY + "y of " + word + " is fucking defined!");
						if(k == end) {
							if(grid[checkY][checkX].isTip) {
								console.log("bummer. found a tip on " + checkX + 'x' + checkY + 'y');
								continue searchWords; 
							}
						}
						if(grid[checkY][checkX] == word.charAt(k-begin-1)) {
							skips[skipCount++] = (k-begin-1); 
							console.log("must skip the " + skips + " of " + word);
							
						} else {
							console.log("can't match [" + word.charAt(k-begin-1) + "] to at " + checkX + 'x' + checkY + 'y');
							continue searchWords; 
						}
					} else {

					}		
					
				}

				return {
					"x": isHorizontal? begin : x,
					"y": isHorizontal? y : begin,
					"isHorizontal": isHorizontal,
					"skip": skips
				};
			}
		}
	}
	return false;
}

function placeWords() {
	var startX, startY, isHorizontal, currentWord;
	mainLoop:
	for(var i = 0; i < words.length; i++) { // walks through each word
		currentWord = words[i].word.toUpperCase();
		if(i == 0) {
			coords = getInitialCoords(currentWord);
		} else {
			coords = getHookCoords(currentWord);
		}


		if(coords) {
			startX = coords.x;
			startY = coords.y;
			isHorizontal = coords.isHorizontal;
		} else {
			console.log("##couldn't place " + currentWord);
			continue mainLoop; // give up trying to hook the current word
		}
	

		//Draw tip
		$tip = $('<span class="tip">' + words[i].definition + '</span>');
		var parent = $('#' + startX + 'x' + startY + 'y');
		parent.addClass((isHorizontal? "right" : "down") + '-arrow');
		parent.append($tip);
		grid[startY][startX] = {"isTip":true};
		//Draw word

		var letters = new Array();

		for(var j = 0; j < currentWord.length; j++) { // walks through each char of the current word
			letters[j] = {
					"letter": currentWord.charAt(j),
					"x": (isHorizontal? startX+1 : startX),
					"y": (isHorizontal? startY : startY+1)
			};

			if(!coords.skip || (coords.skip && $.inArray(j, coords.skip) == -1)) {
				grid[(isHorizontal? startY : startY+1)][(isHorizontal? startX+1 : startX)] = currentWord.charAt(j);
				$letter = $('<input type="text" tabindex="' + tabIndex++ + '" class="box" data-i="'+ i + '" maxlength="1"></div>');
				$('#' + (isHorizontal? ++startX : startX) + 'x'
						+ (isHorizontal? startY : ++startY) + 'y').append($letter);
			} else {
				if(isHorizontal) {
					startX++;
				} else {
					startY++;
				}
			}
		} console.log("--------");
		wordObjects[i] = {"word": currentWord, "isHorizontal": isHorizontal, "startX": startX,
						 "startY": startY,"letters": letters};
	}
}

function bindEvents() {
	$('input').on('keypress', handleKeyPress);
	$('input').on('keydown', handleKeyDown);
}

function handleKeyPress(event) {
	if(event.keyCode < 37 || event.keyCode > 40) {
		this.value = "";	
	}
	var x = parseInt($(this).parent().attr('id').split('x')[0]);
	var y = parseInt($(this).parent().attr('id').split('x')[1].replace('y', ''));

	if(document.getElementById(x + 'x' + (y+1) + 'y') && event.shiftKey) { // moving vertically
		$('#' + x + 'x' + (y+1) + 'y').children()[0].focus();
	} else if(document.getElementById((x+1) + 'x' + y + 'y') && !event.shiftKey) { // moving horizontally
		$('#' + (x+1) + 'x' + y + 'y').children()[0].focus();
	}
}

function handleKeyDown(event) {
	var currentX = parseInt($(this).parent().attr('id').split('x')[0]);
	var currentY = parseInt($(this).parent().attr('id').split('x')[1].replace('y', ''));
	var newX, newY;
	switch(event.keyCode) {
    	case 37: //left
	    	newX = currentX-1;
	    	newY = currentY;
	   		break;
    	case 38: // up
	    	newX = currentX;
    		newY = currentY-1;
    		break;
    	case 39: // right
	    	newX = currentX+1;
	    	newY = currentY;
	    	break;
    	case 40: // down
	    	newX = currentX;
	    	newY = currentY+1;
	    	break;
    }	

    if(document.getElementById(newX + "x" + newY + "y")) {
    	$('#' + newX + "x" + newY + "y").children()[0].focus();
    }
}

function play() {
	setupGrid();
	loadWords();
	placeWords();
	bindEvents();
}

play();