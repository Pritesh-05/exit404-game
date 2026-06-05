// minigames/maze.js
// FUTURISTIC AI THEME - ENHANCED DIFFICULTY & UI

// Configuration
let MAZE_WIDTH;
let MAZE_HEIGHT;
const MAZE_CELL_SIZE = 40;
let MAZE_GRID_WIDTH;
let MAZE_GRID_HEIGHT;
const SIDEBAR_WIDTH = 320; // Slightly wider for more UI elements

// --- GLOBAL FLAG FOR INSTRUCTIONS ---
if (typeof window.mazeInstructionsSeen === 'undefined') {
    window.mazeInstructionsSeen = false;
}

// Colors - Futuristic neon theme
const MAZE_COLORS = {   
    BACKGROUND: '#0a0a0f',
    SIDEBAR_BG: '#0d0d1a',
    SIDEBAR_BORDER: '#2a3f5e',
    
    // Game Elements
    MAZE: '#1e3a5f',
    WALL: '#0f172a', // Deep navy with slight glow
    PATH: '#03050b', // Near black with blue undertone
    
    PLAYER: '#0ff', // Cyan
    PLAYER_GLOW: 'rgba(0, 255, 255, 0.6)',
    ENEMY: '#f0f', // Magenta
    ENEMY2: '#ff5e00', // Orange
    ENEMY3: '#ffaa00', // Gold
    EXIT: '#ffd966',
    EXIT_GLOW: 'rgba(255, 215, 0, 0.7)',
    
    // UI Text
    TEXT: '#0ff',
    TEXT_WARN: '#ffaa00',
    TEXT_CRIT: '#ff3b3b',
    TEXT_INFO: '#3a86ff',
    WHITE: '#e0e0ff',
    GLOW: 'rgba(0, 255, 255, 0.3)',
    NEON_PINK: '#ff66cc',
    NEON_BLUE: '#4da6ff'
};

// Input State
window.keys = window.keys || {};

window.addEventListener('keydown', (e) => {
    window.keys[e.key] = true;
    window.keys[e.code] = true;
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight", "Space"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    window.keys[e.key] = false;
    window.keys[e.code] = false;
});

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- Virus Class (Enhanced AI) ---
class Virus {
    constructor(x, y, color = null, speedBase = 1.2, angrySpeed = 2.0, aggression = 0.95) {
        this.x = x;
        this.y = y;
        this.gridX = Math.floor(x / MAZE_CELL_SIZE);
        this.gridY = Math.floor(y / MAZE_CELL_SIZE);
        
        this.baseSpeed = speedBase;
        this.angrySpeed = angrySpeed;
        this.speed = this.baseSpeed;
        this.aggression = aggression; // Probability to choose optimal direction
        
        this.direction = randomChoice(["up", "down", "left", "right"]);
        this.nextDirection = null;
        this.pulse = 0;
        this.angry = false;
        this.angryTimer = 0;
        this.customColor = color;
        
        // For difficulty scaling
        this.speedMultiplier = 1.0;
    }

