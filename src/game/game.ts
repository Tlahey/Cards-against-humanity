import * as fs from "fs";
import * as Q from "q";

import { CardDatasJSON, CardUnitJSON } from './interfaceData';

import { Player } from './player';
import Database from './database/database';
import CardQuestion from './card/cardQuestion';
import CardAwnser from './card/cardAwnser';
import { Session } from './session';
import { Configuration } from "./configuration";

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

            console.log("[Game] Création des sessions");
            for(var i = 0, ii = Configuration.Session.OPEN_SESSION; i < ii; i++){
                this.createNewSession();
            }

            this._isInitialize.resolve();
            console.log("[Game] The Game is Initilized");
        });

    }
    
    public getSessionsInformations(){
        let sessionsInformations : any = [];
        this._sessionArray.forEach(session => {
            if(!session.GameEnded)
                sessionsInformations.push({
                    'Guid': session.Guid,
                    'State': session.SessionState,
                    'Name': session.SessionName,
                    'CountPlayers': session.players.length,
                    'MaxPlayers': Configuration.Game.MAX_PLAYERS
                });
        });
        return sessionsInformations;
    }

    public removeSession(session : Session){
        let index = this._sessionArray.findIndex(s => s.Guid == session.Guid);
        if(index > -1)
            this._sessionArray.splice(index, 1);
    }

    public createNewSession(){
        this._sessionArray.push(new Session(this._ioServer, this));
    }

    public isInitialized(){
        return this._isInitialize.promise;
    }

    public connectPlayer(playerSocket : SocketIO.Socket, playerUserName: string, playerSessionGuid : string) : Promise<any>{
        
        return this.isInitialized().then(() => {

            // TODO : Changement 
            // On récupère la session par rapport au playerSessionGuid
            let sessionsAvailable = this._sessionArray.find((session) => session.Guid == playerSessionGuid);
            if(sessionsAvailable == undefined)
                return {
                    'success': false,
                    'message': 'Session guid not found'
                };

            if(sessionsAvailable.isFull())
                return {
                    'success': false,
                    'message': 'Session guid is full'
                };

            if(sessionsAvailable.players.find(p => p.Nickname == playerUserName))
                return {
                    'success': false,
                    'message': `User ${playerUserName} is in the session`
                }

            sessionsAvailable.joinPlayer(new Player(playerSocket, sessionsAvailable, playerUserName));
            return {
                'success': true
            };
        });

    }

    public connectExistingPlayer(player : Player) : void{
        // On retourne à l'utilisateur la liste des sessions
        player.PlayerSocket.emit('message', 'getSessions', this.getSessionsInformations());
    }

    public getRandomCardQuestion(){
        let randomQuestion = this._cardQuestion.slice().shuffle();
        // console.log("[Game] randomQuestion : ", randomQuestion);
        return randomQuestion;
    }

    public getRandomCardAwnser(){
        let randomAwnser = this._cardAwnser.slice().shuffle();
        // console.log("[Game] randomAwnser : ", randomAwnser);
        return randomAwnser;
    }
}
