class WelcomeView{

    constructor(){
        this._parentElement = document.querySelector('.main-page-selection');
        this.setCreateRoomEvent();
    }

    addHandlerPlay(handler){
        const thisWelcomeView = this;
        const playButton = this._parentElement.querySelector('.play-game-btn');
        const userNameInput = this._parentElement.querySelector('.username-input');
        playButton.addEventListener('click', function(){
            let userNameValue = userNameInput.value;
            if(userNameValue === '') {
                thisWelcomeView.animationInputEmpty(userNameInput);
                return;
            };
            handler();
        });
    }

    addJoinLobbyHandler(handler){
        const joinLobbyBtn = this._parentElement.querySelector('.join-lobby-btn');
        joinLobbyBtn.addEventListener('click', handler);
    }

    addCreateRoomDoneHandler(handler){
        const thisWelcomeView = this;
        const createRoomDoneBtn = this._parentElement.querySelector('.create-room-done-btn');
        const roomNameInput = this._parentElement.querySelector('.room-name-input');
        createRoomDoneBtn.addEventListener('click', function(){
            let roomNameValue = roomNameInput.value;
            if(roomNameValue === '') {
                thisWelcomeView.animationInputEmpty(roomNameInput);
                return;
            };
            handler();
        });
    }

    getUserName(){
        return this._parentElement.querySelector('.username-input').value;
    }

    getRoomName(){
        return this._parentElement.querySelector('.room-name-input').value;
    }

    getRoomPassword(){
        return this._parentElement.querySelector('.room-password-input').value;
    }

    setCreateRoomEvent(){   
        const createRoomBtn = this._parentElement.querySelector('.create-room-btn');
        createRoomBtn.addEventListener('click', this.animationInputRoom.bind(this));
    }

    animationLoading(screenPos){
        const spinner = this._parentElement.querySelector('.play-game-spinner');
        const query = screenPos === 'first' ? '.main-page-selection-welcome': screenPos === 'second' ? '.main-page-selection-enter' :'.room-credentials';
        const screen = this._parentElement.querySelector(query);

        // Show spinner and lower the opacity for other elements
        spinner.classList.add('show-spinner');
        screen.classList.add('main-page-selection-loading');
    }

    animationShowOptions(){
        const selectionScreen = this._parentElement.querySelector('.selection-screens-container');
        selectionScreen.style.animation = 'next 0.4s ease-in-out 0s 1 normal forwards';
    }

    animationInputRoom(){
        const selectionScreen = this._parentElement.querySelector('.selection-screens-container');
        selectionScreen.style.animation = 'next2 0.4s ease-in-out 0s 1 normal forwards';
    }

    animationHideSpinner(){
        const spinner = document.querySelector('.play-game-spinner');
        spinner.classList.remove('show-spinner');
    }
    
    animationInputEmpty(input){
        input.classList.add('input-wrong');
        input.addEventListener('animationend', function(){
            input.classList.remove('input-wrong');
        }, {once: true})
    }

}

export default new WelcomeView();