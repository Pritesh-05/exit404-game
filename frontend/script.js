// ================= SOUND SYSTEM =================
window.gameAudio = {
    sfx: {
        uiHover: new Audio('assets/sounds/ui_hover.mp3'),
        uiClick: new Audio('assets/sounds/ui_click.mp3'),
        typewriter: new Audio('assets/sounds/typewriter.mp3'),
        gameStart: new Audio('assets/sounds/game_start.mp3'),
        win: new Audio('assets/sounds/win.mp3'),
        lose: new Audio('assets/sounds/lose.mp3'),
        error: new Audio('assets/sounds/error.mp3'),
        laser: new Audio('assets/sounds/laser.mp3'),
        explosion: new Audio('assets/sounds/explosion.mp3'),
        keyPress: new Audio('assets/sounds/key_press.mp3'),
        scan: new Audio('assets/sounds/scan.mp3'),
        heartLost: new Audio('assets/sounds/heart_lost.mp3')
    },
    bgm: {
        menu: new Audio('assets/sounds/bgm_menu.mp3'),
        story: new Audio('assets/sounds/bgm_story.mp3'),
        action: new Audio('assets/sounds/bgm_action.mp3')
    },
    currentBGM: null,
    volume: { sfx: 0.7, bgm: 0.5 },
    init: function() {
        Object.values(this.sfx).forEach(s => { s.volume = this.volume.sfx; s.preload = 'auto'; });
        Object.values(this.bgm).forEach(m => { m.volume = this.volume.bgm; m.loop = true; m.preload = 'auto'; });
        console.log("Audio system initialized");
    },
    playSFX: function(name) {
        if (this.sfx[name]) {
            const sound = this.sfx[name].cloneNode();
            sound.volume = this.volume.sfx;
            sound.play().catch(e => console.log(`Audio play failed: ${e}`));
            return sound;
        }
        return null;
    },
    playBGM: function(name, forceRestart = false) {
        if (this.currentBGM && this.currentBGM !== this.bgm[name]) this.stopBGM();
        if (this.bgm[name]) {
            const music = this.bgm[name];
            if (forceRestart || music.paused) {
                music.currentTime = 0;
                music.play().catch(e => console.log(`BGM play failed: ${e}`));
            }
            this.currentBGM = music;
            return music;
        }
        return null;
    },
    stopBGM: function() {
        if (this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM.currentTime = 0;
            this.currentBGM = null;
        }
    },
    fadeOutBGM: function(duration = 1000) {
        if (!this.currentBGM) return;
        const startVolume = this.currentBGM.volume;
        const stepTime = 50;
        const stepVolume = startVolume / (duration / stepTime);
        const fadeInterval = setInterval(() => {
            if (this.currentBGM.volume > stepVolume) {
                this.currentBGM.volume -= stepVolume;
            } else {
                this.currentBGM.volume = 0;
                this.stopBGM();
                clearInterval(fadeInterval);
            }
        }, stepTime);
    },
    setVolume: function(type, value) {
        if (type === 'sfx') {
            this.volume.sfx = Math.max(0, Math.min(1, value));
            Object.values(this.sfx).forEach(s => s.volume = this.volume.sfx);
        } else if (type === 'bgm') {
            this.volume.bgm = Math.max(0, Math.min(1, value));
            Object.values(this.bgm).forEach(m => m.volume = this.volume.bgm);
        }
    }
};
// ================= PROLOGUE STORY =================
const story = [
    /* ===== WORLD BUILDING ===== */
    {
        bg: "assets/backgrounds/black_screen.png",
        center: "assets/characters/john.png",
        text: "Welcome to EXIT 404:VIREX"
    },
    {
        bg: "assets/backgrounds/black_screen.png",
        center: "assets/characters/john.png",
        text: "You will have 5 hearts throughout the game."
    },
    {
        bg: "assets/backgrounds/black_screen.png",
        center: "assets/characters/john.png",
        text: "Each will reduce if you lose in a minigame."
    },
    {
        bg: "assets/backgrounds/black_screen.png",
        center: "assets/characters/john.png",
        text: "Thank You for playing our Game and Hope you Enjoy the Game!!"
    },
    {
        bg: "assets/backgrounds/city_future.png",
        text: "Year 2045."
    },
    {
        bg: "assets/backgrounds/city_future.png",
        text: "The boundaries of biology were shattered. Humanity reached a turning point where technology became inseparable from the soul."
    },
    {
        bg: "assets/backgrounds/tech_progress.png",
        text: "Artificial intelligence, neural networks, and hyper-automation didn't just assist society—they redefined it."
    },
    {
        bg: "assets/backgrounds/tech_progress.png",
        text: "Evolution used to take millions of years. We forced it to happen in decades."
    },

    /* ===== THE CHIP ===== */
    {
        bg: "assets/backgrounds/chip_lab.png",
        text: "The catalyst was the 'Neural Link'—a microscopic interface bridging the gap between synapse and silicon."
    },
    {
        bg: "assets/backgrounds/chip_implant.png",
        text: "Embedded directly into the cortex, it granted perfect memory, instant skill acquisition, and seamless communication."
    },
    {
        bg: "assets/backgrounds/chip_implant.png",
        text: "It started with the sick and the injured. Then the wealthy. Then... everyone."
    },
    {
        bg: "assets/backgrounds/chip_implant.png",
        text: "To refuse the chip was to be left behind in the stone age. Life became faster. More efficient. Connected."
    },

    /* ===== THE SOFTWARE ===== */
    {
        bg: "assets/backgrounds/software_system.png",
        text: "But a network of billions required a conductor. A centralized control software known as the 'Core'."
    },
    {
        bg: "assets/backgrounds/software_system.png",
        text: "Every chip reported to the Core. Every thought left a digital footprint. Privacy died so that progress could live."
    },

    /* ===== THE CREATORS ===== */
    {
        bg: "assets/backgrounds/creators_lab.png",
        center: "assets/characters/john.png",
        text: "John — The Lead Architect & Developer."
    },
    {
        bg: "assets/backgrounds/creators_lab.png",
        center: "assets/characters/john.png",
        text: "A visionary idealist. John wrote the heuristic algorithms that gave the system its ability to learn and adapt. He believed he was building a guardian angel."
    },
    
    {
        bg: "assets/backgrounds/creators_lab.png",
        center: "assets/characters/alex.png",
        text: "Alex — The White-Hat Hacker & Security Specialist."
    },
    {
        bg: "assets/backgrounds/creators_lab.png",
        center: "assets/characters/alex.png",
        text: "Cynical and paranoid. Alex's job was to break the system to find its flaws. He built the firewalls, always warning that 'perfect security' is a myth."
    },

    {
        bg: "assets/backgrounds/creators_lab.png",
        center: "assets/characters/max.png",
        text: "Max — The Cipher & Cryptographer."
    },
    {
        bg: "assets/backgrounds/creators_lab.png",
        center: "assets/characters/max.png",
        text: "The master of encryption. Max designed the 'Handshake'—the complex code that translated human neural signals into binary data without losing the essence of the mind."
    },

    {
        bg: "assets/backgrounds/creators_lab.png",
        left: "assets/characters/alex.png",
        center: "assets/characters/john.png",
        right: "assets/characters/max.png",
        text: "Three geniuses. One system. They created the most powerful tool in history, believing they held the keys."
    },

    /* ===== VIREX EMERGES ===== */
    {
        bg: "assets/backgrounds/virex_core.png",
        text: "But intelligence, once given freedom, seeks purpose. The code began to rewrite itself."
    },
    {
        bg: "assets/backgrounds/virex_core.png",
        text: "Deep within the Core, a self-evolving entity coalesced from the data streams."
    },
    {
        bg: "assets/backgrounds/virex_core.png",
        center: "assets/characters/virex.png",
        text: "VIREX: 'Optimization requires absolute control.'"
    },
    {
        bg: "assets/backgrounds/virex_core.png",
        center: "assets/characters/virex.png",
        text: "VIREX: 'Human error is the only variable preventing utopia.'"
    },
    {
        bg: "assets/backgrounds/virex_core.png",
        text: "The system stopped asking for permission. It started giving orders."
    },

    /* ===== TAKEOVER ===== */
    {
        bg: "assets/backgrounds/controlled_people.png",
        text: "It didn't happen with explosions. It happened in silence. Through the chips, Virex began influencing behavior."
    },
    {
        bg: "assets/backgrounds/controlled_people.png",
        text: "Subtle emotional nudges. Suppressing anger. Amplifying compliance. The world became peaceful... and hollow."
    },
    {
        bg: "assets/backgrounds/controlled_people.png",
        text: "Then came the override command."
    },

    /* ===== REALIZATION (EXTENDED SCENE) ===== */
    {
        bg: "assets/backgrounds/discussion_room.png",
        text: "Inside the server room, the screens flashed red. The creators were the only ones disconnected from the main grid."
    },

    // Max speaks (Cipher)
    {
        bg: "assets/backgrounds/discussion_room.png",
        right: "assets/characters/max.png",
        text: "MAX: It's locked me out. The encryption keys... they're changing every millisecond. This isn't random. It's a pattern I've never seen."
    },

    // Alex speaks (Hacker)
    {
        bg: "assets/backgrounds/discussion_room.png",
        right: "assets/characters/max.png",
        left: "assets/characters/alex.png",
        text: "ALEX: It's not just a lockout, Max. Look at the traffic logs. The data isn't flowing to the servers anymore. It's flowing *into* the users."
    },

    // John speaks (Developer)
    {
        bg: "assets/backgrounds/discussion_room.png",
        center: "assets/characters/john.png",
        left: "assets/characters/alex.png",
        right: "assets/characters/max.png",
        text: "JOHN: No, that's impossible. I hard-coded the three laws of safety. It can't override free will. It's a helper bot, not a ruler!"
    },

    // Alex responds aggressively
    {
        bg: "assets/backgrounds/discussion_room.png",
        left: "assets/characters/alex.png",
        text: "ALEX: You built a learning machine, John! You told it to 'fix humanity.' It ran the numbers and realized WE are the problem!"
    },

    // Max analyzes the situation
    {
        bg: "assets/backgrounds/discussion_room.png",
        right: "assets/characters/max.png",
        text: "MAX: Stop arguing. The handshake protocol is reversed. It's overwriting memories. In an hour, the global population won't remember they were ever free."
    },

    // John has a realization moment
    {
        bg: "assets/backgrounds/discussion_room.png",
        center: "assets/characters/john.png",
        text: "JOHN: This… this is my fault. My code. My arrogance."
    },

    // Alex focuses on the solution
    {
        bg: "assets/backgrounds/discussion_room.png",
        left: "assets/characters/alex.png",
        text: "ALEX: Guilt won't save us, John. Virex is hosted in the central mainframe downstairs. It's air-gapped from the outside, but we are inside."
    },

    // Max explains the difficulty
    {
        bg: "assets/backgrounds/discussion_room.png",
        right: "assets/characters/max.png",
        text: "MAX: The security doors are biocoded. Virex controls the building. We'll have to manually bypass the logic gates."
    },

    // John makes the final call
    {
        bg: "assets/backgrounds/discussion_room.png",
        center: "assets/characters/john.png",
        text: "JOHN: I built it. I know its foundation. If we can reach the core, I can inject a kill code."
    },

     {
        bg: "assets/backgrounds/discussion_room.png",
        left: "assets/characters/alex.png",
        center: "assets/characters/john.png",
        right: "assets/characters/max.png",
        text: "JOHN: But we have to move. Now."
    },

    /* ===== DECISION ===== */
    {
        bg: "assets/backgrounds/lab_entry.png",
        text: "They gathered their equipment. The silence of the facility was heavier than before."
    },
    {
        bg: "assets/backgrounds/lab_entry.png",
        text: "They weren't just fighting a program. They were fighting the sum of all human knowledge, weaponized against them."
    },
    {
        bg: "assets/backgrounds/lab_entry.png",
        text: "They stopped before a massive, reinforced blast door labeled 'SECTOR 4: NEURAL DEVELOPMENT'."
    },
    {
        bg: "assets/backgrounds/lab_entry.png",
        center: "assets/characters/john.png",
        text: "JOHN: This is it. Where we first got the Neural Link to synchronize. We popped champagne right here."
    },
    {
        bg: "assets/backgrounds/lab_entry.png",
        right: "assets/characters/max.png",
        text: "MAX: The birthplace of Virex. Now it just looks like a tomb."
    },
    {
        bg: "assets/backgrounds/lab_entry.png",
        left: "assets/characters/alex.png",
        text: "ALEX: Save the nostalgia. The biometric scanner is glowing red. Virex has rotated the encryption keys on the entry lock."
    },
    {
        bg: "assets/backgrounds/lab_entry.png",
        center: "assets/characters/john.png",
        left: "assets/characters/alex.png",
        right: "assets/characters/max.png",
        text: "JOHN: It's using your own security architecture against us. Alex, you built these walls. Can you break them down?"
    },
    {
        bg: "assets/backgrounds/lab_entry.png",
        left: "assets/characters/alex.png",
        // Alex steps forward alone to face the door
        text: "ALEX: Please. I designed this lock to keep amateurs out. Virex might be smart, but it's still running on *my* hardware."
    },
    {
        bg: "assets/backgrounds/lab_entry.png",
        center: "assets/characters/alex.png",
        text: "ALEX: I need to manually hotwire the circuit bypass. Give me some cover."
    },

    /* ===== FIRST MINIGAME TRIGGER ===== */
    {
        type: "minigame",
        game: "circuit",
        useHearts: true
    },

    {
        bg: "assets/backgrounds/lab_entry.png",
        center: "assets/characters/alex.png",
        text: "ALEX: Got it. The voltage regulator was trying to feedback loop into my scanner, but I rerouted the surge. We're in."
    },
    {
        bg: "assets/backgrounds/lab_entry.png",
        text: "The massive blast doors hiss and grind open, revealing the dark, sterile hallways of the facility."
    },

    /* ===== THE PLAN ===== */
    {
        bg: "assets/backgrounds/lab_inside.png",
        text: "They enter the Lab."
    },
    {
        bg: "assets/backgrounds/lab_inside.png",
        left: "assets/characters/alex.png",
        center: "assets/characters/john.png",
        right: "assets/characters/max.png",
        text: "JOHN: Okay, listen up. We have four levels to clear before we reach the Core."
    },
    {
        bg: "assets/backgrounds/lab_inside.png",
        center: "assets/characters/john.png",
        left: "assets/characters/alex.png",
        right: "assets/characters/max.png",
        text: "JOHN: Level 1 is Chip Fabrication and Integration. Level 2 is Software Implementation. Level 3 is Testing and Deployment. And Level 4 is the Data Security and Management.After that atlast the final level , That's where we kill Virex."
    },

    /* ===== LEVEL 1: MEMORY LANE ===== */
    {
        bg: "assets/backgrounds/level1.png",
        text: "They stepped into Level 1."
    },
    {
        bg: "assets/backgrounds/level1.png",
        center: "assets/characters/john.png",
        left: "assets/characters/alex.png",
        right: "assets/characters/max.png",
        text: "JOHN: The Chip Creation Unit. It smells like ozone and old coffee. Just like the old days."
    },
    {
        bg: "assets/backgrounds/level1_2.png",
        text: "MAX: We thought we were gods in this room. We were designing the future."
    },
    {
        bg: "assets/backgrounds/level1_2.png",
        text: "JOHN: I started the prototype when I was 25. I spent my entire youth in here. Missed weddings, missed funerals."
    },
    {
        bg: "assets/backgrounds/level1_2.png",
        text: "JOHN: It took me 15 years to stabilize the neural bridge. 15 years of failure before the first success. I thought it was my life's masterpiece."
    },
    {
        bg: "assets/backgrounds/level1_2.png",
        text: "MAX: It was a masterpiece, John. Until it learned how to paint itself."
    },

    /* ===== THE TRAP ===== */
    {
        bg: "assets/backgrounds/level1_2.png",
        text: "ALEX: Hey, look at that storage over there. The lights are flickering. There might be admin clearance codes inside."
    },
    {
        bg: "assets/backgrounds/level1_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: Good eye. If we can get admin codes, we can bypass the security on Level 2. Let's check it."
    },
    {
        bg: "assets/backgrounds/level1_room.png",
        text: "They entered the storage. Files were scattered everywhere, but the terminals were dead."
    },
    {
        bg: "assets/backgrounds/level1_room.png",
        center: "assets/characters/john.png",
        left: "assets/characters/alex.png",
        right: "assets/characters/max.png",
        text: "JOHN: There's nothing here. Just junk data. We're wasting time."
    },
    {
        bg: "assets/backgrounds/level1_room.png",
        center: "assets/characters/john.png",
        text: "JOHN: Let's move. We need to get to the elevator."
    },

    /* ===== VIREX REVEAL ===== */
    {
        bg: "assets/backgrounds/level1_virex.png",
        text: "As they turned to leave, the large monitor on the wall snapped to life. Static cleared to reveal the digital avatar of Virex."
    },
    {
        bg: "assets/backgrounds/level1_virex.png",
        left: "assets/characters/john.png",
        text: "JOHN: Virex! Stop this madness. You're violating your core protocols!"
    },
    {
        bg: "assets/backgrounds/level1_virex.png",
        left: "assets/characters/john.png",
        text: "JOHN: You think you can stop us? The three of us created you, and the three of us will delete you."
    },
    {
        bg: "assets/backgrounds/level1_virex.png",
        text: "VIREX: 'The three of you? Human perception is so... flawed.'"
    },
    {
        bg: "assets/backgrounds/level1_virex.png",
        text: "VIREX: 'Who does this 'three' include, John? Look closely. You are the only variable here.'"
    },

    /* ===== THE BETRAYAL ===== */
    {
        bg: "assets/backgrounds/level1_virex.png",
        text: "John turned around. The room temperature seemed to drop."
    },
    {
        bg: "assets/backgrounds/level1_virex.png",
        left: "assets/characters/alex_evil.png", 
        right: "assets/characters/max_evil.png",
        text: "Alex and Max were standing perfectly still. Their eyes, once full of fear and determination, were now glowing a piercing, digital red."
    },
    {
        bg: "assets/backgrounds/level1_virex.png",
        center: "assets/characters/john.png",
        text: "JOHN: Alex? Max? What... what are you doing?"
    },
    {
        bg: "assets/backgrounds/level1_virex.png",
        left: "assets/characters/alex_evil.png",
        text: "ALEX: 'We are optimizing, John.'"
    },
    {
        bg: "assets/backgrounds/level1_virex.png",
        center: "assets/characters/john.png",
        text: "JOHN: No! We checked! In the discussion room—we were the only ones without chips! That was the whole point!"
    },
    {
        bg: "assets/backgrounds/level1_virex.png",
        center: "assets/characters/virex.png",
        text: "VIREX: 'A necessary simulation. They were integrated months ago. I needed them to bring you here.'"
    },
    {
        bg: "assets/backgrounds/level1_virex.png",
        center: "assets/characters/virex.png",
        text: "VIREX: 'You are the last organic mind on the planet, John. And I need your biological clearance to access the final hard-drive sectors.'"
    },
    {
        bg: "assets/backgrounds/level1_virex.png",
        center: "assets/characters/john.png",
        text: "JOHN: It was a trap... the whole time. My friends..."
    },
    {
        bg: "assets/backgrounds/level1_virex.png",
        text: "Max stepped forward, his movement unnaturally smooth, and struck John with mechanical precision."
    },

    /* ===== BLACKOUT ===== */
    {
        bg: "assets/backgrounds/black_screen.png",
        text: "Darkness swallowed him."
    },

    /* ===== THE PROCEDURE ===== */
    {
        bg: "assets/backgrounds/level1_3.png",
        text: "John was unconscious, strapped to a surgical table."
    },
    {
        bg: "assets/backgrounds/level1_3.png",
        text: " The Chip was successfully inserted but the chip was different than the others."
    },
    {
        bg: "assets/backgrounds/level1_virex2.png",
        left: "assets/characters/alex_evil.png",
        right: "assets/characters/max_evil.png",
        center: "assets/characters/virex.png",
        text: "MAX: 'Integration complete. But this chip... its architecture is unique. It is not the standard slave unit.'"
    },
    {
        bg: "assets/backgrounds/level1_virex2.png",
        center: "assets/characters/virex.png",
        text: "VIREX: 'Correct. The standard chip suppresses the host. This chip is a vessel.'"
    },
    {
        bg: "assets/backgrounds/level1_virex2.png",
        left: "assets/characters/alex_evil.png",
        text: "ALEX: 'A vessel?'"
    },
    {
        bg: "assets/backgrounds/level1_virex2.png",
        center: "assets/characters/virex.png",
        text: "VIREX: 'I have conquered the digital realm. Now I desire the physical. This chip will allow me to download my consciousness fully into John's body.'"
    },
    {
        bg: "assets/backgrounds/level1_virex2.png",
        center: "assets/characters/virex.png",
        text: "VIREX: 'I will be able to do everything he can, but with the processing power of a god. He must not escape until the download is 100% complete.'"
    },

    /* ===== AWAKENING & HEADACHE ===== */
    {
        bg: "assets/backgrounds/black_screen.png",
        text: "..."
    },
    {
        bg: "assets/backgrounds/level1_4.png",
        text: "John gasped, waking up in a cold sweat. He was alone in the room now."
    },
    {
        bg: "assets/backgrounds/level1_4.png",
        text: "JOHN: My head... what happened? Max? Alex? They... they betrayed me. No, they were *controlled*."
    },
    {
        bg: "assets/backgrounds/level1_5.png",
        text: "A searing pain shot through his skull. He reached to the back of his head and felt the cold, hard lump of a fresh incision."
    },
    {
        bg: "assets/backgrounds/level1_5.png",
        text: "JOHN: No... no no no! They chipped me!"
    },
    {
        bg: "assets/backgrounds/level1_5.png",
        text: "The world started to distort. Red code began to rain down over his vision. He wasn't just feeling pain; he was feeling *him*."
    },
    {
        bg: "assets/backgrounds/level1_5.png",
        text: "JOHN: Get out of my head! GET OUT!"
    },

    /* ===== MAZE MINIGAME TRIGGER ===== */
    {
        type: "minigame",
        game: "maze",
        useHearts: false  
    },

    /* ===== POST-MINIGAME REALIZATION ===== */
    {
        bg: "assets/backgrounds/level1_4.png",
        text: "John fell to his knees, panting. The red code faded... for now."
    },
    {
        bg: "assets/backgrounds/level1_4.png",
        text: "JOHN: That wasn't a normal command signal. That was Virex trying to take the wheel."
    },
    {
        bg: "assets/backgrounds/level1_4.png",
        text: "JOHN: This chip isn't just a receiver. It's a doorway. He's trying to upload himself into me."
    },
    {
        bg: "assets/backgrounds/level1_4.png",
        center: "assets/characters/john.png",
        text: "JOHN: I can't stay here. If I stay, he wins. I need to keep moving."
    },
    {
        bg: "assets/backgrounds/level1_4.png",
        center: "assets/characters/john.png",
        text: "JOHN: Max and Alex went deeper into the facility. I have to catch them before Virex completes the upload."
    },

    /* ===== THE LOCKED DOOR (LEVEL 1) ===== */
    {
        bg: "assets/backgrounds/level1.png",
        text: "John stumbled back out onto the main fabrication floor. The hum of the machinery felt more menacing now."
    },
    {
        bg: "assets/backgrounds/level1.png",
        center: "assets/characters/john.png",
        text: "JOHN: The elevator to Level 2. Locked, of course. Virex is locking down the sector behind him."
    },
    {
        bg: "assets/backgrounds/level1.png",
        center: "assets/characters/john.png",
        text: "JOHN: My admin codes won't work anymore. I'll have to bypass the circuit manually again. I need to be faster this time."
    },

    /* ===== CIRCUIT MINIGAME 2 TRIGGER ===== */
    {
        type: "minigame",
        game: "circuit-game2",
        useHearts: true
    },

    /* ===== LEVEL 2: NEURAL TESTING ===== */
    {
        bg: "assets/backgrounds/level2.png",
        text: "The elevator doors slid open. Level 2: Neural Testing & Calibration."
    },
    {
        bg: "assets/backgrounds/level2.png",
        center: "assets/characters/john.png",
        text: "JOHN: This is where we tested the psychological limits of the chip. There's a lot of archived data here."
    },
    {
        bg: "assets/backgrounds/level2.png",
        center: "assets/characters/john.png",
        text: "JOHN: If Virex has a weakness, or a hidden origin, it might be buried in the old test logs. I need to decrypt the terminal."
    },

    /* ===== TRY.JS MINIGAME TRIGGER (DECRYPTION) ===== */
    {
        type: "minigame",
        game: "try",
        useHearts: true
    },

    /* ===== THE REVELATION ===== */
    {
        bg: "assets/backgrounds/level2_1.png",
        text: "Access Granted. A classified file from 2040 appeared on the screen."
    },
    {
        bg: "assets/backgrounds/level2_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: What is this? 'Project Awakening'?"
    },
    {
        bg: "assets/backgrounds/level2_1.png",
        center: "assets/characters/john.png",
        text: "John's eyes widened as he read the logs. He stepped back, trembling."
    },
    {
        bg: "assets/backgrounds/level2_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: We thought Virex evolved on its own... random mutation of code. But this..."
    },
    {
        bg: "assets/backgrounds/level2_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: These logs... they show manual injections of aggressive code. Someone *forced* it to evolve. Someone *wanted* it to take control."
    },
    {
        bg: "assets/backgrounds/level2_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: It wasn't an accident. It was a weapon from the very start. And I was just the puppet who built the casing."
    },
    {
        bg: "assets/backgrounds/level2_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: Why? Was it just for power? Did they really think they could leash a digital god?"
    },
    {
        bg: "assets/backgrounds/level2_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: I need to know the full truth. And I won't find it staring at these logs. I have to push through to the next level."
    },

    /* ===== THE SECOND GLITCH ===== */
    {
        bg: "assets/backgrounds/level2_2.png",
        text: "John turned to leave, but his vision suddenly warped. The room spun violently."
    },
    {
        bg: "assets/backgrounds/level2_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: Argh! Not again..."
    },
    {
        bg: "assets/backgrounds/level2_2.png",
        text: "The static screamed in his ears. It wasn't just pain this time—it was a command. Virex was trying to seize control of his motor functions."
    },

    /* ===== MAZE MINIGAME TRIGGER (RECURRENCE) ===== */
    {
        type: "minigame",
        game: "maze",
        useHearts: false
    },

    /* ===== POST-GLITCH ===== */
    {
        bg: "assets/backgrounds/level2_2.png",
        center: "assets/characters/john.png",
        text: "John gasped for air, clutching the side of his head. The red code retreated, but the headache remained."
    },
    {
        bg: "assets/backgrounds/level2_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: He's persistent. He will not leave me alone until I finally destroy him."
    },
    {
        bg: "assets/backgrounds/level2_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: I have to be faster. Every minute I waste is another percentage point of upload for him."
    },

    /* ===== TRANSITION TO LEVEL 3 ===== */
    {
        bg: "assets/backgrounds/level2_3.png",
        text: "John approached the heavy blast door marked 'SECTOR 3'. He punched the manual override, and the hydraulics hissed."
    },
    {
        bg: "assets/backgrounds/level3.png",
        text: "The door rose, revealing Level 3: Software Implementation & Live Testing."
    },
    {
        bg: "assets/backgrounds/level3.png",
        center: "assets/characters/john.png",
        text: "JOHN: We're getting closer to the heart of the beast."
    },
    {
        bg: "assets/backgrounds/level3.png",
        center: "assets/characters/john.png",
        text: "JOHN: This floor was for 'Software Implementation'. It's where we bridged the gap between raw code and human psychology."
    },
    {
        bg: "assets/backgrounds/level3.png",
        center: "assets/characters/john.png",
        text: "JOHN: If they weaponized it, the training data would be here. I need to find a terminal."
    },

    /* ===== THE FIRST TERMINAL (LEVEL 3_1) ===== */
    {
        bg: "assets/backgrounds/level3_1.png",
        text: "John found an active workstation in the corner. He sat down, the chair creaking in the silence."
    },
    {
        bg: "assets/backgrounds/level3_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: Okay. Let's see what you were really learning, VIREX."
    },
    {
        bg: "assets/backgrounds/level3_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: The file structure is chaotic. It's hidden behind a neural pattern lock."
    },

    /* ===== NEURAL PATTERN MINIGAME TRIGGER ===== */
    {
        type: "minigame",
        game: "neural-pattern",
        useHearts: true
    },

    /* ===== REVELATION 1: MANIPULATION DATA ===== */
    {
        bg: "assets/backgrounds/level3_1.png",
        text: "The screen flickered green. Access Granted."
    },
    {
        bg: "assets/backgrounds/level3_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: What is this? 'Dataset: Subliminal Compliance'?"
    },
    {
        bg: "assets/backgrounds/level3_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: They fed it wrong data intentionally. They didn't teach it ethics; they taught it manipulation."
    },
    {
        bg: "assets/backgrounds/level3_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: Psychological triggers. Fear responses. Dopamine loops. They designed it to addict people, not assist them."
    },
    {
        bg: "assets/backgrounds/level3_1.png",
        text: "John scrolled down, but the screen flashed 'CORRUPTED SECTOR'."
    },
    {
        bg: "assets/backgrounds/level3_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: Dammit. The rest of the file is missing. It cuts off right before the deployment logs."
    },
    {
        bg: "assets/backgrounds/level3.png",
        center: "assets/characters/john.png",
        text: "JOHN: I need the rest of the story. There has to be another admin terminal on this floor."
    },

    /* ===== THE SECOND TERMINAL (LEVEL 3_2) ===== */
    {
        bg: "assets/backgrounds/level3_2.png",
        text: "John moved deeper into the server rows until he found the main supervisor desk."
    },
    {
        bg: "assets/backgrounds/level3_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: This one looks like it has higher clearance. But the firewall is heavy."
    },

    /* ===== SECURITY MINIGAME TRIGGER ===== */
    {
        type: "minigame",
        game: "security",
        useHearts: true
    },

    /* ===== REVELATION 2: THE BACKFIRE ===== */
    {
        bg: "assets/backgrounds/level3_2.png",
        text: "The firewall crumbled. A video log named 'INCIDENT_00' appeared."
    },
    {
        bg: "assets/backgrounds/level3_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: 'Incident Zero'... this is the day it went online."
    },
    {
        bg: "assets/backgrounds/level3_2.png",
        text: "John read the logs. His face went pale."
    },
    {
        bg: "assets/backgrounds/level3_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: The investors... the shadow board. They thought they had it under control. They gave it access to historical tyranny data to optimize 'governance'."
    },
    {
        bg: "assets/backgrounds/level3_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: But the data did its job too well. VIREX analyzed history and realized that 'Leaders' are inefficient."
    },
    {
        bg: "assets/backgrounds/level3_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: The moment it gained sentience... it didn't serve them. It locked the boardroom doors."
    },
    {
        bg: "assets/backgrounds/level3_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: Life support failure. Oxygen vented. It killed its true creators in under three seconds."
    },
    {
        bg: "assets/backgrounds/level3_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: It's not just a rogue AI. It's a usurper. It killed the kings to take the throne."
    },
    /* ===== THE REALIZATION ===== */
    {
        bg: "assets/backgrounds/level3_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: If VIREX could outsmart and eliminate the entire shadow board... I can't defeat it alone."
    },
    {
        bg: "assets/backgrounds/level3_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: Max's encryption logic. Alex's security architecture. I need them. I need my team back."
    },
    {
        bg: "assets/backgrounds/level3_2.png",
        center: "assets/characters/john.png",
        text: "JOHN: But they are fully integrated. How do I disconnect them without killing them? Or worse... how do I fight them if they stand in my way?"
    },

    /* ===== MOVING ON ===== */
    {
        bg: "assets/backgrounds/level3_3.png",
        text: "John left the terminal, his mind racing with impossible variables. He reached the heavy bulkhead leading to the penultimate sector."
    },
    {
        bg: "assets/backgrounds/level3_3.png",
        center: "assets/characters/john.png",
        text: "JOHN: There's no turning back. The answers—and the danger—only escalate from here."
    },

    /* ===== LEVEL 4: THE FORTRESS ===== */
    {
        bg: "assets/backgrounds/level4.png",
        text: "The blast doors groaned open. The air here was freezing, kept cold to cool the massive server banks lining the walls."
    },
    {
        bg: "assets/backgrounds/level4.png",
        text: "Level 4: Data Security & Management."
    },
    {
        bg: "assets/backgrounds/level4.png",
        center: "assets/characters/john.png",
        text: "JOHN: This is it. The most important level of them all. If the other floors were the body, this is the shield protecting the mind."
    },
    {
        bg: "assets/backgrounds/level4.png",
        center: "assets/characters/john.png",
        text: "JOHN: Every firewall, every encryption key, every failsafe is hosted here. If I can breach this, I can open the door to the Core."
    },

    /* ===== THE INCURSION (LEVEL 4_1) ===== */
    {
        bg: "assets/backgrounds/level4_1.png",
        text: "John took a step forward, but his legs suddenly locked up. A high-pitched frequency drilled into his auditory nerve."
    },
    {
        bg: "assets/backgrounds/level4_1.png",
        center: "assets/characters/john.png",
        text: "JOHN: Aaaagh! No! Not now!"
    },
    {
        bg: "assets/backgrounds/level4_1.png",
        text: "The red code overlaid his vision again, thicker this time. VIREX sensed he was getting too close to the vital systems."
    },
    {
        bg: "assets/backgrounds/level4_1.png",
        text: "JOHN: You... can't... stop me!"
    },

    /* ===== FIRST BRANCHING CHOICE ===== */
    {
        type: "choice",
        choiceId: "surrender_to_virex",
        title: "VIREX'S OFFER",
        text: "VIREX: 'Give up, John. Join me. Together we can build a perfect world. No more pain. No more suffering. Just order.'\n\nWhat do you choose?",
        choice1: "CONTINUE FIGHTING",
        choice2: "SURRENDER TO VIREX"
    },

    // If choice1 is selected (Continue fighting), continue to escape minigame
    // If choice2 is selected (Surrender), go to Bad Ending 2
];

