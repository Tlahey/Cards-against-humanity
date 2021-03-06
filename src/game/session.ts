import { ICard } from './card/iCard';
import * as io from "socket.io";

import { Player, PlayerType, IPlayerInformations } from './player';
import Game from './game';
import CardQuestion from './card/cardQuestion';
import CardAwnser from './card/cardAwnser';
import { Configuration } from "./configuration";

export enum MessageType{
    MESSAGE,

    INFORMATION,
    IMPORTANT,
    ERROR,

    CLEAR

}

export enum SessionState{
    INITIALISATION,
    WAIT_PLAYERS,

    BEGIN_GAME,

    SET_PLAYERS_TYPES,
    GIVE_QUESTION,
    GIVE_CARD,

    WAIT_USERS_CARD,
    WAIT_MASTER_RESPONSE,
    MASTER_GIVE_REPONSE,

    GAME_END
}

export interface payloadResponse{
    Players: IPlayerInformations[];
    Player: any;
    QuestionCard : ICard;
    UsersAwnserCards : ICard[];
    Winner: IPlayerInformations;
    CurrentUserAwnserCards: ICard[];
    State: SessionState;
}

// CONFIGURATION SESSION 
var pointsForWin: number = Configuration.Game.POINTS_FOR_WIN;
var maxPlayer: number = Configuration.Game.MAX_PLAYERS;
var cardsCountByPlayer: number = Configuration.Game.CARDS_BY_PLAYERS;

/*
    La session correspond à une partie entre différents joueurs.
*/
export class Session{

    Guid: string;
    players: Player[] = [];   
    private _cardsQuestion: CardQuestion[];
    private _cardsAwnser: CardAwnser[];
    private _lastWinner:Player;
    private _sessionState: SessionState;
    private _selectedQuestionCard: CardQuestion;
    get GameEnded() : boolean { return this._sessionState == SessionState.GAME_END; }
    SessionName : string;

    get SessionState():SessionState{
        return this._sessionState;
    }

    get SelectedQuestionCard():CardQuestion{
        return this._selectedQuestionCard;
    }

    constructor(private _ioServer: SocketIO.Server, private _game: Game){
        this._sessionState = SessionState.INITIALISATION;

        this.Guid = Guid.newGuid();
        this._cardsQuestion = this._game.getRandomCardQuestion();
        this._cardsAwnser = this._game.getRandomCardAwnser();
        this.SessionName = Utils.randNameElite();

        console.log("[Session] Create new session " + this.Guid);
        this._sessionState = SessionState.WAIT_PLAYERS;
    }

    isFull() : boolean{
	    console.log("[Session] isFull : " + this.players.length + " / " + maxPlayer);
        return this.players.length >= maxPlayer;
    }

    joinPlayer(player : Player){
        return new Promise<any>((resolve) => {
            if(!this.isFull()){
                console.log("[Session] joinPlayer");
                this.players.push(player);
                this.sendToAllPlayers(`[Session] Player ${player.Nickname} join session`, MessageType.IMPORTANT);
            }
            this.beginSession();
        });
    }

    updateAllPlayers(){

        // Les cartes sélectionnés par les utilisateurs
        let usersSelectedCards = [];
        this.players
            .filter(p => p.Type == PlayerType.PLAYER)
            .forEach(player => {
                if(player.SelectedCard != undefined){
                    usersSelectedCards.push({
                        'Guid': player.SelectedCard.Guid,
                        'Value': player.SelectedCard.Value
                    });
                }
            }); 

        let response : payloadResponse = {
            'Players': this.players.map(p => p.toPlayerInformations()),
            'UsersAwnserCards': (usersSelectedCards.length == (this.players.length - 1)) ? usersSelectedCards.shuffle() : undefined,
            'QuestionCard': {
                'Guid': this._selectedQuestionCard.Guid,
                'Value': this._selectedQuestionCard.Value.replace("{0}", "____")
            } as ICard,
            'Winner': this.players.find(p => p.Score >= pointsForWin),
            'CurrentUserAwnserCards': undefined,
            'Player': undefined,
            'State': this.SessionState
        } as payloadResponse;

        // On envoie pour chacun des joueurs, contient des informations unique à l'utilisateur
        // this._ioServer.in(this.Guid).emit('message', 'payload', response);
        this.players.forEach(p => {
            response['CurrentUserAwnserCards'] = undefined;
            response['Player'] = p.toPlayerInformations();
            response['Player']['Guid'] = p.Guid;
            if(p.Cards.length > 0)
                response['CurrentUserAwnserCards'] = p.Cards.map(c => { return {
                    'Guid': c.Guid,
                    'Value': c.Value
                } as ICard });
            p.PlayerSocket.emit('message', 'payload', response);            
        });
    }

