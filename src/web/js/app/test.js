/// <reference path="../../../typings/node/node.d.ts" />
var planetsModule = angular.module('planetsModule', []);
class ControllerService {
    constructor() {
        // this._socket = io();
        var socket = io();
        $('form').submit(function () {
            socket.emit('sendData', $('#m').val());
            $('#m').val('');
            return false;
        });
        // Lorsque l'utilisateur reçoit un message
        socket.on('message', function (route, data) {
            switch (route) {
                // Permet de doner le pseudo de l'utilisateur
                case 'GetUserName':
                    socket.emit('adduser', prompt(data.message));
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
    test() {
        console.log("test");
    }
}
class PlanetsController {
    constructor(ControllerService) {
        this.ControllerService = ControllerService;
        this.planets = [];
        this.planets = [
            { name: 'Mercure', isRocky: true },
            { name: 'Venus', isRocky: true },
            { name: 'Terre', isRocky: true },
            { name: 'Mars', isRocky: true },
            { name: 'Jupiter', isRocky: false },
            { name: 'Saturne', isRocky: false },
            { name: 'Uranus', isRocky: false },
            { name: 'Neptune', isRocky: false }
        ];
        this.ControllerService.test();
    }
}
PlanetsController.$inject = ['controllerService'];
planetsModule.service('controllerService', ControllerService);
planetsModule.controller('PlanetsController', PlanetsController);
//# sourceMappingURL=test.js.map