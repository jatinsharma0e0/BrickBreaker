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

class Particle {
    constructor(x, y, color = '#fff', size = 3) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8
        );
        this.color = color;
        this.size = size;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.gravity = 0.1;
    }
    
    update() {
        this.position.add(this.velocity);
        this.velocity.y += this.gravity;
        this.life -= this.decay;
        this.size *= 0.98;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0 || this.size <= 0.1;
    }
}

class ScorePopup {
    constructor(x, y, score) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, -2);
        this.score = score;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = 16;
    }
    
    update() {
        this.position.add(this.velocity);
        this.velocity.y *= 0.95;
        this.life -= this.decay;
        this.size += 0.5;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = '#ffff00';
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`+${this.score}`, this.position.x, this.position.y);
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

class Ball {
    constructor(x, y, radius = 8) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(3, -3);
        this.radius = radius;
        this.color = '#fff';
        this.attachedToPaddle = true;
        this.launched = false;
        this.trail = []; // For ball trail effect
        this.maxTrailLength = 8;
    }
    
    update(paddle = null) {
        // Add current position to trail
        if (!this.attachedToPaddle) {
            this.trail.push(this.position.copy());
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }
        
        if (this.attachedToPaddle && paddle) {
            // Keep ball centered on paddle
            this.position.x = paddle.position.x + paddle.width / 2;
            this.position.y = paddle.position.y - this.radius - 2;
        } else {
            this.position.add(this.velocity);
        }
    }
    
    launch() {
        if (this.attachedToPaddle) {
            this.attachedToPaddle = false;
            this.launched = true;
            // Launch ball upward with slight random angle
            const angle = (Math.random() - 0.5) * 0.3; // Random angle between -0.15 and 0.15 radians
            this.velocity.x = Math.sin(angle) * 4;
            this.velocity.y = -Math.cos(angle) * 4;
        }
    }
    
    draw(ctx) {
        // Draw trail
        if (this.trail.length > 1) {
            for (let i = 0; i < this.trail.length - 1; i++) {
                const alpha = (i + 1) / this.trail.length * 0.5;
                const size = (i + 1) / this.trail.length * this.radius * 0.7;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // Draw main ball
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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
        this.isEnlarged = false;
        this.glowIntensity = 0;
        this.isWarning = false;
        this.warningGlowIntensity = 0;
        this.enlargeTimers = { // Store all active timers for proper cleanup
            glowInterval: null,
            warningTimeout: null,
            warningInterval: null,
            endTimeout: null
        };
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
        // Draw warning glow effect (red) when about to end
        if (this.isWarning && this.warningGlowIntensity > 0) {
            ctx.save();
            ctx.globalAlpha = this.warningGlowIntensity * 0.7;
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.position.x - 4, this.position.y - 4, this.width + 8, this.height + 8);
            ctx.restore();
        }
        // Draw normal glow effect (green) when enlarged
        else if (this.isEnlarged && this.glowIntensity > 0) {
            ctx.save();
            ctx.globalAlpha = this.glowIntensity * 0.5;
            ctx.fillStyle = '#00ff88';
            ctx.fillRect(this.position.x - 3, this.position.y - 3, this.width + 6, this.height + 6);
            ctx.restore();
        }
        
        // Draw main paddle
        let paddleColor = this.color;
        if (this.isWarning) {
            paddleColor = '#ff4444';
        } else if (this.isEnlarged) {
            paddleColor = '#00ff88';
        }
        
        ctx.fillStyle = paddleColor;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        
        // Add border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
    }
    
    enlargePaddle() {
        // Clear any existing timers when powerup is collected again
        this.clearEnlargeTimers();
        
        this.width = Math.min(this.originalWidth * 1.5, 150);
        this.isEnlarged = true;
        this.isWarning = false;
        this.glowIntensity = 1.0;
        this.warningGlowIntensity = 0;
        
        // Animate normal green glow
        this.enlargeTimers.glowInterval = setInterval(() => {
            if (!this.isWarning) {
                this.glowIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
            }
        }, 50);
        
        // Start warning glow in the last 2 seconds (faster animation)
        this.enlargeTimers.warningTimeout = setTimeout(() => {
            this.isWarning = true;
            this.glowIntensity = 0;
            
            this.enlargeTimers.warningInterval = setInterval(() => {
                this.warningGlowIntensity = 0.5 + Math.sin(Date.now() * 0.015) * 0.5; // Faster animation
            }, 30);
            
        }, 8000); // Start warning at 8 seconds (2 seconds before end)
        
        // End powerup effect after 10 seconds
        this.enlargeTimers.endTimeout = setTimeout(() => {
            this.width = this.originalWidth;
            this.isEnlarged = false;
            this.isWarning = false;
            this.glowIntensity = 0;
            this.warningGlowIntensity = 0;
            this.clearEnlargeTimers();
        }, 10000); // Effect lasts 10 seconds total
    }
    
    clearEnlargeTimers() {
        // Clear all active timers for paddle enlargement
        if (this.enlargeTimers.glowInterval) {
            clearInterval(this.enlargeTimers.glowInterval);
            this.enlargeTimers.glowInterval = null;
        }
        if (this.enlargeTimers.warningTimeout) {
            clearTimeout(this.enlargeTimers.warningTimeout);
            this.enlargeTimers.warningTimeout = null;
        }
        if (this.enlargeTimers.warningInterval) {
            clearInterval(this.enlargeTimers.warningInterval);
            this.enlargeTimers.warningInterval = null;
        }
        if (this.enlargeTimers.endTimeout) {
            clearTimeout(this.enlargeTimers.endTimeout);
            this.enlargeTimers.endTimeout = null;
        }
    }
}

