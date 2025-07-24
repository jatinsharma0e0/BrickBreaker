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

class Laser {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, -8);
        this.width = 3;
        this.height = 15;
        this.color = '#ff0000';
        this.active = true;
    }
    
    update() {
        this.position.add(this.velocity);
    }
    
    draw(ctx) {
        if (this.active) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x - this.width/2, this.position.y, this.width, this.height);
            
            // Add glow effect
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.position.x - this.width, this.position.y, this.width * 2, this.height);
            ctx.restore();
        }
    }
    
    checkBrickCollision(brick) {
        if (!this.active || brick.destroyed || brick.isDestroying) return false;
        
        if (this.position.x >= brick.position.x && 
            this.position.x <= brick.position.x + brick.width &&
            this.position.y <= brick.position.y + brick.height && 
            this.position.y + this.height >= brick.position.y) {
            
            this.active = false;
            brick.startDestruction();
            return true;
        }
        return false;
    }
    
    isOffScreen() {
        return this.position.y + this.height < 0;
    }
}

class Shield {
    constructor(x, y, width = 200) {
        this.position = new Vector2(x, y);
        this.width = width;
        this.height = 8;
        this.color = '#95a5a6';
        this.active = true;
        this.hits = 0;
        this.maxHits = 5;
        this.alpha = 1.0;
    }
    
    update() {
        // Shield becomes more transparent as it takes damage
        this.alpha = (this.maxHits - this.hits) / this.maxHits;
        if (this.hits >= this.maxHits) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        if (this.active) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
            
            // Add energy effect
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
            ctx.restore();
        }
    }
    
    checkBallCollision(ball) {
        if (!this.active) return false;
        
        const ballLeft = ball.position.x - ball.radius;
        const ballRight = ball.position.x + ball.radius;
        const ballTop = ball.position.y - ball.radius;
        const ballBottom = ball.position.y + ball.radius;
        
        if (ballRight >= this.position.x && 
            ballLeft <= this.position.x + this.width &&
            ballBottom >= this.position.y && 
            ballTop <= this.position.y + this.height) {
            
            ball.velocity.y = -Math.abs(ball.velocity.y);
            ball.position.y = this.position.y - ball.radius;
            this.hits++;
            return true;
        }
        return false;
    }
}

class LaserBarrel {
    constructor(paddleX, paddleY, paddleWidth) {
        this.position = new Vector2(paddleX + paddleWidth / 2, paddleY - 8);
        this.width = 12;
        this.height = 16;
        this.color = '#e74c3c';
        this.isDestroying = false;
        this.destructionTimer = 0;
        this.pieces = [];
        this.paddleWidth = paddleWidth;
        this.paddleX = paddleX;
    }
    
    update(paddleX, paddleWidth) {
        // Update position to stay centered on paddle
        this.paddleX = paddleX;
        this.paddleWidth = paddleWidth;
        this.position.x = paddleX + paddleWidth / 2;
        
        if (this.isDestroying) {
            this.destructionTimer += 0.02;
            
            // Update destruction pieces
            for (let piece of this.pieces) {
                piece.position.add(piece.velocity);
                piece.velocity.y += 0.1; // Gravity
                piece.rotation += piece.rotationSpeed;
                piece.alpha = Math.max(0, 1 - this.destructionTimer * 2);
            }
        }
    }
    
    startDestruction() {
        this.isDestroying = true;
        this.destructionTimer = 0;
        
        // Create destruction pieces
        const numPieces = 8;
        for (let i = 0; i < numPieces; i++) {
            this.pieces.push({
                position: new Vector2(
                    this.position.x + (Math.random() - 0.5) * this.width,
                    this.position.y + (Math.random() - 0.5) * this.height
                ),
                velocity: new Vector2(
                    (Math.random() - 0.5) * 4,
                    Math.random() * -3 - 1
                ),
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                alpha: 1,
                color: this.color
            });
        }
    }
    
