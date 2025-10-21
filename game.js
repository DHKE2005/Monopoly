// game.js - 大富翁完整游戏逻辑（完善版）
console.log('🎲 大富翁游戏脚本加载中...');

// ========================================
// 全局变量和配置
// ========================================
// 动态设置API URL，支持Railway部署
const API_URL = (() => {
    // 如果是Railway部署，使用绝对路径
    if (window.location.hostname.includes('railway') || window.location.hostname.includes('up.railway.app')) {
        return window.location.origin + '/api.php';
    }
    // 本地开发使用相对路径
    return 'api.php';
})();

console.log('🌐 API URL:', API_URL);
let gameState = {
    mode: 'single',
    roomCode: null,
    playerName: null,
    players: [],
    currentPlayerIndex: 0,
    board: [],
    properties: [],
    isHost: false,
    gameStarted: false,
    updateInterval: null,
    isPlayerAction: false
};

let currentScreen = 'mainMenu';

// 游戏棋盘配置（40个位置）
const BOARD_CONFIG = [
    { id: 0, name: '出发', type: 'start', color: '#4CAF50' },
    { id: 1, name: '地中海大道', type: 'property', color: '#8B4513', price: 60, rent: [2, 10, 30, 90, 160, 250], group: 'brown' },
    { id: 2, name: '社区宝箱', type: 'chance', color: '#FF9800' },
    { id: 3, name: '波罗的海大道', type: 'property', color: '#8B4513', price: 60, rent: [4, 20, 60, 180, 320, 450], group: 'brown' },
    { id: 4, name: '所得税', type: 'tax', amount: 200, color: '#F44336' },
    { id: 5, name: '阅读铁路', type: 'railroad', price: 200, rent: [25, 50, 100, 200], color: '#212121' },
    { id: 6, name: '东方大道', type: 'property', color: '#87CEEB', price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'lightblue' },
    { id: 7, name: '机会', type: 'community', color: '#2196F3' },
    { id: 8, name: '佛蒙特大道', type: 'property', color: '#87CEEB', price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'lightblue' },
    { id: 9, name: '康涅狄格大道', type: 'property', color: '#87CEEB', price: 120, rent: [8, 40, 100, 300, 450, 600], group: 'lightblue' },
    { id: 10, name: '监狱', type: 'jail', color: '#FF5722' },
    { id: 11, name: '圣查尔斯广场', type: 'property', color: '#FF1493', price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'pink' },
    { id: 12, name: '电力公司', type: 'utility', price: 150, rent: [4, 10], color: '#FFC107' },
    { id: 13, name: '州大道', type: 'property', color: '#FF1493', price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'pink' },
    { id: 14, name: '宾夕法尼亚铁路', type: 'railroad', price: 200, rent: [25, 50, 100, 200], color: '#212121' },
    { id: 15, name: '弗吉尼亚大道', type: 'property', color: '#FFA500', price: 160, rent: [12, 60, 180, 500, 700, 900], group: 'orange' },
    { id: 16, name: '圣詹姆斯广场', type: 'property', color: '#FFA500', price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'orange' },
    { id: 17, name: '社区宝箱', type: 'chance', color: '#FF9800' },
    { id: 18, name: '田纳西大道', type: 'property', color: '#FFA500', price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'orange' },
    { id: 19, name: '纽约大道', type: 'property', color: '#FFA500', price: 200, rent: [16, 80, 220, 600, 800, 1000], group: 'orange' },
    { id: 20, name: '免费停车', type: 'parking', color: '#9C27B0' },
    { id: 21, name: '肯塔基大道', type: 'property', color: '#FF0000', price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'red' },
    { id: 22, name: '机会', type: 'community', color: '#2196F3' },
    { id: 23, name: '印第安纳大道', type: 'property', color: '#FF0000', price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'red' },
    { id: 24, name: '伊利诺伊大道', type: 'property', color: '#FF0000', price: 240, rent: [20, 100, 300, 750, 925, 1100], group: 'red' },
    { id: 25, name: 'B&O铁路', type: 'railroad', price: 200, rent: [25, 50, 100, 200], color: '#212121' },
    { id: 26, name: '大西洋大道', type: 'property', color: '#FFFF00', price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'yellow' },
    { id: 27, name: '文特诺大道', type: 'property', color: '#FFFF00', price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'yellow' },
    { id: 28, name: '水务公司', type: 'utility', price: 150, rent: [4, 10], color: '#FFC107' },
    { id: 29, name: '马文花园', type: 'property', color: '#FFFF00', price: 280, rent: [24, 120, 360, 850, 1025, 1200], group: 'yellow' },
    { id: 30, name: '前往监狱', type: 'gotojail', color: '#F44336' },
    { id: 31, name: '太平洋大道', type: 'property', color: '#008000', price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'green' },
    { id: 32, name: '北卡罗来纳大道', type: 'property', color: '#008000', price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'green' },
    { id: 33, name: '社区宝箱', type: 'chance', color: '#FF9800' },
    { id: 34, name: '宾夕法尼亚大道', type: 'property', color: '#008000', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], group: 'green' },
    { id: 35, name: '短线铁路', type: 'railroad', price: 200, rent: [25, 50, 100, 200], color: '#212121' },
    { id: 36, name: '机会', type: 'community', color: '#2196F3' },
    { id: 37, name: '公园广场', type: 'property', color: '#0000FF', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], group: 'darkblue' },
    { id: 38, name: '奢侈税', type: 'tax', amount: 100, color: '#F44336' },
    { id: 39, name: '木板路', type: 'property', color: '#0000FF', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], group: 'darkblue' }
];

