//=============================================================================
// Yedine Plugins - See Through
// YIN_SeeThrough.js
//=============================================================================

var Imported = Imported || {};
Imported.YIN_SeeThrough = true;
var SeeThrough = SeeThrough || {};

//=============================================================================
 /*:
 * @plugindesc v1.00 Make it, so whenever a player step on a certain
 * Region ID's, you will be able to look through element and see him
 * @author Yedine
 *
 * @param Enable
 * @type boolean
 * @default true
 * @on Enable
 * @off Disable
 * @desc Choose if the plugin is available by default or not.
 * 
 * @param Regions ID
 * @type number[]
 * @desc The Regions ID's where you will be able to see through
 * elements to be able to look at the hero and his followers.
 * 
 * @param Opacity
 * @type number
 * @min 1
 * @max 255
 * @default 155
 * @desc The opacity of the player and his follower when they step
 * to the Regions ID's.
 * 
 * */
//=============================================================================

(function() {
//=============================================================================
// Parameter Variables
//=============================================================================
SeeThrough.Parameters = PluginManager.parameters('YIN_SeeThrough');
SeeThrough.Param = SeeThrough.Param || {};
SeeThrough.transparentCharacters = [];

var regions = JSON.parse(SeeThrough.Parameters['Regions ID']);
for (let i = 0; i < regions.length; i++) {
    regions[i] = Number(regions[i]);
}
var opacity = Number(SeeThrough.Parameters['Opacity']);
var activePlugin = Boolean(SeeThrough.Parameters['Enable']);

if (!activePlugin) {
    return ;
}

SeeThrough.changePriority = function(player, opacity, priority) {
    if ($dataMap.events[player._eventId] != undefined) {
        var event = $dataMap.events[player._eventId].note
        if (event.match(/<NoSeeThrough>/i)) { return; }
    }
    player._priorityType = priority;
    player._opacity = opacity;
    priority == 2 ? player.behindSee = true : player.behindSee = false;
};

SeeThrough.removeTransparent = function(target) {
    for (var i = this.transparentCharacters.length - 1; i >= 0; i--) {
        if (this.transparentCharacters[i] === target) {
            this.transparentCharacters.splice(i, 1);
        }
    } 
};

SeeThrough.checkRegion = function(player) {
    if (activePlugin) {
        var regionId = $gameMap.regionId(player.x, player.y);
        var arrayValue;
        if (player._eventId == undefined && player._characterName) {
            arrayValue = player._characterName + player._characterIndex;
        } else if (player._eventId != undefined) {
            arrayValue = $dataMap.events[player._eventId].name;
        } else { return; }
        if (regions.includes(regionId) && !this.transparentCharacters.includes(arrayValue)) {
            this.transparentCharacters.push(arrayValue);
            this.changePriority(player, opacity, 2);
        } else if (!regions.includes(regionId) && this.transparentCharacters.includes(arrayValue)) {
            this.removeTransparent(arrayValue);
            this.changePriority(player, 255, 1);
        }
    }
};


SeeThrough.Game_Follower_update = Game_Follower.prototype.update;
Game_Follower.prototype.update = function() {
    Game_Character.prototype.update.call(this);
    this.setMoveSpeed($gamePlayer.realMoveSpeed());
    this.setBlendMode($gamePlayer.blendMode());
    this.setWalkAnime($gamePlayer.hasWalkAnime());
    if (activePlugin == false) {
        this.setOpacity($gamePlayer.opacity());
    }
    this.setStepAnime($gamePlayer.hasStepAnime());
    this.setDirectionFix($gamePlayer.isDirectionFixed());
    this.setTransparent($gamePlayer.isTransparent());
};


SeeThrough.Game_CharacterBase_isNormalPriority = Game_CharacterBase.prototype.isNormalPriority;
Game_CharacterBase.prototype.isNormalPriority = function() {
    if (activePlugin == true) {
        return this._priorityType === 1;
    } else { return this._priorityType === 1; }
};

SeeThrough.Game_CharacterBase_isMoving = Game_CharacterBase.prototype.isMoving;
Game_CharacterBase.prototype.isMoving = function() {
    if (activePlugin == true) { SeeThrough.checkRegion(this); }
    return this._realX !== this._x || this._realY !== this._y;
};

SeeThrough.Game_CharacterBase_isCollidedWithCharacters = Game_CharacterBase.prototype.isCollidedWithCharacters;
Game_CharacterBase.prototype.isCollidedWithCharacters = function(x, y) {
    var events = $gameMap.eventsXyNt(x, y);
    return events.some(function(event) {
        return event.isNormalPriority() || event.behindSee;
    });
};

SeeThrough.Game_Player_istartMapEvent = Game_Player.prototype.startMapEvent;
Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
    if (!$gameMap.isEventRunning()) {
        $gameMap.eventsXy(x, y).forEach(function(event) {
            if ((event.isTriggerIn(triggers) && event.isNormalPriority() === normal) || (event.isTriggerIn(triggers) && event.behindSee)) {
                event.start();
            }
        });
    }
};

SeeThrough.Game_Map_setup = Game_Map.prototype.setup;
Game_Map.prototype.setup = function(mapId) {
    if (!$dataMap) {
        throw new Error('The map data is not available');
    }
    this._mapId = mapId;
    this._tilesetId = $dataMap.tilesetId;
    this._displayX = 0;
    this._displayY = 0;
    this.refereshVehicles();
    this.setupEvents();
    this.setupScroll();
    this.setupParallax();
    this.setupBattleback();
    this._needsRefresh = false;
    SeeThrough.clearAll();
};

SeeThrough.clearAll = function() {
    this.transparentCharacters.forEach(element => {
        $gamePlayer._followers._data.forEach(el => el._priorityType = 1);
        $gamePlayer._followers._data.forEach(el => el._opacity = 255);
        this.changePriority($gamePlayer, 255, 1);
        for (let i = 0; i < $dataMap.events.length; i++) {
            if ($dataMap.events[i]) {
                this.removeTransparent($dataMap.events[i].name);
                this.changePriority($dataMap.events[i], 255, 1);
            }
        }
    });
    this.transparentCharacters = [];
};



SeeThrough.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    SeeThrough.Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'SeeThrough') {
		switch (args[0]) {
			case 'ON':
				activePlugin = true;
				break;
			case 'OFF':
                activePlugin = false;
                SeeThrough.clearAll();
                break;
            case 'Clear':
                SeeThrough.clearAll();
                break;
		}
	}
};


})();

//=============================================================================
// End of File
//=============================================================================