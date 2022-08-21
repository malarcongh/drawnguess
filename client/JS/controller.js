import { io } from "socket.io-client";
import { scaleElement } from "./helpers.js";
import * as model from './model.js';
import LobbyView from "./LobbyView.js";
import WelcomeView from "./WelcomeView.js";
import RoomView from   './RoomView.js';
import GeneralView from "./GeneralView.js";
import Drawer from "./Drawer.js";

const welcomeContent = document.querySelector('.welcome-content');
const lobbyContent = document.querySelector('.lobby-content');
const gameContent = document.querySelector('.game-content');
const chatHistory = document.querySelector('.chat-history');
const chatInput = document.querySelector('.chat-input');

let socket;

const playHandler = function(){
    socket = io('https://drawnguessgame.herokuapp.com/');
    initSocket(socket);
    WelcomeView.animationLoading('first');
    model.userData.userName = WelcomeView.getUserName();
}

const createRoomDoneHandler = function(){
    WelcomeView.animationLoading('third');
    model.userData.roomName = WelcomeView.getRoomName();
    model.userData.roomPassword = WelcomeView.getRoomPassword();
    socket.emit('create-room', model.userData)
}

const joinLobbyHandler = function(){
    WelcomeView.animationLoading('second');
    model.userData.roomName = 'lobby';
    socket.emit('join-lobby', model.userData);
}

const joinRoomHandler = function(){
    LobbyView.roomLoadingAnimation();
    let roomName = LobbyView.getRoomName();
    model.userData.roomPassword = LobbyView.getRoomPassword();
    socket.emit('join-room', model.userData, roomName);
}

const chatHandlerLobby = function(){
    const message = LobbyView.getLastMessage();
    socket.emit('send-chat-message', message, model.userData.userName, model.userData.roomName);
}

const chatHandlerRoom = function(){
    const message = RoomView.getLastMessage();
    socket.emit('send-chat-message', message, model.userData.userName, model.userData.roomName);
}

const drawerHandler = function(){
    return {
        sendDrawingInfo: function(info){
            socket.emit('send-points', info, model.userData.roomName);
        },
        saveCanvas: function(){
            socket.emit('save-canvas', model.userData.roomName);
        }
    }
}

const optionSelectedHandler = function(info){
    socket.emit('option-selected', info, model.userData.roomName);
}

const timeoutHandler = function(){

}


