# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import json

app = Flask(__name__)
CORS(app) 

# Database configuration - UPDATE PASSWORD AS NEEDED!
db_config = {
    'host': 'localhost',
    'user': 'root',  
    'password': 'Rit@2004', 
    'database': 'exit404_game'
}

def init_database():
    """Initialize database with the updated schema for user isolation"""
    try:
        conn = mysql.connector.connect(
            host=db_config['host'],
            user=db_config['user'],
            password=db_config['password']
        )
        cursor = conn.cursor()
        
        cursor.execute("CREATE DATABASE IF NOT EXISTS exit404_game")
        cursor.execute("USE exit404_game")
        
        # 1. Players Table (Accounts & Endings)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS players (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                ingame_name VARCHAR(50) NOT NULL,
                unlocked_endings TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 2. Scores Table (Linked to Player)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                player_id INT NOT NULL,
                ingame_name VARCHAR(50) NOT NULL,
                total_score INT DEFAULT 0,
                ending_type VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
            )
        ''')

        # 3. Game Saves Table (User-Specific Slots)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS game_saves (
                id INT AUTO_INCREMENT PRIMARY KEY,
                player_id INT NOT NULL,
                slot_number INT NOT NULL,
                save_data JSON NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_slot (player_id, slot_number),
                FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
            )
        ''')
        
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Database initialized successfully!")
        return True
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        return False

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    ingame_name = data.get('ingame_name', '').strip()

    if not username or not password or not ingame_name:
        return jsonify({'success': False, 'message': 'All fields are required'}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        # Default empty endings JSON string
        default_endings = json.dumps({"ending1": False, "ending2": False, "ending3": False, "ending4": False})
        
        cursor.execute("INSERT INTO players (username, password, ingame_name, unlocked_endings) VALUES (%s, %s, %s, %s)", 
                       (username, password, ingame_name, default_endings))
        conn.commit()
        return jsonify({'success': True, 'message': 'Registration successful!'})
    except mysql.connector.Error as err:
        return jsonify({'success': False, 'message': 'Username already exists or database error'}), 400
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username, ingame_name, unlocked_endings FROM players WHERE username = %s AND password = %s", 
                       (username, password))
        user = cursor.fetchone()
        
        if user:
            # Parse unlocked_endings if it's a string
            if isinstance(user['unlocked_endings'], str):
                user['unlocked_endings'] = json.loads(user['unlocked_endings'])
            return jsonify({'success': True, 'user': user})
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/update-endings', methods=['POST'])
def update_endings():
    data = request.json
    player_id = data.get('player_id')
    endings = data.get('endings')

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("UPDATE players SET unlocked_endings = %s WHERE id = %s", 
                       (json.dumps(endings), player_id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/save-game', methods=['POST'])
def save_game():
    data = request.json
    player_id = data.get('player_id')
    slot_number = data.get('slot_number')
    save_data = data.get('save_data')

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Upsert logic (Insert or Update if slot exists for this user)
        query = """
            INSERT INTO game_saves (player_id, slot_number, save_data) 
            VALUES (%s, %s, %s) 
            ON DUPLICATE KEY UPDATE save_data = VALUES(save_data)
        """
        cursor.execute(query, (player_id, slot_number, json.dumps(save_data)))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/delete-save', methods=['POST'])
def delete_save():
    data = request.json
    player_id = data.get('player_id')
    slot_number = data.get('slot_number')
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM game_saves WHERE player_id = %s AND slot_number = %s", 
                       (player_id, slot_number))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/get-saves/<int:player_id>', methods=['GET'])
def get_saves(player_id):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT slot_number, save_data FROM game_saves WHERE player_id = %s", (player_id,))
        saves = cursor.fetchall()
        
        # Parse JSON string back to dict
        for save in saves:
            if isinstance(save['save_data'], str):
                save['save_data'] = json.loads(save['save_data'])
                
        return jsonify({'success': True, 'saves': saves})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/save-score', methods=['POST'])
def save_score():
    data = request.json
    player_id = data.get('player_id')
    ingame_name = data.get('ingame_name')
    total_score = data.get('total_score', 0)
    ending_type = data.get('ending_type', 'unknown')
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO scores (player_id, ingame_name, total_score, ending_type)
            VALUES (%s, %s, %s, %s)
        ''', (player_id, ingame_name, total_score, ending_type))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute('''
            SELECT ingame_name as player_name, total_score, ending_type, DATE_FORMAT(created_at, '%Y-%m-%d') as date
            FROM scores ORDER BY total_score DESC LIMIT 10
        ''')
        scores = cursor.fetchall()
        
        leaderboard = []
        for i, score in enumerate(scores, 1):
            medal = "gold" if i == 1 else "silver" if i == 2 else "bronze" if i == 3 else ""
            leaderboard.append({
                'rank': i, 'medal': medal, 'player_name': score['player_name'],
                'score': score['total_score'], 'ending_type': score['ending_type'], 'date': score['date']
            })
        return jsonify({'success': True, 'leaderboard': leaderboard})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    print("🚀 Starting EXIT 404 Game API Server...")
    if init_database():
        app.run(debug=True, port=5000)