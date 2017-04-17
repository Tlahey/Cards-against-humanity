"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const express = require("express");
const io = require("socket.io");
const game_1 = require("./src/game/game");
var app = express();
var httpServer = http.createServer(app);
var ioServer = io(httpServer);
app.use("/js", express.static(__dirname + '/src/web/js'));
app.use("/node_modules", express.static(__dirname + '/node_modules'));
app.get('/', (req, res) => {
    // Trouver le moyer d'avoir la bonne adresse IP à la place des Scripts
    res.sendFile(__dirname + '/src/web/html/index.html');
});
let _game = new game_1.default(ioServer);
ioServer.on('connection', (socket) => {
    // On attends que le jeu soit intialisé
    _game.isInitialized().then(() => {
        // On envoi une action de demande de username
        socket.emit('message', 'GetUserName', { 'message': "Quel est votre pseudo ?" });
        // Quand on reçoit l'information de l'utilisateur
        socket.on('adduser', (userName) => {
            // Un joueur s'est connecté au jeu
            console.log('[App] - User ' + userName + ' connected');
            // On ajoute le joueur au jeu
            _game.connectPlayer(socket, userName);
        });
    });
});
httpServer.listen(3000, () => {
    console.log('listening on *:3000');
});
exports.App = app;
/*
INFOS :

$ tsd query socket.io --save --action install
$ tsd update -so
tsd query socket.io --save --action install

socket.io-client
*/
//# sourceMappingURL=app.js.map