// 机会卡和社区宝箱卡片
const CHANCE_CARDS = [
    { text: '前进到起点，获得$200', money: 200, move: 0 },
    { text: '前进到伊利诺伊大道', move: 24 },
    { text: '前进到圣查尔斯广场', move: 11 },
    { text: '银行分红，获得$50', money: 50 },
    { text: '退回3格', moveBack: 3 },
    { text: '超速罚款$15', money: -15 }
];

const COMMUNITY_CARDS = [
    { text: '医院费用$100', money: -100 },
    { text: '学校费用$150', money: -150 },
    { text: '银行错误，获得$200', money: 200 },
    { text: '出售股票，获得$50', money: 50 },
    { text: '所得税退税，获得$20', money: 20 },
    { text: '人寿保险到期，获得$100', money: 100 }
];

// ========================================
// 初始化事件监听
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，初始化事件监听器...');
    
    const botBtns = document.querySelectorAll('.bot-btn');
    botBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            selectBotCount(parseInt(this.dataset.count));
        });
    });
    
    const playerBtns = document.querySelectorAll('.player-btn');
    playerBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            selectMaxPlayers(parseInt(this.dataset.count));
        });
    });
    
    const typeBtns = document.querySelectorAll('.type-btn');
    typeBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            selectRoomType(this.dataset.lan === 'true');
        });
    });
    
    console.log('🎉 所有事件监听器绑定完成！');
});

// ========================================
// 屏幕管理
// ========================================
function showScreen(screenId) {
    console.log(`切换到屏幕: ${screenId}`);
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenId;
    }
}

function backToMainMenu() {
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
        gameState.updateInterval = null;
    }
    
    if (gameState.mode === 'multiplayer' && gameState.roomCode) {
        leaveRoom();
    }
    
    resetGameState();
    showScreen('mainMenu');
}

// ========================================
// 主菜单功能
// ========================================
function showSinglePlayerSetup() {
    showScreen('singlePlayerSetup');
}

function showMultiplayerMenu() {
    showScreen('multiplayerMenu');
}

async function exitGame() {
    const confirmed = await showConfirmDialog('退出游戏', '确定要退出游戏吗？');
    if (confirmed) {
        window.close();
        setTimeout(() => showAlertDialog('提示', '请手动关闭浏览器标签页'), 100);
    }
}