    sendToAllPlayers(message: string, messageType : MessageType){
        // Toujours envoyer les informations suivantes : 
        if(this.players.length > 0){
            this._ioServer.in(this.Guid).emit('message', messageType, message);
            console.log(`[Session] Send message (function ${messageType}) to all players : `, message);
        }
    }

    public disconnectPlayer(player : Player) {
        
    }

    private beginSession(){
        if(this.isFull()){
            // On donne les cartes à l'utilisateur
            this.setNewState(SessionState.BEGIN_GAME);
        }
    }

    private setAndSendPlayerTypes(playerMaster : Player){
        playerMaster.Type = PlayerType.MASTER;
        this.sendToAllPlayers(`[Session] Le joueur ${playerMaster.Nickname} est le maitre`, MessageType.IMPORTANT);
        this.players.forEach((player : Player, index : number) => {
            if(player != playerMaster){
                player.Type = PlayerType.PLAYER;
            }
            player.reinitialize(false);
            console.log('[Session] PlayerType ' + player.Nickname + ' = ' + player.Type);
            player.sendMessage(`Player type : ${((player.Type == PlayerType.MASTER) ? 'MASTER' : 'PLAYER')}`, MessageType.IMPORTANT);
        });
    }

    public playerLeave(player : Player){
        this.sendToAllPlayers(`[Session] Player ${player.Nickname} disconnected`, MessageType.IMPORTANT);
        this._presShutDownSession();
    }

    public newQuestion(){
        this.selectQuestionCard();
        this.sendToAllPlayers(`[Session] Nouvelle question : ${this._selectedQuestionCard.Value.replace("{0}", "____")}`, MessageType.INFORMATION);
    }

    private selectQuestionCard(){
        this._selectedQuestionCard = this._cardsQuestion[0];
        console.log("[Session] selectQuestionCard ", this._selectedQuestionCard.Value.replace("{0}", "____"));
        this._cardsQuestion.splice(0, 1);
        this._cardsQuestion.push(this._selectedQuestionCard);
    }

    private sendCardsToPlayers(){
        // On donne les premières cartes du tas aux joueurs
        this.players.filter(p => p.Type == PlayerType.PLAYER).forEach((player) => {
            console.log("[Session] - sendCardsToPlayer : ", player.Nickname );
            
            this._giveCards(player);
            
            player.sendAllCard();
        });
        this.players.find(p => p.Type == PlayerType.MASTER).sendMessage("En attente des autres joueurs", MessageType.INFORMATION);
    }

    private _giveCards(player : Player){
        var currentCountCards = player.Cards.length;

        var tempArray = [];
        var nbSendCardToPlayer = 0;
        for(var i = currentCountCards; i < cardsCountByPlayer; i++){
            tempArray.push(this._cardsAwnser[i]);
            nbSendCardToPlayer++;
        }

        // On ajoute les nouvelles cartes au tableau de carte de l'utilisateur
        player.Cards = player.Cards.concat(tempArray);

        // On enlève le compte des éléments dans le awserCards
        this._cardsAwnser.splice(0, nbSendCardToPlayer);

        // On ajoute à la fin les cartes qu'on vien d'enlever pour que le jeu soit infini
        tempArray.forEach(c => {
            this._cardsAwnser.push(c);
        });
    }

