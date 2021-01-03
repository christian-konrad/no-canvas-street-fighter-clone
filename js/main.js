var gameViewport = $('#viewport');
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var fps = 30;
var cps = 50;
var spriteTime = 4; // default frames per sprite
var fpsView = $('#fps-view');
var cpsView = $('#cps-view');
var viewportWidth = gameViewport.width();

function drawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    //rasterizeHTML.drawHTML(gameViewport.html(), canvas);
    rasterizeHTML.drawDocument(document, canvas, {
        width: 1384,
        height: 1224
    });
}

function enableDebug() {
    Log.enableDebug();
    $('.character').css('border', '1px solid blue');
    $('#viewport').css('overflow', 'scroll');
}

var Log = {
    levels: {
        INFO: 'INFO',
        ERROR: 'ERROR',
        WARNING: 'WARNING',
        DEBUG: 'DEBUG'
    },
    debugEnabled: false,
    enableDebug: function(enabled) {
        if (enabled == null) {
            enabled = true;
        }
        Log.debugEnabled = enabled;
    },
    history: [],
    print: function(level, message, tag, character) {
        var logEntry = {
            message: message,
            tag: tag,
            character: character,
            level: level,
            time: Date.now()
        };
        if (!level) {
            level = Log.levels.INFO;
        }
        var logText = level + ' - ' + logEntry.time + ': ';
        if (character) {
            logText += '[Player ' + character.playerId + '] ';
        }
        if (tag) {
            logText += '[' + tag + '] ';
        }
        logText += message;
        console.log(logText);
    },
    info: function(message, tag, character) {
        Log.print(Log.levels.INFO, message, tag, character);
    },
    error: function(message, tag, character) {
        Log.print(Log.levels.ERROR, message, tag, character);
    },
    warning: function(message, tag, character) {
        Log.print(Log.levels.WARNING, message, tag, character);
    },
    debug: function(message, tag, character) {
        if (Log.debugEnabled) {
            Log.print(Log.levels.DEBUG, message, tag, character);
        }
    }
};

function Movements(character) {
    var character = character;
    var self = this;
    this.moveLeft = {
        active: false,
        enabled: true,
        start: function() {
            if (self.isAllowed(this)) {
                Log.info('Starting move left', 'Movement', character);
                this.active = true;
                self.cancelMovementsToStop(this, character);
            }
        },
        stop: function() {
            if (this.active) {
                Log.info('Starting move left', 'Movement', character);
                this.active = false;
            }
        },
        movementsToStop: ['block', 'crouch']
    };
    this.moveRight = {
        active: false,
        enabled: true,
        start: function() {
            if (self.isAllowed(this)) {
                Log.info('Starting move right', 'Movement', character);
                this.active = true;
                self.cancelMovementsToStop(this);
            }
        },
        stop: function() {
            if (this.active) {
                Log.info('Stopping move right', 'Movement', character);
                this.active = false;
            }
        },
        movementsToStop: ['block', 'crouch']
    };
    this.crouch = {
        active: false,
        enabled: true,
        start: function() {
            if (self.isAllowed(this)) {
                Log.info('Starting crouch', 'Movement', character);
                this.active = true;
                self.cancelMovementsToStop(this);
            }
        },
        stop: function() {
            if (this.active) {
                Log.info('Stopping crouch', 'Movement', character);
                this.active = false;
            }
        },
        blockingMovements: ['jump']
    };
    this.block = {
        active: false,
        enabled: true,
        start: function() {
            if (self.isAllowed(this)) {
                Log.info('Starting block', 'Movement', character);
                this.active = true;
                self.cancelMovementsToStop(this);
            }
        },
        stop: function() {
            if (this.active) {
                Log.info('Stopping block', 'Movement', character);
                this.active = false;
            }
        },
        blockingMovements: ['jump']
    };
    this.jump = {
        active: false,
        enabled: true,
        start: function() {
            if (self.isAllowed(this)) {
                Log.info('Starting jump', 'Movement', character);
                this.active = true;
                self.cancelMovementsToStop(this);
            }
        },
        stop: function() {
            if (this.active) {
                Log.info('Stopping jump', 'Movement', character);
                this.active = false;
            }
        },
        movementsToStop: ['block', 'crouch']
    };
    this.punch = {
        active: false,
        enabled: true,
        start: function() {
            if (self.isAllowed(this)) {
                Log.info('Starting punch', 'Movement', character);
                this.active = true;
                self.cancelMovementsToStop(this);
            }
        },
        stop: function() {
            if (this.active) {
                Log.info('Stopping punch', 'Movement', character);
                this.active = false;
            }
        },
        movementsToStop: ['block']
    };
    this.anyBlockingMovementActive = function(movement) {
        var blockingMovementActive = false;
        if (movement.blockingMovements && movement.blockingMovements.length) {
            $.each(movement.blockingMovements, function(index, movementName) {
                if (self[movementName].active) {
                    blockingMovementActive = true;
                }
            });
        }
        return blockingMovementActive;
    };
    this.cancelMovementsToStop = function(movement) {
        if (movement.movementsToStop && movement.movementsToStop.length) {
            $.each(movement.movementsToStop, function(index, movementName) {
                self[movementName].stop();
            });
        }
    };
    this.isAllowed = function(movement) {
        return movement.enabled && !self.anyBlockingMovementActive(movement) && !movement.active;
    }
}

