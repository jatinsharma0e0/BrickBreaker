class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    
    normalize() {
        const length = Math.sqrt(this.x * this.x + this.y * this.y);
        if (length > 0) {
            this.x /= length;
            this.y /= length;
        }
        return this;
    }
    
    copy() {
        return new Vector2(this.x, this.y);
    }
}

class Ball {
    constructor(x, y, radius = 8) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(3, -3);
        this.radius = radius;
        this.color = '#fff';
    }
    
    update() {
        this.position.add(this.velocity);
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    checkWallCollision(canvasWidth, canvasHeight) {
        // Left and right walls
        if (this.position.x - this.radius <= 0 || this.position.x + this.radius >= canvasWidth) {
            this.velocity.x = -this.velocity.x;
            this.position.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.position.x));
        }
        
        // Top wall
        if (this.position.y - this.radius <= 0) {
            this.velocity.y = -this.velocity.y;
            this.position.y = this.radius;
        }
        
        // Bottom wall (return true if ball goes below)
        if (this.position.y - this.radius > canvasHeight) {
            return true;
        }
        
        return false;
    }
    
    checkPaddleCollision(paddle) {
        const ballLeft = this.position.x - this.radius;
        const ballRight = this.position.x + this.radius;
        const ballTop = this.position.y - this.radius;
        const ballBottom = this.position.y + this.radius;
        
        if (ballRight >= paddle.position.x && 
            ballLeft <= paddle.position.x + paddle.width &&
            ballBottom >= paddle.position.y && 
            ballTop <= paddle.position.y + paddle.height) {
            
            // Calculate hit position relative to paddle center for angle variation
            const hitPos = (this.position.x - (paddle.position.x + paddle.width / 2)) / (paddle.width / 2);
            this.velocity.y = -Math.abs(this.velocity.y);
            this.velocity.x = hitPos * 3; // Add some angle based on hit position
            
            // Ensure minimum speed
            const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            if (speed < 4) {
                this.velocity.normalize().multiply(4);
            }
            
            this.position.y = paddle.position.y - this.radius;
            return true;
        }
        return false;
    }
}

class Paddle {
    constructor(x, y, width = 100, height = 15) {
        this.position = new Vector2(x, y);
        this.width = width;
        this.height = height;
        this.speed = 6;
        this.color = '#fff';
        this.originalWidth = width;
    }
    
    update(keys, canvasWidth) {
        if (keys.ArrowLeft && this.position.x > 0) {
            this.position.x -= this.speed;
        }
        if (keys.ArrowRight && this.position.x + this.width < canvasWidth) {
            this.position.x += this.speed;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
    
    enlargePaddle() {
        this.width = Math.min(this.originalWidth * 1.5, 150);
        setTimeout(() => {
            this.width = this.originalWidth;
        }, 10000); // Effect lasts 10 seconds
    }
}

class Brick {
    constructor(x, y, width = 75, height = 20) {
        this.position = new Vector2(x, y);
        this.width = width;
        this.height = height;
        this.destroyed = false;
        this.color = this.getRandomColor();
    }
    
    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    draw(ctx) {
        if (!this.destroyed) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
        }
    }
    
    checkCollision(ball) {
        if (this.destroyed) return false;
        
        const ballLeft = ball.position.x - ball.radius;
        const ballRight = ball.position.x + ball.radius;
        const ballTop = ball.position.y - ball.radius;
        const ballBottom = ball.position.y + ball.radius;
        
        if (ballRight >= this.position.x && 
            ballLeft <= this.position.x + this.width &&
            ballBottom >= this.position.y && 
            ballTop <= this.position.y + this.height) {
            
            this.destroyed = true;
            
            // Determine collision side for proper ball reflection
            const brickCenterX = this.position.x + this.width / 2;
            const brickCenterY = this.position.y + this.height / 2;
            
            const dx = ball.position.x - brickCenterX;
            const dy = ball.position.y - brickCenterY;
            
            if (Math.abs(dx / this.width) > Math.abs(dy / this.height)) {
                ball.velocity.x = -ball.velocity.x;
            } else {
                ball.velocity.y = -ball.velocity.y;
            }
            
            return true;
        }
        return false;
    }
}

class Powerup {
    constructor(x, y, type) {
        this.position = new Vector2(x, y);
        this.type = type; // 'largePaddle', 'extraLife', 'multiBall'
        this.width = 20;
        this.height = 20;
        this.velocity = new Vector2(0, 2);
        this.collected = false;
        this.colors = {
            largePaddle: '#4ecdc4',
            extraLife: '#ff6b6b',
            multiBall: '#feca57'
        };
        this.symbols = {
            largePaddle: 'W',
            extraLife: '+',
            multiBall: 'M'
        };
    }
    