    public update(playerGuid? : string){
        console.log('[Session] Update ', this._sessionState);
        /* Si le jeu commence
            - on donne les nouvelles cartes
            - on retourne au
        */
        switch (this._sessionState) {
            case SessionState.BEGIN_GAME:
                this.sendToAllPlayers('', MessageType.CLEAR);
                console.log('[Session] Update BEGIN_GAME');
                this.sendToAllPlayers("[Session] Game Begin", MessageType.IMPORTANT);
                this._lastWinner = this.players[0]; // TODO : gérer un utilisateur aléatoire
                this.setNewState(SessionState.SET_PLAYERS_TYPES);
                break;
            // Donne les nouvelles states des joueurs
            case SessionState.SET_PLAYERS_TYPES:
                console.log('[Session] Update SET_PLAYERS_TYPES');
                // TODO : last winner
                this.setAndSendPlayerTypes(this._lastWinner);
                this.setNewState(SessionState.GIVE_QUESTION);
                break; 
            // Donne une nouvelle question
            case SessionState.GIVE_QUESTION:
                console.log('[Session] Update GIVE_QUESTION');
                this.newQuestion();
                this.setNewState(SessionState.GIVE_CARD);
                break;
            // Donne les cartes aux joueurs
            case SessionState.GIVE_CARD:
                console.log('[Session] Update GIVE_CARD');
                this.sendCardsToPlayers();
                this.setNewState(SessionState.WAIT_USERS_CARD);
                break;
            // On attends tous les joueurs
            case SessionState.WAIT_USERS_CARD:
                console.log('[Session] Update WAIT_USERS_CARD');
                // Vérifie que tous les utilisateurs on sélectionné du carte
                let allPlayerHavePlayed = true;
                this.players
                    .filter(p => p.Type == PlayerType.PLAYER)
                    .forEach(player => {
                        if(player.SelectedCard == undefined){
                            allPlayerHavePlayed = false;
                        }
                    }); 
                // Si tous les utilisateurs on sélectionné du carte on envoi toutes les réponses à tous le monde
                if(allPlayerHavePlayed){
                    // On change l'état en WAIT MASTER RESPONSE
                    this.setNewState(SessionState.WAIT_MASTER_RESPONSE);
                }
                break;
            // On attends la réponse du Master
            case SessionState.WAIT_MASTER_RESPONSE:
            
                var masterPlayer : Player = this.players.find(p => p.Type == PlayerType.MASTER);
                if(masterPlayer.ChoiceWinner){
                    this.setNewState(SessionState.MASTER_GIVE_REPONSE, );
                }else{
                    // On clear la console des utilisateur
                    this.sendToAllPlayers('', MessageType.CLEAR);

                    masterPlayer.sendMessage("Select the best anwser", MessageType.IMPORTANT);
                    let player : Player[] = this.players
                        .filter(p => p.Type == PlayerType.PLAYER);

                    // On envoi à tous le monde l'ensemble des réponses
                    player.forEach(player => {
                        this.sendToAllPlayers(`${player.SelectedCard.Guid} - ${this._selectedQuestionCard.toString(player.SelectedCard)}`, MessageType.INFORMATION);
                        player.sendMessage("Le maitre choisi la meilleur réponse.", MessageType.IMPORTANT);
                    });

                    // On demande au master sa meilleur réponse                    
                }

                break;
            case SessionState.MASTER_GIVE_REPONSE:
                var masterPlayer : Player = this.players.find(p => p.Type == PlayerType.MASTER);

                // On envoi la meilleur réponse aux joueurs
                this.sendToAllPlayers('', MessageType.CLEAR);

                this.sendToAllPlayers(`Phrase gagante : ${this._selectedQuestionCard.toString(masterPlayer.ChoiceWinner.SelectedCard)}`, MessageType.IMPORTANT);
                this.sendToAllPlayers(`Le joueur ${masterPlayer.ChoiceWinner.Nickname} gagne le point.`, MessageType.IMPORTANT);

                // On donne le point au gagnant
                masterPlayer.ChoiceWinner.givePoint();
                this._lastWinner = masterPlayer.ChoiceWinner;
                
                // Récapituler l'ensemble des points 
                this.sendToAllPlayers("Score des joueurs : ", MessageType.INFORMATION);
                this.players.forEach(player => {
                    this.sendToAllPlayers(`${player.Nickname} - ${player.Score}`, MessageType.INFORMATION);
                });

                // Si un utilisatuer à tous les points alors on GAME_END
                let playerHaveWin = false;
                for(var i = 0, ii = this.players.length; i < ii; i++){
                    if(this.players[i].Score >= pointsForWin){
                        playerHaveWin = true;
                        break;
                    }
                }

                if(playerHaveWin){
	                this.setNewState(SessionState.GAME_END);
                } else {
                    // Sinon on relance un state SET PLAYER TYPES
                    this.setNewState(SessionState.SET_PLAYERS_TYPES);
                }

                break;
            case SessionState.GAME_END:
                console.log("[Session] GAME_END");
                // On envoi un message de fin à tous les joueurs avec le gagnant
                this.sendToAllPlayers("Jeu fini", MessageType.IMPORTANT);
                let winner : Player;
                for(var i = 0, ii = this.players.length; i < ii; i++){
                    if(this.players[i].Score >= pointsForWin){
                        this.players[i].IsWinner = true;
                        winner = this.players[i];
                        break;
                    }else
                        this.players[i].IsWinner = false;
                }
	            // On réinscrit les joueurs dans une nouvelle session
                this.sendToAllPlayers(`Vainqueur : ${winner.Nickname}`, MessageType.IMPORTANT);

                // this.updateAllPlayers();
                this._presShutDownSession();

                return;
        }
        
        this.updateAllPlayers();
    }