var Sounds = {
    round: {
        source: 'sound/round.wav',
        audio: null,
        load: function() {
            if (!this.audio) {
                this.audio = new Howl({
                    src: [this.source]
                });
            }
        },
        duration: 1000,
        play: function(callback) {
            this.load();
            if (this.audio.playing()) this.audio.stop();
            this.audio.play();
            if (typeof callback === 'function') {
                this.audio.on('end', callback);
            }
        }
    },
    one: {
        source: 'sound/one.wav',
        audio: null,
        load: function() {
            if (!this.audio) {
                this.audio = new Howl({
                    src: [this.source]
                });
            }
        },
        duration: 1000,
        play: function(callback) {
            this.load();
            if (this.audio.playing()) this.audio.stop();
            this.audio.play();
            if (typeof callback === 'function') {
                var that = this;
                setTimeout(callback, that.duration);
            }
        }
    },
    fight: {
        source: 'sound/fight.wav',
        audio: null,
        load: function() {
            if (!this.audio) {
                this.audio = new Howl({
                    src: [this.source]
                });
            }
        },
        duration: 1000,
        play: function(callback) {
            this.load();
            if (this.audio.playing()) this.audio.stop();
            this.audio.play();
            if (typeof callback === 'function') {
                this.audio.on('end', callback);
            }
        }
    },
    you: {
        source: 'sound/you.wav',
        audio: null,
        load: function() {
            if (!this.audio) {
                this.audio = new Howl({
                    src: [this.source]
                });
            }
        },
        duration: 1000,
        play: function(callback) {
            this.load();
            if (this.audio.playing()) this.audio.stop();
            this.audio.play();
            if (typeof callback === 'function') {
                var that = this;
                setTimeout(callback, that.duration);
            }
        }
    },
    lose: {
        source: 'sound/lose.wav',
        audio: null,
        load: function() {
            if (!this.audio) {
                this.audio = new Howl({
                    src: [this.source]
                });
            }
        },
        duration: 1000,
        play: function(callback) {
            this.load();
            if (this.audio.playing()) this.audio.stop();
            this.audio.play();
            if (typeof callback === 'function') {
                var that = this;
                setTimeout(callback, that.duration);
            }
        }
    },
    win: {
        source: 'sound/win.wav',
        audio: null,
        load: function() {
            if (!this.audio) {
                this.audio = new Howl({
                    src: [this.source]
                });
            }
        },ion: 1000,
        play: function(callback) {
            this.load();
            if (this.audio.playing()) this.audio.stop();
            this.audio.play();
            if (typeof callback === 'function') {
                var that = this;
                setTimeout(callback, that.duration);
            }
        }
    },
    jump: {
        source: 'sound/miss.wav',
        audio: null,
        load: function() {
            if (!this.audio) {
                this.audio = new Howl({
                    src: [this.source]
                });
            }
        },
        play: function(callback) {
            this.load();
            if (this.audio.playing()) this.audio.stop();
            this.audio.play();
            if (typeof callback === 'function') {
                var that = this;
                setTimeout(callback, that.duration);
            }
        }
    },
    miss: {
        source: 'sound/miss.wav',
        audio: null,
        load: function() {
            if (!this.audio) {
                this.audio = new Howl({
                    src: [this.source]
                });
            }
        },
        play: function(callback) {
            this.load();
            if (this.audio.playing()) this.audio.stop();
            this.audio.play();
            if (typeof callback === 'function') {
                var that = this;
                setTimeout(callback, that.duration);
            }
        }
    },
    punch: {
        source: 'sound/punch.wav',
        audio: null,
        load: function() {
            if (!this.audio) {
                this.audio = new Howl({
                    src: [this.source]
                });
            }
        },
        play: function(callback) {
            this.load();
            if (this.audio.playing()) this.audio.stop();
            this.audio.play();
            if (typeof callback === 'function') {
                var that = this;
                setTimeout(callback, that.duration);
            }
        }
    },
    break: {
        source: 'sound/break.wav',
        audio: null,
        load: function() {
            if (!this.audio) {
                this.audio = new Howl({
                    src: [this.source]
                });
            }
        },
        play: function(callback) {
            this.load();
            this.audio.pause();
            this.audio.play();
            if (typeof callback === 'function') {
                var that = this;
                setTimeout(callback, that.duration);
            }
        }
    },
    init: function() {
        $.each(Sounds, function(key, sound) {
            if (typeof sound.load === 'function') {
                sound.load();
            }
        });
    }
};

