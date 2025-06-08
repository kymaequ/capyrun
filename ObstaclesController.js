import Obstacle from "./Obstacle.js";

export default class ObstaclesController {
    OBSTACLE_INTERVAL_MIN = 500;
    OBSTACLE_INTERVAL_MAX = 2000;

    nextObstacleInterval = null;
    obstacles = [];

    constructor(ctx, obstacleImages, orangeSprites, scaleRatio, speed){
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.obstacleImages = obstacleImages;
        this.orangeSprites = orangeSprites; // Array of 4 orange sprites
        this.scaleRatio = scaleRatio;
        this.speed = speed;

        // Define flying obstacle heights (adjust these values as needed)
        this.flyingHeights = [
            this.canvas.height * 0.4,  // High flying
            this.canvas.height * 0.5,  // Mid flying
            this.canvas.height * 0.65   // Low flying
        ];

        this.setNextObstacleTime();
    }

    setNextObstacleTime(){
        const num = this.getRandomNumber(
            this.OBSTACLE_INTERVAL_MIN,
            this.OBSTACLE_INTERVAL_MAX
        );

        this.nextObstacleInterval = num;
    }

    getRandomNumber(min, max){
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    createObstacle(){
        // Randomly choose between ground and flying obstacle
        const isFlying = Math.random() < 0.2; // 40% chance for flying obstacles
        
        if (isFlying && this.orangeSprites.length > 0) {
            this.createSpinningOrange();
        } else {
            this.createGroundObstacle();
        }
    }

    createGroundObstacle(){
        const index = this.getRandomNumber(0, this.obstacleImages.length - 1);
        const obstacleImage = this.obstacleImages[index];
        const x = this.canvas.width * 1.5;
        const y = this.canvas.height - obstacleImage.height;
        const obstacle = new Obstacle(
            this.ctx, 
            x, 
            y, 
            obstacleImage.width, 
            obstacleImage.height, 
            obstacleImage.image
        );

        this.obstacles.push(obstacle);
    }

    createSpinningOrange(){
        const x = this.canvas.width * 1.5;
        
        // Choose a random flying height
        const heightIndex = this.getRandomNumber(0, this.flyingHeights.length - 1);
        const y = this.flyingHeights[heightIndex] - this.orangeSprites[0].height;
        
        const obstacle = new Obstacle(
            this.ctx, 
            x, 
            y, 
            this.orangeSprites[0].width, 
            this.orangeSprites[0].height, 
            this.orangeSprites[0].image // Start with first sprite
        );

        // Add spinning animation properties
        obstacle.isSpinning = true;
        obstacle.sprites = this.orangeSprites;
        obstacle.currentSpriteIndex = 0;
        obstacle.spinTimer = 0;
        obstacle.SPIN_SPEED = 150; // Milliseconds between sprite changes (adjust for faster/slower spin)

        // Add speed multiplier for oranges
        obstacle.speedMultiplier = 1.2; // Makes oranges faster (adjust as needed)
        
        this.obstacles.push(obstacle);
    }

    update(gameSpeed, frameTimeDelta){
        if(this.nextObstacleInterval <= 0){
            //create obstacle
            this.createObstacle();
            this.setNextObstacleTime();
        }
        this.nextObstacleInterval -= frameTimeDelta;

        this.obstacles.forEach((obstacle)=>{
            // Handle spinning animation
            if (obstacle.isSpinning) {
                obstacle.spinTimer += frameTimeDelta;
                
                // Time to change sprite
                if (obstacle.spinTimer >= obstacle.SPIN_SPEED) {
                    obstacle.currentSpriteIndex = (obstacle.currentSpriteIndex - 1 + obstacle.sprites.length) % obstacle.sprites.length;
                    obstacle.image = obstacle.sprites[obstacle.currentSpriteIndex].image;
                    obstacle.spinTimer = 0;
                }
            }
            // Use speed multiplier if it exists, otherwise use normal speed
            const obstacleSpeed = obstacle.speedMultiplier ? this.speed * obstacle.speedMultiplier : this.speed;
            obstacle.update(obstacleSpeed, gameSpeed, frameTimeDelta, this.scaleRatio);
        });

        this.obstacles = this.obstacles.filter(obstacle=>obstacle.x > -obstacle.width);
    }

    draw(){
        this.obstacles.forEach(obstacle => obstacle.draw());
    }

    collideWith(sprite){
        return this.obstacles.some(obstacle=> obstacle.collideWith(sprite));
    };

    reset(){
        this.obstacles = [];
    }
}