    private _presShutDownSession(){
        this.sendToAllPlayers(`Retour au menu des sessions dans 10 secondes.`, MessageType.IMPORTANT);
        this.players.forEach(player => {
            
            // On reconnecte l'ensemble des joueurs dans une nouvelle session.
            // TODO a revoir
            /*setTimeout(((p) => {
                this._game.connectExistingPlayer(p);   
                // On ferme la session
                player.reinitialize(true);
            })(player), 10000);
            */
        });

        setTimeout(() => {
            this.closeSession();
        }, 20000);
        
    }

    private closeSession(){
        // on set toutes les var à undefined
        // on supprime la session du jeu
        this._game.createNewSession();
        this._game.removeSession(this);
        this.Guid = undefined;
        this.players = undefined; 
        this._cardsQuestion = undefined;
        this._cardsAwnser = undefined;
        this._lastWinner = undefined;
        this._sessionState = undefined;
        this._selectedQuestionCard = undefined;
    }

    private setNewState(newSessionState: SessionState){
        this._sessionState = newSessionState;
        this.update();
    }

}

export class Guid {
    static newGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
}

export class Utils {
    static randNameElite(): string {
        var pairs = "..lexegezacebiso"
                    "usesarmaindirea."
                    "eratenberalaveti"
                    "edorquanteisrion";
        
        var pair1 = 2 * Math.floor(Math.random() * (pairs.length / 2));
        var pair2 = 2 * Math.floor(Math.random() * (pairs.length / 2));
        var pair3 = 2 * Math.floor(Math.random() * (pairs.length / 2));
        var pair4 = 2 * Math.floor(Math.random() * (pairs.length / 2));

        var name = "";
        name += pairs.substr(pair1, 2);
        name += pairs.substr(pair2, 2);
        name += pairs.substr(pair3, 2);
        name += pairs.substr(pair4, 2);
        name = name.replace(/[.]/g, "");
        
        return name;
    }
}

declare global {
  interface Array<T> {
    remove(elem: T): Array<T>;
    shuffle() : Array<T>;
  }
}

if (!Array.prototype.remove) {
  Array.prototype.remove = function<T>(elem: T): T[] {
    return this.filter(e => e !== elem);
  }
}

if (!Array.prototype.shuffle) {
    Array.prototype.shuffle = function() {
        var cards = [];
        this.forEach(element => {
            cards.push(element);
        });
        for (let i = cards.length; i; i--) {
            let j = Math.floor(Math.random() * i);
            [cards[i - 1], cards[j]] = [cards[j], cards[i - 1]];
        }
        return cards;
    }
}