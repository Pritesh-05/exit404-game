// maze-connector.js
// Connector for maze minigame to integrate with main game

let mazeInstance = null;
let onMazeEnd = null;
let mazeGameLoopId = null;

// Track keys locally to ensure they work independently
const activeKeys = {};

function startMazeMinigame(scene) {
    console.log("Starting Maze Minigame with scene:", scene);
    
    // Store scene globally
    window.currentScene = scene;
    
    // Clear keys on start
    for (let key in activeKeys) delete activeKeys[key];
    
    // Hide John's hearts container during maze game
    const heartsContainer = document.getElementById('hearts-container');
    if (heartsContainer) {
        heartsContainer.style.display = 'none';
    }
    
    // Always hide dialogue box when starting minigame
    document.getElementById("dialogue-box").style.display = "none";

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext('2d');
    
    // Show canvas
    canvas.classList.remove("hidden");
    
    // Create skip button
    let skipBtn = document.getElementById("skip-btn");
    if (!skipBtn) {
        skipBtn = document.createElement("button");
        skipBtn.id = "skip-btn";
        skipBtn.textContent = "SKIP MINIGAME";
        skipBtn.onclick = () => {
            // PASS TRUE FOR SKIPPED
            endMazeMinigame(true, window.currentScene, true);
        };
        document.getElementById("game").appendChild(skipBtn);
    } else {
        skipBtn.onclick = () => {
            // PASS TRUE FOR SKIPPED
            endMazeMinigame(true, window.currentScene, true);
        };
    }
    skipBtn.style.display = "block";
    
    // Set canvas to FULL WINDOW
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Set maze dimensions to full window
    if (window.setMazeDimensions) {
        window.setMazeDimensions(canvas.width, canvas.height);
    }
    
    // Define callback for maze end
    onMazeEnd = (success) => {
        endMazeMinigame(success, scene, false);
    };

    // Create game instance
    if (window.MazeGame) {
        mazeInstance = new window.MazeGame();
    } else {
        console.error("Maze Game Class not found!");
        endMazeMinigame(true, scene, true); // Fallback skip
        return;
    }
    
    // --- INPUT HANDLERS ---
    
    function handleKeyDown(e) {
        // Track both Code (KeyW) and Key (w)
        activeKeys[e.code] = true;
        activeKeys[e.key] = true;
        activeKeys[e.key.toLowerCase()] = true; 

        // Prevent scrolling with arrows
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
            e.preventDefault();
        }
        
        // Escape for Skip
        
    }

    function handleKeyUp(e) {
        activeKeys[e.code] = false;
        activeKeys[e.key] = false;
        activeKeys[e.key.toLowerCase()] = false;
    }

    function handleResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (window.setMazeDimensions) {
            window.setMazeDimensions(canvas.width, canvas.height);
        }
        if (mazeInstance) mazeInstance = new window.MazeGame();
    }

    // Attach Listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    
    // Store cleanup function
    window.mazeCleanup = function() {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('resize', handleResize);
    };
    
    // Game loop
    function gameLoop() {
        if (!mazeInstance) return;
        
        // Check win condition
        if (mazeInstance.won && onMazeEnd) {
            onMazeEnd(true);
            return;
        }
        
        // Check lose condition
        if (mazeInstance.gameOver && !mazeInstance.won && onMazeEnd) {
            onMazeEnd(false);
            return;
        }
        
        // Game Logic
        if (mazeInstance && !mazeInstance.gameOver) {
            let dx = 0;
            let dy = 0;

            if (activeKeys['ArrowLeft'] || activeKeys['KeyA'] || activeKeys['a']) dx = -1;
            if (activeKeys['ArrowRight'] || activeKeys['KeyD'] || activeKeys['d']) dx = 1;
            if (activeKeys['ArrowUp'] || activeKeys['KeyW'] || activeKeys['w']) dy = -1;
            if (activeKeys['ArrowDown'] || activeKeys['KeyS'] || activeKeys['s']) dy = 1;

            if (dx !== 0 && dy !== 0) {
                dx *= 0.7071;
                dy *= 0.7071;
            }

            if (dx !== 0 || dy !== 0) {
                mazeInstance.movePlayer(dx, dy);
            }

            mazeInstance.update();
            mazeInstance.draw(ctx);
        }
        
        mazeGameLoopId = requestAnimationFrame(gameLoop);
    }
    
    // Start loop
    gameLoop();
}

function endMazeMinigame(success, scene, skipped = false) {
    console.log("Ending Maze Minigame, success:", success, "skipped:", skipped);
    
    // cleanup listeners
    if (window.mazeCleanup) {
        window.mazeCleanup();
        window.mazeCleanup = null;
    }

    // Cancel animation frame
    if (mazeGameLoopId) {
        cancelAnimationFrame(mazeGameLoopId);
        mazeGameLoopId = null;
    }
    
    const canvas = document.getElementById("gameCanvas");
    canvas.classList.add("hidden");

    // Hide skip button
    const skipBtn = document.getElementById("skip-btn");
    if (skipBtn) {
        skipBtn.style.display = "none";
    }

    // Clean up instance
    mazeInstance = null;
    
    // Clear canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Show hearts again
    const heartsContainer = document.getElementById('hearts-container');
    if (heartsContainer) {
        heartsContainer.style.display = 'flex';
    }

    // Clear callback
    onMazeEnd = null;
    
    // Trigger Main Game Handler
    if (window.handleMazeMinigameEnd) {
        window.handleMazeMinigameEnd(success, scene, skipped);
    } else {
        if (success) {
            document.getElementById("dialogue-box").style.display = 'block';
            if (window.index !== undefined) {
                window.index++;
                localStorage.setItem("progress", window.index);
                if (window.showScene) window.showScene();
            }
        } else {
             location.reload();
        }
    }
}

window.startMazeMinigameConnector = startMazeMinigame; 
window.endMazeMinigameConnector = endMazeMinigame;
window.stopMazeGame = function() {
    console.log("Force stopping Maze Minigame...");
    
    // 1. Stop the animation loop
    if (mazeGameLoopId) {
        cancelAnimationFrame(mazeGameLoopId);
        mazeGameLoopId = null;
    }
    
    // 2. Remove event listeners using the stored cleanup function
    if (window.mazeCleanup) {
        window.mazeCleanup();
        window.mazeCleanup = null;
    }

    // 3. Clear the instance
    mazeInstance = null;
};