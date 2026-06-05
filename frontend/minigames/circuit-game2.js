// circuit-game2.js - ORBITAL DATA SPIKING (Easy Mode)
// Wider gaps, slower speeds, more ammo, and instant EMPs.

class DoorOverrideGame {
    constructor(width, height) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = width || this.canvas.width;
        this.height = height || this.canvas.height;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.STATE = {
            PREPARE: 'prepare',
            PLAYING: 'playing',
            TRANSITION: 'transition',
            WIN: 'win',
            LOSE: 'lose'
        };

        this.COLORS = {
            BG: '#020305',
            RING: '#00ccff',
            RING_WARN: '#ff5500',
            CORE_INNER: '#ffffff',
            CORE_OUTER: '#00ff99',
            SPIKE: '#ffffff',
            SIDEBAR: '#05080c',
            TEXT: '#00ffff',
            LASER: 'rgba(255, 50, 50, 0.4)',
            FRAGMENT: '#ffcc00',
            EMP_READY: '#ff00ff'
        };

        // EASY MODE: Fewer rings, huge gaps, and very slow speeds
        this.LEVELS = [
            { name: "LAYER 1: OUTER SHELL", rings: 3, gap: 100, speedMod: 0.8 },
            { name: "LAYER 2: ROTOR SHIELD", rings: 4, gap: 85, speedMod: 1.1 },
            { name: "LAYER 3: CORE VAULT", rings: 5, gap: 70, speedMod: 1.4 }
        ];

        this.currentLevel = 0;
        this.currentState = this.STATE.PREPARE;
        
        // Mechanics
        this.rings = [];
        this.launcherAngle = Math.PI / 2; 
        this.spike = { active: false, r: 0, angle: Math.PI / 2 };
        this.ammo = 5; // EASY MODE: 5 lives instead of 3
        
        // EMP Mechanics (Easy Limits)
        this.fragments = [];
        this.empCharge = 0;
        this.fragsNeeded = 1; // EASY MODE: 1 orb = 1 EMP blast
        this.maxEmpBlasts = 2; // Can hold 2 on all levels
        this.maxFragmentsThisLevel = 2; // Max 2 orbs per level
        this.fragmentsCollectedThisLevel = 0; 
        
        this.heat = 0; 
        this.isDampening = false;
        this.heatFillRate = 20;  // EASY MODE: Takes 5 full seconds to overheat
        this.heatCoolRate = 45;  // Cools down extremely fast

        this.maxRadius = 260;
        this.coreRadius = 25;
        this.spikeSpeed = 1500; 
        this.shake = 0;
        this.particles = [];
        this.keys = {};

        // Input Binding
        this.boundDown = (e) => this.handleDown(e);
        this.boundUp = (e) => this.handleUp(e);
        this.boundRightClick = (e) => { e.preventDefault(); this.tryFireEMP(); };
        
        this.boundKeyDown = (e) => { 
            this.keys[e.code] = true; 
            if(e.code === 'Space') { e.preventDefault(); this.handleDown(e); }
            if(e.code === 'KeyW' || e.code === 'ArrowUp') { e.preventDefault(); this.tryFireEMP(); }
        };
        this.boundKeyUp = (e) => { 
            this.keys[e.code] = false; 
            if(e.code === 'Space') this.handleUp(e); 
        };
        
        this.canvas.addEventListener('mousedown', this.boundDown);
        window.addEventListener('mouseup', this.boundUp);
        this.canvas.addEventListener('contextmenu', this.boundRightClick);
        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
        
