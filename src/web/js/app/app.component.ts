import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  templateUrl: './html/app.component.html' 
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
                    // $('#messages').empty();
                    break;
                case 'payload':
                    console.log(data);
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