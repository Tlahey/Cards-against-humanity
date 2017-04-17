import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  template: `
  
    <ul id="messages" >
      <!--<li *ngFor="let planet of planets">{{planet}}</li>-->
    </ul>

    <input id="m" /><button (click)="submit()">Send</button>

    `
})

export class AppComponent { 
    // http://builtwithangular2.com/

    public socket;

    constructor(){
       
        this.socket = io();
        this.socket.on('message', (route, data) => {
            switch(route){
                // Permet de doner le pseudo de l'utilisateur
                case 'GetUserName':
                    this.socket.emit('adduser', prompt(data.message));
                    break;
                case 'clear':
                    $('#messages').empty();
                    break;
                case 'SendMessage':
                default:
                    $('#messages').append($('<li>').text(data));
                    break;
            }

        });

    }

    public submit(){
        this.socket.emit('sendData', $('#m').val());
        $('#m').val('');
        return false;
    }

}