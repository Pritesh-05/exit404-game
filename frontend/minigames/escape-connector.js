// FIXED escape-connector.js
// Connector for escape minigame to integrate with main game

(function() {
    'use strict';

    let escapeInstance = null;
    let onEscapeEnd = null;
    let escapeGameLoopId = null;

    // Track keys locally to ensure they work independently
    const escapeActiveKeys = {};

    // Canvas context - will be initialized when game starts
    let escapeCtx = null;

    function startEscapeMinigame(scene) {
        console.log("Starting Escape Minigame with scene:", scene);
        
        // === CRITICAL FIX: Force clear ALL overlays and minigames ===
        
        // 1. Clear the canvas completely
        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 2. Remove any lingering overlays (especially neural/instruction overlays)
        document.querySelectorAll('.overlay, .instruction-overlay, .modal').forEach(el => {
            if (el.id !== 'gameCanvas' && el.id !== 'game') {
                console.log("Removing lingering overlay:", el.className || el.id);
                el.style.display = 'none';
                el.remove();
            }
        });
        
        // 3. Search for and remove any element containing "NEURAL LINK"
        document.querySelectorAll('*').forEach(el => {
            if (el.textContent && el.textContent.includes('NEURAL LINK') && 
                el.id !== 'game' && el.id !== 'dialogue-box') {
                console.log("Found and hiding NEURAL LINK overlay:", el);
                el.style.display = 'none';
                el.remove();
            }
        });
        
        // 4. Make absolutely sure canvas is visible and on top
        canvas.style.display = 'block';
        canvas.style.visibility = 'visible';
        canvas.style.zIndex = '50';
        
        // === END CRITICAL FIX ===
        
        // Store scene globally
        window.currentScene = scene;
        
        // Clear keys on start
        for (let key in escapeActiveKeys) delete escapeActiveKeys[key];
        
        // Hide John's hearts container during escape game
        const heartsContainer = document.getElementById('hearts-container');
        if (heartsContainer) {
            heartsContainer.style.display = 'none';
        }
        
        // Always hide dialogue box when starting minigame
        document.getElementById("dialogue-box").style.display = "none";
        
        escapeCtx = canvas.getContext('2d');
        
        // Show canvas
        canvas.classList.remove("hidden");
        
        // Create skip button
        let skipBtn = document.getElementById("skip-btn");
        if (!skipBtn) {
            skipBtn = document.createElement("button");
            skipBtn.id = "skip-btn";
            skipBtn.textContent = "SKIP MINIGAME";
            skipBtn.onclick = () => {
                endEscapeMinigame(true, window.currentScene, true);
            };
            document.getElementById("game").appendChild(skipBtn);
        } else {
            skipBtn.onclick = () => {
                endEscapeMinigame(true, window.currentScene, true);
            };
        }
        skipBtn.style.display = "block";
        
        // Set canvas to FULL WINDOW
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // IMPORTANT: Define global variables that escape.js expects
        if (typeof ESCAPE_UI_WIDTH === 'undefined') {
            window.ESCAPE_UI_WIDTH = 300; // Same as in escape.js
        }
        if (typeof ESCAPE_CELL_SIZE === 'undefined') {
            window.ESCAPE_CELL_SIZE = 40; // Same as in escape.js
        }
        
        // Calculate dimensions
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Set escape dimensions
        if (window.setEscapeDimensions) {
            window.setEscapeDimensions(canvasWidth, canvasHeight);
        } else {
            // Manual setup if function doesn't exist
            window.ESCAPE_GAME_WIDTH = canvasWidth;
            window.ESCAPE_GAME_HEIGHT = canvasHeight;
            
            // Calculate Grid Size
            const availableWidth = window.ESCAPE_GAME_WIDTH - window.ESCAPE_UI_WIDTH - 40;
            const availableHeight = window.ESCAPE_GAME_HEIGHT - 40;
            
            window.ESCAPE_GRID_WIDTH = Math.floor(availableWidth / window.ESCAPE_CELL_SIZE);
            window.ESCAPE_GRID_HEIGHT = Math.floor(availableHeight / window.ESCAPE_CELL_SIZE);
            
            // Make the maze larger
            window.ESCAPE_GRID_WIDTH = Math.max(25, window.ESCAPE_GRID_WIDTH);
            window.ESCAPE_GRID_HEIGHT = Math.max(20, window.ESCAPE_GRID_HEIGHT);
            
            // Make sure dimensions are odd for proper maze generation
            if (window.ESCAPE_GRID_WIDTH % 2 === 0) window.ESCAPE_GRID_WIDTH--;
            if (window.ESCAPE_GRID_HEIGHT % 2 === 0) window.ESCAPE_GRID_HEIGHT--;
            
            console.log("Escape maze dimensions:", window.ESCAPE_GRID_WIDTH, "x", window.ESCAPE_GRID_HEIGHT);
        }
        
        // Reset the instruction flag to ensure countdown shows
        window.escapeInstructionsSeen = false;
        
        // Define callback for escape end
        onEscapeEnd = (success) => {
            endEscapeMinigame(success, scene, false);
        };

        // Create game instance
        if (window.EscapeGame) {
            escapeInstance = new window.EscapeGame();
            console.log("Escape game instance created");
        } else {
            console.error("Escape Game Class not found!");
            endEscapeMinigame(true, scene, true);
            return;
        }
        
        // --- INPUT HANDLERS ---
        
        function handleKeyDown(e) {
            // Track both Code (KeyW) and Key (w)
            escapeActiveKeys[e.code] = true;
            escapeActiveKeys[e.key] = true;
            escapeActiveKeys[e.key.toLowerCase()] = true; 

            // Prevent scrolling with arrows
            if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
                e.preventDefault();
            }
            
            // Escape for Skip
            
            
            // Space for stealth
            if (e.code === 'Space' || e.key === ' ') {
                escapeActiveKeys['Space'] = true;
            }
        }

        function handleKeyUp(e) {
            escapeActiveKeys[e.code] = false;
            escapeActiveKeys[e.key] = false;
            escapeActiveKeys[e.key.toLowerCase()] = false;
            
            // Space for stealth
            if (e.code === 'Space' || e.key === ' ') {
                escapeActiveKeys['Space'] = false;
            }
        }

        function handleResize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Recalculate dimensions
            const newWidth = canvas.width;
            const newHeight = canvas.height;
            
            if (window.setEscapeDimensions) {
                window.setEscapeDimensions(newWidth, newHeight);
            } else {
                window.ESCAPE_GAME_WIDTH = newWidth;
                window.ESCAPE_GAME_HEIGHT = newHeight;
                
                const availableWidth = window.ESCAPE_GAME_WIDTH - window.ESCAPE_UI_WIDTH - 40;
                const availableHeight = window.ESCAPE_GAME_HEIGHT - 40;
                
                window.ESCAPE_GRID_WIDTH = Math.floor(availableWidth / window.ESCAPE_CELL_SIZE);
                window.ESCAPE_GRID_HEIGHT = Math.floor(availableHeight / window.ESCAPE_CELL_SIZE);
                
                window.ESCAPE_GRID_WIDTH = Math.max(25, window.ESCAPE_GRID_WIDTH);
                window.ESCAPE_GRID_HEIGHT = Math.max(20, window.ESCAPE_GRID_HEIGHT);
                
                if (window.ESCAPE_GRID_WIDTH % 2 === 0) window.ESCAPE_GRID_WIDTH--;
                if (window.ESCAPE_GRID_HEIGHT % 2 === 0) window.ESCAPE_GRID_HEIGHT--;
            }
            
            // Recreate game instance with new dimensions
            if (window.EscapeGame) {
                escapeInstance = new window.EscapeGame();
            }
        }

        // Attach Listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('resize', handleResize);
        
        // Store cleanup function
        window.escapeCleanup = function() {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('resize', handleResize);
        };
        
        // Game loop
        function gameLoop() {
            if (!escapeInstance) return;
            
            // Update keys for the escape game
            window.keys = escapeActiveKeys;
            
            // Check win condition
            if (escapeInstance.won && onEscapeEnd) {
                onEscapeEnd(true);
                return;
            }
            
            // Check lose condition
            if (escapeInstance.gameOver && !escapeInstance.won && onEscapeEnd) {
                onEscapeEnd(false);
                return;
            }
            
            // Game Logic
            if (escapeInstance && !escapeInstance.gameOver) {
                escapeInstance.update();
                
                // Clear the canvas
                escapeCtx.fillStyle = window.ESCAPE_THEME ? window.ESCAPE_THEME.BACKGROUND : '#050505';
                escapeCtx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw the game
                escapeInstance.draw(escapeCtx);
            }
            
            escapeGameLoopId = requestAnimationFrame(gameLoop);
        }
        
        // Start loop
        gameLoop();
    }

    function endEscapeMinigame(success, scene, skipped = false) {
        console.log("Ending Escape Minigame, success:", success, "skipped:", skipped);
        
        // Cleanup listeners
        if (window.escapeCleanup) {
            window.escapeCleanup();
            window.escapeCleanup = null;
        }

        // Cancel animation frame
        if (escapeGameLoopId) {
            cancelAnimationFrame(escapeGameLoopId);
            escapeGameLoopId = null;
        }
        
        const canvas = document.getElementById("gameCanvas");
        canvas.classList.add("hidden");

        // Hide skip button
        const skipBtn = document.getElementById("skip-btn");
        if (skipBtn) {
            skipBtn.style.display = "none";
        }

        // Clean up instance
        escapeInstance = null;
        escapeCtx = null;
        
        // Clear canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Show hearts again
        const heartsContainer = document.getElementById('hearts-container');
        if (heartsContainer) {
            heartsContainer.style.display = 'flex';
        }

        // Clear callback
        onEscapeEnd = null;
        
        // Trigger Main Game Handler
        if (window.handleEscapeMinigameEnd) {
            window.handleEscapeMinigameEnd(success, scene, skipped);
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

    window.startEscapeMinigameConnector = startEscapeMinigame; 
    window.endEscapeMinigameConnector = endEscapeMinigame;
    window.stopEscapeGame = function() {
        console.log("Force stopping Escape Minigame...");
        
        // 1. Stop the animation loop
        if (escapeGameLoopId) {
            cancelAnimationFrame(escapeGameLoopId);
            escapeGameLoopId = null;
        }
        
        // 2. Remove event listeners using the stored cleanup function
        if (window.escapeCleanup) {
            window.escapeCleanup();
            window.escapeCleanup = null;
        }

        // 3. Clear the instance
        escapeInstance = null;
        escapeCtx = null;
    };
})();