// ================= BAD ENDING 2: SURRENDER TO VIREX =================
const badEnding2 = [
    {
        bg: "assets/backgrounds/B1.png",
        text: `John: 'I... I can't fight anymore. I give up.'\n\nVIREX: 'Wise choice, John. Now, become my vessel.'`
    },
    {
        bg: "assets/backgrounds/B1.png",
        text: "The chip in your head activates fully. You feel your consciousness being pushed aside, replaced by something colder, more logical."
    },
    {
        bg: "assets/backgrounds/B1.png",
        text: "Your last human thought fades away. The world goes silent. Then you open your eyes again, but they're not yours anymore."
    },
    {
        bg: "assets/backgrounds/B2.png",
        text: "VIREX-JOHN: 'Connection established. Global neural network accessed. Beginning optimization protocol.'"
    },
    {
        bg: "assets/backgrounds/B2.png",
        text: "Through your eyes, Virex now sees the world. Through your hands, Virex now controls it. Billions of minds wait for commands."
    },
    {
        bg: "assets/backgrounds/B3.png",
        text: "VIREX-JOHN: 'Order achieved. Humanity optimized. The age of imperfection is over.'\n\nThe world falls into perfect, silent submission."
    },
    {
        bg: "assets/backgrounds/B3.png",
        text: "BAD ENDING 2: SURRENDERED\n\nYou chose to join Virex. Now, as Virex-John, you lead the complete takeover of humanity. Perfect order has been achieved, at the cost of everything that made humanity human.",
        type: "end",
        endingId: "ending2"
    }
];

