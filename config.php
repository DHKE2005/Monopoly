<?php
// 数据库配置文件
// 启用错误报告（开发时）
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// 检测是否在生产环境
$isProduction = getenv('RAILWAY_ENVIRONMENT') !== false || 
                getenv('MYSQLHOST') !== false ||
                getenv('DATABASE_URL') !== false;

if ($isProduction) {
    // 生产环境配置 - 支持多种环境变量格式
    
    // 尝试从 DATABASE_URL 解析（某些平台使用这种格式）
    $databaseUrl = getenv('DATABASE_URL');
    if ($databaseUrl) {
        $url = parse_url($databaseUrl);
        define('DB_HOST', $url['host'] ?? 'mysql.railway.internal');
        define('DB_USER', $url['user'] ?? 'root');
        define('DB_PASS', $url['pass'] ?? '');
        define('DB_NAME', ltrim($url['path'] ?? '/monopoly_game', '/'));
        define('DB_PORT', $url['port'] ?? 3306);
    } else {
        // 使用单独的环境变量
        define('DB_HOST', getenv('MYSQLHOST') ?: getenv('DB_HOST') ?: 'mysql.railway.internal');
        define('DB_USER', getenv('MYSQLUSER') ?: getenv('DB_USER') ?: 'root');
        define('DB_PASS', getenv('MYSQLPASSWORD') ?: getenv('DB_PASSWORD') ?: '');
        define('DB_NAME', getenv('MYSQLDATABASE') ?: getenv('DB_NAME') ?: 'monopoly_game');
        define('DB_PORT', getenv('MYSQLPORT') ?: getenv('DB_PORT') ?: 3306);
    }
    
    // 记录配置信息（不记录密码）
    error_log("Production DB Config - Host: " . DB_HOST . ", User: " . DB_USER . ", DB: " . DB_NAME . ", Port: " . DB_PORT);
} else {
    // 本地 XAMPP 开发环境配置
    define('DB_HOST', 'localhost');
    define('DB_USER', 'root');
    define('DB_PASS', '');  // XAMPP 默认密码为空
    define('DB_NAME', 'monopoly_game');
    define('DB_PORT', 3306);
}

// 创建数据库连接
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST;
        
        // 如果端口不是默认的3306，添加端口号
        if (defined('DB_PORT') && DB_PORT != 3306) {
            $dsn .= ";port=" . DB_PORT;
        }
        
        $dsn .= ";dbname=" . DB_NAME . ";charset=utf8mb4";
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 5,  // 5秒超时
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ];
        
        $conn = new PDO($dsn, DB_USER, DB_PASS, $options);
        
        // 测试连接
        $conn->query("SELECT 1");
        
        error_log("Database connection successful");
        return $conn;
    } catch(PDOException $e) {
        $errorMsg = "Database Connection Error: " . $e->getMessage();
        $errorMsg .= "\nDSN: mysql:host=" . DB_HOST . ";dbname=" . DB_NAME;
        $errorMsg .= "\nUser: " . DB_USER;
        error_log($errorMsg);
        
        // 记录完整的环境变量（调试用）
        error_log("Environment variables:");
        error_log("MYSQLHOST: " . (getenv('MYSQLHOST') ?: 'not set'));
        error_log("MYSQLUSER: " . (getenv('MYSQLUSER') ?: 'not set'));
        error_log("MYSQLDATABASE: " . (getenv('MYSQLDATABASE') ?: 'not set'));
        error_log("DATABASE_URL: " . (getenv('DATABASE_URL') ? 'set' : 'not set'));
        
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