    draw(ctx) {
        if (this.isDestroying) {
            // Draw destruction pieces
            for (let piece of this.pieces) {
                if (piece.alpha > 0) {
                    ctx.save();
                    ctx.globalAlpha = piece.alpha;
                    ctx.translate(piece.position.x, piece.position.y);
                    ctx.rotate(piece.rotation);
                    ctx.fillStyle = piece.color;
                    ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
                    ctx.restore();
                }
            }
        } else {
            // Draw intact barrel
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x - this.width / 2, this.position.y, this.width, this.height);
            
            // Add barrel details
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.position.x - this.width / 2, this.position.y, this.width, this.height);
            
            // Add barrel tip
            ctx.fillStyle = '#34495e';
            ctx.fillRect(this.position.x - 2, this.position.y - 3, 4, 3);
            
            // Add side details
            ctx.strokeStyle = '#a93226';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.position.x - this.width / 2 + 2, this.position.y + 4);
            ctx.lineTo(this.position.x + this.width / 2 - 2, this.position.y + 4);
            ctx.moveTo(this.position.x - this.width / 2 + 2, this.position.y + 8);
            ctx.lineTo(this.position.x + this.width / 2 - 2, this.position.y + 8);
            ctx.moveTo(this.position.x - this.width / 2 + 2, this.position.y + 12);
            ctx.lineTo(this.position.x + this.width / 2 - 2, this.position.y + 12);
            ctx.stroke();
        }
    }
    
    isDestructionComplete() {
        return this.isDestroying && this.destructionTimer > 1;
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
        this.isFireball = false;
        this.originalSpeed = 4;
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
        
        // Enhanced glow effect for fireball
        if (this.isFireball) {
            // Outer glow (orange)
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#ff8c00';
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius + 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Inner glow (yellow)
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius + 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            // Normal glow effect
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius + 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
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
        this.isSticky = false;
        this.hasLaser = false;
        this.powerupTimers = [];
        this.barrel = null;
        this.stickyGlowIntensity = 0;
        this.stickyTimers = {
            glowInterval: null,
            endTimeout: null,
            particleInterval: null
        };
        this.stickyParticles = [];
    }
    
    update(keys, canvasWidth) {
        if (keys.ArrowLeft && this.position.x > 0) {
            this.position.x -= this.speed;
        }
        if (keys.ArrowRight && this.position.x + this.width < canvasWidth) {
            this.position.x += this.speed;
        }
        
        // Update barrel position if it exists
        if (this.barrel) {
            this.barrel.update(this.position.x, this.width);
            
            // Remove barrel if destruction is complete
            if (this.barrel.isDestructionComplete()) {
                this.barrel = null;
            }
        }
        
        // Update sticky particles
        for (let i = this.stickyParticles.length - 1; i >= 0; i--) {
            const particle = this.stickyParticles[i];
            particle.position.add(particle.velocity);
            particle.velocity.y += 0.05; // Gravity
            particle.life -= 0.02;
            particle.alpha = Math.max(0, particle.life);
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.stickyParticles.splice(i, 1);
            }
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
        // Draw sticky glow effect (purple) when sticky is active
        else if (this.isSticky && this.stickyGlowIntensity > 0) {
            ctx.save();
            ctx.globalAlpha = this.stickyGlowIntensity * 0.6;
            ctx.fillStyle = '#9b59b6';
            ctx.fillRect(this.position.x - 3, this.position.y - 3, this.width + 6, this.height + 6);
            ctx.restore();
        }
        
        // Draw main paddle
        let paddleColor = this.color;
        if (this.isWarning) {
            paddleColor = '#ff4444';
        } else if (this.isSticky) {
            paddleColor = '#9b59b6';
        }
        
        ctx.fillStyle = paddleColor;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        
        // Add border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
        
        // Draw laser barrel if active
        if (this.barrel) {
            this.barrel.draw(ctx);
        }
        
        // Draw sticky particles
        for (const particle of this.stickyParticles) {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
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
    
    clearStickyTimers() {
        if (this.stickyTimers.glowInterval) {
            clearInterval(this.stickyTimers.glowInterval);
            this.stickyTimers.glowInterval = null;
        }
        if (this.stickyTimers.endTimeout) {
            clearTimeout(this.stickyTimers.endTimeout);
            this.stickyTimers.endTimeout = null;
        }
        if (this.stickyTimers.particleInterval) {
            clearInterval(this.stickyTimers.particleInterval);
            this.stickyTimers.particleInterval = null;
        }
        // Clear all sticky particles
        this.stickyParticles = [];
    }
    
    activateSticky() {
        // Clear any existing sticky timers
        this.clearStickyTimers();
        
        this.isSticky = true;
        this.stickyGlowIntensity = 1.0;
        
        // Animate purple glow
        this.stickyTimers.glowInterval = setInterval(() => {
            this.stickyGlowIntensity = 0.5 + Math.sin(Date.now() * 0.008) * 0.5;
        }, 50);
        
        // Create sticky particles
        this.stickyTimers.particleInterval = setInterval(() => {
            // Create 2-3 particles every interval
            const numParticles = Math.floor(Math.random() * 2) + 2;
            for (let i = 0; i < numParticles; i++) {
                this.stickyParticles.push({
                    position: new Vector2(
                        this.position.x + Math.random() * this.width,
                        this.position.y + this.height
                    ),
                    velocity: new Vector2(
                        (Math.random() - 0.5) * 1.5,
                        Math.random() * 0.5 + 0.5
                    ),
                    size: Math.random() * 2 + 1,
                    color: '#9b59b6',
                    life: 1.0,
                    alpha: 1.0
                });
            }
        }, 100);
        
        // End sticky effect after 10 seconds
        this.stickyTimers.endTimeout = setTimeout(() => {
            this.isSticky = false;
            this.stickyGlowIntensity = 0;
            this.clearStickyTimers();
        }, 10000);
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
            
            // Only bounce off bricks if it's NOT a fireball
            if (!ball.isFireball) {
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
            }
            // Fireball continues through without changing direction
            
            return true;
        }
        return false;
    }
}

class Powerup {
    constructor(x, y, type) {
        this.position = new Vector2(x, y);
        this.type = type; // 'largePaddle', 'extraLife', 'multiBall'
        // Set width based on powerup type
        if (type === 'largePaddle' || type === 'stickyPaddle') {
            this.width = 32;
            this.height = 16;
        } else {
            this.width = 20;
            this.height = 20;
        }
        this.velocity = new Vector2(0, 2);
        this.collected = false;
        this.colors = {
            largePaddle: '#4ecdc4',
            extraLife: '#ff6b6b',
            multiBall: '#ffff00', // Bright yellow for multi-ball
            stickyPaddle: '#9b59b6',
            laserPaddle: '#e74c3c',
            slowMotion: '#3498db',
            shield: '#95a5a6',
            fireball: '#e67e22',
            mysteryBox: '#ff69b4' // Hot pink for mystery box
        };
        this.symbols = {
            largePaddle: null, // Custom rectangle
            extraLife: '❤️',
            multiBall: null, // Custom triangle ball formation
            stickyPaddle: null, // Custom rectangle (same as largePaddle)
            laserPaddle: '🔫',
            slowMotion: '⏳',
            shield: '🛡️',
            fireball: '🔥',
            mysteryBox: '?'
        };
    }
    
    update() {
        this.position.add(this.velocity);
    }
    
    draw(ctx) {
        if (!this.collected) {
            if (this.type === 'largePaddle') {
                // Draw wide green rectangle for larger paddle powerup
                ctx.fillStyle = '#4ecdc4';
                ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
                
                // Add border
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
                
                // Add inner highlight to show it's a paddle
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.position.x + 2, this.position.y + 2, this.width - 4, this.height - 4);
            } else if (this.type === 'stickyPaddle') {
                // Draw wide purple rectangle for sticky paddle powerup
                ctx.fillStyle = '#9b59b6';
                ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
                
                // Add border
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
                
                // Add inner highlight to show it's a paddle
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(this.position.x + 2, this.position.y + 2, this.width - 4, this.height - 4);
            } else if (this.type === 'mysteryBox') {
                // Draw animated mystery box with sparkle effects
                ctx.fillStyle = this.colors[this.type];
                ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
                
                // Add border
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
                
                // Add animated glow effect
                const glowIntensity = 0.5 + Math.sin(Date.now() * 0.008) * 0.3;
                ctx.save();
                ctx.globalAlpha = glowIntensity;
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(this.position.x - 1, this.position.y - 1, this.width + 2, this.height + 2);
                ctx.restore();
                
                // Draw question mark
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    this.symbols[this.type], 
                    this.position.x + this.width / 2, 
                    this.position.y + this.height / 2
                );
            } else if (this.type === 'multiBall') {
                // Draw custom multi-ball design: three balls in triangle formation (no background)
                const centerX = this.position.x + this.width / 2;
                const centerY = this.position.y + this.height / 2;
                const ballRadius = 4;
                const spacing = 6;
                
                // Calculate positions for three balls in triangle formation
                // Top ball (A)
                const topX = centerX;
                const topY = centerY - spacing;
                
                // Bottom left ball (C) 
                const bottomLeftX = centerX - spacing;
                const bottomLeftY = centerY + spacing;
                
                // Bottom right ball (B)
                const bottomRightX = centerX + spacing;
                const bottomRightY = centerY + spacing;
                
                // Draw motion blur lines first (behind balls)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1.5;
                
                // Motion blur lines for each ball
                ctx.beginPath();
                ctx.moveTo(topX - 4, topY);
                ctx.lineTo(topX + 4, topY);
                ctx.moveTo(bottomLeftX - 4, bottomLeftY);
                ctx.lineTo(bottomLeftX + 4, bottomLeftY);
                ctx.moveTo(bottomRightX - 4, bottomRightY);
                ctx.lineTo(bottomRightX + 4, bottomRightY);
                ctx.stroke();
                
                // Draw glow effect for each ball
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#ffff00';
                
                ctx.beginPath();
                ctx.arc(topX, topY, ballRadius + 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(bottomLeftX, bottomLeftY, ballRadius + 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(bottomRightX, bottomRightY, ballRadius + 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
                
                // Draw the three balls (main spheres)
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#cccccc';
                ctx.lineWidth = 0.5;
                
                // Top ball (A)
                ctx.beginPath();
                ctx.arc(topX, topY, ballRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Bottom left ball (C)
                ctx.beginPath();
                ctx.arc(bottomLeftX, bottomLeftY, ballRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Bottom right ball (B)
                ctx.beginPath();
                ctx.arc(bottomRightX, bottomRightY, ballRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Add highlight to each ball for 3D effect
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                
                // Highlights
                ctx.beginPath();
                ctx.arc(topX - 1, topY - 1, ballRadius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(bottomLeftX - 1, bottomLeftY - 1, ballRadius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(bottomRightX - 1, bottomRightY - 1, ballRadius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                
            } else {
                // Draw symbol (emoji or letter)
                if (this.symbols[this.type]) {
                    if (this.isEmoji(this.symbols[this.type])) {
                        // Draw emoji without background
                        ctx.font = '16px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(
                            this.symbols[this.type], 
                            this.position.x + this.width / 2, 
                            this.position.y + this.height / 2
                        );
                    } else {
                        // Draw powerup background for letter types only
                        ctx.fillStyle = this.colors[this.type];
                        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
                        
                        // Add border
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
                        
                        // Draw letter
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 12px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(
                            this.symbols[this.type], 
                            this.position.x + this.width / 2, 
                            this.position.y + this.height / 2
                        );
                    }
                }
            }
        }
    }
    
    isEmoji(str) {
        // Simple emoji detection for the specific emojis we're using
        const emojiList = ['❤️', '🔫', '⏳', '🛡️', '🔥'];
        return emojiList.includes(str);
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
        this.lasers = [];
        this.shield = null;
        this.slowMotionActive = false;
        this.slowMotionTimer = null;
        this.laserTimer = null;
        this.fireballTimer = null;
        
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
        this.lasers = [];
        this.shield = null;
        
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
        
        // Handle laser shooting
        if (this.keys['Space'] && this.paddle.hasLaser) {
            this.fireLaser();
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
            if (ball.checkPaddleCollision(this.paddle)) {
                // Sticky paddle effect
                if (this.paddle.isSticky && !ball.attachedToPaddle) {
                    ball.attachedToPaddle = true;
                    ball.launched = false;
                    this.ballLaunched = false;
                }
            }
            
            // Check shield collision
            if (this.shield && this.shield.active) {
                this.shield.checkBallCollision(ball);
            }
            
            // Check brick collisions
            for (const brick of this.bricks) {
                if (!brick.destroyed && !brick.isDestroying && brick.checkCollision(ball)) {
                    this.handleBrickDestruction(brick, ball.isFireball);
                    
                    // Fireball continues through bricks
                    if (!ball.isFireball) {
                        break;
                    }
                }
            }
        }
        
        // Update lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.update();
            
            // Check laser-brick collisions
            for (const brick of this.bricks) {
                if (laser.checkBrickCollision(brick)) {
                    this.handleBrickDestruction(brick, false);
                    break;
                }
            }
            
            // Remove inactive or off-screen lasers
            if (!laser.active || laser.isOffScreen()) {
                this.lasers.splice(i, 1);
            }
        }
        
        // Update shield
        if (this.shield) {
            this.shield.update();
            if (!this.shield.active) {
                this.shield = null;
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
        this.paddle.clearStickyTimers();
        this.paddle.isSticky = false;
        this.paddle.hasLaser = false;
        this.paddle.barrel = null;
        
        // Clear other powerup effects
        this.lasers = [];
        this.shield = null;
        this.slowMotionActive = false;
        if (this.slowMotionTimer) {
            clearTimeout(this.slowMotionTimer);
            this.slowMotionTimer = null;
        }
        
        // Clear laser timer
        if (this.laserTimer) {
            clearTimeout(this.laserTimer);
            this.laserTimer = null;
        }
        
        // Clear fireball timer and reset balls to normal
        if (this.fireballTimer) {
            clearTimeout(this.fireballTimer);
            this.fireballTimer = null;
        }
        this.balls.forEach(ball => {
            ball.isFireball = false;
            ball.color = '#fff';
        });
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
                // Check if any balls are currently attached to paddle
                const hasAttachedBalls = this.balls.some(ball => ball.attachedToPaddle);
                
                if (hasAttachedBalls) {
                    // Scenario 1: Ball is attached to paddle - spawn 3 balls from paddle
                    const paddleCenterX = this.paddle.position.x + this.paddle.width / 2;
                    const paddleTopY = this.paddle.position.y - 10;
                    
                    // Clear all existing balls
                    this.balls = [];
                    
                    // Create 3 new balls positioned on the paddle
                    for (let i = 0; i < 3; i++) {
                        const offsetX = (i - 1) * 15; // Spread balls: -15, 0, +15
                        const newBall = new Ball(
                            paddleCenterX + offsetX,
                            paddleTopY,
                            8
                        );
                        newBall.attachedToPaddle = true;
                        newBall.launched = false;
                        this.balls.push(newBall);
                    }
                    
                    // Reset ball launch state so all 3 can be launched together
                    this.ballLaunched = false;
                } else {
                    // Scenario 2: Balls are bouncing - spawn 2 additional balls from existing ball positions
                    const existingBalls = [...this.balls]; // Copy current balls
                    
                    for (const ball of existingBalls) {
                        // Create first additional ball with slight left trajectory
                        const newBall1 = new Ball(
                            ball.position.x - 10,
                            ball.position.y,
                            ball.radius
                        );
                        newBall1.attachedToPaddle = false;
                        newBall1.launched = true;
                        newBall1.velocity = new Vector2(ball.velocity.x - 1.5, ball.velocity.y);
                        this.balls.push(newBall1);
                        
                        // Create second additional ball with slight right trajectory
                        const newBall2 = new Ball(
                            ball.position.x + 10,
                            ball.position.y,
                            ball.radius
                        );
                        newBall2.attachedToPaddle = false;
                        newBall2.launched = true;
                        newBall2.velocity = new Vector2(ball.velocity.x + 1.5, ball.velocity.y);
                        this.balls.push(newBall2);
                    }
                }
                break;
            case 'stickyPaddle':
                this.activateStickyPaddle();
                break;
            case 'laserPaddle':
                this.activateLaserPaddle();
                break;
            case 'slowMotion':
                this.activateSlowMotion();
                break;
            case 'shield':
                this.activateShield();
                break;
            case 'fireball':
                this.activateFireball();
                break;
            case 'mysteryBox':
                this.activateMysteryBox();
                break;
        }
    }
    
    handleBrickDestruction(brick, isFireball) {
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
            const powerupTypes = ['largePaddle', 'extraLife', 'multiBall', 'stickyPaddle', 'laserPaddle', 'slowMotion', 'shield', 'fireball', 'mysteryBox'];
            const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
            
            // Create powerup with proper centering
            const powerup = new Powerup(0, 0, randomType); // Temporary position
            const powerupX = brick.position.x + brick.width / 2 - powerup.width / 2;
            const powerupY = brick.position.y + brick.height;
            
            powerup.position.x = powerupX;
            powerup.position.y = powerupY;
            
            this.powerups.push(powerup);
        }
    }
    
    fireLaser() {
        if (this.lasers.length < 3) { // Limit laser count
            this.lasers.push(new Laser(
                this.paddle.position.x + this.paddle.width / 2,
                this.paddle.position.y
            ));
        }
    }
    
    activateStickyPaddle() {
        this.paddle.activateSticky();
    }
    
    activateLaserPaddle() {
        // Clear existing laser timer if active
        if (this.laserTimer) {
            clearTimeout(this.laserTimer);
        }
        
        this.paddle.hasLaser = true;
        
        // Create barrel on paddle
        this.paddle.barrel = new LaserBarrel(
            this.paddle.position.x,
            this.paddle.position.y,
            this.paddle.width
        );
        
        this.laserTimer = setTimeout(() => {
            this.paddle.hasLaser = false;
            
            // Start barrel destruction animation
            if (this.paddle.barrel && !this.paddle.barrel.isDestroying) {
                this.paddle.barrel.startDestruction();
            }
            this.laserTimer = null;
        }, 10000);
    }
    
    activateSlowMotion() {
        if (this.slowMotionTimer) {
            clearTimeout(this.slowMotionTimer);
        }
        
        this.slowMotionActive = true;
        
        // Slow down all balls
        this.balls.forEach(ball => {
            if (!ball.attachedToPaddle) {
                ball.velocity.multiply(0.5);
            }
        });
        
        this.slowMotionTimer = setTimeout(() => {
            this.slowMotionActive = false;
            // Speed up all balls back to normal
            this.balls.forEach(ball => {
                if (!ball.attachedToPaddle) {
                    ball.velocity.multiply(2);
                }
            });
        }, 8000);
    }
    
    activateShield() {
        // Reset shield to full health if already exists
        this.shield = new Shield(
            0,
            this.paddle.position.y + this.paddle.height + 10,
            this.width
        );
    }
    
    activateFireball() {
        // Clear existing fireball timer if active
        if (this.fireballTimer) {
            clearTimeout(this.fireballTimer);
        }
        
        this.balls.forEach(ball => {
            ball.isFireball = true;
            ball.color = '#ff4500';
        });
        
        this.fireballTimer = setTimeout(() => {
            this.balls.forEach(ball => {
                ball.isFireball = false;
                ball.color = '#fff';
            });
            this.fireballTimer = null;
        }, 8000);
    }
    
    activateMysteryBox() {
        // Create a list of possible powerup effects (excluding mysteryBox to prevent infinite loop)
        const mysteryPowerups = ['largePaddle', 'extraLife', 'multiBall', 'stickyPaddle', 'laserPaddle', 'slowMotion', 'shield', 'fireball'];
        
        // Pick a random powerup effect
        const randomEffect = mysteryPowerups[Math.floor(Math.random() * mysteryPowerups.length)];
        
        // Create visual effect to show what powerup was chosen
        this.createParticleExplosion(
            this.paddle.position.x + this.paddle.width / 2,
            this.paddle.position.y - 20,
            '#ff69b4', // Pink particles for mystery effect
            12
        );
        
        // Apply the random powerup effect
        this.applyPowerup(randomEffect);
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
        
        // Draw lasers
        this.lasers.forEach(laser => laser.draw(this.ctx));
        
        // Draw shield
        if (this.shield) {
            this.shield.draw(this.ctx);
        }
        
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