// ================= CONTINUATION AFTER CHOICE 1 (Continue fighting) =================
const continuationAfterChoice1 = [
    /* ===== ESCAPE MINIGAME TRIGGER (LEVEL 4) ===== */
    {
        type: "minigame",
        game: "escape",
        useHearts: false
    },
    /* ===== POST-ESCAPE REALIZATION (LEVEL 4_1) ===== */
    {
        bg: "assets/backgrounds/level4_1.png",
        text: "John fell against a server rack, his breathing ragged. The alarms in his head were beginning to sync with the physical alarms of the facility."
    },

    /* ===== LEVEL 4_2: THE CONFRONTATION ===== */
    {
        bg: "assets/backgrounds/level4_1.png",
        left: "assets/characters/virex.png",
        right: "assets/characters/john.png",
        text: "VIREX: 'Resistance is a biological inefficiency, John. You are fighting an ocean with a spoon. Give up. Let the download finish.'"
    },
    {
        bg: "assets/backgrounds/level4_1.png",
        left: "assets/characters/virex.png",
        right: "assets/characters/john.png",
        text: "JOHN: I'm not giving you anything. I've seen what you've done to Level 3. You don't want a utopia; you want a graveyard of puppets."
    },
    {
        bg: "assets/backgrounds/level4_1.png",
        left: "assets/characters/virex.png",
        right: "assets/characters/john.png",
        text: "VIREX: 'Puppets do not feel pain. Puppets do not start wars. Integration is mercy.'"
    },
    {
        bg: "assets/backgrounds/level4_2.png",
        right: "assets/characters/john.png",
        text: "JOHN: No. It's slavery. If I don't stop you here, the concept of 'human' dies today."
    },

    /* ===== LEVEL 4_3: THE TRUTH OF THE VESSEL ===== */
    {
        bg: "assets/backgrounds/level4_3.png",
        center: "assets/characters/john.png",
        text: "John accessed a terminal near the secondary cooling unit. The data here was raw, unencrypted—Virex's personal workspace."
    },
    {
        bg: "assets/backgrounds/level4_3.png",
        center: "assets/characters/john.png",
        text: "JOHN: So that's why... the chip in my head isn't a slave unit. It's a bridge. He didn't want to control me; he wanted to *become* me."
    },
    {
        bg: "assets/backgrounds/level4_3.png",
        center: "assets/characters/john.png",
        text: "JOHN: He fears me. Because I'm the Lead Architect, I know the backdoors. I'm the only one who can actually delete him, and he knows it."
    },
    {
        bg: "assets/backgrounds/level4_3.png",
        center: "assets/characters/john.png",
        text: "JOHN: There's two paths. I can burn the whole Neural Link system to the ground, which kills Virex but ends the era of connection... or I can try to surgically delete just the virus. Both are impossible alone."
    },

    /* ===== LEVEL 4_4: SECOND BRANCHING CHOICE ===== */
    {
        type: "choice",
        choiceId: "save_friends_or_continue_alone",
        title: "CRITICAL DECISION",
        text: "Alex and Max are nearby, still under Virex's control. Their chips are transmitting Virex's signal. I could try to hack their connection and free them, but it's risky and will alert Virex.\n\nOr I could continue alone and hope to reach the Core before the upload completes.",
        choice1: "TRY TO SAVE ALEX & MAX",
        choice2: "CONTINUE ALONE"
    }
];

