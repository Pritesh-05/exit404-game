// minigames/biometric_hack-connector.js

window.startBiometricMinigameConnector = function(scene) {
    console.log("Initializing Biometric Hack...");

    // 1. CLAIM THE SCENE
    // We mark this as the active scene. If the user skips or the script auto-advances,
    // this variable will change, allowing us to abort the game start.
    window.currentScene = scene;

    const canvas = document.getElementById('gameCanvas');
    const controls = document.getElementById('controls-container');
    const dialogueBox = document.getElementById('dialogue-box');

    if (!canvas) {
        console.error("Critical: Canvas not found!");
        return;
    }

    // Hide Main Game UI
    if (controls) controls.style.display = 'none';
    if (dialogueBox) dialogueBox.style.display = 'none';
    
    // Show Canvas & Hearts
    canvas.classList.remove('hidden');
    canvas.style.display = 'block';
    
    const hearts = document.getElementById('hearts-container');
    if (hearts) hearts.style.display = 'flex';

    // Cleanup Function
    function cleanupUI() {
        canvas.style.display = 'none';
        canvas.classList.add('hidden');
        
        if (controls) controls.style.display = 'flex';
        if (dialogueBox) dialogueBox.style.display = 'block';
    }

    // 2. START GAME WITH SAFEGUARD
    setTimeout(() => {
        // --- CRITICAL RACE CONDITION FIX ---
        // Check if the scene changed while we were waiting in the timeout.
        if (window.currentScene !== scene) {
            console.warn("Biometric Connector: Scene changed during load delay. Aborting start.");
            return;
        }

        if (window.startBiometricGame) {
            console.log("Starting Biometric Hack Game...");
            window.startBiometricGame('gameCanvas', function(success) {
                cleanupUI();
                if (window.handleBiometricMinigameEnd) {
                    window.handleBiometricMinigameEnd(success, scene, false);
                }
            });
        } else {
            console.error("biometric_hack.js not loaded!");
            cleanupUI();
            // If file missing, skip automatically
            if (window.handleBiometricMinigameEnd) {
                window.handleBiometricMinigameEnd(true, scene, true);
            }
        }
    }, 100);
};