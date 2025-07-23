# Brick Breaker Game

A classic Brick Breaker arcade game built with pure HTML5, CSS3, and JavaScript.

## Features

- 🎮 Classic brick breaking gameplay
- 🎯 Colorful brick grid with random colors
- ⚡ Three types of falling powerups:
  - 🟦 **Larger Paddle** (W) - Increases paddle size for 10 seconds
  - 🟥 **Extra Life** (+) - Adds an additional life
  - 🟨 **Multi-Ball** (M) - Splits the ball into two balls
- 🎚️ Score tracking and lives system
- 🏆 Win/Game Over screens with restart functionality
- 📱 Responsive design with beautiful gradient background

## How to Play

1. Open `index.html` in your web browser
2. Use the **left ← and right →** arrow keys to move the paddle
3. Keep the ball bouncing to break all the bricks
4. Collect falling powerups by catching them with your paddle
5. Break all bricks to win or lose all lives for game over
6. Click "Restart Game" to play again

## Game Mechanics

- **Paddle Control**: Smooth left/right movement with arrow keys
- **Ball Physics**: Realistic bouncing with angle variation based on paddle hit position
- **Brick Collision**: Smart collision detection with proper ball reflection
- **Powerup Drops**: 25% chance for bricks to drop powerups when destroyed
- **Scoring**: 10 points per brick destroyed
- **Lives**: Start with 3 lives, lose one when ball goes off screen

## Technical Details

- **Pure Vanilla JavaScript** - No frameworks or dependencies
- **HTML5 Canvas** - Smooth 60fps animation using requestAnimationFrame
- **Object-Oriented Design** - Clean class structure for game entities
- **Modular Code** - Separated HTML, CSS, and JavaScript files
- **Cross-Browser Compatible** - Works in all modern browsers

## File Structure

```
.
├── index.html          # Main game HTML file
├── js/
│   └── game.js        # Game logic and classes
├── assets/            # Directory for future game assets
└── README.md          # This file
```

## Classes Overview

- **Vector2**: 2D vector math utilities
- **Ball**: Ball entity with physics and collision detection
- **Paddle**: Player-controlled paddle with movement and powerup effects
- **Brick**: Destructible brick entities with collision detection
- **Powerup**: Falling powerup items with different effects
- **Game**: Main game controller managing all entities and game state

## Browser Requirements

- Any modern web browser with HTML5 Canvas support
- JavaScript enabled
- No internet connection required (fully offline)

## Installation

No installation required! Simply download the files and open `index.html` in your browser.

---

**Enjoy the game!** 🎮