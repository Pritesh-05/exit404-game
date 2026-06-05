// minigames/computer-connector.js

window.startComputerMinigameConnector = function(scene) {
    console.log("Initializing Mainframe Access...");
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
        if (window.stopComputerGame) window.stopComputerGame();
        cleanupUI();
        if (window.handleComputerMinigameEnd) {
            window.handleComputerMinigameEnd(true, scene, true);
        }
    };
    // -------------------------------------

    // 2. CHECK PASSWORD STATE
    const hasPassword = (window.scores && window.scores['jigsaw'] > 0);
    console.log("Computer Game - Password Known:", hasPassword);

    // 3. START GAME
    if (window.startComputerGame) {
        window.startComputerGame('gameCanvas', hasPassword, function(success, skipped) {
            cleanupUI();
            if (window.handleComputerMinigameEnd) {
                window.handleComputerMinigameEnd(success, scene, skipped);
            }
        });
    } else {
        console.error("computer.js not loaded!");
        cleanupUI();
        if (window.handleComputerMinigameEnd) {
            window.handleComputerMinigameEnd(true, scene, true);
        }
    }
};

window.endComputerMinigameConnector = function(success, scene, skipped) {
    if (window.stopComputerGame) window.stopComputerGame();
};