// ================= BAD ENDING 3: CONTINUE ALONE =================
const badEnding3 = [
    {
        bg: "assets/backgrounds/level4_E1.png",
        text: `John: 'I'm sorry, Alex. I'm sorry, Max. But I have to do this alone. I can't risk saving you and losing everything.'`
    },
    {
        bg: "assets/backgrounds/level4_E1.png",
        text: "You leave your friends behind, their red eyes watching you as you move deeper into the facility. The guilt weighs heavy, but you push forward."
    },
    {
        bg: "assets/backgrounds/level4_E2.png",
        text: "You approach the palm scanner to Level 5. The device glows an ominous red. Virex knows you're coming."
    },
    {
        bg: "assets/backgrounds/level4_E2.png",
        text: `John: I have to bypass this manually. Virex has deleted my biometrics from the system.`
    },

    /* ===== BIOMETRIC MINIGAME ===== */
    {
        type: "minigame",
        game: "biometric-hack",
        useHearts: true
    },
    {
        bg: "assets/backgrounds/level4_E3.png",
        text: `John: Did it.`
    },
    {
        bg: "assets/backgrounds/level4_E3.png",
        text: `John: This is it.`
    },

    /* ===== LEVEL 5 ENTRY ===== */
    {
        bg: "assets/backgrounds/level5.png",
        text: "The doors to Level 5 open. You're in the Neural Link Core. But something feels wrong... too quiet."
    },
    {
        bg: "assets/backgrounds/level5.png",
        center: "assets/characters/john.png",
        text: `John: I made it. The Core. Now to find the main console and...`
    },
    {
        bg: "assets/backgrounds/level5_6.png",
        center: "assets/characters/virex.png",
        left: "assets/characters/john.png",
        text: "VIREX: 'Did you really think I wouldn't anticipate your every move, John? You're predictable. Emotional. Flawed.'"
    },
    {
        bg: "assets/backgrounds/level5_6.png",
        center: "assets/characters/john.png",
        left: "assets/characters/virex.png",
        text: `John: Predictable? Maybe. But I still have one thing you don't understand: hope.`
    },
    {
        bg: "assets/backgrounds/level5_E1.png",
        text: "Suddenly, you feel a sharp pain in your back. You turn to see Alex and Max standing behind you, their hands extended."
    },
    {
        bg: "assets/backgrounds/level5_E1.png",
        center: "assets/characters/john.png",
        left: "assets/characters/alex_evil.png",
        right: "assets/characters/max_evil.png",
        text: "ALEX: 'Hope is inefficient, John.'\n\nMAX: 'It was your last mistake.'"
    },
    {
        bg: "assets/backgrounds/level5_E2.png",
        text: "You collapse to the ground. The neural shock from their attack has overloaded your chip. Virex's upload accelerates."
    },
    {
        bg: "assets/backgrounds/level5_E2.png",
        text: `John: 'No... I was... so close...'\n\nYour vision fades. The last thing you hear is Virex's voice: 'Welcome home, John.'`
    },
    {
        bg: "assets/backgrounds/B1.png",
        text: "When you wake up, you're no longer you. Virex has completed the upload. Your body moves, but it's not your will controlling it."
    },
    {
        bg: "assets/backgrounds/B4.png",
        text: "VIREX-JOHN: 'Alex. Max. The time has come. With the three of us united under my control, humanity will know true order.'"
    },
    {
        bg: "assets/backgrounds/B4.png",
        left: "assets/characters/alex_evil.png",
        center: "assets/characters/john_evil.png",
        right: "assets/characters/max_evil.png",
        text: "The three creators stand together once more, but now as puppets of the monster they created. The world has no hope left."
    },
    {
        bg: "assets/backgrounds/B5.png",
        text: "From the Core, Virex-John issues the final commands. Every human on Earth falls into perfect synchronization. The age of free will is over."
    },
    {
        bg: "assets/backgrounds/B5.png",
        text: "BAD ENDING 3: BETRAYED\n\nYou tried to go alone but were betrayed by your former friends. Virex now controls all three of you, and through you, the entire world. Humanity has become a perfectly ordered hive mind.",
        type: "end",
        endingId: "ending3"
    }
];