// ========================================
// 单人游戏设置
// ========================================
function selectBotCount(count) {
    document.querySelectorAll('.bot-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('botCount').value = count;
}

async function startSinglePlayer() {
    const playerName = document.getElementById('playerName').value.trim();
    const botCount = parseInt(document.getElementById('botCount').value) || 2;
    
    if (!playerName) {
        await showAlertDialog('提示', '请输入您的名字！');
        return;
    }
    
    gameState.mode = 'single';
    gameState.playerName = playerName;
    gameState.currentPlayerIndex = 0;
    gameState.gameStarted = true;
    
    gameState.players = [{
        name: playerName,
        color: '#FF5252',
        money: 1500,
        position: 0,
        isBot: false,
        properties: [],
        inJail: false,
        jailTurns: 0
    }];
    
    const botNames = ['AI小强', 'AI小华', 'AI小明'];
    const botColors = ['#2196F3', '#4CAF50', '#FFC107'];
    
    for (let i = 0; i < Math.min(botCount, 3); i++) {
        gameState.players.push({
            name: botNames[i],
            color: botColors[i],
            money: 1500,
            position: 0,
            isBot: true,
            properties: [],
            inJail: false,
            jailTurns: 0
        });
    }
    
    gameState.board = [...BOARD_CONFIG];
    gameState.properties = BOARD_CONFIG.map(p => ({
        ...p,
        owner: null,
        houses: 0,
        isMortgaged: false
    }));
    
    showScreen('gameScreen');
    initGameScreen();
}

// ========================================
// 多人游戏功能
// ========================================
function showCreateRoom() {
    showScreen('createRoomScreen');
    setTimeout(() => {
        selectMaxPlayers(4);
        selectRoomType(true);
    }, 100);
}

function showJoinRoom() {
    showScreen('joinRoomScreen');
    refreshRoomList();
}

function selectMaxPlayers(count) {
    document.querySelectorAll('.player-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`.player-btn[data-count="${count}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    document.getElementById('maxPlayers').value = count;
}

function selectRoomType(isLan) {
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`.type-btn[data-lan="${isLan}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    document.getElementById('isLanRoom').value = isLan;
}

async function createRoom() {
    const playerName = document.getElementById('multiPlayerName').value.trim();
    const roomName = document.getElementById('roomName').value.trim();
    const maxPlayers = parseInt(document.getElementById('maxPlayers').value) || 4;
    const isLan = document.getElementById('isLanRoom').value === 'true';
    
    if (!playerName || !roomName) {
        await showAlertDialog('提示', '请输入玩家名和房间名！');
        return;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create_room',
                room_name: roomName,
                host_name: playerName,
                max_players: maxPlayers,
                is_lan: isLan
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            await showAlertDialog('错误', `创建房间失败: ${data.error}`);
            return;
        }
        
        gameState.mode = 'multiplayer';
        gameState.playerName = playerName;
        gameState.roomCode = data.room_code;
        gameState.isHost = true;
        
        document.getElementById('displayRoomCode').textContent = data.room_code;
        document.getElementById('displayRoomName').textContent = data.room_name;
        
        showScreen('waitingRoom');
        startWaitingRoomUpdates();
    } catch (error) {
        console.error('❌ 创建房间网络错误:', error);
        await showAlertDialog('错误', `创建房间失败，请检查网络连接\n\n错误详情: ${error.message}\nAPI地址: ${API_URL}`);
    }
}

function switchRoomTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('isLanRoom').value = tab === 'lan';
    refreshRoomList();
}

async function refreshRoomList() {
    const roomList = document.getElementById('roomList');
    const isLan = document.getElementById('isLanRoom').value === 'true';
    
    roomList.innerHTML = '<div class="loading">🔄 正在加载房间列表...</div>';
    
    try {
        const response = await fetch(`${API_URL}?action=get_rooms&is_lan=${isLan}`);
        const data = await response.json();
        
        if (data.error) {
            roomList.innerHTML = `<div class="error-message">❌ ${data.error}</div>`;
            return;
        }
        
        if (!data.rooms || data.rooms.length === 0) {
            roomList.innerHTML = '<div class="no-rooms">📭 暂无可用房间，创建一个吧！</div>';
            return;
        }
        
        roomList.innerHTML = data.rooms.map(room => `
            <div class="room-item" onclick="joinRoomByCode('${room.room_code}')">
                <div class="room-item-info">
                    <h4>🏠 ${room.room_name}</h4>
                    <p>房主: ${room.host_name}</p>
                </div>
                <div class="room-item-details">
                    <div class="room-code">#${room.room_code}</div>
                    <div class="room-players">👥 ${room.current_players}/${room.max_players}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        roomList.innerHTML = '<div class="error-message">❌ 加载失败，请检查网络连接</div>';
    }
}

async function joinRoomByCode(roomCode) {
    const playerName = document.getElementById('multiPlayerName').value.trim();
    if (!playerName) {
        await showAlertDialog('提示', '请输入您的名字！');
        return;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'join_room',
                room_code: roomCode,
                player_name: playerName
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            await showAlertDialog('错误', `加入房间失败: ${data.error}`);
            return;
        }
        
        gameState.mode = 'multiplayer';
        gameState.playerName = playerName;
        gameState.roomCode = roomCode;
        gameState.isHost = false;
        
        document.getElementById('displayRoomCode').textContent = roomCode;
        showScreen('waitingRoom');
        startWaitingRoomUpdates();
    } catch (error) {
        console.error('❌ 加入房间网络错误:', error);
        await showAlertDialog('错误', `加入房间失败，请检查网络连接\n\n错误详情: ${error.message}\nAPI地址: ${API_URL}`);
    }
}

function startWaitingRoomUpdates() {
    updateWaitingRoom();
    if (gameState.updateInterval) clearInterval(gameState.updateInterval);
    gameState.updateInterval = setInterval(updateWaitingRoom, 2000);
}

