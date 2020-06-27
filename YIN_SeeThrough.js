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

SeeThrough.changePriority = function(player, opacity, priority, followers) {
    if (followers == false && $dataMap.events[player._eventId]) {
        var event = $dataMap.events[player._eventId].note
        if (event.match(/<NoSeeThrough>/i)) { return; }
    }
    if (followers == true) { player._followers._data.forEach(el => el._priorityType = priority); }
    player.setPriorityType(priority)
    player.setOpacity(opacity);
};

SeeThrough.removeTransparent = function(target) {
    for (var i = this.transparentCharacters.length - 1; i >= 0; i--) {
        if (this.transparentCharacters[i] === target) {
            this.transparentCharacters.splice(i, 1);
        }
    }
}

SeeThrough.checkRegion = function(player, followers) {
    var regionId = $gameMap.regionId(player.x, player.y);
    var arrayValue;
    followers == true ? arrayValue = 'Hero' : arrayValue = $dataMap.events[player._eventId];
    if (regions.includes(regionId)) {
        this.transparentCharacters.push(arrayValue);
        this.changePriority(player, opacity, 3, followers);
    } else if (this.transparentCharacters.includes(arrayValue)) {
        this.removeTransparent(arrayValue);
        this.changePriority(player, 255, 1, followers);
    }
}

Game_Player.prototype.executeMove = function(direction) {
    this.moveStraight(direction);
    SeeThrough.checkRegion(this, true);
};

Game_Event.prototype.isMoving = function() {
    SeeThrough.checkRegion(this, false);
    return this._realX !== this._x || this._realY !== this._y;
};

})();

//=============================================================================
// End of File
//=============================================================================