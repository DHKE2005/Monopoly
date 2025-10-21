FROM php:8.1-apache

RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    && docker-php-ext-install pdo pdo_mysql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader

# 启用必要的模块
RUN a2enmod rewrite

# 复制自定义配置
COPY railway-apache.conf /etc/apache2/sites-available/000-default.conf

# 创建启动脚本
RUN echo '#!/bin/bash\n\
echo "Listen ${PORT:-8080}" > /etc/apache2/ports.conf\n\
exec apache2-foreground' > /start.sh && chmod +x /start.sh

EXPOSE ${PORT}

CMD ["/start.sh"]