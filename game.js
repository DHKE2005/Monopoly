// game.js - 大富翁完整游戏逻辑（100%修复版）
console.log('🎲 大富翁游戏脚本加载中...');

// ========================================
// 全局变量和配置
// ========================================
const API_URL = 'api.php';
let gameState = {
    mode: 'single',
    roomCode: null,
    playerName: null,
    players: [],
    currentPlayerIndex: 0,
    board: [],
    properties: [],
    isHost: false,
    gameStarted: false
};

let currentScreen = 'mainMenu';

// 游戏棋盘配置（40个位置）
const BOARD_CONFIG = [
    { id: 0, name: '出发', type: 'start', color: '#4CAF50' },
    { id: 1, name: '地中海大道', type: 'property', color: '#8BC34A', price: 60, rent: [2, 10, 30, 90, 160, 250] },
    { id: 2, name: '社区宝箱', type: 'chance' },
    { id: 3, name: '巴尔的摩大道', type: 'property', color: '#8BC34A', price: 60, rent: [4, 20, 60, 180, 320, 450] },
    { id: 4, name: '缴税 $200', type: 'tax', amount: 200 },
    { id: 5, name: '铁路', type: 'railroad', price: 200, rent: [25, 50, 100, 200] },
    { id: 6, name: '东方大道', type: 'property', color: '#2196F3', price: 100, rent: [6, 30, 90, 270, 400, 550] },
    { id: 7, name: '机会', type: 'community' },
    { id: 8, name: '佛蒙特大道', type: 'property', color: '#2196F3', price: 100, rent: [6, 30, 90, 270, 400, 550] },
    { id: 9, name: '康涅狄格大道', type: 'property', color: '#2196F3', price: 120, rent: [8, 40, 100, 300, 450, 600] },
    { id: 10, name: '监狱', type: 'jail' },
    { id: 11, name: '圣查尔斯广场', type: 'property', color: '#FF9800', price: 140, rent: [10, 50, 150, 450, 625, 800] },
    { id: 12, name: '电力公司', type: 'utility', price: 150, rent: [4, 10] },
    { id: 13, name: '电报大道', type: 'property', color: '#FF9800', price: 140, rent: [10, 50, 150, 450, 625, 800] },
    { id: 14, name: '宾夕法尼亚铁路', type: 'railroad', price: 200, rent: [25, 50, 100, 200] },
    { id: 15, name: '弗吉尼亚大道', type: 'property', color: '#FF5722', price: 160, rent: [12, 60, 180, 500, 700, 900] },
    { id: 16, name: '宾夕法尼亚铁路', type: 'railroad', price: 200, rent: [25, 50, 100, 200] },
    { id: 17, name: '圣詹姆斯广场', type: 'property', color: '#FF5722', price: 180, rent: [14, 70, 200, 550, 750, 950] },
    { id: 18, name: '社区宝箱', type: 'chance' },
    { id: 19, name: '田纳西大道', type: 'property', color: '#FF5722', price: 180, rent: [14, 70, 200, 550, 750, 950] },
    { id: 20, name: '免费停车', type: 'parking' },
    { id: 21, name: '纽约大道', type: 'property', color: '#F44336', price: 200, rent: [16, 80, 220, 600, 800, 1000] },
    { id: 22, name: '地铁', type: 'railroad', price: 200, rent: [25, 50, 100, 200] },
    { id: 23, name: '肯塔基大道', type: 'property', color: '#F44336', price: 220, rent: [18, 90, 250, 700, 875, 1050] },
    { id: 24, name: '机会', type: 'community' },
    { id: 25, name: '印第安纳大道', type: 'property', color: '#F44336', price: 220, rent: [18, 90, 250, 700, 875, 1050] },
    { id: 26, name: '伊利诺伊大道', type: 'property', color: '#F44336', price: 240, rent: [20, 100, 300, 750, 925, 1100] },
    { id: 27, name: 'B&O铁路', type: 'railroad', price: 200, rent: [25, 50, 100, 200] },
    { id: 28, name: '大西洋大道', type: 'property', color: '#FFC107', price: 260, rent: [22, 110, 330, 800, 975, 1150] },
    { id: 29, name: '通风管道', type: 'tax', amount: 75 },
    { id: 30, name: '伯灵顿大道', type: 'property', color: '#FFC107', price: 260, rent: [22, 110, 330, 800, 975, 1150] },
    { id: 31, name: '宾夕法尼亚大道', type: 'property', color: '#FFC107', price: 280, rent: [24, 120, 360, 850, 1025, 1200] },
    { id: 32, name: '社区宝箱', type: 'chance' },
    { id: 33, name: '太平洋大道', type: 'property', color: '#9C27B0', price: 300, rent: [26, 130, 390, 900, 1100, 1275] },
    { id: 34, name: '北卡罗来纳大道', type: 'property', color: '#9C27B0', price: 300, rent: [26, 130, 390, 900, 1100, 1275] },
    { id: 35, name: '社区宝箱', type: 'community' },
    { id: 36, name: '宾夕法尼亚大道', type: 'property', color: '#9C27B0', price: 320, rent: [28, 150, 450, 1000, 1200, 1400] },
    { id: 37, name: '水务公司', type: 'utility', price: 150, rent: [4, 10] },
    { id: 38, name: '文多大道', type: 'property', color: '#607D8B', price: 350, rent: [35, 175, 525, 1100, 1300, 1500] },
    { id: 39, name: '前往监狱', type: 'gotojail' }
];

