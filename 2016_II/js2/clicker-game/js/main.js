//-----------------
// Game Module
//----------------

var game = {};

game.data = {
	points: 0,
	totalPoints: 0,
	pps: 0, //points per second
	amtcats: 0,
	rulettePlays: 0,
	startTime: 0,
	events: []
};

//-----------------
// Game calculations
//----------------

game.addPoints = function(amt) {
	this.data.points += amt;
	$('#display-points').text(Math.floor(game.data.points));
	game.addTotal(amt);
};

game.removePoints = function(amt) {
	this.data.points -= amt;
	$('#display-points').text(Math.floor(game.data.points));
};

game.addTotal = function(amt) {
	this.data.totalPoints += amt;
	$('#display-stats-total').text(Math.floor(game.data.totalPoints));
};

game.addCat = function(amt) {
	this.data.amtcats += amt;
	$('#display-cats').text(game.data.amtcats);
}

game.calculatePPS = function() {
	var total = 0;
	for (var i=0; i<game.items.length; i++) {
		var temp = game.items[i].currentPPS * game.items[i].amt;
		total += temp	
	}
	game.data.pps = total;
	$('#display-pps').text(game.data.pps.toFixed(1));
}

//-----------------
// Item functions
//----------------

game.checkItems = function() {
	for (var i=0; i<game.items.length; i++) {
		var itemBox = $('#' + game.items[i].name);
		if(game.items[i].currentPrice<=game.data.points) {
			itemBox.addClass('item-available');
		} else {
			itemBox.removeClass('item-available');
		}
	}
};

game.buyItem = function(box) {
	if (box.hasClass('item-available')) {
		var id = box.attr('id');
		var item;

		for (var i=0; i<game.items.length; i++) {
			if(id === game.items[i].name) {

				item = game.items[i];
				game.removePoints(item.currentPrice);

				if (item.amt == 0) {
					var id = item.name;
					$('#scene-' + id).removeClass('hidden')
				}

				var newprice = Math.floor(item.basePrice * Math.pow(1.15, item.amt+1));
				item.currentPrice = newprice;
				$('#display-cost-' + id).text(newprice);

				item.amt++;
				$('#display-amt-' + id).text(item.amt);

				game.calculatePPS();
			}
		}
		game.checkItems();
		game.checkUpgrades();
		game.checkUpgradeAvail(item);
	}
};

game.createItem = function (name, plural, basePrice, basePPS, imagesrc) {
	var obj = {};
	obj.name = name;
	obj.plural = plural;
	obj.basePrice = basePrice; 
	obj.basePPS = basePPS; 
	obj.amt = 0; //Amount of items owned
	obj.currentPrice = basePrice; 
	obj.currentPPS = basePPS;
	obj.upgradesAvail = 0; //Amount of upgrades available
	obj.amtUpgrades = 0; //Amount of upgrades bought
	obj.getDescription = function(item) {
		return 'Adds ' + item.currentPPS + ' love points per second.'
	};
	obj.getProduction = function(item) {
		if (isPlural(item.amt)) { var name = item.plural } else { var name = item.name };
		return 'Currently ' + item.amt + ' ' + name + ' producing ' + item.currentPPS*item.amt + ' love points per second.'
	};
	obj.description = obj.getDescription(obj);
	obj.production = obj.getProduction(obj); 
	obj.imagesrc = imagesrc;
	game.items.push(obj);
};

//-----------------
// Upgrade functions
//----------------

