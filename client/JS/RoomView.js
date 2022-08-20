import Chat from "./Chat.js";
import Drawer from './Drawer.js';

class Room{
    constructor(){
        this._parentElement = document.querySelector('.game-content');
        this._canvas = this._parentElement.querySelector('.canvas');
        this._toolbar = this._parentElement.querySelector('.toolbar');
        this._timeElement = this._parentElement.querySelector('.timer-time');
        this._pointsContainer = this._parentElement.querySelector('.points-container');

        this._timerCanvas = this._parentElement.querySelector('.timer-canvas');
        this._ctxTimer = this._timerCanvas.getContext('2d');

        this._drawer;
        this._roomChat = new Chat(this._parentElement.querySelector('.room-chat-div'));
        this._timer;
        this._pointsTimer;
        this._secondsTimer;
        this._animationID;
        this._startStamp;
        this.allCorrect = false;
    }

    resetRoom(){
        this._parentElement.querySelector('.about-to-start-header').style.display = 'block';
        this._parentElement.querySelector('.about-to-start-text').firstChild.data = 'Waiting for next player!';
        this._parentElement.querySelector('.words-options-container').style.display = 'none';
        this._parentElement.querySelector('.word-to-draw').style.opacity = '0';
        this._parentElement.querySelector('.word-to-draw').style.width = '0';
        this._parentElement.querySelector('.word-to-draw').style.maxHeight = '0';
        this.allCorrect = false;

        this._drawer.clearCanvas();
        this._canvas.classList.add('canvas-deactivated');
        this._toolbar.innerHTML = '';

        this._pointsContainer.textContent = '';

        clearInterval(this._timer);
        clearInterval(this._pointsTimer);
        clearInterval(this._secondsTimer);

        this._resetTimerFigure();

        console.log('room reseted');

    }

    gameAboutToStart(){

        let curTime = 0;
        const thisObj = this;

        if(thisObj._pointsTimer) clearInterval(thisObj._pointsTimer);
        
        const tick = function(){
            let numOfTimes = (curTime % 3) + 1;
            let newString = '.'.repeat(numOfTimes);
            thisObj._pointsContainer.textContent = newString;
            curTime++;
        };

        tick();

        // Call timer every second
        thisObj._pointsTimer = setInterval(tick, 1000);
    }

    gameAboutToStartSec(text){

        let curTime = 5;
        this._parentElement.querySelector('.about-to-start-text').firstChild.data = text ? text: `Game about to start in\xa0`;
        const thisObj = this;

        clearInterval(thisObj._pointsTimer);    

        const tick = function(){
            thisObj._pointsContainer.textContent = `${curTime}`;
            if(curTime === 0){
                clearInterval(thisObj._secondsTimer);
            } 
            curTime--;
        };

        tick();

        // Call timer every second
        thisObj._secondsTimer = setInterval(tick, 1000);
    }

    choosingWordInactive(activePlayer){
        const text = `${activePlayer} is choosing a word`;
        this._parentElement.querySelector('.about-to-start-text').firstChild.data = text;
        this._pointsContainer.textContent = '';
    }

    renderOptions(options, clickHandler){
        
        const thisObj = this;

        function optionClickEvent(){
            const obj = {
                word: this.dataset.optionWord,
                points: +this.dataset.optionPoints
            }
            thisObj.showCharactersContainer();
            thisObj.renderCharacters(obj.word.length, obj.word);
            optionElements.forEach(el => el.removeEventListener('click', optionClickEvent));
            clickHandler(obj);

            //Activate the canvas
            thisObj._canvas.classList.remove('canvas-deactivated');
        }

        const optionElements = this._parentElement.querySelectorAll('.words-options-item');
        optionElements.forEach((optionEl, i) => {
            const markup = `
                <h3 class="words-options-item-text">${options[i].word}<span class="span-extra-points words-options-item-${i+1}-points">+${options[i].points}</span></h3>
                <i class="words-options-item-iconready"></i>
            `;
            optionEl.innerHTML = markup;
            optionEl.dataset.optionWord = options[i].word;
            optionEl.dataset.optionPoints = options[i].points;

            optionEl.addEventListener('click', optionClickEvent);
        });
        this._parentElement.querySelector('.about-to-start-header').style.display = 'none';
        this._parentElement.querySelector('.words-options-container').style.display = 'flex';
    }

