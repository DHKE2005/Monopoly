# 大富翁游戏 (Monopoly Game)

一个功能完整的多人大富翁游戏，支持单机、局域网和在线多人模式。

## 功能特点

✨ **三种游戏模式**
- 🎮 单人游戏：与1-3个机器人对战
- 🏠 局域网多人：在本地网络中与朋友一起玩
- 🌐 在线多人：通过Railway远程联机

🎨 **现代化界面**
- 使用自定义字体
- 渐变色和动画效果
- 响应式设计，支持各种屏幕尺寸

🎲 **完整游戏机制**
- 40个地产格子
- 购买地产和建造房屋
- 租金系统
- 机会和命运卡
- 破产和胜利条件

## 安装步骤

### 1. 环境要求
- XAMPP (包含 Apache, MySQL, PHP)
- 现代浏览器 (Chrome, Firefox, Edge 等)

### 2. 数据库设置

1. 启动 XAMPP 的 Apache 和 MySQL 服务
2. 打开 phpMyAdmin (http://localhost/phpmyadmin)
3. 导入数据库：
   - 点击 "导入" 标签
   - 选择 `database.sql` 文件
   - 点击 "执行"

或者直接执行以下命令：
```bash
mysql -u root -p < database.sql
```

### 3. 配置数据库连接

编辑 `config.php` 文件，根据需要修改数据库配置：

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // 如果设置了密码，请填写
define('DB_NAME', 'monopoly_game');
```

### 4. 启动游戏

1. 确保文件位于 XAMPP 的 htdocs 目录：
   ```
   D:\xampp\htdocs\php\Monopoly\
   ```

2. 打开浏览器访问：
   ```
   http://localhost/php/Monopoly/
   ```

## 游戏玩法

### 单人模式
1. 点击 "单人游戏"
2. 输入您的名字
3. 选择机器人数量（1-3个）
4. 点击 "开始游戏"

### 多人模式

#### 创建房间
1. 点击 "多人游戏"
2. 输入您的名字
3. 点击 "创建房间"
4. 输入房间名称
5. 选择最大玩家数（2-4人）
6. 选择房间类型：
   - 局域网房间：仅本地网络可见
   - Railway 房间：在线房间，任何人都可以加入
7. 等待其他玩家加入
8. 点击 "开始游戏"

#### 加入房间
1. 点击 "多人游戏"
2. 输入您的名字
3. 点击 "加入房间"
4. 选择房间类型标签（局域网/Railway）
5. 点击想要加入的房间
6. 等待房主开始游戏

### 游戏规则

📌 **基础规则**
- 每位玩家初始资金：$1,500
- 经过起点获得：$200
- 掷骰子前进相应格数

🏘️ **地产系统**
- 停留在无主地产可以购买
- 停留在他人地产需支付租金
- 可以在自己的地产上建造房屋（最多4间）
- 4间房屋可以升级为酒店

💰 **胜利条件**
- 其他玩家全部破产
- 您成为最后的赢家！

## 游戏操作

### 键盘快捷键
- `空格键`：掷骰子
- `ESC`：打开/关闭游戏菜单

### 鼠标操作
- 点击地产格子：查看地产详情
- 点击按钮：执行相应操作

## 技术架构

### 前端
- HTML5
- CSS3 (渐变、动画、响应式设计)
- JavaScript (ES6+)
- 自定义字体 (gameFont.ttf)

### 后端
- PHP 7.4+
- MySQL 数据库
- PDO 数据库连接
- RESTful API 设计

### 数据库表
- `rooms` - 房间信息
- `players` - 玩家信息
- `game_states` - 游戏状态
- `properties` - 地产信息

## Railway 部署（可选）

如果要部署到 Railway 以支持在线多人模式：

1. 注册 Railway 账号 (https://railway.app)
2. 创建新项目
3. 连接 GitHub 仓库或直接部署
4. 配置环境变量：
   ```
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASS=your_database_password
   DB_NAME=monopoly_game
   ```
5. 部署完成后，更新 `game.js` 中的 `API_URL` 为您的 Railway URL

## 故障排除

### 问题：无法连接数据库
**解决方案**：
- 检查 XAMPP 的 MySQL 服务是否启动
- 确认 `config.php` 中的数据库配置正确
- 确保数据库 `monopoly_game` 已创建

### 问题：页面显示空白
**解决方案**：
- 打开浏览器开发者工具 (F12) 查看错误
- 检查 Apache 服务是否正常运行
- 确认文件路径正确

### 问题：无法加载字体
**解决方案**：
- 确认 `Resource/gameFont.ttf` 文件存在
- 检查文件路径是否正确
- 清除浏览器缓存

### 问题：多人模式无法看到房间
**解决方案**：
- 确保 API 正常工作（访问 api.php 测试）
- 检查数据库连接
- 确认房间类型选择正确（局域网/在线）

## 文件结构

```
Monopoly/
│
├── index.html          # 主页面
├── styles.css          # 样式表
├── game.js            # 游戏逻辑
├── config.php         # 数据库配置
├── api.php            # API 接口
├── database.sql       # 数据库结构
├── README.md          # 说明文档
│
└── Resource/
    └── gameFont.ttf   # 自定义字体
```

## 浏览器支持

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

## 更新日志

### Version 1.0 (2024)
- ✨ 初始版本发布
- 🎮 支持单人和多人模式
- 🏠 局域网联机功能
- 🌐 在线联机准备
- 🎨 现代化 UI 设计

## 许可证

本项目仅供学习和娱乐使用。

## 作者

Made with ❤️

## 贡献

欢迎提交问题和改进建议！

---

享受游戏！🎲🏠💰