game.createUpgrade = function(name, item, level, imagesrc, iconAvailable, iconUnavailable) {
	var obj = {};
	obj.name = name;
	obj.item = item; //Item it will upgrade
	obj.level = level; //Level of upgrade (Number from 1 to 4)
	obj.getPrice = function(upgrade) {
		var basePrice;
		switch(upgrade.item) {
			case 'autopet': basePrice = 10; break;
			case 'food': basePrice = 100; break;
			case 'clothes': basePrice = 1000; break;
			case 'playground': basePrice = 10000; break;
			case 'chase': basePrice = 100000; break;
			case 'destroy': basePrice = 1000000; break;
			default: console.log('Error. getPrice switch invalid'); break;
		}
		return basePrice*Math.pow(10, upgrade.level);
	};
	obj.price = obj.getPrice(obj);
	obj.getItemsRequired = function(upgrade) {
		return upgrade.level * 25;
	};
	obj.itemsRequired = obj.getItemsRequired(obj); //Amount of the item required
	obj.getCatsRequired = function(upgrade) {
		var increment;
		switch(upgrade.item) {
			case 'autopet': increment = 1; break;
			case 'food': increment = 2; break;
			case 'clothes': increment = 3; break;
			case 'playground': increment = 4; break;
			case 'chase': increment = 5; break;
			case 'destroy': increment = 6; break;
			default: console.log('Error. getCatsRequired switch invalid'); break;
		}
		return level + increment;
	};
	obj.catsRequired = obj.getCatsRequired(obj); //Amount of cats required
	obj.imagesrc = imagesrc;
	obj.iconAvailable = iconAvailable;
	obj.iconUnavailable = iconUnavailable;
	obj.getDescription = function(upgrade) {
		return upgrade.item + ' are twice as efficient!';
	}
	obj.desc = obj.getDescription(obj);
	obj.isAvailable = false;
	obj.isBought = false;
	game.upgrades[obj.item].push(obj);
};

game.checkUpgrades = function() {
	for (var item in game.upgrades) {
		for (var i=0; i<game.upgrades[item].length; i++) {
			var elm = $('#' + game.upgrades[item][i].name);
			if(game.upgrades[item][i].price<=game.data.points && game.upgrades[item][i].catsRequired<=game.data.amtcats) {
				elm.addClass('upgrade-available');
			} else {
				elm.removeClass('upgrade-available');
			}
		}
	}
};

game.checkUpgradeAvail = function(item) {
	if(Number.isInteger(item.amt/25) && item.amt!=0) {
		game.unlockUpgrade(item);
	}
};

game.unlockUpgrade = function(item) {
	var upgrade = game.upgrades[item.name][item.upgradesAvail];
	if(!upgrade.isAvailable) {
		upgrade.isAvailable = true;
		item.upgradesAvail++;
		var span = $('<span class="mini-icon upgrade" id="' + upgrade.name + '"></span>');
		span.click(function(){
			game.buyUpgrade(this, upgrade);
		});
		span.on( "mouseenter", function() {showHover(this, 'upgrade', upgrade)});
		span.on( "mouseleave", function() {hideHover()});

		$('#display-upgrades').append(span);
	}
};

game.buyUpgrade = function(elm, upgrade){
	if ($(elm).hasClass('upgrade-available')) {
		displayUpgradeBought(elm);
		$(elm).remove();	
		upgrade.isBought = true;
		
		var id = upgrade.item;
		for (var i=0; i<game.items.length; i++) {
			if (game.items[i].name == id) {
				var item = game.items[i];
				item.amtUpgrades++;
				item.currentPPS = item.basePPS * Math.pow(2, game.items[i].amtUpgrades);
				item.description = item.getDescription(item);
				item.production = item.getProduction(item); 
				game.calculatePPS();
			}
		}
	}
	game.checkItems();
	game.checkUpgrades();
};

//-----------------
// Cat functions
//----------------

game.unlockCat = function(n) {
	if(!Number(game.data.cats[n].isFound)) {
		var name = $('#name'+n);
		var photo = $('#photo'+n);
		name.text(game.data.cats[n].name);
		photo.addClass('cat-picture-avail');
		game.addCat(1);
	}
}

//-----------------
// Achievement functions
//----------------

game.checkAchievements = function() {
	for (var type in game.data.achievements) {
		var achievementArray = game.data.achievements[type];
		var achievementType = game.data[type];
		for (var i=0; i<achievementArray.length; i++) {
			var achievement = achievementArray[i];
			if (achievement.amt <= achievementType && (!Number(achievement.isUnlocked))) {
				game.unlockAchievement(achievement, type);
				achievement.isUnlocked = true;
			} 
		}
	}
};

game.unlockAchievement = function(achievement, type) {
	var box = $('<div class="new-message"></div>');
	var template = $('<p><strong>From:</strong> Cat Store</p><p><strong>Subject:</strong> Achievement unlocked!</p>');
	var message = $('<p><strong>Achieved:</strong> '+achievement.description+'</p><p>'+achievement.text+'</p>');
	box.append(template);
	box.append(message);
	game.displayMessage(box, achievement);
	game.sendAchievement(achievement);
};

