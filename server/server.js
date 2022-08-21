const { users } = require('./gameState');
const gameState = require('./gameState');
const fetch = require('node-fetch');
  
const io = require('socket.io')({
  cors: {
    origin: 'https://drawnguessgame.netlify.app'
  }
});

let state = {
    activePlayer: '',
    strokesHistory: [],
}

const countdowns = [];

io.on('connection', socket => {

    console.log(`connected socket: ${socket.id}`);

    socket.on('create-room', function(userData){
        const length = gameState.privateRooms.push({
            roomNumber: `${gameState.privateRooms.length}`.padStart(3, '0'),
            roomName: userData.roomName,
            roomPassword: userData.roomPassword,
            gameStarted: false,
            drawingStarted: false,
            activeOption: null,
            countdown: null,
            drawerPlayerIndex: 0,
            revealedCharacters: [], //[{char: 'A', index: 0}]
            players: [{
                id: socket.id,
                userName: userData.userName,
                roomOwner: true,
                drawer: false,
                active: false,
                points: 0,
                chatHistory: [],
                guessedCorrectly: false
            }]
        })

        countdowns.push({
          room: gameState.privateRooms[length - 1],
          countdown: null
        })

        joinRoom(userData, socket);
        io.emit('room-created', gameState, gameState.privateRooms[length - 1]);
    })

    socket.on('join-lobby', function(userData){
        gameState.lobbyRoom.players.push({
            id: socket.id,
            userName: userData.userName,
            roomOwner: false,
            drawer: false,
            active: false,
            points: 0,
            chatHistory: [],
            guessedCorrectly: false
        })
        joinRoom(userData, socket);

        io.emit('entered-lobby', gameState, socket.id);
    })

    socket.on('join-room', async function(userData, roomName){
        //delete user from the lobby room
        const room = gameState.privateRooms.find(privateRoom => privateRoom.roomName === roomName);
        if(!room) return;
        if(room.roomPassword === userData.roomPassword && room.players.length <= 6){
            //delete user from the lobby room
            const index = gameState.lobbyRoom.players.findIndex(player => player.id === socket.id);
            const [user] = gameState.lobbyRoom.players.splice(index, 1);

            //push user to the private room and change its current room
            room.players.push(user);
            const currUser = gameState.users.find(user => user.id === socket.id);
            currUser.roomName = roomName;

            //join the socket.io room 
            socket.join(roomName);

            io.emit('entered-room', gameState, socket.id, room); //everyone has to rerender the room and lobby

            if(room.players.length === 2 && !room.gameStarted){

                setTimeout(function(){
                    // 1) Send "game about to start" to all users in the room.
                    io.to(room.roomName).emit('game-about-to-start', room);
                    startGame(room)
                }, 2000);
            }

            if(room.gameStarted){

            }

        }else{
            socket.emit('entering-room-failed', {});
        }
    });

    socket.on('disconnect', function(){

        const user = getPlayerInfo(socket.id); // This deletes the user already
        if(!user) return;
        deleteUser(user.id, user.roomName);
        const room = findRoom(user.roomName);
        io.emit('player-disconnected', gameState, room);
    })

    socket.on('send-chat-message', function(message, userName, roomName){

        const room = findRoom(roomName);
        let messageToClient;
        let rightGuess;
        let player = findPlayer(socket.id, room);


        if(room.gameStarted && room.drawingStarted && room.activeOption.word === message && !player.guessedCorrectly){
            messageToClient = `${userName} has guessed correctly!`;
            rightGuess = true;
            player.guessedCorrectly = true;
            player.points += room.activeOption.points;

            // Show correct word
            socket.emit('show-word-inactive', room.activeOption.word);
            // Update points
            io.to(roomName).emit('update-points', room.players)

            //All players guessed correctly reset and start with a new player.
            const activePlayers = room.players.filter(player => player.active);

            if(activePlayers.every(player => player.guessedCorrectly)){
                // Reset game for the room
              io.to(roomName).emit('all-users-correct');

              setTimeout(function(){
                  if(!room.gameStarted) return;
                  resetRoom(room);

                  setTimeout(function(){
                    if(!room.gameStarted) return;
                    startGame(room);
                }, 4000)
              }, 2000)

            }
        }else{
            messageToClient = message;
            rightGuess = false;
        }

        room.players.forEach(player => player.chatHistory.push({
            message: messageToClient,
            userName: userName,
            id: socket.id,
            rightGuess: rightGuess
        }));

        io.to(roomName).emit('chat-message-received', roomName, room.players);
    });

    socket.on('option-selected', function(info, roomName){
        const room = findRoom(roomName);
        let revealInterval;
        room.drawingStarted = true;
        room.activeOption = {
            word: info.word,
            points: info.points
        }

        // Pending check if game is going
        getCountdown(room).countdown = setTimeout(function(){

          setTimeout(function(){
            io.to(`${roomName}-inactivePlayers`).emit('show-word-inactive', room.activeOption.word);
          }, 500);

          setTimeout(function(){
              resetRoom(room);
              clearInterval(revealInterval)
              setTimeout(function(){
                  startGame(room);
              }, 2000);
          }, 2000)

        },60000);

        // Reveal a new character each 9.5seconds
        revealInterval = setInterval(function(){

        }, 9500);

        io.to(socket.id).to(`${roomName}-inactivePlayers`).emit('init-timer', 20)
        socket.emit('word-chosen-active');
        io.to(`${roomName}-inactivePlayers`).emit('word-chosen-inactive', info);
        
    });


    //Drawing part
    socket.on('send-points', function(info, roomName){
        socket.broadcast.to(roomName).emit('draw-points', info);
    })

    socket.on('save-canvas', function(roomName){
        socket.broadcast.to(roomName).emit('save-canvas', null);
    })
})