    showCharactersContainer(){
        this._parentElement.querySelector('.about-to-start-header').style.display = 'none';
        this._parentElement.querySelector('.words-options-container').style.display = 'none';
        this._parentElement.querySelector('.word-to-draw').style.opacity = '1';
        this._parentElement.querySelector('.word-to-draw').style.width = '100%';
        this._parentElement.querySelector('.word-to-draw').style.maxHeight = '100%';
    }

    renderCharacters(len, word){

        const container = this._parentElement.querySelector('.word-to-draw');
        container.innerHTML = '';
        for(let i = 0; i < len; i++){
            let markup = `
            <div class="letter-container">
                <h1 class="letter-div">${word ? word[i].toUpperCase(): ''}</h1>
                <div class="line-div"></div>
            </div>
            `;
            container.insertAdjacentHTML('beforeend', markup);
        }
    }

    setChatEvents(chatHandler){
        this._roomChat.initChat(chatHandler);
    }

    getLastMessage(){
        return this._roomChat.getLastMessage();
    }

    renderMessageReceived(id, userChatHistory){
        if(userChatHistory.length < 1) return;
        this._roomChat.renderMessageReceived(id, userChatHistory[userChatHistory.length - 1]);
        this._roomChat.scrollToBottom();
    }

    renderRoom(room, id){
        this.renderPlayers(room.players, id);
        this._renderCanvas(room, id);
        this._renderToolbar(room, id);
        setTimeout(this._initTimerCanvas.bind(this), 610);
    }

    clearRoom(){
        this._parentElement.querySelector('.current-players-item-container').innerHTML = '';
    }

    _renderCanvas(room, id){
        const activePlayer = room.players.find(player => player.active);
        if(!activePlayer || activePlayer.id !== id) this._canvas.classList.add('canvas-deactivated');
    }

    _renderToolbar(room, id){
        const activePlayer = room.players.find(player => player.active);
        if(!activePlayer) return;
        if(activePlayer.id === id) this.showToolbar();
    }

    showToolbar(){
        if(this._toolbar.innerHTML !== '') return;
        const markup = `
            <div class="toolbar-pen toolbar-tool toolbar-tool-active"><i class="fas fa-pencil-alt"></i></div><div class="toolbar-eraser toolbar-tool"><i class="fas fa-eraser"></i></div>
            <div class="toolbar-bucket toolbar-tool"><i class="fas fa-fill-drip"></i></div><div class="toolbar-line toolbar-tool"><i class="line-tool"></i></div>
            <div class="toolbar-circle toolbar-tool"><i class="far fa-circle"></i></div><div class="toolbar-square toolbar-tool"><i class="far fa-square"></i></div>
            <div class="toolbar-color toolbar-tool"><i class="fas fa-palette"></i></div>
        `;
        this._toolbar.insertAdjacentHTML('afterbegin', markup);
    }

    renderPlayers(players, id){
        const playersContainer = this._parentElement.querySelector('.current-players-item-container');
        playersContainer.innerHTML = '';
        const playersSorted = this._sortPlayers(players);
        const markup = playersSorted.map(player => {
            return `
            <div class="current-players-item ${player.id === id ? 'current-player-user': ''}">
                <div class="current-player-icon-container">
                    <span class="current-player-icon"></span>
                </div>
                <div class="current-player-item-text">
                    <div class="current-player-nickname">${player.userName}</div>
                    <div class="current-player-points">${player.points}pts</div>
                </div>
            </div>
            `;
        }).join('');
        playersContainer.insertAdjacentHTML('afterbegin', markup);
    }

    _sortPlayers(players){
        return players.slice(0).sort(function(playerA, playerB){
            return playerB.points - playerA.points;
        });
    }

    _initTimerCanvas(){
        const parentElement = this._parentElement.querySelector('.timer');
        let parentWidth = parentElement.offsetWidth;
        let parentHeight = parentElement.offsetHeight;
        this._timerCanvas.width = parentWidth;
        this._timerCanvas.height = parentHeight;
        this._initTimerFigure(parentWidth, parentHeight);
    }

    initTimer(){
        const parentElement = this._parentElement.querySelector('.timer');
        let parentWidth = parentElement.offsetWidth;
        let parentHeight = parentElement.offsetHeight;

        this._startStamp = new Date().getTime();
        this._animationID = window.requestAnimationFrame(this._drawClock.bind(this, parentWidth, parentHeight));
    }

