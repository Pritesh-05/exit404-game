// minigames/computer.js

window.startComputerGame = function(canvasId, hasPassword, onComplete) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Computer Game: Canvas not found!");
        if(onComplete) onComplete(false);
        return;
    }
    const ctx = canvas.getContext('2d');

    // Make Canvas Full Screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    // --- CYBERPUNK PALETTE ---
    const COLORS = {
        BG: '#030508',
        UI_DARK: '#0a121a',
        UI_BORDER: '#162838',
        ACCENT: '#00F0FF',
        ACCENT_DIM: 'rgba(0, 240, 255, 0.2)',
        ERR: '#FF003C',
        ERR_DIM: 'rgba(255, 0, 60, 0.2)',
        TEXT: '#c8d2dc',
        BTN: '#0d1821'
    };

    let animationFrameId;
    let gameInstance = null;

    class AccessSystem {
        constructor() {
            this.targetCode = "4D72A9";
            this.inputCode = "";
            this.status = "AWAITING INPUT...";
            this.accessGranted = false;
            this.errorTimer = 0;
            this.hasPassword = hasPassword; 
            this.finished = false;
            
            // Mouse Tracking for Hover Effects
            this.mouseX = 0;
            this.mouseY = 0;

            // Dialogue System
            this.dialogueActive = !hasPassword; 
            this.dialogueIndex = 0;
            
            this.fakeCode1 = this.generateRandomCode();
            this.fakeCode2 = this.generateRandomCode();

            this.dialogueLines = [
                { speaker: "JOHN", text: "The system is locked. I need the admin override." },
                { speaker: "JOHN", text: `Maybe I can guess it? Let's try... ${this.fakeCode1}` },
                { speaker: "SYSTEM", text: "FATAL: ACCESS DENIED - SECURITY LEVEL 5" },
                { speaker: "JOHN", text: `Damn. Okay, let's try... ${this.fakeCode2}?` },
                { speaker: "SYSTEM", text: "FATAL: ACCESS DENIED - INTRUSION LOGGED" },
                { speaker: "JOHN", text: "It's impossible. I don't have the sequence yet." },
                { speaker: "JOHN", text: "I should ABORT the login and look for the password elsewhere." }
            ];

            // Layout
            this.centerX = WIDTH / 2;
            this.keypadWidth = (4 * 80); 
            this.startX = this.centerX - (this.keypadWidth / 2) + 5;
            this.startY = HEIGHT / 2 - 30; 

            // Keypad Grid
            this.keys = [];
            const chars = "0123456789ABCDEF";
            for (let i = 0; i < chars.length; i++) {
                const char = chars[i];
                const x = this.startX + (i % 4) * 80;
                const y = this.startY + Math.floor(i / 4) * 80;
                this.keys.push({ char: char, x: x, y: y, w: 70, h: 70 });
            }
            
            this.abortBtn = { x: 50, y: HEIGHT - 100, w: 220, h: 50 };

            // Bindings
            this.boundMove = (e) => {
                const rect = canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            };
            this.boundClick = (e) => this.handleClick(e);
            
            canvas.addEventListener('mousemove', this.boundMove);
            canvas.addEventListener('mousedown', this.boundClick);
        }

        generateRandomCode() {
            const chars = "0123456789ABCDEF";
            let code = "";
            for(let i=0; i<6; i++) {
                code += chars[Math.floor(Math.random() * chars.length)];
            }
            if(code === this.targetCode) return "000000";
            return code;
        }

        handleClick(e) {
            if (this.accessGranted || this.finished) return;

            if (this.dialogueActive) {
                this.dialogueIndex++;
                if (this.dialogueIndex >= this.dialogueLines.length) {
                    this.dialogueActive = false; 
                }
                return; 
            }

            // CHECK ABORT BUTTON
            if (!this.hasPassword) {
                if (this.mouseX >= this.abortBtn.x && this.mouseX <= this.abortBtn.x + this.abortBtn.w &&
                    this.mouseY >= this.abortBtn.y && this.mouseY <= this.abortBtn.y + this.abortBtn.h) {
                    cleanupAndFinish(true, true);
                    return;
                }
            }

            // CHECK KEYPAD
            for (const key of this.keys) {
                if (this.mouseX >= key.x && this.mouseX <= key.x + key.w &&
                    this.mouseY >= key.y && this.mouseY <= key.y + key.h) {
                    
                    if (this.inputCode.length < 6) {
                        this.inputCode += key.char;
                        this.status = "VERIFYING_BUFFER...";
                    }
                    
                    if (this.inputCode.length === 6) {
                        if (this.inputCode === this.targetCode) {
                            this.accessGranted = true;
                            this.status = "UPLINK_ESTABLISHED";
                            setTimeout(() => cleanupAndFinish(true, false), 2500);
                        } else {
                            this.status = "ERR: INVALID PASSCODE";
                            this.errorTimer = 60; 
                            this.inputCode = "";
                        }
                    }
                    return;
                }
            }
        }

        drawEffects() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            for (let i = 0; i < HEIGHT; i += 4) {
                ctx.fillRect(0, i, WIDTH, 1);
            }
            const grad = ctx.createRadialGradient(this.centerX, HEIGHT/2, 100, this.centerX, HEIGHT/2, WIDTH * 0.8);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }

        draw() {
            ctx.fillStyle = COLORS.BG;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            
            // Grid Background
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let x=0; x<WIDTH; x+=40) { ctx.moveTo(x,0); ctx.lineTo(x,HEIGHT); }
            for(let y=0; y<HEIGHT; y+=40) { ctx.moveTo(0,y); ctx.lineTo(WIDTH,y); }
            ctx.stroke();

            // --- HEADER ---
            const mainColor = this.errorTimer > 0 ? COLORS.ERR : (this.accessGranted ? COLORS.ACCENT : COLORS.TEXT);
            const glowColor = this.errorTimer > 0 ? COLORS.ERR : (this.accessGranted ? COLORS.ACCENT : 'transparent');

            ctx.fillStyle = COLORS.UI_DARK;
            ctx.fillRect(this.centerX - 250, this.startY - 180, 500, 60);
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.centerX - 250, this.startY - 180, 500, 60);

            ctx.shadowBlur = this.accessGranted || this.errorTimer > 0 ? 15 : 0;
            ctx.shadowColor = glowColor;
            ctx.fillStyle = mainColor;
            ctx.font = "bold 26px 'Courier New', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.accessGranted ? "ROOT ACCESS GRANTED" : "ADMINISTRATOR LOGIN", this.centerX, this.startY - 150);
            ctx.shadowBlur = 0;
            
            ctx.font = "14px 'Courier New', monospace";
            ctx.fillStyle = mainColor;
            ctx.fillText(`SYS_STATUS // ${this.status}`, this.centerX, this.startY - 100);

            // --- INPUT DISPLAY ---
            ctx.fillStyle = COLORS.UI_DARK;
            ctx.fillRect(this.centerX - 160, this.startY - 70, 320, 50);
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.centerX - 160, this.startY - 70, 320, 50);
            
            let displayText = this.inputCode.padEnd(6, "-").split("").join(" ");
            if (!this.accessGranted && Math.floor(Date.now() / 500) % 2 === 0 && this.inputCode.length < 6) {
                // Blinking cursor logic
            }
            
            ctx.fillStyle = mainColor;
            ctx.font = "bold 28px 'Courier New', monospace";
            ctx.shadowBlur = this.accessGranted || this.errorTimer > 0 ? 10 : 0;
            ctx.shadowColor = mainColor;
            ctx.fillText(displayText, this.centerX, this.startY - 45);
            ctx.shadowBlur = 0;

            // --- KEYPAD ---
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for (const key of this.keys) {
                const isHovered = (this.mouseX >= key.x && this.mouseX <= key.x + key.w &&
                                   this.mouseY >= key.y && this.mouseY <= key.y + key.h);
                
                ctx.fillStyle = isHovered ? COLORS.UI_BORDER : COLORS.BTN;
                ctx.fillRect(key.x, key.y, key.w, key.h);
                
                ctx.strokeStyle = isHovered ? COLORS.ACCENT : COLORS.UI_BORDER;
                ctx.lineWidth = isHovered ? 2 : 1;
                ctx.strokeRect(key.x, key.y, key.w, key.h);
                
                ctx.fillStyle = isHovered ? COLORS.ACCENT : COLORS.TEXT;
                ctx.font = "bold 24px 'Courier New'";
                ctx.fillText(key.char, key.x + key.w / 2, key.y + key.h / 2);
            }

            // --- ABORT BUTTON ---
            if (!this.hasPassword) {
                ctx.globalAlpha = this.dialogueActive ? 0.2 : 1.0;
                
                const isBtnHovered = (this.mouseX >= this.abortBtn.x && this.mouseX <= this.abortBtn.x + this.abortBtn.w &&
                                      this.mouseY >= this.abortBtn.y && this.mouseY <= this.abortBtn.y + this.abortBtn.h);
                
                ctx.fillStyle = isBtnHovered ? COLORS.ERR_DIM : COLORS.UI_DARK;
                ctx.fillRect(this.abortBtn.x, this.abortBtn.y, this.abortBtn.w, this.abortBtn.h);
                ctx.strokeStyle = COLORS.ERR;
                ctx.lineWidth = 2;
                ctx.strokeRect(this.abortBtn.x, this.abortBtn.y, this.abortBtn.w, this.abortBtn.h);
                
                ctx.fillStyle = COLORS.ERR;
                ctx.font = "bold 18px 'Courier New'";
                ctx.fillText("> ABORT LOGIN", this.abortBtn.x + this.abortBtn.w/2, this.abortBtn.y + this.abortBtn.h/2);
                
                ctx.globalAlpha = 1.0;
            }

            // --- STICKY NOTE ---
            if (this.hasPassword) {
                this.drawStickyNote();
            }

            this.drawEffects();

            // --- SUCCESS OVERLAY ---
            if (this.accessGranted) {
                ctx.fillStyle = "rgba(3, 5, 8, 0.95)";
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
                ctx.fillStyle = COLORS.ACCENT;
                ctx.font = "bold 50px 'Courier New'";
                ctx.shadowBlur = 20;
                ctx.shadowColor = COLORS.ACCENT;
                ctx.fillText("SECURITY BYPASSED", this.centerX, HEIGHT / 2 - 20);
                ctx.font = "18px 'Courier New'";
                ctx.shadowBlur = 0;
                ctx.fillStyle = COLORS.TEXT;
                ctx.fillText("Downloading encrypted files...", this.centerX, HEIGHT / 2 + 30);
            }

            // --- DIALOGUE OVERLAY ---
            if (this.dialogueActive && this.dialogueIndex < this.dialogueLines.length) {
                this.drawDialogue();
            }
        }

        drawDialogue() {
            const line = this.dialogueLines[this.dialogueIndex];
            const boxH = 140;
            
            ctx.fillStyle = "rgba(5, 10, 15, 0.95)";
            ctx.fillRect(0, HEIGHT - boxH, WIDTH, boxH);
            
            const spkColor = line.speaker === "SYSTEM" ? COLORS.ERR : COLORS.ACCENT;
            
            ctx.fillStyle = spkColor;
            ctx.fillRect(0, HEIGHT - boxH, 8, boxH);
            
            ctx.strokeStyle = COLORS.UI_BORDER;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(8, HEIGHT - boxH);
            ctx.lineTo(WIDTH, HEIGHT - boxH);
            ctx.stroke();

            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
            ctx.font = "bold 22px 'Courier New'";
            ctx.fillStyle = spkColor;
            ctx.fillText(`[ ${line.speaker} ]`, 40, HEIGHT - boxH + 45);

            ctx.fillStyle = "#fff";
            ctx.font = "18px 'Courier New'";
            ctx.fillText(line.text, 40, HEIGHT - boxH + 85);

            ctx.fillStyle = COLORS.TEXT;
            ctx.font = "14px 'Courier New'";
            ctx.textAlign = "right";
            
            // Blinking prompt
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.fillText(">> CLICK TO CONTINUE", WIDTH - 40, HEIGHT - 30);
            }
        }

        drawStickyNote() {
            ctx.save();
            const noteX = this.startX + this.keypadWidth + 80;
            const noteY = this.startY - 20;
            
            // Note Shadow
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;

            // Note Body
            ctx.translate(noteX + 75, noteY + 75);
            ctx.rotate(5 * Math.PI / 180); // Slight tilt
            ctx.translate(-(noteX + 75), -(noteY + 75));

            ctx.fillStyle = "#f4d03f"; 
            ctx.fillRect(noteX, noteY, 160, 160);
            ctx.shadowBlur = 0; // Reset shadow

            // Red Pin
            ctx.fillStyle = "#d50000";
            ctx.beginPath(); 
            ctx.arc(noteX + 80, noteY + 15, 6, 0, Math.PI * 2); 
            ctx.fill();
            
            // Text
            ctx.fillStyle = "rgba(0,0,0,0.8)";
            ctx.font = "bold 16px 'Courier New'";
            ctx.textAlign = "center"; 
            ctx.fillText("DON'T FORGET", noteX + 80, noteY + 55);
            ctx.beginPath();
            ctx.moveTo(noteX + 20, noteY + 65);
            ctx.lineTo(noteX + 140, noteY + 65);
            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.stroke();

            ctx.font = "bold 32px 'Courier New'";
            ctx.fillStyle = "#000";
            ctx.fillText(this.targetCode, noteX + 80, noteY + 110);
            
            ctx.restore();
        }

        update() {
            if (this.errorTimer > 0) this.errorTimer--;
        }
    }

    gameInstance = new AccessSystem();

    function gameLoop() {
        if (canvas.style.display === 'none' || canvas.classList.contains('hidden')) {
             if (gameInstance) gameInstance.finished = true;
             cancelAnimationFrame(animationFrameId);
             return;
        }
        if (gameInstance.finished) return;
        gameInstance.update();
        gameInstance.draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    gameLoop();

    function cleanupAndFinish(success, skipped = false) {
        if (gameInstance.finished) return;
        gameInstance.finished = true;
        canvas.removeEventListener('mousemove', gameInstance.boundMove);
        canvas.removeEventListener('mousedown', gameInstance.boundClick);
        cancelAnimationFrame(animationFrameId);
        if (onComplete) onComplete(success, skipped);
    }
    
    window.stopComputerGame = function() {
        if(gameInstance) cleanupAndFinish(true, true);
    };
};