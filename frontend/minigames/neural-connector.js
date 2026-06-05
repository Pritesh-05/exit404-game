// neural-connector.js
{
    // WRAP EVERYTHING IN THESE BRACES TO CREATE A PRIVATE SCOPE
    
    let neuralInstance = null;
    let onNeuralEnd = null;
    let neuralGameLoopId = null;
    let skipBtn = null;
    let neuralEndTriggered = false;

    // Internal start function
    function startNeuralMinigameInternal(scene) {
        console.log("Starting Neural Sync Game...");
        
        window.currentScene = scene;
        neuralEndTriggered = false;
        
        const dialogueBox = document.getElementById("dialogue-box");
        if (dialogueBox) dialogueBox.style.display = "none";
        
        // FORCE HEARTS DISPLAY
        const heartsContainer = document.getElementById('hearts-container');
        if (heartsContainer) {
            heartsContainer.style.display = 'flex';
        }

        const canvas = document.getElementById("gameCanvas");
        canvas.classList.remove("hidden");
        
        // SKIP BUTTON LOGIC
        let existingSkipBtn = document.getElementById("skip-btn");
        if (!existingSkipBtn) {
            existingSkipBtn = document.createElement("button");
            existingSkipBtn.id = "skip-btn";
            existingSkipBtn.textContent = "SKIP MINIGAME";
            document.getElementById("game").appendChild(existingSkipBtn);
        }
        
        // Update the onclick and reference
        skipBtn = existingSkipBtn;
        skipBtn.onclick = () => endNeuralMinigame(true, window.currentScene, true); // PASS TRUE
        skipBtn.style.display = "block";
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // CALLBACK
        onNeuralEnd = (success) => {
            if (!neuralEndTriggered) {
                neuralEndTriggered = true;
                setTimeout(() => {
                    endNeuralMinigame(success, scene, false);
                }, 1500);
            }
        };

        // RESIZE HANDLER
        function handleResize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (neuralInstance) {
                neuralInstance.width = canvas.width;
                neuralInstance.height = canvas.height;
                neuralInstance.canvas.width = canvas.width;
                neuralInstance.canvas.height = canvas.height;
            }
        }
        window.addEventListener('resize', handleResize);
        window.neuralResizeHandler = handleResize;
        
        // INIT GAME
        if (window.NeuralGame) {
            neuralInstance = new window.NeuralGame(canvas.width, canvas.height);
        } else {
            console.error("NeuralGame Class not found! Check neural-game.js loading.");
            endNeuralMinigame(true, scene, true); 
            return;
        }
        
        // INPUT HANDLER
        function handleKeyDown(e) {
             // PASS TRUE
            
            if (e.code === 'Space' && neuralInstance) {
                e.preventDefault();
                neuralInstance.handleInput('Space');
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        window.neuralKeyHandler = handleKeyDown;
        
        // LOOP
        function gameLoop() {
            if (!neuralInstance) return;
            
            if (neuralInstance.gameState === "victory" && !neuralEndTriggered) {
                onNeuralEnd(true);
            } else if (neuralInstance.gameState === "gameover" && !neuralEndTriggered) {
                onNeuralEnd(false);
            }
            
            neuralInstance.update();
            neuralInstance.draw();
            
            neuralGameLoopId = requestAnimationFrame(gameLoop);
        }
        
        gameLoop();
    }

    function endNeuralMinigame(success, scene, skipped = false) {
        if (neuralGameLoopId) {
            cancelAnimationFrame(neuralGameLoopId);
            neuralGameLoopId = null;
        }
        
        // CLEANUP LISTENERS
        if (window.neuralResizeHandler) {
            window.removeEventListener('resize', window.neuralResizeHandler);
            window.neuralResizeHandler = null;
        }
        if (window.neuralKeyHandler) {
            window.removeEventListener('keydown', window.neuralKeyHandler);
            window.neuralKeyHandler = null;
        }
        
        // CLEANUP INSTANCE
        if (neuralInstance && neuralInstance.destroy) {
            neuralInstance.destroy();
        }
        neuralInstance = null;

        const canvas = document.getElementById("gameCanvas");
        canvas.classList.add("hidden");
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Hide local reference to skip button
        if (skipBtn) skipBtn.style.display = "none";
        
        const heartsContainer = document.getElementById('hearts-container');
        if (heartsContainer) heartsContainer.style.display = 'flex';

        if (window.handleNeuralMinigameEnd) {
            // PASS SKIPPED FLAG
            window.handleNeuralMinigameEnd(success, scene, skipped);
        } else {
            if (success) {
                document.getElementById("dialogue-box").style.display = 'block';
                if (window.index !== undefined) {
                    window.index++;
                    localStorage.setItem("progress", window.index);
                    if (window.showScene) window.showScene();
                }
            } else {
                setTimeout(() => startNeuralMinigameInternal(scene), 100);
            }
        }
    }

    // EXPORT FUNCTIONS TO WINDOW
    // This connects the private functions inside this block to the global scope
    window.startNeuralMinigameConnector = startNeuralMinigameInternal;
    window.endNeuralMinigameConnector = endNeuralMinigame;
}