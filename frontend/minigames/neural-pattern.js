// minigames/neural-pattern.js

// --- CONSTANTS ---
const PATTERN_WIDTH = 900;
const PATTERN_HEIGHT = 700;

// --- ADVANCED COLORS with gradients ---
const PATTERN_COLORS = {
    BLACK: 'rgb(10, 10, 20)',
    SIDEBAR: '#0a0a14',
    DARK_BLUE: 'rgb(20, 30, 60)',
    TERMINAL_GREEN: 'rgb(0, 255, 100)',
    TERMINAL_BLUE: 'rgb(0, 150, 255)',
    TERMINAL_RED: 'rgb(255, 50, 80)',
    TERMINAL_YELLOW: 'rgb(255, 220, 0)',
    TERMINAL_PURPLE: 'rgb(180, 70, 255)',
    TERMINAL_CYAN: 'rgb(0, 220, 220)',
    CELL_BG: 'rgb(30, 40, 60)',
    CELL_BORDER: 'rgb(60, 70, 90)',
    INPUT_BG: 'rgb(0, 60, 30)',
    GRADIENT_START: '#1a1a2e',
    GRADIENT_END: '#16213e'
};

// Polyfill for roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

class SecurityPuzzle {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // Layout Calculations (Sidebar 30%, Game 70%)
        this.gameX = this.width * 0.3;
        this.gameW = this.width * 0.7;

        // Dynamic Grid Positioning (Centered in Game Area)
        this.gridSize = 5;
        this.cellSize = 70;
        const totalGridPixelWidth = this.gridSize * this.cellSize;
        
        this.gridX = this.gameX + (this.gameW - totalGridPixelWidth) / 2;
        this.gridY = (this.height - totalGridPixelWidth) / 2;

        this.targetPattern = [];
        this.playerPattern = [];
        this.distractionCells = [];
        this.level = 1;
        this.maxLevel = 5;
        this.score = 0;
        this.lives = 3;
        this.corruption = 0;
        
        this.messages = [];
        this.particles = [];
        this.scanLines = [];
        this.glitchEffect = 0;
        this.pulseIntensity = 0;
        
        // Buttons
        this.submitBtn = {
            x: this.gameX + (this.gameW - 200) / 2,
            y: this.gridY + totalGridPixelWidth + 60,
            w: 200,
            h: 45,
            hover: false,
            pulse: 0
        };

        // Start in Prepare Mode
        this.state = "prepare";
        this.prepareTimer = 5.0;
        