// 机会卡和社区宝箱卡片
const CHANCE_CARDS = [
    { text: '前进到铁路，获得$25', move: 5, money: 25 },
    { text: '前进到水务公司', move: 12 },
    { text: '前进到太平洋大道', move: 23 },
    { text: '退回出发，获得$200', move: -3, money: 200 },
    { text: '支付$50修理费用', money: -50 },
    { text: '获得银行错误$200', money: 200 }
];

const COMMUNITY_CARDS = [
    { text: '医院费用$100', money: -100 },
    { text: '学校费用$150', money: -150 },
    { text: '获得$100', money: 100 },
    { text: '前进到最近的铁路', move: 5 },
    { text: '支付每栋房屋$25', money: -25 }
];

// ========================================
// 初始化事件监听
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // ✅ 修复：为所有按钮绑定事件
    document.querySelectorAll('.bot-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectBotCount(parseInt(this.dataset.count));
        });
    });
    
    document.querySelectorAll('.player-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectMaxPlayers(parseInt(this.dataset.count));
        });
    });
    
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectRoomType(this.dataset.lan === 'true');
        });
    });
    
    console.log('✅ 事件监听器绑定完成！');
});

// ========================================
// 屏幕管理
// ========================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    
    switch(screenId) {
        case 'mainMenu':
            document.getElementById('playerName').value = '';
            break;
        case 'singlePlayerSetup':
            selectBotCount(2);
            break;
        case 'multiplayerMenu':
            document.getElementById('multiPlayerName').value = '';
            break;
    }
}

function backToMainMenu() {
    showScreen('mainMenu');
    if (gameState.mode === 'multiplayer' && gameState.roomCode) {
        leaveRoom();
    }
    resetGameState();
}

// ========================================
// 主菜单功能
// ========================================
function showSinglePlayerSetup() { showScreen('singlePlayerSetup'); }

function showMultiplayerMenu() { showScreen('multiplayerMenu'); }

function exitGame() {
    if (confirm('确定要退出游戏吗？')) {
        window.close();
    }
}

