const socket = io();
let mode = null;
let roomId = null;
let p1Score = 0;
let p2Score = 0;
let maxScore = 3;

const emojis = { 'rock': '🪨', 'paper': '📄', 'scissors': '✂️' };

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('room')) {
    startMode('online');
}

function startMode(selectedMode) {
    mode = selectedMode;
    maxScore = parseInt(document.getElementById('max-score-input').value) || 3;
    
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('game-area').classList.remove('hidden');

        if (mode === 'online') {
        roomId = urlParams.get('room') || Math.random().toString(36).substring(7);
        if (!urlParams.has('room')) window.history.pushState({}, '', `?room=${roomId}`);
        
        document.getElementById('mode-label').innerText = "Online";
        document.getElementById('share-container').classList.remove('hidden');
        
        const currentUrl = window.location.href;
        document.getElementById('share-url').value = currentUrl;
        
        // 🪄 NEW MAGIC: Generate the QR Code using a free API
        document.getElementById('qr-code').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`;
        
        socket.emit('joinGame', { roomId, maxScore });
    } else {


socket.on('waiting', (msg) => { document.getElementById('status-text').innerText = msg; });

socket.on('gameStart', (serverMaxScore) => { 
    maxScore = serverMaxScore; // Sync score with server
    p1Score = 0;
    p2Score = 0;
    updateScoreBoard();
    
    document.getElementById('target-score-display').innerText = `Goal: ${maxScore}`;
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('status-text').innerText = "Game On! Make your move."; 
    document.getElementById('choice-buttons').classList.remove('hidden');
});

// New feature: Tell player when opponent locks in
socket.on('opponentMoved', () => {
    document.getElementById('status-text').innerText = "Opponent locked in! Your turn.";
});

socket.on('roundResult', (moves) => {
    const myMove = moves[socket.id];
    const oppId = Object.keys(moves).find(id => id !== socket.id);
    const oppMove = moves[oppId];
    animateClash(myMove, oppMove);
});

function play(move) {
    document.getElementById('choice-buttons').classList.add('hidden'); // Hide buttons while waiting
    
    if (mode === 'ai') {
        const aiMove = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];
        animateClash(move, aiMove);
    } else {
        socket.emit('makeMove', { roomId, move });
        document.getElementById('status-text').innerText = "Move sent. Waiting for opponent...";
    }
}

function animateClash(p1, p2) {
    const clashDiv = document.getElementById('clash-display');
    const myClash = document.getElementById('my-clash-move');
    const oppClash = document.getElementById('opp-clash-move');
    const statusText = document.getElementById('status-text');

    // Setup animation elements
    myClash.innerText = emojis[p1];
    oppClash.innerText = emojis[p2];
    
    myClash.className = 'clash-icon slide-in-left';
    oppClash.className = 'clash-icon slide-in-right';
    
    clashDiv.classList.remove('hidden');
    statusText.innerText = "Clash!";

    // Wait 1.5 seconds so players can see the animation, then calculate winner
    setTimeout(() => {
        clashDiv.classList.add('hidden');
        calculate(p1, p2);
    }, 3000);
}

function calculate(p1, p2) {
    let msg = "";
    if (p1 === p2) msg = `Tie! Both picked ${emojis[p1]}`;
    else if ((p1 === 'rock' && p2 === 'scissors') || (p1 === 'paper' && p2 === 'rock') || (p1 === 'scissors' && p2 === 'paper')) {
        msg = `Point for You! ${emojis[p1]} beats ${emojis[p2]}`;
        p1Score++;
    } else {
        msg = `Opponent scored! ${emojis[p2]} beats ${emojis[p1]}`;
        p2Score++;
    }
    
    document.getElementById('status-text').innerText = msg;
    updateScoreBoard();
    
    // Check Win Condition
    if (p1Score >= maxScore || p2Score >= maxScore) {
        showGameOver(p1Score >= maxScore);
    } else {
        document.getElementById('choice-buttons').classList.remove('hidden'); // Show buttons for next round
    }
}

function updateScoreBoard() {
    document.getElementById('p1-score').innerText = p1Score;
    document.getElementById('p2-score').innerText = p2Score;
}

function showGameOver(didIWin) {
    const gameOverScreen = document.getElementById('game-over-screen');
    const endMessage = document.getElementById('end-message');
    
    endMessage.innerText = didIWin ? "🏆 YOU WIN! 🏆" : "💀 YOU LOSE! 💀";
    endMessage.style.color = didIWin ? "#4ade80" : "#ef4444"; // Green for win, red for loss
    
    gameOverScreen.classList.remove('hidden');
}

function requestRematch() {
    document.getElementById('end-message').innerText = "Waiting for opponent...";
    if (mode === 'ai') {
        socket.emit('gameStart', maxScore); // Fake it for AI
        // manually trigger the logic
        p1Score = 0; p2Score = 0; updateScoreBoard();
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('choice-buttons').classList.remove('hidden');
        document.getElementById('status-text').innerText = "Game On!";
    } else {
        socket.emit('rematch', roomId);
    }
}


