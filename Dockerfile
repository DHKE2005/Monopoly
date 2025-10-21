FROM php:8.1-apache

# 安装扩展
RUN docker-php-ext-install pdo pdo_mysql

# 复制文件
WORKDIR /var/www/html
COPY . .

# 启用 rewrite
RUN a2enmod rewrite

# 创建启动脚本
RUN printf '#!/bin/sh\n\
set -e\n\
PORT=${PORT:-8080}\n\
echo "=========================================="\n\
echo "Starting Apache Configuration"\n\
echo "PORT: $PORT"\n\
echo "=========================================="\n\
\n\
# 配置 ports.conf\n\
echo "Listen $PORT" > /etc/apache2/ports.conf\n\
echo "✓ Updated ports.conf"\n\
\n\
# 配置默认站点\n\
cat > /etc/apache2/sites-available/000-default.conf << EOF\n\
<VirtualHost *:$PORT>\n\
    DocumentRoot /var/www/html\n\
    ServerName localhost\n\
    \n\
    <Directory /var/www/html>\n\
        AllowOverride All\n\
        Require all granted\n\
        Options Indexes FollowSymLinks\n\
    </Directory>\n\
    \n\
    ErrorLog ${APACHE_LOG_DIR}/error.log\n\
    CustomLog ${APACHE_LOG_DIR}/access.log combined\n\
</VirtualHost>\n\
EOF\n\
\n\
echo "✓ Updated 000-default.conf"\n\
\n\
# 显示配置（调试用）\n\
echo "=========================================="\n\
echo "ports.conf:"\n\
cat /etc/apache2/ports.conf\n\
echo "=========================================="\n\
echo "000-default.conf:"\n\
cat /etc/apache2/sites-available/000-default.conf\n\
echo "=========================================="\n\
\n\
# 启动 Apache\n\
echo "Starting Apache on port $PORT..."\n\
exec apache2-foreground' > /usr/local/bin/start.sh \
&& chmod +x /usr/local/bin/start.sh

EXPOSE 8080

CMD ["/usr/local/bin/start.sh"]