        this.lastTime = Date.now() / 1000;
        this.initGame();
    }

    get time() { return Date.now() / 1000; }

    initGame() {
        this.currentLevel = 0;
        this.startPreparePhase();
    }

    startPreparePhase() {
        this.currentState = this.STATE.PREPARE;
        this.prepareEndTime = this.time + 1.5; 
    }

    initLevel(levelIdx) {
        this.currentLevel = levelIdx;
        const cfg = this.LEVELS[levelIdx];
        
        this.heat = 0;
        this.ammo = 5; 
        this.spike.active = false;
        this.isDampening = false;
        this.launcherAngle = Math.PI / 2; 

        // EMP Reset
        this.fragmentsCollectedThisLevel = 0;
        this.empCharge = 0;
        this.fragments = [];
        
        // Generate Rings
        this.rings = [];
        const ringSpacing = (this.maxRadius - this.coreRadius - 20) / cfg.rings;
        
        for (let i = 0; i < cfg.rings; i++) {
            const rad = this.maxRadius - (i * ringSpacing);
            const dir = Math.random() < 0.5 ? 1 : -1;
            const baseSpeed = (Math.random() * 0.5 + 0.5) * cfg.speedMod;
            
            this.rings.push({
                r: rad,
                speed: baseSpeed,
                dir: dir,
                gapSize: cfg.gap * (Math.PI / 180),
                angle: Math.random() * Math.PI * 2,
                thickness: 8 
            });
        }
        
        this.spawnFragment();

        this.lastTime = this.time;
        this.currentState = this.STATE.PLAYING;
    }

    spawnFragment() {
        if (this.fragments.length === 0 && this.fragmentsCollectedThisLevel < this.maxFragmentsThisLevel && this.rings.length > 0) {
            let spawnAngle = this.launcherAngle + (Math.PI) + (Math.random() - 0.5);
            spawnAngle = spawnAngle % (Math.PI * 2);
            this.fragments.push({
                angle: spawnAngle,
                r: this.maxRadius + 40,
                pulse: Math.random() * Math.PI
            });
        }
    }

    // --- INPUT ---

    handleDown(e) {
        if (e.button === 2) return; 
        if (this.currentState !== this.STATE.PLAYING) return;
        if (!this.spike.active) this.isDampening = true;
    }

    handleUp(e) {
        if (e.button === 2) return;
        if (this.currentState !== this.STATE.PLAYING) return;
        if (this.isDampening && !this.spike.active) {
            this.isDampening = false;
            this.fireSpike();
        }
    }

    fireSpike() {
        if (this.ammo > 0) {
            this.spike.active = true;
            this.spike.angle = this.launcherAngle; 
            this.spike.r = this.maxRadius + 20; 
        }
    }

    tryFireEMP() {
        if (this.currentState !== this.STATE.PLAYING) return;
        
        if (this.empCharge >= this.fragsNeeded && this.rings.length > 0) {
            this.empCharge -= this.fragsNeeded;
            this.triggerShake(20);
            
            // Find outermost ring
            let outerRing = this.rings[0];
            let outerIdx = 0;
            for(let i=1; i<this.rings.length; i++) {
                if(this.rings[i].r > outerRing.r) {
                    outerRing = this.rings[i];
                    outerIdx = i;
                }
            }
            
            // Massive Explosion
            this.createExplosion(outerRing.r, this.COLORS.EMP_READY, 80);
            
            // Remove the ring
            this.rings.splice(outerIdx, 1);
        }
    }

    triggerShake(amt = 12) {
        this.shake = amt;
    }

    createExplosion(r, color, count) {
        const gameX = this.width * 0.3;
        const cx = gameX + (this.width * 0.7) / 2;
        const cy = this.height / 2;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 400 + 100;
            this.particles.push({
                x: cx + Math.cos(angle) * r, 
                y: cy + Math.sin(angle) * r,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: color
            });
        }
    }

    createSparks(r, angle, color = null) {
        const gameX = this.width * 0.3;
        const cx = gameX + (this.width * 0.7) / 2;
        const cy = this.height / 2;
        
        const hitX = cx + Math.cos(angle) * r;
        const hitY = cy + Math.sin(angle) * r;

        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: hitX, y: hitY,
                vx: Math.cos(angle) * 150 + (Math.random() - 0.5) * 400,
                vy: Math.sin(angle) * 150 + (Math.random() - 0.5) * 400,
                life: 1.0,
                color: color ? color : (Math.random() > 0.5 ? '#ffaa00' : '#ffffff')
            });
        }
    }

    // --- GAME LOGIC ---

    update() {
        const now = this.time;
        const dt = now - this.lastTime;
        this.lastTime = now;

        if (this.currentState === this.STATE.PREPARE) {
            if (now >= this.prepareEndTime) this.initLevel(this.currentLevel);
            return;
        }

        if (this.currentState === this.STATE.TRANSITION) {
            if (now >= this.transitionEndTime) this.initLevel(this.currentLevel);
            return;
        }

        if (this.currentState === this.STATE.PLAYING) {
            
            // 1. Orbital Movement
            let moveDir = 0;
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveDir -= 1;
            if (this.keys['ArrowRight'] || this.keys['KeyD']) moveDir += 1;
            
            this.launcherAngle += moveDir * 5.0 * dt; 
            this.launcherAngle = this.launcherAngle % (Math.PI * 2);
            if (this.launcherAngle < 0) this.launcherAngle += Math.PI * 2;

            // 1b. Fragment Collection via Launcher Movement
            for (let i = this.fragments.length - 1; i >= 0; i--) {
                let f = this.fragments[i];
                let diff = Math.abs(f.angle - this.launcherAngle);
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                
                if (diff < 0.15) { // Collection radius
                    this.fragments.splice(i, 1);
                    this.fragmentsCollectedThisLevel++; // Track total collections
                    this.empCharge++;
                    this.createSparks(this.maxRadius + 40, this.launcherAngle, this.COLORS.FRAGMENT);
                    
                    // Spawn next fragment only if we haven't hit the level's hard cap
                    this.spawnFragment(); 
                }
            }

            // 2. Update Heat & Dampener
            let speedMult = 1.0;
            if (this.isDampening) {
                speedMult = 0.1; // EASY MODE: Time slows down even more drastically (90% slower)
                this.heat += this.heatFillRate * dt;
                if (this.heat >= 100) {
                    this.currentState = this.STATE.LOSE;
                    this.failReason = "SYSTEM OVERHEATED";
                    return;
                }
            } else {
                this.heat -= this.heatCoolRate * dt;
                if (this.heat < 0) this.heat = 0;
            }

            // 3. Update Rings
            for (let ring of this.rings) {
                ring.angle += ring.speed * ring.dir * speedMult * dt;
                ring.angle = ring.angle % (Math.PI * 2);
                if (ring.angle < 0) ring.angle += Math.PI * 2;
            }

            // 4. Update Spike
            if (this.spike.active) {
                const prevR = this.spike.r;
                this.spike.r -= this.spikeSpeed * dt;

                // Collision Detection against Rings
                for (let ring of this.rings) {
                    if (prevR > ring.r && this.spike.r <= ring.r + ring.thickness/2) {
                        
                        let targetAngle = this.spike.angle;
                        let diff = Math.abs(ring.angle - targetAngle);
                        if (diff > Math.PI) diff = Math.PI * 2 - diff;

                        if (diff > ring.gapSize / 2) { // Hit wall
                            this.spike.active = false;
                            this.ammo--;
                            this.triggerShake();
                            this.createSparks(ring.r, this.spike.angle);
                            
                            if (this.ammo <= 0) {
                                this.currentState = this.STATE.LOSE;
                                this.failReason = "DATA SPIKES DEPLETED";
                            }
                            break; 
                        }
                    }
                }

                // Hit the core
                if (this.spike.active && this.spike.r <= this.coreRadius) {
                    this.spike.active = false;
                    this.levelComplete();
                }
            }

            // 5. Update Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt * 3; 
                if (p.life <= 0) this.particles.splice(i, 1);
            }

            // Shake decay
            if (this.shake > 0) this.shake -= 1;
        }
    }

    levelComplete() {
        if (this.currentLevel < this.LEVELS.length - 1) {
            this.currentLevel++;
            this.currentState = this.STATE.TRANSITION;
            this.transitionEndTime = this.time + 1.2; 
        } else {
            this.currentState = this.STATE.WIN;
        }
    }

    // --- DRAWING ---

    draw() {
        let tx = 0, ty = 0;
        if (this.shake > 0) {
            tx = (Math.random() - 0.5) * this.shake;
            ty = (Math.random() - 0.5) * this.shake;
        }

        this.ctx.save();
        this.ctx.translate(tx, ty);

        const bgGradient = this.ctx.createRadialGradient(
            this.width/2, this.height/2, this.height*0.2, 
            this.width/2, this.height/2, this.height
        );
        bgGradient.addColorStop(0, '#0a101a');
        bgGradient.addColorStop(1, this.COLORS.BG);
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.drawSidebar();

        const gameX = this.width * 0.3;
        const gameW = this.width * 0.7;
        const cx = gameX + gameW / 2;
        const cy = this.height / 2;

        switch (this.currentState) {
            case this.STATE.PREPARE:
                this.drawPrepareScreen(cx, cy);
                break;
            case this.STATE.PLAYING:
                this.drawRingsAndCore(cx, cy);
                this.drawFragments(cx, cy);
                this.drawSpike(cx, cy);
                this.drawParticles();
                break;
            case this.STATE.TRANSITION:
                this.drawTransitionScreen(cx, cy);
                break;
            case this.STATE.WIN:
                this.drawEndScreen(this.COLORS.CORE_OUTER, "CORE PENETRATED", "Data Vault Unlocked.");
                break;
            case this.STATE.LOSE:
                this.drawEndScreen('#ff3333', "ACCESS DENIED", this.failReason);
                break;
        }

        this.ctx.restore();
        this.drawCRTOverlay();
    }

    drawSidebar() {
        const sbW = this.width * 0.3;
        
        this.ctx.fillStyle = this.COLORS.SIDEBAR;
        this.ctx.fillRect(0, 0, sbW, this.height);
        
        this.ctx.strokeStyle = '#1a2b3c';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(sbW, 0);
        this.ctx.lineTo(sbW, this.height);
        this.ctx.stroke();

        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = this.COLORS.TEXT;
        this.ctx.font = 'bold 24px Consolas';
        this.ctx.fillText("DATA SPIKE v5.5", 25, 60);

        this.ctx.strokeStyle = this.COLORS.TEXT;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath(); this.ctx.moveTo(25, 75); this.ctx.lineTo(sbW - 25, 75); this.ctx.stroke();

        const instructions = [
            { color: '#fff', text: "■ A/D or ARROWS to Orbit" },
            { color: '#ffcc00', text: "■ COLLECT ORBS to charge EMP" },
            { color: this.COLORS.EMP_READY, text: "■ W/UP/R-CLICK to Blast Ring" },
            { color: '#ffaa00', text: "■ HOLD CLICK to Dampen Time" },
            { color: '#00ff99', text: "■ RELEASE to Fire Spike" }
        ];

        let startY = 100;
        this.ctx.font = '14px Consolas';
        instructions.forEach(line => {
            this.ctx.fillStyle = line.color;
            this.ctx.fillText(line.text, 25, startY);
            startY += 25;
        });

        if (this.currentState === this.STATE.PLAYING) {
            startY += 20;
            this.ctx.fillStyle = '#6688aa';
            this.ctx.font = '14px Consolas';
            this.ctx.fillText("SECURITY PROTOCOL:", 25, startY);
            
            startY += 25;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 18px Consolas';
            this.ctx.fillText(this.LEVELS[this.currentLevel].name, 25, startY);
            
            startY += 40;
            
            // EMP Charge Display 
            const blastsReady = Math.floor(this.empCharge / this.fragsNeeded);
            this.ctx.fillStyle = blastsReady > 0 ? this.COLORS.EMP_READY : '#fff';
            this.ctx.font = 'bold 16px Consolas';
            
            let empText = `EMP BLASTS: ${blastsReady}`;
            if (blastsReady > 0 && Math.floor(this.time * 2) % 2 === 0) empText += " [PRESS W]";
            this.ctx.fillText(empText, 25, startY);
            
            // Draw Charge Dots (Shows Burned/Used slots in dark red)
            let usedSlots = this.fragmentsCollectedThisLevel - this.empCharge;
            for(let i=0; i < this.maxFragmentsThisLevel; i++) {
                
                if (i < usedSlots) {
                    this.ctx.fillStyle = '#1a0505'; // Depleted/Burned
                    this.ctx.strokeStyle = '#441111';
                } else if (i < usedSlots + this.empCharge) {
                    this.ctx.fillStyle = this.COLORS.FRAGMENT; // Charged
                    this.ctx.strokeStyle = '#000';
                } else {
                    this.ctx.fillStyle = '#223344'; // Uncollected Empty Slot
                    this.ctx.strokeStyle = '#000';
                }
                
                // Group them visually by 2s (though now 1 orb = 1 blast, it looks good spaced out)
                let groupOffset = Math.floor(i / this.fragsNeeded) * 15;
                this.ctx.fillRect(25 + (i * 25) + groupOffset, startY + 15, 20, 20);
                this.ctx.strokeRect(25 + (i * 25) + groupOffset, startY + 15, 20, 20);
            }

            // Ammo
            startY += 70;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Consolas';
            this.ctx.fillText(`SPIKES LEFT:`, 25, startY);
            for(let i=0; i<5; i++) { // EASY MODE: 5 slots
                this.ctx.fillStyle = i < this.ammo ? '#00ccff' : '#223344';
                this.ctx.fillRect(150 + (i * 20), startY - 12, 12, 15);
            }

            // Heat Bar
            startY += 50;
            let heatPulse = this.heat > 80 && Math.floor(this.time * 10) % 2 === 0 ? '#ff0000' : '#fff';
            this.ctx.fillStyle = heatPulse;
            this.ctx.fillText(`SYSTEM HEAT: ${Math.floor(this.heat)}%`, 25, startY);
            
            startY += 15;
            const barW = sbW - 50;
            this.ctx.fillStyle = '#111';
            this.ctx.fillRect(25, startY, barW, 20);
            
            const hGrad = this.ctx.createLinearGradient(25, 0, 25 + barW, 0);
            hGrad.addColorStop(0, '#00ff00');
            hGrad.addColorStop(0.5, '#ffff00');
            hGrad.addColorStop(1, '#ff0000');
            
            this.ctx.fillStyle = hGrad;
            this.ctx.fillRect(25, startY, barW * (this.heat / 100), 20);
            
            this.ctx.strokeStyle = '#445566';
            this.ctx.strokeRect(25, startY, barW, 20);
        }
    }

    drawFragments(cx, cy) {
        for (let f of this.fragments) {
            const fx = cx + Math.cos(f.angle) * f.r;
            const fy = cy + Math.sin(f.angle) * f.r;
            
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = this.COLORS.FRAGMENT;
            this.ctx.fillStyle = this.COLORS.FRAGMENT;
            
            this.ctx.beginPath();
            const pulseRad = 6 + Math.sin(this.time * 5 + f.pulse) * 3;
            this.ctx.arc(fx, fy, pulseRad, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            this.ctx.strokeStyle = this.COLORS.FRAGMENT;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(fx, fy, pulseRad + 8, f.angle - 0.5, f.angle + 0.5);
            this.ctx.stroke();
        }
    }

    drawRingsAndCore(cx, cy) {
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.COLORS.CORE_OUTER;
        this.ctx.fillStyle = this.COLORS.CORE_OUTER;
        this.ctx.beginPath();
        const corePulse = this.coreRadius + Math.sin(this.time * 8) * 4;
        this.ctx.arc(cx, cy, corePulse, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = this.COLORS.CORE_INNER;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, this.coreRadius - 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        for (let ring of this.rings) {
            this.ctx.strokeStyle = this.isDampening ? this.COLORS.RING_WARN : this.COLORS.RING;
            this.ctx.lineWidth = ring.thickness;
            this.ctx.lineCap = 'round'; 
            
            const solidStart = ring.angle + ring.gapSize / 2;
            const solidEnd = ring.angle - ring.gapSize / 2 + Math.PI * 2;

            this.ctx.beginPath();
            this.ctx.arc(cx, cy, ring.r, solidStart, solidEnd);
            this.ctx.stroke();
        }

        // Draw Orbital Launcher
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(this.launcherAngle);
        
        if (!this.spike.active) {
            this.ctx.strokeStyle = this.COLORS.LASER;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([10, 15]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.maxRadius + 10, 0);
            this.ctx.lineTo(this.coreRadius + 5, 0);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        this.ctx.fillStyle = '#2a3b4c';
        this.ctx.strokeStyle = this.empCharge >= this.fragsNeeded ? this.COLORS.EMP_READY : '#00ccff';
        this.ctx.lineWidth = 3;
        
        if (this.empCharge >= this.fragsNeeded) {
             this.ctx.shadowBlur = 15;
             this.ctx.shadowColor = this.COLORS.EMP_READY;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(this.maxRadius + 40, -15);
        this.ctx.lineTo(this.maxRadius + 40, 15);
        this.ctx.lineTo(this.maxRadius + 15, 8);
        this.ctx.lineTo(this.maxRadius + 15, -8);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawSpike(cx, cy) {
        if (!this.spike.active) return;
        
        const sx = cx + Math.cos(this.spike.angle) * this.spike.r;
        const sy = cy + Math.sin(this.spike.angle) * this.spike.r;
        const tailX = cx + Math.cos(this.spike.angle) * (this.spike.r + 40); 
        const tailY = cy + Math.sin(this.spike.angle) * (this.spike.r + 40);

        this.ctx.strokeStyle = this.COLORS.SPIKE;
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00ccff';
        
        this.ctx.beginPath();
        this.ctx.moveTo(sx, sy);
        this.ctx.lineTo(tailX, tailY);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    drawParticles() {
        for (let p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawPrepareScreen(cx, cy) {
        const remaining = (this.prepareEndTime - this.time).toFixed(1);
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.COLORS.TEXT;
        this.ctx.font = '24px Consolas';
        this.ctx.fillText("ALIGNING ORBITAL RINGS...", cx, cy - 60);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 80px Consolas';
        this.ctx.fillText(remaining, cx, cy + 40);
    }

    drawTransitionScreen(cx, cy) {
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.COLORS.CORE_OUTER;
        this.ctx.font = 'bold 40px Consolas';
        this.ctx.fillText("LAYER PENETRATED", cx, cy - 20);
        
        this.ctx.font = '20px Consolas';
        this.ctx.fillStyle = this.COLORS.TEXT;
        this.ctx.fillText("Advancing to next security protocol...", cx, cy + 30);
    }

    drawEndScreen(color, title, sub) {
        this.ctx.fillStyle = "rgba(2, 3, 5, 0.95)";
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 50px Consolas';
        this.ctx.fillText(title, this.width/2, this.height/2 - 30);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Consolas';
        this.ctx.fillText(sub, this.width/2, this.height/2 + 20);
    }

    drawCRTOverlay() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        for (let y = 0; y < this.height; y += 4) {
            this.ctx.fillRect(0, y, this.width, 2);
        }
    }
}

window.DoorOverrideGame = DoorOverrideGame;