async function updateWaitingRoom() {
    if (!gameState.roomCode || currentScreen !== 'waitingRoom') {
        if (gameState.updateInterval) {
            clearInterval(gameState.updateInterval);
            gameState.updateInterval = null;
        }
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?action=get_room_info&room_code=${gameState.roomCode}`);
        const data = await response.json();
        
        if (data.error) return;
        
        const room = data.room;
        const players = data.players || [];
        const maxPlayers = room.max_players || 4;
        
        document.getElementById('displayRoomName').textContent = room.room_name;
        
        const playerList = document.getElementById('playerList');
        const playerCards = players.map(player => `
            <div class="player-card" style="border-color: ${player.player_color}">
                <div class="player-avatar" style="background: ${player.player_color}">${player.player_name[0]}</div>
                <div class="player-info">
                    <h4>${player.player_name}</h4>
                    <p class="player-status">
                        ${player.player_name === gameState.playerName ? '👤 我' : ''}
                        ${player.player_name === room.host_name ? '👑 房主' : ''}
                    </p>
                </div>
            </div>
        `);
        
        const emptySlots = Array(maxPlayers - players.length).fill(`
            <div class="player-card waiting">
                <div class="player-avatar">👤</div>
                <div class="player-info"><h4>等待中...</h4></div>
            </div>
        `);
        
        playerList.innerHTML = playerCards.concat(emptySlots).join('');
        
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            const isHost = gameState.playerName === room.host_name;
            const canStart = isHost && players.length >= 2;
            startBtn.style.display = canStart ? 'inline-block' : 'none';
        }
        
        if (room.status === 'playing' && !gameState.gameStarted) {
            clearInterval(gameState.updateInterval);
            gameState.updateInterval = null;
            gameState.gameStarted = true;
            await initMultiplayerGame(players);
        }
    } catch (error) {
        console.error('❌ 更新等待室错误:', error);
    }
}

async function leaveRoom() {
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
        gameState.updateInterval = null;
    }
    
    if (gameState.roomCode && gameState.playerName) {
        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'leave_room',
                    room_code: gameState.roomCode,
                    player_name: gameState.playerName
                })
            });
        } catch (error) {
            console.error('❌ 离开房间错误:', error);
        }
    }
    
    resetGameState();
    showScreen('mainMenu');
}

function backToMultiplayerMenu() {
    leaveRoom();
    showScreen('multiplayerMenu');
}

async function startMultiplayerGame() {
    if (!gameState.isHost) {
        await showAlertDialog('提示', '只有房主可以开始游戏！');
        return;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'start_game',
                room_code: gameState.roomCode
            })
        });
        
        const data = await response.json();
        if (data.error) {
            await showAlertDialog('错误', `开始游戏失败: ${data.error}`);
        }
    } catch (error) {
        await showAlertDialog('错误', '开始游戏失败，请重试');
    }
}

async function initMultiplayerGame(players) {
    gameState.gameStarted = true;
    gameState.currentPlayerIndex = 0;
    
    gameState.players = players.map(p => ({
        name: p.player_name,
        color: p.player_color,
        money: 1500,
        position: 0,
        isBot: false,
        properties: [],
        inJail: false,
        jailTurns: 0
    }));
    
    gameState.board = [...BOARD_CONFIG];
    gameState.properties = BOARD_CONFIG.map(p => ({
        ...p,
        owner: null,
        houses: 0,
        isMortgaged: false
    }));
    
    showScreen('gameScreen');
    initGameScreen();
    startMultiplayerGameSync();
}

// ========================================
// 游戏主逻辑
// ========================================
function initGameScreen() {
    generateBoard();
    updatePlayerStats();
    updateCurrentPlayer();
    updateBoardTokens();
    updateGameControls();
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer && currentPlayer.isBot && gameState.mode === 'single') {
        setTimeout(() => rollDice(), 1500);
    }
}

function generateBoard() {
    const board = document.getElementById('gameBoard');
    let html = '';
    
    for (let i = 0; i < 11; i++) {
        for (let j = 0; j < 11; j++) {
            let index = -1;
            
            if (i === 0 && j <= 10) index = 20 + j;
            else if (i === 10 && j <= 10) index = 10 - j;
            else if (j === 0 && i > 0 && i < 10) index = 20 - i;
            else if (j === 10 && i > 0 && i < 10) index = 30 + i;
            
            if (index >= 0 && index < 40) {
                const space = gameState.board[index];
                let className = 'board-cell';
                if ([0, 10, 20, 30].includes(index)) className += ' corner';
                if (space.type === 'property') className += ' property';
                
                html += `
                    <div class="${className}" data-index="${index}" onclick="showPropertyDetails(${index})" 
                         style="--property-color: ${space.color || '#ccc'}">
                        <div class="cell-name">${space.name}</div>
                        ${space.price ? `<div class="cell-price">$${space.price}</div>` : ''}
                    </div>
                `;
            } else {
                html += '<div class="board-center"></div>';
            }
        }
    }
    board.innerHTML = html;
}

function updateBoardTokens() {
    document.querySelectorAll('.player-token').forEach(token => token.remove());
    gameState.players.forEach((player, index) => {
        const cell = document.querySelector(`[data-index="${player.position}"]`);
        if (cell) {
            const token = document.createElement('div');
            token.className = 'player-token';
            token.style.background = player.color;
            token.dataset.playerIndex = index;
            token.title = player.name;
            cell.appendChild(token);
        }
    });
}

function updatePlayerStats() {
    const stats = document.getElementById('playerStats');
    stats.innerHTML = gameState.players.map((player, i) => `
        <div class="player-stat-card ${gameState.currentPlayerIndex === i ? 'active' : ''}" 
             style="border-left-color: ${player.color}">
            <div class="player-stat-header">
                <span class="player-stat-name">${player.name}</span>
                <div class="player-stat-avatar" style="background: ${player.color}">${player.name[0]}</div>
            </div>
            <div class="player-stat-money">$${player.money.toLocaleString()}</div>
        </div>
    `).join('');
}

function updateCurrentPlayer() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const display = document.getElementById('currentPlayerName');
    display.textContent = currentPlayer.name;
    display.style.color = currentPlayer.color;
}

async function rollDice() {
    if (gameState.mode === 'multiplayer') {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.name !== gameState.playerName) {
            await showAlertDialog('提示', '现在不是你的回合！');
            return;
        }
    }
    
    // 设置玩家操作标志，防止同步覆盖
    gameState.isPlayerAction = true;
    
    const rollBtn = document.getElementById('rollDiceBtn');
    rollBtn.disabled = true;
    document.getElementById('diceDisplay').style.display = 'flex';
    
    const dice1 = document.getElementById('dice1');
    const dice2 = document.getElementById('dice2');
    
    for (let i = 0; i < 10; i++) {
        dice1.textContent = Math.floor(Math.random() * 6) + 1;
        dice2.textContent = Math.floor(Math.random() * 6) + 1;
        await sleep(100);
    }
    
    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = Math.floor(Math.random() * 6) + 1;
    const total = roll1 + roll2;
    
    dice1.textContent = roll1;
    dice2.textContent = roll2;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    showEventMessage(`${currentPlayer.name} 掷出: ${roll1} + ${roll2} = ${total}`);
    await sleep(1500);
    
    await movePlayer(total);
    
    // 立即更新视图
    updatePlayerStats();
    updateBoardTokens();
    
    // 处理落地事件
    await handleLanding();
    
    // 再次更新确保状态同步
    updatePlayerStats();
    updateBoardTokens();
    
    if (gameState.mode === 'multiplayer') {
        await syncGameStateToServer();
        // 延迟一点时间让服务器同步完成
        await sleep(500);
    }
    
    // 清除玩家操作标志
    gameState.isPlayerAction = false;
    
    document.getElementById('endTurnBtn').style.display = 'inline-block';
    rollBtn.style.display = 'none';
}

async function movePlayer(steps) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const startPos = player.position;
    
    for (let i = 1; i <= steps; i++) {
        player.position = (player.position + 1) % 40;
        updateBoardTokens();
        await sleep(300);
    }
    
    const endPos = player.position;
    if (endPos < startPos || (startPos + steps >= 40)) {
        player.money += 200;
        showEventMessage('通过起点！获得 $200');
        await sleep(1000);
    }
}

async function handleLanding() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const space = gameState.properties[player.position];
    
    console.log(`🎯 ${player.name} 落在 ${space.name} (类型: ${space.type})`);
    
    switch (space.type) {
        case 'property':
            await handlePropertyLanding(space);
            break;
        case 'tax':
            player.money -= space.amount;
            showEventMessage(`${player.name} 缴纳 ${space.name}: -$${space.amount}`);
            break;
        case 'chance':
            await handleChanceCard();
            break;
        case 'community':
            await handleCommunityCard();
            break;
        case 'jail':
        case 'gotojail':
            player.position = 10;
            showEventMessage(`${player.name} 进入监狱！`);
            break;
        case 'parking':
            player.money += 200;
            showEventMessage(`${player.name} 免费停车！获得 $200`);
            break;
    }
    
    updatePlayerStats();
    if (player.money < 0) {
        showEventMessage(`${player.name} 破产出局！`);
        player.money = 0;
    }
}

async function handlePropertyLanding(property) {
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (!property.owner) {
        // 在多人模式下，只有当前玩家才能购买地产
        if (gameState.mode === 'multiplayer' && player.name !== gameState.playerName) {
            // 非当前玩家只显示消息，不触发购买对话框
            showEventMessage(`${player.name} 停在了无主地产 "${property.name}"`);
            return;
        }
        
        const confirmed = await showConfirmDialog(
            '购买地产',
            `"${property.name}" 无主\n价格: $${property.price}\n\n是否购买？`
        );
        
        if (confirmed) {
            if (player.money >= property.price) {
                player.money -= property.price;
                property.owner = player.name;
                player.properties.push(player.position);
                showEventMessage(`${player.name} 购买了 "${property.name}"！`);
                
                if (gameState.mode === 'multiplayer') {
                    await updatePropertyOnServer(player.position, player.name);
                }
            } else {
                await showAlertDialog('资金不足', '你的资金不足，无法购买此地产！');
            }
        }
    } else if (property.owner !== player.name) {
        const owner = gameState.players.find(p => p.name === property.owner);
        if (owner) {
            const rent = property.rent[0];
            player.money -= rent;
            owner.money += rent;
            showEventMessage(`${player.name} 支付 $${rent} 租金给 ${owner.name}`);
        }
    }
}

async function handleChanceCard() {
    const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
    const player = gameState.players[gameState.currentPlayerIndex];
    
    showEventMessage(`${player.name} 抽到机会卡: ${card.text}`);
    
    if (card.money) {
        player.money += card.money;
        showEventMessage(`${player.name} ${card.money > 0 ? '获得' : '失去'} $${Math.abs(card.money)}`);
    }
    if (card.move !== undefined) {
        player.position = card.move;
        showEventMessage(`${player.name} 移动到位置 ${card.move}`);
    }
    
    updateBoardTokens();
    updatePlayerStats();
}

async function handleCommunityCard() {
    const card = COMMUNITY_CARDS[Math.floor(Math.random() * COMMUNITY_CARDS.length)];
    const player = gameState.players[gameState.currentPlayerIndex];
    
    showEventMessage(`${player.name} 抽到社区宝箱: ${card.text}`);
    
    if (card.money) {
        player.money += card.money;
        showEventMessage(`${player.name} ${card.money > 0 ? '获得' : '失去'} $${Math.abs(card.money)}`);
    }
    if (card.move !== undefined) {
        player.position = card.move;
        showEventMessage(`${player.name} 移动到位置 ${card.move}`);
    }
    
    updateBoardTokens();
    updatePlayerStats();
}

async function endTurn() {
    // 设置玩家操作标志
    gameState.isPlayerAction = true;
    
    document.getElementById('endTurnBtn').style.display = 'none';
    document.getElementById('rollDiceBtn').style.display = 'inline-block';
    document.getElementById('rollDiceBtn').disabled = false;
    document.getElementById('diceDisplay').style.display = 'none';
    
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    updateCurrentPlayer();
    updatePlayerStats();
    updateGameControls();
    
    if (gameState.mode === 'multiplayer') {
        await syncGameStateToServer();
    }
    
    // 清除玩家操作标志
    gameState.isPlayerAction = false;
    
    const activePlayers = gameState.players.filter(p => p.money > 0);
    if (activePlayers.length <= 1) {
        const winner = activePlayers[0];
        showEventMessage(`🎉 游戏结束！${winner.name} 获胜！总资产: $${winner.money.toLocaleString()}`);
        await sleep(4000);
        backToMainMenu();
        return;
    }
    
    if (gameState.players[gameState.currentPlayerIndex].isBot && gameState.mode === 'single') {
        await sleep(1000);
        await rollDice();
    }
}

// ========================================
// 属性详情
// ========================================
function showPropertyDetails(propertyIndex) {
    const property = gameState.properties[propertyIndex];
    if (!property || property.type === 'start' || property.type === 'parking') return;
    
    const modal = document.getElementById('propertyModal');
    const details = document.getElementById('propertyDetails');
    
    let html = `
        <div class="property-header" style="background: ${property.color || '#667eea'}">
            <h3>${property.name}</h3>
            ${property.price ? `<div class="property-price">$${property.price}</div>` : ''}
        </div>
        <div class="property-info">
            <div class="property-info-item">
                <span>状态:</span>
                <span>${property.owner || '无主'}</span>
            </div>
        </div>
    `;
    
    if (property.rent) {
        html += `
            <div class="property-rent">
                <div class="rent-title">租金表:</div>
                ${property.rent.map((r, i) => `
                    <div class="rent-row">
                        <span>${i === 0 ? '无房屋' : i === 5 ? '酒店' : i + '间房屋'}</span>
                        <span>$${r}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    details.innerHTML = html;
    modal.classList.add('active');
}

function closePropertyModal() {
    document.getElementById('propertyModal').classList.remove('active');
}

// ========================================
// 游戏菜单
// ========================================
function toggleGameMenu() {
    document.getElementById('gameMenuModal').classList.toggle('active');
}

function showGameRules() {
    showAlertDialog(
        '🎲 游戏规则',
        `1. 初始资金: $1500\n2. 轮流掷骰子前进 2-12 格\n3. 通过起点获得 $200\n4. 可以购买无主地产\n5. 停在他人地产支付租金\n6. 破产出局，最后一位获胜\n\n按空格键快速掷骰子，ESC打开菜单\n祝您游戏愉快！🎉`
    );
}

async function quitToMainMenu() {
    const confirmed = await showConfirmDialog('退出游戏', '确定要退出当前游戏吗？');
    if (confirmed) {
        resetGameState();
        toggleGameMenu();
        backToMainMenu();
    }
}

// ========================================
// 工具函数
// ========================================
function resetGameState() {
    gameState = {
        mode: 'single', roomCode: null, playerName: null, players: [],
        currentPlayerIndex: 0, board: [], properties: [], isHost: false, 
        gameStarted: false, updateInterval: null, isPlayerAction: false
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showEventMessage(message) {
    const eventMsg = document.getElementById('eventMessage');
    eventMsg.textContent = message;
    eventMsg.style.display = 'block';
    setTimeout(() => eventMsg.style.display = 'none', 3000);
}

// ========================================
// 🎨 自定义对话框系统
// ========================================
function showAlertDialog(title, message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog';
        dialog.innerHTML = `
            <div class="custom-dialog-header">
                <h3>${title}</h3>
            </div>
            <div class="custom-dialog-body">
                <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="custom-dialog-footer">
                <button class="custom-dialog-btn primary" id="alertOkBtn">确定</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);
        
        const okBtn = dialog.querySelector('#alertOkBtn');
        okBtn.onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve(true);
            }, 300);
        };
        okBtn.focus();
    });
}

