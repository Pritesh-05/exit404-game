// database.js - Full Database Integration
const API_BASE_URL = 'http://localhost:5000/api';

window.sessionUser = {
    id: null,
    username: null,
    ingameName: "John",
    endings: {}
};

// --- AUTHENTICATION ---
async function loginUser(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.success) {
            window.sessionUser.id = data.user.id;
            window.sessionUser.username = data.user.username;
            window.sessionUser.ingameName = data.user.ingame_name;
            window.sessionUser.endings = typeof data.user.unlocked_endings === 'string' 
                ? JSON.parse(data.user.unlocked_endings) 
                : data.user.unlocked_endings;
            return { success: true };
        }
        return { success: false, message: data.message };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: "Server connection failed." };
    }
}

async function registerUser(username, password, ingameName) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, ingame_name: ingameName })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: "Server connection failed." };
    }
}

// --- SAVES ---
async function saveGameToDB(slotNumber, saveData) {
    if (!window.sessionUser.id) return false;
    try {
        const response = await fetch(`${API_BASE_URL}/save-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_id: window.sessionUser.id,
                slot_number: slotNumber,
                save_data: saveData
            })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Failed to save game:', error);
        return false;
    }
}

async function getUserSavesFromDB() {
    if (!window.sessionUser.id) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/get-saves/${window.sessionUser.id}`);
        const data = await response.json();
        if (data.success) {
            // Convert array of objects to a map of slot -> save_data
            let savesMap = {};
            data.saves.forEach(save => {
                savesMap[save.slot_number] = save.save_data;
            });
            return savesMap;
        }
        return {};
    } catch (error) {
        console.error('Failed to fetch saves:', error);
        return {};
    }
}

async function deleteSaveFromDB(slotNumber) {
    if (!window.sessionUser.id) return false;
    try {
        const response = await fetch(`${API_BASE_URL}/delete-save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                player_id: window.sessionUser.id, 
                slot_number: slotNumber 
            })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Failed to delete save:', error);
        return false;
    }
}

// --- SCORES & ENDINGS ---
async function saveScoreToDB(totalScore, endingType) {
    if (!window.sessionUser.id) return false;
    try {
        const response = await fetch(`${API_BASE_URL}/save-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_id: window.sessionUser.id,
                ingame_name: window.sessionUser.ingameName,
                total_score: totalScore,
                ending_type: endingType
            })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Failed to save score:', error);
        return false;
    }
}

async function updateEndingsInDB(newEndingsObj) {
    if (!window.sessionUser.id) return false;
    try {
        const response = await fetch(`${API_BASE_URL}/update-endings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_id: window.sessionUser.id,
                endings: newEndingsObj
            })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Failed to update endings:', error);
        return false;
    }
}

async function getLeaderboardFromDB() {
    try {
        const response = await fetch(`${API_BASE_URL}/leaderboard`);
        const data = await response.json();
        return data.success ? data.leaderboard : [];
    } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        return [];
    }
}

// Make functions globally available
window.loginUser = loginUser;
window.registerUser = registerUser;
window.saveGameToDB = saveGameToDB;
window.getUserSavesFromDB = getUserSavesFromDB;
window.deleteSaveFromDB = deleteSaveFromDB;
window.saveScoreToDB = saveScoreToDB;
window.updateEndingsInDB = updateEndingsInDB;
window.getLeaderboardFromDB = getLeaderboardFromDB;