function initOnScreenButtons() {
    $('#button-punch').off('touchstart').on('touchstart', function() {
        Player.movements.punch.start();
    }).off('touchend').on('touchend', function() {
        Player.movements.punch.stop();
    });
    $('#button-block').off('touchstart').on('touchstart', function() {
        Player.movements.block.start();
    }).off('touchend').on('touchend', function() {
        Player.movements.block.stop();
    });
    $('#button-jump').off('touchstart').on('touchstart', function() {
        Player.movements.jump.start();
    }).off('touchend').on('touchend', function() {
        Player.movements.jump.stop();
    });
    $('#button-right').off('touchstart').on('touchstart', function() {
        Player.movements.moveRight.start();
    }).off('touchend').on('touchend', function() {
        Player.movements.moveRight.stop();
    });
    $('#button-left').off('touchstart').on('touchstart', function() {
        Player.movements.moveLeft.start();
    }).off('touchend').on('touchend', function() {
        Player.movements.moveLeft.stop();
    });
    $('#button-bottom').off('touchstart').on('touchstart', function() {
        Player.movements.crouch.start();
    }).off('touchend').on('touchend', function() {
        Player.movements.crouch.stop();
    });
    $('#button-top').off('touchstart').on('touchstart', function() {
        Player.movements.jump.start();
    }).off('touchend').on('touchend', function() {
        Player.movements.jump.stop();
    });
    $('#button-autoplay').off('touchstart').on('touchstart', function() {
        Player.ai.active = !Player.ai.active;
        $('#autoplay-indicator').attr('data-active', Player.ai.active);
        Player.movements.punch.stop();
        Player.movements.block.stop();
        Player.movements.jump.stop();
        Player.movements.crouch.stop();
        Player.movements.moveLeft.stop();
        Player.movements.moveRight.stop();
    });
}

function initKeyboard() {
    $('*').off('keydown').on('keydown', function(e) {
        if (!e.keyCode === 123) {
            e.preventDefault();
        }
        switch (e.keyCode) {
            case 39:
            case 68:
                Player.movements.moveRight.start();
                break;
            case 37:
            case 65:
                Player.movements.moveLeft.start();
                break;
            case 40:
            case 83:
                Player.movements.crouch.start();
                break;
            case 75: // K
            case 17: // Shift
                Player.movements.block.start();
                break;
            case 76: // L
            case 32: // Space
            case 13: // Enter
                Player.movements.punch.start();
                break;
            case 38:
            case 87:
                Player.movements.jump.start();
                break;
            default:
                // nothing
        }
    }).off('keyup').on('keyup', function(e) {
        if (!e.keyCode === 123) {
            e.preventDefault();
        }
        switch (e.keyCode) {
            case 39:
            case 68:
                Player.movements.moveRight.stop();
                break;
            case 37:
            case 65:
                Player.movements.moveLeft.stop();
                break;
            case 40:
            case 83:
                Player.movements.crouch.stop();
                break;
            case 75:
            case 17:
                Player.movements.block.stop();
                break;
            case 76: // L
            case 32: // Space
            case 13: // Enter
                Player.movements.punch.stop();
                break;
            case 38:
            case 87:
                Player.movements.jump.stop();
                break;
            default:
                // nothing
        }
    });
}

var AI = {
    modes: {
        DEFENSIVE: 0,
        BALANCED: 1,
        OFFENSIVE: 2,
        AGGRESSIVE: 3
    }
};

var Stage = {
    id: 'stage_1',
    size: {
        width: 632,
        height: 250
    },
    floorObject: $('#stage-floor'),
    floorDecorationObject: $('#stage-floor-decoration'),
    floorDecorationObject2: $('#stage-floor-decoration-2'),
    backgroundObject: $('#stage-background'),
    backgroundDecorationObject: $('#stage-background-decoration'),
    backgroundDistance: 1.6,
    gravity: 0.5,
    friction: 1.2,
    airFriction: 1.3,
    music: 'music/ryu.mp3',
    maxTime: 80,
    time: null
};

