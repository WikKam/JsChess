const Chess = require('chess.js').Chess
var socket = require('socket.io-client')();
//var chess = require("chess.js");
//var chessboard = require("chessboard");
const button = document.getElementById('joinQueue');
const nameField = document.getElementById('name');
const body = document.getElementsByTagName('body')[0];
const form = document.getElementById('nameForm');
let enemyName;
let playerName;
let yourColor;

button.onclick = () => {
    let name = nameField.value;
    if(name === ''){
        alert('Invalid name!');
    }
    else{
        socket.emit('join queue', name);
    }
}

const findEnemy = () => {
    socket.emit('find enemy', playerName);
    createWaitingForPlayerView()
}

var board;
var game;
var onDragStart = (source, piece, position, orientation) => {
   if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() !== yourColor)) {
        return false;
    }
}
var onDrop = (src, trgt) => {
    let args = {
        from: src,
        to: trgt
    }
    let move = game.move(args);
    if(move===null || move.color != yourColor)
            return 'snapback';
    else{
        //socket.broadcast.emit('move', move);
        socket.emit('move',{move: move, player: playerName});
        //board.position(game.fen())
    }
}
let initGame = () => {
    let waiting = document.getElementById('waiting');
    body.removeChild(waiting);
    let config = {
        draggable: true,
        showNotation: false,
        orientation: yourColor,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    }
    board = new Chessboard('gameBoard', config);
    game = new Chess();
    console.log(yourColor);
}
var onSnapEnd = function() {
    board.position(game.fen());
};

socket.on('start game', (game) => {
    if(game.whitePlayer != playerName && game.blackPlayer != playerName)return;
    yourColor = game.whitePlayer == playerName ? 'w' : 'b';
    enemyName = game.whitePlayer != playerName ? game.whitePlayer : game.blackPlayer;
    initGame(); 
})

socket.on('move',(msg) => {
    game.move(msg);
    board.position(game.fen())
})

socket.on('error', (msg) => {
    alert(msg);
})

socket.on('join success', (msg) => {
    playerName = msg;
    createFindEnemyView(msg);
})

socket.on('enemy left', () => {
    alert("Your enemy left!");
    let b = document.getElementById('gameBoard');
    body.removeChild(b);
    let newBoard = document.createElement('div');
    newBoard.id = 'gameBoard';
    newBoard.style.width = '400px';
    body.appendChild(newBoard);
    createFindEnemyView(playerName);
})

function createFindEnemyView(msg){
    try{
    body.removeChild(form);
    }catch(e){
        //pass
    }
    let div = document.createElement('div');
    let span = document.createElement('span');
    span.innerHTML = `<span>Joined successfully as ${msg}! Press the button to find an opponent!</span>`; 
    div.append(span);
    div.id = 'lobby';
    let findEnemyButton = document.createElement('button');
    findEnemyButton.textContent = 'Find an enemy!';
    div.append(findEnemyButton);
    body.append(div);
    findEnemyButton.onclick = findEnemy;
}

function createWaitingForPlayerView(){
    let lobby = document.getElementById('lobby');
    body.removeChild(lobby);
    let span = document.createElement('span');
    span.id = 'waiting';
    span.textContent = 'Waiting for player to join lobby...';
    body.appendChild(span);
}

