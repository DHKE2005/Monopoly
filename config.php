<?php
// 数据库配置文件
// 检测是否在 Railway 环境（通过环境变量判断）
$isRailway = getenv('RAILWAY_ENVIRONMENT') !== false;

if ($isRailway) {
    // Railway 生产环境配置
    define('DB_HOST', getenv('MYSQLHOST') ?: 'mysql.railway.internal');
    define('DB_USER', getenv('MYSQLUSER') ?: 'root');
    define('DB_PASS', getenv('MYSQLPASSWORD') ?: '');
    define('DB_NAME', getenv('MYSQLDATABASE') ?: 'monopoly_game');
} else {
    // 本地 XAMPP 开发环境配置
    define('DB_HOST', 'localhost');
    define('DB_USER', 'username');
    define('DB_PASS', 'password');  // XAMPP 默认密码为空
    define('DB_NAME', 'monopoly_game');
}

// 创建数据库连接
function getDBConnection() {
    try {
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $conn;
    } catch(PDOException $e) {
        error_log("Database Connection Error: " . $e->getMessage());
        return null;
    }
}

// 设置响应头
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 处理 OPTIONS 请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 生成随机房间代码
function generateRoomCode($length = 6) {
    return strtoupper(substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, $length));
}

// 返回 JSON 响应
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}
?>