var Player = {
    object: null,
    movements: null,
    name: 'Ryu',
    playerId: 1,
    moves: [],
    position: {
        x: 40,
        y: 0
    },
    facing: 'right',
    velocity: {
        x: 0,
        y: 0
    },
    acceleration: {
        x: 0,
        y: 0
    },
    maxAcceleration: 10,
    crouching: false,
    blocking: false,
    jumping: false,
    startJumping: false,
    jumpForce: 0,
    punchTriggered: false,
    startPunching: false,
    punchForce: 17,
    punching: false,
    ai: {
        mode: 'aggressive',
        active: false
    },
    stats: {
        punch: 9,
        kick: 11,
        block: 10,
        defense: 10,
        hardPunch: 12
    },
    health: 100,
    isHit: 0,
    init: function() {
        this.object = $('#player');
        this.health = 100;
        this.movements = new Movements(this);
        this.position.x = Stage.size.width / 2 - viewportWidth / 2 + 100;
    }
};

var Opponent = {
    object: null,
    movements: null,
    name: 'Rya',
    playerId: 2,
    moves: [],
    position: {
        x: 290,
        y: 0
    },
    facing: 'left',
    velocity: {
        x: 0,
        y: 0
    },
    acceleration: {
        x: 0,
        y: 0
    },
    maxAcceleration: 10,
    crouching: false,
    blocking: false,
    jumping: false,
    startJumping: false,
    jumpForce: 0,
    punchTriggered: false,
    startPunching: false,
    punchForce: 5,
    punching: false,
    ai: {
        mode: 'aggressive',
        active: true
    },
    stats: {
        punch: 18,
        kick: 22,
        block: 6,
        defense: 8,
        hardPunch: 11
    },
    health: 100,
    isHit: 0,
    init: function() {
        this.object = $('#opponent');
        this.health = 100;
        this.movements = new Movements(this);
        this.position.x = Stage.size.width / 2 + viewportWidth / 2 - 100;
    }
};

function initCharacters() {
    Player.init();
    Opponent.init();
}

function initStage() {
    $('#game-layer').attr('data-stage', Stage.id);
    $('#game-layer').css('width', Stage.size.width);
    $('#game-layer').css('left', -1 * (Stage.size.width / 2 - viewportWidth / 2));
}

var backgroundMusic = null;
function initMusic() {
    if (!backgroundMusic) {
        backgroundMusic = new Howl({
            src: [Stage.music],
            loop: true
        });
        backgroundMusic.play();
    }
};

function initStatus() {
    $('#player-name').text(Player.name);
    $('#opponent-name').text(Opponent.name);
    $('#player-health').attr('data-health', Player.health)
        .find('.health-bar').css('width', Player.health + '%');
    $('#opponent-health').attr('data-health', Opponent.health)
        .find('.health-bar').css('width', Opponent.health + '%');
    Stage.time = Stage.maxTime;
    $('#round-time').text(Stage.time);
    $('#match-alert').text('Round 1').show();
    Sounds.round.play(function() {
        Sounds.one.play(function() {
            $('#match-alert').text('Fight').show();
            Sounds.fight.play(function() {
                $('#match-alert').text('').hide();
                Stage.timeInterval = setInterval(function() {
                    Stage.time--;
                    $('#round-time').text(Stage.time);
                    if (Stage.time <= 0) {
                        finishMatch();
                    }
                }, 1000);
            });
        });
    });
}

var Animation = {
    idle: {
        sprites: 4
    },
    crouch: {
        sprites: 1
    },
    'crouch-block': {
        sprites: 1
    },
    block: {
        sprites: 1
    },
    'start-jump': {
        sprites: 3
    },
    'stop-jump': {
        sprites: 3
    },
    jump: {
        sprites: 1
    },
    punch: {
        sprites: 5
    },
    move: {
        sprites: 5
    }
};

var rendering = false;
var renderingStart = performance.now();
var spriteIndex = 0;
var spriteTimeout = 0;

