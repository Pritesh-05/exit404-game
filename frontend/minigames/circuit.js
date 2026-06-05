// Use window object to avoid conflicts
window.circuitInstance = window.circuitInstance || null;
window.onCircuitEnd = window.onCircuitEnd || null;

function startCircuitMinigame(scene) {
    console.log("Starting Circuit Minigame with scene:", scene);
    
    // IMPORTANT: Store the scene globally so the skip handler can access it
    window.currentScene = scene;
    
    // Always hide dialogue box when starting minigame
    document.getElementById("dialogue-box").style.display = "none";

    const canvas = document.getElementById("gameCanvas");
    canvas.classList.remove("hidden");
    
    // Create skip button (only if it doesn't exist)
    let skipBtn = document.getElementById("skip-btn");
    if (!skipBtn) {
        skipBtn = document.createElement("button");
        skipBtn.id = "skip-btn";
        skipBtn.textContent = "SKIP MINIGAME (ESC)";
        skipBtn.onclick = () => {
            console.log("Skip button clicked");
            // PASS TRUE FOR SKIPPED
            endCircuitMinigame(true, window.currentScene, true); 
        };
        document.getElementById("game").appendChild(skipBtn);
    } else {
        // Update existing skip button's onclick
        skipBtn.onclick = () => {
            console.log("Skip button clicked");
            // PASS TRUE FOR SKIPPED
            endCircuitMinigame(true, window.currentScene, true); 
        };
    }
    skipBtn.style.display = "block";

    // Clear any previous callback
    onCircuitEnd = null;
    
    // Set new callback
    onCircuitEnd = (success) => {
        console.log("Circuit game ended with success:", success);
        endCircuitMinigame(success, window.currentScene, false);
    };

    // Clean up any previous instance
    if (circuitInstance) {
        circuitInstance.cleanup();
        circuitInstance = null;
    }
    
    // Create new instance
    circuitInstance = new CircuitGame();
    circuitInstance.startGame();
    
    // Force resize to ensure proper dimensions
    setTimeout(() => {
        if (circuitInstance && circuitInstance.resize) {
            circuitInstance.resize();
        }
    }, 100);
}

function endCircuitMinigame(success, scene, skipped = false) {
    console.log("Ending Circuit Minigame, success:", success, "scene:", scene, "skipped:", skipped);
    
    // Clear the stored scene
    window.currentScene = null;
    
    // Hide canvas
    const canvas = document.getElementById("gameCanvas");
    canvas.classList.add("hidden");

    // Hide skip button
    const skipBtn = document.getElementById("skip-btn");
    if (skipBtn) {
        skipBtn.style.display = "none";
    }

    // IMPORTANT: clear game instance and cleanup
    if (circuitInstance) {
        circuitInstance.cleanup();
        circuitInstance = null;
    }
    
    // Clear global callback
    onCircuitEnd = null;

    // Call script.js handler with scene parameter
    if (window.handleCircuitMinigameEnd) {
        console.log("Calling handleCircuitMinigameEnd with success:", success, "scene:", scene);
        // PASS SKIPPED FLAG
        window.handleCircuitMinigameEnd(success, scene, skipped);
    } else {
        console.log("handleCircuitMinigameEnd not found, using fallback");
        // Fallback if handler not available
        if (success) {
            // Show dialogue box again for story continuation
            document.getElementById("dialogue-box").style.display = "block";
            
            // IMPORTANT: Move past the minigame scene
            if (window.index !== undefined) {
                window.index++;
                localStorage.setItem("progress", window.index);
                if (window.showScene) {
                    window.showScene();
                }
            }
        } else {
            // Retry same minigame
            startCircuitMinigame(scene);
        }
    }
}

// Export function for script.js
window.startCircuitMinigameConnector = startCircuitMinigame;