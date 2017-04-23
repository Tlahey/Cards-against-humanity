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

    public PlayloadDatas : any;

    public socket;
    public AvailablesSessions : Array<any> = [];
    public SelectedSession : any = {};
    public IsConnectedToSession : boolean = false;

    public QuestionCard = {};
    public UsersAwnserCards = [];
    public Players = [];
    public Player : any = {};
    public Username : string;
    public CurrentUserAwnserCards = [];

    private _playerGuid : string = undefined;

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

    private dispose(){
        this.AvailablesSessions = [];
        this.SelectedSession = {};
        this.IsConnectedToSession = false;

        this.QuestionCard = {};
        this.UsersAwnserCards = [];
        this.Players = [];
        this.Player = {};
        this.Username = undefined;
        this.CurrentUserAwnserCards = [];

        this._playerGuid = undefined;

        this._currentState = undefined;
    }

    constructor(){
       
        this.socket = io();
        this.socket.on('message', (route, data) => {
            switch(route){

                // Récupère les sessions valables
                case 'getSessions': 
                    // On clear tout 
                    this.dispose();
                    this.AvailablesSessions = data;
                    break;

                // Permet de doner le pseudo de l'utilisateur
                case 'GetUserName':
                    this.Username = prompt(data.message);
                    break;

                case MessageType.CLEAR:
                    // NOTHING
                    break;
                case 'connexionCallback':
                    if(data.success){
                        this.IsConnectedToSession = true;
                        return;
                    }
                    this.SelectedSession = {};
                    data = data.message;
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

                case 'payload':
                    this.Players = [];
                    this.QuestionCard = undefined;
                    this.UsersAwnserCards = [];
                    this.Player = undefined;

                    // winner
                    this.CurrentUserAwnserCards = [];
                    
                    

                    this.UsersAwnserCards = data.UsersAwnserCards;              // cartes des utilisateurs quand ils ont tous choisi
                    this.QuestionCard = data.QuestionCard;                      // Carte question
                    this.Players = data.Players;                                // Joueur
                    this.CurrentUserAwnserCards = data.CurrentUserAwnserCards;  // Carte courant de l'utilisateur

                    this._currentState = data.State;

                    this.Player = data.Player;

                    this.PlayloadDatas = data;

                    console.log(data);
                    console.log("this.UsersAwnserCards : ", this.UsersAwnserCards);
                    break;
                default:  
                    break;
            }
            var element = document.getElementById("messages");
            if(element)
                element.scrollTop = element.scrollHeight;
        });

    }

    public connectToSession(session: any){
        this.SelectedSession = session;
        this.socket.emit('choiceSession', this.Username, session.Guid);
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
                'playerGuid': this.Player.Guid,
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