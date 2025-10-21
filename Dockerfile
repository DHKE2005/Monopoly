FROM php:8.1-apache

# 安装扩展
RUN docker-php-ext-install pdo pdo_mysql

# 复制文件
WORKDIR /var/www/html
COPY . .

# 启用 rewrite
RUN a2enmod rewrite

# 创建简单的启动脚本
RUN printf '#!/bin/sh\n\
PORT=${PORT:-8080}\n\
echo "Listen $PORT" > /etc/apache2/ports.conf\n\
echo "<VirtualHost *:$PORT>" > /etc/apache2/sites-available/000-default.conf\n\
echo "    DocumentRoot /var/www/html" >> /etc/apache2/sites-available/000-default.conf\n\
echo "    <Directory /var/www/html>" >> /etc/apache2/sites-available/000-default.conf\n\
echo "        AllowOverride All" >> /etc/apache2/sites-available/000-default.conf\n\
echo "        Require all granted" >> /etc/apache2/sites-available/000-default.conf\n\
echo "    </Directory>" >> /etc/apache2/sites-available/000-default.conf\n\
echo "</VirtualHost>" >> /etc/apache2/sites-available/000-default.conf\n\
exec apache2-foreground' > /usr/local/bin/start.sh \
&& chmod +x /usr/local/bin/start.sh

EXPOSE 8080

CMD ["/usr/local/bin/start.sh"]
