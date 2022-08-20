import Chat from "./Chat";

class LobbyView{

    constructor(){
        this._parentElement = document.querySelector('.lobby-content');
        this._lastPasswordInputRegistering = false;
        this._roomLoading = false;
        this._lastPasswordInput;
        this._lastRoomItem;
        this._lobbyChat = new Chat(this._parentElement.querySelector('.lobby-chat-div'));
    }

    getLastMessage(){
        return this._lobbyChat.getLastMessage();
    }

    setChatEvents(chatHandler){
        this._lobbyChat.initChat(chatHandler);
    }

    setLobbyRoomEvents(joinRoomHandler){
        const thisLobbyView = this;

        window.addEventListener('mousedown', function(e){

            const lockedRoomsActive = thisLobbyView._parentElement.querySelectorAll('.lobby-rooms-item-active');

            // Deactivate the active room icon when a click is registered outside the active room icon.
            if(lockedRoomsActive.length !== 0 && !e.target.closest('.lobby-rooms-item-active') && !thisLobbyView._roomLoading){
              console.log('1');
              thisLobbyView._lastPasswordInputRegistering = false;
                lockedRoomsActive.forEach(room => {
                    const roomContent = room.querySelector('.lobby-rooms-item-content');
                    const roomPasswordInput = room.querySelector('.lobby-rooms-item-password');
                    room.classList.toggle('lobby-rooms-item-active');
                    roomContent.classList.toggle('hide-room-content');
                    roomPasswordInput.classList.toggle('show-password-input');
                })
            }

            // Activate room icon if a click is registered and the room needs a password
            if(e.target.closest('.lobby-rooms-item-locked') && !thisLobbyView._roomLoading){
                const roomItem = e.target.closest('.lobby-rooms-item-locked');
                const roomContent = roomItem.querySelector('.lobby-rooms-item-content');
                const roomPasswordInputScreen = roomItem.querySelector('.lobby-rooms-item-password');

                thisLobbyView._lastPasswordInput = roomItem.querySelector('.room-password');
                thisLobbyView._lastRoomItem = roomItem;
                thisLobbyView._lastRoomContent = roomContent;
        
                roomItem.classList.add('lobby-rooms-item-active');
                roomContent.classList.add('hide-room-content');
                roomPasswordInputScreen.classList.add('show-password-input');

                if(!thisLobbyView._lastPasswordInputRegistering){
                    roomPasswordInputScreen.addEventListener('keydown', thisLobbyView._submitPasswordHandler(thisLobbyView, joinRoomHandler))
                };
            }

            // Enter the room directly if no passwrod is needed.
            if(e.target.closest('.lobby-rooms-item-unlocked') && !thisLobbyView._roomLoading){
                if(thisLobbyView._lastPasswordInputRegistering) return;
                thisLobbyView._lastPasswordInput = null;
                thisLobbyView._lastPasswordInputRegistering = true;
                thisLobbyView._lastRoomItem = e.target.closest('.lobby-rooms-item-unlocked');
                joinRoomHandler();
            }
        })
    }

    renderMessageReceived(id, userChatHistory){
        if(userChatHistory.length < 1) return;
        this._lobbyChat.renderMessageReceived(id, userChatHistory[userChatHistory.length - 1]);
    }

    getRoomName(){
        return this._lastRoomItem.querySelector('.lobby-rooms-item-text').innerText;
    }

    getRoomPassword(){
        if(this._lastPasswordInput){
            return this._lastPasswordInput.value
        }else{
            return '';
        }
    }

    clearInput(){
        if(this._lastPasswordInput) this._lastPasswordInput.value = '';
    }

    animationWrongPassword(){
        this._lastPasswordInput.classList.add('input-wrong');
        this._lastPasswordInput.addEventListener('animationend', function(){
            this.classList.remove('input-wrong');
        }, {once: true})
    }

    roomLoadingAnimation(){
        this._lastRoomItem.pointerEvents = 'none';
        this._lastRoomItem.style.opacity = 0.7;
        if(this._lastPasswordInput){
            this._lastPasswordInput.disabled = true;
            this._lastPasswordInput.blur();
        }
        this._roomLoading = true;
        //Add spinner **PENDING**
    }

    stopLoadingAnimation(){
        // **PENDING**
        this._lastRoomItem.pointerEvents = 'all';
        this._lastRoomItem.style.opacity = 1;
        if(this._lastPasswordInput){
            this._lastPasswordInput.disabled = false;
            this._lastPasswordInput.blur();
        }
        this._roomLoading = false;
    }

    _submitPasswordHandler(object, handler){
        object._lastPasswordInputRegistering = true;
        return function someFunc(e){
            if(e.key === 'Enter'){
                handler();
            }
        }
    }

    renderLobby(gameState, id){
        this._clearLobby();
        this._renderLobbyPlayers(gameState.lobbyRoom.players, id);
        this._renderRooms(gameState.privateRooms);
        this._renderText(gameState.privateRooms);
    }


    _renderLobbyPlayers(players, id){
        const playersContainer = this._parentElement.querySelector('.curent-players-item-container');
        let markup = players.map(player => {
            return `
            <div class="current-players-item ${player.id === id ? 'this-player': ''}">
                <div class="current-player-icon-container">
                    <span class="current-player-icon"></span>
                </div>
                <div class="current-player-item-text">
                    <div class="current-player-nickname">${player.userName}</div>
                    <div class="lobby-player-status lobby-player-active"></div>
                </div>
            </div>
            `
        }).join('');
        playersContainer.insertAdjacentHTML('afterbegin', markup);
    }

    _renderRooms(rooms){
        const roomsContainer = this._parentElement.querySelector('.lobby-rooms-item-container');
        let markup = rooms.map(room => {
            return `
            <div class="lobby-rooms-item ${room.roomPassword === '' ? 'lobby-rooms-item-unlocked': 'lobby-rooms-item-locked'}">
                <div class="lobby-rooms-item-content">
                    <div class="lobby-rooms-item-div">
                        <div class="room-number">#${room.roomNumber}</div>
                    </div>
                    <div class="lobby-rooms-item-center lobby-rooms-item-div">
                        <h2 class="lobby-rooms-item-text">${room.roomName}</h2>
                    </div>
                    <div class="lobby-rooms-item-footer lobby-rooms-item-div">
                        <div class="players-count">${room.players.length}/6<i class="fas fa-user"></i></div>
                        <div class="lock-icon-container">${room.roomPassword === '' ? '<i class="fas fa-unlock-alt"></i>' : '<i class="fas fa-lock"></i>'}</div>
                    </div>
                </div>
                <div class="lobby-rooms-item-password">
                    <h2>Enter password</h2>
                    <input type="password" class="room-password main-page-input">
                </div>
            </div>
            `
        }).join('');
        roomsContainer.insertAdjacentHTML('beforeend', markup);
    }

    _renderText(rooms){
        const roomsContainerTitle = this._parentElement.querySelector('.lobby-rooms-header-text');
        let playersCount = rooms.reduce((acc, room) => {
            return acc + room.players.length;
        }, 0);
        roomsContainerTitle.innerText = `There ${rooms.length !== 1 ? 'are': 'is'} ${rooms.length} rooms available and ${playersCount} players`;
    }

    _clearLobby(){
        this._parentElement.querySelector('.curent-players-item-container').innerHTML = '';
        this._parentElement.querySelector('.lobby-rooms-item-container').innerHTML = '';
    }

    _addAnimationRoomItem(){
    }

}

export default new LobbyView();