import Player from "./player.js";
import Ground from "./ground.js";
import ObstaclesController from "./ObstaclesController.js";
import Score from "./Score.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GAME_SPEED_START = 0.75; // 1.0;
const GAME_SPEED_INCREMENT = 0.00001;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;
const PLAYER_WIDTH = 100 / 1.7; //58;
const PLAYER_HEIGHT = 120 / 1.7; //62;
const MAX_JUMP_HEIGHT = GAME_HEIGHT;
const MIN_JUMP_HEIGHT = 150;
const GROUND_WIDTH = 2400;
const GROUND_HEIGHT = 72;
const GROUND_AND_OBSTACLE_SPEED = 0.5;

const OBSTACLE_CONFIG = [
    {width:185/3.5, height: 250/3.5, image:"images/obstacle1.png"}, //bamboo
    {width:140/3.5, height: 244/3.5, image:"images/obstacle2.png"}, //bonsai
    {width:150/3, height: 170/3, image:"images/obstacle3.png"}, //bath
];

// Orange spinning animation sprites (up, right, down, left)
const ORANGE_SPRITES_CONFIG = [
    {width:110/3, height: 110/3, image:"images/orange-up.png"},
    {width:110/3, height: 110/3, image:"images/orange-right.png"},
    {width:110/3, height: 110/3, image:"images/orange-down.png"},
    {width:110/3, height: 110/3, image:"images/orange-left.png"},
];

//Game Objects
let player = null;
let ground = null;
let obstacleController = null;
let score = null;

let scaleRatio = null;
let previousTime = null;
let gameSpeed = GAME_SPEED_START;
let gameOver = false;
let hasAddedEventListenersForRestart = false;
let waitingToStart = true;

// Sound Effects
let gameOverSound = null;
let startJingle = null;
let audioInitialized = false;
let audioUnlocked = false;

function createSounds() {
    gameOverSound = new Audio();
    gameOverSound.src = 'sounds/gameover.mp3'; 
    gameOverSound.volume = 0.5; // Adjust volume (0.0 to 1.0)


    startJingle = new Audio();
    startJingle.src = 'sounds/nes-startup.mp3'; 
    startJingle.volume = 0.5; // Adjust volume (0.0 to 1.0)
    startJingle.preload = 'auto'; //Preload the audio

    startJingle.addEventListener('canplaythrough', () => {
        console.log('Start jingle loaded and ready to play');
    });
    
    startJingle.addEventListener('error', (e) => {
        console.error('Error loading start jingle:', e);
    });
}

