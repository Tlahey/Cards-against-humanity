"use strict";

import * as http from "http";
import * as express from "express";
import * as io from "socket.io";

import Game from "./src/game/game";
import { dirname } from "path";


var app = express();
var httpServer = http.createServer(app);
var ioServer = io(httpServer);

app.use("/js",  express.static(__dirname + '/src/web/js'));
app.use("/css",  express.static(__dirname + '/src/web/css'));
app.use("/html",  express.static(__dirname + '/src/web/html'));

app.use("/node_modules",  express.static(__dirname + '/node_modules'));

app.get('/', (req: express.Request, res: express.Response) => {
    // Trouver le moyer d'avoir la bonne adresse IP à la place des Scripts
    res.sendFile(__dirname + '/src/web/html/index.html');
});

let _game = new Game(ioServer);

ioServer.on('connection', (socket) => {

    // On attends que le jeu soit intialisé
    _game.isInitialized().then(() => {

        // On envoi les sessions 
        socket.emit('message', 'getSessions', _game.getSessionsInformations());

        // On envoi une action de demande de username
        socket.emit('message', 'GetUserName', {'message': "Quel est votre pseudo ?"});

        socket.on('choiceSession', (userName:string, sessionGuid : string) => {
            // Un joueur s'est connecté au jeu
            console.log(`[App] - User [${userName}] try to connect session [${sessionGuid}]`);
            // On ajoute le joueur au jeu
            _game.connectPlayer(socket, userName, sessionGuid).then(connexionReturn => {
                socket.emit('message', 'connexionCallback', connexionReturn);
            });
        });

        // todo : déconnexion
        
        
    });

});

httpServer.listen(3000, () => {
    console.log('listening on *:3000');
});

export var App = app;

/*
INFOS :

$ tsd query socket.io --save --action install
$ tsd update -so
tsd query socket.io --save --action install

socket.io-client
*/
