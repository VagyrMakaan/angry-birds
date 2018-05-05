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

var game = {
    // Game mode
    mode: "intro",
    // X & Y Coordinates of the slingshot
    slingshotX: 140,
    slingshotY: 280,

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

        game.mode = "intro";
        game.offsetLeft = 0;
        game.ended = false;
        game.animationFrame = window.requestAnimationFrame(game.animate, game.canvas);
    },

    handlePanning: function () {
        game.offsetLeft++; // Temporary placeholder - keep panning to the right
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
            entities: []
        },
        {
            // Second level
            foreground: 'desert-foreground',
            background: 'clouds-background',
            entities: []
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
        // Declare a new currentLevel object
        game.currentLevel = {
            number: number, 
            hero: []
        };
        game.score = 0;
        $('#score').html('Score: ' + game.score);
        var level = levels.data[number];

        // Load the background, foreground and slingshot images
        game.currentLevel.backgroundImage = loader.loadImage("images/backgrounds/" + level.background + ".png");
        game.currentLevel.foregroundImage = loader.loadImage("images/backgrounds/" + level.foreground + ".png");
        game.slingshotImage = loader.loadImage("images/slingshot.png");
        game.slingshotFrontImage = loader.loadImage("images/slingshot-front.png");

        // Call game.start() once the assets have loaded
        if (loader.loaded) {
            game.start();
        } else {
            loader.onload = game.start;
        }
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
        moues.y = event.pageY - offset.top;

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