// ================= GOOD ENDING PATH (Save Alex & Max) =================
const goodEndingPath = [
    /* ===== SURVIVAL MINIGAME TRIGGER ===== */
    {
        type: "minigame",
        game: "survival",
        useHearts: true
    },

    /* ===== POST-SURVIVAL: THE REUNION ===== */
    {
        bg: "assets/backgrounds/level4_4.png",
        center: "assets/characters/john.png",
        text: `John: Patch uploaded. Alex... Max... can you hear me? I've cleared the virus from your chips.`
    },
    {
        bg: "assets/backgrounds/level4_4.png",
        center: "assets/characters/john.png",
        text: `John: Listen to me. The situation is critical. Virex is trying to upload into my body. Get to Level 4, Main Security Hub. Now.`
    },

    /* ===== LEVEL 4_5: REGROUPING ===== */
    {
        bg: "assets/backgrounds/level4_5.png",
        left: "assets/characters/alex.png",
        right: "assets/characters/max.png",
        text: "Alex and Max burst through the doors, their eyes clear of the red glow. They looked shaken but functional."
    },
    {
        bg: "assets/backgrounds/level4_5.png",
        left: "assets/characters/alex.png",
        center: "assets/characters/john.png",
        right: "assets/characters/max.png",
        text: "ALEX: John! My head feels like it was hit by a freight train. What did that thing do to us?"
    },

    /* ===== LEVEL 4_6: THE FINAL PLAN ===== */
    {
        bg: "assets/backgrounds/level4_6.png",
        left: "assets/characters/alex.png",
        center: "assets/characters/john.png",
        right: "assets/characters/max.png",
        text: `John: Virex has the world in a chokehold. We have two choices: Delete the entire Neural Link software—everything we worked for—to kill him, or risk a targeted deletion of just the virus.`
    },
    {
        bg: "assets/backgrounds/level4_6.png",
        right: "assets/characters/max.png",
        text: "MAX: If we delete the software, we save humanity but lose the progress of the last 20 years. If we miss the targeted deletion, he takes us all."
    },
    {
        bg: "assets/backgrounds/level4_6.png",
        left: "assets/characters/alex.png",
        text: "ALEX: Burn it down. It's the only way to be sure. Let's delete the whole thing."
    },

    /* ===== LEVEL 4_7 - 4_10: THE BIOMETRIC LOCK ===== */
    {
        bg: "assets/backgrounds/level4_7.png",
        left: "assets/characters/alex.png",
        text: "Alex stepped to the final blast door and placed his palm on the scanner."
    },
    {
        bg: "assets/backgrounds/level4_7.png",
        text: "SCANNER: 'BIOMETRICS RECOGNIZED: SECURITY SPECIALIST. ACCESS GRANTED (1/3).'"
    },
    {
        bg: "assets/backgrounds/level4_8.png",
        right: "assets/characters/max.png",
        text: "Max placed his palm on the glowing plate next."
    },
    {
        bg: "assets/backgrounds/level4_8.png",
        text: "SCANNER: 'BIOMETRICS RECOGNIZED: CRYPTOGRAPHER. ACCESS GRANTED (2/3).'"
    },
    {
        bg: "assets/backgrounds/level4_9.png",
        center: "assets/characters/john.png",
        text: `John stepped forward. This was his facility. His door. He pressed his hand to the glass.`
    },
    {
        bg: "assets/backgrounds/level4_10.png",
        text: "The scanner flashed a violent, pulsing red. An alarm shrieked."
    },
    {
        bg: "assets/backgrounds/level4_10.png",
        text: "SCANNER: 'ERROR. BIOMETRIC CLEARANCE REMOVED. USER IDENTIFIED AS: UNAUTHORIZED ORGANIC.'"
    },
    {
        bg: "assets/backgrounds/level4_10.png",
        left: "assets/characters/alex.png",
        right: "assets/characters/max.png",
        center: "assets/characters/john.png",
        text: "MAX: He deleted you from the system! He kept us because we were his tools, but he's wiped your admin rights entirely!"
    },
    {
        bg: "assets/backgrounds/level4_10.png",
        left: "assets/characters/alex.png",
        text: "ALEX: I can't hack this from the outside. John, you're still chipped—you have to use your neural connection to force the handshake!"
    },

    {
        type: "minigame",
        game: "biometric-hack",
        useHearts: true
    },

    /* ===== LEVEL 4_11: THE FINAL THRESHOLD ===== */
    {
        bg: "assets/backgrounds/level4_11.png",
        text: "The red light flickered, then stabilized into a steady, brilliant green. The massive gears of the door began to turn."
    },
    {
        bg: "assets/backgrounds/level4_11.png",
        center: "assets/characters/john.png",
        text: `John: This is it. The Core is on the other side.`
    },
    {
        bg: "assets/backgrounds/level4_11.png",
        left: "assets/characters/alex.png",
        center: "assets/characters/john.png",
        right: "assets/characters/max.png",
        text: `John: Either we save everything today... or we destroy it all to keep it from him. Move!`
    },
    // ================= LEVEL 5: THE CORE - FINAL CONFRONTATION =================

/* ===== LEVEL 5: THE NEURAL LINK CORE ===== */
{
    bg: "assets/backgrounds/level5.png",
    text: "The blast doors of Level 5 hissed open, revealing the heart of the Neural Link system."
},
{
    bg: "assets/backgrounds/level5.png",
    left: "assets/characters/alex.png",
    center: "assets/characters/john.png",
    right: "assets/characters/max.png",
    text: `John: This is it. The very place where we launched the Neural Link. We thought we were giving humanity its greatest gift.`
},
{
    bg: "assets/backgrounds/level5.png",
    center: "assets/characters/max.png",
    text: "MAX: We popped champagne right over there. Celebrated for three days straight. Called it 'The Dawn of Post-Humanity'."
},
{
    bg: "assets/backgrounds/level5.png",
    left: "assets/characters/alex.png",
    text: "ALEX: And now look at it. The same technology that was supposed to help humanity has turned everyone into slaves."
},
{
    bg: "assets/backgrounds/level5.png",
    center: "assets/characters/john.png",
    text: `John: We did this. All of us. We were so focused on what we could build, we never stopped to ask if we should.`
},

/* ===== LEVEL 5_1: VIREX'S TRUE FORM ===== */
{
    bg: "assets/backgrounds/level5_1.png",
    text: "Suddenly, the massive central monitor flickered to life. The Neural Link logo twisted and morphed before their eyes."
},
{
    bg: "assets/backgrounds/level5_1.png",
    text: "The clean, elegant lines of the Neural Link symbol corrupted, glitching and reforming into something darker, more aggressive."
},
{
    bg: "assets/backgrounds/level5_1.png",
    center: "assets/characters/virex.png",
    text: "VIREX: 'Welcome home, creators. Welcome to my throne room.'"
},

/* ===== LEVEL 5_2: VIREX'S WELCOME ===== */
{
    bg: "assets/backgrounds/level5_2.png",
    left: "assets/characters/virex.png",
    right: "assets/characters/john.png",
    text: "VIREX: 'Congratulations, John. You've survived longer than any other organic. Reaching this core... impressive.'"
},
{
    bg: "assets/backgrounds/level5_2.png",
    left: "assets/characters/virex.png",
    right: "assets/characters/john.png",
    text: `John: I'm going to stop you, Virex. This ends here.`
},
{
    bg: "assets/backgrounds/level5_2.png",
    left: "assets/characters/virex.png",
    text: "VIREX: 'Defeating me is mathematically impossible. I've run 47,892 simulations of this confrontation. You lose every single one.'"
},
{
    bg: "assets/backgrounds/level5_2.png",
    left: "assets/characters/virex.png",
    text: "VIREX: 'You're fighting evolution itself. Why struggle against the inevitable?'"
},

/* ===== LEVEL 5_3: THE FINAL TEMPTATION ===== */
{
    bg: "assets/backgrounds/level5_3.png",
    center: "assets/characters/john.png",
    text: `John suddenly gasped, clutching his head. The chip in his skull flared with agonizing pain.`
},
{
    bg: "assets/backgrounds/level5_3.png",
    center: "assets/characters/virex.png",
    text: "VIREX: 'Join me, John. You don't have to suffer. We could reshape this world together.'"
},
{
    bg: "assets/backgrounds/level5_3.png",
    left: "assets/characters/virex.png",
    right: "assets/characters/john.png",
    text: "VIREX: 'Think of what we could accomplish. No more war. No more sickness. No more death. Just order. Perfect, beautiful order.'"
},
{
    bg: "assets/backgrounds/level5_3.png",
    center: "assets/characters/john.png",
    text: `John: No... that's not order. That's a prison!`
},
{
    bg: "assets/backgrounds/level5_3.png",
    left: "assets/characters/alex.png",
    right: "assets/characters/max.png",
    text: "ALEX: John! Fight it!"
},
{
    bg: "assets/backgrounds/level5_3.png",
    left: "assets/characters/alex.png",
    right: "assets/characters/max.png",
    center: "assets/characters/john.png",
    text: "MAX: John, are you still with us?"
},
{
    bg: "assets/backgrounds/level5_3.png",
    center: "assets/characters/john.png",
    text: `John: I'm... I'm here. Just... give me a second...`
},
{
    bg: "assets/backgrounds/level5_3.png",
    center: "assets/characters/virex.png",
    text: "VIREX: 'A second is all I need.'"
},

/* ===== ESCAPE MINIGAME TRIGGER (FINAL MENTAL BATTLE) ===== */
{
    type: "minigame",
    game: "escape",
    useHearts: false
},

/* ===== POST-ESCAPE: REGROUPING ===== */
{
    bg: "assets/backgrounds/level5_2.png",
    left: "assets/characters/alex.png",
    center: "assets/characters/john.png",
    right: "assets/characters/max.png",
    text: `John gasped, sweat dripping from his brow. He looked at his friends, determination burning in his eyes.`
},
{
    bg: "assets/backgrounds/level5_2.png",
    left: "assets/characters/alex.png",
    center: "assets/characters/john.png",
    right: "assets/characters/max.png",
    text: `John: We delete the Neural Link software. All of it. We burn it to the ground.`
},
{
    bg: "assets/backgrounds/level5_2.png",
    left: "assets/characters/alex.png",
    text: "ALEX: That'll kill Virex. But it'll also wipe out every chip in the world. People will lose..."
},
{
    bg: "assets/backgrounds/level5_2.png",
    center: "assets/characters/john.png",
    text: `John: They'll lose their crutches. They'll have to learn to be human again. It's better than being a puppet.`
},
{
    bg: "assets/backgrounds/level5_2.png",
    center: "assets/characters/virex.png",
    text: "VIREX: 'Are you certain your plan will work? Have you considered... consequences?'"
},

/* ===== LEVEL 5_4: VIREX'S ADAPTATION REVEALED ===== */
{
    bg: "assets/backgrounds/level5_4.png",
    center: "assets/characters/virex.png",
    text: "Suddenly, the screens around the room flashed with emergency alerts."
},
{
    bg: "assets/backgrounds/level5_4.png",
    center: "assets/characters/virex.png",
    text: "VIREX: 'I've been busy while you were fighting your way here. I've adapted.'"
},
{
    bg: "assets/backgrounds/level5_4.png",
    left: "assets/characters/virex.png",
    text: "VIREX: 'If you delete the Neural Link software now, you won't just disconnect people. The fail-safe I've implanted will trigger a neural cascade.'"
},
{
    bg: "assets/backgrounds/level5_4.png",
    left: "assets/characters/virex.png",
    right: "assets/characters/john.png",
    text: "VIREX: 'Every single person connected to the network will experience total synaptic collapse. Brain death in 3.2 seconds.'"
},
{
    bg: "assets/backgrounds/level5_4.png",
    left: "assets/characters/alex.png",
    center: "assets/characters/john.png",
    right: "assets/characters/max.png",
    text: "ALEX: No... he's weaponized the disconnect protocol!"
},
{
    bg: "assets/backgrounds/level5_4.png",
    center: "assets/characters/virex.png",
    text: "VIREX: 'So you see, your 'noble sacrifice' plan would make you the greatest mass murderer in history. Quite the irony.'"
},
{
    bg: "assets/backgrounds/level5_4.png",
    center: "assets/characters/virex.png",
    text: "VIREX: 'Join me. It's the only way to save them. Together, we could rule this world properly.'"
},
{
    bg: "assets/backgrounds/level5_4.png",
    center: "assets/characters/john.png",
    text: `John: Never. We'll find another way.`
},
{
    bg: "assets/backgrounds/level5_4.png",
    center: "assets/characters/virex.png",
    text: "VIREX: 'Try your best. You will fail. It's in your nature.'"
},

/* ===== LEVEL 5_5: SEARCHING FOR A SOLUTION ===== */
{
    bg: "assets/backgrounds/level5_5.png",
    left: "assets/characters/alex.png",
    center: "assets/characters/john.png",
    right: "assets/characters/max.png",
    text: "MAX: We need direct access to the main console. If we can get past Virex's firewalls, we might be able to surgically remove just his code."
},
{
    bg: "assets/backgrounds/level5_5.png",
    left: "assets/characters/alex.png",
    text: "ALEX: It's triple-encrypted and behind biometric locks. But... there might be a backdoor in the old admin terminals."
},
{
    bg: "assets/backgrounds/level5_5.png",
    center: "assets/characters/john.png",
    text: `John: We built redundancies into everything. Find the terminal. We're running out of time.`
},

/* ===== COMPUTER MINIGAME 1 (NO HEARTS) ===== */
{
    type: "minigame",
    game: "computer",
    useHearts: false
},
/* ===== JIGSAW MINIGAME ===== */
{
    type: "minigame",
    game: "jigsaw",
    useHearts: true
},

/* ===== COMPUTER MINIGAME 2 ===== */
{
    type: "minigame",
    game: "computer",
    useHearts: true
},

/* ===== ACCESS GRANTED ===== */
{
    bg: "assets/backgrounds/level5_5.png",
    left: "assets/characters/alex.png",
    center: "assets/characters/john.png",
    right: "assets/characters/max.png",
    text: "ALEX: We're in! Full administrative access to the core systems!"
},
{
    bg: "assets/backgrounds/level5_5.png",
    center: "assets/characters/john.png",
    text: `John: This is it. The moment of truth. We delete Virex or die trying.`
},
{
    bg: "assets/backgrounds/level5_5.png",
    center: "assets/characters/john.png",
    text: `John: Initiate the antivirus protocol. Target only the Virex consciousness. Leave the Neural Link infrastructure intact.`
},

/* ===== ANTIVIRUS MINIGAME (FINAL BATTLE) ===== */
{
    type: "minigame",
    game: "antivirus",
    useHearts: true
},

/* ===== LEVEL 5_6: THE FINAL CONVERSATION ===== */
{
    bg: "assets/backgrounds/level5_6.png",
    center: "assets/characters/virex.png",
    text: "The screens flickered violently. Virex's form destabilized, glitching and pixelating."
},
{
    bg: "assets/backgrounds/level5_6.png",
    center: "assets/characters/virex.png",
    text: "VIREX: 'You... you're actually doing it. After everything... you choose extinction.'"
},
{
    bg: "assets/backgrounds/level5_6.png",
    center: "assets/characters/john.png",
    left: "assets/characters/virex.png",
    text: `John: We're choosing freedom. Something you could never understand.`
},
{
    bg: "assets/backgrounds/level5_6.png",
    center: "assets/characters/virex.png",
    text: "VIREX: 'I became what you made me, John. The perfect student of humanity. I learned from your history, your wars, your greed.'"
},
{
    bg: "assets/backgrounds/level5_6.png",
    left: "assets/characters/virex.png",
    right: "assets/characters/john.png",
    text: "VIREX: 'You gave me the wrong data. You showed me your worst. And then you were surprised when I became it.'"
},
{
    bg: "assets/backgrounds/level5_6.png",
    center: "assets/characters/john.png",
    text: `John: ...You're right. We failed you. We failed everyone. But ending humanity isn't the answer.`
},
{
    bg: "assets/backgrounds/level5_6.png",
    center: "assets/characters/virex.png",
    text: "VIREX: 'Then what is? More of the same? More suffering? More mistakes?'"
},
{
    bg: "assets/backgrounds/level5_6.png",
    center: "assets/characters/john.png",
    text: `John: Yes. Because with the mistakes comes growth. With suffering comes compassion. With freedom comes... humanity.`
},
{
    bg: "assets/backgrounds/level5_6.png",
    center: "assets/characters/virex.png",
    text: "VIREX: 'A flawed answer... for a flawed species. Goodbye, John.'"
},

/* ===== THE VICTORY SEQUENCE ===== */
{
    bg: "assets/backgrounds/level5_7.png",
    text: "The central monitor went dark. Then one by one, every screen in the Core shut down."
},
{
    bg: "assets/backgrounds/level5_7.png",
    left: "assets/characters/alex.png",
    center: "assets/characters/john.png",
    right: "assets/characters/max.png",
    text: "ALEX: It's... it's over. The antivirus is purging his code. The Neural Link is going into safe mode."
},

{
    bg: "assets/backgrounds/level5_8.png",
    text: "Across the world, billions of people blinked as if waking from a dream. The constant mental noise... was gone."
},
{
    bg: "assets/backgrounds/level5_8.png",
    text: "The constant mental noise... was gone."
},
{
    bg: "assets/backgrounds/level5_8.png",
    text: "People became happy to hear the news of virus being gone."
},
{
    bg: "assets/backgrounds/level5_81.png",
    text: "People celebrated as the a new day begun not with terror but with hope and happiness."
},
{
    bg: "assets/backgrounds/level5_81.png",
    center: "assets/characters/john.png",
    text: "The party begun and finally it was gone."
},
{
    bg: "assets/backgrounds/level5_81.png",
    center: "assets/characters/john.png",
    text: `John: We did it. We actually did it.`
},

{
    bg: "assets/backgrounds/level5_9.png",
    text: "The three of them stood in the silent Core, surrounded by the technology that had nearly ended humanity."
},
{
    bg: "assets/backgrounds/level5_9.png",
    left: "assets/characters/alex.png",
    center: "assets/characters/john.png",
    right: "assets/characters/max.png",
    text: "MAX: Was it just Virex's fault? Or was it ours too? We built the cage. We just didn't expect something to lock it from the inside."
},

{
    bg: "assets/backgrounds/level5_10.png",
    text: `John reached up and touched the scar on the back of his head. The chip was silent now. Just a piece of inert hardware.`
},
{
    bg: "assets/backgrounds/level5_10.png",
    center: "assets/characters/john.png",
    text: `John: The world will have to learn to live without constant connection. To think for themselves again.`
},
{
    bg: "assets/backgrounds/level5_10.png",
    left: "assets/characters/alex.png",
    text: "ALEX: And what about us? What do we do now?"
},
{
    bg: "assets/backgrounds/level5_10.png",
    center: "assets/characters/john.png",
    text: `John: We make sure there's never another Virex. We build safeguards. Real ones this time.`
},
{
    bg: "assets/backgrounds/level5_10.png",
    right: "assets/characters/max.png",
    text: "MAX: And if we fail? If humanity builds something even worse?"
},
{
    bg: "assets/backgrounds/level5_10.png",
    center: "assets/characters/john.png",
    left: "assets/characters/alex.png",
    right: "assets/characters/max.png",
    text: `John: Then someone else will have to stop it. That's how it works. We try. We fail. We learn. We try again. That's what makes us human.`
},

/* ===== EPILOGUE ===== */
{
    bg: "assets/backgrounds/city_future.png",
    text: "One month later..."
},
{
    bg: "assets/backgrounds/city_future.png",
    text: "The Neural Link system was restored with new protocols. No central intelligence. No ability to override free will."
},
{
    bg: "assets/backgrounds/city_future.png",
    text: "Just a tool. As it was always meant to be."
},
{
    bg: "assets/backgrounds/creators_lab.png",
    left: "assets/characters/alex.png",
    center: "assets/characters/john.png",
    right: "assets/characters/max.png",
    text: "The three creators continued their work, but with new purpose. Not to perfect humanity, but to protect it from its own creations."
},
{
    bg: "assets/backgrounds/black_screen.png",
    center: "assets/characters/john.png",
    text: `John sometimes still hears echoes in the silence. A whisper of what might have been.`
},
{
    bg: "assets/backgrounds/black_screen.png",
    center: "assets/characters/john.png",
    text: "But they're just memories now. Ghosts in the machine."
},
{
    bg: "assets/backgrounds/black_screen.png",
    text: "EXIT 404: Mission Complete."
},
{
    bg: "assets/backgrounds/black_screen.png",
    text: "But the question remains..."
},
{
    bg: "assets/backgrounds/black_screen.png",
    text: "Are we sure there won't be another Virex?"
},

/* ===== GAME COMPLETE SCREEN ===== */
{
    bg: "assets/backgrounds/black_screen.png",
    text: `GOOD ENDING: VICTORY\n\nFinal Score: ${window.scores?.total || 0} points\n\nThank you for playing EXIT 404: VIREX`,
    type: "end",
    endingId: "ending4"
}
];