    update(mazeGrid, playerPos, globalSpeedMultiplier = 1.0) {
        this.pulse += 0.08; // Faster pulse
        
        // Apply global speed multiplier
        let currentSpeed = this.speed * globalSpeedMultiplier;
        
        this.gridX = Math.floor(this.x / MAZE_CELL_SIZE);
        this.gridY = Math.floor(this.y / MAZE_CELL_SIZE);

        this.gridX = Math.max(0, Math.min(this.gridX, mazeGrid[0].length - 1));
        this.gridY = Math.max(0, Math.min(this.gridY, mazeGrid.length - 1));

        const [px, py] = playerPos;
        const pxGrid = Math.floor(px / MAZE_CELL_SIZE);
        const pyGrid = Math.floor(py / MAZE_CELL_SIZE);

        const distanceToPlayer = Math.hypot(this.x - px, this.y - py);

        // Angry trigger: closer or random chance increases with time
        if (distanceToPlayer < 300 && Math.random() < 0.02) {
            this.angry = true;
            this.angryTimer = 300; // Longer angry duration
            this.speed = this.angrySpeed;
        }

        if (this.angry) {
            this.angryTimer--;
            if (this.angryTimer <= 0) {
                this.angry = false;
                this.speed = this.baseSpeed;
            }
        }

        // Pathfinding (Smart lookahead)
        let possibleDirs = [];
        if (this.gridY > 0 && mazeGrid[this.gridY - 1][this.gridX] === 0) possibleDirs.push("up");
        if (this.gridY < mazeGrid.length - 1 && mazeGrid[this.gridY + 1][this.gridX] === 0) possibleDirs.push("down");
        if (this.gridX > 0 && mazeGrid[this.gridY][this.gridX - 1] === 0) possibleDirs.push("left");
        if (this.gridX < mazeGrid[0].length - 1 && mazeGrid[this.gridY][this.gridX + 1] === 0) possibleDirs.push("right");

        const opposite = { "up": "down", "down": "up", "left": "right", "right": "left" };
        if (possibleDirs.includes(opposite[this.direction]) && possibleDirs.length > 1) {
            possibleDirs = possibleDirs.filter(d => d !== opposite[this.direction]);
        }

        if (possibleDirs.length > 0) {
            let bestDir = null;
            let minDist = Infinity;

            for (let dir of possibleDirs) {
                let testX = this.gridX;
                let testY = this.gridY;

                if (dir === "up") testY -= 1;
                else if (dir === "down") testY += 1;
                else if (dir === "left") testX -= 1;
                else if (dir === "right") testX += 1;

                if (testX >= 0 && testX < mazeGrid[0].length && testY >= 0 && testY < mazeGrid.length) {
                    // Manhattan distance
                    const dist = Math.abs(testX - pxGrid) + Math.abs(testY - pyGrid);
                    if (dist < minDist) {
                        minDist = dist;
                        bestDir = dir;
                    }
                }
            }

            // Higher aggression means more likely to take best direction
            if (bestDir && Math.random() < this.aggression) {
                this.nextDirection = bestDir;
            } else {
                this.nextDirection = randomChoice(possibleDirs);
            }
        } else {
            this.nextDirection = opposite[this.direction] || randomChoice(["up", "down", "left", "right"]);
        }

        this.move(mazeGrid, currentSpeed);
    }

    move(mazeGrid, currentSpeed) {
        const centeredX = Math.abs(this.x % MAZE_CELL_SIZE - MAZE_CELL_SIZE / 2) < currentSpeed;
        const centeredY = Math.abs(this.y % MAZE_CELL_SIZE - MAZE_CELL_SIZE / 2) < currentSpeed;

        if (this.nextDirection && centeredX && centeredY) {
            if (this.canMove(this.nextDirection, mazeGrid)) {
                this.direction = this.nextDirection;
                this.nextDirection = null;
                this.x = this.gridX * MAZE_CELL_SIZE + MAZE_CELL_SIZE/2;
                this.y = this.gridY * MAZE_CELL_SIZE + MAZE_CELL_SIZE/2;
            }
        }

        let dx = 0, dy = 0;
        if (this.direction === "up") dy = -currentSpeed;
        else if (this.direction === "down") dy = currentSpeed;
        else if (this.direction === "left") dx = -currentSpeed;
        else if (this.direction === "right") dx = currentSpeed;

        const newX = this.x + dx;
        const newY = this.y + dy;

        const gridX = Math.floor(newX / MAZE_CELL_SIZE);
        const gridY = Math.floor(newY / MAZE_CELL_SIZE);

        if (gridX >= 0 && gridX < mazeGrid[0].length && gridY >= 0 && gridY < mazeGrid.length) {
            if (mazeGrid[gridY][gridX] === 0) {
                this.x = newX;
                this.y = newY;
            } else {
                this.findNewDirection(mazeGrid);
            }
        } else {
            this.findNewDirection(mazeGrid);
        }
    }

