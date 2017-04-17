import * as fs from "fs";
import * as Q from "q";

import { CardDatasJSON, CardUnitJSON } from './interfaceData';

import { Player } from './player';
import Database from './database/database';
import CardQuestion from './card/CardQuestion';
import CardAwnser from './card/CardAwnser';
import { Session } from './Session';

export default class Game {

    private _isInitialize: Q.Deferred<void>;
    
    public _cardQuestion: CardQuestion[] = [];
    public _cardAwnser: CardAwnser[] = [];

    private _databaseCtrl: Database;

    private _sessionArray: Session[] = [];

    constructor(private _ioServer: SocketIO.Server){
        this._isInitialize = Q.defer<void>();
        console.log("[Game] Initialisation du jeu");

        this._databaseCtrl = new Database();
        this._databaseCtrl.getCards().then((datas) => {
            this._cardQuestion = datas.CardsQuestion;
            this._cardAwnser = datas.CardsAwnser;
            this._isInitialize.resolve();
            console.log("[Game] The Game is Initilized");
        });
    }
    
    public isInitialized(){
        return this._isInitialize.promise;
    }

    public connectPlayer(playerSocket : SocketIO.Socket, playerUserName: string) : void{
        
        this.isInitialized().then(() => {
            // On crée l'objet player
            // On trouve une session qui n'est pas complète
            // Si aucune session on en crée une nouvelle
            let sessionsAvailable = this._sessionArray.find((data) => !data.isFull());

            // Si aucune session n'a été trouvée
            if(sessionsAvailable == undefined){
                let newSession = new Session(this._ioServer, this);
                newSession.joinPlayer(new Player(playerSocket, newSession, playerUserName));
                this._sessionArray.push(newSession);
            } else {
                // On prends la première session et on ajoute l'utilisateur
                sessionsAvailable.joinPlayer(new Player(playerSocket, sessionsAvailable, playerUserName));
            }
        });

    }

    public connectExistingPlayer(player : Player) : void{
        this.isInitialized().then(() => {

            let sessionsAvailable = this._sessionArray.find((data) => !data.isFull());

            // Si aucune session n'a été trouvée
            if(sessionsAvailable == undefined){
                let newSession = new Session(this._ioServer, this);
                player.setSession(newSession);
                newSession.joinPlayer(player);
                this._sessionArray.push(newSession);
            } else {
                // On prends la première session et on ajoute l'utilisateur
                player.setSession(sessionsAvailable);
                sessionsAvailable.joinPlayer(player);
            }
        });
    }

    public getRandomCardQuestion(){
        let randomQuestion = this.shuffle(this._cardQuestion.slice());
        // console.log("[Game] randomQuestion : ", randomQuestion);
        return randomQuestion;
    }

    public getRandomCardAwnser(){
        let randomAwnser = this.shuffle(this._cardAwnser.slice());
        // console.log("[Game] randomAwnser : ", randomAwnser);
        return randomAwnser;
    }

    private shuffle(array) {
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
