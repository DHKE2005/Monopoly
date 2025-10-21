<?php
require_once 'config.php';

// 读取 JSON 请求体
$input = file_get_contents('php://input');
$requestData = json_decode($input, true);

// 获取 action 参数（支持 GET 和 POST JSON）
$action = $_GET['action'] ?? ($requestData['action'] ?? '');

// 只有需要数据库的操作才检查连接
$needsDB = !in_array($action, ['test', 'ping', '']);

if ($needsDB) {
    $conn = getDBConnection();
    if (!$conn) {
        jsonResponse(['error' => 'Database connection failed'], 500);
    }
} else {
    $conn = null;
}

switch ($action) {
    case 'test':
    case 'ping':
        jsonResponse([
            'success' => true,
            'message' => 'API is working!',
            'server_time' => date('Y-m-d H:i:s'),
            'php_version' => phpversion()
        ]);
        break;
    case 'test_db':
        if ($conn) {
            jsonResponse([
                'success' => true,
                'message' => 'Database connection successful!',
                'database' => DB_NAME,
                'host' => DB_HOST
            ]);
        } else {
            jsonResponse(['error' => 'Database connection failed'], 500);
        }
        break;
    case 'create_room':
        createRoom($conn);
        break;
    case 'join_room':
        joinRoom($conn);
        break;
    case 'get_rooms':
        getRooms($conn);
        break;
    case 'get_room_info':
        getRoomInfo($conn);
        break;
    case 'leave_room':
        leaveRoom($conn);
        break;
    case 'start_game':
        startGame($conn);
        break;
    case 'update_game_state':
        updateGameState($conn);
        break;
    case 'get_game_state':
        getGameState($conn);
        break;
    case 'update_player':
        updatePlayer($conn);
        break;
    case 'update_property':
        updateProperty($conn);
        break;
    default:
        jsonResponse([
            'error' => 'Invalid action',
            'received_action' => $action,
            'available_actions' => [
                'test', 'test_db', 'create_room', 'join_room', 
                'get_rooms', 'get_room_info', 'leave_room', 
                'start_game', 'update_game_state', 'get_game_state',
                'update_player', 'update_property'
            ]
        ], 400);
}