game.displayMessage = function(node) {
	$('#no-messages').addClass('hidden');
	$('#display-messages').append(node);
	$('#phone-notification').removeClass('hidden');
	$('#delete-messages').removeClass('hidden');
};

$('#delete-messages').click(function(){
	$('#display-messages').empty();
	$('#delete-messages').addClass('hidden');
	$('#display-messages').append('<p id="no-messages">No new messages</p>');
});

game.sendAchievement = function(achievement) {
	var span = $('<span class="mini-icon achievement"></span>');
		span.on( "mouseenter", function() {showHover(this, 'achievement', achievement)});
		span.on( "mouseleave", function() {hideHover()});
		$('#tab-stats-achievements').append(span);
};

game.checkTime = function() {
	var nowTime = new Date;
	var nowTimems = nowTime.getTime();
	var seconds = Math.round((nowTimems - game.data.startTime) / 1000);
	var minutes = seconds/60;
	var hours = minutes/60;
	var days = hours/24;
	if(seconds>=60) {
		$('#display-stats-time').text((minutes).toFixed(0) + ' minutes ' + (seconds/60).toFixed(0) + ' seconds.');
	} else if (minutes>=60) {
		$('#display-stats-time').text((hours).toFixed(0) + ' hours ' + (minutes/60).toFixed(0) + ' minutes ' + (seconds/3600).toFixed(0) + ' seconds.');
	} else if (hours>=24) {
		$('#display-stats-time').text((days).toFixed(0) + ' days ' + (hours/24).toFixed(0) + ' hours ' + (minutes/1440).toFixed(0) + ' minutes ' + (seconds/86400).toFixed(0) + ' seconds.');
	} else { $('#display-stats-time').text(seconds + ' seconds.'); }
};

//-----------------
// Event functions
//----------------

game.createEvent = function(name, text, src) {
	var obj = {};
	obj.name = name;
	obj.text = text;
	obj.src = src;
	obj.calculateResult = function() {
		return game.totalPoints*0.1;
	}
	obj.result = obj.calculateResult();
	game.data.events.push(obj);
}

//game.fireEvent = function() {
//	var i = getRandomInt(0, game.data.events.length-1);
//	var event = game.data.events.length[i];
//	event.result = event.calculateResult();
//	var x = $(window).height()-150;
//	var y = $(window).width()-150;
//	$('#event-popup').css({
//		'top': getRandomInt(0, x),
//		'left': getRandomInt(0, y),
//	});
//	$('#event-popup').click(function() {
//		$(this).addClass('hidden');
//		$(this).unbind('click');
//	})
//	$('#event-popup').removeClass('hidden');
//};

//-----------------
// Setting the scene
//----------------

game.scene = function() {

};

game.start = function() {

	var startTime = new Date;
	game.data.startTime = startTime.getTime();

	var bgsong = new Audio('audio/happysong.wav');
	bgsong.loop = true;
	bgsong.play();
	$('#stop-music').click(function(){
		if (bgsong.paused) {
            bgsong.play();
            $(this).text('Music on');
        } else {
            bgsong.pause();
            $(this).text('Music off');
        }
	});

	$.getJSON('data/cats.json', function(json){
	    game.data.cats = json; 
	    displayAlbum(); 
	});

	$.getJSON('data/achievements.json', function(json){
	    game.data.achievements = json;   
	    game.checkAchievements();                
	}); 

	//eventLoop();
};


//------------
// Items
//------------

game.items = [];
game.createItem('autopet', 'autopets', 15, 0.1, 'img/icons/item-autopet.png');
game.createItem('food', 'foods', 100, 1, 'img/icons/item-food.png');
game.createItem('clothes', 'clothess', 1100, 8, 'img/icons/item-clothes.png');
game.createItem('playground', 'playgrounds', 12000, 47, 'img/icons/item-playground.png');
game.createItem('chase', 'factories', 130000, 270, 'img/icons/item-chase.png');
game.createItem('destroy', 'destroyers', 1400000, 1400, 'img/icons/item-destroy.png');

