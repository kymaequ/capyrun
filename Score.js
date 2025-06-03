export default class Score{
    score = 0;
    HIGH_SCORE_KEY = "highScore";
    lastMilestone = 0; // Track the last 100-point milestone reached

    constructor(ctx, scaleRatio){
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.scaleRatio = scaleRatio;
        
        // Create and load the sound effect
        this.milestoneSound = new Audio();
        this.milestoneSound.src = 'sounds/milestone.mp3'; // Replace with your sound file path
        this.milestoneSound.volume = 0.3; // Adjust volume (0.0 to 1.0)
    }

    update(frameTimeDelta){
        const previousScore = this.score;
        this.score += frameTimeDelta * 0.01;
        
        // Check if we've crossed a 100-point milestone
        const currentMilestone = Math.floor(this.score / 100);
        const previousMilestone = Math.floor(previousScore / 100);
        
        if (currentMilestone > previousMilestone && currentMilestone > this.lastMilestone) {
            this.playMilestoneSound();
            this.lastMilestone = currentMilestone;
        }
    }

    playMilestoneSound(){
        // Reset the sound to beginning in case it's already playing
        this.milestoneSound.currentTime = 0;
        
        // Play the sound (wrap in try-catch for browser compatibility)
        try {
            this.milestoneSound.play().catch(e => {
                console.log('Could not play milestone sound:', e);
            });
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }

    reset(){
        this.score = 0;
        this.lastMilestone = 0; // Reset milestone tracking
    }

    setHighScore(){
        const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
        if(this.score > highScore){
            localStorage.setItem(this.HIGH_SCORE_KEY, Math.floor(this.score));
        }
    }

    draw(){
        const highScore = Number(localStorage.getItem(this.HIGH_SCORE_KEY));
        const y = 20 * this.scaleRatio;

        const fontSize = 15 * this.scaleRatio;
        this.ctx.font = `${fontSize}px "Press Start 2P", monospace`;
        this.ctx.fillStyle = "white";
        const scoreX = this.canvas.width - 100 * this.scaleRatio;
        const highScoreX = scoreX - 150 * this.scaleRatio;

        const scorePadded = Math.floor(this.score).toString().padStart(6,0);
        const highScorePadded = highScore.toString().padStart(6,0);

        this.ctx.fillText(scorePadded, scoreX, y);
        this.ctx.fillText(`HI ${highScorePadded}`, highScoreX, y);
    }
}