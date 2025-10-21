<?php
/**
 * 数据库初始化脚本
 * 访问这个文件来自动创建数据库和表
 */

header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html>
<html lang='zh-CN'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>数据库初始化 - 大富翁游戏</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        h1 {
            color: #667eea;
            text-align: center;
            margin-bottom: 30px;
        }
        .status {
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
            font-size: 14px;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        pre {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 12px;
        }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
            margin-top: 20px;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🎲 大富翁游戏 - 数据库初始化</h1>";

// 步骤 1: 连接到 MySQL（不指定数据库）
try {
    echo "<div class='status info'>📡 正在连接到 MySQL 服务器...</div>";
    
    $conn = new PDO(
        "mysql:host=localhost;charset=utf8mb4",
        "root",
        "",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    echo "<div class='status success'>✅ 成功连接到 MySQL 服务器！</div>";
    
    // 步骤 2: 创建数据库
    echo "<div class='status info'>🗄️ 正在创建数据库 monopoly_game...</div>";
    
    $conn->exec("CREATE DATABASE IF NOT EXISTS monopoly_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    echo "<div class='status success'>✅ 数据库创建成功！</div>";
    
    // 步骤 3: 选择数据库
    $conn->exec("USE monopoly_game");
    
    // 步骤 4: 创建表
    echo "<div class='status info'>📋 正在创建数据表...</div>";
    
    // 房间表
    $conn->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    echo "<div class='status success'>✅ rooms 表创建成功</div>";
    
    // 玩家表
    $conn->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    echo "<div class='status success'>✅ players 表创建成功</div>";
    
    // 游戏状态表
    $conn->exec("
        CREATE TABLE IF NOT EXISTS game_states (
            id INT AUTO_INCREMENT PRIMARY KEY,
            room_code VARCHAR(20) NOT NULL,
            current_turn INT DEFAULT 0,
            dice_result VARCHAR(10),
            game_data JSON,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (room_code) REFERENCES rooms(room_code) ON DELETE CASCADE,
            UNIQUE KEY unique_room_state (room_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    echo "<div class='status success'>✅ game_states 表创建成功</div>";
    
    // 地产表
    $conn->exec("
        CREATE TABLE IF NOT EXISTS properties (
            id INT AUTO_INCREMENT PRIMARY KEY,
            room_code VARCHAR(20) NOT NULL,
            position INT NOT NULL,
            owner_name VARCHAR(50),
            house_count INT DEFAULT 0,
            is_mortgaged BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (room_code) REFERENCES rooms(room_code) ON DELETE CASCADE,
            UNIQUE KEY unique_property (room_code, position)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    echo "<div class='status success'>✅ properties 表创建成功</div>";
    
    // 步骤 5: 验证表结构
    echo "<div class='status info'>🔍 验证数据库结构...</div>";
    
    $stmt = $conn->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<pre>";
    echo "数据库中的表:\n";
    foreach ($tables as $table) {
        echo "  ✓ " . $table . "\n";
    }
    echo "</pre>";
    
    echo "<div class='status success'>🎉 数据库初始化完成！所有表已成功创建。</div>";
    
    echo "<div class='status warning'>⚠️ 注意事项:
        <ul>
            <li>请确保 XAMPP 的 Apache 和 MySQL 服务都在运行</li>
            <li>本地开发环境配置为: localhost / root / (无密码)</li>
            <li>如果需要修改数据库配置，请编辑 config.php 文件</li>
        </ul>
    </div>";
    
    echo "<div style='text-align: center;'>
            <a href='index.html' class='btn'>🎮 开始游戏</a>
          </div>";
    
} catch (PDOException $e) {
    echo "<div class='status error'>❌ 错误: " . htmlspecialchars($e->getMessage()) . "</div>";
    
    echo "<div class='status warning'>💡 解决方案:
        <ol>
            <li>确保 XAMPP 的 MySQL 服务已启动</li>
            <li>检查 MySQL 是否在 3306 端口运行</li>
            <li>确认 root 用户密码是否为空（XAMPP 默认）</li>
            <li>如果修改过 MySQL 密码，请更新 config.php 中的配置</li>
        </ol>
    </div>";
    
    echo "<pre>详细错误信息:\n" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}

echo "
    </div>
</body>
</html>";
?>