//------------
// Upgrades
//------------

game.upgrades = {
	autopet: [],
	food: [],
	clothes: [],
	playground: [],
	chase: [],
	destroy: [],
};

game.createUpgrade('autopetUp1', 'autopet', 1, '', '', '');
game.createUpgrade('autopetUp2', 'autopet', 2, '', '', '');
game.createUpgrade('autopetUp3', 'autopet', 3, '', '', '');
game.createUpgrade('autopetUp4', 'autopet', 4, '', '', '');

game.createUpgrade('foodUp1', 'food', 1, '', '', '');
game.createUpgrade('foodUp2', 'food', 2, '', '', '');
game.createUpgrade('foodUp3', 'food', 3, '', '', '');
game.createUpgrade('foodUp4', 'food', 4, '', '', '');

game.createUpgrade('clothesUp1', 'clothes', 1, '', '', '');
game.createUpgrade('clothesUp2', 'clothes', 2, '', '', '');
game.createUpgrade('clothesUp3', 'clothes', 3, '', '', '');
game.createUpgrade('clothesUp4', 'clothes', 4, '', '', '');

game.createUpgrade('playgroundUp1', 'playground', 1, '', '', '');
game.createUpgrade('playgroundUp2', 'playground', 2, '', '', '');
game.createUpgrade('playgroundUp3', 'playground', 3, '', '', '');
game.createUpgrade('playgroundUp4', 'playground', 4, '', '', '');

game.createUpgrade('chaseUp1', 'chase', 1, '', '', '');
game.createUpgrade('chaseUp2', 'chase', 2, '', '', '');
game.createUpgrade('chaseUp3', 'chase', 3, '', '', '');
game.createUpgrade('chaseUp4', 'chase', 4, '', '', '');

game.createUpgrade('destroyUp1', 'destroy', 1, '', '', '');
game.createUpgrade('destroyUp2', 'destroy', 2, '', '', '');
game.createUpgrade('destroyUp3', 'destroy', 3, '', '', '');
game.createUpgrade('destroyUp4', 'destroy', 4, '', '', '');

//------------
// Events
//------------

game.createEvent('good', 'One of your cats fell asleep on your lap aww', '');
game.createEvent('bad', 'One of your cats puked in the carpet', '');

//------------
// Loop
//------------

setInterval(function() {
	game.checkItems();
	game.checkUpgrades();
	game.checkAchievements();
	game.checkTime();
}, 100)

setInterval(function() {
	var pps = game.data.pps;
	game.addPoints(pps);
}, 1000)

//function eventLoop() {
//    var random = getRandomInt(300000, 180000);
//    setTimeout(function() {
//            game.fireEvent();
//            eventLoop();  
//    }, random);
//}

//--------------------------
// User interaction events
//--------------------------

var $clicker = $('#clicker');
$clicker.click(function() {
	game.addPoints(1);
	var meow = new Audio('audio/newmeow.mp3');
	meow.play();
});

var itemBoxes = $('.item');
for (var i=0; i<itemBoxes.length; i++) {
	$(itemBoxes[i]).click(function(){game.buyItem($(this))})
	$(itemBoxes[i]).on( "mouseenter", function() {showHover(this, 'item')});
	$(itemBoxes[i]).on( "mouseleave", function() {hideHover()});
}

$('#button-rulette-play').click(playRulette);
$('#button-rulette-close').click(closeRulette);


//------------------
// Game navigation
//------------------

var $gameNav = $('.game-nav');
var $buttonStats = $('#button-stats');
var $buttonStore = $('#button-store');
var $buttonRulette = $('#button-rulette');
var $buttonAlbum = $('#button-album');
var $buttonPhone = $('#button-phone');

$buttonStats.click(function(){displayTab(this, $('#tab-stats'))});
$buttonStore.click(function(){displayTab(this, $('#tab-store'))});
$buttonRulette.click(function(){displayTab(this, $('#tab-rulette'))});
$buttonAlbum.click(function(){displayTab(this, $('#tab-album'))});
$buttonPhone.click(function(){displayTab(this, $('#tab-phone'))});

