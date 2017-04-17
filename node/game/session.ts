import * as io from "socket.io";

import { Player, PlayerType } from './player';
import Game from './game';
import CardQuestion from './card/CardQuestion';
import CardAwnser from './card/CardAwnser';

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

// CONFIGURATION SESSION 
var pointsForWin: number = 1;
var maxPlayer: number = 2;
var cardsCountByPlayer: number = 2;

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
    get SessionState():SessionState{
        return this._sessionState;
    }

    private _selectedQuestionCard: CardQuestion;
    get SelectedQuestionCard():CardQuestion{
        return this._selectedQuestionCard;
    }

    constructor(private _ioServer: SocketIO.Server, private _game: Game){
        this._sessionState = SessionState.INITIALISATION;

        this.Guid = Guid.newGuid();
        this._cardsQuestion = this._game.getRandomCardQuestion();
        this._cardsAwnser = this._game.getRandomCardAwnser();

        console.log("[Session] Create new session " + this.Guid);
        this._sessionState = SessionState.WAIT_PLAYERS;
    }

    isFull() : boolean{
	    console.log("[Session] isFull : " + this.players.length + " / " + maxPlayer);
        return this.players.length >= maxPlayer;
    }

    joinPlayer(player : Player){
        if(!this.isFull()){
            console.log("[Session] joinPlayer");
            this.players.push(player);
            this.sendToAllPlayers("[Session] Player " + player.Nickname + " join session", undefined);
        }
        this.beginSession();
    }

    sendToAllPlayers(message: string, functionName?:string){
        if(this.players.length > 0){
            this._ioServer.in(this.Guid).emit('message', (functionName) ? functionName : 'SendMessage', message);
            console.log("[Session] Send message (function " + functionName + ") to all players : ", message);
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
        this.sendToAllPlayers("Le joueur " + playerMaster.Nickname + " est le maitre");
        this.players.forEach((player : Player, index : number) => {
            if(player != playerMaster){
                player.Type = PlayerType.PLAYER;
            }
            player.reinitialize(false);
            console.log('[Session] PlayerType ' + player.Nickname + ' = ' + player.Type);
            player.sendMessage("Player type : " + ((player.Type == PlayerType.MASTER) ? 'MASTER' : 'PLAYER') );
        });
    }

    public newQuestion(){
        this.selectQuestionCard();
        this.sendToAllPlayers("Nouvelle question : " + this._selectedQuestionCard.Value.replace("{0}", "____"), undefined);
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
        this.players.find(p => p.Type == PlayerType.MASTER).sendMessage("En attente des autres joueurs");
    }

    private _giveCards(player : Player){
        var currentCountCards = player.Cards.length;

        var tempArray = [];
        for(var i = currentCountCards; i < cardsCountByPlayer; i++){
            tempArray.push(this._cardsAwnser[i]);
        }

        // On ajoute les nouvelles cartes au tableau de carte de l'utilisateur
        player.Cards = player.Cards.concat(tempArray);

        // On enlève le compte des éléments dans le awserCards
        this._cardsAwnser.splice(0, currentCountCards);

        // On ajoute à la fin les cartes qu'on vien d'enlever pour que le jeu soit infini
        this._cardsAwnser = this._cardsAwnser.concat(tempArray);       
    }

    public update(){
        console.log('[Session] Update ', this._sessionState);
        /* Si le jeu commence
            - on donne les nouvelles cartes
            - on retourne au
        */
        switch (this._sessionState) {
            case SessionState.BEGIN_GAME:
                this.sendToAllPlayers('', 'clear');
                console.log('[Session] Update BEGIN_GAME');
                this.sendToAllPlayers("[Session] Game Begin");
                this._lastWinner = this.players[0];
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
                    this.setNewState(SessionState.MASTER_GIVE_REPONSE);
                }else{
                    // On clear la console des utilisateur
                    this.sendToAllPlayers('', 'clear');

                    masterPlayer.sendMessage("Select the best anwser");
                    let player : Player[] = this.players
                        .filter(p => p.Type == PlayerType.PLAYER);

                    // On envoi à tous le monde l'ensemble des réponses
                    player.forEach(player => {
                            this.sendToAllPlayers(player.SelectedCard.Guid + " - " + this._selectedQuestionCard.toString(player.SelectedCard));
                        });

                    // Envoyer que le Master est en train de choisir
                    player.forEach(player => {
                        player.sendMessage("Le maitre choisi la meilleur réponse.");
                    });

                    // On demande au master sa meilleur réponse                    
                }

                break;
            case SessionState.MASTER_GIVE_REPONSE:
                // On envoi la meilleur réponse aux joueurs
                this.sendToAllPlayers('', 'clear');

                var masterPlayer : Player = this.players.find(p => p.Type == PlayerType.MASTER);
                this.sendToAllPlayers("Phrase gagante : " + this._selectedQuestionCard.toString(masterPlayer.ChoiceWinner.SelectedCard));
                this.sendToAllPlayers("Le joueur " + masterPlayer.ChoiceWinner.Nickname + " gagne le point.");

                // On donne le point au gagnant
                masterPlayer.ChoiceWinner.givePoint();
                this._lastWinner = masterPlayer.ChoiceWinner;
                
                // Récapituler l'ensemble des points 
                this.sendToAllPlayers("Score des joueurs : ");
                this.players.forEach(player => {
                    this.sendToAllPlayers(player.Nickname + " - " + player.Score);
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
                this.sendToAllPlayers("Jeu fini");
                let winner : Player;
                for(var i = 0, ii = this.players.length; i < ii; i++){
                    if(this.players[i].Score >= pointsForWin){
                        winner = this.players[i];
                        break;
                    }
                }
	            // On réinscrit les joueurs dans une nouvelle session
                this.sendToAllPlayers("Vainqueur : " + winner.Nickname);

                this.players.forEach(player => {
                    player.reinitialize(true);
                    this._game.connectExistingPlayer(player);
                });
                // On ferme la session
                this.closeSession();
                break;
        }
    }

    private closeSession(){
        // on set toutes les var à undefined
        // on supprime la session du jeu
    }

    private setNewState(newSessionState: SessionState){
        this._sessionState = newSessionState;
        this.update();
    }

}

class Guid {
    static newGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
}

