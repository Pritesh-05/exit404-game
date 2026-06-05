// neural-game.js - UI Upgraded Matrix Decryptor

window.VIREX_COLORS = {
    BG: '#06080A',           // Pitch dark blue/grey
    SIDEBAR_BG: '#0A0E14',   // Slightly lighter panel
    PANEL_BORDER: '#162233', // Subtle panel outlines
    TEXT_MAIN: '#00F0FF',    // Piercing neon cyan
    TEXT_DIM: '#005566',     // Muted cyan
    TEXT_ERROR: '#FF2A2A',   // Sharp crimson
    CELL_BG: '#0A121A',      // Empty matrix cell
    CELL_HOVER: '#112233',
    HIGHLIGHT: 'rgba(0, 240, 255, 0.1)', // Row/Col active highlight
    SELECTED: '#00F0FF',
    SELECTED_TEXT: '#000000'
};

const HEX_POOL = ['1C', 'E9', '55', 'BD', '7A', 'FF', '0A', 'C3'];

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

class NeuralGame {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.mouseX = 0;
        this.mouseY = 0;

        this.boundMouseMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        };

        this.boundClickHandler = (e) => { 
            e.preventDefault();
            this.handleInput(); 
        };

        this.canvas.addEventListener('mousemove', this.boundMouseMove);
        this.canvas.addEventListener('mousedown', this.boundClickHandler);
        
        this.gridSize = 6;
        this.grid = [];
        this.targetSequence = [];
        this.currentBuffer = [];
        
        this.activeAxis = 'row'; 
        this.activeIndex = 0;
        this.selectedCoords = [];
        
        this.resetGame();
    }

    destroy() {
        this.canvas.removeEventListener('mousemove', this.boundMouseMove);
        this.canvas.removeEventListener('mousedown', this.boundClickHandler);
    }

    resetGame() {
        this.level = 1;
        this.hacksCompleted = 0;
        
        this.levelConfig = {
            1: { seqLength: 3, time: 45, hacksReq: 2 },
            2: { seqLength: 4, time: 50, hacksReq: 3 },
            3: { seqLength: 5, time: 60, hacksReq: 3 }
        };
        
        this.timeLeft = this.levelConfig[1].time;
        this.gameState = "prepare";
        this.prepareTimer = 3.0;
        
        this.message = "";
        this.messageColor = window.VIREX_COLORS.TEXT_MAIN;
        this.messageTimer = 0;
    }

    generatePuzzle() {
        this.currentBuffer = [];
        this.selectedCoords = [];
        this.activeAxis = 'row';
        this.activeIndex = 0;
        
        const config = this.levelConfig[this.level] || this.levelConfig[3];
        
        this.grid = [];
        for (let r = 0; r < this.gridSize; r++) {
            let row = [];
            for (let c = 0; c < this.gridSize; c++) {
                row.push(randomChoice(HEX_POOL));
            }
            this.grid.push(row);
        }

        let path = [];
        let currRow = 0; 
        let currCol = Math.floor(Math.random() * this.gridSize);
        path.push({r: currRow, c: currCol});
        
        let simAxis = 'col'; 
        
        for (let i = 1; i < config.seqLength; i++) {
            if (simAxis === 'col') {
                let newRow;
                do { newRow = Math.floor(Math.random() * this.gridSize); } 
                while (newRow === currRow); 
                currRow = newRow;
                simAxis = 'row';
            } else {
                let newCol;
                do { newCol = Math.floor(Math.random() * this.gridSize); } 
                while (newCol === currCol);
                currCol = newCol;
                simAxis = 'col';
            }
            path.push({r: currRow, c: currCol});
        }

        this.targetSequence = path.map(pos => this.grid[pos.r][pos.c]);
    }

    update() {
        if (this.gameState === "gameover" || this.gameState === "victory") return;

        if (this.gameState === "prepare") {
            this.prepareTimer -= 1/60;
            if (this.prepareTimer <= 0) {
                this.gameState = "playing";
                this.generatePuzzle();
            }
            return;
        }

        if (this.gameState === "error") {
            this.prepareTimer -= 1/60;
            if (this.prepareTimer <= 0) {
                this.gameState = "playing";
                this.currentBuffer = [];
                this.selectedCoords = [];
                this.activeAxis = 'row';
                this.activeIndex = 0;
            }
            return;
        }

        this.timeLeft -= 1/60;
        if (this.timeLeft <= 0) {
            this.gameState = "gameover";
            return;
        }

        if (this.messageTimer > 0) this.messageTimer--;
    }

    handleInput() {
        if (this.gameState !== "playing") return;

        const gameX = this.width * 0.35;
        const gameW = this.width * 0.65;
        const cellSize = Math.min(gameW / (this.gridSize + 2), this.height / (this.gridSize + 2));
        const offsetX = gameX + (gameW - (cellSize * this.gridSize)) / 2;
        const offsetY = (this.height - (cellSize * this.gridSize)) / 2 + 30;

        if (this.mouseX >= offsetX && this.mouseX <= offsetX + cellSize * this.gridSize &&
            this.mouseY >= offsetY && this.mouseY <= offsetY + cellSize * this.gridSize) {
            
            const col = Math.floor((this.mouseX - offsetX) / cellSize);
            const row = Math.floor((this.mouseY - offsetY) / cellSize);

            let isValidAxis = false;
            if (this.activeAxis === 'row' && row === this.activeIndex) isValidAxis = true;
            if (this.activeAxis === 'col' && col === this.activeIndex) isValidAxis = true;

            const alreadySelected = this.selectedCoords.some(c => c.r === row && c.c === col);

            if (isValidAxis && !alreadySelected) {
                this.processSelection(row, col);
            }
        }
    }

    processSelection(r, c) {
        const selectedValue = this.grid[r][c];
        const expectedValue = this.targetSequence[this.currentBuffer.length];

        if (selectedValue === expectedValue) {
            this.currentBuffer.push(selectedValue);
            this.selectedCoords.push({r, c});
            
            if (this.activeAxis === 'row') {
                this.activeAxis = 'col';
                this.activeIndex = c;
            } else {
                this.activeAxis = 'row';
                this.activeIndex = r;
            }

            if (this.currentBuffer.length === this.targetSequence.length) {
                this.hacksCompleted++;
                this.timeLeft += 6.0;
                
                const config = this.levelConfig[this.level];
                if (this.hacksCompleted >= config.hacksReq) {
                    if (this.level < 3) {
                        this.level++;
                        this.hacksCompleted = 0;
                        this.timeLeft = this.levelConfig[this.level].time;
                        this.gameState = "prepare";
                        this.prepareTimer = 2.0;
                        this.showMessage(`SECURITY TIER ${this.level} BYPASSED`, window.VIREX_COLORS.TEXT_MAIN, 120);
                    } else {
                        this.gameState = "victory";
                    }
                } else {
                    this.generatePuzzle();
                    this.showMessage("DATA PACKET SECURED", window.VIREX_COLORS.TEXT_MAIN, 60);
                }
            }
        } else {
            this.gameState = "error";
            this.prepareTimer = 1.2; 
            this.showMessage("INVALID POINTER: CONNECTION RESET", window.VIREX_COLORS.TEXT_ERROR, 70);
        }
    }

    showMessage(text, color, duration = 60) {
        this.message = text;
        this.messageColor = color;
        this.messageTimer = duration;
    }

    drawEffects() {
        const ctx = this.ctx;
        
        // Scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        for (let i = 0; i < this.height; i += 4) {
            ctx.fillRect(0, i, this.width, 1);
        }

        // Vignette (Darkened edges)
        const gradient = ctx.createRadialGradient(
            this.width/2, this.height/2, this.height * 0.4, 
            this.width/2, this.height/2, this.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    drawSidebar() {
        const ctx = this.ctx;
        const sbW = this.width * 0.35;
        
        ctx.fillStyle = window.VIREX_COLORS.SIDEBAR_BG;
        ctx.fillRect(0, 0, sbW, this.height);
        
        ctx.strokeStyle = window.VIREX_COLORS.PANEL_BORDER;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sbW, 0);
        ctx.lineTo(sbW, this.height);
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = window.VIREX_COLORS.TEXT_MAIN;
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.shadowBlur = 10;
        ctx.shadowColor = window.VIREX_COLORS.TEXT_MAIN;
        ctx.fillText("UPLINK_ESTABLISHED", 25, 60);
        ctx.shadowBlur = 0; // Reset shadow

        const instructions = [
            "SYS_OVERRIDE_PROTOCOL:",
            "  > Initialize in Top Row",
            "  > Alternate Col/Row jumps",
            "  > Match Target Buffer exactly",
            "  > Errors cause full flush"
        ];

        let startY = 110;
        ctx.font = '14px "Courier New", monospace';
        instructions.forEach((line, index) => {
            ctx.fillStyle = index === 0 ? window.VIREX_COLORS.TEXT_DIM : '#88AABB';
            ctx.fillText(line, 25, startY);
            startY += 25;
        });

        // Target Buffer
        startY += 50;
        ctx.fillStyle = window.VIREX_COLORS.TEXT_MAIN;
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText("TARGET BUFFER_ID:", 25, startY);
        
        startY += 20;
        if (this.targetSequence.length > 0) {
            this.targetSequence.forEach((seq, i) => {
                const bx = 25 + (i * 42);
                ctx.fillStyle = window.VIREX_COLORS.CELL_BG;
                ctx.fillRect(bx, startY, 36, 36);
                ctx.strokeStyle = window.VIREX_COLORS.TEXT_MAIN;
                ctx.lineWidth = 1;
                ctx.strokeRect(bx, startY, 36, 36);
                
                ctx.fillStyle = window.VIREX_COLORS.TEXT_MAIN;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 16px "Courier New", monospace';
                ctx.fillText(seq, bx + 18, startY + 18);
            });
        }

        // Active Upload
        startY += 75;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = window.VIREX_COLORS.TEXT_DIM;
        ctx.fillText("ACTIVE MEMORY:", 25, startY);

        startY += 20;
        if (this.gameState === "playing" || this.gameState === "error") {
            for (let i = 0; i < (this.levelConfig[this.level]?.seqLength || 5); i++) {
                const bx = 25 + (i * 42);
                
                if (this.gameState === "error") {
                     ctx.fillStyle = window.VIREX_COLORS.TEXT_ERROR;
                     ctx.fillRect(bx, startY, 36, 36);
                } else if (i < this.currentBuffer.length) {
                    ctx.fillStyle = window.VIREX_COLORS.SELECTED;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = window.VIREX_COLORS.SELECTED;
                    ctx.fillRect(bx, startY, 36, 36);
                    ctx.shadowBlur = 0;
                    
                    ctx.fillStyle = window.VIREX_COLORS.SELECTED_TEXT;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = 'bold 16px "Courier New", monospace';
                    ctx.fillText(this.currentBuffer[i], bx + 18, startY + 18);
                } else {
                    ctx.fillStyle = window.VIREX_COLORS.CELL_BG;
                    ctx.fillRect(bx, startY, 36, 36);
                    ctx.strokeStyle = window.VIREX_COLORS.PANEL_BORDER;
                    ctx.strokeRect(bx, startY, 36, 36);
                }
            }
        }
        
        // Progress Bars at bottom
        const config = this.levelConfig[this.level] || this.levelConfig[3];
        startY = this.height - 80;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = window.VIREX_COLORS.TEXT_DIM;
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText(`SECURITY LAYER: ${this.level}/3`, 25, startY);
        
        startY += 25;
        ctx.fillText(`PACKETS ROUTED: ${this.hacksCompleted}/${config.hacksReq}`, 25, startY);
        
        // Render tiny progress blocks
        for (let i=0; i < config.hacksReq; i++) {
            ctx.fillStyle = i < this.hacksCompleted ? window.VIREX_COLORS.TEXT_MAIN : window.VIREX_COLORS.PANEL_BORDER;
            ctx.fillRect(25 + (i * 20), startY + 10, 15, 6);
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = window.VIREX_COLORS.BG;
        ctx.fillRect(0, 0, this.width, this.height);

        this.drawSidebar();

        const gameX = this.width * 0.35;
        const gameW = this.width * 0.65;
        const cx = gameX + gameW / 2;
        const cy = this.height / 2;

        if (this.gameState === "prepare") {
            ctx.textAlign = "center";
            ctx.fillStyle = window.VIREX_COLORS.TEXT_DIM;
            ctx.font = '24px "Courier New", monospace';
            ctx.fillText("SYNCING ENCRYPTION KEYS...", cx, cy - 50);

            ctx.fillStyle = window.VIREX_COLORS.TEXT_MAIN;
            ctx.font = 'bold 80px "Courier New", monospace';
            ctx.shadowBlur = 20;
            ctx.shadowColor = window.VIREX_COLORS.TEXT_MAIN;
            ctx.fillText(this.prepareTimer.toFixed(1), cx, cy + 40);
            ctx.shadowBlur = 0;
        } else {
            // Draw Matrix Grid
            const cellSize = Math.min(gameW / (this.gridSize + 2), this.height / (this.gridSize + 2));
            const offsetX = gameX + (gameW - (cellSize * this.gridSize)) / 2;
            const offsetY = (this.height - (cellSize * this.gridSize)) / 2 + 30;

            // Draw Active Axis Highlight
            if (this.gameState === "playing") {
                ctx.fillStyle = window.VIREX_COLORS.HIGHLIGHT;
                if (this.activeAxis === 'row') {
                    ctx.fillRect(offsetX, offsetY + (this.activeIndex * cellSize), cellSize * this.gridSize, cellSize);
                } else {
                    ctx.fillRect(offsetX + (this.activeIndex * cellSize), offsetY, cellSize, cellSize * this.gridSize);
                }
            }

            // Draw Codes
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold ${cellSize * 0.35}px "Courier New", monospace`;

            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    const cellX = offsetX + (c * cellSize);
                    const cellY = offsetY + (r * cellSize);
                    const cellCX = cellX + cellSize/2;
                    const cellCY = cellY + cellSize/2;

                    const isSelected = this.selectedCoords.some(coord => coord.r === r && coord.c === c);
                    
                    // Base Cell Design
                    ctx.fillStyle = window.VIREX_COLORS.CELL_BG;
                    ctx.fillRect(cellX + 4, cellY + 4, cellSize - 8, cellSize - 8);
                    ctx.strokeStyle = window.VIREX_COLORS.PANEL_BORDER;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(cellX + 4, cellY + 4, cellSize - 8, cellSize - 8);

                    if (isSelected) {
                        ctx.fillStyle = window.VIREX_COLORS.SELECTED;
                        ctx.fillRect(cellX + 4, cellY + 4, cellSize - 8, cellSize - 8);
                        ctx.fillStyle = window.VIREX_COLORS.SELECTED_TEXT;
                        ctx.fillText(this.grid[r][c], cellCX, cellCY);
                    } else {
                        let isHoverable = false;
                        if (this.gameState === "playing") {
                            if (this.activeAxis === 'row' && r === this.activeIndex) isHoverable = true;
                            if (this.activeAxis === 'col' && c === this.activeIndex) isHoverable = true;
                        }

                        // Mouse Hover effect
                        if (isHoverable && 
                            this.mouseX >= cellX && this.mouseX <= cellX + cellSize &&
                            this.mouseY >= cellY && this.mouseY <= cellY + cellSize) {
                            
                            ctx.fillStyle = window.VIREX_COLORS.CELL_HOVER;
                            ctx.fillRect(cellX + 4, cellY + 4, cellSize - 8, cellSize - 8);
                            ctx.strokeStyle = window.VIREX_COLORS.TEXT_MAIN;
                            ctx.strokeRect(cellX + 4, cellY + 4, cellSize - 8, cellSize - 8);
                            
                            ctx.fillStyle = window.VIREX_COLORS.TEXT_MAIN;
                            ctx.shadowBlur = 10;
                            ctx.shadowColor = window.VIREX_COLORS.TEXT_MAIN;
                        } else {
                            ctx.fillStyle = isHoverable ? window.VIREX_COLORS.TEXT_MAIN : window.VIREX_COLORS.TEXT_DIM;
                        }
                        
                        if (this.gameState === "error") ctx.fillStyle = window.VIREX_COLORS.TEXT_ERROR;
                        
                        ctx.fillText(this.grid[r][c], cellCX, cellCY);
                        ctx.shadowBlur = 0;
                    }
                }
            }

            // Top Timer Bar (Segmented Tech Style)
            const config = this.levelConfig[this.level] || this.levelConfig[3];
            const timePct = Math.max(0, this.timeLeft / config.time);
            
            ctx.fillStyle = window.VIREX_COLORS.CELL_BG;
            ctx.fillRect(gameX + 40, 20, gameW - 80, 12);
            
            ctx.fillStyle = this.timeLeft < 10 ? window.VIREX_COLORS.TEXT_ERROR : window.VIREX_COLORS.TEXT_MAIN;
            const segments = 50;
            const segmentW = (gameW - 80) / segments;
            const activeSegments = Math.floor(segments * timePct);
            
            for(let i=0; i < activeSegments; i++) {
                ctx.fillRect(gameX + 40 + (i * segmentW), 22, segmentW - 2, 8);
            }

            // Feedback Message
            if (this.messageTimer > 0) {
                ctx.textAlign = "center";
                ctx.font = 'bold 24px "Courier New", monospace';
                ctx.fillStyle = this.messageColor;
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.messageColor;
                ctx.fillText(this.message, cx, offsetY - 30);
                ctx.shadowBlur = 0;
            }
        }

        // Apply visual atmospheric effects over everything
        this.drawEffects();

        // END SCREENS
        if (this.gameState === "gameover" || this.gameState === "victory") {
            ctx.fillStyle = "rgba(6, 8, 10, 0.9)";
            ctx.fillRect(gameX, 0, gameW, this.height);

            ctx.textAlign = "center";
            ctx.textBaseline = 'alphabetic';
            if (this.gameState === "victory") {
                ctx.fillStyle = window.VIREX_COLORS.TEXT_MAIN;
                ctx.font = 'bold 45px "Courier New", monospace';
                ctx.shadowBlur = 20;
                ctx.shadowColor = window.VIREX_COLORS.TEXT_MAIN;
                ctx.fillText("OVERRIDE SUCCESSFUL", cx, cy - 10);
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = window.VIREX_COLORS.TEXT_ERROR;
                ctx.font = 'bold 45px "Courier New", monospace';
                ctx.shadowBlur = 20;
                ctx.shadowColor = window.VIREX_COLORS.TEXT_ERROR;
                ctx.fillText("CRITICAL FAILURE", cx, cy - 20);
                ctx.shadowBlur = 0;
                ctx.font = '18px "Courier New", monospace';
                ctx.fillText("Connection severed.", cx, cy + 20);
            }
        }
    }
}

window.NeuralGame = NeuralGame;