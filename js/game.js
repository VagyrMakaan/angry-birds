// Declare all the commonly used objects as variables for convenience
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

// Set up requestAnimationFrame and cancelAnimationFrame for use in the game code
// TODO: Create own function to call inside of $().ready()
(function () {
    // Reread chapter 1 of 'Pro HTML5 Games' by Shankar
    var lastTime = 0;
    var vendors = [ 'ms', 'moz', 'webkit', 'o' ];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout( function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());

// Initialize application on page load finished event
$(document).ready(function () {
    game.init();
});

var gameModes = {
    "intro": 1,
    "loadNextHero": 2,
    "waitForFiring": 3,
    "firing": 4,
    "fired": 5,
}

var game = {
    // Game mode
    mode: gameModes.intro,

    // X & Y Coordinates of the slingshot
    slingshotX: 140,
    slingshotY: 280,

    // Maximum panning speed per frame in pixels
    maxSpeed: 3,
    // Minimum and maximum panning offset
    minOffset: 0,
    maxOffset: 300,
    // Current panning offset
    offsetLeft: 0,
    // The game score
    score: 0,

    // Start initializing objects, preloading assets and display start screen
    init: function () {
        // Initialize objects
        levels.init();
        loader.init();
        mouse.init();

        // Hide all game layers and display the start screen
        $('.gamelayer').hide();
        $('#gamestartscreen').show();

        // Get handler for game canvas and context
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');

        // Activate "play" button on mainscreen
        $('#playGameButton').click( function () {
            game.showLevelScreen();
        });
    },

    showLevelScreen: function () {
        $('.gamelayer').hide();
        $('#levelselectscreen').show('slow');
    },

    start: function () {
        $('.gamelayer').hide();
        // Display the game canvas and score
        $('#gamecanvas').show();
        $('#scorescreen').show();

        game.mode = gameModes.intro;
        game.offsetLeft = 0;
        game.ended = false;
        game.animationFrame = window.requestAnimationFrame(game.animate, game.canvas);
    },

    handlePanning: function () {
        if (game.mode == gameModes.intro) {
            if (game.panTo(700)) {
                game.mode = gameModes.loadNextHero;
            }
        }

        if (game.mode == gameModes.waitForFiring) {
            if (mouse.dragging) {
                game.panTo(mouse.x + game.offsetLeft);
            } else {
                game.panTo(game.slingshotX);
            }
        }

        if (game.mode == gameModes.loadNextHero) {
            // TODO:
            // Check if any villains are alive, if not, end the level (success)
            // Check if there are any more heroes left to load, if not, end the level (failure)

            // Load the hero and set mode to wait-for-firing
            game.mode = gameModes.waitForFiring;
        }

        if (game.mode == gameModes.firing) {
            game.panTo(game.slingshotX);
        }

        if (game.mode == gameModes.fired) {
            // TODO:
            // Pan to wherever the hero currently is
        }
    },

    panTo: function (newCenter) {
        if (Math.abs(newCenter - game.offsetLeft - game.canvas.width / 4) > 0 &&
            game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset
        ) {
            var deltaX = Math.round((newCenter - game.offsetLeft - game.canvas.width / 4) / 2);
            if (deltaX && Math.abs(deltaX) > game.maxSpeed) {
                deltaX = game.maxSpeed * Math.abs(deltaX) / (deltaX);
            }
            game.offsetLeft += deltaX;
        } else {
            return true;
        }

        if (game.offsetLeft < game.minOffset) {
            game.offsetLeft = game.minOffset;
            return true;
        } else if (game.offsetLeft > game.maxOffset) {
            game.offsetLeft = game.maxOffset;
            return true;
        }
        return false;
    },

    animate: function () {
        // Animate the background
        game.handlePanning();

        // Animate the characters

        // Draw the background with parallax scrolling (e.g. background-offset is changed only by a quarter of foreground)
        game.context.drawImage(game.currentLevel.backgroundImage, game.offsetLeft / 4, 0, 640, 480, 0, 0, 640, 480);
        game.context.drawImage(game.currentLevel.foregroundImage, game.offsetLeft, 0, 640, 480, 0, 0, 640, 480);

        // Draw the slingshot
        game.context.drawImage(game.slingshotImage, game.slingshotX - game.offsetLeft, game.slingshotY);
        game.context.drawImage(game.slingshotFrontImage, game.slingshotX - game.offsetLeft, game.slingshotY);

        if (!game.ended) {
            game.animationFrame = window.requestAnimationFrame(game.animate, game.canvas);
        }
    }
}

var levels = {
    // Level data
    data: [
        {
            // First level
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: [
                {
                    type: entities.types.ground,
                    name: entities.definitions.dirt.id,
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true,
                },
                {
                    type: entities.types.ground,
                    name: entities.definitions.wood.id,
                    x: 180,
                    y: 390,
                    width: 40,
                    height: 80,
                    isStatic: true,
                },
                
                {
                    type: entities.types.block,
                    name: entities.definitions.wood.id,
                    x: 520,
                    y: 375,
                    angle: 90,
                    width: 100,
                    height: 25,
                },
                {
                    type: entities.types.block,
                    name: entities.definitions.glass.id,
                    x: 520,
                    y: 275,
                    angle: 90,
                    width: 100,
                    height: 25,
                },
                {
                    type: entities.types.villain,
                    name: entities.definitions.burger.id,
                    x: 520,
                    y: 200,
                    scoreValue: 590,
                },

                
                {
                    type: entities.types.block,
                    name: entities.definitions.wood.id,
                    x: 620,
                    y: 375,
                    angle: 90,
                    width: 100,
                    height: 25,
                },
                {
                    type: entities.types.block,
                    name: entities.definitions.glass.id,
                    x: 620,
                    y: 275,
                    angle: 90,
                    width: 100,
                    height: 25,
                },
                {
                    type: entities.types.villain,
                    name: entities.definitions.fries.id,
                    x: 620,
                    y: 200,
                    scoreValue: 420,
                },

                {
                    type: entities.types.hero,
                    name: entities.definitions.orange.id,
                    x: 90,
                    y: 410,
                },
                {
                    type: entities.types.hero,
                    name: entities.definitions.apple.id,
                    x: 150,
                    y: 410,
                },
            ]
        },
        {
            // Second level
            // TODO: see page 72 of "Pro HTML5 Games" by Shankar for correct second level code
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: [
                {
                    type: entities.types.ground,
                    name: entities.definitions.dirt.id,
                    x: 500,
                    y: 440,
                    width: 1000,
                    height: 20,
                    isStatic: true,
                },
                {
                    type: entities.types.ground,
                    name: entities.definitions.wood.id,
                    x: 180,
                    y: 390,
                    width: 40,
                    height: 80,
                    isStatic: true,
                },
                
                {
                    type: entities.types.block,
                    name: entities.definitions.wood.id,
                    x: 520,
                    y: 375,
                    angle: 90,
                    width: 100,
                    height: 25,
                },
                {
                    type: entities.types.block,
                    name: entities.definitions.glass.id,
                    x: 520,
                    y: 275,
                    angle: 90,
                    width: 100,
                    height: 25,
                },
                {
                    type: entities.types.villain,
                    name: entities.definitions.burger.id,
                    x: 520,
                    y: 200,
                    scoreValue: 590,
                },

                
                {
                    type: entities.types.block,
                    name: entities.definitions.wood.id,
                    x: 620,
                    y: 375,
                    angle: 90,
                    width: 100,
                    height: 25,
                },
                {
                    type: entities.types.block,
                    name: entities.definitions.glass.id,
                    x: 620,
                    y: 275,
                    angle: 90,
                    width: 100,
                    height: 25,
                },
                {
                    type: entities.types.villain,
                    name: entities.definitions.fries.id,
                    x: 620,
                    y: 200,
                    scoreValue: 420,
                },

                {
                    type: entities.types.hero,
                    name: entities.definitions.orange.id,
                    x: 90,
                    y: 410,
                },
                {
                    type: entities.types.hero,
                    name: entities.definitions.apple.id,
                    x: 150,
                    y: 410,
                },
            ]
        }
    ],

    // Initialize level selection screen
    init: function () {
        var html = "";
        // Generate buttons for all levels
        for (var i = 0; i < levels.data.length; i++) {
            var level = levels.data[i];
            html += '<input type="button" value="' + (i+1) + '">';
        }
        $('#levelselectscreen').html(html);

        // Set the button click event handlers to load level
        $('#levelselectscreen input').click( function () {
            levels.load(this.value-1);
            $('#levelscelectscreen').hide();
        });
    },

    // Load all data and images for a specific level
    load: function (number) {
        // Initialize Box2D world whenever a level is loaded
        box2d.init();

        // Declare a new currentLevel object
        game.currentLevel = {
            number: number, 
            hero: []
        };
        game.score = 0;
        $('#score').html('Score: ' + game.score);
        game.currentHero = undefined;
        var level = levels.data[number];

        // Load the background, foreground and slingshot images
        game.currentLevel.backgroundImage = loader.loadImage("images/backgrounds/" + level.background + ".png");
        game.currentLevel.foregroundImage = loader.loadImage("images/backgrounds/" + level.foreground + ".png");
        game.slingshotImage = loader.loadImage("images/slingshot.png");
        game.slingshotFrontImage = loader.loadImage("images/slingshot-front.png");

        // Load all the entities
        for (var i = level.entities.length - 1; i >= 0; i--) {
            var entity = level.entities[i];
            entities.create(entity);
        }

        // Call game.start() once the assets have loaded
        if (loader.loaded) {
            game.start();
        } else {
            loader.onload = game.start;
        }
    }
}

var entities = {
    types = {
        "hero": "hero",
        "villain": "villain",
        "ground": "ground",
        "block": "block",
    },

    definitions: {
        // Material definitions
        "glass": {
            id: "glass",
            fullHealth: 100,
            density: 2.4,
            friction: 0.4,
            restitution: 0.15,
        },
        "wood": {
            id: "wood",
            fullHealth: 500,
            density: 0.7,
            friction: 0.4,
            restitution: 0.4,
        },
        "dirt": {
            id: "dirt",
            density: 3.0,
            friction: 1.5,
            restitution: 0.2,
        },
        // Villain definitions
        "burger": {
            id: "burger",
            shape: "circle",
            radius: 25,
            fullHealth: 40,
            density: 1,
            friction: 0.5,
            restitution: 0.4,
        },
        "sodacan": {
            id: "sodacan",
            shape: "rectangle",
            width: 40,
            height: 60,
            fullHealth: 80,
            density: 1,
            friction: 0.5,
            restitution: 0.7,
        },
        "fries": {
            id: "fries",
            shape: "rectangle",
            width: 40,
            height: 50,
            fullHealth: 50,
            density: 1,
            friction: 0.5,
            restitution: 0.6,
        },
        // Hero definitions
        "apple": {
            id: "apple",
            shape: "circle",
            radius: 25,
            density: 1.5,
            friction: 0.5,
            restitution: 0.4,
        },
        "orange": {
            id: "orange",
            shape: "circle",
            radius: 25,
            density: 1.5,
            friction: 0.5,
            restitution: 0.4,
        },
        "strawberry": {
            id: "strawberry",
            shape: "circle",
            radius: 15,
            density: 2.0,
            friction: 0.5,
            restitution: 0.4,
        },
    },
    
    // Take the entity, create a Box2D body, and add it to the world
    create: function (entity) {
        var definition = entities.definitions[entity.name];
        if (!definition) {
            console.log("Undefined entity name", entity.name);
            return;
        }

        switch (entity.type) {
            case "block": // simple rectangles
                entity.health = definition.fullHealth;
                entity.fullHealth = definition.fullHealth;
                entity.shape = "rectangle";
                entity.sprite = loader.loadImage("images/entities/" + entity.name + ".png");
                box2d.createRectangle(entity, definition);
                break;

            case "ground": // simple rectangles
                // No need for health. These are indestructible
                entity.shape = "rectangle";
                // No need for sprites. These won't be drawn at all
                box2d.createRectangle(entity, definition);
                break;

            case "hero": // simple circles
            case "villain": // can be circles or rectangles
                entity.health = definition.fullHealth;
                entity.fullHealth = definition.fullHealth;
                entity.sprite = loader.loadImage("images/entities/" + entity.name + ".png");
                entity.shape = definition.shape;
                if (definition.shape == "circle") {
                    entity.radius = definition.radius;
                    box2d.createCircle(entity, definition);
                } else if (definition.shape == "rectangle") {
                    entity.width = definition.width;
                    entity.height = definition.height;
                    box2d.createRectangle(entity, definition);
                }
                break;

            default:
                console.log("Undefined entity type", entity.type);
                break;
        }
    },

    // Take the entity, it's position and it's angle and draw it on the game canvas
    draw: function (entity, position, angle) {

    }
}

var loader = {
    loaded: true,
    loadedCount: 0, // Assets that have been loaded so far
    totalCount: 0,  // Total number of assets that need to be loaded

    init: function () {
        // Check for sound support
        var supportsMP3;
        var audioTag = document.createElement('audio');
        if (audioTag.canPlayType) {
            // Currently canPlayType() returns: "", "maybe" or "probably"
            supportsMP3 = "" != audioTag.canPlayType('audio/mpeg');
        } else {
            // Audio tag is not supported/No HTML5 browser support
            supportsMP3 = false;
        }

        // Cehck for mp3 and set soundFileExtension accordingly
        loader.soundFileExtension = supportsMP3 ? ".mp3" : undefined;
    },

    loadImage: function (url) {
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var image = new Image();
        image.src = url;
        image.onload = loader.itemLoaded;
        return image;
    },

    soundFileExtension: ".mp3",
    loadSound: function (url) {
        this.totalCount++;
        this.loaded = false;
        $('#loadingscreen').show();
        var audio = new Audio();
        audio.src = url + loader.soundFileExtension;
        audio.addEventListener("canplaythrough", loader.itemLoaded, false);
        return audio;
    },

    itemLoaded: function () {
        loader.loadedCount++;
        $('#loadingmessage').html('Loaded ' + loader.loadedCount + ' of ' + loader.totalCount);
        if (loader.loadedCount === loader.totalCount) {
            // Loader has loaded completely
            loader.loaded = true;
            // Hide the loading screen
            $('#loadingscreen').hide();
            // and call the loader.onload method if it exists
            if (loader.onload) {
                loader.onload();
                loader.onload = undefined;
            }
        }
    }
}

var mouse = {
    x: 0,
    y: 0,
    down: false,

    init: function () {
        $('#gamecanvas').mousemove(mouse.mousemovehandler);
        $('#gamecanvas').mousedown(mouse.mousedownhandler);
        $('#gamecanvas').mouseup(mouse.mouseuphandler);
        $('#gamecanvas').mouseout(mouse.mouseuphandler);
    },

    mousemovehandler: function (event) {
        var offset = $('#gamecanvas').offset();

        mouse.x = event.pageX - offset.left;
        mouse.y = event.pageY - offset.top;

        if (mouse.down) {
            mouse.dragging = true;
        }
    },

    mousedownhandler: function (event) {
        mouse.down = true;
        mouse.downX = mouse.x;
        mouse.downY = mouse.y;
        event.originalEvent.preventDefault();
    },

    mouseuphandler: function (event) {
        mouse.down = false;
        mouse.dragging = false;
    }
}

// Physics
var box2d = {
    scale: 30,
    init: function () {
        // Set up the Box2D world that will do most of the physics calculation
        var gravity = new b2Vec2(0, 9.8); // Declare gravity as 9.8 m/s^2 downward
        var allowSleep = true; // Allow objects that are at rest to fall asleep and be excluded from calculations
        box2d.world = new b2World(gravity, allowSleep);
    },

    createRectangle: function (entity, definition) {
        var bodyDef = new b2BodyDef;
        if (entity.isStatic) {
            bodyDef.type = b2Body.b2_staticBody;
        } else {
            bodyDef.type = b2Body.b2_dynamicBody;
        }

        bodyDef.position.x = entity.x / box2d.scale;
        bodyDef.position.y = entity.y / box2d.scale;
        if (entity.angle) {
            bodyDef.angle = Math.PI * entity.angle / 180;
        }

        var fixtureDef = new b2FixtureDef;
        fixtureDef.density = definition.density;
        fixtureDef.friction = definition.friction;
        fixtureDef.restitution = definition.restitution;

        fixtureDef.shape = new b2PolygonShape;
        fixtureDef.shape.SetAsBox(entity.width / 2 / box2d.scale, entity.height / 2 / box2d.scale);

        var body = box2d.world.CreateBody(bodyDef);
        body.SetUserData(entity);

        var fixture = body.CreateFixture(fixtureDef);
        return body;
    },

    createCircle: function (entity, definition) {
        var bodyDef = new b2BodyDef;
        if (entity.isStatic) {
            bodyDef.type = b2Body.b2_staticBody;
        } else {
            bodyDef.type = b2Body.b2_dynamicBody;
        }

        bodyDef.position.x = entity.x / box2d.scale;
        bodyDef.position.y = entity.y / box2d.scale;
        if (entity.angle) {
            bodyDef.angle = Math.PI * entity.angle / 180;
        }

        var fixtureDef = new b2FixtureDef;
        fixtureDef.density = definition.density;
        fixtureDef.friction = definition.friction;
        fixtureDef.restitution = definition.restitution;

        fixtureDef.shape = new b2CircleShape(entity.radius / box2d.scale);
        
        var body = box2d.world.CreateBody(bodyDef);
        body.SetUserData(entity);

        var fixture = body.CreateFixture(fixtureDef);
        return body;
    }
}