window.startSecurityMinigameConnector = function(scene) {
    console.log("Initializing Security System Stabilizer (Full Screen)...");

    const canvas = document.getElementById('gameCanvas');
    const skipBtn = document.getElementById('skip-btn'); 

    if (!canvas) {
        console.error("Critical Error: 'gameCanvas' element not found in DOM.");
        if (window.handleSecurityMinigameEnd) {
            window.handleSecurityMinigameEnd(true, scene, false);
        }
        return;
    }

    // 1. Force Full Screen Dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 2. Show Canvas
    canvas.classList.remove('hidden');
    canvas.style.display = 'block';

    // 3. Show Skip Button
    if (skipBtn) {
        skipBtn.style.display = "block"; 
        
        // Define what happens when Skip is clicked
        skipBtn.onclick = function() {
            console.log("Skipping Security Minigame...");
            
            // --- FIXED: FORCE STOP THE GAME LOGIC ---
            if (window.stopSecurityGame) {
                window.stopSecurityGame();
            }

            // Cleanup UI
            canvas.style.display = 'none';
            canvas.classList.add('hidden');
            skipBtn.style.display = "none"; // Hide button immediately
            
            // Report SKIP to main script (success=true, skipped=true)
            if (window.handleSecurityMinigameEnd) {
                window.handleSecurityMinigameEnd(true, scene, true);
            }
        };
    }

    // 4. Ensure Hearts UI is visible
    const hearts = document.getElementById('hearts-container');
    if (hearts) hearts.style.display = 'flex'; 

    // 5. Start Game
    if (window.startSecurityGame) {
        window.startSecurityGame('gameCanvas', function(success) {
            console.log(`Security Game Finished. Result: ${success ? "SUCCESS" : "FAILURE"}`);
            
            // Cleanup UI
            canvas.style.display = 'none';
            canvas.classList.add('hidden');
            
            // Hide Skip button (in case they finished normally)
            if (skipBtn) skipBtn.style.display = "none"; 
            
            if (window.handleSecurityMinigameEnd) {
                // success, scene, skipped=false
                window.handleSecurityMinigameEnd(success, scene, false);
            }
        });
    } else {
        console.error("security.js is not loaded! Check your HTML script tags.");
        // Fallback cleanup
        if (skipBtn) skipBtn.style.display = "none";
        if (window.handleSecurityMinigameEnd) {
            window.handleSecurityMinigameEnd(true, scene, false);
        }
    }
};