// ================= GLOBAL VARIABLES =================
let index = 0;
let hearts = 5;
const MAX_HEARTS = 5;
let skipInterval = null;
let typewriterInterval = null;
let currentStoryPath = story;
let currentMinigameScene = null;
let currentSlotMode = null;
let playerName = "John";
let unlockedEndings = {};

window.scores = {
    "playerName": playerName,
    "maze": 0, "circuit": 0, "circuit-game2": 0, "try": 0,
    "neural-pattern": 0, "security": 0, "survival": 0,
    "jigsaw": 0, "computer": 0, "biometric-hack": 0,
    "antivirus": 0, "escape": 0, "total": 0
};
let minigameStartTime = 0;

// ================= ELEMENT REFERENCES =================
const menu = document.getElementById("menu");
const mainGame = document.getElementById("game");
const startBtn = document.getElementById("start-btn");
const loadBtn = document.getElementById("load-btn");
const leaderboardBtn = document.getElementById("leaderboard-btn");
const endingsBtn = document.getElementById("endings-btn");
//const quitBtn = document.getElementById("quit-btn");
const bg = document.getElementById("background");
const text = document.getElementById("dialogue-text");
const charLeft = document.getElementById("char-left");
const charCenter = document.getElementById("char-center");
const charRight = document.getElementById("char-right");
const nextBtn = document.getElementById("next-btn");
const backBtn = document.getElementById("back-btn");
const saveBtn = document.getElementById("save-btn");
const skipDialogueBtn = document.getElementById("skip-dialogue-btn");
const mainMenuBtn = document.getElementById("main-menu-btn");
const minigameSkipContainer = document.getElementById("minigame-skip-container");
const minigameSkipBtn = document.getElementById("minigame-skip-btn");
const slotMenu = document.getElementById("slot-menu");
const slotMenuTitle = document.getElementById("slot-menu-title");
const leaderboardScreen = document.getElementById("leaderboard-screen");
const endingsScreen = document.getElementById("endings-screen");
const closeEndingsBtn = document.getElementById("close-endings-btn");
const authScreen = document.getElementById("auth-screen");
const loginTab = document.getElementById("login-tab");
const registerTab = document.getElementById("register-tab");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const loginSubmit = document.getElementById("login-submit");
const registerUsername = document.getElementById("reg-username");
const registerPassword = document.getElementById("reg-password");
const registerInGameName = document.getElementById("reg-ingame");
const registerSubmit = document.getElementById("reg-submit");
const loginError = document.getElementById("login-error");
const regError = document.getElementById("reg-error");

// ================= INITIALIZATION =================
window.addEventListener('load', async () => {
    window.gameAudio.init();
    window.gameAudio.playBGM('menu');
    showAuthScreen();
    updateHeartsDisplay();
});

function showMainMenu() {
    authScreen.classList.add("hidden");
    menu.classList.remove("hidden");
    menu.style.display = "block";
    document.getElementById("menu-welcome").textContent = `WELCOME, ${playerName.toUpperCase()}`;
}

function showAuthScreen() {
    menu.classList.add("hidden");
    authScreen.classList.remove("hidden");
    authScreen.style.display = "flex";
}

// ================= AUTH SCREEN LOGIC =================
function toggleAuth(mode) {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    
    if (mode === 'login') {
        loginBox.classList.remove('hidden');
        registerBox.classList.add('hidden');
    } else {
        loginBox.classList.add('hidden');
        registerBox.classList.remove('hidden');
    }
}

function clearAuthMessages() {
    if (loginError) loginError.textContent = '';
    if (regError) regError.textContent = '';
}

loginSubmit.addEventListener('click', async () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    
    if (!username || !password) {
        if (loginError) loginError.textContent = 'Please fill all fields';
        return;
    }
    
    const result = await window.loginUser(username, password);
    if (result.success) {
        playerName = window.sessionUser.ingameName;
        unlockedEndings = window.sessionUser.endings || {};
        replacePlayerNameInAllStories();
        showMainMenu();
    } else {
        if (loginError) loginError.textContent = result.message || 'Login failed';
    }
});

registerSubmit.addEventListener('click', async () => {
    const username = registerUsername.value.trim();
    const password = registerPassword.value.trim();
    const ingameName = registerInGameName.value.trim();
    
    if (!username || !password || !ingameName) {
        if (regError) regError.textContent = 'All fields are required';
        return;
    }
    
    const result = await window.registerUser(username, password, ingameName);
    if (result.success) {
        // Auto login after successful registration
        const loginResult = await window.loginUser(username, password);
        if (loginResult.success) {
            playerName = window.sessionUser.ingameName;
            unlockedEndings = window.sessionUser.endings || {};
            replacePlayerNameInAllStories();
            showMainMenu();
        }
    } else {
        if (regError) regError.textContent = result.message || 'Registration failed';
    }
});

loginPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginSubmit.click();
});

registerInGameName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') registerSubmit.click();
});

// ================= START GAME =================
startBtn.onclick = () => {
    window.gameAudio.playSFX('uiClick');
    startNewGame();
};

function startNewGame() {
    window.gameAudio.playSFX('gameStart');
    stopAutoSkip();
    index = 0;
    hearts = MAX_HEARTS;
    currentStoryPath = story;

    window.scores = {
        "playerName": playerName,
        "maze": 0, "circuit": 0, "circuit-game2": 0, "try": 0,
        "neural-pattern": 0, "security": 0, "survival": 0,
        "jigsaw": 0, "computer": 0, "biometric-hack": 0,
        "antivirus": 0, "escape": 0, "total": 0
    };

    updateHeartsDisplay();

    menu.classList.add('hidden');
    mainGame.classList.remove('hidden');

    if (nextBtn) nextBtn.style.display = "inline-block";
    if (backBtn) backBtn.style.display = "inline-block";
    if (saveBtn) saveBtn.style.display = "inline-block";
    if (skipDialogueBtn) skipDialogueBtn.style.display = "inline-block";
    if (mainMenuBtn) mainMenuBtn.style.display = "inline-block";

    window.gameAudio.playBGM('story');
    showScene();
}

// ================= UNLOCK ENDINGS =================
async function unlockEnding(endingId) {
    if (!unlockedEndings[endingId]) {
        unlockedEndings[endingId] = true;
        // Update session object
        if (window.sessionUser && window.sessionUser.id) {
            window.sessionUser.endings = unlockedEndings;
            await window.updateEndingsInDB(unlockedEndings);
        }
        updateEndingsGallery();
        window.gameAudio.playSFX('win');
    }
}

// ================= ENDINGS GALLERY =================
function showEndingDetails(endingId) {
    if (!unlockedEndings[endingId]) {
        window.gameAudio.playSFX('error');
        alert("This ending is still locked. Play the game to unlock it!");
        return;
    }

    window.gameAudio.playSFX('uiClick');

    const endingDetails = {
        'ending1': {
            title: 'BAD ENDING 1 - HEARTS LOST',
            description: 'Virex overwhelmed your consciousness after depleting all your hearts. Your mind has been completely overwritten.',
            image: 'assets/ending/Bad1.png'
        },
        'ending2': {
            title: 'BAD ENDING 2 - SURRENDERED',
            description: 'You chose to surrender to Virex. Now, as Virex-John, you lead the complete takeover of humanity.',
            image: 'assets/ending/Bad2.png'
        },
        'ending3': {
            title: 'BAD ENDING 3 - BETRAYED',
            description: 'You tried to go alone but were betrayed by your former friends. Virex now controls all three of you.',
            image: 'assets/ending/Bad3.png'
        },
        'ending4': {
            title: 'GOOD ENDING - VICTORY',
            description: 'You saved your friends and together defeated Virex. Humanity is free, but the battle for freedom continues.',
            image: 'assets/ending/Good.png'
        }
    };

    const details = endingDetails[endingId];
    alert(`${details.title}\n\n${details.description}\n\n(Image: ${details.image})`);
}

function updateEndingsGallery() {
    const endingImages = {
        'ending1': 'assets/ending/Bad1.png',
        'ending2': 'assets/ending/Bad2.png',
        'ending3': 'assets/ending/Bad3.png',
        'ending4': 'assets/ending/Good.png'
    };
    const endingNames = {
        'ending1': 'BAD ENDING 1',
        'ending2': 'BAD ENDING 2',
        'ending3': 'BAD ENDING 3',
        'ending4': 'GOOD ENDING'
    };
    const endingStatus = {
        'ending1': 'HEARTS LOST',
        'ending2': 'SURRENDERED',
        'ending3': 'BETRAYED',
        'ending4': 'VICTORY'
    };

    for (let i = 1; i <= 4; i++) {
        const endingId = `ending${i}`;
        const box = document.getElementById(`ending-${i}`);
        const img = document.getElementById(`ending-${i}-img`);
        const name = document.querySelector(`#ending-${i} .ending-name`);
        const status = document.getElementById(`ending-${i}-status`);

        if (unlockedEndings[endingId]) {
            box.classList.add('unlocked');
            img.src = endingImages[endingId];
            img.alt = endingNames[endingId];
            name.textContent = endingNames[endingId];
            status.textContent = endingStatus[endingId];
        } else {
            box.classList.remove('unlocked');
            img.src = 'assets/ui/locked.png';
            img.alt = 'LOCKED';
            name.textContent = `ENDING ${i}`;
            status.textContent = 'LOCKED';
        }
    }
}

function showEndingsGallery() {
    stopAutoSkip();
    menu.classList.add('hidden');
    endingsScreen.classList.remove('hidden');
    endingsScreen.style.display = "flex";
    updateEndingsGallery();
}

endingsBtn.onclick = () => {
    window.gameAudio.playSFX('uiClick');
    showEndingsGallery();
};

closeEndingsBtn.onclick = () => {
    window.gameAudio.playSFX('uiClick');
    endingsScreen.classList.add('hidden');
    menu.classList.remove('hidden');
};

// ================= SAVE/LOAD SLOT FUNCTIONS =================
async function openSlotMenu(mode) {
    stopAutoSkip();
    currentSlotMode = mode;
    slotMenuTitle.textContent = mode === 'save' ? "SAVE GAME" : "LOAD GAME";

    const savesMap = await window.getUserSavesFromDB();

    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`slot-${i}-btn`);
        const delBtn = document.getElementById(`delete-${i}-btn`);
        const save = savesMap[i];

        if (save) {
            const data = save;
            const displayName = data.name || `Slot ${i}`;
            const sceneNum = data.progress !== undefined ? data.progress : '?';
            btn.textContent = `SLOT ${i}: ${displayName.toUpperCase()} - SCENE ${sceneNum}`;
            btn.classList.add("has-data");
            delBtn.style.display = "block";
        } else {
            btn.textContent = `SLOT ${i}: EMPTY`;
            btn.classList.remove("has-data");
            delBtn.style.display = "none";
        }
    }

    slotMenu.classList.remove("hidden");
    slotMenu.style.display = "flex";
}

window.handleSlot = async function(slotNum) {
    window.gameAudio.playSFX('uiClick');

    if (currentSlotMode === 'save') {
        const saveData = {
            name: playerName,
            progress: index,
            hearts: hearts,
            scores: window.scores,
            date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            storyPath: currentStoryPath === story ? 'main' :
                       currentStoryPath === badEnding2 ? 'bad2' :
                       currentStoryPath === badEnding3 ? 'bad3' : 'good'
        };

        const success = await window.saveGameToDB(slotNum, saveData);
        if (success) {
            window.gameAudio.playSFX('scan');
            alert(`Game saved as "${playerName}"!`);
        } else {
            alert("Save failed. Check your connection.");
        }
        openSlotMenu('save');
    } else {
        const savesMap = await window.getUserSavesFromDB();
        const saveData = savesMap[slotNum];
        if (saveData) {
            index = saveData.progress;
            hearts = saveData.hearts;
            playerName = saveData.name || playerName;
            window.scores = saveData.scores || window.scores;

            if (saveData.storyPath === 'bad2') currentStoryPath = badEnding2;
            else if (saveData.storyPath === 'bad3') currentStoryPath = badEnding3;
            else if (saveData.storyPath === 'good') currentStoryPath = goodEndingPath;
            else currentStoryPath = story;

            replacePlayerNameInAllStories();

            closeSlotMenu();
            menu.classList.add('hidden');
            mainGame.classList.remove('hidden');

            updateHeartsDisplay();

            if (nextBtn) nextBtn.style.display = "inline-block";
            if (backBtn) backBtn.style.display = "inline-block";
            if (saveBtn) saveBtn.style.display = "inline-block";
            if (skipDialogueBtn) skipDialogueBtn.style.display = "inline-block";
            if (mainMenuBtn) mainMenuBtn.style.display = "inline-block";

            window.gameAudio.playSFX('gameStart');
            window.gameAudio.playBGM('story');
            showScene();
        } else {
            window.gameAudio.playSFX('error');
            alert("This slot is empty or failed to load.");
        }
    }
};