function renderCharacter(character) {
    if (character.crouching && character.blocking) {
        pose = 'crouch-block';
    } else if (character.startJumping) {
        pose = 'start-jump';
    } else if (character.stopJumping) {
        pose = 'stop-jump';
    } else if (character.jumping) {
        pose = 'jump';
    } else if (character.falling) {
        pose = 'jump';
    } else if (character.punching) {
        pose = 'punch';
    } else if (character.moving) {
        pose = 'move';
    } else if (character.crouching) {
        pose = 'crouch';
    } else if (character.blocking) {
        pose = 'block';
    } else {
        pose = 'idle';
    }
    character.object.attr('data-pose', pose);
    character.object.attr('data-facing', character.facing);
    character.object.attr('data-hit', character.isHit > 0);
    character.object.css('left', character.position.x);
    character.object.css('bottom', character.position.y);

    if (spriteTimeout === spriteTime) {
        spriteTimeout = 0;
        spriteIndex = (spriteIndex + 1) % Animation[pose].sprites;
    }
    character.object.attr('data-sprite-index', spriteIndex);
}

function renderStatus() {
    $('#player-health').attr('data-health', Player.health)
        .find('.health-bar').css('width', Player.health + '%');
    $('#opponent-health').attr('data-health', Opponent.health)
        .find('.health-bar').css('width', Opponent.health + '%');
}

var Camera = {
    object: $('#game-layer'),
    position: { // origin is center
        x: Stage.size.width / 2,
        y: 0
    },
    scale: 1,
    viewport: {
        width: gameViewport.width(),
        height: gameViewport.height(),
        left: null,
        right: null,
        top: '',
        bottom: ''
    },
    update: function(x, y, scale) {
        if (scale != null) {
            this.scale = scale;
        }
        if (x != null && y != null) {
            this.position.x = x;
            this.position.y = y;
            if (this.position.x < this.viewport.width / 2) this.position.x = this.viewport.width / 2;
            if (this.position.x > Stage.size.width - this.viewport.width / 2) this.position.x = Stage.size.width - this.viewport.width / 2;
            if (this.position.y < 0) this.position.y = 0;
            Log.info('Camera update ' + this.position.x + ':' + this.position.y, 'Camera');
        }
        this.viewport.left = this.position.x - this.viewport.width / 2;
        this.viewport.right = this.position.x + this.viewport.width / 2;
    }
};

function renderCamera() {
    var positionX = -1 * (Camera.position.x - Camera.viewport.width / 2);
    var positionY = -1 * Camera.position.y;
    var skewRange = 80;

    var skew = (Stage.size.width/2 - Camera.position.x) / (Stage.size.width / 2) * skewRange / Camera.scale;

    Camera.object.css('left', positionX);
    Camera.object.css('bottom', positionY);
    Camera.object.css('transform', 'scale(' + Camera.scale + ')');
    Stage.backgroundObject.css('left', -1 * positionX / Stage.backgroundDistance);
    Stage.backgroundObject.css('margin-top', positionY / Stage.backgroundDistance);
    Stage.backgroundDecorationObject.css('left', -1 * positionX / (Stage.backgroundDistance + 0.8));
    Stage.backgroundDecorationObject.css('margin-bottom', -1 * positionY / (Stage.backgroundDistance + 0.8));
    Stage.floorObject.css('transform', 'skewX(' + skew + 'deg)');
}

function render() {
    if (!rendering) {
        rendering = true;
        var timeStamp = performance.now();
        fpsView.text((1000 / (timeStamp - renderingStart)).toFixed(0));
        renderingStart = timeStamp;

        spriteTimeout++;

        renderCharacter(Player);
        renderCharacter(Opponent);

        renderCamera();

        renderStatus();

        // TODO set health
        // TODO drawCanvas()
        rendering = false;
    } else {
        Log.warning('Skipped render frame');
    }
}


var calculating = false;
var calculationStart = performance.now();

