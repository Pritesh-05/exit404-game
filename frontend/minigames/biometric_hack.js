// minigames/biometric_hack.js - Biometric Tumbler (Symmetry Sync)

window.startBiometricGame = function(canvasId, onComplete) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Biometric Game: Canvas not found!");
        if (onComplete) onComplete(false);
        return;
    }
    const ctx = canvas.getContext('2d');

    // Force Full Screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    // --- CYBERPUNK PALETTE ---
    const COLORS = {
        BG: '#020508',
        RING_BG: 'rgba(0, 30, 50, 0.2)',
        RING_HOVER: 'rgba(0, 240, 255, 0.1)',
        RIDGE_ERR: '#FF003C',       // Crimson for misaligned
        RIDGE_SYNC: '#00F0FF',      // Cyan for aligned
        RIDGE_PERFECT: '#00FF41',   // Green for locked
        HUD_TEXT: '#4a6b8c',
        WARNING: '#FFB000'
    };

    let animationFrameId;
    let gameInstance = null;

    // Math Helpers
    function normalizeAngle(angle) {
        let a = angle % (Math.PI * 2);
        if (a < -Math.PI) a += Math.PI * 2;
        if (a > Math.PI) a -= Math.PI * 2;
        return a;
    }

    class FingerprintRing {
        constructor(index, innerR, outerR) {
            this.index = index;
            this.innerR = innerR;
            this.outerR = outerR;
            this.arcs = [];
            
            // Start heavily scrambled
            this.rotation = (Math.random() * Math.PI) + 1.0; 
            
            // Randomize drift direction and speed based on ring size
            this.baseDrift = (Math.random() > 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.003);
            
            this.status = "ERR"; // ERR, SYNC, LOCKED
            this.graceTimer = 0; // Time it stays aligned before drifting again
        }

        generateArcs() {
            // Procedurally generate ridges for this specific ring segment
            let rStep = 15;
            for (let r = this.innerR + 10; r < this.outerR; r += rStep) {
                let currentAngle = 0;
                while (currentAngle < Math.PI * 2) {
                    // Random gap and ridge length
                    let gap = Math.random() * 0.4 + 0.1;
                    let length = Math.random() * 1.5 + 0.2;
                    
                    if (currentAngle + length < Math.PI * 2) {
                        this.arcs.push({
                            radius: r,
                            start: currentAngle,
                            end: currentAngle + length
                        });
                    }
                    currentAngle += length + gap;
                }
            }
        }

        update(dt, isLevelActive) {
            if (!isLevelActive) return;

            let normAngle = normalizeAngle(this.rotation);
            let distToZero = Math.abs(normAngle);

            // Alignment Check
            if (distToZero < 0.08) {
                this.status = "LOCKED";
                this.rotation = 0; // Snap to perfect
                this.graceTimer = 1.5; // Stays locked for 1.5 seconds without player holding it
            } else if (distToZero < 0.3) {
                this.status = "SYNC"; // Close, but still drifting
            } else {
                this.status = "ERR";
            }

            // Apply Entropy (Drift)
            if (this.graceTimer > 0) {
                this.graceTimer -= dt;
                // If grace period expires, bump it slightly so it starts drifting again
                if (this.graceTimer <= 0) {
                    this.rotation += (this.baseDrift > 0 ? 0.09 : -0.09);
                }
            } else {
                this.rotation += this.baseDrift;
            }
        }

        draw(ctx, cx, cy, isHovered, isDragging) {
            // Draw Ring Background
            ctx.beginPath();
            ctx.arc(cx, cy, this.outerR, 0, Math.PI * 2);
            ctx.arc(cx, cy, this.innerR, 0, Math.PI * 2, true);
            
            if (isDragging) {
                ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
            } else if (isHovered) {
                ctx.fillStyle = COLORS.RING_HOVER;
            } else {
                ctx.fillStyle = 'transparent';
            }
            ctx.fill();

            // Ring Separator Line
            ctx.beginPath();
            ctx.arc(cx, cy, this.outerR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Determine Ridge Color
            let ridgeColor = COLORS.RIDGE_ERR;
            if (this.status === "LOCKED") ridgeColor = COLORS.RIDGE_PERFECT;
            else if (this.status === "SYNC") ridgeColor = COLORS.RIDGE_SYNC;

            // Draw Ridges
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(this.rotation);
            
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.strokeStyle = ridgeColor;
            
            if (this.status === "LOCKED") {
                ctx.shadowBlur = 10;
                ctx.shadowColor = COLORS.RIDGE_PERFECT;
            } else if (this.status === "SYNC") {
                ctx.shadowBlur = 5;
                ctx.shadowColor = COLORS.RIDGE_SYNC;
            }

            this.arcs.forEach(arc => {
                ctx.beginPath();
                ctx.arc(0, 0, arc.radius, arc.start, arc.end);
                ctx.stroke();
            });

            ctx.restore();
        }
    }

    class TumblerGame {
        constructor() {
            this.state = "PREPARE";
            this.timeLeft = 100.0;
            this.level = 1;
            
            this.cx = WIDTH * 0.4; // Offset to left to leave room for HUD
            this.cy = HEIGHT / 2;
            
            this.rings = [];
            this.activeRing = null;
            this.hoveredRing = null;
            this.lastMouseAngle = 0;
            
            this.masterSyncTimer = 0; // Fills up when ALL rings are locked

            this.lastTime = performance.now();
            this.prepareTimer = 3.0;

            this.initLevel();
            this.bindInput();
        }

        initLevel() {
            this.rings = [];
            let ringCount = 2 + this.level; // Lvl 1: 3 rings, Lvl 2: 4, Lvl 3: 5
            let coreRadius = 50;
            let ringWidth = (Math.min(WIDTH, HEIGHT) * 0.4 - coreRadius) / ringCount;

            for (let i = 0; i < ringCount; i++) {
                let inner = coreRadius + (i * ringWidth);
                let outer = inner + ringWidth;
                let r = new FingerprintRing(i, inner, outer);
                r.generateArcs();
                this.rings.push(r);
            }
            this.masterSyncTimer = 0;
        }

        bindInput() {
            const getAngleAndDist = (e) => {
                const rect = canvas.getBoundingClientRect();
                let clientX = e.touches ? e.touches[0].clientX : e.clientX;
                let clientY = e.touches ? e.touches[0].clientY : e.clientY;
                let mx = clientX - rect.left;
                let my = clientY - rect.top;
                
                let dist = Math.hypot(mx - this.cx, my - this.cy);
                let angle = Math.atan2(my - this.cy, mx - this.cx);
                return { dist, angle };
            };

            this.boundMove = (e) => {
                let { dist, angle } = getAngleAndDist(e);

                if (this.activeRing) {
                    let delta = angle - this.lastMouseAngle;
                    // Handle wrap-around
                    if (delta > Math.PI) delta -= Math.PI * 2;
                    if (delta < -Math.PI) delta += Math.PI * 2;
                    
                    this.activeRing.rotation += delta;
                    this.activeRing.graceTimer = 0; // Interrupt grace period if dragged
                    this.lastMouseAngle = angle;
                } else {
                    // Hover logic
                    this.hoveredRing = this.rings.find(r => dist >= r.innerR && dist <= r.outerR);
                }
            };

            this.boundDown = (e) => {
                let { dist, angle } = getAngleAndDist(e);
                this.activeRing = this.rings.find(r => dist >= r.innerR && dist <= r.outerR);
                if (this.activeRing) this.lastMouseAngle = angle;
            };

            this.boundUp = () => {
                this.activeRing = null;
            };

            window.addEventListener('mousemove', this.boundMove);
            window.addEventListener('mousedown', this.boundDown);
            window.addEventListener('mouseup', this.boundUp);
            window.addEventListener('touchmove', this.boundMove, {passive: false});
            window.addEventListener('touchstart', this.boundDown, {passive: false});
            window.addEventListener('touchend', this.boundUp);
        }

        update(timestamp) {
            let dt = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;

            if (this.state === "PREPARE") {
                this.prepareTimer -= dt;
                if (this.prepareTimer <= 0) this.state = "PLAYING";
                return;
            }

            if (this.state !== "PLAYING") return;

            this.timeLeft -= dt;
            if (this.timeLeft <= 0) {
                this.endGame(false);
                return;
            }

            let allLocked = true;
            this.rings.forEach(r => {
                // Don't apply entropy if the player is actively dragging this specific ring
                let isBeingDragged = (this.activeRing === r);
                r.update(dt, !isBeingDragged);
                if (r.status !== "LOCKED") allLocked = false;
            });

            // Master Sync Logic
            if (allLocked) {
                this.masterSyncTimer += dt;
                if (this.masterSyncTimer >= 2.0) { // Hold all rings aligned for 2 seconds
                    if (this.level >= 3) {
                        this.endGame(true);
                    } else {
                        this.level++;
                        this.state = "PREPARE";
                        this.prepareTimer = 2.0;
                        this.initLevel();
                    }
                }
            } else {
                // Rapidly drain master sync if a ring slips out of alignment
                this.masterSyncTimer = Math.max(0, this.masterSyncTimer - dt * 2);
            }
        }

        drawEffects() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            for (let i = 0; i < HEIGHT; i += 4) {
                ctx.fillRect(0, i, WIDTH, 1);
            }
            const grad = ctx.createRadialGradient(this.cx, this.cy, 100, this.cx, this.cy, WIDTH * 0.8);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.9)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }

        draw() {
            ctx.fillStyle = COLORS.BG;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            this.drawEffects();

            // Draw Core
            ctx.beginPath();
            ctx.arc(this.cx, this.cy, 40, 0, Math.PI * 2);
            ctx.fillStyle = '#010a12';
            ctx.fill();
            ctx.strokeStyle = this.masterSyncTimer > 0 ? COLORS.RIDGE_PERFECT : COLORS.HUD_TEXT;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Rings
            this.rings.forEach(r => {
                r.draw(ctx, this.cx, this.cy, this.hoveredRing === r, this.activeRing === r);
            });

            // HUD
            this.drawSidebar();

            if (this.state === "PREPARE") {
                this.drawOverlay(`INITIALIZING TIER 0${this.level}`, Math.ceil(this.prepareTimer));
            } else if (this.state === "FINISHED") {
                this.drawOverlay(this.timeLeft > 0 ? "BIOMETRIC LOCK BYPASSED" : "SYSTEM LOCKDOWN", this.timeLeft > 0 ? "ACCESS GRANTED" : "CONNECTION SEVERED", this.timeLeft > 0 ? COLORS.RIDGE_PERFECT : COLORS.RIDGE_ERR);
            }
        }

        drawSidebar() {
            const sbX = WIDTH * 0.75; // Right side panel
            const sbW = WIDTH * 0.25;
            
            ctx.fillStyle = "rgba(2, 6, 12, 0.9)";
            ctx.fillRect(sbX, 0, sbW, HEIGHT);
            ctx.strokeStyle = COLORS.HUD_TEXT;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sbX, 0); ctx.lineTo(sbX, HEIGHT);
            ctx.stroke();

            ctx.textAlign = 'left';
            ctx.fillStyle = COLORS.RIDGE_SYNC;
            ctx.font = 'bold 28px Courier New';
            ctx.fillText("SYMMETRY SYNC", sbX + 20, 50);

            ctx.font = '14px Courier New';
            ctx.fillStyle = COLORS.HUD_TEXT;
            ctx.fillText("> Select and drag rings to align.", sbX + 20, 90);
            ctx.fillText("> Counteract system entropy.", sbX + 20, 115);
            ctx.fillText("> Align all layers simultaneously.", sbX + 20, 140);

            // Ring Status Console
            let startY = 200;
            ctx.font = 'bold 16px Courier New';
            ctx.fillStyle = "#fff";
            ctx.fillText(`SECURITY TIER: ${this.level}/3`, sbX + 20, startY);
            
            startY += 40;
            this.rings.forEach((r, i) => {
                let color = COLORS.RIDGE_ERR;
                let text = "[ ERR  ] UNALIGNED";
                if (r.status === "LOCKED") { color = COLORS.RIDGE_PERFECT; text = "[ OK   ] LOCKED"; }
                else if (r.status === "SYNC") { color = COLORS.RIDGE_SYNC; text = "[ SYNC ] STABILIZING"; }

                ctx.fillStyle = color;
                ctx.fillText(`LAYER 0${i}: ${text}`, sbX + 20, startY);
                
                // Draw little hex code simulating the rotation
                ctx.fillStyle = COLORS.HUD_TEXT;
                let hex = Math.abs(Math.floor(r.rotation * 1000)).toString(16).toUpperCase().padStart(4, '0');
                ctx.fillText(`0x${hex}`, sbX + 250, startY);
                
                startY += 30;
            });

            // Master Sync Progress Bar
            startY += 40;
            ctx.fillStyle = "#fff";
            ctx.fillText("MASTER SYNC PROTOCOL:", sbX + 20, startY);
            
            startY += 15;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(sbX + 20, startY, sbW - 40, 20);
            ctx.strokeStyle = COLORS.HUD_TEXT;
            ctx.strokeRect(sbX + 20, startY, sbW - 40, 20);
            
            let syncPct = Math.min(1, this.masterSyncTimer / 2.0);
            ctx.fillStyle = syncPct === 1 ? COLORS.RIDGE_PERFECT : COLORS.RIDGE_SYNC;
            ctx.fillRect(sbX + 22, startY + 2, (sbW - 44) * syncPct, 16);

            // Timer
            ctx.fillStyle = this.timeLeft < 15 ? COLORS.RIDGE_ERR : "#fff";
            ctx.font = 'bold 32px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.timeLeft.toFixed(1)}s`, sbX + (sbW/2), HEIGHT - 50);
            ctx.font = '14px Courier New';
            ctx.fillStyle = COLORS.HUD_TEXT;
            ctx.fillText("TRACE UPLINK", sbX + (sbW/2), HEIGHT - 25);
        }

        drawOverlay(title, subtitle, color = COLORS.RIDGE_SYNC) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            
            ctx.textAlign = "center";
            ctx.fillStyle = color;
            ctx.font = "bold 40px Courier New";
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            ctx.fillText(title, WIDTH/2, HEIGHT/2 - 20);
            ctx.shadowBlur = 0;
            
            ctx.font = "bold 60px Courier New";
            ctx.fillStyle = "#fff";
            ctx.fillText(subtitle, WIDTH/2, HEIGHT/2 + 50);
        }

        endGame(win) {
            this.state = "FINISHED";
            setTimeout(() => cleanupAndFinish(win), 3000);
        }
    }

    gameInstance = new TumblerGame();

    function loop(timestamp) {
        if (canvas.style.display === 'none' || canvas.classList.contains('hidden')) {
             if (gameInstance) gameInstance.state = "FINISHED";
             cancelAnimationFrame(animationFrameId);
             return;
        }

        if (!gameInstance) return;
        gameInstance.update(timestamp);
        gameInstance.draw();
        animationFrameId = requestAnimationFrame(loop);
    }
    
    requestAnimationFrame(loop);

    function cleanupAndFinish(success) {
        if (!gameInstance) return;
        gameInstance.state = "FINISHED";
        
        window.removeEventListener('mousemove', gameInstance.boundMove);
        window.removeEventListener('mousedown', gameInstance.boundDown);
        window.removeEventListener('mouseup', gameInstance.boundUp);
        window.removeEventListener('touchmove', gameInstance.boundMove);
        window.removeEventListener('touchstart', gameInstance.boundDown);
        window.removeEventListener('touchend', gameInstance.boundUp);
        
        cancelAnimationFrame(animationFrameId);
        gameInstance = null;

        if (onComplete) onComplete(success);
    }

    window.stopBiometricGame = function() {
        cleanupAndFinish(true); 
    };
};