function displayTab(button, tab) {
	//Checks if any of the other buttons are active	
	var $buttons = $('.game-button');
	$buttons.each(function(){
		if ($(this)[0] != button) {
			$(this).removeClass('tab-active');}
	})
	//Checks if any of the other tabs are active
	var $tabs = $('.tab');
	$tabs.each(function(){
		if ($(this)[0] != tab[0]) {
			$(this).addClass('hidden');}
	})

	//Checks if the current tab is already active
	if ($(button).hasClass('tab-active')) {
		tab.addClass('hidden');
		$(button).removeClass('tab-active');	
	} else {
		tab.removeClass('hidden');
		$(button).addClass('tab-active');
		if ($(button).attr('id') == 'button-phone') {
			$('#phone-notification').addClass('hidden');
		}
	}
}

$('#canvas').click(function(){
	var $tabs = $('.tab');
	$tabs.each(function(){
		$(this).addClass('hidden');
	});
	var $buttons = $('.game-button');
	$buttons.each(function(){
		$(this).removeClass('tab-active');
	})
})

function displayAlbum() {
	var id = 0;
	for (var i=0; i<game.data.cats.length; i++) {
		var obj = game.data.cats[i];
		var img = $('<span class="cat-picture"></span>');
		img.attr('id', 'photo'+id)
		var title = $('<p class="cat-name">Empty</p>').attr('id', 'name'+id);
		var box = $('<div class="cat-module"></div>').append(img);
		box.append(title);
		$('#tab-album').append(box);
		id++;
	}
}

function displayUpgradeBought(elm) {
	var node = $(elm).clone(true);
	node.unbind('click');
	node.css('cursor', 'initial');
	$('#tab-stats-upgrades').append(node);
}

function showHover(elm, type, node) {
	var id = $(elm).attr('id');
	var pos = $(elm).offset();
	var box = $('<div class="hoverBox"></div>');
	if(type == 'item') {
		for(var i=0; i<game.items.length; i++) {
			if(game.items[i].name == id) {
				var description = game.items[i].description;
				var production = game.items[i].production;
			}
		}

		box.css({
			'top': pos.top,
			'left': pos.left-210,
		});
		box.append('<small>'+description+'</small><br><small>'+production+'</small>')
	} else {
		box.css({
			'top': pos.top-15,
			'left': pos.left-210,
		});
		if (type == 'upgrade') {
			box.append('<small>'+node.desc+'</small><br><small>Price '+node.price+' love points</small><br><small>Required '+node.catsRequired+' cats</small>')	
		} else {
			box.append('<small>Achievement unlocked!</small><br><small>'+node.description+'</small>');
		}
	};
	$(document.body).append(box);
}

function hideHover() {
	$('.hoverBox').remove();
}

function playRulette() {
	var random = getRandomInt(0, game.data.cats.length);
	game.unlockCat(random);
	$('#button-rulette-play').addClass('hidden');

	if (!Number(game.data.cats[random].isFound)) {
		$('#display-rulette-name').text('You got ' + game.data.cats[random].name + '!');
		$('#button-rulette-close').text('¡Yay!');
	} else {
		$('#display-rulette-name').text('You got ' + game.data.cats[random].name + '... again.');
		$('#button-rulette-close').text('Oh well...');
	}
	$('#display-rulette').addClass('rulette-result');
	$('#display-rulette-name').removeClass('hidden');
	$('#button-rulette-close').removeClass('hidden');
	game.data.cats[random].isFound = true;
}

function closeRulette() {
	$('#display-rulette-name').addClass('hidden');
	$('#button-rulette-close').addClass('hidden');
	$('#button-rulette-play').removeClass('hidden');
	$('#display-rulette').removeClass('rulette-result');
}

//------------------
// Helper functions
//------------------

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function isPlural(n) {
	if(n !== 1) {return true}
	else {return false}
} 

//------------------
// Starting game
//------------------

$(document).ready(function() {
	if (localStorage.getItem('game')) {
		game.data = JSON.parse(localStorage.getItem('game'));
		$('#display-pps').text(game.data.pps);
		$('#display-cats').text(game.data.amtcats);
	} 
	game.start()
});

//------------------
// Save file
//------------------

$('#button-save').click(function() {
	localStorage.setItem('game', JSON.stringify(game.data));
}) 

$('#button-delete').click(function() {
	localStorage.clear();
}) 