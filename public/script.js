const socket = io();
let mode = null;
let roomId = null;
let p1Score = 0;
let p2Score = 0;

// Auto-join if URL has a room ID
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('room')) {
    startMode('online');
}

function startMode(selectedMode) {
    mode = selectedMode;
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('game-area').classList.remove('hidden');

    if (mode === 'online') {
        roomId = urlParams.get('room') || Math.random().toString(36).substring(7);
        if (!urlParams.has('room')) window.history.pushState({}, '', `?room=${roomId}`);
        
        document.getElementById('mode-label').innerText = "Online";
        document.getElementById('share-container').classList.remove('hidden');
        document.getElementById('share-url').value = window.location.href;
        
        socket.emit('joinGame', roomId);
    }
}

socket.on('waiting', (msg) => { document.getElementById('status-text').innerText = msg; });
socket.on('gameStart', () => { document.getElementById('status-text').innerText = "Opponent Joined! Make your move."; });

socket.on('roundResult', (moves) => {
    const myMove = moves[socket.id];
    const oppId = Object.keys(moves).find(id => id !== socket.id);
    const oppMove = moves[oppId];
    calculate(myMove, oppMove);
});

function play(move) {
    if (mode === 'ai') {
        const aiMove = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];
        calculate(move, aiMove);
    } else {
        socket.emit('makeMove', { roomId, move });
        document.getElementById('status-text').innerText = "Waiting for opponent...";
    }
}

function calculate(p1, p2) {
    let msg = "";
    if (p1 === p2) msg = `Tie! Both picked ${p1}`;
    else if ((p1 === 'rock' && p2 === 'scissors') || (p1 === 'paper' && p2 === 'rock') || (p1 === 'scissors' && p2 === 'paper')) {
        msg = `Win! ${p1} beats ${p2}`;
        p1Score++;
    } else {
        msg = `Loss! ${p2} beats ${p1}`;
        p2Score++;
    }
    document.getElementById('status-text').innerText = msg;
    document.getElementById('p1-score').innerText = p1Score;
    document.getElementById('p2-score').innerText = p2Score;
}
