// minigames/jigsaw-connector.js

window.startJigsawMinigameConnector = function(scene) {
    console.log("Initializing Neural Jigsaw Interface...");
    window.currentScene = scene;

    const canvas = document.getElementById('gameCanvas');
    const controls = document.getElementById('controls-container');
    const dialogueBox = document.getElementById('dialogue-box');

    if (!canvas) {
        console.error("Critical: Canvas not found!");
        return;
    }

    // 1. UI SETUP
    if (controls) controls.style.display = 'none';
    if (dialogueBox) dialogueBox.style.display = 'none';
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.classList.remove('hidden');
    canvas.style.display = 'block';
    
    const hearts = document.getElementById('hearts-container');
    if (hearts) hearts.style.display = 'flex';

    function cleanupUI() {
        canvas.style.display = 'none';
        canvas.classList.add('hidden');
        if (controls) controls.style.display = 'flex';
        if (dialogueBox) dialogueBox.style.display = 'block';
    }

    // --- FIX: IN-GAME SKIP INTERCEPTOR ---
    let skipBtn = document.getElementById('skip-btn');
    if (!skipBtn) {
        skipBtn = document.createElement('button');
        skipBtn.id = 'skip-btn';
        skipBtn.style.display = 'none'; // Keep hidden, triggered by global skip
        document.body.appendChild(skipBtn);
    } else {
        skipBtn.style.display = 'none';
    }
    
    skipBtn.onclick = function() {
        window.isSkippingJigsaw = true;
        if (window.stopJigsawGame) window.stopJigsawGame();
        cleanupUI();
        if (window.handleJigsawMinigameEnd) {
            window.handleJigsawMinigameEnd(true, scene, true);
        }
        setTimeout(() => { window.isSkippingJigsaw = false; }, 100);
    };
    // -------------------------------------

    // 2. START GAME
    if (window.startJigsawGame) {
        window.startJigsawGame('gameCanvas', function(success) {
            cleanupUI();
            if (window.handleJigsawMinigameEnd) {
                const wasSkipped = window.isSkippingJigsaw === true;
                window.handleJigsawMinigameEnd(success, scene, wasSkipped);
            }
        });
    } else {
        console.error("jigsaw.js not loaded! Check index.html");
        cleanupUI();
        if (window.handleJigsawMinigameEnd) {
            window.handleJigsawMinigameEnd(true, scene, true);
        }
    }
};

window.endJigsawMinigameConnector = function(success, scene, skipped) {
    window.isSkippingJigsaw = skipped; 
    if (window.stopJigsawGame) window.stopJigsawGame();
    setTimeout(() => { window.isSkippingJigsaw = false; }, 100);
};