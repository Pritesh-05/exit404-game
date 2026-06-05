// minigames/circuit-game.js
// Enhanced UI with computer-terminal aesthetics, glowing effects, and dynamic warnings

class CircuitGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // --- BASE COLORS ---
        this.COLORS = {
            BG: '#050505',
            SIDEBAR_BG: '#0a0a0a',
            SIDEBAR_BORDER: '#444',
            TEXT: '#00ff00', 
            TEXT_WARN: '#ffaa00',
            TEXT_CRIT: '#ff0000',
            TEXT_INFO: '#00ccff',
            SAFE: 'rgb(0, 255, 150)',
            UNSAFE: 'rgb(255, 50, 50)',
            CRITICAL: 'rgb(255, 180, 0)',
            OUTLINE: 'rgb(60, 60, 80)',
            GRID_BG: 'rgba(20, 20, 30, 0.5)'
        };

        // --- LEVEL CONFIGURATIONS with themes & difficulty scaling ---
        this.levelConfigs = {
            1: {
                rows: 3, cols: 3,
                switchInterval: 3.0, 
                survivalTime: 12, 
                infectionGain: 60, 
                infectionLoss: 40,
                criticalMultiplier: 1.2,
                criticalCount: 1,
                title: "BYPASS LEVEL 1",
                theme: {
                    safe: '#00ff00',      // green
                    unsafe: '#ff0000',     // red
                    critical: '#ffff00',    // yellow
                    info: '#00ccff'         // cyan
                }
            },
            2: {
                rows: 3, cols: 3,
                switchInterval: 2.5, 
                survivalTime: 15, 
                infectionGain: 80, 
                infectionLoss: 30,
                criticalMultiplier: 1.5,
                criticalCount: 1,
                title: "BYPASS LEVEL 2",
                theme: {
                    safe: '#00ffff',       // cyan
                    unsafe: '#ff8800',      // orange
                    critical: '#ff00ff',     // magenta
                    info: '#ffaa00'          // amber
                }
            },
            3: {
                rows: 4, cols: 4, 
                switchInterval: 2.0,
                survivalTime: 18, 
                infectionGain: 100, 
                infectionLoss: 20,
                criticalMultiplier: 2.0,
                criticalCount: 2,
                title: "BYPASS LEVEL 3",
                theme: {
                    safe: '#8888ff',        // soft blue
                    unsafe: '#ff8888',       // soft red
                    critical: '#ffdd44',      // gold
                    info: '#ff66aa'           // pink
                }
            }
        };

        // Global flag for instructions
        if (typeof window.circuitInstructionsSeen === 'undefined') {
            window.circuitInstructionsSeen = false;
        }

        // State
        this.currentLevel = 1;
        this.infection = 0;
        this.switches = [];
        this.isRunning = false;
        this.gameState = "MENU"; 
        this.prepTimer = 5; 
        this.sidebarWidth = 300;
        this.lastTime = 0;

        // Level-specific colors
        this.safeColor = this.COLORS.SAFE;
        this.unsafeColor = this.COLORS.UNSAFE;
        this.criticalColor = this.COLORS.CRITICAL;
        this.infoColor = this.COLORS.TEXT_INFO;

        // UI animation
        this.scanlineOffset = 0;
        this.blinkState = true;          // for blinking cursor
        this.lastBlinkTime = 0;
        this.warningPulse = 0;            // for infection warning

        // Input Binding
        this.boundHandleClick = (e) => this.handleClick(e);
        this.canvas.addEventListener('mousedown', this.boundHandleClick);
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    cleanup() {
        this.isRunning = false;
        this.canvas.removeEventListener('mousedown', this.boundHandleClick);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.sidebarWidth = Math.max(250, Math.min(350, this.width * 0.25));
        
        // Game Area (Right side)
        this.gameAreaX = this.sidebarWidth;
        this.gameAreaW = this.width - this.sidebarWidth;
        this.gameAreaH = this.height;
    }

    startGame() {
        this.currentLevel = 1;
        this.startLevel(1);
        this.loop();
    }

    startLevel(levelNum) {
        this.currentLevel = levelNum;
        this.config = this.levelConfigs[levelNum];
        
        // Set level-specific colors
        this.safeColor = this.config.theme.safe;
        this.unsafeColor = this.config.theme.unsafe;
        this.criticalColor = this.config.theme.critical;
        this.infoColor = this.config.theme.info;
        
        this.infection = 0;
        this.switches = []; 
        
        this.generateSwitches();
        this.isRunning = true;

        if (!window.circuitInstructionsSeen) {
            this.gameState = "PREPARING";
            this.prepTimer = 5;
            this.lastTime = Date.now();
            window.circuitInstructionsSeen = true; 
        } else {
            this.startPlaying();
        }
    }

    startPlaying() {
        this.gameState = "PLAYING";
        this.startTime = Date.now() / 1000;
        this.lastChangeTime = Date.now() / 1000;
        this.lastTime = Date.now();
        this.generateSwitches(); 
    }

    generateSwitches() {
        const { rows, cols, criticalCount } = this.config;
        this.switches = [];
        
        const gridW = Math.min(600, this.gameAreaW - 100);
        const gridH = Math.min(500, this.gameAreaH - 100);
        
        const startX = this.gameAreaX + (this.gameAreaW - gridW) / 2;
        const startY = (this.gameAreaH - gridH) / 2;
        
        const cellW = gridW / cols;
        const cellH = gridH / rows;
        const size = Math.min(cellW, cellH) * 0.7; 

        const totalCells = rows * cols;
        const criticalIndices = new Set();
        while (criticalIndices.size < criticalCount) {
            criticalIndices.add(Math.floor(Math.random() * totalCells));
        }

        for (let i = 0; i < totalCells; i++) {
            const r = Math.floor(i / cols);
            const c = i % cols;
            
            const cx = startX + c * cellW + cellW/2;
            const cy = startY + r * cellH + cellH/2;
            
            this.switches.push({
                x: cx - size/2,
                y: cy - size/2,
                w: size,
                h: size,
                state: Math.random() < 0.5, 
                clicked: false,
                critical: criticalIndices.has(i),
                flashTime: 0,
                glowIntensity: 0  // for animated glow
            });
        }
    }

    checkClearCondition() {
        const greenSwitches = this.switches.filter(s => s.state);
        if (greenSwitches.length === 0) return true;

        const allCleared = greenSwitches.every(s => s.clicked);
        if (!allCleared) {
            this.infection += 80 + (this.currentLevel * 10); 
        }
        return allCleared;
    }

    handleClick(e) {
        if (!this.isRunning) return;
        if (this.gameState !== "PLAYING") return;

        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (mx < this.gameAreaX) return;

        for (let s of this.switches) {
            if (mx >= s.x && mx <= s.x + s.w && 
                my >= s.y && my <= s.y + s.h && !s.clicked) {
                
                s.flashTime = Date.now() / 1000;
                let multiplier = s.critical ? this.config.criticalMultiplier : 1.0;

                if (!s.state) { // Unsafe
                    this.infection += this.config.infectionGain * multiplier;
                } else { // Safe
                    this.infection = Math.max(0, this.infection - this.config.infectionLoss * multiplier);
                    s.clicked = true;
                }
                break;
            }
        }
    }

    update() {
        if (!this.isRunning) return;
        const now = Date.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // Blinking cursor update
        if (now - this.lastBlinkTime > 500) {
            this.blinkState = !this.blinkState;
            this.lastBlinkTime = now;
        }

        // Warning pulse (for high infection)
        this.warningPulse = Math.sin(now * 0.01) * 0.5 + 0.5;

        if (this.gameState === "PREPARING") {
            this.prepTimer -= dt;
            if (this.prepTimer <= 0) {
                this.startPlaying();
            }
            return;
        }

        if (this.gameState !== "PLAYING") return;

        const currentTime = now / 1000;
        
        if (currentTime - this.lastChangeTime >= this.config.switchInterval) {
            this.checkClearCondition();
            this.generateSwitches();
            this.lastChangeTime = currentTime;
        }

        const elapsed = currentTime - this.startTime;
        this.infection = Math.max(0, Math.min(this.infection, 400));

        if (this.infection >= 400) {
            this.finishLevel(false);
        } else if (elapsed >= this.config.survivalTime) {
            this.finishLevel(true);
        }
    }

    finishLevel(success) {
        this.gameState = "TRANSITION";
        setTimeout(() => {
            if (success) {
                if (this.currentLevel < 3) {
                    this.startLevel(this.currentLevel + 1);
                } else {
                    this.endGame(true);
                }
            } else {
                this.endGame(false);
            }
        }, 1500); 
    }

    endGame(success) {
        this.gameState = "END";
        setTimeout(() => {
            if (window.onCircuitEnd) window.onCircuitEnd(success);
        }, 1000);
    }

    // --- RENDERING (Enhanced Computer UI) ---

    draw() {
        // Clear background
        this.ctx.fillStyle = this.COLORS.BG;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw static noise (very subtle)
        this.drawNoise();

        // Sidebar and game area
        this.drawSidebar();
        this.drawCRTFrame(); // monitor effect around game area
        this.drawGridOverlay();

        if (this.gameState === "PREPARING") {
            this.drawSwitches(true); 
            this.drawPrepOverlay();
        } else if (this.gameState === "PLAYING") {
            this.drawSwitches(false); 
            if (this.infection > 320) this.drawHighInfectionWarning();
        } else if (this.gameState === "TRANSITION" || this.gameState === "END") {
            this.drawMessage(this.infection >= 400 ? "FAILURE" : "SUCCESS");
        }

        // Draw scanlines and vignette
        this.drawScanlines();
        this.drawVignette();
    }

    drawSidebar() {
        const w = this.sidebarWidth;
        const h = this.height;
        const pad = 20;

        // Background with subtle gradient
        const gradient = this.ctx.createLinearGradient(0, 0, w, 0);
        gradient.addColorStop(0, '#111');
        gradient.addColorStop(1, '#0a0a0a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, w, h);
        
        // Border line
        this.ctx.strokeStyle = this.infoColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(w, 0); this.ctx.lineTo(w, h);
        this.ctx.stroke();

        let y = 140; 
        
        // Header with level title
        this.ctx.shadowColor = this.infoColor;
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = this.infoColor;
        this.ctx.font = "bold 28px 'Share Tech Mono', 'Courier New', monospace";
        this.ctx.textAlign = "left";
        this.ctx.fillText(this.config ? this.config.title : "CIRCUIT BREAKER", pad, y);
        this.ctx.shadowBlur = 0;
        
        y += 40;
        this.ctx.font = "16px 'Share Tech Mono', monospace";
        this.ctx.fillStyle = "#aaa";
        this.ctx.fillText(`PROTOCOL LVL: ${this.currentLevel}/3`, pad, y);

        // Instructions with level-specific colors
        y += 60;
        this.ctx.fillStyle = this.infoColor;
        this.ctx.font = "bold 20px 'Share Tech Mono', monospace";
        this.ctx.fillText("> INSTRUCTIONS <", pad, y);
        
        y += 30;
        this.ctx.font = "16px monospace";
        this.ctx.fillStyle = this.safeColor;
        this.ctx.fillText("> CLICK SAFE NODES", pad, y);
        
        y += 25;
        this.ctx.fillStyle = this.unsafeColor;
        this.ctx.fillText("> AVOID UNSAFE NODES", pad, y);
        
        y += 25;
        this.ctx.fillStyle = this.criticalColor;
        this.ctx.fillText("> CRITICAL multiplies", pad, y);
        
        y += 25;
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText("> KEEP BAR LOW", pad, y);

        // Blinking cursor at the end of instructions
        if (this.blinkState) {
            this.ctx.fillStyle = '#0f0';
            this.ctx.font = "20px monospace";
            this.ctx.fillText("_", pad, y + 10);
        }

        // Timer with flicker effect when low
        y += 60;
        let timeDisplay = "0.0s";
        let timeColor = "#fff";
        if (this.gameState === "PLAYING" && this.config) {
            const elapsed = (Date.now()/1000) - this.startTime;
            const remaining = Math.max(0, this.config.survivalTime - elapsed);
            timeDisplay = remaining.toFixed(1) + "s";
            if (remaining < 3) {
                // Flicker red
                timeColor = Math.sin(Date.now() * 0.02) > 0 ? '#ff0000' : '#ff8888';
            }
        } else if (this.gameState === "PREPARING") {
            timeDisplay = "READY?";
        }
        
        this.ctx.fillStyle = "#888";
        this.ctx.font = "bold 18px 'Share Tech Mono', monospace";
        this.ctx.fillText("TIME REMAINING:", pad, y);
        this.ctx.font = "bold 36px monospace";
        this.ctx.fillStyle = timeColor;
        this.ctx.fillText(timeDisplay, pad, y + 40);

        // Infection Bar with tick marks
        y += 100;
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "bold 18px 'Share Tech Mono', monospace";
        this.ctx.fillText("SYSTEM INSTABILITY:", pad, y);
        
        y += 15;
        const barH = 20;
        const barW = w - (pad * 2);
        
        // Background
        this.ctx.fillStyle = "#222";
        this.ctx.fillRect(pad, y, barW, barH);
        
        // Fill
        const pct = Math.min(1, this.infection / 400);
        let barColor = pct > 0.8 ? this.unsafeColor : (pct > 0.5 ? this.criticalColor : this.safeColor);
        // Pulse if critical
        if (pct > 0.9) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            barColor = this.blendColors(barColor, '#ff0000', pulse);
        }
        this.ctx.fillStyle = barColor;
        this.ctx.fillRect(pad, y, barW * pct, barH);
        
        // Tick marks
        this.ctx.strokeStyle = "#666";
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            let x = pad + (barW * i / 4);
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + barH);
            this.ctx.stroke();
        }
        
        // Border
        this.ctx.strokeStyle = "#888";
        this.ctx.strokeRect(pad, y, barW, barH);
    }

    // Utility to blend colors (simplified)
    blendColors(c1, c2, ratio) {
        // Rough hex to rgb, ignore for brevity, just return c2 for pulse
        return c2;
    }

    drawCRTFrame() {
        // Inner glow / bevel for game area
        const x = this.gameAreaX;
        const y = 0;
        const w = this.gameAreaW;
        const h = this.gameAreaH;

        this.ctx.save();
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = '#0f0';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
        this.ctx.shadowBlur = 0;
        this.ctx.restore();

        // Corner accents
        this.ctx.strokeStyle = '#0f0';
        this.ctx.lineWidth = 2;
        const cornerLen = 20;
        // top-left
        this.ctx.beginPath();
        this.ctx.moveTo(x + 10, y + 10);
        this.ctx.lineTo(x + 10 + cornerLen, y + 10);
        this.ctx.moveTo(x + 10, y + 10);
        this.ctx.lineTo(x + 10, y + 10 + cornerLen);
        this.ctx.stroke();
        // top-right
        this.ctx.beginPath();
        this.ctx.moveTo(x + w - 10, y + 10);
        this.ctx.lineTo(x + w - 10 - cornerLen, y + 10);
        this.ctx.moveTo(x + w - 10, y + 10);
        this.ctx.lineTo(x + w - 10, y + 10 + cornerLen);
        this.ctx.stroke();
        // bottom-left
        this.ctx.beginPath();
        this.ctx.moveTo(x + 10, y + h - 10);
        this.ctx.lineTo(x + 10 + cornerLen, y + h - 10);
        this.ctx.moveTo(x + 10, y + h - 10);
        this.ctx.lineTo(x + 10, y + h - 10 - cornerLen);
        this.ctx.stroke();
        // bottom-right
        this.ctx.beginPath();
        this.ctx.moveTo(x + w - 10, y + h - 10);
        this.ctx.lineTo(x + w - 10 - cornerLen, y + h - 10);
        this.ctx.moveTo(x + w - 10, y + h - 10);
        this.ctx.lineTo(x + w - 10, y + h - 10 - cornerLen);
        this.ctx.stroke();
    }

    drawPrepOverlay() {
        const cx = this.gameAreaX + this.gameAreaW / 2;
        const cy = this.height / 2;

        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.fillRect(this.gameAreaX, 0, this.gameAreaW, this.height);

        this.ctx.textAlign = "center";
        this.ctx.shadowColor = this.infoColor;
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "bold 40px 'Share Tech Mono', monospace";
        this.ctx.fillText("READ INSTRUCTIONS", cx, cy - 60);
        
        this.ctx.fillStyle = this.infoColor;
        this.ctx.font = "bold 100px monospace";
        this.ctx.fillText(Math.ceil(this.prepTimer), cx, cy + 40);
        
        this.ctx.font = "24px monospace";
        this.ctx.fillStyle = "#aaa";
        this.ctx.fillText("Check the Sidebar <---", cx, cy + 120);
        this.ctx.shadowBlur = 0;
    }

    drawSwitches(dimmed = false) {
        const currentTime = Date.now() / 1000;
        const opacity = dimmed ? 0.3 : 1.0;

        for (let s of this.switches) {
            // Draw glow for critical nodes (using shadow)
            if (s.critical && !s.clicked && !dimmed) {
                this.ctx.shadowColor = this.criticalColor;
                this.ctx.shadowBlur = 20;
            } else {
                this.ctx.shadowBlur = 0;
            }

            // Base fill
            this.ctx.fillStyle = `rgba(30, 30, 40, ${opacity})`;
            this.ctx.fillRect(s.x, s.y, s.w, s.h);
            
            // Border
            this.ctx.strokeStyle = `rgba(100, 100, 120, ${opacity})`;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(s.x, s.y, s.w, s.h);

            // Inner color
            let color;
            if (s.clicked) {
                color = '#222'; // dark when clicked
            } else {
                color = s.state ? this.safeColor : this.unsafeColor;
            }

            // Flash on click
            if (currentTime - s.flashTime < 0.1) {
                color = '#fff';
            }

            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = opacity;
            this.ctx.fillRect(s.x + 8, s.y + 8, s.w - 16, s.h - 16);
            this.ctx.globalAlpha = 1.0;

            // Extra glow for critical (if not clicked)
            if (s.critical && !s.clicked && !dimmed) {
                this.ctx.shadowBlur = 30;
                this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
                this.ctx.fillRect(s.x + 4, s.y + 4, s.w - 8, s.h - 8);
            }

            this.ctx.shadowBlur = 0;
        }
    }

    drawHighInfectionWarning() {
        const cx = this.gameAreaX + this.gameAreaW / 2;
        const cy = 80;
        this.ctx.textAlign = "center";
        this.ctx.font = "bold 30px 'Share Tech Mono', monospace";
        this.ctx.fillStyle = `rgba(255, 0, 0, ${this.warningPulse})`;
        this.ctx.fillText("⚠ WARNING: SYSTEM CRITICAL ⚠", cx, cy);
    }

    drawMessage(msg) {
        const cx = this.gameAreaX + this.gameAreaW / 2;
        const cy = this.height / 2;

        this.ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        this.ctx.fillRect(this.gameAreaX, 0, this.gameAreaW, this.height);

        const color = msg === "SUCCESS" ? this.safeColor : this.unsafeColor;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 30;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = "center";
        this.ctx.font = "bold 70px 'Share Tech Mono', monospace";
        this.ctx.fillText(msg, cx, cy);
        this.ctx.shadowBlur = 0;

        // Subtext
        this.ctx.font = "20px monospace";
        this.ctx.fillStyle = "#aaa";
        this.ctx.fillText(">> press any key to continue <<", cx, cy + 80);
    }

    drawGridOverlay() {
        const cellSize = 50;
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = this.gameAreaX; x < this.gameAreaX + this.gameAreaW; x += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.height; y += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.gameAreaX, y);
            this.ctx.lineTo(this.gameAreaX + this.gameAreaW, y);
            this.ctx.stroke();
        }
    }

    drawScanlines() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let y = 0; y < this.height; y += 4) {
            this.ctx.fillRect(this.gameAreaX, y, this.gameAreaW, 2);
        }
    }

    drawVignette() {
        const gradient = this.ctx.createRadialGradient(
            this.gameAreaX + this.gameAreaW/2, this.height/2, this.height*0.3,
            this.gameAreaX + this.gameAreaW/2, this.height/2, this.height*0.8
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.gameAreaX, 0, this.gameAreaW, this.height);
    }

    drawNoise() {
        // Very subtle noise
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            if (Math.random() < 0.01) {
                data[i] = data[i+1] = data[i+2] = 50; // gray
            }
        }
        this.ctx.putImageData(imageData, 0, 0);
    }

    loop() {
        if (this.isRunning) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.loop());
        }
    }
}