    findNewDirection(mazeGrid) {
        let possibleDirs = [];
        if (this.gridY > 0 && mazeGrid[this.gridY - 1][this.gridX] === 0) possibleDirs.push("up");
        if (this.gridY < mazeGrid.length - 1 && mazeGrid[this.gridY + 1][this.gridX] === 0) possibleDirs.push("down");
        if (this.gridX > 0 && mazeGrid[this.gridY][this.gridX - 1] === 0) possibleDirs.push("left");
        if (this.gridX < mazeGrid[0].length - 1 && mazeGrid[this.gridY][this.gridX + 1] === 0) possibleDirs.push("right");

        if (possibleDirs.length > 0) {
            this.direction = randomChoice(possibleDirs);
        }
    }

    canMove(direction, mazeGrid) {
        let testX = this.gridX;
        let testY = this.gridY;
        if (direction === "up") testY -= 1;
        else if (direction === "down") testY += 1;
        else if (direction === "left") testX -= 1;
        else if (direction === "right") testX += 1;

        if (testX >= 0 && testX < mazeGrid[0].length && testY >= 0 && testY < mazeGrid.length) {
            return mazeGrid[testY][testX] === 0;
        }
        return false;
    }

    draw(ctx) {
        const size = 18; // Slightly larger
        const pulseSize = size + Math.sin(this.pulse) * 5;
        let baseColor = this.customColor || MAZE_COLORS.ENEMY;
        let color = this.angry ? '#ff0066' : baseColor; 
        
        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;

        if (this.angry) {
            ctx.save();
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 30;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, pulseSize * 1.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Core
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Spikes / Data fragments
        const spikeCount = this.angry ? 12 : 8;
        for (let i = 0; i < spikeCount; i++) {
            const angle = i * (2 * Math.PI / spikeCount) + this.pulse * 0.5;
            const spikeLength = this.angry ? pulseSize * 1.5 : pulseSize * 1.3;
            const spikeX = this.x + Math.cos(angle) * spikeLength;
            const spikeY = this.y + Math.sin(angle) * spikeLength;
            ctx.beginPath();
            ctx.arc(spikeX, spikeY, this.angry ? 5 : 3, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }

        // Eyes (glowing)
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(this.x + 7, this.y - 5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x - 7, this.y - 5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0ff';
        ctx.shadowColor = '#0ff';
        ctx.beginPath(); ctx.arc(this.x + 7, this.y - 5, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x - 7, this.y - 5, 2, 0, Math.PI * 2); ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }
}

// --- Maze Class (Enhanced generation: more dead ends) ---
class Maze {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = Array(height).fill().map(() => Array(width).fill(1));
        this.playerPos = [MAZE_CELL_SIZE * 1.5, MAZE_CELL_SIZE * 1.5];
        this.exitPos = [width - 2, height - 2];
        this.generateMaze();
    }

    generateMaze() {
        // Randomized Prim's algorithm for more organic, challenging layout
        const walls = [];
        // Start at (1,1)
        this.grid[1][1] = 0;
        // Add frontier walls
        const addWalls = (x, y) => {
            if (x > 1 && this.grid[y][x-2] === 1) walls.push([x-1, y, x-2, y]);
            if (x < this.width-2 && this.grid[y][x+2] === 1) walls.push([x+1, y, x+2, y]);
            if (y > 1 && this.grid[y-2][x] === 1) walls.push([x, y-1, x, y-2]);
            if (y < this.height-2 && this.grid[y+2][x] === 1) walls.push([x, y+1, x, y+2]);
        };
        addWalls(1, 1);

        while (walls.length > 0) {
            const index = Math.floor(Math.random() * walls.length);
            const [wx, wy, nx, ny] = walls[index];
            walls.splice(index, 1);

            if (this.grid[wy][wx] === 1 && this.grid[ny][nx] === 1) {
                this.grid[wy][wx] = 0;
                this.grid[ny][nx] = 0;
                addWalls(nx, ny);
            }
        }

        // Ensure exit is open
        this.grid[this.exitPos[1]][this.exitPos[0]] = 0;
        // Clear start area
        this.grid[1][2] = 0; this.grid[2][1] = 0;
    }

    draw(ctx) {
        // Draw with subtle grid lines and glow
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                ctx.fillStyle = (this.grid[y][x] === 1) ? MAZE_COLORS.WALL : MAZE_COLORS.PATH;
                ctx.fillRect(x * MAZE_CELL_SIZE, y * MAZE_CELL_SIZE, MAZE_CELL_SIZE, MAZE_CELL_SIZE);
                
                // Add a subtle neon outline to walls
                if (this.grid[y][x] === 1) {
                    ctx.strokeStyle = '#1e3a5f';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x * MAZE_CELL_SIZE, y * MAZE_CELL_SIZE, MAZE_CELL_SIZE, MAZE_CELL_SIZE);
                }
            }
        }