class Brick {
    constructor(x, y, width = 75, height = 20) {
        this.position = new Vector2(x, y);
        this.width = width;
        this.height = height;
        this.destroyed = false;
        this.color = this.getRandomColor();
        this.destructionAnimation = 0;
        this.isDestroying = false;
    }
    
    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
        if (this.isDestroying) {
            this.destructionAnimation += 0.1;
            if (this.destructionAnimation >= 1) {
                this.destroyed = true;
                this.isDestroying = false;
            }
        }
    }
    
    startDestruction() {
        this.isDestroying = true;
        this.destructionAnimation = 0;
    }
    
    draw(ctx) {
        if (!this.destroyed) {
            if (this.isDestroying) {
                // Destruction animation
                ctx.save();
                const scale = 1 - this.destructionAnimation;
                const alpha = 1 - this.destructionAnimation;
                
                ctx.globalAlpha = alpha;
                ctx.translate(
                    this.position.x + this.width / 2, 
                    this.position.y + this.height / 2
                );
                ctx.scale(scale, scale);
                ctx.rotate(this.destructionAnimation * Math.PI * 0.5);
                
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
                
                ctx.restore();
            } else {
                // Normal drawing
                ctx.fillStyle = this.color;
                ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
            }
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
            
            this.startDestruction();
            
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
        this.particles = [];
        this.scorePopups = [];
        this.ballLaunched = false;
        
        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    init() {
        // Create paddle
        this.paddle = new Paddle(this.width / 2 - 50, this.height - 40);
        
        // Create initial ball
        this.balls = [new Ball(this.width / 2, this.height - 60)];
        this.ballLaunched = false;
        
        // Create bricks
        this.createBricks();
        
        // Reset powerups and effects
        this.powerups = [];
        this.particles = [];
        this.scorePopups = [];
        
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
        
        // Handle ball launch
        if (this.keys['ArrowUp'] && !this.ballLaunched) {
            let hasAttachedBalls = false;
            for (const ball of this.balls) {
                if (ball.attachedToPaddle) {
                    ball.launch();
                    hasAttachedBalls = true;
                }
            }
            if (hasAttachedBalls) {
                this.ballLaunched = true;
            }
        }
        
        // Update paddle
        this.paddle.update(this.keys, this.width);
        
        // Update balls
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            ball.update(this.paddle);
            
            // Skip collision checks for attached balls
            if (ball.attachedToPaddle) continue;
            
            // Check wall collisions
            if (ball.checkWallCollision(this.width, this.height)) {
                this.balls.splice(i, 1);
                continue;
            }
            
            // Check paddle collision
            ball.checkPaddleCollision(this.paddle);
            
            // Check brick collisions
            for (const brick of this.bricks) {
                if (!brick.destroyed && !brick.isDestroying && brick.checkCollision(ball)) {
                    this.score += 10;
                    
                    // Create particle explosion
                    this.createParticleExplosion(
                        brick.position.x + brick.width / 2,
                        brick.position.y + brick.height / 2,
                        brick.color,
                        8
                    );
                    
                    // Create score popup
                    this.scorePopups.push(new ScorePopup(
                        brick.position.x + brick.width / 2,
                        brick.position.y + brick.height / 2,
                        10
                    ));
                    
                    // Chance to spawn powerup (only once per brick)
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
                this.ballLaunched = false;
                
                // Remove all powerup effects when losing a life
                this.clearPowerupEffects();
            }
        }
        
        // Check win condition
        const activeBricks = this.bricks.filter(brick => !brick.destroyed);
        if (activeBricks.length === 0) {
            this.gameState = 'won';
            document.getElementById('gameWin').style.display = 'block';
            document.getElementById('winScore').textContent = this.score;
        }
        
        // Update bricks
        for (const brick of this.bricks) {
            brick.update();
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update score popups
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const popup = this.scorePopups[i];
            popup.update();
            if (popup.isDead()) {
                this.scorePopups.splice(i, 1);
            }
        }
        
        this.updateUI();
    }
    
    createParticleExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, Math.random() * 4 + 2));
        }
    }
    
    clearPowerupEffects() {
        // Reset paddle to original size and remove glow
        this.paddle.width = this.paddle.originalWidth;
        this.paddle.isEnlarged = false;
        this.paddle.isWarning = false;
        this.paddle.glowIntensity = 0;
        this.paddle.warningGlowIntensity = 0;
        
        // Clear any active powerup timers
        this.paddle.clearEnlargeTimers();
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
                    const newBall = new Ball(
                        originalBall.position.x - 20,
                        originalBall.position.y,
                        originalBall.radius
                    );
                    // If original ball is attached, new ball should also be attached
                    if (originalBall.attachedToPaddle) {
                        newBall.attachedToPaddle = true;
                        newBall.launched = false;
                    } else {
                        newBall.attachedToPaddle = false;
                        newBall.launched = true;
                        newBall.velocity = new Vector2(-3, -3);
                    }
                    this.balls.push(newBall);
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
        
        // Draw particles
        this.particles.forEach(particle => particle.draw(this.ctx));
        
        // Draw score popups
        this.scorePopups.forEach(popup => popup.draw(this.ctx));
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