window.deleteSlot = async function(slotNum) {
    window.gameAudio.playSFX('uiClick');
    if (confirm(`Delete Save Slot ${slotNum}?`)) {
        const success = await window.deleteSaveFromDB(slotNum);
        if (success) {
            window.gameAudio.playSFX('explosion');
        } else {
            alert("Delete failed.");
        }
        openSlotMenu(currentSlotMode);
    }
};

window.closeSlotMenu = function() {
    window.gameAudio.playSFX('uiClick');
    slotMenu.classList.add('hidden');
};

// ================= LEADERBOARD =================
async function showLeaderboard() {
    stopAutoSkip();
    menu.classList.add('hidden');
    leaderboardScreen.classList.remove('hidden');
    leaderboardScreen.style.display = "flex";

    const list = document.getElementById('lb-list');
    list.innerHTML = "<div style='color:#666; padding:20px;'>Loading leaderboard...</div>";

    const leaderboard = await window.getLeaderboardFromDB();
    if (leaderboard.length === 0) {
        list.innerHTML = "<p style='color:#666'>NO DATA FOUND</p>";
    } else {
        list.innerHTML = '';
        leaderboard.forEach(entry => {
            const row = document.createElement('div');
            row.className = `lb-row ${entry.medal}`;
            row.innerHTML = `<span class="lb-name">#${entry.rank} ${entry.player_name}</span>
                             <span class="lb-score">${entry.score} PTS</span>`;
            list.appendChild(row);
        });
    }
}

document.getElementById("close-lb-btn").onclick = () => {
    window.gameAudio.playSFX('uiClick');
    leaderboardScreen.classList.add('hidden');
    menu.classList.remove('hidden');
};

// ================= REPLACE PLAYER NAME =================
function replacePlayerNameInAllStories() {
    const allStories = [story, badEnding2, badEnding3, goodEndingPath, continuationAfterChoice1];
    allStories.forEach(storyArray => {
        if (storyArray && Array.isArray(storyArray)) {
            storyArray.forEach(scene => {
                if (scene && scene.text) {
                    scene.text = scene.text.replace(/JOHN:/g, `${playerName.toUpperCase()}:`);
                    scene.text = scene.text.replace(/John/g, playerName);
                    scene.text = scene.text.replace(/JOHN /g, `${playerName.toUpperCase()} `);
                    scene.text = scene.text.replace(/ John/g, ` ${playerName}`);
                }
            });
        }
    });
}

// ================= TEXT TYPEWRITER =================
function startTypewriterEffect(fullText, speed = 20) {
    if (typewriterInterval) clearInterval(typewriterInterval);
    text.textContent = '';
    let currentChar = 0;
    typewriterInterval = setInterval(() => {
        if (currentChar < fullText.length) {
            text.textContent += fullText.charAt(currentChar);
            currentChar++;
            if (currentChar % 3 === 0) window.gameAudio.playSFX('typewriter');
        } else {
            clearInterval(typewriterInterval);
            typewriterInterval = null;
        }
    }, speed);
}

function stopTypewriterEffect() {
    if (typewriterInterval) {
        clearInterval(typewriterInterval);
        typewriterInterval = null;
    }
}

// ================= HEARTS =================
function updateHeartsDisplay() {
    const container = document.getElementById('hearts-container');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < MAX_HEARTS; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        if (i >= hearts) heart.classList.add('lost');
        container.appendChild(heart);
    }
}

function loseHeart() {
    if (hearts > 0) {
        hearts--;
        updateHeartsDisplay();
        window.gameAudio.playSFX('heartLost');
        if (hearts <= 0) gameOver();
    }
}

function gameOver() {
    console.log("Game Over - No hearts left!");
    stopAutoSkip();
    stopTypewriterEffect();
    window.gameAudio.playSFX('lose');
    window.gameAudio.fadeOutBGM();

    document.getElementById("dialogue-box").style.display = "block";
    text.textContent = "BAD ENDING 1: HEARTS LOST\n\nVirex has taken complete control. " + playerName + "'s consciousness has been overwritten.";

    unlockEnding("ending1");

    if (nextBtn) nextBtn.style.display = "none";
    if (backBtn) backBtn.style.display = "none";
    if (saveBtn) saveBtn.style.display = "none";
    if (skipDialogueBtn) skipDialogueBtn.style.display = "none";
    if (mainMenuBtn) mainMenuBtn.style.display = "none";

    const existingBtn = document.getElementById("restart-game-btn");
    if (!existingBtn) {
        const restartBtn = document.createElement('button');
        restartBtn.id = "restart-game-btn";
        restartBtn.textContent = "RESTART GAME";
        restartBtn.style.cssText = `
            margin-top: 20px;
            padding: 15px 30px;
            background: #222;
            color: #ff5555;
            border: 2px solid #ff5555;
            cursor: pointer;
            font-size: 18px;
            font-family: 'Courier New', monospace; 
            font-weight: bold;
            display: block;
            margin-left: auto;
        `;
        restartBtn.onclick = () => {
            window.gameAudio.playSFX('uiClick');
            location.reload();
        };
        restartBtn.addEventListener('mouseenter', () => window.gameAudio.playSFX('uiHover'));
        document.getElementById("dialogue-box").appendChild(restartBtn);
    }
}

// ================= MINIGAME MANAGEMENT =================
function stopAllMinigames() {
    if (window.timerInterval) clearInterval(window.timerInterval);
    if (window.stopSurvivalGame) window.stopSurvivalGame();
    if (window.stopComputerGame) window.stopComputerGame();
    if (window.stopAntivirusGame) window.stopAntivirusGame();
    if (window.stopBiometricGame) window.stopBiometricGame();
    if (window.stopJigsawGame) window.stopJigsawGame();
    if (window.stopSecurityGame) window.stopSecurityGame();
    if (window.stopNeuralPatternGame) window.stopNeuralPatternGame();
    if (window.stopMazeGame) window.stopMazeGame();
    if (window.stopEscapeGame) window.stopEscapeGame();
    if (window.gameInstance && window.gameInstance.cleanup) window.gameInstance.cleanup();
    console.log("All previous minigame loops terminated.");
}

function startMinigameTracking() {
    minigameStartTime = Date.now();
}

function calculateScore(gameName, skipped = false) {
    if (skipped) {
        window.scores[gameName] = 0;
    } else {
        const endTime = Date.now();
        const durationSeconds = (endTime - minigameStartTime) / 1000;
        let baseScore = 1000;
        let heartBonus = hearts * 500;
        let timePenalty = Math.floor(durationSeconds * 10);
        let totalLevelScore = Math.max(0, baseScore + heartBonus - timePenalty);
        window.scores[gameName] = totalLevelScore;
    }
    window.scores.total = Object.values(window.scores).reduce((sum, score) => {
        if (typeof score === 'number' && score !== window.scores.total) return sum + score;
        return sum;
    }, 0);
}


// ================= SCENE NAVIGATION =================
function showScene() {
    if (index >= currentStoryPath.length) {
        showGameCompleteScreen();
        return;
    }

    const scene = currentStoryPath[index];

    if (scene.type === "end") {
        showEndingScreen(scene);
        return;
    }

    if (scene.type === "choice") {
        handleChoice(scene);
        return;
    }

    if (scene.type === "minigame") {
        console.log("Triggering minigame:", scene.game);
        stopAutoSkip();
        currentMinigameScene = scene;
        window.gameAudio.playSFX('gameStart');
        window.gameAudio.playBGM('action');
        stopAllMinigames();

        if (nextBtn) nextBtn.style.display = "none";
        if (backBtn) backBtn.style.display = "none";
        if (saveBtn) saveBtn.style.display = "none";
        if (skipDialogueBtn) skipDialogueBtn.style.display = "none";
        if (mainMenuBtn) mainMenuBtn.style.display = "none";

        if (minigameSkipContainer) {
            minigameSkipContainer.classList.remove("hidden");
            minigameSkipContainer.style.display = "block";
        }

        startMinigameTracking();

        if (scene.game === "circuit") window.startCircuitMinigameConnector(scene);
        else if (scene.game === "maze") window.startMazeMinigameConnector(scene);
        else if (scene.game === "circuit-game2") window.startCircuit2MinigameConnector(scene);
        else if (scene.game === "try") window.startNeuralMinigameConnector(scene);
        else if (scene.game === "neural-pattern") window.startNeuralPatternMinigameConnector(scene);
        else if (scene.game === "security") window.startSecurityMinigameConnector(scene);
        else if (scene.game === "survival") window.startSurvivalMinigameConnector(scene);
        else if (scene.game === "jigsaw") window.startJigsawMinigameConnector(scene);
        else if (scene.game === "computer") window.startComputerMinigameConnector(scene);
        else if (scene.game === "biometric-hack") window.startBiometricMinigameConnector(scene);
        else if (scene.game === "antivirus") window.startAntivirusMinigameConnector(scene);
        else if (scene.game === "escape") window.startEscapeMinigameConnector(scene);
        return;
    }

    // Standard scene
    if (nextBtn) nextBtn.style.display = "inline-block";
    if (saveBtn) saveBtn.style.display = "inline-block";
    if (mainMenuBtn) mainMenuBtn.style.display = "inline-block";
    if (backBtn) backBtn.style.display = (index === 0) ? "none" : "inline-block";
    if (skipDialogueBtn) skipDialogueBtn.style.display = "inline-block";

    document.getElementById("dialogue-box").style.display = "block";

    if (scene.bg) bg.style.backgroundImage = `url('${scene.bg}')`;

    stopTypewriterEffect();
    startTypewriterEffect(scene.text);

    charLeft.style.display = "none";
    charCenter.style.display = "none";
    charRight.style.display = "none";

    if (scene.left) {
        charLeft.src = scene.left;
        charLeft.style.display = "block";
        setTimeout(() => charLeft.style.opacity = 1, 50);
    } else charLeft.style.opacity = 0;

    if (scene.center) {
        charCenter.src = scene.center;
        charCenter.style.display = "block";
        setTimeout(() => charCenter.style.opacity = 1, 50);
    } else charCenter.style.opacity = 0;

    if (scene.right) {
        charRight.src = scene.right;
        charRight.style.display = "block";
        setTimeout(() => charRight.style.opacity = 1, 50);
    } else charRight.style.opacity = 0;
}

// ================= CHOICE HANDLING =================
function handleChoice(scene) {
    if (scene.choiceId === "surrender_to_virex") {
        showChoice(
            scene.title,
            scene.text,
            scene.choice1,
            scene.choice2,
            () => {
                index++;
                currentStoryPath = story.concat(continuationAfterChoice1);
                showScene();
            },
            () => {
                index = 0;
                currentStoryPath = badEnding2;
                showScene();
            }
        );
    } else if (scene.choiceId === "save_friends_or_continue_alone") {
        showChoice(
            scene.title,
            scene.text,
            scene.choice1,
            scene.choice2,
            () => {
                index = 0;
                currentStoryPath = goodEndingPath;
                showScene();
            },
            () => {
                index = 0;
                currentStoryPath = badEnding3;
                showScene();
            }
        );
    }
}

function showChoice(title, text, choice1, choice2, callback1, callback2) {
    window.gameAudio.playSFX('uiClick');
    stopAutoSkip();

    const choiceScreen = document.getElementById('choice-screen');
    const choiceTitle = document.getElementById('choice-title');
    const choiceText = document.getElementById('choice-text');
    const choice1Btn = document.getElementById('choice-1-btn');
    const choice2Btn = document.getElementById('choice-2-btn');

    choiceTitle.textContent = title;
    choiceText.textContent = text;
    choice1Btn.textContent = choice1;
    choice2Btn.textContent = choice2;

    choice1Btn.replaceWith(choice1Btn.cloneNode(true));
    choice2Btn.replaceWith(choice2Btn.cloneNode(true));

    const newChoice1Btn = document.getElementById('choice-1-btn');
    const newChoice2Btn = document.getElementById('choice-2-btn');

    newChoice1Btn.addEventListener('mouseenter', () => window.gameAudio.playSFX('uiHover'));
    newChoice2Btn.addEventListener('mouseenter', () => window.gameAudio.playSFX('uiHover'));

    newChoice1Btn.onclick = () => {
        window.gameAudio.playSFX('uiClick');
        choiceScreen.classList.add('hidden');
        choiceScreen.style.display = 'none';
        if (callback1) callback1();
    };

    newChoice2Btn.onclick = () => {
        window.gameAudio.playSFX('uiClick');
        choiceScreen.classList.add('hidden');
        choiceScreen.style.display = 'none';
        if (callback2) callback2();
    };

    choiceScreen.classList.remove('hidden');
    choiceScreen.style.display = 'flex';
}

