// Initialize Phaser, and create a 400x490px game
var game = new Phaser.Game(400, 490, Phaser.AUTO, 'game-div'),
    currentlyDown = false;

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Create our 'main' state that will contain the game
var mainState = {

    preload: function() {
        // This function will be executed at the beginning
        // That's where we load the game's assets
        // Change the background color of the game
        game.stage.backgroundColor = '#71c5cf';

        // Load the bird sprite
        game.load.image('bird', 'assets/bird.png');
        game.load.image('pipe', 'assets/pipe.png');
        game.load.audio('jump', 'assets/jump.wav');
    },

    create: function() {
        // This function is called after the preload function
        // Here we set up the game, display sprites, etc.
        // Set the physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;

        //this.game.scale.setUserScale(0.8, 0.8);
        //this.game.stage.scale.startFullScreen();
        //game.scale = Phaser.ScaleManager.SHOW_ALL; //resize your window to see the stage resize too

        // Display the bird on the screen
        this.bird = this.game.add.sprite(100, 245, 'bird');

        // Add gravity to the bird to make it fall
        game.physics.arcade.enable(this.bird);
        this.bird.body.gravity.y = 1000;

        //Changing anchor of the bird object
        this.bird.anchor.setTo(-0.2, 0.5);

        this.pipes = game.add.group(); // Create a group
        this.pipes.enableBody = true;  // Add physics to the group
        this.pipes.createMultiple(20, 'pipe'); // Create 20 pipes

        this.timer = game.time.events.loop(1500, this.addRowOfPipes, this);

        this.score = 0;
        this.scoreStarted = false;
        this.labelScore = game.add.text(20, 20, "0", { font: "30px Arial", fill: "#ffffff" });

        //Jump flag
        this.isJumping = false;

        //Adding jumpsound
        this.jumpSound = game.add.audio('jump');
    },

    goFull: function() {
        this.game.scale.startFullScreen();
    },

    update: function() {
        var activePointer = this.game.input.activePointer;
        if(activePointer.isUp){
          currentlyDown = false;
        }

        if (!currentlyDown && activePointer.isDown && (Date.now() - activePointer.previousTapTime >= (100))) {
            currentlyDown = true;
            if (!this.isJumping) {
                this.jump();
            }
        }

        // This function is called 60 times per second
        // It contains the game's logic
        // If the bird is out of the world (too high or too low), call the 'restartGame' function
        if (this.bird.inWorld == false){
          if (window.confirm("You lost! Try again?")) {
            this.restartGame();
          }
        }

        game.physics.arcade.overlap(this.bird, this.pipes, this.hitPipe, null, this);

        //Bird rotation
        if (this.bird.angle < 20){
          this.bird.angle += 1;
        }
    },

    // Make the bird jump
    jump: function() {
        this.isJumping = true;
        if (this.bird.alive == false)
            return;
        // Add a vertical velocity to the bird
        this.bird.body.velocity.y = -350;

        //Animation to tilt the bird upwards
        game.add.tween(this.bird).to({angle: -20}, 100).start();
        this.jumpTimer = game.time.events.add(100, function(){ this.isJumping = false; }, this);

        this.jumpSound.play();
    },

    // Restart the game
    restartGame: function() {
        // Start the 'main' state, which restarts the game
        game.state.start('main');
    },

    addOnePipe: function(x, y) {
        // Get the first dead pipe of our group
        var pipe = this.pipes.getFirstDead();

        // Set the new position of the pipe
        pipe.reset(x, y);

        // Add velocity to the pipe to make it move left
        pipe.body.velocity.x = -200;

        // Kill the pipe when it's no longer visible
        pipe.checkWorldBounds = true;
        pipe.outOfBoundsKill = true;
    },
    addRowOfPipes: function() {
        // Pick where the hole will be
        // The total amount of pipes will be determined by the height of the screen
        // and the height of the pipe asset
        var total = 8,
            hole = getRandomInt(2, 6);

        // Add the 6 pipes
        for (var i = 0; i < total; i++){
          if (i != hole && i != hole + 1){
            this.addOnePipe(400, i * 60 + 10);
          }
        }

        if (!this.scoreStarted) {
          this.scoreStarted = true;
          this.scoreTimer = game.time.events.loop(1500, this.updateScore, this);
        }

    },
    updateScore: function() {
        this.score += 1;
        this.labelScore.text = this.score;
    },
    hitPipe: function() {
        // If the bird has already hit a pipe, we have nothing to do
        if (this.bird.alive == false)
            return;

        // Set the alive property of the bird to false
        this.bird.alive = false;

        // Prevent new pipes from appearing
        game.time.events.remove(this.timer);

        // Go through all the pipes, and stop their movement
        this.pipes.forEachAlive(function(p){
            p.body.velocity.x = 0;
        }, this);
    }
};

// Add and start the 'main' state to start the game
game.state.add('main', mainState);
game.state.start('main');
