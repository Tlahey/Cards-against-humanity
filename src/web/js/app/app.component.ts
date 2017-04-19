import { Player } from './../../../game/player';
import { Component } from '@angular/core';

enum MessageType{
    MESSAGE,

    INFORMATION,
    IMPORTANT,
    ERROR,

    CLEAR 
}


@Component({
  selector: 'my-app',
  templateUrl: './html/app.component.html' 
})
export class AppComponent { 
    // http://builtwithangular2.com/

    public socket;

    public QuestionCard = {};
    public UsersAwnserCards = [];
    public Players = [];
    public Username : string;
    public CurrentUserAwnserCards = [];

    private _playerGuid : string;

    get Player() : any { 
        let pl = this.Players.find(p => p.Nickname == this.Username);
        // console.log("player : ", pl);
        return pl;
    }

    private _currentState : number;
    private _availableStates : any = {
        "0": "INITIALISATION",
        "1": "WAIT_PLAYERS",
        "2": "BEGIN_GAME",

        "3": "SET_PLAYERS_TYPES",
        "4": "GIVE_QUESTION",
        "5": "GIVE_CARD",

        "6": "WAIT_USERS_CARD",
        "7": "WAIT_MASTER_RESPONSE",
        "8": "MASTER_GIVE_REPONSE",

        "9": "GAME_END"
    };

    constructor(){
       
        this.socket = io();
        this.socket.on('message', (route, data) => {
            switch(route){
                // Permet de doner le pseudo de l'utilisateur
                case 'GetUserName':
                    this.Username = prompt(data.message);
                    this.socket.emit('adduser', this.Username);
                    break;

                case MessageType.CLEAR:
                    // NOTHING
                    break;
                case MessageType.ERROR:
                    $('#messages').append($('<li>').text(data).css("background-color", "red").css("color", "white"));
                    break;
                case MessageType.IMPORTANT:
                    $('#messages').append($('<li>').text(data).css("color", "red"));
                    break;
                case MessageType.INFORMATION:
                    $('#messages').append($('<li>').text(data).css("color", "blue"));
                    break;
                case MessageType.MESSAGE:
                    $('#messages').append($('<li>').text(data));
                    break;

                case 'PlayerGuid':
                    this._playerGuid = data.guid;
                    break;

                case 'payload':
                    this.Players = [];
                    this.QuestionCard = undefined;
                    this.UsersAwnserCards = [];
                    
                    // winner
                    this.CurrentUserAwnserCards = [];
                    
                    

                    this.UsersAwnserCards = data.UsersAwnserCards;              // cartes des utilisateurs quand ils ont tous choisi
                    this.QuestionCard = data.QuestionCard;                      // Carte question
                    this.Players = data.Players;                                // Joueur
                    this.CurrentUserAwnserCards = data.CurrentUserAwnserCards;  // Carte courant de l'utilisateur

                    this._currentState = data.State;

                    console.log(data);
                    console.log("this.UsersAwnserCards : ", this.UsersAwnserCards);
                    break;
                default:  
                    break;
            }
            var element = document.getElementById("messages");
            element.scrollTop = element.scrollHeight;
        });

    }

    get State() : number { return this._currentState; }

    public getCurrentState(){
        return this._availableStates[this._currentState];
    }

    public formatPlayerInformations(player){
        let information : string = "";

        // Si le joueur est le roi, on ajout KING
        if(player.Type == 0)
            information += "[KING] ";

        information += `${player.Nickname} - ${player.Score} `;

        // Si le state = WAIT_USERS_CARD
        if(this._currentState == 6 && player.Type == 1){
            if(!player.HaveSelectedCard)
                information += "[WAIT]";
            else 
                information += "[OK]";
        }
            
        return information;
    }

    public selectCard(card){
        let user = this.Players.find(p => p.Nickname == this.Username);

        // Si on est en attente du master et que le joueur est de type 1 alors on ne fait rien 
        if(this._currentState != 6 && user.Type == 1)
            return;
        
        // On peut émettre des messages que de 6 a 8
        if(this._currentState >= 6 && this._currentState <= 8)
            this.socket.emit('sendData', {
                'playerGuid': this._playerGuid,
                'data': card.Guid
            });
    }

    public submit(){
        this.socket.emit('sendData', {
            'playerGuid': this._playerGuid,
            'message': $('#m').val()
        });
        $('#m').val('');
        return false;
    }

}