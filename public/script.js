const socket = io();
let mode = null;
let roomId = null;
let p1Score = 0;
let p2Score = 0;
let maxScore = 3;

const emojis = { 'rock': '🪨', 'paper': '📄', 'scissors': '✂️' };

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('room')) {
    setTimeout(() => startMode('online'), 500); 
}

function startMode(selectedMode) {
    mode = selectedMode;
    maxScore = parseInt(document.getElementById('max-score-input').value) || 3;
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('game-area').classList.remove('hidden');

    if (mode === 'online') {
        roomId = urlParams.get('room') || Math.random().toString(36).substring(7);
        if (!urlParams.has('room')) window.history.pushState({}, '', `?room=${roomId}`);
        const currentUrl = window.location.href;
        document.getElementById('share-url').value = currentUrl;
        document.getElementById('qr-code').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`;
        document.getElementById('share-container').classList.remove('hidden');
        socket.emit('joinGame', { roomId, maxScore });
    } else {
        document.getElementById('target-score-display').innerText = `Goal: ${maxScore}`;
    }
}

socket.on('waiting', (msg) => { document.getElementById('status-text').innerText = msg; });
socket.on('gameStart', (sMax) => { 
    maxScore = sMax; p1Score = 0; p2Score = 0; updateScore();
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('status-text').innerText = "Fight!";
    document.getElementById('choice-buttons').classList.remove('hidden');
});

socket.on('opponentMoved', () => { document.getElementById('status-text').innerText = "Opponent is ready..."; });

socket.on('roundResult', (moves) => {
    const myMove = moves[socket.id];
    const oppMove = moves[Object.keys(moves).find(id => id !== socket.id)];
    animateClash(myMove, oppMove);
});

function play(move) {
    document.getElementById('choice-buttons').classList.add('hidden');
    if (mode === 'ai') {
        const aiMove = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];
        animateClash(move, aiMove);
    } else {
        socket.emit('makeMove', { roomId, move });
        document.getElementById('status-text').innerText = "Waiting...";
    }
}

function animateClash(p1, p2) {
    const clash = document.getElementById('clash-display');
    document.getElementById('my-clash-move').innerText = emojis[p1];
    document.getElementById('opp-clash-move').innerText = emojis[p2];
    document.getElementById('my-clash-move').className = 'clash-icon slide-in-left';
    document.getElementById('opp-clash-move').className = 'clash-icon slide-in-right';
    clash.classList.remove('hidden');
    setTimeout(() => { clash.classList.add('hidden'); calculate(p1, p2); }, 1500);
}

function calculate(p1, p2) {
    if (p1 !== p2) {
        if ((p1==='rock' && p2==='scissors') || (p1==='paper' && p2==='rock') || (p1==='scissors' && p2==='paper')) p1Score++;
        else p2Score++;
    }
    updateScore();
    if (p1Score >= maxScore || p2Score >= maxScore) {
        document.getElementById('end-message').innerText = p1Score >= maxScore ? "🏆 YOU WIN!" : "💀 YOU LOSE!";
        document.getElementById('game-over-screen').classList.remove('hidden');
    } else {
        document.getElementById('choice-buttons').classList.remove('hidden');
    }
}

function updateScore() {
    document.getElementById('p1-score').innerText = p1Score;
    document.getElementById('p2-score').innerText = p2Score;
}

function requestRematch() {
    if (mode === 'ai') location.reload();
    else socket.emit('rematch', roomId);
}



