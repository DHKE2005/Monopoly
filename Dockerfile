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

# 创建启动脚本来动态设置端口
RUN echo '#!/bin/bash\n\
sed -i "s/Listen 80/Listen \${PORT:-80}/g" /etc/apache2/ports.conf\n\
sed -i "s/:80/:${PORT:-80}/g" /etc/apache2/sites-available/000-default.conf\n\
apache2-foreground' > /start.sh && chmod +x /start.sh

# 暴露端口（Railway 会自动使用 PORT 环境变量）
EXPOSE $PORT

# 使用启动脚本
CMD ["/start.sh"]