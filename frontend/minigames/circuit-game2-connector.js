// circuit-game2-connector.js
// Connector for Door Override game

let circuit2Instance = null;
let onCircuit2End = null;
let circuit2GameLoopId = null;
let skipBtn = null;
let endTriggered = false; // Prevents multiple end calls

function startCircuit2Minigame(scene) {
    console.log("Starting Circuit Game 2 (Door Override) with scene:", scene);
    
    window.currentScene = scene;
    endTriggered = false; // Reset trigger
    
    // Hide Dialogue Box
    document.getElementById("dialogue-box").style.display = "none";

    // Show Hearts
    const heartsContainer = document.getElementById('hearts-container');
    if (heartsContainer) {
        heartsContainer.style.display = 'flex';
    }

    const canvas = document.getElementById("gameCanvas");
    canvas.classList.remove("hidden");
    
    // Create skip button
    skipBtn = document.getElementById("skip-btn");
    if (!skipBtn) {
        skipBtn = document.createElement("button");
        skipBtn.id = "skip-btn";
        skipBtn.textContent = "SKIP MINIGAME";
        skipBtn.onclick = () => {
            // PASS TRUE FOR SKIPPED
            endCircuit2Minigame(true, window.currentScene, true);
        };
        document.getElementById("game").appendChild(skipBtn);
    } else {
        skipBtn.onclick = () => {
            // PASS TRUE FOR SKIPPED
            endCircuit2Minigame(true, window.currentScene, true);
        };
        skipBtn.style.display = "block";
    }
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    onCircuit2End = (success) => {
        if (!endTriggered) {
            endTriggered = true;
            endCircuit2Minigame(success, scene, false);
        }
    };

    let resizeHandler;
    function handleResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (circuit2Instance) {
            circuit2Instance.width = canvas.width;
            circuit2Instance.height = canvas.height;
        }
    }
    window.addEventListener('resize', handleResize);
    resizeHandler = handleResize;
    
    circuit2Instance = new DoorOverrideGame(canvas.width, canvas.height);
    

    
    function gameLoop() {
        if (!circuit2Instance) return;
        
        // Check win condition
        if (circuit2Instance.currentState === circuit2Instance.STATE.WIN && !endTriggered) {
            onCircuit2End(true);
            cleanupListeners();
            return;
        }
        
        // Check lose condition with delay
        if (circuit2Instance.currentState === circuit2Instance.STATE.LOSE && !endTriggered) {
            endTriggered = true; 
            
            // Wait 2 seconds (2000ms) showing the "Lose Screen" before actually ending
            setTimeout(() => {
                endCircuit2Minigame(false, scene, false);
                cleanupListeners();
            }, 2000);
            
            return; 
        }
        
        circuit2Instance.update();
        circuit2Instance.draw();
        
        circuit2GameLoopId = requestAnimationFrame(gameLoop);
    }
    
    function cleanupListeners() {
        if (resizeHandler) window.removeEventListener('resize', resizeHandler);

    }
    
    gameLoop();
}

function endCircuit2Minigame(success, scene, skipped = false) {
    console.log("Ending Circuit Game 2, success:", success, "scene:", scene, "skipped:", skipped);
    
    if (circuit2GameLoopId) {
        cancelAnimationFrame(circuit2GameLoopId);
        circuit2GameLoopId = null;
    }
    
    const canvas = document.getElementById("gameCanvas");
    canvas.classList.add("hidden");

    if (skipBtn) skipBtn.style.display = "none";
    
    circuit2Instance = null;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const heartsContainer = document.getElementById('hearts-container');
    if (heartsContainer) heartsContainer.style.display = 'flex';

    onCircuit2End = null;
    
    if (window.handleCircuit2MinigameEnd) {
        // PASS SKIPPED FLAG
        window.handleCircuit2MinigameEnd(success, scene, skipped);
    } else {
        if (success) {
            document.getElementById("dialogue-box").style.display = 'block';
            if (window.index !== undefined) {
                window.index++;
                localStorage.setItem("progress", window.index);
                if (window.showScene) window.showScene();
            }
        } else {
            // If failed, reload to retry
            setTimeout(() => {
                startCircuit2Minigame(scene);
            }, 1000);
        }
    }
}

window.startCircuit2MinigameConnector = startCircuit2Minigame;
window.endCircuit2MinigameConnector = endCircuit2Minigame;