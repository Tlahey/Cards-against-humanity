"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const player_1 = require("./player");
const database_1 = require("./database/database");
const session_1 = require("./session");
class Game {
    constructor(_ioServer) {
        this._ioServer = _ioServer;
        this._cardQuestion = [];
        this._cardAwnser = [];
        this._sessionArray = [];
        this._isInitialize = Q.defer();
        console.log("[Game] Initialisation du jeu");
        this._databaseCtrl = new database_1.default();
        this._databaseCtrl.getCards().then((datas) => {
            this._cardQuestion = datas.CardsQuestion;
            this._cardAwnser = datas.CardsAwnser;
            this._isInitialize.resolve();
            console.log("[Game] The Game is Initilized");
        });
    }
    isInitialized() {
        return this._isInitialize.promise;
    }
    connectPlayer(playerSocket, playerUserName) {
        this.isInitialized().then(() => {
            // On crée l'objet player
            // On trouve une session qui n'est pas complète
            // Si aucune session on en crée une nouvelle
            let sessionsAvailable = this._sessionArray.find((data) => !data.isFull());
            // Si aucune session n'a été trouvée
            if (sessionsAvailable == undefined) {
                let newSession = new session_1.Session(this._ioServer, this);
                newSession.joinPlayer(new player_1.Player(playerSocket, newSession, playerUserName));
                this._sessionArray.push(newSession);
            }
            else {
                // On prends la première session et on ajoute l'utilisateur
                sessionsAvailable.joinPlayer(new player_1.Player(playerSocket, sessionsAvailable, playerUserName));
            }
        });
    }
    connectExistingPlayer(player) {
        this.isInitialized().then(() => {
            let sessionsAvailable = this._sessionArray.find((data) => !data.isFull());
            // Si aucune session n'a été trouvée
            if (sessionsAvailable == undefined) {
                let newSession = new session_1.Session(this._ioServer, this);
                player.setSession(newSession);
                newSession.joinPlayer(player);
                this._sessionArray.push(newSession);
            }
            else {
                // On prends la première session et on ajoute l'utilisateur
                player.setSession(sessionsAvailable);
                sessionsAvailable.joinPlayer(player);
            }
        });
    }
    getRandomCardQuestion() {
        let randomQuestion = this.shuffle(this._cardQuestion.slice());
        // console.log("[Game] randomQuestion : ", randomQuestion);
        return randomQuestion;
    }
    getRandomCardAwnser() {
        let randomAwnser = this.shuffle(this._cardAwnser.slice());
        // console.log("[Game] randomAwnser : ", randomAwnser);
        return randomAwnser;
    }
    shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }
}
exports.default = Game;
//# sourceMappingURL=game.js.map