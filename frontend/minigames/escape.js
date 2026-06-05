const ESCAPE_CELL_SIZE = 40;
const ESCAPE_UI_WIDTH = 300; // Fixed sidebar width like maze.js
let ESCAPE_GAME_WIDTH, ESCAPE_GAME_HEIGHT;
let ESCAPE_GRID_WIDTH, ESCAPE_GRID_HEIGHT;

// --- GLOBAL FLAG FOR INSTRUCTIONS ---
if (typeof window.escapeInstructionsSeen === 'undefined') {
    window.escapeInstructionsSeen = false;
}

const ESCAPE_THEME = {
    BACKGROUND: '#050505',
    SIDEBAR_BG: '#0a0a0a',
    SIDEBAR_BORDER: '#444',
    
    WALL: '#1a1a2e',
    PATH: '#08080f',
    PLAYER: '#00ffcc',
    HIDDEN: 'rgba(0, 255, 204, 0.15)',
    VIRUS: '#ff3232',
    EXIT: '#ffcc00',
    ORB: '#00aaff',
    ORB_COLLECTED: '#00ff88',
    
    TEXT: '#00ff00',
    TEXT_WARN: '#ffaa00',
    TEXT_CRIT: '#ff0000',
    TEXT_INFO: '#00ccff',
    WHITE: '#ffffff'
};

const escapeCanvas = document.getElementById('gameCanvas');
const escapeCtx = escapeCanvas.getContext('2d');

// Input State - Using maze.js style
window.keys = window.keys || {};

window.addEventListener('keydown', (e) => {
    window.keys[e.key] = true;
    window.keys[e.code] = true;
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    window.keys[e.key] = false;
    window.keys[e.code] = false;
});

function escapeRandomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- Orb Class ---
class Orb {
    constructor(gx, gy) {
        this.gx = gx;
        this.gy = gy;
        this.x = gx * ESCAPE_CELL_SIZE + ESCAPE_CELL_SIZE/2;
        this.y = gy * ESCAPE_CELL_SIZE + ESCAPE_CELL_SIZE/2;
        this.collected = false;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.05;
        this.size = 14;
    }
    
    update() {
        this.pulse += this.pulseSpeed;
    }
    
    draw(ctx) {
        if (this.collected) return;
        
        const pulseSize = this.size + Math.sin(this.pulse) * 4;
        
        // Glow effect
        ctx.save();
        ctx.fillStyle = 'rgba(0, 170, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Orb body
        ctx.fillStyle = ESCAPE_THEME.ORB;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, pulseSize
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.7, ESCAPE_THEME.ORB);
        gradient.addColorStop(1, 'rgba(0, 100, 200, 0.5)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // Sparkle
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 3, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    checkCollision(playerX, playerY) {
        if (this.collected) return false;
        
        const distance = Math.hypot(playerX - this.x, playerY - this.y);
        return distance < 20; // Player radius (12) + orb radius (~14)
    }
}

// --- Maze Map Class ---
class EscapeMazeMap {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.grid = [];
        this.generate();
        this.pathPositions = this.getPathPositions();
    }
    
    generate() {
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(1));
        const stack = [[1, 1]];
        this.grid[1][1] = 0;
        
