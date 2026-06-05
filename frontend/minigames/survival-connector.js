// minigames/survival-connector.js

window.startSurvivalMinigameConnector = function(scene) {
    console.log("Starting Survival Protocol...");

    const canvas = document.getElementById('gameCanvas');
    // Grab the UI elements that cause conflicts
    const controls = document.getElementById('controls-container');
    const dialogueBox = document.getElementById('dialogue-box');

    if (!canvas) {
        console.error("Canvas not found!");
        return;
    }

    // 1. DYNAMIC SKIP BUTTON
    let skipBtn = document.getElementById('skip-btn');
    if (!skipBtn) {
        skipBtn = document.createElement('button');
        skipBtn.id = 'skip-btn';
        skipBtn.innerText = 'SKIP MINIGAME';
        skipBtn.className = 'control-btn';
        skipBtn.style.position = 'absolute';
        skipBtn.style.top = '20px';
        skipBtn.style.right = '20px';
        skipBtn.style.zIndex = '1000';
        document.body.appendChild(skipBtn);
    }

    // 2. PREVENT "SPACE BAR" CONFLICT
    if (controls) controls.style.display = 'none';
    if (dialogueBox) dialogueBox.style.display = 'none';

    // 3. SETUP CANVAS
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.classList.remove('hidden');
    canvas.style.display = 'block';

    // 4. SHOW SKIP BUTTON AND BLUR FOCUS
    skipBtn.style.display = "block";
    
    // --- CRITICAL FIX: REMOVE FOCUS FROM BUTTONS ---
    // This prevents "Space" from triggering a click on the button
    if (document.activeElement) {
        document.activeElement.blur();
    }
    // -----------------------------------------------

    function cleanupUI() {
        canvas.style.display = 'none';
        canvas.classList.add('hidden');
        skipBtn.style.display = "none";
        
        // RESTORE CONTROLS
        if (controls) controls.style.display = 'flex';
        if (dialogueBox) dialogueBox.style.display = 'block';
    }

    skipBtn.onclick = function() {
        cleanupUI();
        // Report SKIP to main script
        if (window.handleSurvivalMinigameEnd) {
            window.handleSurvivalMinigameEnd(true, scene, true);
        }
    };

    // 5. ENSURE HEARTS VISIBLE
    const hearts = document.getElementById('hearts-container');
    if (hearts) hearts.style.display = 'flex';

    // 6. START GAME
    if (window.startSurvivalGame) {
        window.startSurvivalGame('gameCanvas', function(success) {
            cleanupUI();
            
            // Report result to main script
            if (window.handleSurvivalMinigameEnd) {
                window.handleSurvivalMinigameEnd(success, scene, false);
            }
        });
    } else {
        console.error("survival.js not loaded!");
        alert("Error: minigames/survival.js is missing or has a syntax error.");
        if (controls) controls.style.display = 'flex';
    }
};