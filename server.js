const express = require('express');
const app = express();
const port = process.env.PORT || 3000
const http = require('http').Server(app)
const io = require("socket.io")(http);
app.use(express.static('public'));

const MAX_PLAYERS_NO = 20;
var players = [];
var playersMap = new Map();
var playersSearching = [];
function pickWhiteAndBlackPlayer(player1, player2){
    return Math.random() < 0.5 ? 
    {whitePlayer: player1, blackPlayer: player2} :
    {whitePlayer: player2, blackPlayer: player1};
}

function getEnemy(playerName){
    let current = playersMap.get(playerName);
    return playersMap.get(current.currentOpponent);
}

function findPlayerWithSocket(socket){
    return players.find(player => player.playerSocket.id == socket.id);
}

io.on('connection', (socket) => {
    console.log('Got a new connection!');
    console.log("socket: ")
    console.log(socket);
    //move message
    socket.on('move', (msg)=>{
       let enemySocket = getEnemy(msg.player).playerSocket;
       enemySocket.emit('move', msg.move);
    })

    socket.on('game over', (playerName) => {
        playersMap.get(playerName).currentOpponent = '';
    })

    socket.on('disconnect', () => {
        disconnectedPlayer = findPlayerWithSocket(socket);
        if(disconnectedPlayer){
            if(disconnectedPlayer.currentOpponent != ''){
                console.log("disconnectedplayer's opponent:" + disconnectedPlayer.currentOpponent);
                let enemy = playersMap.get(disconnectedPlayer.currentOpponent);
                enemy.currentOpponent = '';
                enemy.playerSocket.emit('enemy left',{});
            }
            players = players.filter(player => player !== disconnectedPlayer);
            playersSearching = playersSearching.filter(player => player !== disconnectedPlayer);
            playersMap.delete(disconnectedPlayer.playerName);
        }
    })

    //join queue message
    socket.on('join queue',(msg) => {
        if(playersMap.has(msg)){
            socket.emit('err', 'name is already taken');
        }
        else if(players.length == MAX_PLAYERS_NO){
            socket.emit('err', 'server is full. Come back a moment later!');
        }
        else{
            player = {
                playerName: msg,
                currentOpponent: '',
                playerSocket: socket,
            }
            players.push(player);
            playersMap.set(msg,player);
            socket.emit('join success',msg);
        }
    })

    socket.on('find enemy', (msg) => {
        current = playersMap.get(msg);
        if(playersSearching.length > 0){
            enemy = playersSearching.pop();
            enemy.currentOpponent = current.playerName;
            current.currentOpponent = enemy.playerName;
            let game = {
                ...pickWhiteAndBlackPlayer(enemy.playerName, current.playerName),
            }
            //change this later
            io.sockets.emit('start game', game);

        }
        else{
            playersSearching.push(current);
        }

    })

    
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

http.listen(port, () => {
    console.log(`Example app listening on port ${port} !`);
});

//Run app, then load http://localhost:port in a browser to see the output.