        while (stack.length > 0) {
            const [x, y] = stack[stack.length - 1];
            const neighbors = [[0, -2], [2, 0], [0, 2], [-2, 0]]
                .map(([dx, dy]) => [x + dx, y + dy, x + dx/2, y + dy/2])
                .filter(([nx, ny]) => nx > 0 && nx < this.cols - 1 && ny > 0 && ny < this.rows - 1 && this.grid[ny][nx] === 1);
            
            if (neighbors.length > 0) {
                const [nx, ny, wx, wy] = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.grid[wy][wx] = 0;
                this.grid[ny][nx] = 0;
                stack.push([nx, ny]);
            } else {
                stack.pop();
            }
        }
        // Ensure the exit cell and its neighbor are open
        this.grid[this.rows - 2][this.cols - 2] = 0;
        this.grid[this.rows - 2][this.cols - 3] = 0;
    }
    
    // Get all valid path positions for virus and orb placement
    getPathPositions() {
        const positions = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] === 0) {
                    positions.push([x, y]);
                }
            }
        }
        return positions;
    }
    
    // Get random path position that's not too close to start
    getRandomPathPosition(minDistanceFromStart = 5) {
        const validPositions = this.pathPositions.filter(([x, y]) => {
            // Don't place too close to start (1,1)
            const distance = Math.abs(x - 1) + Math.abs(y - 1);
            return distance >= minDistanceFromStart;
        });
        
        if (validPositions.length > 0) {
            return escapeRandomChoice(validPositions);
        }
        // Fallback to any path position
        return escapeRandomChoice(this.pathPositions);
    }
    
    draw(ctx) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                ctx.fillStyle = (this.grid[r][c] === 1) ? ESCAPE_THEME.WALL : ESCAPE_THEME.PATH;
                ctx.fillRect(c * ESCAPE_CELL_SIZE, r * ESCAPE_CELL_SIZE, ESCAPE_CELL_SIZE, ESCAPE_CELL_SIZE);
            }
        }
    }
}

// --- Seeker (Virus) Class ---
class EscapeSeeker {
    constructor(gx, gy, color = null) {
        this.x = gx * ESCAPE_CELL_SIZE + ESCAPE_CELL_SIZE/2;
        this.y = gy * ESCAPE_CELL_SIZE + ESCAPE_CELL_SIZE/2;
        this.gridX = gx;
        this.gridY = gy;
        
        // Same speed as maze.js
        this.baseSpeed = 1.0;
        this.angrySpeed = 1.6;
        this.speed = this.baseSpeed;
        
        this.direction = escapeRandomChoice(["up", "down", "left", "right"]);
        this.nextDirection = null;
        this.pulse = 0;
        this.angry = false;
        this.angryTimer = 0;
        this.customColor = color;
    }