// Game functions

const startGame = async function(room){
    // 1) Send "game about to start" to all users in the room.
    //io.to(room.roomName).emit('game-about-to-start', room);

    // 2) Reset drawer
    resetDrawer(room);
    
    // 3) Get new active player and non-active players.
    let currentDrawer = getCurrentDrawer(room);
    createNonActiveRoom(room);

    // 3.1) Start game in the room
    room.gameStarted = true;

    // 3.2) Activate all players
    room.players.forEach(player => player.active = true);

    // 4) Look for words.
    let options = await getWordsOptions();

    // 5) Send message "active player about to draw" to inactive players.
    io.to(`${room.roomName}-inactivePlayers`).emit('about-to-draw-inactive', currentDrawer.userName);

    // 6) Send message "you're about to draw" to active player.
    io.to(currentDrawer.id).emit('about-to-draw-active');


    setTimeout(function(){
        // 7) Send options to active player.
        io.to(currentDrawer.id).emit('send-options', options);

        // 8) Send message "active player is now choosing word" to inactive players.
        io.to(`${room.roomName}-inactivePlayers`).emit('choosing-word-inactive', currentDrawer.userName);
    },6000);
}

const resetRoom = function(room, mantainDrawerIndex){
    clearTimeout(getCountdown(room).countdown);

    room.drawingStarted = false; 
    room.activeOption = null;

    room.players.forEach(player => {
      player.guessedCorrectly = false;
      player.active = false;
    });

    if(mantainDrawerIndex){
      room.drawerPlayerIndex = room.drawerPlayerIndex % room.players.length;
    }else{
      room.drawerPlayerIndex = room.gameStarted ?  (room.drawerPlayerIndex + 1) % room.players.length : 0;
    }

    resetDrawer(room);
    kickFromInactiveRoom(room);

    io.to(room.roomName).emit('reset-room');
}




// Auxiliar Functions

const joinRoom = function(userData, socket){
    users.push({
        id: socket.id,
        userName: userData.userName,
        roomName: userData.roomName
    })
    socket.join(userData.roomName);
}

const getPlayerInfo = function(id){
    const userIndex = gameState.users.findIndex(user => user.id === id);

    if(userIndex === -1) return;

    const [user] = gameState.users.splice(userIndex, 1);
    return user;
}

const deleteUser = function(id, room){
    if(room === 'lobby'){
        let index = gameState.lobbyRoom.players.findIndex(player => player.id === id);
        if(index === -1) return;
        gameState.lobbyRoom.players.splice(index, 1);
    }else{
        let roomIndex = gameState.privateRooms.findIndex(roomItem => roomItem.roomName === room);
        if(roomIndex === -1) return;

        if(gameState.privateRooms[roomIndex].players.length === 1){ // If the player that left is the only player in the room, delete the room
            gameState.privateRooms.splice(roomIndex, 1);
        }else{

            const indexPlayer = gameState.privateRooms[roomIndex].players.findIndex(player => player.id === id);
            const player = gameState.privateRooms[roomIndex].players[indexPlayer];
            const roomObj = findRoom(room);
            gameState.privateRooms[roomIndex].players.splice(indexPlayer, 1);

            console.log(player);

            if(gameState.privateRooms[roomIndex].players.length === 1){ // If after the player left, there is only one player, go back to waiting for other players ;)
              roomObj.gameStarted = false; // finish game
              resetRoom(roomObj);

              console.log('active player index: '+roomObj.drawerPlayerIndex);
              console.log('numbers of players: '+roomObj.players.length);

            }else if(gameState.privateRooms[roomIndex].players.length > 1 && player.drawer){ // If the game have enough players to keep going but the drawer leaves the room
              resetRoom(roomObj, true);
              startGame(roomObj);
            }
        }
    }
}

const findPlayer = function(id, room){
    return room.players.find(player => player.id === id);
}

const findRoom = function(roomName){
    let room;
    if(roomName === 'lobby'){
        room = gameState.lobbyRoom;
    }else if(roomName !== ''){
        room = gameState.privateRooms.find(room => room.roomName === roomName);
    }
    return room;
}

const getWordsOptions = async function(){
    let words = await Promise.all([fetcher('adjective'), fetcher('noun'), fetcher('animal')]);
    let options = words.map(function(el){
        return {
            word: el[0],
            points: 50 + Math.floor(Math.random() * 5) * 10
        }
    })
    return options;
}

const fetcher = async function(path){
    let resJSON = await fetch(`https://random-word-form.herokuapp.com/random/${path}`);
    return await resJSON.json();
}


const getRandomPlayerId = function(room){
    let numbers = room.players.length - 1;
    let randNum = Math.floor(Math.random() * numbers);
    return room.players[randNum].id
}

const getCurrentDrawer = function(room){
    let player = room.players[room.drawerPlayerIndex];
    player.drawer = true;
    player.guessedCorrectly = true;
    return player;
}

const createNonActiveRoom = function(room){
    let nonActivePlayers = room.players.filter((_, i) => i !== room.drawerPlayerIndex);
    nonActivePlayers.forEach(player => {
        const curSocket = io.sockets.sockets.get(player.id);
        curSocket.join(`${room.roomName}-inactivePlayers`);
    });
}

const resetDrawer = function(room){
    room.players.forEach(player => player.drawer = false);
}

const kickFromInactiveRoom = function(room){
  // Inactive room: Room where all players that are not currently drawing are. Used to send specific signals.
    room.players.forEach(player => {
        const thisSocket = io.sockets.sockets.get(player.id);
        thisSocket.leave(`${room.roomName}-inactivePlayers`);
    })
}

const getCountdown = function(room){
  return countdowns.find(countdown => countdown.room === room);
}



io.listen(process.env.PORT || 3000);