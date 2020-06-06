const Chess = require('chess.js').Chess
var socket = require('socket.io-client')();
//var chess = require("chess.js");
//var chessboard = require("chessboard");
const button = document.getElementById('joinQueue');
const nameField = document.getElementById('name');
const body = document.getElementById('content');
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
    console.log('find enemy pressed');
    removeBoardAfterGame();
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
    let loader = document.getElementById('loader');
    body.removeChild(waiting);
    body.removeChild(loader);
    let config = {
        draggable: true,
        showNotation: false,
        orientation: yourColor == 'w' ? 'white' : 'black',
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    }
    document.getElementById('showMove').textContent = yourColor == 'w' ?
     'Your move!' :
      "Opponent's move"
    board = new Chessboard('gameBoard', config);
    game = new Chess();
    console.log(yourColor);
}
var onSnapEnd = () => {
    board.position(game.fen());
    if(game.game_over()){
        if (game.in_checkmate()){
            createViewAfterGameEnded('You Won!');
        }
        else{
            createViewAfterGameEnded('It was a draw!');
        }
        socket.emit('game over', playerName);
    }
    else{
        document.getElementById('showMove').textContent = "Opponent's move"
    }
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
    if(game.game_over()){
        //current player lost
        if(game.in_checkmate()){
            //removeBoardAfterGame();
            createViewAfterGameEnded('You Lost!');
        }
        else{
            //removeBoardAfterGame();
            createViewAfterGameEnded('It was a draw!')
        }
        socket.emit('game over', playerName);
    }
    else{
        document.getElementById('showMove').textContent = "Your move!"
    }
})

socket.on('err', (msg) => {
    alert(msg);
})

socket.on('join success', (msg) => {
    playerName = msg;
    createFindEnemyView(msg);
})

function removeBoardAfterGame(){
    document.getElementById('showMove').textContent = '';
    let b = document.getElementById('gameBoard');
    if(b){
    body.removeChild(b);
    let newBoard = document.createElement('div');
    newBoard.id = 'gameBoard';
    newBoard.style.width = '400px';
    body.appendChild(newBoard);
    }
    let playAgain = document.getElementById('afterGameView');
    if(playAgain){
        body.removeChild(playAgain);
    }
}

socket.on('enemy left', () => {
    alert("Your enemy left!");
    //removeBoardAfterGame();
    createViewAfterGameEnded("Your enemy left!");
})

function createFindEnemyView(msg){
    try{
    body.removeChild(form);
    }catch(e){
        //pass
    }
    let div = document.createElement('div');
    let span = document.createElement('span');
    span.textContent = `Joined successfully as ${msg}! Press the button to find an opponent!`; 
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
    if(lobby){
    body.removeChild(lobby);
    }
    let span = document.createElement('span');
    span.id = 'waiting';
    span.textContent = 'Waiting for player to join lobby...';
    let div = document.createElement('div');
    div.id = 'loader';
    body.appendChild(span);
    body.appendChild(div);
}

function createViewAfterGameEnded(message){
    let div = document.createElement('div');
    let span = document.createElement('span')
    div.id = 'afterGameView';
    span.textContent = message;
    span.style.fontSize = '20px';
    span.style.marginTop = '3%';
    div.append(span)
    body.append(div);
    let button = document.createElement('button');
    button.textContent = "Play again!";
    div.append(button);
    button.onclick = findEnemy;
}
