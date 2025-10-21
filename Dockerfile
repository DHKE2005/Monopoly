FROM php:8.1-apache

# 安装必要的扩展
RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    && docker-php-ext-install pdo pdo_mysql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 复制 Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 设置工作目录
WORKDIR /var/www/html

# 复制项目文件
COPY . .

# 安装 PHP 依赖
RUN composer install --no-dev --optimize-autoloader

# 启用 Apache rewrite 模块
RUN a2enmod rewrite

# 创建更强大的启动脚本
RUN cat > /usr/local/bin/docker-entrypoint.sh << 'EOF'
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
EOF

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

# 使用新的启动脚本
CMD ["/usr/local/bin/docker-entrypoint.sh"]