        const exitX = this.exitPos[0] * MAZE_CELL_SIZE;
        const exitY = this.exitPos[1] * MAZE_CELL_SIZE;
        const exitCenterX = exitX + MAZE_CELL_SIZE / 2;
        const exitCenterY = exitY + MAZE_CELL_SIZE / 2;

        // Glowing exit
        const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
        ctx.shadowColor = MAZE_COLORS.EXIT_GLOW;
        ctx.shadowBlur = 30 + pulse * 20;
        
        ctx.fillStyle = MAZE_COLORS.EXIT;
        ctx.beginPath();
        ctx.arc(exitCenterX, exitCenterY, MAZE_CELL_SIZE * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#fff5b0';
        ctx.beginPath();
        ctx.arc(exitCenterX, exitCenterY, MAZE_CELL_SIZE * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }

    checkWin(playerX, playerY) {
        const exitCenterX = this.exitPos[0] * MAZE_CELL_SIZE + MAZE_CELL_SIZE / 2;
        const exitCenterY = this.exitPos[1] * MAZE_CELL_SIZE + MAZE_CELL_SIZE / 2;
        return Math.hypot(playerX - exitCenterX, playerY - exitCenterY) < 25;
    }
}

// --- Game Class (Enhanced Difficulty) ---
class MazeGame {
    constructor() {
        this.maze = new Maze(MAZE_GRID_WIDTH, MAZE_GRID_HEIGHT);
        
        // Start with two viruses for immediate challenge
        this.virus = new Virus(MAZE_CELL_SIZE * (MAZE_GRID_WIDTH - 2), MAZE_CELL_SIZE * (MAZE_GRID_HEIGHT - 2), MAZE_COLORS.ENEMY, 3.2, 2.0, 0.96);
        this.virus2 = new Virus(MAZE_CELL_SIZE * 3, MAZE_CELL_SIZE * (MAZE_GRID_HEIGHT - 3), MAZE_COLORS.ENEMY2, 3.2, 2.0, 0.97);
        this.virus3 = null; // Third virus spawns later
        this.virus3SpawnTime = 8; // seconds
        
        this.lives = 3;
        this.gameOver = false;
        this.won = false;
        this.time = 0;
        this.flashTimer = 0;
        
        // Dash mechanics
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.dashSpeed = 4.0; // 4x normal speed during dash
        this.normalSpeed = 3.0;
        this.dashAvailable = true;
        
        // Difficulty scaling
        this.globalSpeedMultiplier = 1.0;
        this.difficultyTimer = 0;
        
        // --- GAME STATE & INSTRUCTIONS ---
        this.gameState = "PREPARING";
        this.prepTimer = 5;
        this.lastTime = Date.now();

        if (window.mazeInstructionsSeen) {
            this.gameState = "PLAYING";
            this.startTime = Date.now();
            this.roundStartTime = Date.now();
        } else {
            window.mazeInstructionsSeen = true;
        }
    }

    update() {
        const now = Date.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        if (this.gameState === "PREPARING") {
            this.prepTimer -= dt;
            if (this.prepTimer <= 0) {
                this.gameState = "PLAYING";
                this.startTime = Date.now();
                this.roundStartTime = Date.now();
            }
            return;
        }

        if (this.gameOver) return;

        this.time = Math.floor((Date.now() - this.startTime) / 1000);
        let currentRoundTime = (Date.now() - this.roundStartTime) / 1000;

        // Handle dash cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown -= dt;
            if (this.dashCooldown <= 0) {
                this.dashAvailable = true;
            }
        }
        
