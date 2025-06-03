export default class Player{
    WALK_ANIMATION_TIMER = 200;
    walkAnimationTimer = this.WALK_ANIMATION_TIMER;
    capyRunImages = [];

    jumpPressed = false;
    jumpInProgress = false;
    falling = false;
    JUMP_SPEED = 0.6;
    GRAVITY = 0.4;

    constructor(ctx,width, height, minJumpHeight, maxJumpHeight, scaleRatio){
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.width = width;
        this.height = height;
        this.minJumpHeight = minJumpHeight;
        this.maxJumpHeight = maxJumpHeight;
        this.scaleRatio = scaleRatio;

        this.x = 10 * scaleRatio;
        this.y = this.canvas.height - this.height - 1.5 * scaleRatio;
        this.yStandingPosition = this.y;

        this.standingStillImage = new Image();
        this.standingStillImage.src = "images/capy_stand.png";
        this.image = this.standingStillImage;

        const capyRunImage1 = new Image();
        capyRunImage1.src = "images/capy_run1.png";

        const capyRunImage2 = new Image();
        capyRunImage2.src = "images/capy_run3.png";

        const capyRunImage3 = new Image();
        capyRunImage3.src = "images/capy_run2.png";

        const capyRunImage4 = new Image();
        capyRunImage4.src = "images/capy_run3.png";

        this.capyRunImages.push(capyRunImage1);
        this.capyRunImages.push(capyRunImage2);
        this.capyRunImages.push(capyRunImage3);
        this.capyRunImages.push(capyRunImage4);

        // Create and load the jump sound effect
        this.jumpSound = new Audio();
        this.jumpSound.src = 'sounds/jump.mp3'; // Replace with your sound file path
        this.jumpSound.volume = 0.4; // Adjust volume (0.0 to 1.0)

        //keyboard
        window.removeEventListener('keydown', this.keydown);
        window.removeEventListener('keyup', this.keyup);

        window.addEventListener('keydown', this.keydown);
        window.addEventListener('keyup', this.keyup);

        //touch
        window.removeEventListener('touchstart', this.touchstart);
        window.removeEventListener('touchend', this.touchend);

        window.addEventListener('touchstart', this.touchstart);
        window.addEventListener('touchend', this.touchend);
    }

    touchstart = ()=>{
        this.jumpPressed = true;
    };
    touchend = ()=>{
        this.jumpPressed = false;
    };

    keydown = (event)=>{
        if(event.code === "Space") {
            this.jumpPressed = true;
        };
    };
    keyup = (event)=>{
        if(event.code === "Space") {
            this.jumpPressed = false;
        };
    };

    playJumpSound(){
        // Reset the sound to beginning in case it's already playing
        this.jumpSound.currentTime = 0;
        
        // Play the sound (wrap in try-catch for browser compatibility)
        try {
            this.jumpSound.play().catch(e => {
                console.log('Could not play jump sound:', e);
            });
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }

    update(gameSpeed, frameTimeDelta){
        this.run(gameSpeed, frameTimeDelta);

        if(this.jumpInProgress){
            this.image = this.standingStillImage;
        }

        this.jump(frameTimeDelta);
    };

    jump(frameTimeDelta){
        if(this.jumpPressed){
            // Play sound only when jump first starts (not during continuous jumping)
            if (!this.jumpInProgress) {
                this.playJumpSound();
            }
            this.jumpInProgress = true;
        };

        if(this.jumpInProgress && !this.falling) {
            if (
                this.y > this.canvas.height - this.minJumpHeight ||
                (this.y > this.canvas.height - this.maxJumpHeight && this.jumpPressed)
            ) {
                this.y -= this.JUMP_SPEED * frameTimeDelta * this.scaleRatio;
            } else {
                this.falling = true;
            };
        }
        else {
            if(this.y < this.yStandingPosition){
                this.y += this.GRAVITY * frameTimeDelta * this.scaleRatio;
                if(this.y + this.height > this.canvas.height){
                    this.y = this.yStandingPosition;
                }
            }
            else {
                this.falling = false;
                this.jumpInProgress = false;
            }
        }
    };

    run(gameSpeed, frameTimeDelta){
        if(this.walkAnimationTimer <=0) {
            if(this.image === this.capyRunImages[0]) {
                this.image = this.capyRunImages[1];
            } else if (this.image === this.capyRunImages[1]) {
                this.image = this.capyRunImages[2];
            } else if (this.image === this.capyRunImages[2]) {
                this.image = this.capyRunImages[3];
            } else{
                this.image = this.capyRunImages[0];
            }
            this.walkAnimationTimer = this.WALK_ANIMATION_TIMER;
        }
        this.walkAnimationTimer -= frameTimeDelta * gameSpeed;
    }

    draw(){
        this.ctx.drawImage(
            this.image, 
            this.x, 
            this.y, 
            this.width, 
            this.height
        );
    }
} 