// ========================================
// 单人游戏设置 - ✅ 修复版
// ========================================
function selectBotCount(count) {
    document.querySelectorAll('.bot-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('botCount').value = count;
}

function startSinglePlayer() {
    const playerName = document.getElementById('playerName').value.trim();
    const botCount = parseInt(document.getElementById('botCount').value);
    
    if (!playerName) {
        alert('请输入您的名字！');
        return;
    }
    
    gameState.mode = 'single';
    gameState.playerName = playerName;
    gameState.players = [{
        name: playerName,
        color: '#FF5252',
        money: 1500,
        position: 0,
        isBot: false,
        properties: []
    }];
    
    const botNames = ['AI小强', 'AI小华', 'AI小明'];
    const botColors = ['#2196F3', '#4CAF50', '#FFC107'];
    
    for (let i = 0; i < botCount; i++) {
        gameState.players.push({
            name: botNames[i],
            color: botColors[i],
            money: 1500,
            position: 0,
            isBot: true,
            properties: []
        });
    }
    
    gameState.board = [...BOARD_CONFIG];
    gameState.properties = BOARD_CONFIG.map(p => ({ ...p, owner: null, houses: 0 }));
    
    showScreen('gameScreen');
    initGameScreen();
}

// ========================================
// 多人游戏功能 - ✅ 简化版（本地模拟）
// ========================================
function showCreateRoom() {
    showScreen('createRoomScreen');
    selectMaxPlayers(4);
    selectRoomType(true);
}

function showJoinRoom() {
    showScreen('joinRoomScreen');
    refreshRoomList();
}

function selectMaxPlayers(count) {
    document.querySelectorAll('.player-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('maxPlayers').value = count;
}

function selectRoomType(isLan) {
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('isLanRoom').value = isLan;
}

function createRoom() {
    const playerName = document.getElementById('multiPlayerName').value.trim();
    const roomName = document.getElementById('roomName').value.trim();
    
    if (!playerName || !roomName) {
        alert('请输入玩家名和房间名！');
        return;
    }
    
    // ✅ 模拟房间创建
    gameState.mode = 'multiplayer';
    gameState.playerName = playerName;
    gameState.roomCode = 'ROOM' + Math.random().toString(36).substr(2, 4).toUpperCase();
    gameState.isHost = true;
    
    document.getElementById('displayRoomCode').textContent = gameState.roomCode;
    document.getElementById('displayRoomName').textContent = roomName;
    showScreen('waitingRoom');
    updateWaitingRoom();
}

function switchRoomTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('isLanRoom').value = tab === 'lan';
    refreshRoomList();
}

function refreshRoomList() {
    const roomList = document.getElementById('roomList');
    roomList.innerHTML = `
        <div class="room-item" onclick="joinRoomByCode('ROOM1234')">
            <div class="room-item-info">
                <h4>测试房间</h4>
                <p>房主: 测试玩家</p>
            </div>
            <div class="room-item-details">
                <div class="room-code">ROOM1234</div>
                <div class="room-players">2/4人</div>
            </div>
        </div>
    `;
}

function joinRoomByCode(roomCode) {
    const playerName = document.getElementById('multiPlayerName').value.trim();
    if (!playerName) {
        alert('请输入您的名字！');
        return;
    }
    
    gameState.mode = 'multiplayer';
    gameState.playerName = playerName;
    gameState.roomCode = roomCode;
    gameState.isHost = false;
    
    document.getElementById('displayRoomCode').textContent = roomCode;
    showScreen('waitingRoom');
    updateWaitingRoom();
}

function updateWaitingRoom() {
    const playerList = document.getElementById('playerList');
    const players = [
        { player_name: gameState.playerName, player_color: gameState.isHost ? '#FF5252' : '#2196F3' }
    ];
    
    playerList.innerHTML = players.map(player => `
        <div class="player-card" style="border-color: ${player.player_color}">
            <div class="player-avatar" style="background: ${player.player_color}">${player.player_name[0]}</div>
            <div class="player-info">
                <h4>${player.player_name}</h4>
                ${player.player_name === gameState.playerName ? '<p class="player-status">我</p>' : ''}
            </div>
        </div>
    `).concat(Array(3).fill(`
        <div class="player-card waiting">
            <div class="player-avatar">👤</div>
        </div>
    `)).join('');
    
    document.getElementById('startGameBtn').style.display = gameState.isHost ? 'inline-block' : 'none';
    setTimeout(updateWaitingRoom, 2000);
}

function leaveRoom() {
    resetGameState();
    backToMultiplayerMenu();
}

function backToMultiplayerMenu() { showScreen('multiplayerMenu'); }

function startMultiplayerGame() {
    gameState.gameStarted = true;
    gameState.players = [{
        name: gameState.playerName,
        color: '#FF5252',
        money: 1500,
        position: 0,
        isBot: false,
        properties: []
    }];
    gameState.board = [...BOARD_CONFIG];
    gameState.properties = BOARD_CONFIG.map(p => ({ ...p, owner: null, houses: 0 }));
    showScreen('gameScreen');
    initGameScreen();
}

// ========================================
// 游戏主逻辑
// ========================================
function initGameScreen() {
    generateBoard();
    updatePlayerStats();
    updateCurrentPlayer();
    updateBoardTokens();
}

function generateBoard() {
    const board = document.getElementById('gameBoard');
    // ✅ 修复：生成正确的 HTML 结构
    let html = '';
    for (let i = 0; i < 11; i++) {
        for (let j = 0; j < 11; j++) {
            let index = -1;
            if (i === 0) index = j;
            else if (i === 10 && j < 10) index = 19 - j;
            else if (j === 10 && i > 0 && i < 10) index = 20 + i;
            else if (j === 0 && i > 0 && i < 10) index = 10 + i;
            
            if (index >= 0 && index < 40) {
                const space = gameState.board[index];
                let className = 'board-cell';
                if ([0, 10, 20, 30].includes(index)) className += ' corner';
                if (space.color) className += ' property';
                
                html += `
                    <div class="${className}" data-index="${index}" onclick="showPropertyDetails(${index})" 
                         style="--property-color: ${space.color || '#ccc'}">
                        <div class="cell-name">${space.name}</div>
                        ${space.price ? `<div class="cell-price">$${space.price}</div>` : ''}
                    </div>
                `;
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
        <div class="player-stat-card ${gameState.currentPlayerIndex === i ? 'active' : ''}" style="border-left-color: ${player.color}">
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
    
    showEventMessage(`${gameState.players[gameState.currentPlayerIndex].name} 掷出: ${roll1} + ${roll2} = ${total}`);
    await sleep(1500);
    
    await movePlayer(total);
    await handleLanding();
    
    document.getElementById('endTurnBtn').style.display = 'inline-block';
    rollBtn.style.display = 'none';
}

async function movePlayer(steps) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const startPos = player.position;
    
    for (let i = 1; i <= steps; i++) {
        player.position = (player.position + 1) % 40;
        updateBoardTokens();
        await sleep(200);
    }
    
    if (player.position < startPos) {
        player.money += 200;
        showEventMessage('通过起点！获得 $200');
    }
}

async function handleLanding() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const space = gameState.properties[player.position];
    
    switch (space.type) {
        case 'property':
            await handlePropertyLanding(space);
            break;
        case 'tax':
            player.money -= space.amount;
            showEventMessage(`缴纳 ${space.name}: -$${space.amount}`);
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
            showEventMessage('进入监狱！');
            break;
        case 'parking':
            player.money += 200;
            showEventMessage('免费停车！获得 $200');
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
        if (confirm(`"${property.name}" 无主，价格 $${property.price}\n是否购买？`)) {
            if (player.money >= property.price) {
                player.money -= property.price;
                property.owner = player.name;
                player.properties.push(player.position);
                showEventMessage(`${player.name} 购买了 "${property.name}"！`);
            } else {
                showEventMessage('资金不足，无法购买');
            }
        }
    } else if (property.owner !== player.name) {
        const owner = gameState.players.find(p => p.name === property.owner);
        const rent = property.rent[0];
        player.money -= rent;
        owner.money += rent;
        showEventMessage(`${player.name} 支付 $${rent} 租金给 ${owner.name}`);
    }
}

async function handleChanceCard() {
    const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
    showEventMessage(card.text);
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (card.money) player.money += card.money;
    if (card.move) player.position = (player.position + card.move + 40) % 40;
    updateBoardTokens();
}

async function handleCommunityCard() {
    const card = COMMUNITY_CARDS[Math.floor(Math.random() * COMMUNITY_CARDS.length)];
    showEventMessage(card.text);
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (card.money) player.money += card.money;
    if (card.move) player.position = (player.position + card.move + 40) % 40;
    updateBoardTokens();
}

async function endTurn() {
    document.getElementById('endTurnBtn').style.display = 'none';
    document.getElementById('rollDiceBtn').style.display = 'inline-block';
    document.getElementById('rollDiceBtn').disabled = false;
    document.getElementById('diceDisplay').style.display = 'none';
    
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    updateCurrentPlayer();
    updatePlayerStats();
    
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
    alert(`🎲 大富翁游戏规则\n\n1. 初始资金: $1500\n2. 轮流掷骰子前进 2-12 格\n3. 通过起点获得 $200\n4. 可以购买无主地产\n5. 停在他人地产支付租金\n6. 破产出局，最后一位获胜\n\n按空格键快速掷骰子，ESC打开菜单\n祝您游戏愉快！🎉`);
}

function quitToMainMenu() {
    if (confirm('确定退出游戏？')) {
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
        currentPlayerIndex: 0, board: [], properties: [], isHost: false, gameStarted: false
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

console.log('🎲 大富翁游戏脚本加载完成！');