        if (this.dashDuration > 0) {
            this.dashDuration -= dt;
        }

        // Check for dash input (space bar)
        if (window.keys[' '] || window.keys['Space'] && this.dashAvailable && this.dashDuration <= 0) {
            this.dashDuration = 0.15; // 150ms dash
            this.dashCooldown = 1.0; // 1 second cooldown
            this.dashAvailable = false;
        }

        // Difficulty increases over time
        this.difficultyTimer += dt;
        this.globalSpeedMultiplier = 1.0 + Math.min(0.8, this.difficultyTimer / 30); // up to 1.8x speed after 60s

        // Virus 3 spawn
        if (!this.virus3 && currentRoundTime >= this.virus3SpawnTime) {
            this.virus3 = new Virus(MAZE_CELL_SIZE * 2, MAZE_CELL_SIZE * 2, MAZE_COLORS.ENEMY3, 1.2, 2.0, 0.98);
        }

        // Update all viruses with global speed multiplier
        this.virus.update(this.maze.grid, this.maze.playerPos, this.globalSpeedMultiplier);
        if (this.virus2) this.virus2.update(this.maze.grid, this.maze.playerPos, this.globalSpeedMultiplier);
        if (this.virus3) this.virus3.update(this.maze.grid, this.maze.playerPos, this.globalSpeedMultiplier);

        const playerRadius = 12;
        const virusRadius = 18; // Slightly larger hitbox
        
        let hit = false;
        if (Math.hypot(this.maze.playerPos[0] - this.virus.x, this.maze.playerPos[1] - this.virus.y) < playerRadius + virusRadius) hit = true;
        if (this.virus2 && Math.hypot(this.maze.playerPos[0] - this.virus2.x, this.maze.playerPos[1] - this.virus2.y) < playerRadius + virusRadius) hit = true;
        if (this.virus3 && Math.hypot(this.maze.playerPos[0] - this.virus3.x, this.maze.playerPos[1] - this.virus3.y) < playerRadius + virusRadius) hit = true;

        if (hit) {
            this.lives--;
            this.flashTimer = 30;
            if (this.lives <= 0) {
                this.gameOver = true;
            } else {
                // Respawn player at start, reset viruses to original positions? Keep them for challenge.
                this.maze.playerPos = [MAZE_CELL_SIZE * 1.5, MAZE_CELL_SIZE * 1.5];
                // Do not reset viruses – they remain, making it harder
                // But we reset roundStartTime to give a tiny breather? No, keep pressure.
            }
        }

        if (this.maze.checkWin(this.maze.playerPos[0], this.maze.playerPos[1])) {
            this.won = true;
            this.gameOver = true;
        }

        if (this.flashTimer > 0) this.flashTimer--;
    }

