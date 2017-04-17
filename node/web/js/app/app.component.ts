/// <reference path="../../../typings/node/node.d.ts" />

import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  template: `<ul id="messages" >
      <li *ngFor="let planet of planets">{{planet}}</li>
    </ul>
    <input type="button" (click)="add()" />
    <form action="">
      <input id="m" autocomplete="off" /><button>Send</button>
    </form>`
})
export class AppComponent { 
    // http://builtwithangular2.com/
    
    public planets :string[];
    public socket;

    constructor(){

        this.planets = [
            'Mercure', 
            'Venus', 
            'Terre', 
            'Mars', 
            'Jupiter',
            'Saturne',
            'Uranus',
            'Neptune'
        ];
             
        $('form').submit(function(){
            this.socket.emit('sendData', $('#m').val());
            $('#m').val('');
            return false;
        });
        
        this.socket = io();
        this.socket.on('message', function(route, data){
            switch(route){
                // Permet de doner le pseudo de l'utilisateur
                case 'GetUserName':
                    this.socket.emit('adduser', prompt(data.message));
                    break;
                case 'clear':
                    this.planets = [];
                    // $('#messages').empty();
                    break;
                case 'SendMessage':
                default:
                    this.planets.push(data);
                    // $('#messages').append($('<li>').text(data));
                    break;
            }

        }.bind(this));

    }

    add(){
        this.planets.push('test');
    }



}