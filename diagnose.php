<?php
/**
 * Railway 部署诊断脚本
 * 检查数据库连接和表结构
 */

header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html>
<html lang='zh-CN'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Railway 部署诊断</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🔧 Railway 部署诊断</h1>";

require_once 'config.php';

// 检查环境变量
echo "<h2>📋 环境变量检查</h2>";
$envVars = [
    'MYSQLHOST' => getenv('MYSQLHOST'),
    'MYSQLUSER' => getenv('MYSQLUSER'),
    'MYSQLPASSWORD' => getenv('MYSQLPASSWORD') ? '***设置***' : '未设置',
    'MYSQLDATABASE' => getenv('MYSQLDATABASE'),
    'MYSQLPORT' => getenv('MYSQLPORT'),
    'DATABASE_URL' => getenv('DATABASE_URL') ? '***设置***' : '未设置',
    'RAILWAY_ENVIRONMENT' => getenv('RAILWAY_ENVIRONMENT')
];

foreach ($envVars as $key => $value) {
    $status = $value ? 'success' : 'warning';
    echo "<div class='status $status'><strong>$key:</strong> " . ($value ?: '未设置') . "</div>";
}

// 检查数据库连接
echo "<h2>🔌 数据库连接测试</h2>";
try {
    $conn = getDBConnection();
    if ($conn) {
        echo "<div class='status success'>✅ 数据库连接成功</div>";
        
        // 检查数据库配置
        echo "<div class='status info'>数据库配置信息:</div>";
        echo "<pre>";
        echo "主机: " . DB_HOST . "\n";
        echo "用户: " . DB_USER . "\n";
        echo "数据库: " . DB_NAME . "\n";
        echo "端口: " . DB_PORT . "\n";
        echo "</pre>";
        
        // 检查表是否存在
        echo "<h2>📊 数据表检查</h2>";
        $tables = ['rooms', 'players', 'game_states', 'properties'];
        
        foreach ($tables as $table) {
            try {
                $stmt = $conn->query("SHOW TABLES LIKE '$table'");
                $exists = $stmt->fetch();
                
                if ($exists) {
                    echo "<div class='status success'>✅ 表 $table 存在</div>";
                    
                    // 检查表结构
                    $stmt = $conn->query("DESCRIBE $table");
                    $columns = $stmt->fetchAll();
                    echo "<details><summary>查看 $table 表结构</summary><pre>";
                    foreach ($columns as $column) {
                        echo $column['Field'] . " - " . $column['Type'] . "\n";
                    }
                    echo "</pre></details>";
                } else {
                    echo "<div class='status error'>❌ 表 $table 不存在</div>";
                }
            } catch (PDOException $e) {
                echo "<div class='status error'>❌ 检查表 $table 时出错: " . $e->getMessage() . "</div>";
            }
        }
        
        // 测试创建房间
        echo "<h2>🧪 功能测试</h2>";
        try {
            // 测试插入房间
            $testRoomCode = 'TEST' . time();
            $stmt = $conn->prepare("INSERT INTO rooms (room_name, room_code, host_name, max_players, is_lan) VALUES (?, ?, ?, ?, ?)");
            $result = $stmt->execute(['测试房间', $testRoomCode, '测试房主', 4, false]);
            
            if ($result) {
                echo "<div class='status success'>✅ 创建房间功能正常</div>";
                
                // 清理测试数据
                $conn->prepare("DELETE FROM rooms WHERE room_code = ?")->execute([$testRoomCode]);
                echo "<div class='status info'>🧹 测试数据已清理</div>";
            } else {
                echo "<div class='status error'>❌ 创建房间功能异常</div>";
            }
        } catch (PDOException $e) {
            echo "<div class='status error'>❌ 功能测试失败: " . $e->getMessage() . "</div>";
        }
        
    } else {
        echo "<div class='status error'>❌ 数据库连接失败</div>";
    }
} catch (Exception $e) {
    echo "<div class='status error'>❌ 连接测试失败: " . $e->getMessage() . "</div>";
}

// 检查文件权限
echo "<h2>📁 文件权限检查</h2>";
$files = ['api.php', 'config.php', 'index.html', 'game.js'];
foreach ($files as $file) {
    if (file_exists($file)) {
        $perms = fileperms($file);
        $readable = is_readable($file);
        $status = $readable ? 'success' : 'error';
        echo "<div class='status $status'>" . ($readable ? '✅' : '❌') . " $file - 权限: " . substr(sprintf('%o', $perms), -4) . "</div>";
    } else {
        echo "<div class='status error'>❌ $file 不存在</div>";
    }
}

// 检查错误日志
echo "<h2>📝 错误日志</h2>";
if (file_exists('error.log')) {
    $logContent = file_get_contents('error.log');
    $lines = explode("\n", $logContent);
    $recentLines = array_slice($lines, -10); // 最近10行
    
    echo "<div class='status info'>最近的错误日志 (最后10行):</div>";
    echo "<pre>" . htmlspecialchars(implode("\n", $recentLines)) . "</pre>";
} else {
    echo "<div class='status warning'>⚠️ 错误日志文件不存在</div>";
}

echo "<h2>🚀 部署建议</h2>";
echo "<div class='status info'>
    <strong>如果遇到问题，请尝试以下步骤：</strong>
    <ol>
        <li>确保 Railway 已正确配置 MySQL 数据库</li>
        <li>检查环境变量是否正确设置</li>
        <li>如果表不存在，请访问 setup_database.php 初始化数据库</li>
        <li>检查 Railway 日志以获取更多错误信息</li>
    </ol>
</div>";

echo "<div style='text-align: center; margin-top: 20px;'>
    <a href='index.html' style='display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;'>🎮 返回游戏</a>
    <a href='setup_database.php' style='display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;'>🔧 初始化数据库</a>
</div>";

echo "</div></body></html>";
?>