    _drawClock(parentWidth, parentHeight){

      let curStamp = new Date().getTime();
      let timePassed = (curStamp - this._startStamp) / 1000;
      let radians  = degToRad(timePassed * 6);
      let radius = Math.min(parentWidth / 2, parentHeight / 2);

      console.log(parentWidth, parentHeight);

      if(timePassed >= 60 || this.allCorrect){
        console.log('animation frame cleared');
        console.log('trying to reset fig');
        this._resetTimerFigure();
        console.log('pls god plsss');
        return;
      }

      this._ctxTimer.clearRect(0, 0, this._timerCanvas.width, this._timerCanvas.height);
      this._ctxTimer.beginPath();
      this._ctxTimer.arc(parentWidth / 2, parentHeight / 2, radius - 10, 0, Math.PI*2, true);
      this._ctxTimer.stroke();
      
      this._ctxTimer.beginPath();
      this._ctxTimer.arc(parentWidth / 2, parentHeight / 2, radius - 15, 0, radians, true);
      this._ctxTimer.lineTo(parentWidth / 2, parentHeight / 2);
      this._ctxTimer.closePath();
      this._ctxTimer.fill();
      this._animationID = window.requestAnimationFrame(this._drawClock.bind(this, parentWidth, parentHeight));

      function degToRad(deg){
          return deg * Math.PI / 180;
      }
    }

    _initTimerFigure(parentWidth, parentHeight){
        this._ctxTimer.fillStyle = 'rgb(210, 210, 210)';
        this._ctxTimer.strokeStyle = 'rgb(210, 210, 210)';
        
        let radius = Math.min(parentWidth / 2, parentHeight / 2);
        this._ctxTimer.lineWidth = 3;
        this._ctxTimer.beginPath();
        this._ctxTimer.arc(parentWidth / 2, parentHeight / 2, radius - 10, 0, Math.PI*2, true);
        this._ctxTimer.stroke();

        this._ctxTimer.beginPath();
        this._ctxTimer.translate(parentWidth / 2, parentHeight / 2);
        this._ctxTimer.rotate(Math.PI * 3/2);
        this._ctxTimer.translate(-parentWidth / 2, -parentHeight / 2);

        this._ctxTimer.arc(parentWidth / 2, parentHeight / 2, radius - 15, 0, Math.PI * 2, true);
        this._ctxTimer.fill();
    }

    _resetTimerFigure(){

      console.log('Reseted timer');

      window.cancelAnimationFrame(this._animationID);

      const parentElement = this._parentElement.querySelector('.timer');
      let parentWidth = parentElement.offsetWidth;
      let parentHeight = parentElement.offsetHeight;

      this._ctxTimer.clearRect(0, 0, this._timerCanvas.width, this._timerCanvas.height);
      this._ctxTimer.resetTransform();
      this._initTimerFigure(parentWidth, parentHeight);
    }



    initDrawer(handler){
        this._drawer = new Drawer(this._canvas,this._canvas.parentElement.offsetWidth, this._canvas.parentElement.offsetHeight);
        this._drawer.getEmitters(handler);
        const thisObj = this;


        this._canvas.addEventListener('mousedown', this._drawer.startDrawing.bind(thisObj._drawer));
        
        this._canvas.addEventListener('mousemove', function(e){
            thisObj._drawer.draw(e);
        });

        this._canvas.addEventListener('mouseup', function(){
            thisObj._drawer.finishDrawing();
        });

        this._toolbar.addEventListener('click', this._switchTool.bind(thisObj));
    }

    renderPoints(info){
        if(!this._drawer) return;
        this._drawer.renderPoints(info);
    }

    saveCanvas(){
        if(!this._drawer) return;
        this._drawer.saveInMemoryCanvasState();
    }

    _switchTool(e){
        if(!e.target.closest('.toolbar-tool')) return;
        // Deactivate all tools
        this._toolbar.querySelectorAll('.toolbar-tool').forEach(el => el.classList.remove('toolbar-tool-active'));
        const tool = e.target.closest('.toolbar-tool');
        tool.classList.add('toolbar-tool-active');
        const [toolString] = tool.classList;
        this._drawer.getActiveTool(toolString);
    }

}

export default new Room();