    draw(ctx) {
        // Clear Full Screen
        ctx.fillStyle = MAZE_COLORS.BACKGROUND;
        ctx.fillRect(0, 0, MAZE_WIDTH, MAZE_HEIGHT);

        // Draw sidebar with futuristic UI
        this.drawSidebar(ctx);

        // --- DRAW MAZE AREA ---
        ctx.save();
        ctx.translate(SIDEBAR_WIDTH, 0);
        
        const mazePixelHeight = this.maze.height * MAZE_CELL_SIZE;
        const vOffset = Math.max(0, (MAZE_HEIGHT - mazePixelHeight) / 2);
        ctx.translate(20, vOffset); // 20px padding left

        this.maze.draw(ctx);

        // Draw viruses with glows already handled in their draw
        this.virus.draw(ctx);
        if (this.virus2) this.virus2.draw(ctx);
        if (this.virus3) this.virus3.draw(ctx);

        // Player with neon glow and dash effect
        if (this.flashTimer <= 0 || this.flashTimer % 6 < 3) {
            const [px, py] = this.maze.playerPos;
            
            // Dash trail effect
            if (this.dashDuration > 0) {
                ctx.shadowColor = MAZE_COLORS.PLAYER_GLOW;
                ctx.shadowBlur = 50;
                ctx.fillStyle = MAZE_COLORS.PLAYER;
                ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.fill();
            }
            
            ctx.shadowColor = MAZE_COLORS.PLAYER_GLOW;
            ctx.shadowBlur = 30;
            ctx.fillStyle = MAZE_COLORS.PLAYER;
            ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(px - 4, py - 4, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(px + 4, py - 4, 3, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Prep overlay
        if (this.gameState === "PREPARING") {
            ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
            ctx.fillRect(0, -vOffset, MAZE_WIDTH - SIDEBAR_WIDTH, MAZE_HEIGHT);
            
            ctx.textAlign = "center";
            ctx.shadowColor = MAZE_COLORS.TEXT_INFO;
            ctx.shadowBlur = 30;
            ctx.fillStyle = MAZE_COLORS.TEXT_INFO;
            ctx.font = "bold 100px 'Courier New', monospace";
            ctx.fillText(Math.ceil(this.prepTimer), (MAZE_WIDTH - SIDEBAR_WIDTH)/2, MAZE_HEIGHT/2);
            
            ctx.font = "20px 'Courier New', monospace";
            ctx.fillStyle = MAZE_COLORS.WHITE;
            ctx.fillText("INITIALIZING NEURAL INTERFACE...", (MAZE_WIDTH - SIDEBAR_WIDTH)/2, MAZE_HEIGHT/2 + 80);
            ctx.shadowBlur = 0;
        }

        // Game over overlay
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(0, -vOffset, MAZE_WIDTH - SIDEBAR_WIDTH, MAZE_HEIGHT);

            let message = this.won ? "> ACCESS GRANTED <" : "> SYSTEM BREACH <";
            let color = this.won ? MAZE_COLORS.TEXT : MAZE_COLORS.TEXT_CRIT;

            ctx.font = 'bold 48px "Courier New", monospace';
            ctx.shadowColor = color;
            ctx.shadowBlur = 30;
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.fillText(message, (MAZE_WIDTH - SIDEBAR_WIDTH)/2, MAZE_HEIGHT/2);
            
            ctx.font = '20px monospace';
            ctx.fillStyle = MAZE_COLORS.WHITE;
            ctx.fillText(this.won ? "NEURAL PATH SECURED" : "TERMINAL LOCKED", (MAZE_WIDTH - SIDEBAR_WIDTH)/2, MAZE_HEIGHT/2 + 60);
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    drawSidebar(ctx) {
        // Background with subtle scanlines
        ctx.fillStyle = MAZE_COLORS.SIDEBAR_BG;
        ctx.fillRect(0, 0, SIDEBAR_WIDTH, MAZE_HEIGHT);
        
        // Scanline effect
        ctx.fillStyle = 'rgba(0, 255, 255, 0.03)';
        for (let i = 0; i < MAZE_HEIGHT; i+=4) {
            ctx.fillRect(0, i, SIDEBAR_WIDTH, 1);
        }
        
        // Border glow
        ctx.strokeStyle = MAZE_COLORS.NEON_BLUE;
        ctx.lineWidth = 3;
        ctx.shadowColor = MAZE_COLORS.NEON_BLUE;
        ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.moveTo(SIDEBAR_WIDTH, 0); ctx.lineTo(SIDEBAR_WIDTH, MAZE_HEIGHT); ctx.stroke();
        ctx.shadowBlur = 0;

        const pad = 20;
        let y = 40;

        // Title with glitch effect
        ctx.save();
        ctx.shadowColor = MAZE_COLORS.NEON_PINK;
        ctx.shadowBlur = 20;
        ctx.fillStyle = MAZE_COLORS.NEON_BLUE;
        ctx.font = "bold 30px 'Courier New', monospace";
        ctx.fillText("NEURAL MAZE", pad, y);
        ctx.restore();
        
        y += 45;
        ctx.font = "14px monospace";
        ctx.fillStyle = MAZE_COLORS.TEXT_INFO;
        ctx.fillText(">> EVASION PROTOCOL <<", pad, y);

        // Stats section with neon glow
        y += 50;
        ctx.fillStyle = MAZE_COLORS.WHITE;
        ctx.font = "bold 18px 'Courier New'";
        ctx.fillText("STATUS:", pad, y);

        y += 30;
        // Lives as neon circuits
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < this.lives ? MAZE_COLORS.TEXT_CRIT : '#333';
            ctx.shadowColor = i < this.lives ? MAZE_COLORS.TEXT_CRIT : 'transparent';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            const hx = pad + (i * 40);
            const hy = y;
            ctx.moveTo(hx, hy);
            ctx.lineTo(hx - 10, hy - 10);
            ctx.lineTo(hx + 10, hy - 10);
            ctx.closePath();
            ctx.fill();
            // Small circuit lines
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hx - 15, hy - 15);
            ctx.lineTo(hx + 15, hy - 15);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;

        y += 40;
        ctx.fillStyle = MAZE_COLORS.WHITE;
        ctx.fillText(`TIME: ${this.time}s`, pad, y);
        
        y += 35;
        ctx.fillStyle = MAZE_COLORS.WHITE;
        ctx.fillText(`DIFFICULTY: ${Math.round(this.globalSpeedMultiplier * 100)}%`, pad, y);

        // Dash cooldown indicator
        y += 35;
        ctx.fillStyle = MAZE_COLORS.WHITE;
        ctx.fillText("DASH:", pad, y);
        y += 20;
        
        const dashBarW = SIDEBAR_WIDTH - (pad * 2);
        const dashBarH = 10;
        ctx.fillStyle = "#1a0033";
        ctx.fillRect(pad, y, dashBarW, dashBarH);
        
        if (this.dashAvailable) {
            ctx.fillStyle = MAZE_COLORS.PLAYER;
            ctx.fillRect(pad, y, dashBarW, dashBarH);
        } else {
            // Show cooldown progress
            const cooldownPct = Math.max(0, 1 - (this.dashCooldown / 1.0));
            ctx.fillStyle = MAZE_COLORS.TEXT_WARN;
            ctx.fillRect(pad, y, dashBarW * cooldownPct, dashBarH);
        }
        ctx.strokeStyle = MAZE_COLORS.NEON_BLUE;
        ctx.strokeRect(pad, y, dashBarW, dashBarH);
        
        // Threat level
        y += 40;
        const d1 = Math.hypot(this.maze.playerPos[0] - this.virus.x, this.maze.playerPos[1] - this.virus.y);
        let dist = d1;
        if (this.virus2) {
            const d2 = Math.hypot(this.maze.playerPos[0] - this.virus2.x, this.maze.playerPos[1] - this.virus2.y);
            dist = Math.min(dist, d2);
        }
        if (this.virus3) {
            const d3 = Math.hypot(this.maze.playerPos[0] - this.virus3.x, this.maze.playerPos[1] - this.virus3.y);
            dist = Math.min(dist, d3);
        }

        ctx.fillText("THREAT PROXIMITY:", pad, y);
        y += 20;
        
        // Threat bar with gradient
        const barW = SIDEBAR_WIDTH - (pad * 2);
        const barH = 18;
        ctx.fillStyle = "#1a0033";
        ctx.fillRect(pad, y, barW, barH);
        
        const maxDist = 500;
        const dangerPct = Math.max(0, 1 - (dist / maxDist));
        const gradient = ctx.createLinearGradient(pad, y, pad + barW * dangerPct, y);
        gradient.addColorStop(0, '#ffaa00');
        gradient.addColorStop(1, '#ff3b3b');
        ctx.fillStyle = gradient;
        ctx.fillRect(pad, y, barW * dangerPct, barH);
        ctx.strokeStyle = MAZE_COLORS.NEON_BLUE;
        ctx.lineWidth = 2;
        ctx.strokeRect(pad, y, barW, barH);

        // Instructions (neon style)
        y += 60;
        ctx.fillStyle = MAZE_COLORS.NEON_PINK;
        ctx.font = "bold 20px 'Courier New'";
        ctx.fillText("> COMMANDS <", pad, y);
        
        y += 30;
        ctx.font = "14px monospace";
        ctx.fillStyle = MAZE_COLORS.WHITE;
        ctx.fillText("↑ ↓ ← →  MOVE", pad, y);
        y += 25;
        ctx.fillStyle = MAZE_COLORS.PLAYER;
        ctx.fillText("SPACE  DASH (1s cooldown)", pad, y);
        y += 25;
        ctx.fillStyle = MAZE_COLORS.NEON_BLUE;
        ctx.fillText(">> REACH EXIT", pad, y);
        y += 25;
        ctx.fillStyle = MAZE_COLORS.TEXT_CRIT;
        ctx.fillText(">> AVOID VIRUSES", pad, y);

        // Spawn timers
        if (this.gameState === "PLAYING") {
            y += 40;
            let timeLeft3 = Math.max(0, this.virus3SpawnTime - ((Date.now() - this.roundStartTime) / 1000));
            if (!this.virus3) {
                ctx.fillStyle = MAZE_COLORS.TEXT_WARN;
                ctx.font = "bold 16px 'Courier New'";
                ctx.fillText(`HUNTER SPAWN: ${timeLeft3.toFixed(1)}s`, pad, y);
            }
            
            // Show active viruses
            y += 25;
            let virusCount = 1 + (this.virus2 ? 1 : 0) + (this.virus3 ? 1 : 0);
            ctx.fillStyle = MAZE_COLORS.TEXT_INFO;
            ctx.fillText(`ACTIVE THREATS: ${virusCount}`, pad, y);
        }
    }
    
    movePlayer(dx, dy) {
        if (this.gameOver || this.gameState !== "PLAYING") return;

        // Determine current speed (normal or dash)
        let speed = this.normalSpeed;
        if (this.dashDuration > 0) {
            speed = this.dashSpeed;
        }
        
        const newX = this.maze.playerPos[0] + dx * speed;
        const newY = this.maze.playerPos[1] + dy * speed;

        const gridX = Math.floor(newX / MAZE_CELL_SIZE);
        const gridY = Math.floor(newY / MAZE_CELL_SIZE);

        if (gridX >= 0 && gridX < this.maze.width && gridY >= 0 && gridY < this.maze.height) {
            if (this.maze.grid[gridY][gridX] === 0) {
                // Corner checking
                const corners = [
                    [newX - 12, newY - 12], [newX + 12, newY - 12],
                    [newX - 12, newY + 12], [newX + 12, newY + 12]
                ];

                let valid = true;
                for (let [cx, cy] of corners) {
                    const cgX = Math.floor(cx / MAZE_CELL_SIZE);
                    const cgY = Math.floor(cy / MAZE_CELL_SIZE);
                    if (cgX >= 0 && cgX < this.maze.width && cgY >= 0 && cgY < this.maze.height) {
                        if (this.maze.grid[cgY][cgX] === 1) {
                            valid = false;
                            break;
                        }
                    }
                }

                if (valid) {
                    this.maze.playerPos = [newX, newY];
                }
            }
        }
    }
}

// Export classes and functions
window.MazeGame = MazeGame;
window.randomChoice = randomChoice;
window.MAZE_COLORS = MAZE_COLORS;
window.MAZE_CELL_SIZE = MAZE_CELL_SIZE;

// Function to set dimensions
window.setMazeDimensions = function(width, height) {
    MAZE_WIDTH = width;
    MAZE_HEIGHT = height;
    
    const availableWidth = MAZE_WIDTH - SIDEBAR_WIDTH - 40;
    const availableHeight = MAZE_HEIGHT - 40;
    
    MAZE_GRID_WIDTH = Math.floor(availableWidth / MAZE_CELL_SIZE);
    MAZE_GRID_HEIGHT = Math.floor(availableHeight / MAZE_CELL_SIZE);
    
    MAZE_GRID_WIDTH = Math.max(12, MAZE_GRID_WIDTH);  // Slightly larger minimum
    MAZE_GRID_HEIGHT = Math.max(12, MAZE_GRID_HEIGHT);
};