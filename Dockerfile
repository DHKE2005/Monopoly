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

# 创建启动脚本
RUN printf '#!/bin/bash\n\
set -e\n\
PORT=${PORT:-8080}\n\
echo "Starting Apache on port $PORT"\n\
echo "Listen $PORT" > /etc/apache2/ports.conf\n\
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:$PORT>/g" /etc/apache2/sites-available/000-default.conf\n\
exec apache2-foreground\n' > /usr/local/bin/start-apache.sh

RUN chmod +x /usr/local/bin/start-apache.sh

# 暴露端口
EXPOSE 8080

# 使用启动脚本
CMD ["/usr/local/bin/start-apache.sh"]