function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog';
        dialog.innerHTML = `
            <div class="custom-dialog-header">
                <h3>${title}</h3>
            </div>
            <div class="custom-dialog-body">
                <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="custom-dialog-footer">
                <button class="custom-dialog-btn secondary" id="confirmCancelBtn">取消</button>
                <button class="custom-dialog-btn primary" id="confirmOkBtn">确定</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);
        
        const okBtn = dialog.querySelector('#confirmOkBtn');
        const cancelBtn = dialog.querySelector('#confirmCancelBtn');
        
        const closeDialog = (result) => {
            overlay.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve(result);
            }, 300);
        };
        
        okBtn.onclick = () => closeDialog(true);
        cancelBtn.onclick = () => closeDialog(false);
        
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeDialog(false);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        okBtn.focus();
    });
}

// ========================================
// 事件监听器
// ========================================
window.onclick = function(event) {
    const propertyModal = document.getElementById('propertyModal');
    const gameMenuModal = document.getElementById('gameMenuModal');
    if (event.target === propertyModal) closePropertyModal();
    if (event.target === gameMenuModal) toggleGameMenu();
};

document.addEventListener('keydown', (e) => {
    if (currentScreen === 'gameScreen') {
        if (e.key === 'Escape') toggleGameMenu();
        if (e.key === ' ' && !document.getElementById('rollDiceBtn').disabled) {
            e.preventDefault();
            rollDice();
        }
    }
});

// ========================================
// 🆕 多人游戏同步功能
// ========================================
function startMultiplayerGameSync() {
    if (gameState.mode !== 'multiplayer' || !gameState.roomCode) return;
    
    if (gameState.updateInterval) clearInterval(gameState.updateInterval);
    gameState.updateInterval = setInterval(async () => {
        if (currentScreen === 'gameScreen' && gameState.gameStarted) {
            // 避免在玩家操作期间同步，防止位置被覆盖
            if (!gameState.isPlayerAction) {
                await syncGameStateFromServer();
            }
        }
    }, 3000);
}

async function syncGameStateToServer() {
    if (gameState.mode !== 'multiplayer' || !gameState.roomCode) return;
    
    try {
        const gameData = {
            currentPlayerIndex: gameState.currentPlayerIndex,
            players: gameState.players,
            properties: gameState.properties
        };
        
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_game_state',
                room_code: gameState.roomCode,
                game_data: gameData
            })
        });
        
        for (const player of gameState.players) {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_player',
                    room_code: gameState.roomCode,
                    player_name: player.name,
                    position: player.position,
                    money: player.money,
                    is_active: player.money > 0
                })
            });
        }
    } catch (error) {
        console.error('❌ 同步游戏状态失败:', error);
    }
}

async function syncGameStateFromServer() {
    if (gameState.mode !== 'multiplayer' || !gameState.roomCode) return;
    
    try {
        const response = await fetch(`${API_URL}?action=get_game_state&room_code=${gameState.roomCode}`);
        const data = await response.json();
        
        if (data.error || !data.state) return;
        
        const serverState = data.state.game_data;
        if (!serverState || typeof serverState !== 'object') return;
        
        let needsUpdate = false;
        
        if (Number.isInteger(serverState.currentPlayerIndex) && serverState.currentPlayerIndex >= 0) {
            if (serverState.currentPlayerIndex !== gameState.currentPlayerIndex) {
                gameState.currentPlayerIndex = serverState.currentPlayerIndex;
                needsUpdate = true;
            }
        }
        
        if (Array.isArray(serverState.players) && serverState.players.length === gameState.players.length) {
            for (let i = 0; i < gameState.players.length; i++) {
                const sp = serverState.players[i];
                if (!sp) continue;
                const lp = gameState.players[i];
                
                // 特殊处理：如果是当前玩家且正在操作，不覆盖位置
                const isCurrentPlayer = i === gameState.currentPlayerIndex;
                const isMyPlayer = lp.name === gameState.playerName;
                
                let shouldUpdate = false;
                
                // 位置更新逻辑：只有非当前玩家或非我的玩家才从服务器同步位置
                if (typeof sp.position === 'number' && sp.position !== lp.position) {
                    if (!isCurrentPlayer || !isMyPlayer) {
                        shouldUpdate = true;
                    }
                }
                
                // 金钱和名字总是可以同步
                if (typeof sp.money === 'number' && sp.money !== lp.money) {
                    shouldUpdate = true;
                }
                if (typeof sp.name === 'string' && sp.name !== lp.name) {
                    shouldUpdate = true;
                }
                
                if (shouldUpdate) {
                    gameState.players[i] = { ...lp, ...sp };
                    needsUpdate = true;
                }
            }
        }
        
        if (Array.isArray(serverState.properties) && serverState.properties.length === gameState.properties.length) {
            for (let i = 0; i < gameState.properties.length; i++) {
                const sp = serverState.properties[i];
                if (sp && sp.owner !== gameState.properties[i].owner) {
                    gameState.properties[i] = { ...gameState.properties[i], ...sp };
                    needsUpdate = true;
                }
            }
        }
        
        if (needsUpdate) {
            updateCurrentPlayer();
            updatePlayerStats();
            updateBoardTokens();
            updateGameControls();
            
            // 如果玩家位置发生变化，可能需要处理落地事件
            // 但只在非当前玩家操作期间进行
            if (!gameState.isPlayerAction) {
                // 检查是否有玩家位置变化，如果有则处理落地事件
                for (let i = 0; i < gameState.players.length; i++) {
                    const player = gameState.players[i];
                    if (player.name === gameState.playerName && i === gameState.currentPlayerIndex) {
                        // 这是当前玩家，不在这里处理落地事件
                        continue;
                    }
                    // 对于其他玩家，可以在这里处理一些被动效果
                }
            }
        }
    } catch (error) {
        console.error('❌ 同步失败:', error);
    }
}

async function updatePropertyOnServer(position, ownerName) {
    if (gameState.mode !== 'multiplayer' || !gameState.roomCode) return;
    
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_property',
                room_code: gameState.roomCode,
                position: position,
                owner: ownerName,
                house_count: 0
            })
        });
    } catch (error) {
        console.error('❌ 更新地产失败:', error);
    }
}

function updateGameControls() {
    const rollBtn = document.getElementById('rollDiceBtn');
    const endTurnBtn = document.getElementById('endTurnBtn');
    
    if (gameState.mode === 'multiplayer') {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const isMyTurn = currentPlayer && currentPlayer.name === gameState.playerName;
        
        if (isMyTurn) {
            rollBtn.style.opacity = '1';
            rollBtn.style.cursor = 'pointer';
            endTurnBtn.style.opacity = '1';
            endTurnBtn.style.cursor = 'pointer';
        } else {
            rollBtn.style.opacity = '0.5';
            rollBtn.style.cursor = 'not-allowed';
            endTurnBtn.style.opacity = '0.5';
            endTurnBtn.style.cursor = 'not-allowed';
        }
    }
}

console.log('🎲 大富翁游戏脚本加载完成！');
