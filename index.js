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
let waitingToStart = true;

// Sound Effects
let gameOverSound = null;
let startJingle = null;
let audioUnlocked = false;

function createSounds() {
    gameOverSound = new Audio();
    gameOverSound.src = 'sounds/gameover.mp3'; 
    gameOverSound.volume = 0.5;

    startJingle = new Audio();
    startJingle.src = 'sounds/nes-startup.mp3'; 
    startJingle.volume = 0.5;
    startJingle.preload = 'auto';
}

function playGameOverSound() {
    if (gameOverSound && audioUnlocked) {
        gameOverSound.currentTime = 0;
        gameOverSound.play().catch(e => {
            console.log('Could not play game over sound:', e);
        });
    }
}

async function unlockAudio() {
    if (audioUnlocked) return true;
    
    try {
        // Try to play and immediately pause both sounds to unlock audio context
        if (startJingle) {
            const playPromise = startJingle.play();
            if (playPromise !== undefined) {
                await playPromise;
                startJingle.pause();
                startJingle.currentTime = 0;
            }
        }
        
        if (gameOverSound) {
            const playPromise = gameOverSound.play();
            if (playPromise !== undefined) {
                await playPromise;
                gameOverSound.pause();
                gameOverSound.currentTime = 0;
            }
        }
        
        audioUnlocked = true;
        console.log('Audio unlocked successfully');
        return true;
    } catch (e) {
        console.log('Audio unlock failed:', e);
        // Still set to true as some browsers might not support the test
        audioUnlocked = true;
        return false;
    }
}

async function playStartJingle() {
    if (!startJingle || !audioUnlocked) return;
    
    try {
        startJingle.currentTime = 0;
        await startJingle.play();
        console.log('Start jingle playing');
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

async function handleGameStart() {
    // Unlock audio on first user interaction
    await unlockAudio();
    
    if (waitingToStart || gameOver) {
        await reset();
    }
}

async function reset(){
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

// Start the game loop
requestAnimationFrame(gameLoop);

// Single set of event listeners that handle all cases
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handleGameStart();
    }
});

document.addEventListener('click', (e) => {
    // Only handle clicks on the canvas
    if (e.target === canvas) {
        e.preventDefault();
        handleGameStart();
    }
});

document.addEventListener('touchstart', (e) => {
    // Only handle touches on the canvas
    if (e.target === canvas) {
        e.preventDefault();
        handleGameStart();
    }
}, { passive: false });

// Prevent iOS Safari from interfering with the game
document.addEventListener('touchend', (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

// Prevent context menu on long press (iOS/Android)
document.addEventListener('contextmenu', (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
});

// Handle iOS viewport changes
window.addEventListener('orientationchange', () => {
    setTimeout(setScreen, 500);
});

// Prevent iOS zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);