    update(mazeGrid, playerPos) {
        this.pulse += 0.05;
        this.gridX = Math.floor(this.x / ESCAPE_CELL_SIZE);
        this.gridY = Math.floor(this.y / ESCAPE_CELL_SIZE);

        this.gridX = Math.max(0, Math.min(this.gridX, mazeGrid[0].length - 1));
        this.gridY = Math.max(0, Math.min(this.gridY, mazeGrid.length - 1));

        const [px, py] = playerPos;
        const pxGrid = Math.floor(px / ESCAPE_CELL_SIZE);
        const pyGrid = Math.floor(py / ESCAPE_CELL_SIZE);

        const distanceToPlayer = Math.hypot(this.x - px, this.y - py);

        // Aggro if player is visible and close (like maze.js)
        if (!this.angry && distanceToPlayer < 250 && Math.random() < 0.01) {
            this.angry = true;
            this.angryTimer = 240;
            this.speed = this.angrySpeed;
        }

        if (this.angry) {
            this.angryTimer--;
            if (this.angryTimer <= 0) {
                this.angry = false;
                this.speed = this.baseSpeed;
            }
        }

        // Pathfinding (Same as maze.js)
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
                    const dist = Math.abs(testX - pxGrid) + Math.abs(testY - pyGrid);
                    if (dist < minDist) {
                        minDist = dist;
                        bestDir = dir;
                    }
                }
            }

            if (bestDir && Math.random() < 0.90) {
                this.nextDirection = bestDir;
            } else {
                this.nextDirection = escapeRandomChoice(possibleDirs);
            }
        } else {
            this.nextDirection = opposite[this.direction] || escapeRandomChoice(["up", "down", "left", "right"]);
        }

        this.move(mazeGrid);
    }

    move(mazeGrid) {
        const centeredX = Math.abs(this.x % ESCAPE_CELL_SIZE - ESCAPE_CELL_SIZE / 2) < this.speed;
        const centeredY = Math.abs(this.y % ESCAPE_CELL_SIZE - ESCAPE_CELL_SIZE / 2) < this.speed;

        if (this.nextDirection && centeredX && centeredY) {
            if (this.canMove(this.nextDirection, mazeGrid)) {
                this.direction = this.nextDirection;
                this.nextDirection = null;
                this.x = this.gridX * ESCAPE_CELL_SIZE + ESCAPE_CELL_SIZE/2;
                this.y = this.gridY * ESCAPE_CELL_SIZE + ESCAPE_CELL_SIZE/2;
            }
        }

        let dx = 0, dy = 0;
        if (this.direction === "up") dy = -this.speed;
        else if (this.direction === "down") dy = this.speed;
        else if (this.direction === "left") dx = -this.speed;
        else if (this.direction === "right") dx = this.speed;

        const newX = this.x + dx;
        const newY = this.y + dy;

        const gridX = Math.floor(newX / ESCAPE_CELL_SIZE);
        const gridY = Math.floor(newY / ESCAPE_CELL_SIZE);

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
            this.direction = escapeRandomChoice(possibleDirs);
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
        const size = 16;
        const pulseSize = size + Math.sin(this.pulse) * 4;
        let baseColor = this.customColor || ESCAPE_THEME.VIRUS;
        let color = this.angry ? '#ff0000' : baseColor; 

        if (this.angry) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, pulseSize * 1.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Spikes
        const spikeCount = this.angry ? 10 : 8;
        for (let i = 0; i < spikeCount; i++) {
            const angle = i * (2 * Math.PI / spikeCount);
            const spikeLength = this.angry ? pulseSize * 1.4 : pulseSize * 1.2;
            const spikeX = this.x + Math.cos(angle) * spikeLength;
            const spikeY = this.y + Math.sin(angle) * spikeLength;
            ctx.beginPath();
            ctx.arc(spikeX, spikeY, this.angry ? 4 : 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(this.x + 6, this.y - 4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x - 6, this.y - 4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(this.x + 6, this.y - 4, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x - 6, this.y - 4, 2, 0, Math.PI * 2); ctx.fill();
    }
}

// --- Escape Game Class ---
class EscapeGame {
    constructor() {
        this.maze = new EscapeMazeMap(ESCAPE_GRID_WIDTH, ESCAPE_GRID_HEIGHT);
        this.playerPos = [ESCAPE_CELL_SIZE * 1.5, ESCAPE_CELL_SIZE * 1.5]; // Continuous position like maze.js
        
        // Create viruses at valid path positions
        this.viruses = this.createViruses();
        
        // Create 2 orbs that need to be collected
        this.orbs = this.createOrbs();
        this.orbsCollected = 0;
        this.totalOrbs = 2;
        
        this.player = {
            isHidden: false,
            stealth: 5.0,
            lives: 3
        };
        
        this.gameOver = false;
        this.won = false;
        this.time = 0;
        this.flashTimer = 0;
        
        // --- GAME STATE & INSTRUCTIONS (like maze.js) ---
        this.gameState = "PREPARING"; // Default to preparing
        this.prepTimer = 5; // 5 Seconds countdown
        this.lastTime = Date.now();

        // Check global flag: If seen, skip prep
        if (window.escapeInstructionsSeen) {
            this.gameState = "PLAYING";
            this.startTime = Date.now();
        } else {
            // First time: Set flag so next retry skips it
            window.escapeInstructionsSeen = true;
        }
    }

    createViruses() {
        const viruses = [];
        const virusCount = 7; // Number of viruses
        
        // Ensure viruses are placed in valid path positions
        for (let i = 0; i < virusCount; i++) {
            let position;
            let attempts = 0;
            
            do {
                // Get random path position, ensuring it's not too close to start
                position = this.maze.getRandomPathPosition(8);
                attempts++;
                
                // Also check distance from exit
                const exitDistance = Math.abs(position[0] - (ESCAPE_GRID_WIDTH - 2)) + Math.abs(position[1] - (ESCAPE_GRID_HEIGHT - 2));
                
                // Accept position if it's far enough from both start and exit
                if (exitDistance >= 8) {
                    break;
                }
            } while (attempts < 50); // Limit attempts to avoid infinite loop
            
            viruses.push(new EscapeSeeker(position[0], position[1], ESCAPE_THEME.VIRUS));
        }
        
        return viruses;
    }
    
    createOrbs() {
        const orbs = [];
        
        // Create 2 orbs at different locations
        for (let i = 0; i < 2; i++) {
            let position;
            let attempts = 0;
            
            do {
                // Get random path position, ensuring it's not too close to start
                position = this.maze.getRandomPathPosition(6);
                attempts++;
                
                // Check distance from exit
                const exitDistance = Math.abs(position[0] - (ESCAPE_GRID_WIDTH - 2)) + Math.abs(position[1] - (ESCAPE_GRID_HEIGHT - 2));
                
                // Accept position if it's not too close to exit and not overlapping with other orbs
                if (exitDistance >= 6) {
                    // Check if this position is far enough from existing orbs
                    let valid = true;
                    for (const orb of orbs) {
                        const orbDistance = Math.abs(position[0] - orb.gx) + Math.abs(position[1] - orb.gy);
                        if (orbDistance < 10) { // Minimum distance between orbs
                            valid = false;
                            break;
                        }
                    }
                    if (valid) break;
                }
            } while (attempts < 100); // Limit attempts
            
            orbs.push(new Orb(position[0], position[1]));
        }
        
        return orbs;
    }

    update() {
        const now = Date.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // --- PREP PHASE ---
        if (this.gameState === "PREPARING") {
            this.prepTimer -= dt;
            if (this.prepTimer <= 0) {
                this.gameState = "PLAYING";
                this.startTime = Date.now();
            }
            return;
        }

        if (this.gameOver) return;

        this.time = Math.floor((Date.now() - this.startTime) / 1000);

        // Stealth System
        if (window.keys['Space'] && this.player.stealth > 0) {
            this.player.isHidden = true;
            this.player.stealth -= dt;
        } else {
            this.player.isHidden = false;
            if (this.player.stealth < 5) this.player.stealth += dt * 1.5;
        }

        // Player Movement (continuous like maze.js)
        this.movePlayer(dt);
        
        // Update orbs
        this.orbs.forEach(orb => {
            orb.update();
            
            // Check orb collection
            if (!orb.collected && orb.checkCollision(this.playerPos[0], this.playerPos[1])) {
                orb.collected = true;
                this.orbsCollected++;
            }
        });

        // Update viruses (every frame like maze.js)
        this.viruses.forEach(v => {
            v.update(this.maze.grid, this.playerPos);
            
            // Collision check
            const playerRadius = 12;
            const virusRadius = 16;
            const distance = Math.hypot(this.playerPos[0] - v.x, this.playerPos[1] - v.y);
            
            if (!this.player.isHidden && distance < playerRadius + virusRadius) {
                this.handleCollision();
            }
        });

        // Win Condition - Only if all orbs are collected
        const exitCenterX = (ESCAPE_GRID_WIDTH - 2) * ESCAPE_CELL_SIZE + ESCAPE_CELL_SIZE / 2;
        const exitCenterY = (ESCAPE_GRID_HEIGHT - 2) * ESCAPE_CELL_SIZE + ESCAPE_CELL_SIZE / 2;
        if (Math.hypot(this.playerPos[0] - exitCenterX, this.playerPos[1] - exitCenterY) < 25) {
            if (this.orbsCollected >= this.totalOrbs) {
                this.won = true;
                this.gameOver = true;
            }
        }
        
        if (this.flashTimer > 0) this.flashTimer--;
    }
    
    movePlayer(dt) {
        if (this.gameOver || this.gameState !== "PLAYING") return;

        let dx = 0, dy = 0;
        const speed = 2.0; // Same as maze.js
        
        if (window.keys['ArrowUp'] || window.keys['KeyW']) dy = -speed;
        if (window.keys['ArrowDown'] || window.keys['KeyS']) dy = speed;
        if (window.keys['ArrowLeft'] || window.keys['KeyA']) dx = -speed;
        if (window.keys['ArrowRight'] || window.keys['KeyD']) dx = speed;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071; // 1/√2
            dy *= 0.7071;
        }

        const newX = this.playerPos[0] + dx;
        const newY = this.playerPos[1] + dy;

        const gridX = Math.floor(newX / ESCAPE_CELL_SIZE);
        const gridY = Math.floor(newY / ESCAPE_CELL_SIZE);

        if (gridX >= 0 && gridX < this.maze.cols && gridY >= 0 && gridY < this.maze.rows) {
            if (this.maze.grid[gridY][gridX] === 0) {
                // Collision check with walls (corner checking like maze.js)
                const corners = [
                    [newX - 10, newY - 10], [newX + 10, newY - 10],
                    [newX - 10, newY + 10], [newX + 10, newY + 10]
                ];

                let valid = true;
                for (let [cx, cy] of corners) {
                    const cgX = Math.floor(cx / ESCAPE_CELL_SIZE);
                    const cgY = Math.floor(cy / ESCAPE_CELL_SIZE);
                    if (cgX >= 0 && cgX < this.maze.cols && cgY >= 0 && cgY < this.maze.rows) {
                        if (this.maze.grid[cgY][cgX] === 1) {
                            valid = false;
                            break;
                        }
                    }
                }

                if (valid) {
                    this.playerPos = [newX, newY];
                }
            }
        }
    }
    
    handleCollision() {
        this.player.lives--;
        this.flashTimer = 30;
        if (this.player.lives <= 0) {
            this.gameOver = true;
        } else {
            // Reset player position
            this.playerPos = [ESCAPE_CELL_SIZE * 1.5, ESCAPE_CELL_SIZE * 1.5];
        }
    }

    draw() {
        // Clear Full Screen
        escapeCtx.fillStyle = ESCAPE_THEME.BACKGROUND;
        escapeCtx.fillRect(0, 0, ESCAPE_GAME_WIDTH, ESCAPE_GAME_HEIGHT);

        // --- DRAW SIDEBAR ---
        this.drawSidebar(escapeCtx);

        // --- DRAW MAZE AREA ---
        escapeCtx.save();
        // Offset everything to the right of sidebar
        escapeCtx.translate(ESCAPE_UI_WIDTH, 0);
        
        // Center vertically if maze is shorter than screen
        const mazePixelHeight = this.maze.rows * ESCAPE_CELL_SIZE;
        const vOffset = Math.max(0, (ESCAPE_GAME_HEIGHT - mazePixelHeight) / 2);
        escapeCtx.translate(20, vOffset); // 20px padding left

        // Draw maze
        this.maze.draw(escapeCtx);
        
        // Draw orbs
        this.orbs.forEach(orb => orb.draw(escapeCtx));
        
        // Draw viruses
        this.viruses.forEach(v => v.draw(escapeCtx));
        
        // Draw player
        if (this.flashTimer <= 0 || this.flashTimer % 6 < 3) {
            const [px, py] = this.playerPos;
            escapeCtx.fillStyle = this.player.isHidden ? ESCAPE_THEME.HIDDEN : ESCAPE_THEME.PLAYER;
            escapeCtx.beginPath(); 
            escapeCtx.arc(px, py, 12, 0, Math.PI * 2); 
            escapeCtx.fill();
            
            // Player eye/face detail
            if (!this.player.isHidden) {
                escapeCtx.strokeStyle = 'white'; 
                escapeCtx.lineWidth = 2;
                escapeCtx.beginPath(); 
                escapeCtx.arc(px, py - 3, 4, 0, Math.PI * 2); 
                escapeCtx.stroke();
            }
        }
        
        // Draw exit (with different appearance if orbs not collected)
        const exitX = (ESCAPE_GRID_WIDTH - 2) * ESCAPE_CELL_SIZE;
        const exitY = (ESCAPE_GRID_HEIGHT - 2) * ESCAPE_CELL_SIZE;
        
        const pulse = (Math.sin(Date.now() * 0.003) + 1) * 0.5;
        const exitSize = ESCAPE_CELL_SIZE + pulse * 10;
        
        escapeCtx.save();
        if (this.orbsCollected >= this.totalOrbs) {
            // Exit is active (bright)
            escapeCtx.fillStyle = 'rgba(255, 200, 50, 0.4)';
        } else {
            // Exit is inactive (dimmed)
            escapeCtx.fillStyle = 'rgba(128, 128, 128, 0.3)';
        }
        escapeCtx.beginPath();
        escapeCtx.arc(exitX + ESCAPE_CELL_SIZE / 2, exitY + ESCAPE_CELL_SIZE / 2, exitSize * 0.6, 0, Math.PI * 2);
        escapeCtx.fill();
        escapeCtx.restore();

        if (this.orbsCollected >= this.totalOrbs) {
            escapeCtx.fillStyle = ESCAPE_THEME.EXIT;
        } else {
            escapeCtx.fillStyle = '#666666'; // Dimmed color
        }
        escapeCtx.fillRect(exitX + 5, exitY + 5, ESCAPE_CELL_SIZE - 10, ESCAPE_CELL_SIZE - 10);

        // --- PREP OVERLAY ---
        if (this.gameState === "PREPARING") {
            escapeCtx.fillStyle = "rgba(0, 0, 0, 0.8)";
            escapeCtx.fillRect(0, -vOffset, ESCAPE_GAME_WIDTH - ESCAPE_UI_WIDTH, ESCAPE_GAME_HEIGHT); // Cover game area
            
            escapeCtx.textAlign = "center";
            escapeCtx.fillStyle = ESCAPE_THEME.TEXT_INFO;
            escapeCtx.font = "bold 80px 'Courier New'";
            escapeCtx.fillText(Math.ceil(this.prepTimer), (ESCAPE_GAME_WIDTH - ESCAPE_UI_WIDTH)/2, ESCAPE_GAME_HEIGHT/2);
            
            escapeCtx.font = "20px monospace";
            escapeCtx.fillStyle = "#aaa";
            escapeCtx.fillText("Read Instructions on Left", (ESCAPE_GAME_WIDTH - ESCAPE_UI_WIDTH)/2, ESCAPE_GAME_HEIGHT/2 + 60);
        }

        // --- GAME OVER OVERLAY ---
        if (this.gameOver) {
            escapeCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            escapeCtx.fillRect(0, -vOffset, ESCAPE_GAME_WIDTH - ESCAPE_UI_WIDTH, ESCAPE_GAME_HEIGHT);

            let message = this.won ? "ESCAPE PROTOCOL SUCCESS" : "CONNECTION LOST";
            let color = this.won ? ESCAPE_THEME.TEXT : ESCAPE_THEME.TEXT_CRIT;

            escapeCtx.font = 'bold 40px "Courier New"';
            escapeCtx.fillStyle = color;
            escapeCtx.textAlign = 'center';
            escapeCtx.fillText(message, (ESCAPE_GAME_WIDTH - ESCAPE_UI_WIDTH)/2, ESCAPE_GAME_HEIGHT/2);
        }

        escapeCtx.restore();
    }

    drawSidebar(ctx) {
        // Background
        ctx.fillStyle = ESCAPE_THEME.SIDEBAR_BG;
        ctx.fillRect(0, 0, ESCAPE_UI_WIDTH, ESCAPE_GAME_HEIGHT);
        
        // Border
        ctx.strokeStyle = ESCAPE_THEME.SIDEBAR_BORDER;
        ctx.lineWidth = 2;
        ctx.beginPath(); 
        ctx.moveTo(ESCAPE_UI_WIDTH, 0); 
        ctx.lineTo(ESCAPE_UI_WIDTH, ESCAPE_GAME_HEIGHT); 
        ctx.stroke();

        const pad = 20;
        let y = 50;

        // Title
        ctx.textAlign = "left";
        ctx.fillStyle = ESCAPE_THEME.WHITE;
        ctx.font = "bold 28px 'Courier New'";
        ctx.fillText("GHOST MAZE", pad, y);
        
        y += 40;
        ctx.font = "16px monospace";
        ctx.fillStyle = "#888";
        ctx.fillText("PROTOCOL: DATA RETRIEVAL", pad, y);

        // Stats
        y += 60;
        ctx.fillStyle = ESCAPE_THEME.WHITE;
        ctx.font = "bold 20px 'Courier New'";
        ctx.fillText("STATUS:", pad, y);

        y += 35;
        // Hearts for lives
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < this.player.lives ? ESCAPE_THEME.TEXT_CRIT : '#444';
            ctx.beginPath();
            const hx = pad + (i * 35);
            const hy = y;
            ctx.moveTo(hx, hy);
            // Simple heart shape drawing
            ctx.arc(hx - 5, hy - 5, 8, Math.PI, 0); 
            ctx.arc(hx + 5, hy - 5, 8, Math.PI, 0); 
            ctx.lineTo(hx, hy + 10);
            ctx.fill();
        }

        y += 40;
        ctx.fillStyle = ESCAPE_THEME.WHITE;
        ctx.fillText(`TIME: ${this.time}s`, pad, y);

        y += 40;
        // Stealth Energy Bar
        ctx.fillText("STEALTH ENERGY:", pad, y);
        y += 20;
        
        const barW = ESCAPE_UI_WIDTH - (pad * 2);
        const barH = 15;
        ctx.fillStyle = "#222";
        ctx.fillRect(pad, y, barW, barH);
        
        ctx.fillStyle = ESCAPE_THEME.PLAYER;
        ctx.fillRect(pad, y, barW * (this.player.stealth / 5), barH);
        ctx.strokeStyle = "#555";
        ctx.strokeRect(pad, y, barW, barH);
        
        y += 10;
        ctx.font = "12px monospace";
        ctx.fillStyle = ESCAPE_THEME.TEXT_INFO;
        ctx.fillText("HOLD SPACE TO HIDE", pad, y + barH + 5);

        // Data Orbs Collected
        y += 60;
        ctx.font = "bold 20px 'Courier New'";
        ctx.fillStyle = ESCAPE_THEME.WHITE;
        ctx.fillText("DATA ORBS:", pad, y);
        y += 20;
        
        // Draw orb icons
        for (let i = 0; i < this.totalOrbs; i++) {
            const orbX = pad + (i * 45);
            const orbY = y;
            
            if (i < this.orbsCollected) {
                // Collected orb
                ctx.fillStyle = ESCAPE_THEME.ORB_COLLECTED;
                ctx.beginPath();
                ctx.arc(orbX + 10, orbY + 10, 12, 0, Math.PI * 2);
                ctx.fill();
                
                // Check mark
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(orbX + 5, orbY + 10);
                ctx.lineTo(orbX + 9, orbY + 14);
                ctx.lineTo(orbX + 15, orbY + 6);
                ctx.stroke();
            } else {
                // Uncollected orb
                ctx.fillStyle = ESCAPE_THEME.ORB;
                ctx.beginPath();
                ctx.arc(orbX + 10, orbY + 10, 10, 0, Math.PI * 2);
                ctx.fill();
                
                // Pulse effect for uncollected orbs
                const pulse = (Math.sin(Date.now() * 0.003 + i) + 1) * 0.5;
                ctx.fillStyle = `rgba(0, 170, 255, ${0.3 + pulse * 0.2})`;
                ctx.beginPath();
                ctx.arc(orbX + 10, orbY + 10, 14, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        y += 50;
        ctx.font = "14px monospace";
        ctx.fillStyle = ESCAPE_THEME.TEXT_INFO;
        ctx.fillText(`${this.orbsCollected}/${this.totalOrbs} ORBS COLLECTED`, pad, y);

        // Proximity Sensor
        y += 60;
        let minDist = Infinity;
        this.viruses.forEach(v => {
            const dist = Math.hypot(this.playerPos[0] - v.x, this.playerPos[1] - v.y);
            if (dist < minDist) minDist = dist;
        });

        ctx.font = "bold 20px 'Courier New'";
        ctx.fillStyle = ESCAPE_THEME.WHITE;
        ctx.fillText("THREAT PROXIMITY:", pad, y);
        y += 20;
        
        // Proximity Bar
        const proxBarW = ESCAPE_UI_WIDTH - (pad * 2);
        const proxBarH = 15;
        ctx.fillStyle = "#330000";
        ctx.fillRect(pad, y, proxBarW, proxBarH);
        
        const maxDist = 600; // Increased for larger maze
        const dangerPct = Math.max(0, 1 - (minDist / maxDist));
        ctx.fillStyle = dangerPct > 0.7 ? ESCAPE_THEME.TEXT_CRIT : ESCAPE_THEME.TEXT_WARN;
        ctx.fillRect(pad, y, proxBarW * dangerPct, proxBarH);
        ctx.strokeStyle = "#555";
        ctx.strokeRect(pad, y, proxBarW, proxBarH);

        // INSTRUCTIONS (ALWAYS VISIBLE)
        y += 80;
        ctx.fillStyle = ESCAPE_THEME.TEXT_INFO;
        ctx.font = "bold 20px 'Courier New'";
        ctx.fillText("INSTRUCTIONS:", pad, y);
        
        y += 30;
        ctx.font = "14px monospace";
        ctx.fillStyle = ESCAPE_THEME.WHITE;
        ctx.fillText("> USE ARROW KEYS TO MOVE", pad, y);
        y += 25;
        ctx.fillText("> COLLECT 2 BLUE DATA ORBS", pad, y);
        y += 25;
        ctx.fillText("> THEN REACH THE YELLOW EXIT", pad, y);
        y += 25;
        ctx.fillStyle = ESCAPE_THEME.TEXT_CRIT;
        ctx.fillText("> AVOID RED VIRUSES", pad, y);
        y += 25;
        ctx.fillStyle = ESCAPE_THEME.TEXT_INFO;
        ctx.fillText("> HOLD SPACE TO HIDE", pad, y);
        y += 25;
        ctx.fillStyle = ESCAPE_THEME.TEXT_WARN;
        ctx.fillText("> STEALTH ENERGY LIMITED", pad, y);
        y += 25;
        ctx.fillStyle = ESCAPE_THEME.WHITE;
        ctx.fillText(`> MAZE SIZE: ${ESCAPE_GRID_WIDTH}x${ESCAPE_GRID_HEIGHT}`, pad, y);
        y += 25;
        ctx.fillText(`> VIRUSES: ${this.viruses.length}`, pad, y);
    }
}

// Initialize game dimensions - Increased default size
function setEscapeDimensions(width, height) {
    ESCAPE_GAME_WIDTH = width;
    ESCAPE_GAME_HEIGHT = height;
    
    escapeCanvas.width = width;
    escapeCanvas.height = height;
    
    // Calculate Grid Size based on remaining space to the right
    const availableWidth = ESCAPE_GAME_WIDTH - ESCAPE_UI_WIDTH - 40; // 40px buffer
    const availableHeight = ESCAPE_GAME_HEIGHT - 40; // 40px buffer
    
    ESCAPE_GRID_WIDTH = Math.floor(availableWidth / ESCAPE_CELL_SIZE);
    ESCAPE_GRID_HEIGHT = Math.floor(availableHeight / ESCAPE_CELL_SIZE);
    
    // Make the maze significantly larger
    ESCAPE_GRID_WIDTH = Math.max(25, ESCAPE_GRID_WIDTH); // Increased minimum from 10 to 25
    ESCAPE_GRID_HEIGHT = Math.max(20, ESCAPE_GRID_HEIGHT); // Increased minimum from 10 to 20
    
    // Make sure dimensions are odd for proper maze generation
    if (ESCAPE_GRID_WIDTH % 2 === 0) ESCAPE_GRID_WIDTH--;
    if (ESCAPE_GRID_HEIGHT % 2 === 0) ESCAPE_GRID_HEIGHT--;
}

// Create and run game
let escapeGame;
function initEscapeGame() {
    // Set larger initial dimensions
    setEscapeDimensions(1400, 800); // Increased from 1100x640 to 1400x800
    
    escapeGame = new EscapeGame();
    
    function gameLoop() {
        escapeGame.update();
        escapeGame.draw();
        requestAnimationFrame(gameLoop);
    }
    
    gameLoop();
}

// Export for use
window.EscapeGame = EscapeGame;
window.setEscapeDimensions = setEscapeDimensions;
window.initEscapeGame = initEscapeGame;

// Start the game if this is the main file
if (document.getElementById('gameCanvas')) {
    initEscapeGame();
}