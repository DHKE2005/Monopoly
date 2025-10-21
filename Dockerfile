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
RUN composer install --no-dev --optimize-autoloader || true

# 启用 Apache rewrite 模块
RUN a2enmod rewrite

# 设置启动脚本权限
RUN chmod +x /usr/local/bin/docker-entrypoint.sh || chmod +x ./docker-entrypoint.sh

# 设置默认端口环境变量
ENV PORT=8080

# 暴露端口
EXPOSE ${PORT}

# 使用启动脚本
CMD ["bash", "-c", "chmod +x ./docker-entrypoint.sh && ./docker-entrypoint.sh"]
