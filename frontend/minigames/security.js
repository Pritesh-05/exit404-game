// minigames/security.js - VIREX Core Stabilizer

window.startSecurityGame = function(canvasId, onComplete) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Security Game: Canvas not found!");
        if(onComplete) onComplete(false);
        return;
    }
    const ctx = canvas.getContext('2d');

    // Advanced Cyberpunk Palette
    const COLORS = {
        BG: '#030508',          // Deep void
        SIDEBAR: '#080d14',     // Dark panel
        UI_DARK: '#101822',     // Inactive node
        CORRUPTION: '#FF003C',  // Fatal Red
        STABLE: '#00F0FF',      // Neon Cyan
        WARNING: '#FFB000',     // Warning Amber
        NODE_BORDER: '#1a2a3a', 
        TEXT_DIM: '#4a6b8c',
        GRID: 'rgba(0, 240, 255, 0.03)'
    };
    
    let animationFrameId;
    let gameInstance = null;

    // --- CLASSES ---

    class DataNode {
        constructor(angle, radius, index) {
            this.angle = angle;
            this.orbitRadius = radius;
            this.radius = 45;
            this.index = index;
            this.hexLabel = '0x' + (index * 17 + 10).toString(16).toUpperCase();
            
            this.activeTimer = 0;
            this.currentColor = COLORS.UI_DARK;
            
            // Visual flair
            this.rotation = Math.random() * Math.PI;
            this.rotSpeed = (Math.random() - 0.5) * 0.02;
            
            this.recalculatePosition();
        }

        recalculatePosition() {
            const gameX = canvas.width * 0.3;
            const gameW = canvas.width * 0.7;
            const centerX = gameX + gameW / 2;
            const centerY = canvas.height / 2;
            
            this.baseX = centerX + Math.cos(this.angle) * this.orbitRadius;
            this.baseY = centerY + Math.sin(this.angle) * this.orbitRadius;
            this.x = this.baseX;
            this.y = this.baseY;
        }

        trigger(color, duration = 40) {
            this.activeTimer = duration; 
            this.currentColor = color;
        }

        update(corruption) {
            this.rotation += this.rotSpeed;

            if (this.activeTimer > 0) {
                this.activeTimer--;
            } else {
                this.currentColor = COLORS.UI_DARK;
            }

            // High corruption causes violent shaking
            const shake = Math.floor(corruption / 25);
            if (shake > 0) {
                this.x = this.baseX + (Math.random() * shake * 2) - shake;
                this.y = this.baseY + (Math.random() * shake * 2) - shake;
            } else {
                this.x = this.baseX;
                this.y = this.baseY;
            }
        }

        draw(ctx) {
            const isActive = this.activeTimer > 0;

            // Outer Rotating Ring
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = isActive ? this.currentColor : COLORS.NODE_BORDER;
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 15, 30, 10]);
            ctx.stroke();
            ctx.restore();

            // Core Background
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = isActive ? this.currentColor : COLORS.UI_DARK;
            
            if (isActive) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = this.currentColor;
            }
            ctx.fill();
            ctx.shadowBlur = 0; // reset

            // Inner Ring
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius - 5, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.BG;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.stroke();

            // Node Text
            ctx.fillStyle = isActive ? '#000' : COLORS.TEXT_DIM;
            ctx.font = "bold 16px 'Courier New'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.hexLabel, this.x, this.y);
        }

        contains(mx, my) {
            const dist = Math.hypot(this.x - mx, this.y - my);
            return dist <= this.radius + 8;
        }
    }

    class CoreStabilizer {
        constructor() {
            this.nodes = [];
            const nodeCount = 6; // Increased difficulty: 6 nodes instead of 4
            const spreadRadius = 180;
            
            for(let i=0; i<nodeCount; i++) {
                // Arranged in a hexagon, starting top
                const angle = (i * (Math.PI * 2) / nodeCount) - Math.PI / 2;
                this.nodes.push(new DataNode(angle, spreadRadius, i));
            }
            
            this.targetLevel = 6; // Requires 6 successful sequences to win
            this.maxGlobalTime = 120; 
            this.transitionMsg = "";
            this.waitingRestart = false;
            
            this.coreRotation = 0;

            this.boundHandleClick = (e) => this.handleClick(e);
            canvas.addEventListener('mousedown', this.boundHandleClick);
            
            this.boundResize = () => this.handleResize();
            window.addEventListener('resize', this.boundResize);

            this.reset();
        }

        handleResize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            this.nodes.forEach(node => node.recalculatePosition());
        }

        reset() {
            this.level = 1;
            this.corruption = 0;
            this.globalTimer = this.maxGlobalTime * 60; 
            this.state = "PREPARE"; 
            this.prepareTimer = 4.0; 
        }

        startRound() {
            this.sequence = [];
            // Sequence grows up to 8 nodes long
            const length = Math.min(3 + this.level, 8); 
            
            let lastNode = -1;
            for(let i=0; i<length; i++) {
                let nextNode;
                // Prevent same node flashing twice in a row to force eye movement
                do {
                    nextNode = Math.floor(Math.random() * this.nodes.length);
                } while(nextNode === lastNode);
                
                this.sequence.push(nextNode);
                lastNode = nextNode;
            }

            this.playerInput = [];
            this.seqIdx = 0;
            this.state = "MEMORIZE";
            this.timer = 0;
            
            // Input window tightens significantly at higher levels
            this.inputTimer = Math.max(240, 600 - (this.level * 60)); 
            
            // Flashes get faster at higher levels
            this.flashSpeed = Math.max(20, 50 - (this.level * 5));
        }

        handleClick(e) {
            if (this.state === "VICTORY" || this.state === "FAILURE") {
                if (!this.waitingRestart) {
                    this.waitingRestart = true;
                    setTimeout(() => this.cleanupAndFinish(this.state === "VICTORY"), 500);
                }
                return;
            }

            if (this.state !== "INPUT") return;

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            let nodeClicked = false;
            this.nodes.forEach((node, index) => {
                if (node.contains(mx, my)) {
                    node.trigger(COLORS.STABLE, 20); // Quick flash for player input
                    this.playerInput.push(index);
                    this.checkInput();
                    nodeClicked = true;
                }
            });

            // Penalty for clicking empty space during input phase
            if (!nodeClicked) {
                this.corruption += 5;
            }
        }

        checkInput() {
            const idx = this.playerInput.length - 1;
            const clickedNodeIndex = this.playerInput[idx];

            if (clickedNodeIndex !== this.sequence[idx]) {
                this.nodes[clickedNodeIndex].trigger(COLORS.CORRUPTION, 60);
                this.corruption += 25; // Harsh penalty for wrong node
                this.state = "TRANSITION";
                this.transitionMsg = "ERR: INVALID POINTER";
                this.timer = 60; 
                return;
            }

            if (this.playerInput.length === this.sequence.length) {
                if (this.level >= this.targetLevel) {
                    this.state = "VICTORY";
                    setTimeout(() => this.cleanupAndFinish(true), 2500);
                } else {
                    this.level++;
                    this.corruption = Math.max(0, this.corruption - 10); // Slight heal
                    this.state = "TRANSITION";
                    this.transitionMsg = "BLOCKCHAIN VERIFIED";
                    this.timer = 50;
                }
            }
        }

        update() {
            if (this.state === "FINISHED") return;
            
            this.coreRotation += 0.005;

            if (this.state === "PREPARE") {
                this.prepareTimer -= 1/60;
                if (this.prepareTimer <= 0) this.startRound();
                return;
            }

            this.corruption = Math.min(100, Math.max(0, this.corruption));

            if (this.state !== "VICTORY" && this.state !== "FAILURE") {
                this.globalTimer--;
                if (this.globalTimer <= 0) {
                    this.state = "FAILURE";
                    this.failMessage = "UPLINK SEVERED: TIMEOUT";
                    setTimeout(() => this.cleanupAndFinish(false), 2500);
                }
            }

            if (this.state === "MEMORIZE") {
                this.timer++;
                // Gap between flashes
                if (this.timer % (this.flashSpeed + 15) === 0) { 
                    if (this.seqIdx < this.sequence.length) {
                        const nodeIndex = this.sequence[this.seqIdx];
                        this.nodes[nodeIndex].trigger(COLORS.STABLE, this.flashSpeed);
                        this.seqIdx++;
                    } else {
                        // Short pause before input allowed
                        setTimeout(() => this.state = "INPUT", 400); 
                    }
                }
            } 
            else if (this.state === "INPUT") {
                this.inputTimer--;
                if (this.inputTimer <= 0) {
                    this.corruption += 15; 
                    this.state = "TRANSITION";
                    this.transitionMsg = "TIMEOUT: SEQUENCE DROPPED";
                    this.timer = 60;
                }
            }
            else if (this.state === "TRANSITION") {
                this.timer--;
                if (this.timer <= 0) this.startRound();
            }

            if (this.corruption >= 100 && this.state !== "FAILURE") {
                this.state = "FAILURE";
                this.failMessage = "FATAL: CORE MELTDOWN";
                setTimeout(() => this.cleanupAndFinish(false), 2500);
            }

            this.nodes.forEach(node => node.update(this.corruption));
        }

        drawGrid(ctx, W, H, gameX, gameW) {
            ctx.strokeStyle = COLORS.GRID;
            ctx.lineWidth = 1;
            const cellSize = 40;
            
            ctx.beginPath();
            for (let x = gameX; x < W; x += cellSize) {
                ctx.moveTo(x, 0); ctx.lineTo(x, H);
            }
            for (let y = 0; y < H; y += cellSize) {
                ctx.moveTo(gameX, y); ctx.lineTo(W, y);
            }
            ctx.stroke();
        }

        drawSidebar(W, H) {
            const sbW = W * 0.3;
            
            ctx.fillStyle = COLORS.SIDEBAR;
            ctx.fillRect(0, 0, sbW, H);
            
            ctx.strokeStyle = COLORS.NODE_BORDER;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(sbW, 0); ctx.lineTo(sbW, H);
            ctx.stroke();

            ctx.textAlign = 'left';
            ctx.fillStyle = COLORS.STABLE;
            ctx.font = 'bold 24px Courier New';
            ctx.shadowBlur = 10;
            ctx.shadowColor = COLORS.STABLE;
            ctx.fillText("CORE STABILIZER", 25, 60);
            ctx.shadowBlur = 0;

            const instructions = [
                "> Track Node Sequence",
                "> Await Input Prompt",
                "> Replicate Pattern Exact",
                "> Speed Increases per Tier",
                "> Maximize Global Timer"
            ];

            let startY = 110;
            ctx.font = '14px Courier New';
            instructions.forEach((line) => {
                ctx.fillStyle = COLORS.TEXT_DIM;
                ctx.fillText(line, 25, startY);
                startY += 25;
            });

            startY += 50;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Courier New';
            ctx.fillText("SECURITY TIER:", 25, startY);
            
            startY += 20;
            for(let i=0; i<this.targetLevel; i++) {
                ctx.fillStyle = i < this.level - 1 ? COLORS.STABLE : COLORS.UI_DARK;
                ctx.fillRect(25 + (i * 35), startY, 25, 8);
            }

            startY += 60;
            const secondsLeft = Math.max(0, Math.ceil(this.globalTimer / 60));
            ctx.fillStyle = '#fff';
            ctx.fillText(`UPLINK REMAINING: ${secondsLeft}s`, 25, startY);

            startY += 40;
            ctx.fillStyle = this.corruption > 75 ? COLORS.CORRUPTION : COLORS.TEXT_DIM;
            ctx.fillText(`SYSTEM CORRUPTION: ${Math.floor(this.corruption)}%`, 25, startY);
            
            startY += 15;
            ctx.fillStyle = COLORS.UI_DARK;
            ctx.fillRect(25, startY, sbW - 50, 15);
            ctx.fillStyle = this.corruption > 75 ? COLORS.CORRUPTION : COLORS.WARNING;
            ctx.shadowBlur = this.corruption > 75 ? 10 : 0;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fillRect(25, startY, (sbW - 50) * (this.corruption / 100), 15);
            ctx.shadowBlur = 0;
        }

        draw(ctx) {
            if (this.state === "FINISHED") return;

            const W = canvas.width;
            const H = canvas.height;
            const gameX = W * 0.3;
            const gameW = W * 0.7;
            const cx = gameX + gameW / 2;
            const cy = H / 2;

            ctx.fillStyle = COLORS.BG;
            ctx.fillRect(0, 0, W, H);
            
            this.drawGrid(ctx, W, H, gameX, gameW);
            this.drawSidebar(W, H);

            if (this.state === "FAILURE" || this.state === "VICTORY") {
                this.drawEndScreen(this.state === "VICTORY" ? COLORS.STABLE : COLORS.CORRUPTION, this.failMessage || "STABILIZATION COMPLETE");
                return;
            }
            
            if (this.state === "PREPARE") {
                ctx.textAlign = "center";
                ctx.fillStyle = COLORS.TEXT_DIM;
                ctx.font = "24px Courier New";
                ctx.fillText("ESTABLISHING HANDSHAKE...", cx, cy - 50);
                ctx.fillStyle = COLORS.STABLE;
                ctx.font = "bold 80px Courier New";
                ctx.fillText(Math.ceil(this.prepareTimer), cx, cy + 40);
                return;
            }

            // Draw radial connection lines
            ctx.strokeStyle = COLORS.NODE_BORDER;
            ctx.lineWidth = 1;
            ctx.beginPath();
            this.nodes.forEach(node => {
                ctx.moveTo(cx, cy);
                ctx.lineTo(node.x, node.y);
            });
            ctx.stroke();

            // Draw Central Core
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(-this.coreRotation);
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.setLineDash([5, 10]);
            ctx.strokeStyle = this.state === "MEMORIZE" ? COLORS.WARNING : COLORS.STABLE;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(cx, cy, 20, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.UI_DARK;
            ctx.fill();

            // Draw Nodes
            this.nodes.forEach(node => node.draw(ctx));

            // Status Text HUD
            ctx.textAlign = "center";
            ctx.font = "bold 24px Courier New";
            let instruction = "";
            let instColor = COLORS.TEXT_DIM;

            if(this.state === "MEMORIZE") {
                instruction = "OBSERVE PATTERN";
                instColor = COLORS.WARNING;
            }
            else if(this.state === "INPUT") {
                const seqLen = this.sequence ? this.sequence.length : 0;
                instruction = `AWAITING INPUT [ ${this.playerInput.length} / ${seqLen} ]`;
                instColor = COLORS.STABLE;
            }
            else if(this.state === "TRANSITION") {
                instruction = this.transitionMsg;
                instColor = this.transitionMsg.includes("ERR") || this.transitionMsg.includes("TIMEOUT") ? COLORS.CORRUPTION : COLORS.STABLE;
            }
            
            // Draw status text below nodes
            ctx.fillStyle = instColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = instColor;
            ctx.fillText(instruction, cx, cy + 250);
            ctx.shadowBlur = 0;

            // Input Timer Bar
            if (this.state === "INPUT") {
                const maxTime = Math.max(240, 600 - (this.level * 60));
                const barWidth = 400;
                ctx.fillStyle = COLORS.UI_DARK;
                ctx.fillRect(cx - barWidth/2, cy + 280, barWidth, 6);
                ctx.fillStyle = COLORS.STABLE;
                ctx.fillRect(cx - barWidth/2, cy + 280, barWidth * (this.inputTimer / maxTime), 6);
            }
        }

        drawEndScreen(color, msg) {
            const W = canvas.width;
            const H = canvas.height;
            const gameX = W * 0.3;
            const gameW = W * 0.7;
            const cx = gameX + gameW / 2;
            const cy = H / 2;
            
            ctx.fillStyle = 'rgba(3, 5, 8, 0.9)';
            ctx.fillRect(gameX, 0, gameW, H);
            
            ctx.fillStyle = color;
            ctx.textAlign = "center";
            ctx.font = "bold 42px 'Courier New'"; 
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            ctx.fillText(msg, cx, cy);
            ctx.shadowBlur = 0;
        }

        cleanupAndFinish(success) {
            if (this.state === "FINISHED") return;
            this.state = "FINISHED";

            canvas.removeEventListener('mousedown', this.boundHandleClick);
            window.removeEventListener('resize', this.boundResize);

            if (animationFrameId) cancelAnimationFrame(animationFrameId);

            if (onComplete) onComplete(success);
        }
    }

    // --- INIT ---
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    gameInstance = new CoreStabilizer();

    function gameLoop() {
        if (!gameInstance || gameInstance.state === "FINISHED") return;

        if (canvas.style.display === 'none' || canvas.classList.contains('hidden')) {
            gameInstance.state = "FINISHED";
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            return;
        }

        gameInstance.update();
        gameInstance.draw(ctx);
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    gameLoop();

    window.stopSecurityGame = function() {
        if (gameInstance) {
            gameInstance.state = "FINISHED";
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        }
    };
};