function calculateAI(character) {
    var enemy;
    if (character.playerId === 2) {
        enemy = Player;
    } else {
        enemy = Opponent;
    }

    if (character.ai.wait) {
        character.ai.wait--;
        return;
    }

    if (character.ai.modeChangeTimeout) {
        character.ai.modeChangeTimeout--;
    } else {
        character.ai.mode = Math.floor(Math.random() * Math.floor(Object.keys(AI.modes).length));
        character.ai.modeChangeTimeout = 50;
        Log.info('Changed AI mode to '+ character.ai.mode, 'AI', character);
    }

    var aggressiveness;
    switch (character.ai.mode) {
        case AI.modes.AGGRESSIVE:
            aggressiveness = 0.25;
            break;
        case AI.modes.OFFENSIVE:
            aggressiveness = 0.125;
            break;
        case AI.modes.BALANCED:
            aggressiveness = 0;
            break;
        case AI.modes.DEFENSIVE:
            aggressiveness = -0.25;
            break;
        default:
            aggressiveness = 0;
    }
    var willJump = Math.max(Math.random() + aggressiveness, 0) > 0.2;
    var willJumpOnAttack = Math.max(Math.random() + aggressiveness, 0) > 0.9;
    var willWalkAway = Math.max(Math.random() + aggressiveness, 0) < 0.2;
    var willBlock = Math.max(Math.random() + aggressiveness, 0) < 0.2;
    var willBlockOnAttack = Math.max(Math.random() + aggressiveness, 0) < 0.1;
    var willAttackOnAttack = Math.max(Math.random() + aggressiveness, 0) > 0.9;
    var willAttack = Math.max(Math.random() + aggressiveness, 0) > 0.75;
    var willAttackOnBlock = Math.max(Math.random() + aggressiveness, 0) > 0.95;

    if (character.punchTriggered) {
        character.movements.punch.stop();
    }
    if (enemy.punching || willBlock) {
        if (willBlockOnAttack && !willAttack) {
            character.movements.block.start();
            character.ai.wait = 20;
        } else if (willJumpOnAttack) {
            character.movements.jump.start();
            character.ai.wait = 20;
        }
    } else {
        character.movements.block.stop();
    }
    var offset = character.position.x - enemy.position.x;
    Log.debug(offset, 'Offset');
    character.movements.moveLeft.stop();
    character.movements.moveRight.stop();
    if (Math.abs(offset) < 25) {
        if (offset > 0) {
            character.movements.moveRight.start();
        } else {
            character.movements.moveLeft.start();
        }
    } else if (Math.abs(offset) < 50) {
        if (willWalkAway) {
            if (offset > 0) {
                character.movements.moveRight.start();
            } else {
                character.movements.moveLeft.start();
            }
        } else {
            if (!enemy.blocking || willAttackOnBlock) {
                if (willAttack) {
                    if (!enemy.punching || willAttackOnAttack) {
                        character.movements.punch.start();
                    }
                }
            }
        }
    } else {
        if (Math.abs(offset) > 150) {
            if (willJump) {
                character.movements.jump.start();
            }
        }
        if (offset > 0) {
            if (willWalkAway) {
                character.movements.moveRight.start();
            } else {
                character.movements.moveLeft.start();
            }
        } else {
            if (willWalkAway) {
                character.movements.moveLeft.start();
            } else {
                character.movements.moveRight.start();
            }

        }
    }
}

function calculateMove(character) {
    var moving = false;
    if (character.movements.moveRight.active) {
        Log.debug('Moving right', 'Calculation', character);
        character.acceleration.x++;
        moving = true;
    }
    if (character.movements.moveLeft.active) {
        Log.debug('Moving left', 'Calculation', character);
        character.acceleration.x--;
        moving = true;
    }
    character.moving = moving;
}

function calculateJump(character) {
    if (!character.falling && (character.movements.jump.active || character.jumping || character.startJumping)) {
        if (!character.jumping) {
            if (!character.startJumping) {
                character.startJumping = true;
                Log.debug('Starting jumping', 'Calculation', character);
                //Sounds.jump.play();
            } else if (character.startJumping === 3 * spriteTime) {
                character.startJumping = false;
                character.jumping = true;
                character.acceleration.y += 5 + character.jumpForce;
                //character.acceleration.x * 2;
            } else {
                character.startJumping++;
                if (character.movements.jump.active) {
                    character.jumpForce++;
                }
            }
        }
        if (character.jumping) {
            character.jumpForce = 0;
            character.movements.jump.active = false;
            Log.debug('Jumping', 'Calculation', character);
        }
    } else {
        character.jumpForce = 0;
        character.jumping = false;
    }
}

function calculateCrouch(character) {
    if (character.movements.crouch.active) {
        if (character.jumping || character.falling) {
            character.acceleration.y--;
        } else {
            Log.debug('Crouching', 'Calculation', character);
            character.crouching = true;
        }
    } else {
        character.crouching = false;
    }
}

function calculateBlock(character) {
    if (character.movements.block.active) {
        Log.debug('Blocking', 'Calculation', character);
        character.blocking = true;
    } else {
        character.blocking = false;
    }
}

function calculatePunch(character) {
    if (character.punching > 0) {
        character.punching--;
    } else {
        if (character.movements.punch.active) {
            if (!character.punchTriggered) {
                Log.debug('Punching', 'Calculation', character);
                Sounds.miss.play();
                character.punchTriggered = true;
                character.punching = 4 * spriteTime;
            }
        } else {
            character.punchTriggered = false;
            character.punching = false;
        }
    }
}

