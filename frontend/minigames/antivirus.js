// minigames/antivirus.js - VIREX CORE PURGE

window.startAntivirusGame = function(canvasId, onComplete) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Antivirus Game: Canvas not found!");
        if (onComplete) onComplete(false);
        return;
    }
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize(); 
    window.addEventListener('resize', resize);

    const getW = () => canvas.width;
    const getH = () => canvas.height;

    // --- CYBERPUNK TERMINAL PALETTE ---
    const COLORS = {
        BG: '#020202',
        GRID_LINE: '#0a1510',
        DATA: '#0a0a0a',      
        VIRUS: '#ff003c',     
        VIRUS_GLOW: 'rgba(255, 0, 60, 0.4)',
        SYSTEM: '#00ff41', 
        SYSTEM_GLOW: 'rgba(0, 255, 65, 0.4)',
        UI_BG: '#05080a',        
        TEXT: '#00f0ff',         
        BOSS_MAIN: '#1a0000',
        BOSS_BORDER: '#ff003c',
        SHIELD: '#00f0ff',
        SELECT_BOX: 'rgba(0, 240, 255, 0.15)',
        SELECT_BORDER: '#00f0ff'
    };

    let animationFrameId;
    let gameInstance = null;

    function randomHex() {
        const chars = "0123456789ABCDEF"; 
        return chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
    }

    // --- CLASSES ---

    class DataNode {
        constructor(r, c, xOff, yOff, size) {
            this.r = r; this.c = c; this.size = size;
            this.updatePosition(xOff, yOff, size);
            this.isDestroyed = false;
            this.type = 0; 
            this.hexVal = "00";
            this.refresh();
        }
        updatePosition(xOff, yOff, newSize) {
            if (newSize) this.size = newSize;
            this.x = xOff + this.c * this.size;
            this.y = yOff + this.r * this.size;
            this.w = this.size - 4;
            this.h = this.size - 4;
        }
        refresh() {
            this.hexVal = randomHex();
            this.isDestroyed = false;
            const rand = Math.random();
            // Original mechanics restored: Only Virus (1), System (2), or Data (0)
            if (rand < 0.30) this.type = 1; 
            else if (rand < 0.35) this.type = 2; 
            else this.type = 0; 
        }
        contains(mx, my) {
            return mx >= this.x && mx <= this.x + this.w && my >= this.y && my <= this.y + this.h;
        }
        draw(ctx) {
            if (this.isDestroyed) return;
            
            let bgColor = COLORS.DATA;
            let borderColor = "#222";
            let textColor = "#444";
            
            if (this.type === 1) { 
                bgColor = "#2a0005"; borderColor = COLORS.VIRUS; textColor = COLORS.VIRUS; 
            } else if (this.type === 2) { 
                bgColor = "#001a05"; borderColor = COLORS.SYSTEM; textColor = COLORS.SYSTEM; 
            }

            // Draw Box
            ctx.fillStyle = bgColor;
            ctx.fillRect(this.x, this.y, this.w, this.h);
            
            // Draw Border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = this.type === 0 ? 1 : 2;
            ctx.strokeRect(this.x, this.y, this.w, this.h);

            // Draw Text
            const fontSize = Math.max(12, Math.floor(this.size * 0.3));
            ctx.fillStyle = textColor;
            ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.hexVal, this.x + this.w/2, this.y + this.h/2);
        }
    }

    class FileBlock {
        constructor(w, h) {
            this.size = 45; 
            this.x = Math.random() * (w - 60) + 10;
            this.y = -60; 
            
            // HARD MODE: Erratic movement
            this.baseVx = (Math.random() - 0.5) * 2;
            this.vy = Math.random() * 3 + 3.5; // Falls much faster
            this.waveSpeed = Math.random() * 0.05 + 0.02;
            this.waveOffset = Math.random() * Math.PI * 2;
            
            // 50/50 Split makes selection extremely risky
            this.type = Math.random() < 0.5 ? 1 : 2; 
            this.hexVal = randomHex();
            this.selected = false;
            this.isDestroyed = false;
            this.timeAlive = 0;
        }

        update(h) {
            this.timeAlive++;
            // Sine wave lateral movement
            this.x += this.baseVx + Math.sin(this.timeAlive * this.waveSpeed + this.waveOffset) * 3;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > getW() - this.size) this.baseVx *= -1;
            
            if (this.y > h) {
                this.y = -60;
                this.x = Math.random() * (getW() - 60);
                this.selected = false; 
                this.hexVal = randomHex(); // refresh data
            }
        }

        draw(ctx) {
            if (this.isDestroyed) return;

            let bgColor = this.type === 1 ? "#3a000a" : "#002a0a";
            let borderColor = this.type === 1 ? COLORS.VIRUS : COLORS.SYSTEM;
            let textColor = borderColor;

            if (this.selected) {
                bgColor = COLORS.TEXT;
                borderColor = "#fff";
                textColor = "#000";
            }

            ctx.fillStyle = bgColor;
            ctx.fillRect(this.x, this.y, this.size, this.size);
            
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = this.selected ? 3 : 2;
            
            if (this.selected) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = COLORS.TEXT;
            }
            ctx.strokeRect(this.x, this.y, this.size, this.size);
            ctx.shadowBlur = 0; // reset

            ctx.fillStyle = textColor;
            ctx.font = "bold 16px 'Courier New'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.hexVal, this.x + this.size/2, this.y + this.size/2);

            // Tech lines
            ctx.beginPath();
            ctx.moveTo(this.x + 5, this.y + 5);
            ctx.lineTo(this.x + 15, this.y + 5);
            ctx.stroke();
        }
    }

    class BossEntity {
        constructor(type = "main", difficultyMultiplier = 1) {
            this.type = type; 
            this.w = type === "mini" ? 350 : 500;
            this.h = type === "mini" ? 120 : 180;
            
            this.maxHp = (type === "mini" ? 80 : 150) * difficultyMultiplier;
            this.hp = this.maxHp;
            this.maxShield = (type === "mini" ? 60 : 80) * difficultyMultiplier;
            this.shield = this.maxShield;
            
            this.isVulnerable = false;
            this.vulnerableTimer = 0;
            this.rebootTime = type === "mini" ? 200 : 250; 
            this.flashTime = 0;
            this.timeAlive = 0;
        }

        update(gridX, gridWidth, headerY) {
            this.timeAlive++;
            const isEnraged = (this.type === "main") && (this.hp < this.maxHp * 0.4);
            
            // Violent shaking when hurt or enraged
            let shakeX = 0, shakeY = 0;
            if (this.flashTime > 0 || isEnraged) {
                shakeX = (Math.random() - 0.5) * (isEnraged ? 8 : 15);
                shakeY = (Math.random() - 0.5) * (isEnraged ? 8 : 15);
            }

            // Smooth hovering
            const hoverY = Math.sin(this.timeAlive * 0.05) * 10;

            const targetX = gridX + (gridWidth - this.w) / 2;
            this.x = Math.max(gridX, targetX) + shakeX;
            this.y = (headerY || 50) + hoverY + shakeY; 

            if (this.isVulnerable) {
                this.vulnerableTimer--;
                if (this.vulnerableTimer <= 0) {
                    this.isVulnerable = false;
                    this.shield = this.maxShield; 
                }
            }
            if (this.flashTime > 0) this.flashTime--;
        }

        damageShield(amount) {
            if (this.isVulnerable) return;
            this.shield -= amount;
            if (this.shield <= 0) {
                this.shield = 0;
                this.isVulnerable = true;
                this.vulnerableTimer = this.rebootTime;
            }
        }

        damageHp(amount) {
            if (!this.isVulnerable) return;
            this.hp -= amount;
            this.flashTime = 8;
            // FIX: Access local gameInstance directly to avoid 'undefined' crash
            if (gameInstance) gameInstance.globalShake = 10; 
        }

        contains(mx, my) {
            return mx >= this.x && mx <= this.x + this.w && my >= this.y && my <= this.y + this.h;
        }

        draw(ctx) {
            const cx = this.x + this.w/2;
            const cy = this.y + this.h/2;
            const isMini = this.type === "mini";

            let coreColor = this.isVulnerable ? COLORS.SYSTEM : COLORS.VIRUS;
            if (this.flashTime > 0) coreColor = "#ffffff";

            ctx.save();
            
            // Draw Core Aura
            const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, this.w/2);
            grad.addColorStop(0, this.isVulnerable ? 'rgba(0,255,65,0.8)' : 'rgba(255,0,60,0.8)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(this.x - 50, this.y - 50, this.w + 100, this.h + 100);

            // Draw Geometric Shell
            ctx.strokeStyle = coreColor;
            ctx.lineWidth = 4;
            ctx.fillStyle = "#050002";
            
            ctx.beginPath();
            ctx.moveTo(this.x + 30, this.y);
            ctx.lineTo(this.x + this.w - 30, this.y);
            ctx.lineTo(this.x + this.w, this.y + 30);
            ctx.lineTo(this.x + this.w, this.y + this.h - 30);
            ctx.lineTo(this.x + this.w - 30, this.y + this.h);
            ctx.lineTo(this.x + 30, this.y + this.h);
            ctx.lineTo(this.x, this.y + this.h - 30);
            ctx.lineTo(this.x, this.y + 30);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inner eye/core
            ctx.beginPath();
            ctx.arc(cx, cy, this.isVulnerable ? 30 : 20 + Math.sin(this.timeAlive*0.2)*5, 0, Math.PI*2);
            ctx.fillStyle = coreColor;
            ctx.fill();

            // Glitch lines across boss
            if (!this.isVulnerable && Math.random() < 0.3) {
                ctx.fillStyle = "rgba(255,255,255,0.5)";
                ctx.fillRect(this.x + Math.random()*this.w, this.y + Math.random()*this.h, Math.random()*100, 2);
            }

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `bold ${isMini ? 24 : 32}px 'Courier New'`;
            
            if (this.isVulnerable) {
                ctx.fillStyle = "#000"; // Text inside the bright green core
                ctx.fillText("EXPOSED", cx, cy);
                ctx.fillStyle = COLORS.SYSTEM;
                ctx.fillText(">>> PURGE CORE <<<", cx, this.y + this.h + 20);
            } else {
                ctx.fillStyle = "#fff";
                let status = isMini ? "GATEKEEPER" : "VIREX CORE";
                ctx.fillText(status, cx, this.y - 20);
                
                // Shield Bar
                const barW = this.w * 0.7;
                const barX = cx - barW/2;
                const barY = cy + 40;
                
                ctx.fillStyle = "#222";
                ctx.fillRect(barX, barY, barW, 10);
                ctx.fillStyle = COLORS.SHIELD;
                ctx.shadowBlur = 10; ctx.shadowColor = COLORS.SHIELD;
                ctx.fillRect(barX, barY, barW * (this.shield / this.maxShield), 10);
                ctx.shadowBlur = 0;
            }

            // Main HP Bar (Top)
            const hpPct = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = "#3a0000";
            ctx.fillRect(this.x, this.y - 45, this.w, 12); 
            ctx.fillStyle = COLORS.VIRUS;
            ctx.shadowBlur = 10; ctx.shadowColor = COLORS.VIRUS;
            ctx.fillRect(this.x, this.y - 45, this.w * hpPct, 12);
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y - 45, this.w, 12);

            ctx.restore();
        }
    }

    class AntivirusProtocol {
        constructor() {
            if (typeof window.hearts === 'undefined') {
                window.hearts = 5; 
            }

            // --- RESTORED ORIGINAL LEVEL SETTINGS ---
            this.levels = [
                { size: 4, target: 10, time: 45, name: "BOOT SECTOR" },
                { size: 6, target: 20, time: 60, name: "RAM CACHE" },
                { size: 8, target: 999, time: 90, name: "GATEKEEPER", boss: true, bossType: 'mini', difficulty: 0.8 },
                { size: 10, target: 50, time: 90, name: "DATA STREAM" },
                { size: 10, target: 999, time: 180, name: "VIREX CORE", boss: true, bossType: 'main', difficulty: 1.2 },
                // HARDCORE LEVEL 6
                { type: "format", target: 3000, time: 75, name: "TOTAL FORMAT" } 
            ];
            
            this.currentLvlIdx = 0;
            this.gameState = "playing"; 
            this.endMessage = "";
            this.boss = null;
            this.finished = false;
            this.cellSize = 60; 
            this.sidebarW = 320;
            this.bossY = 50; 
            this.grid = []; 
            this.globalShake = 0;
            
            // Format Level Vars
            this.fileBlocks = [];
            this.isSelecting = false;
            this.selX = 0; this.selY = 0; this.curX = 0; this.curY = 0;
            this.bossHp = 3000;
            this.maxBossHp = 3000;

            this.boundClick = (e) => this.handleMouseDown(e);
            this.boundMove = (e) => this.handleMouseMove(e);
            this.boundUp = (e) => this.handleMouseUp(e);
            this.boundKey = (e) => this.handleKey(e);
            
            canvas.addEventListener('mousedown', this.boundClick);
            canvas.addEventListener('mousemove', this.boundMove);
            window.addEventListener('mouseup', this.boundUp);
            window.addEventListener('keydown', this.boundKey);

            this.setupLevel();
        }

        setupLevel() {
            const lvl = this.levels[this.currentLvlIdx];
            
            if (lvl.type === "format") {
                this.boss = null;
                this.grid = [];
                this.fileBlocks = [];
                this.timeLeft = lvl.time * 60;
                this.cleared = 0; 
                this.bossHp = lvl.target;
                this.maxBossHp = lvl.target;
                this.infection = 0;
                this.gameState = "prepare_format"; 
                
                // Initial Spawns
                for(let i=0; i<20; i++) {
                    this.fileBlocks.push(new FileBlock(getW(), getH()));
                }
                return;
            }

            this.gridSize = lvl.size;
            if (lvl.boss) {
                if (!lvl.size) this.gridSize = lvl.bossType === 'mini' ? 6 : 8; 
                this.boss = new BossEntity(lvl.bossType || 'main', lvl.difficulty || 1);
            } else {
                this.boss = null;
            }

            this.target = lvl.target;
            this.timeLeft = lvl.time * 60; 
            this.cleared = 0;
            this.infection = 0; 
            this.shuffleDelay = 180; 
            this.shuffleTimer = this.shuffleDelay;

            this.recalculateGridPosition();

            this.grid = [];
            for (let r = 0; r < this.gridSize; r++) {
                const row = [];
                for (let c = 0; c < this.gridSize; c++) {
                    row.push(new DataNode(r, c, this.xOff, this.yOff, this.cellSize));
                }
                this.grid.push(row);
            }
        }
        
        recalculateGridPosition() {
            if (this.levels[this.currentLvlIdx].type === "format") return;

            this.sidebarW = Math.max(260, Math.min(350, getW() * 0.3));
            this.bossY = 80;
            let topReserve = 50; 
            if (this.boss) {
                topReserve = this.bossY + this.boss.h + 50; 
            }
            const availW = getW() - this.sidebarW - 40; 
            const availH = getH() - topReserve - 40;

            const maxCellW = Math.floor(availW / this.gridSize);
            const maxCellH = Math.floor(availH / this.gridSize);
            this.cellSize = Math.max(20, Math.min(80, maxCellW, maxCellH));
            
            this.xOff = this.sidebarW + Math.floor((availW - this.gridSize * this.cellSize) / 2) + 20;
            this.yOff = topReserve + Math.floor((availH - this.gridSize * this.cellSize) / 2);
        }

        handleMouseDown(e) {
            if (this.gameState === "prepare_format") {
                this.gameState = "playing";
                return;
            }

            if (this.gameState !== "playing") return;
            const lvl = this.levels[this.currentLvlIdx];
            
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
            const my = (e.clientY - rect.top) * (canvas.height / rect.height);

            // FORMAT LEVEL: Start Selection Drag
            if (lvl.type === "format") {
                this.isSelecting = true;
                this.selX = mx; this.selY = my;
                this.curX = mx; this.curY = my;
                return;
            }

            // NORMAL LEVELS
            if (this.boss && this.boss.contains(mx, my) && this.boss.isVulnerable) {
                this.boss.damageHp(5); 
                if (this.boss.hp <= 0) {
                    this.globalShake = 30; // Massive shake on boss kill
                    this.nextLevelOrWin();
                }
                return;
            }
            
            if (this.grid) {
                for (const row of this.grid) {
                    for (const node of row) {
                        if (!node.isDestroyed && node.contains(mx, my)) {
                            node.isDestroyed = true;
                            if (node.type === 1) { 
                                this.cleared += 1;
                                if (this.boss) this.boss.damageShield(10); 
                            } else if (node.type === 2) {
                                this.infection += 15; 
                                this.globalShake = 5;
                            } 
                            else this.infection += 2;  
                            return;
                        }
                    }
                }
            }
        }

        handleMouseMove(e) {
            if (this.isSelecting) {
                const rect = canvas.getBoundingClientRect();
                this.curX = (e.clientX - rect.left) * (canvas.width / rect.width);
                this.curY = (e.clientY - rect.top) * (canvas.height / rect.height);
                this.updateSelections();
            }
        }

        handleMouseUp(e) {
            this.isSelecting = false;
        }

        updateSelections() {
            const x = Math.min(this.selX, this.curX);
            const y = Math.min(this.selY, this.curY);
            const w = Math.abs(this.curX - this.selX);
            const h = Math.abs(this.curY - this.selY);

            for (const block of this.fileBlocks) {
                const cx = block.x + block.size/2;
                const cy = block.y + block.size/2;
                
                if (cx >= x && cx <= x + w && cy >= y && cy <= y + h) {
                    block.selected = true;
                } else {
                    block.selected = false;
                }
            }
        }

        handleKey(e) {
            if (this.gameState === "prepare_format" && e.code === "Space") {
                this.gameState = "playing";
                return;
            }

            if (this.gameState !== "playing") return;
            const lvl = this.levels[this.currentLvlIdx];

            if (lvl.type === "format" && e.code === "Space") {
                let damage = 0;
                let penalty = 0;
                let combo = 0;
                let triggered = false;

                for (const block of this.fileBlocks) {
                    if (block.selected && !block.isDestroyed) {
                        block.isDestroyed = true;
                        triggered = true;
                        
                        if (block.type === 1) { // VIRUS
                            damage += 50; 
                            combo++;
                        } else { // SYSTEM
                            penalty += 20; // Harder penalty
                        }
                    }
                }

                if (triggered) {
                    if (combo > 2) damage += (combo * 10); 
                    this.bossHp -= damage;
                    this.infection += penalty;
                    
                    if (damage > 0) this.globalShake = 10;
                    if (penalty > 0) this.globalShake = 20; // Bad shake

                    this.fileBlocks = this.fileBlocks.filter(b => !b.isDestroyed);
                }
            }
        }

        nextLevelOrWin() {
            if (this.currentLvlIdx < this.levels.length - 1) {
                this.currentLvlIdx++;
                this.setupLevel();
            } else {
                this.gameState = "victory";
                this.endMessage = "VIRUS ERADICATED\nSYSTEM SECURED";
                setTimeout(() => cleanupAndFinish(true), 3000);
            }
        }

        handleLevelFail() {
            if (window.hearts > 0) window.hearts--;

            if (window.updateHearts) window.updateHearts();

            if (window.hearts > 0) {
                this.gameState = "retry_wait";
                this.endMessage = `BREACH DETECTED\nREBOOTING... (${window.hearts} HEARTS LEFT)`;
                setTimeout(() => {
                    this.gameState = "playing";
                    this.setupLevel();
                }, 2000);
            } else {
                this.gameState = "failure";
                this.endMessage = "CRITICAL FAILURE\nVIREX OVERRIDE COMPLETE";
                setTimeout(() => cleanupAndFinish(false), 3000);
            }
        }

        update() {
            if (this.globalShake > 0) this.globalShake--;
            
            const lvl = this.levels[this.currentLvlIdx];
            
            // --- FORMAT LEVEL UPDATE ---
            if (lvl.type === "format" && this.gameState === "playing") {
                this.timeLeft--;
                
                // Spawn new blocks - High density
                if (this.fileBlocks.length < 45 && Math.random() < 0.25) {
                    this.fileBlocks.push(new FileBlock(getW(), getH()));
                }

                for (const block of this.fileBlocks) {
                    block.update(getH());
                }

                if (this.timeLeft <= 0 || this.infection >= 100) {
                    this.handleLevelFail();
                } else if (this.bossHp <= 0) {
                    this.nextLevelOrWin();
                }
                
                // Passive healing of infection
                if (this.infection > 0) this.infection -= 0.05; 
                return;
            }

            // --- STANDARD LEVEL UPDATE ---
            this.recalculateGridPosition();
            
            if (this.grid) {
                for (const row of this.grid) {
                    for (const node of row) node.updatePosition(this.xOff, this.yOff, this.cellSize);
                }
            }
            
            if (this.gameState === "playing") {
                this.timeLeft--;
                this.shuffleTimer--;

                let currentShuffleDelay = this.shuffleDelay;
                let infectionRate = 0.5;

                if (this.boss) {
                    if (this.boss.type === 'mini') infectionRate = 0.9;
                    if (this.boss.type === 'main' && this.boss.hp < this.boss.maxHp * 0.4) {
                        currentShuffleDelay = 120; infectionRate = 1.5;      
                    }
                }

                if (this.shuffleTimer <= 0) {
                    if (this.grid) {
                        for (const row of this.grid) {
                            for (const node of row) {
                                if (!node.isDestroyed) node.refresh();
                            }
                        }
                    }
                    this.shuffleTimer = currentShuffleDelay;
                    if (this.boss) this.infection += infectionRate;
                }

                if (this.infection >= 100 || this.timeLeft <= 0) {
                    this.handleLevelFail();
                } else if (!this.boss && this.cleared >= this.target) {
                    this.nextLevelOrWin();
                }
            }
        }

        drawEffects(w, h) {
            // Scanlines
            ctx.fillStyle = 'rgba(0, 255, 65, 0.03)';
            for (let i = 0; i < h; i += 4) {
                ctx.fillRect(0, i, w, 1);
            }
            // Vignette
            const grad = ctx.createRadialGradient(w/2, h/2, h*0.4, w/2, h/2, w*0.8);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }

        draw() {
            const WIDTH = getW();
            const HEIGHT = getH();
            
            ctx.save();
            if (this.globalShake > 0) {
                ctx.translate((Math.random()-0.5)*this.globalShake, (Math.random()-0.5)*this.globalShake);
            }

            ctx.fillStyle = COLORS.BG;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            
            if (this.gameState === "prepare_format") {
                this.drawFormatStartScreen(ctx, WIDTH, HEIGHT);
                this.drawEffects(WIDTH, HEIGHT);
                ctx.restore();
                return;
            }

            // Infection Warning Background
            let baseRed = 0;
            if (this.infection > 75) baseRed = Math.floor(Math.sin(Date.now()/200)*30 + 30);
            if (this.infection > 90) baseRed = Math.floor(Math.sin(Date.now()/100)*50 + 50);
            if (baseRed > 0) {
                ctx.fillStyle = `rgba(${baseRed}, 0, 0, 0.2)`;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
            }

            if (this.gameState !== "playing") {
                this.drawEndScreen(WIDTH, HEIGHT);
                ctx.restore();
                return;
            }

            const lvl = this.levels[this.currentLvlIdx];

            if (lvl.type === "format") {
                this.drawFormatLevel(ctx, WIDTH, HEIGHT);
                this.drawEffects(WIDTH, HEIGHT);
                ctx.restore();
                return;
            }

            // --- STANDARD LEVEL DRAW ---
            
            // Background Grid Lines
            ctx.strokeStyle = COLORS.GRID_LINE;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let x=this.sidebarW; x<WIDTH; x+=40) { ctx.moveTo(x,0); ctx.lineTo(x,HEIGHT); }
            for(let y=0; y<HEIGHT; y+=40) { ctx.moveTo(this.sidebarW,y); ctx.lineTo(WIDTH,y); }
            ctx.stroke();

            // Sidebar
            ctx.fillStyle = COLORS.UI_BG;
            ctx.fillRect(0, 0, this.sidebarW, HEIGHT);
            ctx.strokeStyle = COLORS.TEXT;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(this.sidebarW, 0); ctx.lineTo(this.sidebarW, HEIGHT); ctx.stroke();

            // --- LEFT SIDE INSTRUCTIONS ---
            ctx.textAlign = "left";
            ctx.fillStyle = COLORS.TEXT;
            ctx.font = "bold 24px 'Courier New', monospace";
            ctx.fillText("SYS_OVERRIDE", 20, 80);
            ctx.strokeStyle = COLORS.TEXT;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(20, 90); ctx.lineTo(this.sidebarW - 20, 90); ctx.stroke();

            let instY = 120;
            const instLines = [
                {c: COLORS.VIRUS, t: "■ PURGE Red Data"},
                {c: COLORS.SYSTEM, t: "■ AVOID Green Data"},
            ];
            
            if (lvl.boss) {
                instLines.push({c: "#ffffff", t: "■ BREAK Core Shield"});
                instLines.push({c: COLORS.SYSTEM, t: "■ STRIKE Exposed Core"});
            }

            ctx.font = "16px 'Courier New', monospace";
            for (let line of instLines) {
                ctx.fillStyle = line.c;
                ctx.fillText(line.t, 20, instY);
                instY += 30;
            }

            // --- GAME STATS ---
            instY += 40;
            const info = [
                `TARGET SECTOR:`, 
                `> ${lvl.name}`, 
                `SECURITY TIER:`,
                `> ${this.currentLvlIdx + 1} / ${this.levels.length}`,
                lvl.boss ? `CORE SHIELDING:` : `VIRUS PURGED:`,
                lvl.boss ? `> ${Math.floor((this.boss.shield/this.boss.maxShield)*100)}%` : `> ${this.cleared} / ${this.target}`,
                `UPLINK TIMER:`, 
                `> ${Math.ceil(this.timeLeft / 60)}s`
            ];

            ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
            
            for (let i = 0; i < info.length; i++) {
                const isHeader = (i % 2 === 0);
                ctx.font = isHeader ? "14px 'Courier New'" : "bold 20px 'Courier New'";
                ctx.fillStyle = isHeader ? "#88aabb" : "#ffffff";
                
                ctx.fillText(info[i], 20, instY);
                instY += isHeader ? 25 : 40;
            }

            // Infection Bar
            instY += 20;
            ctx.font = "14px 'Courier New'";
            ctx.fillStyle = "#88aabb";
            ctx.fillText(`SYSTEM CORRUPTION: ${Math.floor(this.infection)}%`, 20, instY);
            instY += 15;
            ctx.fillStyle = '#220000';
            ctx.fillRect(20, instY, this.sidebarW - 40, 15);
            ctx.fillStyle = this.infection > 80 ? COLORS.VIRUS : '#aa4400';
            ctx.shadowBlur = this.infection > 80 ? 10 : 0; ctx.shadowColor = COLORS.VIRUS;
            ctx.fillRect(20, instY, (this.sidebarW - 40) * (this.infection/100), 15);
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#fff";
            ctx.strokeRect(20, instY, this.sidebarW - 40, 15);

            // Draw Entities
            if (this.grid) for (const row of this.grid) for (const node of row) node.draw(ctx);
            if (this.boss) { 
                this.boss.update(this.xOff, this.gridSize * this.cellSize, this.bossY); 
                this.boss.draw(ctx); 
            }

            this.drawEffects(WIDTH, HEIGHT);
            ctx.restore();
        }

        drawFormatStartScreen(ctx, w, h) {
            // Background
            ctx.fillStyle = "rgba(5, 0, 0, 0.95)";
            ctx.fillRect(0, 0, w, h);

            // Box
            const boxW = 700;
            const boxH = 450;
            const bx = (w - boxW) / 2;
            const by = (h - boxH) / 2;

            ctx.strokeStyle = COLORS.VIRUS;
            ctx.lineWidth = 4;
            ctx.strokeRect(bx, by, boxW, boxH);
            ctx.fillStyle = "rgba(20, 0, 0, 0.8)";
            ctx.fillRect(bx, by, boxW, boxH);

            ctx.textAlign = "center";
            ctx.fillStyle = COLORS.VIRUS;
            ctx.font = "bold 45px 'Courier New', monospace";
            ctx.shadowBlur = 20; ctx.shadowColor = COLORS.VIRUS;
            ctx.fillText("FINAL PROTOCOL: TOTAL FORMAT", w / 2, by + 70);
            ctx.shadowBlur = 0;

            ctx.fillStyle = "#fff";
            ctx.font = "bold 22px 'Courier New', monospace";
            ctx.textAlign = "left";
            let tx = bx + 60;
            let ty = by + 150;

            const inst = [
                "WARNING: EXTREME VIRAL DENSITY DETECTED",
                "",
                "■ DRAG MOUSE to create a selection grid.",
                "■ PRESS SPACE to permanently purge selected data.",
                "■ DESTROY THE CORE (Red Bar) before time expires.",
                "■ CAUTION: Purging Green System files causes heavy penalties.",
                "■ Multi-virus purges deal combo damage."
            ];

            for(let line of inst) {
                if (line.includes("WARNING")) ctx.fillStyle = COLORS.VIRUS;
                else if (line.includes("Green System")) ctx.fillStyle = COLORS.SYSTEM;
                else ctx.fillStyle = "#fff";
                
                ctx.fillText(line, tx, ty);
                ty += 35;
            }

            // Flashing Prompt
            if (Math.floor(Date.now() / 400) % 2 === 0) {
                ctx.textAlign = "center";
                ctx.fillStyle = COLORS.TEXT;
                ctx.font = "bold 32px 'Courier New', monospace";
                ctx.fillText(">> CLICK TO EXECUTE <<", w / 2, by + boxH - 50);
            }
        }

        drawFormatLevel(ctx, w, h) {
            // Matrix falling code background effect
            ctx.fillStyle = "rgba(255, 0, 60, 0.05)";
            ctx.font = "20px monospace";
            for(let i=0; i<20; i++) {
                ctx.fillText(randomHex(), Math.random()*w, Math.random()*h);
            }

            for (const block of this.fileBlocks) {
                block.draw(ctx);
            }

            // Target Box
            if (this.isSelecting) {
                const x = Math.min(this.selX, this.curX);
                const y = Math.min(this.selY, this.curY);
                const width = Math.abs(this.curX - this.selX);
                const height = Math.abs(this.curY - this.selY);

                // Scanning grid inside selection
                ctx.fillStyle = COLORS.SELECT_BOX;
                ctx.fillRect(x, y, width, height);
                
                ctx.strokeStyle = COLORS.SELECT_BORDER;
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, width, height);
                
                // Crosshairs
                ctx.beginPath();
                ctx.moveTo(x + width/2, y); ctx.lineTo(x + width/2, y + height);
                ctx.moveTo(x, y + height/2); ctx.lineTo(x + width, y + height/2);
                ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
                ctx.stroke();
            }

            // HUD Background
            ctx.fillStyle = "rgba(5, 5, 10, 0.9)";
            ctx.fillRect(0, 0, w, 140);
            ctx.strokeStyle = COLORS.TEXT;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 140); ctx.lineTo(w, 140); ctx.stroke();

            ctx.fillStyle = COLORS.VIRUS;
            ctx.textAlign = "center";
            ctx.font = "bold 36px 'Courier New', monospace";
            ctx.shadowBlur = 10; ctx.shadowColor = COLORS.VIRUS;
            ctx.fillText("ERADICATE VIREX CORE", w/2, 45);
            ctx.shadowBlur = 0;

            // Boss HP Bar (Massive)
            const barW = Math.min(900, w - 100);
            const barH = 35;
            const barX = (w - barW) / 2;
            const hpPct = Math.max(0, this.bossHp / this.maxBossHp);
            
            ctx.fillStyle = "#220000";
            ctx.fillRect(barX, 65, barW, barH);
            ctx.fillStyle = COLORS.VIRUS;
            ctx.fillRect(barX, 65, barW * hpPct, barH);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, 65, barW, barH);

            ctx.font = "bold 22px 'Courier New', monospace";
            ctx.textAlign = "left";
            ctx.fillStyle = this.timeLeft < 30 ? COLORS.VIRUS : COLORS.TEXT;
            ctx.fillText(`TIMEOUT: ${Math.ceil(this.timeLeft/60)}s`, 50, 70);
            
            ctx.fillStyle = this.infection > 50 ? COLORS.VIRUS : COLORS.SYSTEM;
            ctx.fillText(`CORRUPTION: ${Math.floor(this.infection)}%`, 50, 100);
            
            ctx.textAlign = "right";
            ctx.fillStyle = COLORS.TEXT;
            ctx.fillText("DRAG TO SELECT -> SPACE TO PURGE", w - 50, 90);
        }

        drawEndScreen(w, h) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
            ctx.fillRect(0, 0, w, h);
            
            const isRetry = (this.gameState === "retry_wait");
            const isSuccess = this.endMessage.includes("ERADICATED") || this.endMessage.includes("SECURED");
            
            ctx.fillStyle = isSuccess ? COLORS.SYSTEM : (isRetry ? "#ffaa00" : COLORS.VIRUS);
            ctx.font = "bold 50px 'Courier New', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowBlur = 20; ctx.shadowColor = ctx.fillStyle;
            
            const lines = this.endMessage.split("\n");
            let startY = h / 2 - 30;
            lines.forEach((line, index) => ctx.fillText(line, w / 2, startY + (index * 60)));
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = "#666";
            ctx.font = "20px monospace";
            ctx.fillText("Processing command...", w / 2, h - 100);
        }
    }

    // --- INIT ---
    gameInstance = new AntivirusProtocol();

    function loop() {
        if (canvas.style.display === 'none' || canvas.classList.contains('hidden')) {
             if (gameInstance) gameInstance.finished = true;
             cancelAnimationFrame(animationFrameId);
             return;
        }
        if (gameInstance.finished) return;

        gameInstance.update();
        gameInstance.draw();
        animationFrameId = requestAnimationFrame(loop);
    }
    loop();

    function cleanupAndFinish(success) {
        if (gameInstance.finished) return;
        gameInstance.finished = true;
        
        window.removeEventListener('resize', resize); 
        canvas.removeEventListener('mousedown', gameInstance.boundClick);
        canvas.removeEventListener('mousemove', gameInstance.boundMove);
        window.removeEventListener('mouseup', gameInstance.boundUp);
        window.removeEventListener('keydown', gameInstance.boundKey);
        cancelAnimationFrame(animationFrameId);
        
        if (onComplete) onComplete(success);
    }

    window.stopAntivirusGame = function() {
        cleanupAndFinish(true);
    };
};