-- 大富翁游戏数据库结构
CREATE DATABASE IF NOT EXISTS monopoly_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE monopoly_game;

-- 房间表
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(100) NOT NULL,
    room_code VARCHAR(20) UNIQUE NOT NULL,
    host_name VARCHAR(50) NOT NULL,
    max_players INT DEFAULT 4,
    current_players INT DEFAULT 1,
    status ENUM('waiting', 'playing', 'finished') DEFAULT 'waiting',
    is_lan BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_room_code (room_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 玩家表
CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(20) NOT NULL,
    player_name VARCHAR(50) NOT NULL,
    player_position INT DEFAULT 0,
    player_money INT DEFAULT 1500,
    player_color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_code) REFERENCES rooms(room_code) ON DELETE CASCADE,
    INDEX idx_room_code (room_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 游戏状态表
CREATE TABLE IF NOT EXISTS game_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(20) NOT NULL,
    current_turn INT DEFAULT 0,
    dice_result VARCHAR(10),
    game_data JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_code) REFERENCES rooms(room_code) ON DELETE CASCADE,
    UNIQUE KEY unique_room_state (room_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 地产表
CREATE TABLE IF NOT EXISTS properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(20) NOT NULL,
    position INT NOT NULL,
    owner_name VARCHAR(50),
    house_count INT DEFAULT 0,
    is_mortgaged BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_code) REFERENCES rooms(room_code) ON DELETE CASCADE,
    UNIQUE KEY unique_property (room_code, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 清理超过2小时未更新的房间
CREATE EVENT IF NOT EXISTS cleanup_old_rooms
ON SCHEDULE EVERY 1 HOUR
DO
DELETE FROM rooms WHERE updated_at < DATE_SUB(NOW(), INTERVAL 2 HOUR) AND status != 'playing';
