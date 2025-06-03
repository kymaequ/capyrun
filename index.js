import Player from "./player.js";
import Ground from "./ground.js";
import ObstaclesController from "./ObstaclesController.js";
import Score from "./Score.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GAME_SPEED_START = 0.75; // 1.0
const GAME_SPEED_INCREMENT = 0.00001;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;
const PLAYER_WIDTH = 100 / 1.7; //58
const PLAYER_HEIGHT = 120 / 1.7; //62
const MAX_JUMP_HEIGHT = GAME_HEIGHT;
const MIN_JUMP_HEIGHT = 150;
const GROUND_WIDTH = 2400;
const GROUND_HEIGHT = 24;
const GROUND_AND_OBSTACLE_SPEED = 0.5;

const OBSTACLE_CONFIG = [
    {width:185/3.5, height: 250/3.5, image:"images/obstacle1.png"},
    {width:140/3.5, height: 244/3.5, image:"images/obstacle2.png"},
    {width:150/3.5, height: 170/3.5, image:"images/obstacle3.png"},
]

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

    const obstacleImages = OBSTACLE_CONFIG.map(obstacle =>{
        const image = new Image();
        image.src = obstacle.image;
        return {
            image:image,
            width: obstacle.width * scaleRatio,
            height: obstacle.height * scaleRatio,
        };
    });

    obstacleController = new ObstaclesController(
        ctx, 
        obstacleImages, 
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
            window.addEventListener("keyup", reset,{ once:true });
            window.addEventListener("touchstart", reset,{ once:true });
        }, 1000);
    }
}

function reset(){
    hasAddedEventListenersForRestart = false;
    gameOver = false;
    waitingToStart = false;
    ground.reset();
    obstacleController.reset();
    score.reset();
    gameSpeed = GAME_SPEED_START;
}

function showStartGameText() {
    const fontSize = 10 * scaleRatio;
    //ctx.font = `${fontSize}px Verdana`;
    ctx.font = `${fontSize}px "Press Start 2P", monospace`;
    ctx.fillStyle = "white";
    const x = canvas.width / 5;
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

window.addEventListener("keyup", reset,{ once:true });
window.addEventListener("touchstart", reset,{ once:true });