function calculateCharacter(character) {
    character.acceleration = {
        x: 0,
        y: 0
    };

    calculateMove(character);
    calculateJump(character);
    calculateCrouch(character);
    calculateBlock(character);
    calculatePunch(character);

    /* Final position calculation */
    if (Math.abs(character.acceleration.x) > character.maxAcceleration) {
        character.acceleration.x = Math.sign(character.acceleration.x) * character.maxAcceleration;
    }
    if (Math.abs(character.acceleration.y) > character.maxAcceleration) {
        character.acceleration.y = Math.sign(character.acceleration.y) * character.maxAcceleration;
    }

    character.velocity.x += character.acceleration.x;
    character.velocity.y += character.acceleration.y;

    character.velocity.y -= Stage.gravity;

    character.position.x += character.velocity.x;
    character.position.y += character.velocity.y;

    if (character.velocity.y < 0) {
        character.jumping = false;
    }

    // player on ground
    if (character.position.y <= 0) {
        character.falling = false;
        character.velocity.y = 0;
        // TODO calculate normal vector if stage is schiefe ebene
        // calculate friction
        character.velocity.x = character.velocity.x / Stage.friction;
    } else if (character.velocity.y < 0) {
        Log.debug('Falling', 'Calculation', character);
        character.falling = true;
    }

    character.velocity.x = character.velocity.x / Stage.airFriction;

    if (character.position.x > Stage.size.width - 20) {
        character.position.x = Stage.size.width - 20;
    }
    if (character.position.x < 20) {
        character.position.x = 20;
    }
    if (character.position.y > Stage.size.height) {
        character.position.y = Stage.size.height;
    }
    if (character.position.y < 0) {
        character.position.y = 0;
    }
}

function calculateFacings() {
    if (Player.position.x > Opponent.position.x) {
        Player.facing = 'left';
    } else {
        Player.facing = 'right';
    }
    if (Opponent.position.x > Player.position.x) {
        Opponent.facing = 'left';
    } else {
        Opponent.facing = 'right';
    }
}

function calculateHits() {
    if (Opponent.isHit > 0) {
        Opponent.isHit--;
    }
    if (Player.isHit > 0) {
        Player.isHit--;
    }

    var xOffset = Math.abs(Player.position.x - Opponent.position.x);
    var yOffset = Math.abs(Player.position.y - Opponent.position.y);
    if (xOffset < 50 && yOffset < 50) {
        if (Player.punching) {
            Player.punchForce = Math.floor(Player.stats.punch * (Math.random() * (2 - 0.5) + 0.5));
            var breaksBlock = Player.punchForce > Opponent.stats.block;
            if ((!Opponent.blocking || breaksBlock) && Opponent.isHit <= 0) {
                var damage = Player.punchForce / Opponent.stats.block;
                if (Opponent.blocking) {
                    // TODO nice block break animation
                    Sounds.break.play();
                    Opponent.movements.block.stop();
                    damage = Math.min(1, damage - Opponent.stats.block);
                } else {
                    Sounds.punch.play();
                }
                Log.info('Opponent hit', 'Calculation', Player);
                Opponent.isHit = 8;
                Opponent.health -= damage;
                $('#opponent').find('.character-hit-count').text(Player.punchForce).show();
                setTimeout(function() {
                    $('#opponent').find('.character-hit-count').hide(600);
                }, 1);
            }
        }
        if (Opponent.punching) {
            Opponent.punchForce = Math.floor(Opponent.stats.punch * (Math.random() * (2 - 0.5) + 0.5));
            var breaksBlock = Opponent.punchForce > Player.stats.block;
            if ((!Player.blocking || breaksBlock) && Player.isHit <= 0) {
                var damage = Opponent.punchForce / Player.stats.block;
                if (Player.blocking) {
                    // TODO nice block break animation
                    Sounds.break.play();
                    Player.movements.block.stop();
                    damage = Math.min(1, damage - Player.stats.block);
                } else {
                    Sounds.punch.play();
                }
                Log.info('Player hit', 'Calculation', Opponent);
                Player.isHit = 8;
                Player.health -= damage;
                $('#player').find('.character-hit-count').text(Player.punchForce).show();
                setTimeout(function() {
                    $('#player').find('.character-hit-count').hide(600);
                }, 1)
            }
        }
    }
    if (Opponent.health <= 0 || Player.health <= 0) {
        finishMatch();
    }
}

/*
var Camera = {
    position: { // origin is center
        x: 0,
        y: 0
    },
    viewport: {
        width: gameViewport.width(),
        height: gameViewport.height()
    }
};
 */