        // Initialize scan lines
        for (let i = 0; i < 20; i++) {
            this.scanLines.push({
                y: Math.random() * this.height,
                speed: 0.5 + Math.random() * 2,
                opacity: 0.1 + Math.random() * 0.2
            });
        }
    }

    createParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                color: color,
                size: 2 + Math.random() * 4
            });
        }
    }

    generatePuzzle() {
        this.targetPattern = [];
        
        // --- DIFFICULTY ADJUSTMENT ---
        const patternLength = Math.min(3 + this.level, 9); 

        // Generate Target Pattern
        while (this.targetPattern.length < patternLength) {
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);
            const exists = this.targetPattern.some(p => p.x === x && p.y === y);
            if (!exists) {
                this.targetPattern.push({ x, y });
            }
        }

        // Generate Distractions
        this.distractionCells = [];
        const distractionCount = Math.max(0, Math.min(this.level - 1, 3));

        while (this.distractionCells.length < distractionCount) {
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);
            
            const inTarget = this.targetPattern.some(p => p.x === x && p.y === y);
            const inDistract = this.distractionCells.some(p => p.x === x && p.y === y);
            
            if (!inTarget && !inDistract) {
                this.distractionCells.push({ x, y });
            }
        }

        this.playerPattern = [];
        this.state = "show_pattern";
        
        // Create particles for new pattern
        this.targetPattern.forEach(cell => {
            const x = this.gridX + cell.x * this.cellSize + this.cellSize / 2;
            const y = this.gridY + cell.y * this.cellSize + this.cellSize / 2;
            this.createParticles(x, y, PATTERN_COLORS.TERMINAL_BLUE, 5);
        });
        
        // Timers (Frames @ 60FPS)
        this.showTime = 300;
        this.memorizeTime = Math.max(120, 315 - this.level * 10); 
        this.inputTime = Math.max(30 - this.level, 15) * 60; 
    }

    handleClick(x, y) {
        if (this.state !== "input_pattern") return;

        // Handle Submit Button with hover effect
        this.submitBtn.hover = (x >= this.submitBtn.x && x <= this.submitBtn.x + this.submitBtn.w &&
            y >= this.submitBtn.y && y <= this.submitBtn.y + this.submitBtn.h);
        
        if (this.submitBtn.hover) {
            this.submitBtn.pulse = 0.5;
            this.verifySolution();
            return;
        }

        // Handle Grid Clicks
        if (x < this.gridX || x > this.gridX + this.gridSize * this.cellSize ||
            y < this.gridY || y > this.gridY + this.gridSize * this.cellSize) {
            return;
        }

        const cellX = Math.floor((x - this.gridX) / this.cellSize);
        const cellY = Math.floor((y - this.gridY) / this.cellSize);

        const index = this.playerPattern.findIndex(p => p.x === cellX && p.y === cellY);
        
        if (index !== -1) {
            this.playerPattern.splice(index, 1);
            // Create removal particles
            const px = this.gridX + cellX * this.cellSize + this.cellSize / 2;
            const py = this.gridY + cellY * this.cellSize + this.cellSize / 2;
            this.createParticles(px, py, PATTERN_COLORS.TERMINAL_RED, 8);
        } else {
            this.playerPattern.push({ x: cellX, y: cellY });
            // Create placement particles
            const px = this.gridX + cellX * this.cellSize + this.cellSize / 2;
            const py = this.gridY + cellY * this.cellSize + this.cellSize / 2;
            this.createParticles(px, py, PATTERN_COLORS.TERMINAL_GREEN, 8);
        }
    }

    verifySolution() {
        let correct = true;
        let msg = "Pattern Correct!";

        if (this.playerPattern.length !== this.targetPattern.length) {
            correct = false;
            msg = "Wrong cell count!";
        } else {
            for (let p of this.playerPattern) {
                if (this.distractionCells.some(d => d.x === p.x && d.y === p.y)) {
                    correct = false;
                    msg = "Distraction detected!";
                    break;
                }
            }
            
            if (correct) {
                const allMatch = this.targetPattern.every(t => 
                    this.playerPattern.some(p => p.x === t.x && p.y === t.y)
                );
                if (!allMatch) {
                    correct = false;
                    msg = "Pattern Mismatch!";
                }
            }
        }

        if (correct) {
            this.score += 250 * this.level;
            this.level++;
            // Create victory particles
            for (let i = 0; i < 30; i++) {
                this.particles.push({
                    x: this.width / 2,
                    y: this.height / 2,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 1.0,
                    color: PATTERN_COLORS.TERMINAL_GREEN,
                    size: 3 + Math.random() * 5
                });
            }
            
            if (this.level > this.maxLevel) {
                this.state = "victory";
            } else {
                this.addMessage(`Level ${this.level} Initialized`, PATTERN_COLORS.TERMINAL_GREEN);
                this.generatePuzzle();
            }
        } else {
            this.lives--;
            this.state = "verify";
            this.verifyMsg = msg;
            this.glitchEffect = 20;
            
            // Create failure particles
            this.playerPattern.forEach(cell => {
                const x = this.gridX + cell.x * this.cellSize + this.cellSize / 2;
                const y = this.gridY + cell.y * this.cellSize + this.cellSize / 2;
                this.createParticles(x, y, PATTERN_COLORS.TERMINAL_RED, 15);
            });
        }
    }

    addMessage(text, color) {
        this.messages.push({ text, color, timer: 120 });
    }

    update() {
        if (this.state === "victory" || this.state === "game_over") return;
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.01;
            return p.life > 0;
        });

        // Update scan lines
        this.scanLines.forEach(line => {
            line.y += line.speed;
            if (line.y > this.height) {
                line.y = 0;
            }
        });

        // Update glitch effect
        this.glitchEffect = Math.max(0, this.glitchEffect - 1);

        // Update button pulse
        this.submitBtn.pulse = Math.max(0, this.submitBtn.pulse - 0.01);

        // --- PREPARE PHASE ---
        if (this.state === "prepare") {
            this.prepareTimer -= 1/60;
            if (this.prepareTimer <= 0) {
                this.generatePuzzle();
            }
            return;
        }

        if (this.lives <= 0) {
            this.state = "game_over";
            return;
        }
        
        if (this.corruption >= 100) {
            this.state = "game_over";
            this.addMessage("SYSTEM CORRUPTED", PATTERN_COLORS.TERMINAL_RED);
            return;
        }

        this.corruption = Math.min(100, this.corruption + 0.01);

        if (this.state === "show_pattern") {
            this.showTime--;
            this.pulseIntensity = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            if (this.showTime <= 0) this.state = "memorize";
        } else if (this.state === "memorize") {
            this.memorizeTime--;
            if (this.memorizeTime <= 0) {
                this.state = "input_pattern";
                this.inputTime = Math.max(30 - this.level, 15) * 60; 
            }
        } else if (this.state === "input_pattern") {
            this.inputTime--;
            if (this.inputTime <= 0) {
                this.addMessage("Time's up!", PATTERN_COLORS.TERMINAL_RED);
                this.lives--;
                this.state = "verify";
                this.verifyMsg = "Time Expired!";
            }
        }

        this.messages = this.messages.filter(m => m.timer > 0);
        this.messages.forEach(m => m.timer--);
    }

    drawSidebar(ctx) {
        const sbW = this.width * 0.3;
        
        // Gradient Background
        const gradient = ctx.createLinearGradient(0, 0, sbW, this.height);
        gradient.addColorStop(0, '#0a0a14');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, sbW, this.height);
        
        // Animated border
        ctx.strokeStyle = `rgba(51, 68, 85, ${0.5 + Math.sin(Date.now() / 500) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sbW, 0);
        ctx.lineTo(sbW, this.height);
        ctx.stroke();

        // Decorative circuit lines
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(10, 50 + i * 30);
            ctx.lineTo(sbW - 10, 80 + i * 30);
            ctx.stroke();
        }

        // --- TITLE with glow effect ---
        ctx.textAlign = 'left';
        ctx.shadowColor = PATTERN_COLORS.TERMINAL_CYAN;
        ctx.shadowBlur = 15;
        ctx.fillStyle = PATTERN_COLORS.TERMINAL_CYAN;
        ctx.font = 'bold 24px Courier New';
        ctx.fillText("PATTERN LOCK", 20, 130);
        ctx.shadowBlur = 0;

        // Animated underline
        ctx.strokeStyle = PATTERN_COLORS.TERMINAL_CYAN;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, 140);
        const underlineWidth = 150 + Math.sin(Date.now() / 300) * 20;
        ctx.lineTo(20 + underlineWidth, 140);
        ctx.stroke();

        // --- INSTRUCTIONS with enhanced styling ---
        const instructions = [
            { color: '#fff', text: "■ Watch Blue Cells", icon: '●' },
            { color: '#fff', text: "■ Memorize Pattern", icon: '◆' },
            { color: '#00ff99', text: "■ Recreate & Submit", icon: '▲' },
            { color: '#ff3333', text: "■ AVOID Purple", icon: '■' },
            { color: '#ffd700', text: "■ Click SUBMIT Btn", icon: '★' }
        ];

        let startY = 170;
        ctx.font = '16px Courier New';
        
        instructions.forEach(line => {
            // Draw icon with glow
            ctx.shadowColor = line.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = line.color;
            ctx.fillText(line.icon, 20, startY);
            
            // Draw text
            ctx.shadowBlur = 0;
            ctx.fillStyle = line.color;
            ctx.fillText(line.text, 45, startY);
            startY += 30;
        });

        // --- GAME STATS with progress bars ---
        startY += 40;
        
        ctx.fillStyle = '#8899aa';
        ctx.font = 'bold 18px Courier New';
        ctx.fillText("SYSTEM STATUS:", 20, startY);
        
        startY += 30;
        
        // Lives with heart icons
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Courier New';
        ctx.fillText(`LIVES:`, 20, startY);
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < this.lives ? '#ff3366' : '#333';
            ctx.shadowColor = i < this.lives ? '#ff3366' : 'transparent';
            ctx.shadowBlur = i < this.lives ? 10 : 0;
            ctx.font = '24px Courier New';
            ctx.fillText('♥', 90 + i * 25, startY);
        }
        ctx.shadowBlur = 0;
        
        startY += 30;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Courier New';
        ctx.fillText(`LEVEL:`, 20, startY);
        
        // Level progress bar
        const levelBarX = 90;
        const levelBarY = startY - 12;
        ctx.fillStyle = '#334455';
        ctx.fillRect(levelBarX, levelBarY, 100, 8);
        ctx.fillStyle = PATTERN_COLORS.TERMINAL_CYAN;
        ctx.fillRect(levelBarX, levelBarY, (this.level / this.maxLevel) * 100, 8);
        ctx.fillStyle = '#fff';
        ctx.fillText(`${this.level}/${this.maxLevel}`, 200, startY);
        
        startY += 30;
        ctx.fillStyle = '#fff';
        ctx.fillText(`SCORE: ${this.score}`, 20, startY);

        startY += 30;
        // Corruption bar
        ctx.fillStyle = '#334455';
        ctx.fillRect(20, startY - 12, sbW - 40, 8);
        
        const corruptionGradient = ctx.createLinearGradient(20, 0, sbW - 20, 0);
        corruptionGradient.addColorStop(0, '#00ff66');
        corruptionGradient.addColorStop(0.5, '#ffaa00');
        corruptionGradient.addColorStop(1, '#ff3366');
        
        ctx.fillStyle = corruptionGradient;
        ctx.fillRect(20, startY - 12, (sbW - 40) * (this.corruption / 100), 8);
        
        ctx.fillStyle = this.corruption > 80 ? PATTERN_COLORS.TERMINAL_RED : PATTERN_COLORS.TERMINAL_GREEN;
        ctx.fillText(`CORRUPTION: ${Math.floor(this.corruption)}%`, 20, startY);
    }

    draw(ctx) {
        // Apply glitch effect if active
        if (this.glitchEffect > 0) {
            ctx.save();
            const glitchX = (Math.random() - 0.5) * 10;
            const glitchY = (Math.random() - 0.5) * 10;
            ctx.translate(glitchX, glitchY);
        }

        // Clear with gradient
        const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, '#0a0a14');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw scan lines
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.1)';
        ctx.lineWidth = 1;
        this.scanLines.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(this.gameX, line.y);
            ctx.lineTo(this.width, line.y + 2);
            ctx.strokeStyle = `rgba(0, 255, 100, ${line.opacity})`;
            ctx.stroke();
        });

        // Draw particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        ctx.globalAlpha = 1;

        // Draw Left Sidebar
        this.drawSidebar(ctx);

        // Define Game Area Center
        const cx = this.gameX + this.gameW / 2;
        const cy = this.height / 2;

        // --- PREPARE SCREEN with advanced animation ---
        if (this.state === "prepare") {
            // Animated background
            ctx.fillStyle = 'rgba(0, 150, 255, 0.1)';
            for (let i = 0; i < 5; i++) {
                const offset = (Date.now() / 500 + i * 200) % 400 - 200;
                ctx.beginPath();
                ctx.arc(cx + offset, cy, 100 + i * 30, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.textAlign = "center";
            ctx.shadowColor = PATTERN_COLORS.TERMINAL_BLUE;
            ctx.shadowBlur = 20;
            ctx.fillStyle = "#fff";
            ctx.font = "24px Courier New";
            ctx.fillText("SYSTEM INITIALIZING...", cx, cy - 50);

            ctx.shadowBlur = 30;
            ctx.fillStyle = PATTERN_COLORS.TERMINAL_GREEN;
            ctx.font = "bold 100px Courier New";
            ctx.fillText(Math.ceil(this.prepareTimer), cx, cy + 40);
            ctx.shadowBlur = 0;
            return;
        }

        // --- DYNAMIC TEXT with animations ---
        let headerText = "";
        let timerText = "";
        let headerColor = "#fff";

        if (this.state === "show_pattern") {
            headerText = "⚡ MEMORIZE PATTERN ⚡";
            headerColor = PATTERN_COLORS.TERMINAL_BLUE;
            timerText = `⏱️ ${Math.ceil(this.showTime / 60)}s`;
        } else if (this.state === "memorize") {
            headerText = "🌀 HOLD PATTERN... 🌀";
            headerColor = PATTERN_COLORS.TERMINAL_CYAN;
            timerText = `⏳ ${Math.ceil(this.memorizeTime / 60)}s`;
        } else if (this.state === "input_pattern") {
            headerText = "🎯 RECREATE PATTERN 🎯";
            headerColor = PATTERN_COLORS.TERMINAL_GREEN;
            timerText = `⏰ ${Math.ceil(this.inputTime / 60)}s`;
        } else if (this.state === "verify") {
            headerText = "⚠️ VERIFICATION FAILED ⚠️";
            headerColor = PATTERN_COLORS.TERMINAL_RED;
            timerText = "Press SPACE to retry";
        }

        // Draw Header with glow
        ctx.textAlign = "center";
        ctx.shadowColor = headerColor;
        ctx.shadowBlur = 20;
        ctx.font = "bold 32px Courier New";
        ctx.fillStyle = headerColor;
        ctx.fillText(headerText, cx, this.gridY - 30);
        ctx.shadowBlur = 0;

        // Draw Timer
        const gridHeight = this.gridSize * this.cellSize;
        ctx.font = "bold 24px Courier New";
        
        if (this.state === "verify") {
            ctx.shadowColor = PATTERN_COLORS.TERMINAL_RED;
            ctx.shadowBlur = 10;
            ctx.fillStyle = PATTERN_COLORS.TERMINAL_RED;
            ctx.fillText(this.verifyMsg, cx, this.gridY + gridHeight + 30);
            ctx.shadowColor = '#fff';
            ctx.fillStyle = "#fff";
            ctx.fillText(timerText, cx, this.gridY + gridHeight + 60);
            ctx.shadowBlur = 0;
        } else {
            ctx.shadowColor = PATTERN_COLORS.TERMINAL_GREEN;
            ctx.shadowBlur = 10;
            ctx.fillStyle = PATTERN_COLORS.TERMINAL_GREEN;
            ctx.fillText(timerText, cx, this.gridY + gridHeight + 30);
            ctx.shadowBlur = 0;
        }

        // --- GRID DRAWING with advanced effects ---
        const gridWidth = this.gridSize * this.cellSize;
        
        // Grid Container with glow
        ctx.shadowColor = PATTERN_COLORS.TERMINAL_CYAN;
        ctx.shadowBlur = 20;
        ctx.fillStyle = PATTERN_COLORS.DARK_BLUE;
        ctx.beginPath();
        ctx.roundRect(this.gridX - 10, this.gridY - 10, gridWidth + 20, gridWidth + 20, 10);
        ctx.fill();
        
        // Animated border
        ctx.strokeStyle = PATTERN_COLORS.TERMINAL_CYAN;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 30;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw Cells with enhanced visuals
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const drawX = this.gridX + x * this.cellSize + 5;
                const drawY = this.gridY + y * this.cellSize + 5;
                const size = this.cellSize - 10;
                
                let cellColor = PATTERN_COLORS.CELL_BG;
                let borderColor = PATTERN_COLORS.CELL_BORDER;
                let glowColor = 'transparent';
                let glowIntensity = 0;
                
                const inTarget = this.targetPattern.some(p => p.x === x && p.y === y);
                const inPlayer = this.playerPattern.some(p => p.x === x && p.y === y);
                const inDistract = this.distractionCells.some(p => p.x === x && p.y === y);

                if (this.state === "show_pattern") {
                    if (inTarget) {
                        cellColor = PATTERN_COLORS.TERMINAL_BLUE;
                        borderColor = PATTERN_COLORS.TERMINAL_CYAN;
                        glowColor = PATTERN_COLORS.TERMINAL_BLUE;
                        glowIntensity = 20 + Math.sin(Date.now() / 200) * 10;
                    } else if (inDistract) {
                        const pulse = Math.floor(Date.now() / 200) % 2;
                        cellColor = pulse ? PATTERN_COLORS.TERMINAL_PURPLE : 'rgb(100, 30, 150)';
                        borderColor = PATTERN_COLORS.TERMINAL_PURPLE;
                        glowColor = PATTERN_COLORS.TERMINAL_PURPLE;
                        glowIntensity = 15;
                    }
                } else if (this.state === "memorize") {
                    if (inTarget) {
                        const fade = Math.max(0, this.memorizeTime / 180);
                        cellColor = `rgba(0, 150, 255, ${fade})`;
                        borderColor = `rgba(0, 220, 220, ${fade})`;
                        glowColor = PATTERN_COLORS.TERMINAL_BLUE;
                        glowIntensity = fade * 20;
                    }
                } else if (this.state === "input_pattern") {
                    if (inPlayer) {
                        borderColor = 'rgb(150, 150, 150)';
                        cellColor = PATTERN_COLORS.INPUT_BG;
                        glowColor = PATTERN_COLORS.TERMINAL_GREEN;
                        glowIntensity = 15;
                    }
                } else if (["verify", "game_over", "victory"].includes(this.state)) {
                    if (inPlayer) {
                        if (inTarget) {
                            cellColor = PATTERN_COLORS.TERMINAL_GREEN;
                            borderColor = 'rgb(100, 255, 150)';
                            glowColor = PATTERN_COLORS.TERMINAL_GREEN;
                        } else {
                            cellColor = PATTERN_COLORS.TERMINAL_RED;
                            borderColor = 'rgb(255, 100, 100)';
                            glowColor = PATTERN_COLORS.TERMINAL_RED;
                        }
                        glowIntensity = 20;
                    } else if (inTarget) {
                        cellColor = PATTERN_COLORS.TERMINAL_BLUE;
                        borderColor = PATTERN_COLORS.TERMINAL_CYAN;
                        glowColor = PATTERN_COLORS.TERMINAL_BLUE;
                        glowIntensity = 15;
                    } else if (inDistract) {
                        cellColor = 'rgb(80, 30, 120)';
                        glowColor = PATTERN_COLORS.TERMINAL_PURPLE;
                        glowIntensity = 10;
                    }
                }

                // Apply glow
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = glowIntensity;

                // Draw cell with gradient
                const cellGradient = ctx.createRadialGradient(
                    drawX + size/3, drawY + size/3, 5,
                    drawX + size/2, drawY + size/2, size
                );
                cellGradient.addColorStop(0, cellColor);
                cellGradient.addColorStop(1, this.adjustColor(cellColor, -30));
                
                ctx.fillStyle = cellGradient;
                ctx.beginPath();
                ctx.roundRect(drawX, drawY, size, size, 5);
                ctx.fill();
                
                // Draw border
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw corner accents for input mode
                if (this.state === "input_pattern" && inPlayer) {
                    ctx.strokeStyle = PATTERN_COLORS.TERMINAL_GREEN;
                    ctx.lineWidth = 1;
                    const cornerSize = 5;
                    
                    // Top-left corner
                    ctx.beginPath();
                    ctx.moveTo(drawX, drawY + cornerSize);
                    ctx.lineTo(drawX, drawY);
                    ctx.lineTo(drawX + cornerSize, drawY);
                    ctx.stroke();
                    
                    // Top-right corner
                    ctx.beginPath();
                    ctx.moveTo(drawX + size - cornerSize, drawY);
                    ctx.lineTo(drawX + size, drawY);
                    ctx.lineTo(drawX + size, drawY + cornerSize);
                    ctx.stroke();
                    
                    // Bottom-right corner
                    ctx.beginPath();
                    ctx.moveTo(drawX + size, drawY + size - cornerSize);
                    ctx.lineTo(drawX + size, drawY + size);
                    ctx.lineTo(drawX + size - cornerSize, drawY + size);
                    ctx.stroke();
                    
                    // Bottom-left corner
                    ctx.beginPath();
                    ctx.moveTo(drawX + cornerSize, drawY + size);
                    ctx.lineTo(drawX, drawY + size);
                    ctx.lineTo(drawX, drawY + size - cornerSize);
                    ctx.stroke();
                }
            }
        }
        ctx.shadowBlur = 0;

        // --- SUBMIT BUTTON with advanced styling ---
        if (this.state === "input_pattern") {
            // Button glow
            ctx.shadowColor = PATTERN_COLORS.TERMINAL_GREEN;
            ctx.shadowBlur = this.submitBtn.hover ? 30 : 15;
            
            // Button gradient
            const btnGradient = ctx.createLinearGradient(
                this.submitBtn.x, this.submitBtn.y,
                this.submitBtn.x, this.submitBtn.y + this.submitBtn.h
            );
            btnGradient.addColorStop(0, this.submitBtn.hover ? '#006600' : '#004400');
            btnGradient.addColorStop(1, '#002200');
            
            ctx.fillStyle = btnGradient;
            ctx.beginPath();
            ctx.roundRect(this.submitBtn.x, this.submitBtn.y, this.submitBtn.w, this.submitBtn.h, 8);
            ctx.fill();
            
            // Animated border
            ctx.strokeStyle = PATTERN_COLORS.TERMINAL_GREEN;
            ctx.lineWidth = this.submitBtn.hover ? 3 : 2;
            ctx.stroke();
            
            // Text with pulse
            ctx.textAlign = "center";
            ctx.shadowColor = PATTERN_COLORS.TERMINAL_GREEN;
            ctx.shadowBlur = this.submitBtn.pulse > 0 ? 20 : 10;
            ctx.fillStyle = PATTERN_COLORS.TERMINAL_GREEN;
            ctx.font = `bold ${this.submitBtn.hover ? 26 : 24}px 'Courier New'`;
            ctx.fillText("SUBMIT", this.submitBtn.x + this.submitBtn.w/2, this.submitBtn.y + 32);
            ctx.shadowBlur = 0;
        }

        // --- OVERLAYS with enhanced visuals ---
        if (this.state === "victory") {
            const overlayGradient = ctx.createRadialGradient(cx, cy, 100, cx, cy, 500);
            overlayGradient.addColorStop(0, 'rgba(0, 255, 100, 0.3)');
            overlayGradient.addColorStop(1, 'rgba(0, 50, 0, 0.9)');
            
            ctx.fillStyle = overlayGradient;
            ctx.fillRect(this.gameX, 0, this.gameW, this.height);
            
            // Victory animation
            ctx.shadowColor = PATTERN_COLORS.TERMINAL_GREEN;
            ctx.shadowBlur = 50;
            ctx.textAlign = "center";
            ctx.fillStyle = PATTERN_COLORS.TERMINAL_GREEN;
            ctx.font = "bold 56px 'Courier New'";
            ctx.fillText("ACCESS GRANTED", cx, cy);
            
            ctx.shadowBlur = 20;
            ctx.font = "28px 'Courier New'";
            ctx.fillText(`Final Score: ${this.score}`, cx, cy + 70);
            ctx.shadowBlur = 0;
            
            // Particle effects
            for (let i = 0; i < 5; i++) {
                const angle = (Date.now() / 500 + i * 1.2) % (Math.PI * 2);
                const x = cx + Math.cos(angle) * 150;
                const y = cy + Math.sin(angle) * 150;
                
                ctx.fillStyle = PATTERN_COLORS.TERMINAL_GREEN;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        else if (this.state === "game_over") {
            const overlayGradient = ctx.createRadialGradient(cx, cy, 100, cx, cy, 500);
            overlayGradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
            overlayGradient.addColorStop(1, 'rgba(50, 0, 0, 0.9)');
            
            ctx.fillStyle = overlayGradient;
            ctx.fillRect(this.gameX, 0, this.gameW, this.height);
            
            ctx.shadowColor = PATTERN_COLORS.TERMINAL_RED;
            ctx.shadowBlur = 50;
            ctx.textAlign = "center";
            ctx.fillStyle = PATTERN_COLORS.TERMINAL_RED;
            ctx.font = "bold 56px 'Courier New'";
            ctx.fillText("ACCESS DENIED", cx, cy);
            
            ctx.shadowBlur = 20;
            ctx.font = "28px 'Courier New'";
            ctx.fillText("Security protocol triggered.", cx, cy + 70);
            ctx.shadowBlur = 0;
        }

        // Restore from glitch effect
        if (this.glitchEffect > 0) {
            ctx.restore();
        }
    }

    adjustColor(color, amount) {
        // Helper function to adjust color brightness
        if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g).map(Number);
            rgb.forEach((val, i) => {
                rgb[i] = Math.max(0, Math.min(255, val + amount));
            });
            return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        }
        return color;
    }
}

// Export
window.SecurityPuzzle = SecurityPuzzle;