function playGameOverSound() {
    if (gameOverSound) {
        // Reset the sound to beginning in case it's already playing
        gameOverSound.currentTime = 0;
        
        // Play the sound (wrap in try-catch for browser compatibility)
        try {
            gameOverSound.play().catch(e => {
                console.log('Could not play game over sound:', e);
            });
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }
}

function initializeAudio() {
    if (!audioInitialized && startJingle) {
        // On mobile, we need to "prime" the audio context
        // Try to play and immediately pause to unlock audio
        startJingle.play().then(() => {
            startJingle.pause();
            startJingle.currentTime = 0;
            audioInitialized = true;
        }).catch(e => {
            console.log('Audio initialization failed, will try again on user interaction');
        });
    }
}

// Improved audio unlock function
async function unlockAudio() {
    if (audioUnlocked) return true;
    
    try {
        // Create a short silent audio to unlock the context
        const silentAudio = new Audio();
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        
        await silentAudio.play();
        silentAudio.pause();
        
        audioUnlocked = true;
        console.log('Audio context unlocked');
        return true;
    } catch (e) {
        console.log('Failed to unlock audio:', e);
        return false;
    }
}

/*function playStartJingle() {
    if (startJingle) {
        // Reset the sound to beginning in case it's already playing
        startJingle.currentTime = 0;
        
        // Play the sound (wrap in try-catch for browser compatibility)
        try {
            startJingle.play().catch(e => {
                console.log('Could not play start jingle:', e);
            });
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }
}*/

/*function playStartJingle() {
    if (startJingle) {
        // Try to initialize audio first if not done already
        if (!audioInitialized) {
            initializeAudio();
        }
        
        // Reset the sound to beginning in case it's already playing
        startJingle.currentTime = 0;
        
        // Play the sound (wrap in try-catch for browser compatibility)
        try {
            startJingle.play().catch(e => {
                console.log('Could not play start jingle:', e);
                // Try initializing audio and playing again
                if (!audioInitialized) {
                    initializeAudio();
                    setTimeout(() => {
                        startJingle.play().catch(e2 => {
                            console.log('Second attempt to play start jingle failed:', e2);
                        });
                    }, 100);
                }
            });
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }
}*/

async function playStartJingle() {
    console.log('Attempting to play start jingle...');
    
    if (!startJingle) {
        console.log('Start jingle not initialized');
        return;
    }
    
    try {
        // Ensure audio is unlocked first
        await unlockAudio();
        
        // Reset the audio to beginning
        startJingle.currentTime = 0;
        
        // Wait for the audio to be ready if it's not already
        if (startJingle.readyState < 3) { // HAVE_FUTURE_DATA
            console.log('Waiting for audio to load...');
            await new Promise((resolve, reject) => {
                const onCanPlay = () => {
                    startJingle.removeEventListener('canplaythrough', onCanPlay);
                    startJingle.removeEventListener('error', onError);
                    resolve();
                };
                const onError = (e) => {
                    startJingle.removeEventListener('canplaythrough', onCanPlay);
                    startJingle.removeEventListener('error', onError);
                    reject(e);
                };
                startJingle.addEventListener('canplaythrough', onCanPlay);
                startJingle.addEventListener('error', onError);
            });
        }
        
        // Now try to play
        await startJingle.play();
        console.log('Start jingle playing successfully');
        
    } catch (e) {
        console.log('Could not play start jingle:', e);
    }
}

function createSprites(){
    const playerWidthInGame = PLAYER_WIDTH * scaleRatio;
    const playerHeightInGame = PLAYER_HEIGHT * scaleRatio;
    const minJumpHeightInGame = MIN_JUMP_HEIGHT * scaleRatio;
    const maxJumpHeightInGame = MAX_JUMP_HEIGHT * scaleRatio;

    const groundWidthInGame = GROUND_WIDTH * scaleRatio;
    const groundHeightInGame = GROUND_HEIGHT * scaleRatio;

    player= new Player(
        ctx, 
        playerWidthInGame, 
        playerHeightInGame, 
        minJumpHeightInGame, 
        maxJumpHeightInGame, 
        scaleRatio
    );

    ground = new Ground(
        ctx, 
        groundWidthInGame, 
        groundHeightInGame, 
        GROUND_AND_OBSTACLE_SPEED, 
        scaleRatio,
    );

    //Create ground obstacle images
    const obstacleImages = OBSTACLE_CONFIG.map(obstacle =>{
        const image = new Image();
        image.src = obstacle.image;
        return {
            image:image,
            width: obstacle.width * scaleRatio,
            height: obstacle.height * scaleRatio,
        };
    });

    // Create orange spinning sprites
    const orangeSprites = ORANGE_SPRITES_CONFIG.map(sprite =>{
        const image = new Image();
        image.src = sprite.image;
        return {
            image:image,
            width: sprite.width * scaleRatio,
            height: sprite.height * scaleRatio,
        };
    });

    obstacleController = new ObstaclesController(
        ctx, 
        obstacleImages, 
        orangeSprites,
        scaleRatio, 
        GROUND_AND_OBSTACLE_SPEED
    )

    score = new Score(ctx, scaleRatio);
}

function setScreen(){
    scaleRatio = getScaleRatio();
    canvas.width = GAME_WIDTH * scaleRatio;
    canvas.height = GAME_HEIGHT * scaleRatio;
    createSprites();
}

//Sets the screen to be as wide as the window
setScreen();
//Initialize the sounds
createSounds();

// Play the start jingle when the page loads
// Add a small delay to ensure everything is loaded
/*setTimeout(() => {
    playStartJingle();
}, 500);*/

//Use setTimeout on Safari mobile rotation otherwise works fine on desktop
//Dynamically resizes the screen if size changes
window.addEventListener('resize', ()=>setTimeout(setScreen, 500));

//Fix for Chrome
if(screen.orientation) {
    screen.orientation.addEventListener('change', setScreen);
}

function getScaleRatio(){
    const screenHeight = Math.min(
        window.innerHeight, 
        document.documentElement.clientHeight
    );

    const screenWidth = Math.min(
        window.innerWidth, 
        document.documentElement.clientWidth
    );

    //window is wider than the game width
    if(screenWidth/ screenHeight < GAME_WIDTH/ GAME_HEIGHT){
        return screenWidth / GAME_WIDTH;
    }
    else{
        return screenHeight / GAME_HEIGHT;
    }
}

function showGameOver(){
    const fontSize = 50 * scaleRatio;
    ctx.font = `${fontSize}px "Press Start 2P", monospace`;
    ctx.fillStyle = "white";
    const x = canvas.width / 4.5;
    const y = canvas.height / 2;
    ctx.fillText("GAME OVER", x, y);
}

function setupGameReset(){
    if(!hasAddedEventListenersForRestart){
        hasAddedEventListenersForRestart = true;

        setTimeout(()=>{
            window.addEventListener("keyup", async (e) => {
                await unlockAudio();
                reset();
            }, { once: true });
            
            window.addEventListener("touchstart", async (e) => {
                await unlockAudio();
                reset();
            }, { once: true });
        }, 1000);
    }
}

async function reset(){
    hasAddedEventListenersForRestart = false;
    gameOver = false;

    // Play the start jingle when the game begins (user has interacted)
    if (waitingToStart) {
        await playStartJingle();
    }

    waitingToStart = false;
    ground.reset();
    obstacleController.reset();
    score.reset();
    player.resetSprite();
    gameSpeed = GAME_SPEED_START;
}

function showStartGameText() {
    const fontSize = 20 * scaleRatio;
    //ctx.font = `${fontSize}px Verdana`;
    ctx.font = `${fontSize}px "Press Start 2P", monospace`;
    ctx.fillStyle = "white";
    const x = canvas.width / 10;
    const y = canvas.height / 2;
    ctx.fillText("Tap Screen or Press Space to Start", x, y);
}

function updateGameSpeed(frameTimeDelta){
    gameSpeed += frameTimeDelta * GAME_SPEED_INCREMENT;
}

function clearScreen(){
    ctx.fillStyle = "#3CBCFC";
    ctx.fillRect(0,0, canvas.width, canvas.height);
}

function gameLoop(currentTime) {
    //console.log(gameSpeed)
    //Makes sure game runs at same time regardless of hardware
    if(previousTime === null){
        previousTime = currentTime;
        requestAnimationFrame(gameLoop);
        return;
    }
    const frameTimeDelta = currentTime - previousTime;
    previousTime = currentTime; 

    clearScreen();

    if(!gameOver && !waitingToStart){
        //Update game objects
        ground.update(gameSpeed, frameTimeDelta);
        obstacleController.update(gameSpeed, frameTimeDelta);
        player.update(gameSpeed, frameTimeDelta);
        score.update(frameTimeDelta);
        updateGameSpeed(frameTimeDelta);
    };

    if(!gameOver && obstacleController.collideWith(player)){
        gameOver = true;
        player.setLoseSprite(); // Change sprite to gameover sprite
        playGameOverSound();
        setupGameReset();
        score.setHighScore();
    };

    //Draw game objects
    ground.draw();
    obstacleController.draw();
    score.draw();
    player.draw();

    if(gameOver){
        showGameOver();
    }

    if (waitingToStart){
        showStartGameText();
    }

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// Modified event listeners to ensure proper audio unlock
window.addEventListener("keyup", async (e) => {
    await unlockAudio();
    reset();
}, { once: true });

window.addEventListener("touchstart", async (e) => {
    await unlockAudio();
    reset();
}, { once: true });
/*window.addEventListener("touchstart", reset,{ once:true });*/