// 创建房间
function createRoom($conn) {
    global $requestData;
    $data = $requestData;
    
    $roomName = trim($data['room_name'] ?? '');
    $hostName = trim($data['host_name'] ?? '');
    $maxPlayers = isset($data['max_players']) ? (int)$data['max_players'] : 4;
    if ($maxPlayers < 2) $maxPlayers = 2;
    if ($maxPlayers > 8) $maxPlayers = 8;

    // 将 is_lan 严格转换为 0/1，避免 MySQL 严格模式 1366 错误
    $isLanRaw = $data['is_lan'] ?? false;
    $isLanBool = filter_var($isLanRaw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($isLanBool === null) {
        if (is_numeric($isLanRaw)) {
            $isLanBool = ((int)$isLanRaw) === 1;
        } else if (is_string($isLanRaw)) {
            $lower = strtolower($isLanRaw);
            $isLanBool = in_array($lower, ['true', 'yes', 'on'], true);
        } else {
            $isLanBool = false;
        }
    }
    $isLan = $isLanBool ? 1 : 0;

    if (empty($roomName) || empty($hostName)) {
        jsonResponse(['error' => 'Room name and host name are required'], 400);
    }
    
    try {
        $roomCode = generateRoomCode();
        
        // 确保房间代码唯一
        $stmt = $conn->prepare("SELECT COUNT(*) FROM rooms WHERE room_code = ?");
        $stmt->execute([$roomCode]);
        while ($stmt->fetchColumn() > 0) {
            $roomCode = generateRoomCode();
            $stmt->execute([$roomCode]);
        }
        
        // 创建房间
        $stmt = $conn->prepare("
            INSERT INTO rooms (room_name, room_code, host_name, max_players, is_lan) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$roomName, $roomCode, $hostName, (int)$maxPlayers, (int)$isLan]);
        
        // 添加房主为玩家
        $stmt = $conn->prepare("
            INSERT INTO players (room_code, player_name, player_color) 
            VALUES (?, ?, ?)
        ");
        $colors = ['#FF5252', '#2196F3', '#4CAF50', '#FFC107'];
        $stmt->execute([$roomCode, $hostName, $colors[0]]);
        
        // 初始化游戏状态
        $stmt = $conn->prepare("
            INSERT INTO game_states (room_code, game_data) 
            VALUES (?, ?)
        ");
        $initialGameData = json_encode(['turn' => 0, 'phase' => 'waiting']);
        $stmt->execute([$roomCode, $initialGameData]);
        
        jsonResponse([
            'success' => true,
            'room_code' => $roomCode,
            'room_name' => $roomName
        ]);
    } catch (PDOException $e) {
        $errorMsg = "Create Room Error: " . $e->getMessage();
        $errorMsg .= "\nSQL State: " . $e->getCode();
        $errorMsg .= "\nRoom Name: " . $roomName;
        $errorMsg .= "\nHost Name: " . $hostName;
        $errorMsg .= "\nMax Players: " . $maxPlayers;
        $errorMsg .= "\nIs LAN: " . ($isLan ? 'true' : 'false');
        error_log($errorMsg);
        jsonResponse(['error' => 'Failed to create room: ' . $e->getMessage()], 500);
    }
}

// 加入房间
function joinRoom($conn) {
    global $requestData;
    $data = $requestData;
    
    $roomCode = $data['room_code'] ?? '';
    $playerName = $data['player_name'] ?? '';
    
    if (empty($roomCode) || empty($playerName)) {
        jsonResponse(['error' => 'Room code and player name are required'], 400);
    }
    
    try {
        // 检查房间是否存在且未满
        $stmt = $conn->prepare("
            SELECT * FROM rooms 
            WHERE room_code = ? AND status = 'waiting' AND current_players < max_players
        ");
        $stmt->execute([$roomCode]);
        $room = $stmt->fetch();
        
        if (!$room) {
            jsonResponse(['error' => 'Room not found or full'], 404);
        }
        
        // 检查玩家名是否已存在
        $stmt = $conn->prepare("
            SELECT COUNT(*) FROM players WHERE room_code = ? AND player_name = ?
        ");
        $stmt->execute([$roomCode, $playerName]);
        if ($stmt->fetchColumn() > 0) {
            jsonResponse(['error' => 'Player name already exists in this room'], 400);
        }
        
        // 分配颜色
        $stmt = $conn->prepare("SELECT player_color FROM players WHERE room_code = ?");
        $stmt->execute([$roomCode]);
        $usedColors = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $colors = ['#FF5252', '#2196F3', '#4CAF50', '#FFC107'];
        $availableColors = array_diff($colors, $usedColors);
        $playerColor = reset($availableColors);
        
        // 添加玩家
        $stmt = $conn->prepare("
            INSERT INTO players (room_code, player_name, player_color) 
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$roomCode, $playerName, $playerColor]);
        
        // 更新房间人数
        $stmt = $conn->prepare("
            UPDATE rooms SET current_players = current_players + 1 
            WHERE room_code = ?
        ");
        $stmt->execute([$roomCode]);
        
        jsonResponse([
            'success' => true,
            'room_code' => $roomCode,
            'player_color' => $playerColor
        ]);
    } catch (PDOException $e) {
        error_log("Join Room Error: " . $e->getMessage());
        jsonResponse(['error' => 'Failed to join room'], 500);
    }
}

// 获取房间列表
function getRooms($conn) {
    $isLan = $_GET['is_lan'] ?? 'false';
    $isLan = $isLan === 'true';
    
    try {
        $stmt = $conn->prepare("
            SELECT room_code, room_name, host_name, current_players, max_players, status, is_lan
            FROM rooms 
            WHERE status = 'waiting' AND is_lan = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$isLan]);
        $rooms = $stmt->fetchAll();
        
        jsonResponse(['rooms' => $rooms]);
    } catch (PDOException $e) {
        error_log("Get Rooms Error: " . $e->getMessage());
        jsonResponse(['error' => 'Failed to get rooms'], 500);
    }
}

// 获取房间信息
function getRoomInfo($conn) {
    $roomCode = $_GET['room_code'] ?? '';
    
    if (empty($roomCode)) {
        jsonResponse(['error' => 'Room code is required'], 400);
    }
    
    try {
        // 获取房间信息
        $stmt = $conn->prepare("SELECT * FROM rooms WHERE room_code = ?");
        $stmt->execute([$roomCode]);
        $room = $stmt->fetch();
        
        if (!$room) {
            jsonResponse(['error' => 'Room not found'], 404);
        }
        
        // 获取玩家列表
        $stmt = $conn->prepare("
            SELECT player_name, player_position, player_money, player_color, is_active 
            FROM players 
            WHERE room_code = ?
            ORDER BY id ASC
        ");
        $stmt->execute([$roomCode]);
        $players = $stmt->fetchAll();
        
        jsonResponse([
            'room' => $room,
            'players' => $players
        ]);
    } catch (PDOException $e) {
        error_log("Get Room Info Error: " . $e->getMessage());
        jsonResponse(['error' => 'Failed to get room info'], 500);
    }
}

// 离开房间
function leaveRoom($conn) {
    global $requestData;
    $data = $requestData;
    
    $roomCode = $data['room_code'] ?? '';
    $playerName = $data['player_name'] ?? '';
    
    try {
        // 删除玩家
        $stmt = $conn->prepare("DELETE FROM players WHERE room_code = ? AND player_name = ?");
        $stmt->execute([$roomCode, $playerName]);
        
        // 更新房间人数
        $stmt = $conn->prepare("
            UPDATE rooms SET current_players = current_players - 1 
            WHERE room_code = ?
        ");
        $stmt->execute([$roomCode]);
        
        // 如果房间没人了，删除房间
        $stmt = $conn->prepare("
            DELETE FROM rooms WHERE room_code = ? AND current_players = 0
        ");
        $stmt->execute([$roomCode]);
        
        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        error_log("Leave Room Error: " . $e->getMessage());
        jsonResponse(['error' => 'Failed to leave room'], 500);
    }
}

// 开始游戏
function startGame($conn) {
    global $requestData;
    $data = $requestData;
    $roomCode = $data['room_code'] ?? '';
    
    try {
        $stmt = $conn->prepare("UPDATE rooms SET status = 'playing' WHERE room_code = ?");
        $stmt->execute([$roomCode]);

        // 初始化或重置游戏状态，至少包含有效的回合索引，避免前端被 undefined 覆盖
        $gameData = [
            'currentPlayerIndex' => 0
        ];

        $stmt = $conn->prepare("UPDATE game_states SET game_data = ?, updated_at = CURRENT_TIMESTAMP WHERE room_code = ?");
        $stmt->execute([json_encode($gameData), $roomCode]);

        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        jsonResponse(['error' => 'Failed to start game'], 500);
    }
}

// 更新游戏状态
function updateGameState($conn) {
    global $requestData;
    $data = $requestData;
    
    $roomCode = $data['room_code'] ?? '';
    $gameData = $data['game_data'] ?? [];
    
    try {
        $stmt = $conn->prepare("
            UPDATE game_states 
            SET game_data = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE room_code = ?
        ");
        $stmt->execute([json_encode($gameData), $roomCode]);
        
        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        jsonResponse(['error' => 'Failed to update game state'], 500);
    }
}

// 获取游戏状态
function getGameState($conn) {
    $roomCode = $_GET['room_code'] ?? '';
    
    try {
        $stmt = $conn->prepare("SELECT * FROM game_states WHERE room_code = ?");
        $stmt->execute([$roomCode]);
        $state = $stmt->fetch();
        
        if ($state && isset($state['game_data'])) {
            $state['game_data'] = json_decode($state['game_data'], true);
        }
        
        jsonResponse(['state' => $state]);
    } catch (PDOException $e) {
        jsonResponse(['error' => 'Failed to get game state'], 500);
    }
}

// 更新玩家信息
function updatePlayer($conn) {
    global $requestData;
    $data = $requestData;
    
    $roomCode = $data['room_code'] ?? '';
    $playerName = $data['player_name'] ?? '';
    $position = $data['position'] ?? null;
    $money = $data['money'] ?? null;
    $isActive = $data['is_active'] ?? null;
    
    try {
        $updates = [];
        $params = [];
        
        if ($position !== null) {
            $updates[] = "player_position = ?";
            $params[] = $position;
        }
        if ($money !== null) {
            $updates[] = "player_money = ?";
            $params[] = $money;
        }
        if ($isActive !== null) {
            $updates[] = "is_active = ?";
            $params[] = $isActive;
        }
        
        if (empty($updates)) {
            jsonResponse(['error' => 'No fields to update'], 400);
        }
        
        $params[] = $roomCode;
        $params[] = $playerName;
        
        $stmt = $conn->prepare("
            UPDATE players 
            SET " . implode(', ', $updates) . " 
            WHERE room_code = ? AND player_name = ?
        ");
        $stmt->execute($params);
        
        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        jsonResponse(['error' => 'Failed to update player'], 500);
    }
}

// 更新地产信息
function updateProperty($conn) {
    global $requestData;
    $data = $requestData;
    
    $roomCode = $data['room_code'] ?? '';
    $position = $data['position'] ?? null;
    $owner = $data['owner'] ?? null;
    $houseCount = $data['house_count'] ?? null;
    
    try {
        // 检查地产是否存在
        $stmt = $conn->prepare("
            SELECT * FROM properties WHERE room_code = ? AND position = ?
        ");
        $stmt->execute([$roomCode, $position]);
        
        if ($stmt->fetch()) {
            // 更新
            $updates = [];
            $params = [];
            
            if ($owner !== null) {
                $updates[] = "owner_name = ?";
                $params[] = $owner;
            }
            if ($houseCount !== null) {
                $updates[] = "house_count = ?";
                $params[] = $houseCount;
            }
            
            $params[] = $roomCode;
            $params[] = $position;
            
            $stmt = $conn->prepare("
                UPDATE properties 
                SET " . implode(', ', $updates) . " 
                WHERE room_code = ? AND position = ?
            ");
            $stmt->execute($params);
        } else {
            // 插入
            $stmt = $conn->prepare("
                INSERT INTO properties (room_code, position, owner_name, house_count) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$roomCode, $position, $owner, $houseCount ?? 0]);
        }
        
        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        jsonResponse(['error' => 'Failed to update property'], 500);
    }
}
?>
