import {formatMessage} from './helpers.js';

export default class Chat{

    constructor(parentElement){
        this._parentElement = parentElement;
        this._chat = this._parentElement.querySelector('.chat');
        this._chatHistory = this._parentElement.querySelector('.chat-history');
        this._chatInput = this._parentElement.querySelector('.chat-input');
        this._lastMessage = '';
    }

    clearChat(){
        this._chatHistory.innerHTML = '';
    }

    initChat(chatHandler){
        const thisObj = this;
        this._chatInput.addEventListener('keydown', function(e){
            if(e.key !== 'Enter' || this.value === '') return;
            const message = this.value;
            thisObj._lastMessage = message;
            chatHandler();
            thisObj.clearChatInput();
        })
    }

    sendMessage(message){
        const markup = `
            <div class="chat-message">
                You: ${formatMessage(message)}
            </div>
        `;
        this.clearChatInput();
        this._chatHistory.insertAdjacentHTML('beforeend', markup);
    }

    renderMessageReceived(thisId, lastMessageChat){
        const markup = `
            <div class="chat-message">
                ${getUser()}${formatMessage(lastMessageChat.message)}
            </div>
        `;
        this._chatHistory.insertAdjacentHTML('beforeend', markup);
        this.scrollToBottom();

        function getUser(){
            if(lastMessageChat.rightGuess) return '';
            return thisId === lastMessageChat.id ? 'You: ': `${lastMessageChat.userName}: `;
        }
    }

    getLastMessage(){
        return this._lastMessage;
    }
    
    clearChatInput(){
        this._chatInput.value = '';
    }
    
    scrollToBottom(){
        this._chatHistory.scrollTop = this._chatHistory.scrollHeight;
    }

}