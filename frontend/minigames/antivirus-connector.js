// minigames/antivirus-connector.js

window.startAntivirusMinigameConnector = function(scene) {
    console.log("Initializing Antivirus Protocol...");

    // 1. CLAIM THE SCENE
    window.currentScene = scene;

    const canvas = document.getElementById('gameCanvas');
    const controls = document.getElementById('controls-container');
    const dialogueBox = document.getElementById('dialogue-box');

    if (!canvas) {
        console.error("Critical: Canvas not found!");
        return;
    }

    // 2. FORCE CANVAS VISIBILITY
    canvas.classList.remove('hidden');
    canvas.style.display = 'block';

    // 3. UI SETUP
    if (controls) controls.style.display = 'none';
    if (dialogueBox) dialogueBox.style.display = 'none';
    
    // Ensure hearts are visible
    const hearts = document.getElementById('hearts-container');
    if (hearts) hearts.style.display = 'flex';

    function cleanupUI() {
        canvas.style.display = 'none';
        canvas.classList.add('hidden');
        
        if (controls) controls.style.display = 'flex';
        if (dialogueBox) dialogueBox.style.display = 'block';
    }

    // --- NEW FIX: IN-GAME SKIP INTERCEPTOR ---
    let skipBtn = document.getElementById('skip-btn');
    if (!skipBtn) {
        skipBtn = document.createElement('button');
        skipBtn.id = 'skip-btn';
        skipBtn.style.display = 'none'; // Keep hidden, let the global UI skip button click it
        document.body.appendChild(skipBtn);
    }
    
    skipBtn.onclick = function() {
        if (window.stopAntivirusGame) window.stopAntivirusGame();
        cleanupUI();
        if (window.handleAntivirusMinigameEnd) {
            window.handleAntivirusMinigameEnd(true, scene, true);
        }
    };
    // -----------------------------------------

    // 4. START GAME
    requestAnimationFrame(() => {
        if (window.startAntivirusGame) {
            window.startAntivirusGame('gameCanvas', function(success) {
                cleanupUI();
                if (window.handleAntivirusMinigameEnd) {
                    window.handleAntivirusMinigameEnd(success, scene, false);
                }
            });
        } else {
            console.error("antivirus.js not loaded!");
            cleanupUI();
            if (window.handleAntivirusMinigameEnd) {
                window.handleAntivirusMinigameEnd(true, scene, true);
            }
        }
    });
};