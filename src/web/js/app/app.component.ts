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
    public UserAwnserCards = [];
    public Players = [];
    public Username : string;
    public UsersCardChoice = [];

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
                    $('#messages').append($('<li>').text(data).css("color", "orange"));
                    break;
                case MessageType.IMPORTANT:
                    $('#messages').append($('<li>').text(data).css("background-color", "red").css("color", "white"));
                    break;
                case MessageType.INFORMATION:
                    $('#messages').append($('<li>').text(data).css("color", "blue"));
                    break;
                case MessageType.MESSAGE:
                    $('#messages').append($('<li>').text(data));
                    break;


                case 'payload':
                    this.UserAwnserCards = undefined;
                    this.UsersCardChoice = undefined;
                    this.QuestionCard = undefined;
                    this.Players = undefined;

                    this.UserAwnserCards = data.CurrentUserAwnserCards; // cartes de l'utilisateur
                    this.QuestionCard = data.QuestionCard;  // Carte question
                    this.Players = data.Players;
                    this.UsersCardChoice = data.UsersAwnserCars;

                    console.log(data);
                    break;
                default:  
                    break;
            }
            var element = document.getElementById("messages");
            element.scrollTop = element.scrollHeight;
        });

    }

    public selectCard(card, onlyMaster){
        let user = this.Players.find(p => p.Nickname == this.Username);
        if(onlyMaster == true && user.Type != 0)
            return;
            
        this.socket.emit('sendData', {
            'data': card.Guid
        });
    }

    public submit(){
        this.socket.emit('sendData', {
            'message': $('#m').val()
        });
        $('#m').val('');
        return false;
    }

}