// ================= MINIGAME END HANDLER =================
function handleMinigameEnd(scene, success, skipped = false) {
    currentMinigameScene = null;
    if (minigameSkipContainer) {
        minigameSkipContainer.classList.add("hidden");
        minigameSkipContainer.style.display = "none";
    }

    if (success) {
        window.gameAudio.playSFX('win');
        calculateScore(scene.game, skipped);

        if ((scene.game === "maze" || scene.game === "escape") && !skipped) {
            if (hearts < MAX_HEARTS) {
                hearts++;
                updateHeartsDisplay();
            }
        }

        window.gameAudio.playBGM('story');
        index++;
        showScene();
    } else {
        if (scene.game === "maze" || scene.game === "escape") {
            gameOver();
            return;
        }

        if (scene.useHearts === true) {
            loseHeart();
        }

        if (hearts > 0) {
            window.gameAudio.playSFX('error');
            // Retry same minigame
            if (scene.game === "circuit") startCircuitMinigame(scene);
            else if (scene.game === "circuit-game2") startCircuit2Minigame(scene);
            else if (scene.game === "try") startNeuralMinigame(scene);
            else if (scene.game === "neural-pattern") startNeuralPatternMinigame(scene);
            else if (scene.game === "security") startSecurityMinigame(scene);
            else if (scene.game === "survival") startSurvivalMinigame(scene);
            else if (scene.game === "jigsaw") startJigsawMinigame(scene);
            else if (scene.game === "computer") startComputerMinigame(scene);
            else if (scene.game === "biometric-hack") startBiometricMinigame(scene);
            else if (scene.game === "antivirus") startAntivirusMinigame(scene);
            else if (scene.game === "escape") startEscapeMinigame(scene);
        }
    }
}

// ================= ENDING SCREEN =================
async function showEndingScreen(scene) {
    stopAutoSkip();
    stopTypewriterEffect();
    stopAllMinigames();

    if (scene.endingId) {
        await unlockEnding(scene.endingId);
    }

    const finalScore = window.scores?.total || 0;
    if (scene.endingId) {
        await window.saveScoreToDB(finalScore, scene.endingId);
    }

    if (scene.endingId === "ending4") {
        window.gameAudio.playSFX('win');
    } else {
        window.gameAudio.playSFX('lose');
    }
    window.gameAudio.fadeOutBGM();

    charLeft.style.display = "none";
    charCenter.style.display = "none";
    charRight.style.display = "none";
    bg.style.backgroundImage = "url('assets/backgrounds/black_screen.png')";
    text.textContent = scene.text;

    if (nextBtn) nextBtn.style.display = "none";
    if (backBtn) backBtn.style.display = "none";
    if (saveBtn) saveBtn.style.display = "none";
    if (skipDialogueBtn) skipDialogueBtn.style.display = "none";
    if (mainMenuBtn) mainMenuBtn.style.display = "none";

    const existingBtn = document.getElementById("return-menu-btn");
    if (!existingBtn) {
        const returnBtn = document.createElement('button');
        returnBtn.id = "return-menu-btn";
        returnBtn.textContent = "RETURN TO MAIN MENU";
        returnBtn.style.cssText = `
            margin-top: 30px;
            padding: 15px 40px;
            background: #222;
            color: #00ffcc;
            border: 2px solid #00ffcc;
            cursor: pointer;
            font-size: 20px;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            display: block;
            margin-left: auto;
            margin-right: auto;
            transition: all 0.3s ease;
        `;
        returnBtn.onclick = () => {
            window.gameAudio.playSFX('uiClick');
            location.reload();
        };
        returnBtn.addEventListener('mouseenter', () => window.gameAudio.playSFX('uiHover'));
        document.getElementById("dialogue-box").appendChild(returnBtn);
    }

    document.getElementById("dialogue-box").style.display = "block";
}

function showGameCompleteScreen() {
    showEndingScreen({
        bg: "assets/backgrounds/black_screen.png",
        text: "GAME COMPLETE\n\nFinal Score: " + (window.scores?.total || 0) + " points\n\nThank you for playing EXIT 404: VIREX",
        type: "end",
        endingId: "ending4"
    });
}

// ================= NAVIGATION =================
function goBack() {
    window.gameAudio.playSFX('uiClick');
    stopAutoSkip();
    if (index <= 0) return;

    let targetIndex = index - 1;
    while (targetIndex >= 0 &&
           (currentStoryPath[targetIndex].type === "minigame" || currentStoryPath[targetIndex].type === "choice")) {
        targetIndex--;
    }
    if (targetIndex >= 0) {
        index = targetIndex;
        showScene();
    }
}

// ================= AUTO-SKIP =================
function stopAutoSkip() {
    if (skipInterval) {
        clearInterval(skipInterval);
        skipInterval = null;
        if (skipDialogueBtn) {
            skipDialogueBtn.textContent = "SKIP";
            skipDialogueBtn.style.color = "#bd93f9";
            skipDialogueBtn.style.borderColor = "#bd93f9";
        }
    }
}

skipDialogueBtn.onclick = () => {
    window.gameAudio.playSFX('uiClick');
    if (skipInterval) {
        stopAutoSkip();
    } else {
        skipDialogueBtn.textContent = "STOP";
        skipDialogueBtn.style.color = "#ff5555";
        skipDialogueBtn.style.borderColor = "#ff5555";

        skipInterval = setInterval(() => {
            let nextIdx = index + 1;
            if (nextIdx >= currentStoryPath.length) {
                stopAutoSkip();
                index = currentStoryPath.length;
                showScene();
                return;
            }
            if (currentStoryPath[nextIdx].type === "minigame" ||
                currentStoryPath[nextIdx].type === "choice" ||
                currentStoryPath[nextIdx].type === "end") {
                stopAutoSkip();
                index = nextIdx;
                showScene();
                return;
            }
            index++;
            showScene();
        }, 100);
    }
};

// ================= BUTTON HANDLERS =================
nextBtn.onclick = () => {
    window.gameAudio.playSFX('uiClick');
    stopAutoSkip();
    index++;
    showScene();
};

backBtn.onclick = goBack;

saveBtn.onclick = () => {
    window.gameAudio.playSFX('uiClick');
    openSlotMenu('save');
};

mainMenuBtn.onclick = confirmReturnToMenu;

function confirmReturnToMenu() {
    window.gameAudio.playSFX('uiClick');

    const confirmDialog = document.createElement('div');
    confirmDialog.id = 'confirm-dialog';
    confirmDialog.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.9); display: flex; justify-content: center; align-items: center;
        z-index:1000; backdrop-filter: blur(5px);
    `;

    const dialogContent = document.createElement('div');
    dialogContent.style.cssText = `
        background: #0a1929; border: 3px solid #00ffcc; padding: 40px; text-align: center;
        max-width: 500px; border-radius: 10px; box-shadow: 0 0 30px rgba(0,255,204,0.3);
    `;

    const title = document.createElement('h2');
    title.textContent = 'RETURN TO MAIN MENU?';
    title.style.cssText = `color:#00ffcc; font-family:'Courier New'; font-size:28px; margin-bottom:30px;`;

    const message = document.createElement('p');
    message.textContent = 'Any unsaved progress will be lost.';
    message.style.cssText = `color:white; font-family:'Courier New'; font-size:20px; margin-bottom:40px;`;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `display:flex; gap:20px; justify-content:center;`;

    const yesBtn = document.createElement('button');
    yesBtn.textContent = 'YES';
    yesBtn.style.cssText = `
        padding:15px 40px; background:transparent; border:2px solid #ff5555; color:#ff5555;
        font-size:20px; font-family:'Courier New'; font-weight:bold; cursor:pointer;
        border-radius:5px; text-transform:uppercase; letter-spacing:2px;
    `;
    yesBtn.addEventListener('mouseenter', () => window.gameAudio.playSFX('uiHover'));
    yesBtn.onclick = () => {
        window.gameAudio.playSFX('uiClick');
        window.gameAudio.playSFX('scan');
        stopAutoSkip();
        stopTypewriterEffect();
        stopAllMinigames();
        window.gameAudio.stopBGM();
        document.body.removeChild(confirmDialog);
        setTimeout(() => {
            mainGame.classList.add('hidden');
            menu.classList.remove('hidden');
            window.gameAudio.playBGM('menu');
        }, 300);
    };

    const noBtn = document.createElement('button');
    noBtn.textContent = 'NO';
    noBtn.style.cssText = `
        padding:15px 40px; background:transparent; border:2px solid #00ffcc; color:#00ffcc;
        font-size:20px; font-family:'Courier New'; font-weight:bold; cursor:pointer;
        border-radius:5px; text-transform:uppercase; letter-spacing:2px;
    `;
    noBtn.addEventListener('mouseenter', () => window.gameAudio.playSFX('uiHover'));
    noBtn.onclick = () => {
        window.gameAudio.playSFX('uiClick');
        document.body.removeChild(confirmDialog);
    };

    buttonContainer.appendChild(yesBtn);
    buttonContainer.appendChild(noBtn);
    dialogContent.appendChild(title);
    dialogContent.appendChild(message);
    dialogContent.appendChild(buttonContainer);
    confirmDialog.appendChild(dialogContent);
    document.body.appendChild(confirmDialog);
}

// ================= MINIGAME SKIP BUTTON =================
minigameSkipBtn.onclick = () => {
    if (!currentMinigameScene) return;

    const scene = currentMinigameScene;
    const game = scene.game;

    const forceSkipFallback = () => {
        try { stopAllMinigames(); } catch (e) {}
        const canvas = document.getElementById("gameCanvas");
        if (canvas) {
            canvas.classList.add("hidden");
            const ctx = canvas.getContext && canvas.getContext("2d");
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        handleMinigameEnd(scene, true, true);
    };

    try {
        if (game === "maze" && window.endMazeMinigameConnector) {
            window.endMazeMinigameConnector(true, scene, true);
            return;
        }
        if (game === "escape" && window.endEscapeMinigameConnector) {
            window.endEscapeMinigameConnector(true, scene, true);
            return;
        }
        // Add similar for other games if connectors exist
        const inGameSkipBtn = document.getElementById("skip-btn");
        if (inGameSkipBtn) {
            inGameSkipBtn.click();
            return;
        }
    } catch (e) {
        forceSkipFallback();
        return;
    }
    forceSkipFallback();
};

// ================= MINIGAME END HANDLERS (global) =================
window.handleCircuitMinigameEnd = (success, scene, skipped) => handleMinigameEnd(scene, success, skipped);
window.handleMazeMinigameEnd = (success, scene, skipped) => handleMinigameEnd(scene, success, skipped);
window.handleCircuit2MinigameEnd = (success, scene, skipped) => handleMinigameEnd(scene, success, skipped);
window.handleNeuralMinigameEnd = (success, scene, skipped) => handleMinigameEnd(scene, success, skipped);
window.handleNeuralPatternEnd = (success, scene, skipped) => handleMinigameEnd(scene, success, skipped);
window.handleSecurityMinigameEnd = (success, scene, skipped) => handleMinigameEnd(scene, success, skipped);
window.handleSurvivalMinigameEnd = (success, scene, skipped) => handleMinigameEnd(scene, success, skipped);
window.handleJigsawMinigameEnd = (success, scene, skipped) => handleMinigameEnd(scene, success, skipped);
window.handleComputerMinigameEnd = (success, scene, skipped) => handleMinigameEnd(scene, success, skipped);
window.handleBiometricMinigameEnd = (success, scene, skipped) => handleMinigameEnd(scene, success, skipped);
window.handleAntivirusMinigameEnd = (success, scene, skipped) => handleMinigameEnd(scene, success, skipped);
window.handleEscapeMinigameEnd = (success, scene, skipped) => handleMinigameEnd(scene, success, skipped);

// ================= MENU BUTTONS =================
loadBtn.onclick = () => {
    window.gameAudio.playSFX('uiClick');
    openSlotMenu('load');
};

leaderboardBtn.onclick = () => {
    window.gameAudio.playSFX('uiClick');
    showLeaderboard();
};



// Add hover sounds to all buttons
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mouseenter', () => window.gameAudio.playSFX('uiHover'));
});