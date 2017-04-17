import { Component } from '@angular/core';

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
                case 'clear':
                    // $('#messages').empty();
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
                case 'SendMessage':
                default:
                    $('#messages').append($('<li>').text(data));
                    break;
            }

        });

    }

    public selectCard(card, onlyMaster){
        let user = this.Players.find(p => p.Nickname == this.Username);
        if(onlyMaster == true && user.Type != 0)
            return;
            
        this.socket.emit('sendData', card.Guid);
    }

    public submit(){
        this.socket.emit('sendData', $('#m').val());
        $('#m').val('');
        return false;
    }

}