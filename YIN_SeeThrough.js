//=============================================================================
// Yedine Plugins - See Through
// YIN_SeeThrough.js
//=============================================================================

var Imported = Imported || {};
Imported.YIN_SeeThrough = true;
var SeeThrough = SeeThrough || {};

//=============================================================================
 /*:
 * @plugindesc v1.05.3 Make it, so whenever a character step on a certain
 * Region ID's, you will be able to look through the element and see him
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
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * This plugin can be used to make NPC, events, player, follower, visible (in
 * transparent) when going behind a certain region ID defined in the parameters.
 * You can use it so the events/player/followers will still be visible when going
 * behind a tree, a house, a boulder, etc...
 * So no need to play `hide and seek` with the events anymore ! :)
 * 
 * ============================================================================
 * Instructions - Setting Up the Region ID
 * ============================================================================
 * 
 * First off, you need to specify the regions where this effect will be
 * used. You can choose one or multiple regions id ! This way, you could use
 * multiple effects for a certain region ID (specified by other plugins, or
 * events).
 * 
 * ============================================================================
 * Instructions - Setting Up the Opacity
 * ============================================================================
 * 
 * The opacity of the character when going in the specified region ID. Default
 * value is 155.
 * 
 * ============================================================================
 * Instructions - Event notetag
 * ============================================================================
 * 
 *      <NoSeeThrough>
 *          in case you don't want to apply the effect of this plugin on a
 *          particular event.
 * 
 * ============================================================================
 * Instructions - Plugin command
 * ============================================================================
 * 
 *      SeeThrough TRUE/FALSE
 *          turn the plugin ON or OFF
 * 
 *      SeeThrough Clear
 *          keeps the availability of the plugin, but clear all its effects
 *          (transparent characters won't be transparent anymore)
 * 
 *      SeeThrough Player TRUE/FALSE
 *          turns the plugin ON or OFF for the player
 * 
 *      SeeThrough Event ID TRUE/FALSE
 *          turns the plugin ON or OFF for an event with a particular ID
 * 
 *      SeeThrough Follower ID TRUE/FALSE
 *          turns the plugin ON or OFF for the follower with the specified ID
 * 
 * Note for the commands below: You can use "DEFAULT" to restore the default
 * opacity (the one you assigned in the plugin parameters)
 * 
 *      SeeThrough Opacity VALUE
 *          change the Opacity parameter by a choosen value between 1 and 255
 * 
 *          ex: SeeThrough Opacity 100
 * 
 *      SeeThrough Player Opacity VALUE
 *          change the Opacity parameter for the player by a choosen value
 *          between 1 and 255
 * 
 *          ex: SeeThrough Player Opacity 100
 * 
 *      SeeThrough Event/Follower ID Opacity VALUE
 *          change the Opacity parameter for a follower or an event by a choosen
 *          value between 1 and 255
 * 
 *          ex:     SeeThrough Event 7 Opacity 100
 *                  SeeThrough Follower 1 Opacity 100
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
SeeThrough.effectOnPlayer = true;
SeeThrough.notUseOnFollowers = [];
SeeThrough.notUseOnEvents = [];

var regions = JSON.parse(SeeThrough.Parameters['Regions ID']);
for (let i = 0; i < regions.length; i++) {
    regions[i] = Number(regions[i]);
}
var opacity = Number(SeeThrough.Parameters['Opacity']);
var activePlugin = JSON.parse(SeeThrough.Parameters['Enable']);

//=============================================================================
// SeeThrough methods
//=============================================================================

//=========================================================
// * Changes the priority of an object
//=========================================================
SeeThrough.changePriority = function(player, opacity, priority, repeat = false) {
    if (player._newOpacity == undefined && repeat == false) {
        player._newOpacity = opacity;
    }
    if ($dataMap.events[player._eventId] != undefined) {
        var event = $dataMap.events[player._eventId].note
        if (event.match(/<NoSeeThrough>/i)) { return; }
    }
    switch (priority) {
        case 2:
            player.behindSee = true;
            !repeat ? player._previousOpacity = player._opacity : "";
            player._newOpacity ? player._opacity = player._newOpacity : player._opacity = opacity;
            break;
        case 1:
            player.behindSee = false;
            player._previousOpacity ? player._opacity = player._previousOpacity : player._opacity = 255;
            break;
        default:
            break;
    }
    player._priorityType = priority;
};

//=========================================================
// * Remove an object from the transparent array
//=========================================================
SeeThrough.removeTransparent = function(target) {
    for (var i = this.transparentCharacters.length - 1; i >= 0; i--) {
        if (this.transparentCharacters[i] === target) {
            this.transparentCharacters.splice(i, 1);
        }
    } 
};

//=========================================================
// * Check the region to make the object transparent or not
//=========================================================
SeeThrough.checkRegion = function(player, repeat = false) {
    if (!activePlugin) { return; }
    var arrayValue;
    if (player._eventId == undefined && player._characterName) {
        if ((player._followers && !this.effectOnPlayer)
        || (!player._followers && this.notUseOnFollowers.includes(parseInt(player._memberIndex) - 1)))
        {
            return this.changePriority(player, player._previousOpacity, 1);
        }
        arrayValue = player._characterName + player._characterIndex;
    } else if (player._eventId != undefined) {
        if (this.notUseOnEvents.includes(player._eventId)) {
            return this.changePriority(player, player._previousOpacity, 1);
        }
        if ($gameMap.event(player._eventId)) {
            arrayValue = $gameMap.event(player._eventId)._eventId;
            player = $gameMap.event(player._eventId);
        }
    } else { return; }
    var regionId = $gameMap.regionId(player.x, player.y);
    if (regions.includes(regionId) && (!this.transparentCharacters.includes(arrayValue) || repeat == true)) {
        this.transparentCharacters.push(arrayValue);
        this.changePriority(player, opacity, 2, repeat, false);
    } else if (!regions.includes(regionId) && this.transparentCharacters.includes(arrayValue)) {
        this.removeTransparent(arrayValue);
        this.changePriority(player, player._previousOpacity, 1);
    }
};


//=========================================================
// * Clear all the effects of the transparency
//=========================================================
SeeThrough.clearAll = function() {
    this.notUseOnFollowers = [];
    this.notUseOnEvents = [];
    this.transparentCharacters.forEach(element => {
        $gamePlayer._followers._data.forEach(el => {
            el._newOpacity = opacity;
            el._priorityType = 1;
            el._previousOpacity ? el._opacity = el._previousOpacity : el._opacity = 255;
        });
        for (let i = 0; i < $dataMap.events.length; i++) {
            if ($dataMap.events[i] && !this.notUseOnEvents.includes(i)) {
                $gameMap.event(i)._newOpacity = opacity;
                $gameMap.event(i)._previousOpacity ? $gameMap.event(i)._opacity = $gameMap.event(i)._previousOpacity : $gameMap.event(i)._opacity = 255;
                $gameMap.event(i)._priorityType = 1;
            }
        }
    });
    $gamePlayer._newOpacity = opacity;
    $gamePlayer._priorityType = 1;
    $gamePlayer._previousOpacity ? $gamePlayer._opacity = $gamePlayer._previousOpacity : $gamePlayer._opacity = 255;
    this.transparentCharacters = [];
};

//=============================================================================
// Change of the native methods
//=============================================================================

//=============================================================================
// * Game_CharacterBase
//=============================================================================

SeeThrough.Game_CharacterBase_isNormalPriority = Game_CharacterBase.prototype.isNormalPriority;
Game_CharacterBase.prototype.isNormalPriority = function() {
    if (activePlugin == true) {
        return this._priorityType === 1;
    } else { return this._priorityType === 1; }
};

SeeThrough.Game_CharacterBase_isMoving = Game_CharacterBase.prototype.isMoving;
Game_CharacterBase.prototype.isMoving = function() {
    if (activePlugin == true) { SeeThrough.checkRegion(this, false); }
    return this._realX !== this._x || this._realY !== this._y;
};

SeeThrough.Game_CharacterBase_isCollidedWithCharacters = Game_CharacterBase.prototype.isCollidedWithCharacters;
Game_CharacterBase.prototype.isCollidedWithCharacters = function(x, y) {
    var events = $gameMap.eventsXyNt(x, y);
    return events.some(function(event) {
        return event.isNormalPriority() || event.behindSee;
    });
};


//=============================================================================
// * Game_Follower
//=============================================================================

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


//=============================================================================
// * Game_Player
//=============================================================================

SeeThrough.Game_Player_startMapEvent = Game_Player.prototype.startMapEvent;
Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
    /* SeeThrough.Game_Player_startMapEvent.call(this, x, y, triggers, normal); */
    if (!$gameMap.isEventRunning()) {
        $gameMap.eventsXy(x, y).forEach(function(event) {
            if (event.isTriggerIn(triggers) && (event.isNormalPriority() === normal || event.behindSee)) {
                event.start();
            }
        });
    }
};


