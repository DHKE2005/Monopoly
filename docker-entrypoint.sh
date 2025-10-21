#!/bin/bash
set -e

# 获取端口（Railway 提供，默认 8080）
PORT=${PORT:-8080}

echo "=========================================="
echo "Starting Apache Configuration"
echo "PORT environment variable: $PORT"
echo "=========================================="

# 配置 ports.conf
echo "Listen $PORT" > /etc/apache2/ports.conf
echo "✓ Updated /etc/apache2/ports.conf"

# 配置 000-default.conf
sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost *:$PORT>/g" /etc/apache2/sites-available/000-default.conf
echo "✓ Updated /etc/apache2/sites-available/000-default.conf"

# 显示配置内容（用于调试）
echo "=========================================="
echo "ports.conf content:"
cat /etc/apache2/ports.conf
echo "=========================================="
echo "000-default.conf VirtualHost line:"
grep "VirtualHost" /etc/apache2/sites-available/000-default.conf
echo "=========================================="

# 启动 Apache
echo "Starting Apache on port $PORT..."
exec apache2-foreground