    update() {
        this.position.add(this.velocity);
    }
    
    draw(ctx) {
        if (!this.collected) {
            ctx.fillStyle = this.colors[this.type];
            ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
            
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
                this.symbols[this.type], 
                this.position.x + this.width / 2, 
                this.position.y + this.height / 2 + 4
            );
        }
    }
    
    checkPaddleCollision(paddle) {
        if (this.collected) return false;
        
        if (this.position.x + this.width >= paddle.position.x && 
            this.position.x <= paddle.position.x + paddle.width &&
            this.position.y + this.height >= paddle.position.y && 
            this.position.y <= paddle.position.y + paddle.height) {
            
            this.collected = true;
            return true;
        }
        return false;
    }
    
    isOffScreen(canvasHeight) {
        return this.position.y > canvasHeight;
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.score = 0;
        this.lives = 3;
        this.gameState = 'playing'; // 'playing', 'gameOver', 'won'
        
        this.keys = {};
        this.balls = [];
        this.bricks = [];
        this.powerups = [];
        
        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    init() {
        // Create paddle
        this.paddle = new Paddle(this.width / 2 - 50, this.height - 40);
        
        // Create initial ball
        this.balls = [new Ball(this.width / 2, this.height - 60)];
        
        // Create bricks
        this.createBricks();
        
        // Reset powerups
        this.powerups = [];
        
        // Update UI
        this.updateUI();
    }
    
    createBricks() {
        this.bricks = [];
        const rows = 5;
        const cols = 9;
        const brickWidth = 70;
        const brickHeight = 20;
        const padding = 5;
        const offsetX = (this.width - (cols * (brickWidth + padding) - padding)) / 2;
        const offsetY = 40;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = offsetX + col * (brickWidth + padding);
                const y = offsetY + row * (brickHeight + padding);
                this.bricks.push(new Brick(x, y, brickWidth, brickHeight));
            }
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update paddle
        this.paddle.update(this.keys, this.width);
        
        // Update balls
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            ball.update();
            
            // Check wall collisions
            if (ball.checkWallCollision(this.width, this.height)) {
                this.balls.splice(i, 1);
                continue;
            }
            
            // Check paddle collision
            ball.checkPaddleCollision(this.paddle);
            
            // Check brick collisions
            for (const brick of this.bricks) {
                if (brick.checkCollision(ball)) {
                    this.score += 10;
                    
                    // Chance to spawn powerup
                    if (Math.random() < 0.25) { // 25% chance
                        const powerupTypes = ['largePaddle', 'extraLife', 'multiBall'];
                        const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
                        this.powerups.push(new Powerup(
                            brick.position.x + brick.width / 2 - 10,
                            brick.position.y + brick.height,
                            randomType
                        ));
                    }
                    break;
                }
            }
        }
        
        // Update powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.update();
            
            if (powerup.checkPaddleCollision(this.paddle)) {
                this.applyPowerup(powerup.type);
                this.powerups.splice(i, 1);
            } else if (powerup.isOffScreen(this.height)) {
                this.powerups.splice(i, 1);
            }
        }
        
        // Check if all balls are lost
        if (this.balls.length === 0) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameState = 'gameOver';
                document.getElementById('gameOver').style.display = 'block';
                document.getElementById('finalScore').textContent = this.score;
            } else {
                // Respawn ball
                this.balls.push(new Ball(this.width / 2, this.height - 60));
            }
        }
        
        // Check win condition
        const activeBricks = this.bricks.filter(brick => !brick.destroyed);
        if (activeBricks.length === 0) {
            this.gameState = 'won';
            document.getElementById('gameWin').style.display = 'block';
            document.getElementById('winScore').textContent = this.score;
        }
        
        this.updateUI();
    }
    
    applyPowerup(type) {
        switch (type) {
            case 'largePaddle':
                this.paddle.enlargePaddle();
                break;
            case 'extraLife':
                this.lives++;
                break;
            case 'multiBall':
                if (this.balls.length === 1) {
                    const originalBall = this.balls[0];
                    this.balls.push(new Ball(
                        originalBall.position.x - 20,
                        originalBall.position.y,
                        originalBall.radius
                    ));
                    this.balls[1].velocity = new Vector2(-3, -3);
                }
                break;
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw game objects
        this.paddle.draw(this.ctx);
        
        this.balls.forEach(ball => ball.draw(this.ctx));
        this.bricks.forEach(brick => brick.draw(this.ctx));
        this.powerups.forEach(powerup => powerup.draw(this.ctx));
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
    }
    
    restart() {
        this.score = 0;
        this.lives = 3;
        this.gameState = 'playing';
        
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('gameWin').style.display = 'none';
        
        this.init();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    
    // Make game globally accessible for restart button
    window.game = game;
});