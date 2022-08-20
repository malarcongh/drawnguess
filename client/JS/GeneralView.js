
class GeneralView{
    constructor(){
        this._parentElement = document.querySelector('body');
        this._welcomeScreen = this._parentElement.querySelector('.welcome-content');
        this._lobbyScreen = this._parentElement.querySelector('.lobby-content');
        this._gameScreen = this._parentElement.querySelector('.game-content');
    }

    showWelcomeScreen(){
        this._showScreen(this._welcomeScreen);
        this._hideScreen(this._lobbyScreen);
        this._hideScreen(this._gameScreen);
    }

    showLobbyScreen(){
        this._lobbyScreen.style.display = 'flex';
        this._hideScreen(this._gameScreen);
        this._hideScreen(this._welcomeScreen);
    }

    showGameScreen(){
        this._showScreen(this._gameScreen);
        this._hideScreen(this._lobbyScreen);
        this._hideScreen(this._welcomeScreen);
    }

    _showScreen(element){
        element.style.display = 'block';
    }

    _hideScreen(element){
        element.style.display = 'none';
    }

    transitionScreen(){
        const transitionDiv = this._parentElement.querySelector('.transition-div');
        transitionDiv.classList.add('animation-run');
        transitionDiv.addEventListener('animationend', function(){
            transitionDiv.classList.remove('animation-run');
        });
    }
}

export default new GeneralView();