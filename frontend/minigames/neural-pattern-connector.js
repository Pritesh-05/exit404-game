{
    // --- PRIVATE SCOPE START ---
    // We wrap everything in braces to prevent 'skipBtn' from crashing the game
    // because it's already defined in other files.

    let patternInstance = null;
    let onPatternEnd = null;
    let patternLoopId = null;
    let skipBtn = null;
    let patternEndTriggered = false;

    function startNeuralPatternMinigame(scene) {
        console.log("Starting Neural Pattern Game...");
        
        window.currentScene = scene;
        patternEndTriggered = false;
        
        // UI Setup
        const dialogueBox = document.getElementById("dialogue-box");
        if (dialogueBox) dialogueBox.style.display = "none";
        
        const heartsContainer = document.getElementById('hearts-container');
        if (heartsContainer) heartsContainer.style.display = 'flex';

        const canvas = document.getElementById("gameCanvas");
        canvas.classList.remove("hidden");
        
        // Canvas Sizing
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Skip Button Logic
        let existingSkipBtn = document.getElementById("skip-btn");
        if (!existingSkipBtn) {
            existingSkipBtn = document.createElement("button");
            existingSkipBtn.id = "skip-btn";
            existingSkipBtn.textContent = "SKIP MINIGAME";
            document.getElementById("game").appendChild(existingSkipBtn);
        }
        skipBtn = existingSkipBtn;
        skipBtn.onclick = () => endNeuralPatternMinigame(true, window.currentScene, true);
        skipBtn.style.display = "block";
        
        // Setup Callback
        onPatternEnd = (success) => {
            if (!patternEndTriggered) {
                patternEndTriggered = true;
                // Short delay to show victory/defeat screen
                setTimeout(() => {
                    endNeuralPatternMinigame(success, scene, false);
                }, 2000);
            }
        };

        // Initialize Game Class
        if (window.SecurityPuzzle) {
            patternInstance = new window.SecurityPuzzle(canvas.width, canvas.height);
        } else {
            console.error("SecurityPuzzle class not found!");
            endNeuralPatternMinigame(true, scene, true);
            return;
        }

        // Input Handling
        function handleResize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (patternInstance) {
                patternInstance.width = canvas.width;
                patternInstance.height = canvas.height;
                // Re-center grid if needed
                patternInstance.gridX = (canvas.width - patternInstance.gridSize * patternInstance.cellSize) / 2;
                patternInstance.gridY = (canvas.height - patternInstance.gridSize * patternInstance.cellSize) / 2 + 20;
            }
        }
        window.addEventListener('resize', handleResize);
        window.patternResize = handleResize;

        function handleClick(e) {
            if (!patternInstance) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            patternInstance.handleClick(x, y);
        }
        canvas.addEventListener('mousedown', handleClick);
        window.patternClick = handleClick;

        function handleKeyDown(e) {
          
            if (e.code === 'Space' && patternInstance) {
                // Retry logic if in verify state
                if (patternInstance.state === 'verify' && patternInstance.lives > 0) {
                    patternInstance.generatePuzzle();
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        window.patternKey = handleKeyDown;

        // Game Loop
        function gameLoop() {
            if (!patternInstance) return;

            // Check End States
            if (patternInstance.state === "victory" && !patternEndTriggered) {
                onPatternEnd(true);
            } else if (patternInstance.state === "game_over" && !patternEndTriggered) {
                onPatternEnd(false);
            }

            patternInstance.update();
            const ctx = canvas.getContext('2d');
            patternInstance.draw(ctx);
            
            patternLoopId = requestAnimationFrame(gameLoop);
        }
        
        gameLoop();
    }

    function endNeuralPatternMinigame(success, scene, skipped = false) {
        if (patternLoopId) {
            cancelAnimationFrame(patternLoopId);
            patternLoopId = null;
        }
        
        // Cleanup Listeners
        if (window.patternResize) window.removeEventListener('resize', window.patternResize);
        if (window.patternKey) window.removeEventListener('keydown', window.patternKey);
        
        const canvas = document.getElementById("gameCanvas");
        if (window.patternClick) canvas.removeEventListener('mousedown', window.patternClick);
        
        canvas.classList.add("hidden");
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (skipBtn) skipBtn.style.display = "none";
        patternInstance = null;

        if (window.handleNeuralPatternEnd) {
            window.handleNeuralPatternEnd(success, scene, skipped);
        } else {
            // Fallback
            if (success) {
                document.getElementById("dialogue-box").style.display = 'block';
                if (window.index !== undefined) {
                    window.index++;
                    // Optional: Save progress here if needed
                    if (window.showScene) window.showScene();
                }
            } else {
                 location.reload();
            }
        }
    }

    // --- EXPORT FUNCTIONS (CRITICAL FIX) ---
    // We attach these to 'window' so script.js can see them.
    // Notice the names now match what script.js expects.
    window.startNeuralPatternMinigameConnector = startNeuralPatternMinigame;
    window.endNeuralPatternMinigameConnector = endNeuralPatternMinigame;

    // --- PRIVATE SCOPE END ---
}