const initSocket = function(socket){

    socket.on('connect', function(){
        setTimeout(function(){
            WelcomeView.animationHideSpinner();
            WelcomeView.animationShowOptions();
        }, 500);
    });

    socket.on('disconnect', function(){
        window.location.reload();
    });

    socket.on('reconnect', function(){
        window.location.reload();
    });

    socket.on('room-created', function(gameState, room){
        //Re render lobby if the user is there
        if(model.userData.roomName === 'lobby'){
            LobbyView.renderLobby(gameState, socket.id)

        }else if(model.userData.roomName === room.roomName){
            //Play animation and show room
            WelcomeView.animationHideSpinner();
            GeneralView.transitionScreen();
            RoomView.renderRoom(room, socket.id);

            setTimeout(function(){
              GeneralView.showGameScreen();
              RoomView.initDrawer(drawerHandler());
              scaleElement(gameContent);
            }, 500);
        }  
    });

    socket.on('entered-lobby', function(gameState, newPlayerId){
        //Render lobby data if player is in lobby
        if(model.userData.roomName === 'lobby'){
            LobbyView.renderLobby(gameState, socket.id);

            //Play animation only if the new player is this player
            if(newPlayerId === socket.id){
                WelcomeView.animationHideSpinner();
                GeneralView.transitionScreen();
                setTimeout(function(){
                  GeneralView.showLobbyScreen();
                  scaleElement(lobbyContent);
                }, 500);
            }
        }
    });

    socket.on('entered-room', function(gameState, newPlayerId, newPlayerRoom){
        //render room
        if(newPlayerId === socket.id){
            model.userData.roomName = newPlayerRoom.roomName;
            LobbyView.stopLoadingAnimation();
            GeneralView.transitionScreen();

            // render room for this player
            RoomView.renderRoom(newPlayerRoom, socket.id);

            setTimeout(function(){
              GeneralView.showGameScreen();
              RoomView.initDrawer(drawerHandler());
              scaleElement(gameContent);
            }, 500);
            return;
        }

        if(model.userData.roomName === 'lobby'){
            //rerender lobby
            LobbyView.renderLobby(gameState, socket.id);

        }else if(model.userData.roomName === newPlayerRoom.roomName){
            //rerender room
            RoomView.clearRoom();
            RoomView.renderRoom(newPlayerRoom, socket.id);
        }
        
    });

    socket.on('entering-room-failed', function(){
        LobbyView.stopLoadingAnimation();
        LobbyView.animationWrongPassword();
        LobbyView.clearInput();
    });

    socket.on('player-disconnected', function(gameState, room){

        //re render lobby (room overview counter or lobby player list) so basically always re render lobby
        if(model.userData.roomName === 'lobby'){
            LobbyView.renderLobby(gameState, socket.id)
        }

        //re render private room if the player was in a room for the users in the same room (and this is a ??)
        if(model.userData.roomName === room.roomName) {
          RoomView.renderRoom(room, socket.id);
        };
    });

    socket.on('chat-message-received', function(roomName, players){
        const thisPlayer = players.find(player => player.id === socket.id);
        
        if(roomName !== 'lobby' && roomName){
            // re render chat in private room
            RoomView.renderMessageReceived(socket.id, thisPlayer.chatHistory);
        }else if(roomName === 'lobby'){
            // re render chat in lobby
            LobbyView.renderMessageReceived(socket.id, thisPlayer.chatHistory);
        }
    });

    socket.on('game-about-to-start', function(){
        RoomView.gameAboutToStart();
    });

    socket.on('about-to-draw-inactive', function(){
        RoomView.gameAboutToStartSec();
    });

    socket.on('about-to-draw-active', function(){
        RoomView.gameAboutToStartSec(`You start drawing in\xa0`);
    });

    socket.on('send-options', function(options){
        RoomView.renderOptions(options, optionSelectedHandler);
        RoomView.showToolbar();
    });

    socket.on('choosing-word-inactive', function(activePlayer){
        RoomView.choosingWordInactive(activePlayer);
    });

    socket.on('init-timer', function(time){
        RoomView.initTimer(time, timeoutHandler);
    })

    socket.on('word-chosen-inactive', function(info){
        RoomView.showCharactersContainer();
        RoomView.renderCharacters(info.word.length, null);
    });

    socket.on('show-word-inactive', function(word){
        RoomView.renderCharacters(word.length, word);
    })

    socket.on('all-users-correct', function(){
        RoomView.allCorrect = true;
    });

    socket.on('update-points', function(players){
        RoomView.renderPlayers(players, socket.id);
    });

    socket.on('reset-room', function(){
        RoomView.resetRoom();
    });


    //Drawer part

    socket.on('draw-points', function(info){
        RoomView.renderPoints(info);
    });

    socket.on('save-canvas', function(){
        RoomView.saveCanvas();
    });

    socket.on('restore-strokes', function(strokes){
        strokes.forEach(stroke => {
            drawPoints(stroke);
            finishDrawing();
        })
    });

}


const init = function(){
    WelcomeView.addHandlerPlay(playHandler);
    WelcomeView.addCreateRoomDoneHandler(createRoomDoneHandler);
    WelcomeView.addJoinLobbyHandler(joinLobbyHandler);
    LobbyView.setLobbyRoomEvents(joinRoomHandler);
    LobbyView.setChatEvents(chatHandlerLobby);
    RoomView.setChatEvents(chatHandlerRoom);
    
    window.addEventListener('load', function(){
      scaleElement(welcomeContent);
    })
    
    window.addEventListener('resize', function(){
      scaleElement(welcomeContent);
      scaleElement(gameContent);
      scaleElement(lobbyContent);
    })
}

init();