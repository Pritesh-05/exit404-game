// minigames/survival.js

window.startSurvivalGame = function(canvasId, onComplete) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Survival Game: Canvas not found!");
        if (onComplete) onComplete(false);
        return;
    }
    const ctx = canvas.getContext('2d');

    // Force Canvas Size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let WIDTH = canvas.width;
    let HEIGHT = canvas.height;

    // --- GAME CONSTANTS ---
    const COLORS = {
        BG: '#020202',          
        GRID: '#003300',        
        PLAYER: '#00ffcc',      
        TEAMMATE: '#0088ff',    
        ENEMY_BASIC: '#00ff00', 
        ENEMY_RUNNER: '#ff0055',
        ENEMY_TANK: '#5500aa',  
        ENEMY_SPITTER: '#ffff00',
        BOSS: '#ff0000',        
        BULLET: '#ffffff',      
        UI_BG: 'rgba(0, 20, 0, 0.9)',
        UI_BORDER: '#00ff00',
        TEXT: '#00ff00'
    };

    // --- INPUT HANDLING ---
    const keys = {};
    const mouse = { x: 0, y: 0, down: false };
    let animationFrameId;

    const handleKeyDown = (e) => {
        keys[e.code] = true;
        // Fix: Prevent Space from clicking the Skip button
        if (e.code === 'Space') {
            e.preventDefault();
        }
    };
    
    const handleKeyUp = (e) => keys[e.code] = false;
    
    const handleMouseMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    };
    
    const handleMouseDown = () => mouse.down = true;
    const handleMouseUp = () => mouse.down = false;
    
    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        WIDTH = canvas.width;
        HEIGHT = canvas.height;
    };

    // Attach Listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    // --- UTILITIES ---
    function randomRange(min, max) { return Math.random() * (max - min) + min; }
    function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
    function checkCollide(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.w &&
                rect1.x + rect1.w > rect2.x &&
                rect1.y < rect2.y + rect2.h &&
                rect1.y + rect1.h > rect2.y);
    }

    // --- CLASSES ---

    class Particle {
        constructor(x, y, color) {
            this.x = x; this.y = y; this.color = color;
            this.size = randomRange(2, 4);
            this.vx = randomRange(-4, 4);
            this.vy = randomRange(-4, 4);
            this.life = randomRange(15, 30);
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            this.life--;
            if(this.life % 5 === 0) this.size -= 1;
            return this.life > 0;
        }
        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }

    class Entity {
        constructor(x, y, w, h, color) {
            this.x = x; this.y = y; this.w = w; this.h = h;
            this.color = color; this.vx = 0; this.vy = 0;
            this.flashTimer = 0;
            this.glitchOffset = {x:0, y:0};
        }
        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            if (this.flashTimer > 0) this.flashTimer--;
            if(Math.random() < 0.05) {
                this.glitchOffset.x = randomRange(-3, 3);
                this.glitchOffset.y = randomRange(-3, 3);
            } else { this.glitchOffset = {x:0, y:0}; }
        }
        draw(ctx) {
            const drawX = this.x + this.glitchOffset.x;
            const drawY = this.y + this.glitchOffset.y;
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.fillRect(drawX + 4, drawY + 4, this.w, this.h);
            ctx.fillStyle = (this.flashTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) ? '#ffffff' : this.color;
            ctx.fillRect(drawX, drawY, this.w, this.h);
            ctx.strokeStyle = '#000000'; ctx.lineWidth = 2;
            ctx.strokeRect(drawX, drawY, this.w, this.h);
            ctx.strokeStyle = this.color; ctx.lineWidth = 1;
            ctx.strokeRect(drawX - 2, drawY - 2, this.w + 4, this.h + 4);
        }
        getCenter() { return { x: this.x + this.w / 2, y: this.y + this.h / 2 }; }
    }

    class Player extends Entity {
        constructor(x, y) {
            super(x, y, 30, 30, COLORS.PLAYER);
            this.name = "John"; this.speed = 240;
            this.health = 100; this.maxHealth = 100;
            this.bullets = 500; this.maxBullets = 2000;
            this.lastShot = 0; this.shotDelay = 0.10;
        }
        update(dt) {
            let dx = 0, dy = 0;
            if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
            if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
            if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
            if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
            if (dx !== 0 || dy !== 0) {
                const mag = Math.sqrt(dx * dx + dy * dy);
                this.vx = (dx / mag) * this.speed;
                this.vy = (dy / mag) * this.speed;
            } else { this.vx = 0; this.vy = 0; }
            super.update(dt);
            this.x = clamp(this.x, 0, WIDTH - this.w);
            this.y = clamp(this.y, 0, HEIGHT - this.h);
            if (mouse.down && this.bullets > 0) {
                const now = Date.now() / 1000;
                if (now - this.lastShot >= this.shotDelay) {
                    this.shoot(); this.lastShot = now;
                }
            }
        }
        shoot() {
            const center = this.getCenter();
            const dx = mouse.x - center.x;
            const dy = mouse.y - center.y;
            const mag = Math.sqrt(dx*dx + dy*dy);
            game.bullets.push(new Bullet(center.x, center.y, dx/mag, dy/mag));
            this.bullets--;
        }
        draw(ctx) {
            super.draw(ctx);
            ctx.fillStyle = COLORS.PLAYER;
            ctx.font = "bold 12px 'Courier New'";
            ctx.textAlign = "center";
            ctx.fillText("John", this.x + this.w/2, this.y - 12);
        }
    }

    class Teammate extends Entity {
        constructor(x, y, name, color) {
            super(x, y, 30, 30, color);
            this.name = name; this.speed = 210; this.followDist = 100;
        }
        update(dt) {
            const playerCenter = game.player.getCenter();
            const myCenter = this.getCenter();
            const dx = playerCenter.x - myCenter.x;
            const dy = playerCenter.y - myCenter.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > this.followDist) {
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;
            } else { this.vx = 0; this.vy = 0; }
            super.update(dt);
        }
        draw(ctx) {
            super.draw(ctx);
            ctx.fillStyle = COLORS.TEAMMATE;
            ctx.font = "10px 'Courier New'";
            ctx.textAlign = "center";
            ctx.fillText(this.name, this.x + this.w/2, this.y - 10);
        }
    }

    class Zombie extends Entity {
        constructor(x, y, type) {
            let size = 30, color = COLORS.ENEMY_BASIC, hp = 30, spd = 90, dmg = 2;
            if (type === 'runner') { color = COLORS.ENEMY_RUNNER; spd = 180; hp = 20; dmg = 4; }
            else if (type === 'tank') { color = COLORS.ENEMY_TANK; size = 50; spd = 50; hp = 150; dmg = 10; }
            else if (type === 'spitter') { color = COLORS.ENEMY_SPITTER; spd = 80; hp = 40; dmg = 5; }
            super(x, y, size, size, color);
            this.type = type; this.maxHealth = hp; this.health = hp;
            this.baseSpeed = spd; this.damage = dmg; this.attackTimer = 0;
        }
        update(dt) {
            const targets = [game.player, ...game.teammates];
            const myCenter = this.getCenter();
            let closest = null, minDist = Infinity;
            targets.forEach(t => {
                const tCenter = t.getCenter();
                const d = Math.sqrt((tCenter.x - myCenter.x)**2 + (tCenter.y - myCenter.y)**2);
                if (d < minDist) { minDist = d; closest = t; }
            });
            if (closest) {
                const tCenter = closest.getCenter();
                const dx = tCenter.x - myCenter.x;
                const dy = tCenter.y - myCenter.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 5) {
                    this.vx = (dx / dist) * this.baseSpeed;
                    this.vy = (dy / dist) * this.baseSpeed;
                }
                if (checkCollide(this, closest)) {
                    if (Date.now() > this.attackTimer) {
                        game.player.health -= this.damage;
                        closest.flashTimer = 10;
                        this.attackTimer = Date.now() + 1000;
                        this.vx = -this.vx * 2; this.vy = -this.vy * 2;
                    }
                }
            }
            super.update(dt);
        }
        draw(ctx) {
            super.draw(ctx);
            if (this.health < this.maxHealth) {
                const pct = this.health / this.maxHealth;
                ctx.fillStyle = '#330000'; ctx.fillRect(this.x, this.y - 8, this.w, 4);
                ctx.fillStyle = pct > 0.5 ? '#00ff00' : '#ff0000';
                ctx.fillRect(this.x, this.y - 8, this.w * pct, 4);
            }
        }
    }

    class Boss extends Entity {
        constructor(x, y) {
            super(x, y, 120, 120, COLORS.BOSS);
            this.maxHealth = 5000; this.health = 5000;
            this.speed = 40; this.damage = 25; this.attackTimer = 0;
        }
        update(dt) {
            const targets = [game.player, ...game.teammates];
            const myCenter = this.getCenter();
            let closest = null, minDist = Infinity;
            targets.forEach(t => {
                 const tCenter = t.getCenter();
                 const d = Math.sqrt((tCenter.x - myCenter.x)**2 + (tCenter.y - myCenter.y)**2);
                 if(d < minDist) { minDist = d; closest = t; }
            });
            if (closest && minDist > 5) {
                const tCenter = closest.getCenter();
                const dx = tCenter.x - myCenter.x;
                const dy = tCenter.y - myCenter.y;
                this.vx = (dx / minDist) * this.speed;
                this.vy = (dy / minDist) * this.speed;
            }
            if (closest && checkCollide(this, closest)) {
                if (Date.now() > this.attackTimer) {
                    game.player.health -= this.damage;
                    closest.flashTimer = 20;
                    this.attackTimer = Date.now() + 1500;
                }
            }
            super.update(dt);
        }
        draw(ctx) {
            super.draw(ctx);
            
            // --- DRAW BOSS NAME ---
            ctx.fillStyle = COLORS.BOSS;
            ctx.font = "bold 20px 'Courier New'"; 
            ctx.textAlign = "center";
            ctx.fillText("VIREX_CORE_V1.0", this.x + this.w/2, this.y - 30);

            // --- DRAW BOSS HEALTH BAR ---
            const barW = 120; // Width of health bar
            const barH = 10;  // Height of health bar
            const barX = this.x + (this.w - barW) / 2; // Center horizontally
            const barY = this.y - 20; // Position above boss

            // 1. Background (Dark Red)
            ctx.fillStyle = '#330000';
            ctx.fillRect(barX, barY, barW, barH);
            
            // 2. Health Foreground (Bright Red)
            const hpPct = Math.max(0, this.health / this.maxHealth);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(barX, barY, barW * hpPct, barH);
            
            // 3. Border
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);
        }
    }

    class Bullet {
        constructor(x, y, dx, dy) {
            this.x = x; this.y = y; this.vx = dx * 1000; this.vy = dy * 1000;
            this.w = 6; this.h = 6; this.life = 100; this.dead = false;
        }
        update(dt) {
            this.x += this.vx * dt; this.y += this.vy * dt; this.life--;
            if (this.x < 0 || this.x > WIDTH || this.y < 0 || this.y > HEIGHT || this.life <= 0) this.dead = true;
        }
        draw(ctx) { ctx.fillStyle = COLORS.BULLET; ctx.fillRect(this.x - 3, this.y - 3, 6, 6); }
    }

    class Powerup extends Entity {
        constructor(x, y, type) {
            super(x, y, 20, 20, COLORS.WHITE);
            this.type = type; this.pulse = 0;
        }
        update(dt) { this.pulse += dt * 10; }
        draw(ctx) {
            const glow = Math.abs(Math.sin(this.pulse)) * 5;
            if (this.type === 'health') {
                ctx.fillStyle = '#ff0055'; ctx.fillRect(this.x, this.y, 20, 20);
                ctx.fillStyle = '#ffffff'; ctx.fillText('+', this.x + 6, this.y + 14);
            } else {
                ctx.fillStyle = '#ffff00'; ctx.fillRect(this.x, this.y, 20, 20);
                ctx.fillStyle = '#000000'; ctx.font = "10px monospace"; ctx.fillText('RAM', this.x + 2, this.y + 14);
            }
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
            ctx.strokeRect(this.x - glow/2, this.y - glow/2, 20 + glow, 20 + glow);
        }
    }

    class Game {
        constructor() {
            this.player = new Player(WIDTH / 2, HEIGHT / 2);
            this.teammates = [
                new Teammate(WIDTH/2 - 60, HEIGHT/2 + 30, "Max", COLORS.TEAMMATE),
                new Teammate(WIDTH/2 + 60, HEIGHT/2 + 30, "Alex", COLORS.TEAMMATE)
            ];
            this.zombies = []; this.bullets = []; this.particles = []; this.powerups = [];
            this.boss = null;
            this.round = 1; this.maxRounds = 5;
            this.rounds = {
                1: { name: "INITIAL_INJECTION", killsNeeded: 10, spawnRate: 1.5, types: ["normal"] },
                2: { name: "DATA_CORRUPTION", killsNeeded: 25, spawnRate: 1.0, types: ["normal", "runner"] },
                3: { name: "FIREWALL_BREACH", killsNeeded: 40, spawnRate: 0.8, types: ["normal", "tank"] },
                4: { name: "SYSTEM_OVERLOAD", killsNeeded: 50, spawnRate: 0.6, types: ["runner", "spitter"] },
                5: { name: "ROOT_ACCESS_DENIED", killsNeeded: 9999, spawnRate: 1.5, types: ["normal", "runner"] }
            };
            this.killsThisRound = 0; this.spawnTimer = 0;
            this.gameState = "start"; this.messageTimer = 0; this.roundDelayTimer = 0; 
            this.finished = false;
        }

        startRound(roundNum) {
            this.round = roundNum; this.killsThisRound = 0;
            this.gameState = "playing";
            this.showMessage(`>> LOAD ROUND ${this.round}: ${this.rounds[this.round].name}`);
            if (this.round === 5) {
                this.boss = new Boss(WIDTH/2, -150);
                this.zombies.push(this.boss);
            }
        }
        showMessage(text) { this.message = text; this.messageTimer = 180; }

        spawnZombie() {
            const types = this.rounds[this.round].types;
            const type = randomChoice(types);
            let x, y;
            if (Math.random() < 0.5) { x = Math.random() < 0.5 ? -50 : WIDTH + 50; y = Math.random() * HEIGHT; } 
            else { x = Math.random() * WIDTH; y = Math.random() < 0.5 ? -50 : HEIGHT + 50; }
            this.zombies.push(new Zombie(x, y, type));
        }

        update(dt) {
            if (this.finished) return;
            if (this.gameState === "game_over" || this.gameState === "victory") return;
            if (this.gameState === "start") {
                if (keys['Space']) this.startRound(1);
                return;
            }
            if (this.gameState === "next_round") {
                this.roundDelayTimer -= dt;
                if (this.roundDelayTimer <= 0 && this.round < this.maxRounds) this.startRound(this.round + 1);
                return;
            }
            if (this.round === 5) {
                if (this.boss && this.boss.health <= 0) {
                    this.gameState = "victory";
                    setTimeout(() => cleanupAndFinish(true), 3000); 
                }
            } else {
                if (this.killsThisRound >= this.rounds[this.round].killsNeeded) {
                    this.gameState = "next_round"; this.roundDelayTimer = 3.0;
                    this.showMessage(">> SECTOR CLEARED. FLUSHING MEMORY...");
                    this.zombies = [];
                }
            }
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0 && this.zombies.length < 50) {
                this.spawnZombie();
                const baseRate = this.rounds[this.round].spawnRate;
                this.spawnTimer = randomRange(baseRate * 0.5, baseRate * 1.5); 
            }

            this.player.update(dt);
            this.teammates.forEach(t => t.update(dt));
            this.zombies.forEach(z => z.update(dt));
            this.bullets.forEach(b => b.update(dt));
            this.powerups.forEach(p => p.update(dt));
            this.particles.forEach(p => p.update());

            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const b = this.bullets[i];
                if (b.dead) { this.bullets.splice(i, 1); continue; }
                for (let j = this.zombies.length - 1; j >= 0; j--) {
                    const z = this.zombies[j];
                    if (z.x < b.x && z.x + z.w > b.x && z.y < b.y && z.y + z.h > b.y) {
                        const isBoss = (z === this.boss);
                        const damage = isBoss ? 25 : 35;
                        z.health -= damage; z.flashTimer = 5;
                        this.bullets.splice(i, 1);
                        for(let k=0; k<4; k++) game.particles.push(new Particle(b.x, b.y, COLORS.ENEMY_RUNNER));
                        if (z.health <= 0) {
                            const roll = Math.random();
                            if (roll < 0.10) this.powerups.push(new Powerup(z.x, z.y, 'health'));
                            else if (roll < 0.25) this.powerups.push(new Powerup(z.x, z.y, 'ammo'));
                            if (!isBoss) { this.killsThisRound++; this.zombies.splice(j, 1); } 
                            else { this.zombies.splice(j, 1); }
                        }
                        break; 
                    }
                }
            }

            for (let i = this.powerups.length - 1; i >= 0; i--) {
                const p = this.powerups[i];
                if (checkCollide(this.player, p)) {
                    if (p.type === 'health') this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
                    else if (p.type === 'ammo') this.player.bullets = Math.min(this.player.maxBullets, this.player.bullets + 50);
                    this.powerups.splice(i, 1);
                }
            }

            if (this.player.health <= 0) {
                this.gameState = "game_over";
                setTimeout(() => cleanupAndFinish(false), 3000); 
            }
            if (this.messageTimer > 0) this.messageTimer--;
        }

        draw() {
            ctx.fillStyle = COLORS.BG; ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.strokeStyle = COLORS.GRID; ctx.lineWidth = 1;
            const gridSize = 80;
            for (let x = 0; x < WIDTH; x += gridSize) { 
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke(); 
                if (x % (gridSize*2) === 0) { ctx.fillStyle = '#002200'; ctx.font = "10px 'Courier New'"; ctx.fillText(`0x${(x/10).toString(16)}`, x + 2, 12); }
            }
            for (let y = 0; y < HEIGHT; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke(); }

            this.powerups.forEach(p => p.draw(ctx));
            this.particles.forEach(p => p.draw(ctx));
            this.zombies.forEach(z => { if(z !== this.boss) z.draw(ctx); });
            if (this.boss && this.boss.health > 0) this.boss.draw(ctx);
            this.teammates.forEach(t => t.draw(ctx));
            this.player.draw(ctx);
            this.bullets.forEach(b => b.draw(ctx));
            this.drawUI();
            this.drawScanlines();

            if (this.gameState === "start") {
                this.drawStartScreen(); // New detailed start screen
            }
            else if (this.gameState === "next_round") this.drawOverlay(">> PROCESS COMPLETE", "LOADING NEXT SECTOR...", COLORS.TEXT);
            else if (this.gameState === "victory") this.drawOverlay(">> SYSTEM RESTORED", "MALWARE ERADICATED.", COLORS.TEXT);
            else if (this.gameState === "game_over") this.drawOverlay(">> CRITICAL FAILURE", "SIGNAL LOST.", COLORS.ENEMY_RUNNER);
        }

        drawStartScreen() {
            // Dark overlay
            ctx.fillStyle = "rgba(0,0,0,0.85)"; 
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            
            ctx.textAlign = "center"; 
            
            // Title
            ctx.fillStyle = COLORS.TEXT; 
            ctx.font = "bold 64px 'Courier New'";
            ctx.fillText(">> INITIALIZE PURGE PROTOCOL", WIDTH/2, HEIGHT/2 - 100);

            // Instructions Box
            const boxW = 500;
            const boxH = 200;
            const boxX = (WIDTH - boxW) / 2;
            const boxY = (HEIGHT - boxH) / 2 + 20;

            ctx.strokeStyle = COLORS.TEXT;
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxW, boxH);
            ctx.fillStyle = "rgba(0, 50, 0, 0.5)";
            ctx.fillRect(boxX, boxY, boxW, boxH);

            const instructions = [
                "WASD / ARROWS : Move",
                "MOUSE         : Aim & Shoot",
                "OBJECTIVE     : Survive 5 Rounds",
                "WARNING       : Boss at Round 5"
            ];

            ctx.font = "20px 'Courier New'";
            ctx.fillStyle = "#ccffcc";
            let textY = boxY + 50;
            
            instructions.forEach(line => {
                ctx.fillText(line, WIDTH/2, textY);
                textY += 35;
            });

            // Flashing Start Prompt
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.fillStyle = COLORS.BULLET; 
                ctx.font = "bold 28px 'Courier New'"; 
                ctx.fillText("PRESS [SPACE] TO EXECUTE", WIDTH/2, HEIGHT/2 + 200);
            }
        }

        drawScanlines() {
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            for (let y = 0; y < HEIGHT; y += 4) ctx.fillRect(0, y, WIDTH, 2);
            const grad = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, HEIGHT/2, WIDTH/2, HEIGHT/2, HEIGHT);
            grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,20,0,0.6)");
            ctx.fillStyle = grad; ctx.fillRect(0,0,WIDTH,HEIGHT);
        }

        drawUI() {
            const hudX = 30, hudY = 30, hudW = 350, hudH = 120;
            ctx.fillStyle = COLORS.UI_BG; ctx.strokeStyle = COLORS.UI_BORDER; ctx.lineWidth = 2;
            ctx.fillRect(hudX, hudY, hudW, hudH); ctx.strokeRect(hudX, hudY, hudW, hudH);
            ctx.font = "bold 20px 'Courier New'"; ctx.textAlign = "left"; ctx.fillStyle = COLORS.TEXT;
            ctx.fillText(`SECTOR: ${this.round} / ${this.maxRounds}`, hudX + 20, hudY + 40);
            const killsNeeded = this.rounds[this.round].killsNeeded;
            const remaining = killsNeeded - this.killsThisRound;
            if (this.round === 5) { ctx.fillStyle = COLORS.ENEMY_RUNNER; ctx.fillText(`TARGET: CORE_V1.0`, hudX + 20, hudY + 70); } 
            else { ctx.fillText(`THREATS: ${Math.max(0, remaining)}`, hudX + 20, hudY + 70); }
            ctx.textAlign = "center"; ctx.fillStyle = COLORS.TEXT; ctx.font = "bold 24px 'Courier New'";
            ctx.fillText(`BUFFER [AMMO]: ${this.player.bullets}`, WIDTH / 2, 50);

            const barX = WIDTH / 2 - 200, barY = 80, barW = 400, barH = 20;
            ctx.fillStyle = "#220000"; ctx.fillRect(barX, barY, barW, barH); 
            const hpPct = Math.max(0, this.player.health) / this.player.maxHealth;
            ctx.fillStyle = hpPct > 0.5 ? COLORS.TEXT : (hpPct > 0.25 ? '#ffff00' : '#ff0000');
            ctx.fillRect(barX, barY, barW * hpPct, barH); 
            ctx.strokeStyle = COLORS.TEXT; ctx.strokeRect(barX, barY, barW, barH); 
            ctx.font = "14px 'Courier New'"; ctx.fillStyle = COLORS.TEXT;
            ctx.fillText(`TEAM INTEGRITY: ${Math.floor(this.player.health)}%`, WIDTH / 2, barY + 15);
            
            if (this.round === 5 && this.boss) {
                const bossHpPct = Math.max(0, this.boss.health / this.boss.maxHealth);
                ctx.fillStyle = COLORS.ENEMY_RUNNER; ctx.fillText(">> CORE INTEGRITY <<", WIDTH - 150, 40);
                ctx.fillStyle = "#330000"; ctx.fillRect(WIDTH - 250, 50, 200, 15);
                ctx.fillStyle = COLORS.ENEMY_RUNNER; ctx.fillRect(WIDTH - 250, 50, 200 * bossHpPct, 15);
                ctx.strokeRect(WIDTH - 250, 50, 200, 15);
            }
            if (this.messageTimer > 0) {
                const mX = WIDTH/2 + randomRange(-2, 2);
                const mY = HEIGHT/2 - 100 + randomRange(-2, 2);
                ctx.fillStyle = COLORS.TEXT; ctx.font = "bold 32px 'Courier New'";
                ctx.textAlign = "center"; ctx.fillText(this.message, mX, mY);
            }
        }

        drawOverlay(title, sub, color) {
            ctx.fillStyle = "rgba(0,0,0,0.90)"; ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.textAlign = "center"; ctx.fillStyle = color; ctx.font = "bold 64px 'Courier New'";
            ctx.fillText(title, WIDTH/2 + randomRange(-2,2), HEIGHT/2 - 20);
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.fillStyle = COLORS.BULLET; ctx.font = "24px 'Courier New'"; ctx.fillText(sub, WIDTH/2, HEIGHT/2 + 50);
            }
        }
    }

    // --- INIT GAME INSTANCE ---
    let game = new Game();
    let lastTime = 0;

    function loop(timestamp) {
        // --- SAFETY CHECK: KILL IF CANVAS HIDDEN ---
        if (canvas.style.display === 'none' || canvas.classList.contains('hidden')) {
             game.finished = true;
             cancelAnimationFrame(animationFrameId);
             return;
        }

        if (!game || game.finished) return;
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        game.update(dt);
        game.draw();
        animationFrameId = requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    function cleanupAndFinish(success) {
        if (game.finished) return;
        game.finished = true;

        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseup', handleMouseUp);
        
        cancelAnimationFrame(animationFrameId);

        if (onComplete) onComplete(success);
    }
};