//Stage.width - viewportWidth

function calculateViewportPositionX(character) {
    return character.position.x - Camera.viewport.left;
}

function calculateCamera() {
    var playerViewPortPositionX = calculateViewportPositionX(Player);

    var updateX = Camera.position.x;
    var updateY = Player.position.y / 4;

    var scaleSpeed = 3;
    var scaleThreshold = 2.5;
    var scaleMax = 1.1;

    var scale = Math.max(1, Camera.viewport.width * scaleSpeed / Math.abs(Player.position.x - Opponent.position.x));

    scale = (scaleThreshold - 1) * (scale - 1) / (Camera.viewport.width - 1) + 1;
    if (scale > scaleMax) scale = scaleMax;

    //calculateViewportPosition(Opponent);
    if (playerViewPortPositionX < Camera.viewport.width / 12) {
        updateX = Camera.position.x - 10;
    } else if (playerViewPortPositionX < Camera.viewport.width / 8) {
        updateX = Camera.position.x - 4;
    } else if (playerViewPortPositionX < Camera.viewport.width / 6) {
        updateX = Camera.position.x - 1;
    }
    if (playerViewPortPositionX > Camera.viewport.width - Camera.viewport.width / 12) {
        updateX = Camera.position.x + 10;
    } else if (playerViewPortPositionX > Camera.viewport.width - Camera.viewport.width / 8) {
        updateX = Camera.position.x + 4;
    } else if (playerViewPortPositionX > Camera.viewport.width - Camera.viewport.width / 6) {
        updateX = Camera.position.x + 1;
    }
    if (updateX !== Camera.position.x || updateY !== Camera.position.y || scale != Camera.scale) {
        Camera.update(updateX, updateY, scale);
    }
}

function calculate(character) {
    if (!calculating) {
        calculating = true;
        var timeStamp = performance.now();
        cpsView.text((1000 / (timeStamp - calculationStart)).toFixed(0));
        calculationStart = timeStamp;

        if (Player.ai.active) calculateAI(Player);
        if (Opponent.ai.active) calculateAI(Opponent);

        calculateCharacter(Player);
        calculateCharacter(Opponent);

        calculateCamera();

        calculateFacings();

        calculateHits();

        calculating = false;
    } else {
        Log.warning('Skipped calculation frame');
    }
}

function finishMatch() {
    clearInterval(calculationInterval);
    clearInterval(Stage.timeInterval);
    if (Opponent.health <= 0) {
        $('#match-alert').text('You win').show();
        Sounds.you.play(function() {
            Sounds.win.play();
        });
    } else {
        $('#match-alert').text('You lose').show();
        Sounds.you.play(function() {
            Sounds.lose.play();
        });
    }
    setTimeout(function() {
        $('*').off('keydown').on('keydown', function(e) {
            start();
        });
        $("#start-button-layer").show();
    }, 2000);
}

var calculationInterval;

function resizeViewport() {
    var border = parseInt($('#viewport').css("border-left-width"));
    var widthZoomFactor = $(window).width() / ($('#viewport').width() + border * 2);
    var heightZoomFactor = $(window).height() / ($('#viewport').height() + border * 2);
    var zoomFactor = Math.min(widthZoomFactor, heightZoomFactor);
    $('#viewport').css('zoom', zoomFactor);
}

$(window).resize(function() {
    resizeViewport();
});

function enterFullscreen(element) {
    if(element.requestFullscreen) {
        element.requestFullscreen();
    } else if(element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if(element.msRequestFullscreen) {
        element.msRequestFullscreen();
    } else if(element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    }
}

function init() {
    resizeViewport();
    initStage();
    Camera.update(null, null);
    $('*').off('keydown').on('keydown', function(e) {
       start();
    });
}

var renderInterval;
var calculationInterval;

function start() {
    $("#start-button-layer").hide();
    enterFullscreen(document.documentElement);
    Sounds.init();
    initOnScreenButtons();
    initKeyboard();
    initCharacters();
    initStatus();
    initStage();
    Camera.update(null, null);
    setTimeout(initMusic, 1);
    var calculationTime = 1000/cps;
    var frameTime = 1000/fps;
    clearInterval(renderInterval);
    clearInterval(calculationInterval);
    renderInterval = setInterval(render, frameTime);
    setTimeout(function() {
        calculationInterval = setInterval(calculate, calculationTime);
        Log.info('Game started');
    }, 3000);
}

$("#start-button-layer").click(function() {
    start();
});

$(function() {
    init();
});
