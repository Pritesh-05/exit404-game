// minigames/jigsaw.js - Terminal Data Decryption

window.startJigsawGame = function(canvasId, onComplete) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Jigsaw Game: Canvas not found!");
        if (onComplete) onComplete(false);
        return;
    }
    const ctx = canvas.getContext('2d');

    // Make Canvas Full Screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    // --- CYBERPUNK / TERMINAL PALETTE ---
    const COLORS = {
        BG: '#020304',
        SIDEBAR: '#05080c',
        ACCENT: '#00F0FF',        // Cyan for standard tiles
        ACCENT_HOVER: '#103040',
        SUCCESS: '#00FF41',       // Green for correct placement
        SUCCESS_BG: '#002208',
        ERR: '#FF003C',
        TILE_BG: '#0a1018',
        BORDER: '#1a2a3a',
        TEXT_DIM: '#4a6b8c'
    };

    // Original puzzle symbols
    const SYMBOLS = ["Ω", "Ψ", "Ξ", "Φ", "Δ", "Σ", "Π", "Θ", "Γ", "λ", "μ", "π", "⚡", "❖", "⚙", "◈"];

    let animationFrameId;
    let gameInstance = null;

    class JigsawPiece {
        constructor(symbol, correctRow, correctCol) {
            this.symbol = symbol;
            this.correctPos = { r: correctRow, c: correctCol };
            this.currentPos = { r: correctRow, c: correctCol };
            this.size = 85;
            this.selected = false;
            this.x = 0; 
            this.y = 0;
            // Fake hex data for the hacker aesthetic background
            this.fakeHex = Math.floor(Math.random()*255).toString(16).padStart(2, '0').toUpperCase();
        }

        draw(ctx, x, y, isHovered) {
            this.x = x; 
            this.y = y;
            
            // --- ORIGINAL MECHANIC: Check if it's in the correct spot ---
            const inPlace = (this.currentPos.r === this.correctPos.r && this.currentPos.c === this.correctPos.c);
            
            // Determine colors based on state
            let bgColor = COLORS.TILE_BG;
            let borderColor = COLORS.BORDER;
            let textColor = COLORS.ACCENT;

            if (inPlace) {
                bgColor = COLORS.SUCCESS_BG;
                borderColor = COLORS.SUCCESS;
                textColor = COLORS.SUCCESS;
            } else if (this.selected) {
                borderColor = '#ffffff';
                textColor = '#ffffff';
            } else if (isHovered) {
                bgColor = COLORS.ACCENT_HOVER;
                borderColor = COLORS.ACCENT;
            }

            // Draw Tile Background
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, y, this.size, this.size);
            
            // Draw Border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = this.selected || inPlace ? 3 : 1;
            ctx.strokeRect(x, y, this.size, this.size);
            
            // Selected corner brackets
            if (this.selected) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                const len = 15;
                // Top Left
                ctx.beginPath(); ctx.moveTo(x, y+len); ctx.lineTo(x, y); ctx.lineTo(x+len, y); ctx.stroke();
                // Bottom Right
                ctx.beginPath(); ctx.moveTo(x+this.size, y+this.size-len); ctx.lineTo(x+this.size, y+this.size); ctx.lineTo(x+this.size-len, y+this.size); ctx.stroke();
            }

            // Fake Tech Background Text (Small hex code)
            ctx.fillStyle = inPlace ? COLORS.SUCCESS : COLORS.BORDER;
            ctx.font = "10px monospace";
            ctx.textAlign = "left";
            ctx.fillText(this.fakeHex, x + 5, y + 15);

            // Draw Symbol
            ctx.fillStyle = textColor;
            if (inPlace || this.selected) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = textColor;
            }
            ctx.font = "bold 36px 'Courier New', monospace";
            ctx.textAlign = "center"; 
            ctx.textBaseline = "middle";
            ctx.fillText(this.symbol, x + this.size / 2, y + this.size / 2 + 5);
            ctx.shadowBlur = 0; // reset
        }

        contains(mx, my) {
            return mx >= this.x && mx <= this.x + this.size && my >= this.y && my <= this.y + this.size;
        }
    }

    class Exit404Jigsaw {
        constructor() {
            this.level = 1;
            this.maxLevels = 3;
            this.fullCode = "4D72A9";
            this.revealedCode = ["?", "?", "?", "?", "?", "?"];
            this.timeLimit = 180; 
            
            this.gameX = WIDTH * 0.35;
            this.gameW = WIDTH * 0.65;
            
            this.pieces = [];
            this.selectedPiece = null;
            
            this.gameState = "prepare"; 
            this.prepareTimer = 4.0; 
            
            this.mouseX = 0;
            this.mouseY = 0;

            // Robust Input Bindings
            this.boundMove = (e) => {
                const rect = canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                
                this.mouseX = (clientX - rect.left) * scaleX;
                this.mouseY = (clientY - rect.top) * scaleY;
            };

            this.boundClick = (e) => {
                e.preventDefault(); 
                this.handleClick(e);
            };
            
            canvas.addEventListener('mousemove', this.boundMove);
            canvas.addEventListener('mousedown', this.boundClick);
            canvas.addEventListener('touchmove', this.boundMove, { passive: false });
            canvas.addEventListener('touchstart', this.boundClick, { passive: false });

            this.setupLevel();
        }

        setupLevel() {
            this.pieces = [];
            this.selectedPiece = null;
            
            let levelSymbols = [...SYMBOLS].sort(() => Math.random() - 0.5);
            
            let idx = 0;
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    let sym = levelSymbols[idx];
                    this.pieces.push(new JigsawPiece(sym, r, c));
                    idx++;
                }
            }
            
            // Shuffle Positions
            let positions = this.pieces.map(p => ({...p.currentPos}));
            for (let i = positions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [positions[i], positions[j]] = [positions[j], positions[i]];
            }
            for (let i = 0; i < this.pieces.length; i++) {
                this.pieces[i].currentPos = positions[i];
            }
        }

        handleClick(e) {
            if (this.gameState !== "playing") return;

            // Compute precise click coordinates directly from the event
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            
            if (e.type.includes('touch')) {
                if (e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else if (e.changedTouches.length > 0) {
                    clientX = e.changedTouches[0].clientX;
                    clientY = e.changedTouches[0].clientY;
                }
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mx = (clientX - rect.left) * scaleX;
            const my = (clientY - rect.top) * scaleY;

            for (let piece of this.pieces) {
                // Ignore piece if it's already in the correct spot (optional mechanic lock)
                // if (piece.currentPos.r === piece.correctPos.r && piece.currentPos.c === piece.correctPos.c) continue;

                if (piece.contains(mx, my)) {
                    if (this.selectedPiece === null) {
                        this.selectedPiece = piece;
                        piece.selected = true;
                    } else {
                        if (this.selectedPiece !== piece) {
                            const temp = { ...this.selectedPiece.currentPos };
                            this.selectedPiece.currentPos = { ...piece.currentPos };
                            piece.currentPos = temp;
                        }
                        this.selectedPiece.selected = false;
                        this.selectedPiece = null;
                        this.checkWin();
                    }
                    return; 
                }
            }
        }

        checkWin() {
            const allCorrect = this.pieces.every(p => 
                p.currentPos.r === p.correctPos.r && p.currentPos.c === p.correctPos.c
            );

            if (allCorrect) {
                const idx = (this.level - 1) * 2;
                this.revealedCode[idx] = this.fullCode[idx];
                this.revealedCode[idx + 1] = this.fullCode[idx + 1];

                if (this.level < this.maxLevels) {
                    this.level++;
                    this.setupLevel();
                } else {
                    this.gameState = "victory";
                    setTimeout(() => cleanupAndFinish(true), 3500);
                }
            }
        }

        update() {
            if (this.gameState === "prepare") {
                this.prepareTimer -= 1/60;
                if (this.prepareTimer <= 0) {
                    this.gameState = "playing";
                    this.startTime = Date.now(); 
                }
                return;
            }

            if (this.gameState === "playing") {
                const elapsed = (Date.now() - this.startTime) / 1000;
                this.timeLeft = Math.max(0, this.timeLimit - elapsed);
                
                if (this.timeLeft <= 0) {
                    this.gameState = "game_over";
                    setTimeout(() => cleanupAndFinish(false), 3000);
                }
            }
        }

        drawSidebar() {
            const sbW = WIDTH * 0.35;
            
            ctx.fillStyle = COLORS.SIDEBAR;
            ctx.fillRect(0, 0, sbW, HEIGHT);
            
            ctx.strokeStyle = COLORS.BORDER;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sbW, 0); ctx.lineTo(sbW, HEIGHT);
            ctx.stroke();

            ctx.textAlign = 'left';
            ctx.fillStyle = COLORS.ACCENT;
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.shadowBlur = 10;
            ctx.shadowColor = COLORS.ACCENT;
            ctx.fillText("root@virex:/sys# ./decrypt", 25, 60);
            ctx.shadowBlur = 0;

            const instructions = [
                "ALLOCATION PROTOCOL:",
                "> Swap data fragments to decrypt.",
                "> Valid blocks highlight GREEN.",
                "> Find the correct configuration.",
                "> Decrypt all layers to extract key."
            ];

            let startY = 110;
            ctx.font = '14px "Courier New", monospace';
            instructions.forEach(line => {
                ctx.fillStyle = line.includes("GREEN") ? COLORS.SUCCESS : COLORS.TEXT_DIM;
                ctx.fillText(line, 25, startY);
                startY += 25;
            });

            // GAME STATS
            startY += 80;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.fillText(`DECRYPTION LAYER: ${this.level}/3`, 25, startY);
            
            startY += 35;
            const timeColor = this.timeLeft < 30 ? COLORS.ERR : COLORS.TEXT_DIM;
            ctx.fillStyle = timeColor;
            ctx.fillText(`SYS TIMEOUT: ${Math.floor(this.timeLeft)}s`, 25, startY);

            // REVEALED CODE
            startY += 80;
            ctx.fillStyle = '#fff';
            ctx.fillText("EXTRACTED ADMIN HASH:", 25, startY);
            
            startY += 20;
            for (let i = 0; i < 6; i++) {
                const char = this.revealedCode[i];
                const isFound = char !== "?";
                const rectX = 25 + i * 42;
                
                ctx.fillStyle = isFound ? COLORS.SUCCESS : COLORS.TILE_BG;
                ctx.fillRect(rectX, startY, 34, 44);
                
                ctx.strokeStyle = isFound ? '#fff' : COLORS.BORDER;
                ctx.lineWidth = 1;
                ctx.strokeRect(rectX, startY, 34, 44);

                ctx.fillStyle = isFound ? '#000' : COLORS.ERR;
                ctx.font = "bold 24px 'Courier New', monospace";
                ctx.textAlign = "center";
                ctx.fillText(char, rectX + 17, startY + 30);
            }
        }

        drawEffects() {
            // CRT Scanlines
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            for (let i = 0; i < HEIGHT; i += 4) {
                ctx.fillRect(this.gameX, i, this.gameW, 1);
            }
            // Vignette
            const cx = this.gameX + this.gameW / 2;
            const grad = ctx.createRadialGradient(cx, HEIGHT/2, 200, cx, HEIGHT/2, WIDTH * 0.7);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.85)');
            ctx.fillStyle = grad;
            ctx.fillRect(this.gameX, 0, this.gameW, HEIGHT);
        }

        draw() {
            ctx.fillStyle = COLORS.BG;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            this.drawSidebar();

            const cx = this.gameX + this.gameW / 2;
            const cy = HEIGHT / 2;

            if (this.gameState === "prepare") {
                ctx.textAlign = "center";
                ctx.fillStyle = COLORS.TEXT_DIM;
                ctx.font = "24px 'Courier New', monospace";
                ctx.fillText("MOUNTING ENCRYPTED SECTOR...", cx, cy - 50);

                ctx.fillStyle = COLORS.ACCENT;
                ctx.font = "bold 80px 'Courier New', monospace";
                ctx.shadowBlur = 20;
                ctx.shadowColor = COLORS.ACCENT;
                ctx.fillText(Math.ceil(this.prepareTimer), cx, cy + 40);
                ctx.shadowBlur = 0;
            } else {
                // GAME GRID
                const spacing = 95; // 85 size + 10 gap
                const gridWidth = 4 * spacing - 10; 
                const gridStartX = this.gameX + (this.gameW - gridWidth) / 2;
                const gridStartY = (HEIGHT - gridWidth) / 2;

                // Draw Grid Background box
                ctx.fillStyle = 'rgba(0, 20, 30, 0.2)';
                ctx.fillRect(gridStartX - 20, gridStartY - 20, gridWidth + 40, gridWidth + 40);
                ctx.strokeStyle = COLORS.BORDER;
                ctx.lineWidth = 1;
                ctx.strokeRect(gridStartX - 20, gridStartY - 20, gridWidth + 40, gridWidth + 40);

                // Draw Pieces
                for (let piece of this.pieces) {
                    const drawX = gridStartX + piece.currentPos.c * spacing;
                    const drawY = gridStartY + piece.currentPos.r * spacing;
                    const isHovered = piece.contains(this.mouseX, this.mouseY);
                    piece.draw(ctx, drawX, drawY, isHovered);
                }

                this.drawEffects();

                // End Screens
                if (this.gameState === "victory" || this.gameState === "game_over") {
                    ctx.fillStyle = "rgba(3, 5, 8, 0.95)";
                    ctx.fillRect(this.gameX, 0, this.gameW, HEIGHT);
                    
                    ctx.textAlign = "center";
                    if (this.gameState === "victory") {
                        ctx.fillStyle = COLORS.SUCCESS;
                        ctx.font = "bold 50px 'Courier New', monospace";
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = COLORS.SUCCESS;
                        ctx.fillText("DATA DECRYPTED", cx, cy - 30);
                        ctx.shadowBlur = 0;
                        
                        ctx.fillStyle = "#fff";
                        ctx.font = "22px 'Courier New', monospace";
                        ctx.fillText(`MASTER KEY RECOVERED: ${this.fullCode}`, cx, cy + 30);
                    } else {
                        ctx.fillStyle = COLORS.ERR;
                        ctx.font = "bold 50px 'Courier New', monospace";
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = COLORS.ERR;
                        ctx.fillText("SYSTEM LOCKOUT", cx, cy - 30);
                        ctx.shadowBlur = 0;
                        
                        ctx.fillStyle = "#fff";
                        ctx.font = "22px 'Courier New', monospace";
                        ctx.fillText("Security trace detected. Rebooting...", cx, cy + 30);
                    }
                }
            }
        }
    }

    gameInstance = new Exit404Jigsaw();

    function gameLoop() {
        if (canvas.style.display === 'none' || canvas.classList.contains('hidden')) {
             if (gameInstance) gameInstance.gameState = "finished";
             cancelAnimationFrame(animationFrameId);
             return;
        }
        if (gameInstance.gameState === "finished") return;

        gameInstance.update();
        gameInstance.draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    gameLoop();

    function cleanupAndFinish(success) {
        if (gameInstance.gameState === "finished") return;
        gameInstance.gameState = "finished";

        canvas.removeEventListener('mousemove', gameInstance.boundMove);
        canvas.removeEventListener('mousedown', gameInstance.boundClick);
        canvas.removeEventListener('touchmove', gameInstance.boundMove);
        canvas.removeEventListener('touchstart', gameInstance.boundClick);
        
        cancelAnimationFrame(animationFrameId);

        if (onComplete) onComplete(success);
    }
    
    window.stopJigsawGame = function() {
        if(gameInstance) cleanupAndFinish(true); 
    };
};