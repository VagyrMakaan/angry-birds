$(document).ready(function () {
    game.init();
});

var game = {
    // Start initializing objects, preloading assets and display start screen
    init: function () {
        // Initialize objects
        levels.init();
        loader.init();

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
            html += '<input type="button" value "' + (i+1) + '">';
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