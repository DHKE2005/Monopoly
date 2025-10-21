<?php
// 数据库诊断脚本
header('Content-Type: application/json; charset=utf-8');

$diagnostics = [
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'environment' => []
];

// 检查环境变量
$envVars = [
    'RAILWAY_ENVIRONMENT',
    'MYSQLHOST',
    'MYSQLUSER',
    'MYSQLPASSWORD',
    'MYSQLDATABASE',
    'MYSQLPORT',
    'DATABASE_URL',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_PORT'
];

foreach ($envVars as $var) {
    $value = getenv($var);
    if ($value !== false) {
        // 隐藏密码
        if (strpos($var, 'PASS') !== false || strpos($var, 'PASSWORD') !== false) {
            $diagnostics['environment'][$var] = '*** (set)';
        } else if ($var === 'DATABASE_URL') {
            // 隐藏 DATABASE_URL 中的密码
            $diagnostics['environment'][$var] = preg_replace('/\/\/([^:]+):([^@]+)@/', '//\1:***@', $value);
        } else {
            $diagnostics['environment'][$var] = $value;
        }
    } else {
        $diagnostics['environment'][$var] = null;
    }
}

// 尝试连接数据库
require_once 'config.php';

$diagnostics['config'] = [
    'DB_HOST' => DB_HOST,
    'DB_USER' => DB_USER,
    'DB_NAME' => DB_NAME,
    'DB_PORT' => defined('DB_PORT') ? DB_PORT : 'not defined',
    'DB_PASS' => DB_PASS ? '*** (set)' : 'empty'
];

try {
    $conn = getDBConnection();
    if ($conn) {
        $diagnostics['database'] = [
            'status' => 'connected',
            'message' => 'Database connection successful'
        ];
        
        // 测试查询
        try {
            $stmt = $conn->query("SELECT DATABASE() as db, VERSION() as version");
            $result = $stmt->fetch();
            $diagnostics['database']['current_database'] = $result['db'];
            $diagnostics['database']['mysql_version'] = $result['version'];
            
            // 检查表是否存在
            $stmt = $conn->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $diagnostics['database']['tables'] = $tables;
            
        } catch (PDOException $e) {
            $diagnostics['database']['query_error'] = $e->getMessage();
        }
    } else {
        $diagnostics['database'] = [
            'status' => 'failed',
            'message' => 'Could not establish database connection'
        ];
    }
} catch (Exception $e) {
    $diagnostics['database'] = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

// PDO 驱动检查
$diagnostics['pdo_drivers'] = PDO::getAvailableDrivers();

// 检查日志文件
$logFile = __DIR__ . '/error.log';
if (file_exists($logFile)) {
    $diagnostics['error_log'] = [
        'exists' => true,
        'size' => filesize($logFile),
        'last_lines' => array_slice(file($logFile), -10) // 最后10行
    ];
} else {
    $diagnostics['error_log'] = [
        'exists' => false
    ];
}

echo json_encode($diagnostics, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