//=============================================================================
// * Game_Map
//=============================================================================

SeeThrough.Game_Map_setup = Game_Map.prototype.setup;
Game_Map.prototype.setup = function(mapId) {
    SeeThrough.Game_Map_setup.call(this, mapId);
    SeeThrough.clearAll();
};


//=============================================================================
// Plugin Command
//=============================================================================

SeeThrough.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    SeeThrough.Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'SeeThrough') {
        var followers   = $gamePlayer._followers._data;
        var argsZero;
        var argsOne;
        var argsTwo;
        args[0] ? argsZero  = args[0].toLowerCase() : '';
        args[1] ? argsOne   = args[1].toLowerCase() : '';
        args[2] ? argsTwo   = args[2].toLowerCase() : '';
	    switch (argsZero) {
            case 'true': case 'false': case 'clear':
                argsZero != 'clear' ? activePlugin = JSON.parse(argsZero) : '';
                if (argsZero == 'true') {
                    followers.forEach(el => {
                        SeeThrough.checkRegion(el);
                    });
                    for (let i = 0; i < $dataMap.events.length; i++) {
                        if ($gameMap.event(i))
                            SeeThrough.checkRegion($gameMap.event(i));
                    }
                    SeeThrough.checkRegion($gamePlayer);
                } else { SeeThrough.clearAll(); }
                break;
            case 'player':
                if (argsOne == 'true' || argsOne == 'false') {
                    SeeThrough.effectOnPlayer = JSON.parse(argsOne);
                    argsOne == 'false' ? SeeThrough.removeTransparent($gamePlayer._characterName + $gamePlayer._characterIndex) : '';
                } else if (argsOne == 'opacity') {
                    args[2] == 'DEFAULT' ? $gamePlayer._newOpacity = Number(SeeThrough.Parameters['Opacity']) : '';
                    if (Number(args[2])) {
                        $gamePlayer._newOpacity = Number(args[2]);
                        SeeThrough.checkRegion($gamePlayer, true);
                    }
                }
                break;
            case 'event':
                let idEvent;
                argsOne == 'all' ? idEvent = argsOne : idEvent = parseInt(args[1]);
                if (idEvent != 'all' && !$gameMap.event(idEvent)) {
                    return ;
                }
                switch (argsTwo) {
                    case 'true':
                        if (idEvent != 'all') {
                            for (var i = SeeThrough.notUseOnEvents.length - 1; i >= 0; i--) {
                                if (SeeThrough.notUseOnEvents[i] === idEvent) {
                                    SeeThrough.notUseOnEvents.splice(i, 1);
                                }
                            }
                            SeeThrough.checkRegion($gameMap.event(idEvent), true);
                        } else {    
                            SeeThrough.notUseOnEvents = [];
                            for (let j = 0; j < $dataMap.events.length; j++) {
                                if ($gameMap.event(j)) {
                                    SeeThrough.checkRegion($gameMap.event(j), true);
                                }
                            }
                        }
                        break;
                    case 'false':
                        if (idEvent != 'all' && $dataMap.events[idEvent]) {
                            SeeThrough.notUseOnEvents.push(idEvent);
                            SeeThrough.removeTransparent($dataMap.events[idEvent].name);
                        } else if (idEvent == 'all') {
                            for (let z = 0; z < $dataMap.events.length; z++) {
                                if ($gameMap.event(z)) {
                                    SeeThrough.notUseOnEvents.push(z);
                                    SeeThrough.removeTransparent($dataMap.events[z].name);
                                }
                            }
                        }
                        break;
                    case 'opacity':
                        if (args[3] == 'DEFAULT') {
                            $gameMap.event(idEvent)._newOpacity = Number(SeeThrough.Parameters['Opacity']);
                        } else if (Number(args[3])) {
                            $gameMap.event(idEvent)._newOpacity = Number(args[3]);
                        }
                        SeeThrough.checkRegion($gameMap.event(idEvent), true);
                        break;
                    default:
                        break;
                }
                break;
            case 'follower':
                let idFollower = parseInt(argsOne);
                if (!followers[idFollower]) { return ; }
                switch (argsTwo) {
                    case 'true':
                        for (var i = SeeThrough.notUseOnFollowers.length - 1; i >= 0; i--) {
                            if (SeeThrough.notUseOnFollowers[i] === idFollower) {
                                SeeThrough.notUseOnFollowers.splice(i, 1);
                                SeeThrough.checkRegion(followers[idFollower], true);
                            }
                        }
                        break;
                    case 'false':
                        SeeThrough.notUseOnFollowers.push(idFollower);
                        SeeThrough.removeTransparent(followers[idFollower]._characterName + followers[idFollower]._characterIndex);
                        break;
                    case 'opacity':
                        if (args[3] == 'DEFAULT') {
                            followers[idFollower]._newOpacity = Number(SeeThrough.Parameters['Opacity']);
                        } else if (Number(args[3])) {
                            followers[idFollower]._newOpacity = Number(args[3]);
                            SeeThrough.checkRegion(followers[idFollower], true)
                        }
                        break;
                    default:
                        break;
                }
                break;
            case 'Opacity':
                argsOne == 'default' ? opacity = Number(SeeThrough.Parameters['Opacity']) : opacity = Number(argsOne);
                break;
            default:
                break;
	    }
	}
};
})();