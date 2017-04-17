"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular/core");
let AppComponent = class AppComponent {
    constructor() {
        this.socket = io();
        this.socket.on('message', (route, data) => {
            switch (route) {
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
    submit() {
        this.socket.emit('sendData', $('#m').val());
        $('#m').val('');
        return false;
    }
};
AppComponent = __decorate([
    core_1.Component({
        selector: 'my-app',
        template: `
  
    <ul id="messages" >
      <!--<li *ngFor="let planet of planets">{{planet}}</li>-->
    </ul>

    <input id="m" /><button (click)="submit()">Send</button>

    `
    })
], AppComponent);
exports.AppComponent = AppComponent;
//# sourceMappingURL=app.component.js.map