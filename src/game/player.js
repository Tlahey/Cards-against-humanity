"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Session_1 = require("./Session");
var PlayerType;
(function (PlayerType) {
    PlayerType[PlayerType["MASTER"] = 0] = "MASTER";
    PlayerType[PlayerType["PLAYER"] = 1] = "PLAYER";
})(PlayerType = exports.PlayerType || (exports.PlayerType = {}));
class Player {
    constructor(PlayerSocket, _session, Nickname) {
        this.PlayerSocket = PlayerSocket;
        this._session = _session;
        this.Nickname = Nickname;
        this.Cards = [];
        PlayerSocket['Player'] = this;
        PlayerSocket['Room'] = this._session.Guid;
        PlayerSocket['Username'] = this.Nickname;
        PlayerSocket.leave('');
        PlayerSocket.join(this._session.Guid);
        this.Score = 0;
        this.reinitialize(false);
        // A la déconnexion d'un utilisateur
        PlayerSocket.on('disconnect', () => {
            this._session.disconnectPlayer(this);
        });
        PlayerSocket.on('setNickname', (data) => {
            this.PlayerSocket['Username'] = data;
        });
        PlayerSocket.on('sendData', (data) => {
            console.log('DATA : ' + data + ' Player : ' + PlayerSocket['Username']);
            switch (this.Type) {
                case PlayerType.PLAYER:
                    this.playerReceiveData(data);
                    this._session.update();
                    break;
                case PlayerType.MASTER:
                    if (this._session.SessionState == Session_1.SessionState.WAIT_MASTER_RESPONSE) {
                        this.masterReceiveData(data);
                        this._session.update();
                    }
                    break;
            }
        });
        // Un joueur à été créé
        console.log('[Player] - User created');
    }
    setSession(session) {
        this._session = session;
        this.PlayerSocket['Room'] = this._session.Guid;
        this.PlayerSocket.leave('');
        this.PlayerSocket.join(this._session.Guid);
    }
    reinitialize(reinitAll) {
        this.ChoiceWinner = undefined;
        this.SelectedCard = undefined;
        if (reinitAll) {
            this.Cards = undefined;
            this._session = undefined;
            this.Score = 0;
        }
    }
    playerReceiveData(data) {
        console.log('[Player] SelectedCard ', this.SelectedCard);
        if (this.SelectedCard == undefined) {
            this.SelectedCard = this.Cards.find((x) => x.Guid == data);
            if (this.SelectedCard) {
                console.log('SelectedCard : ' + this.SelectedCard);
                let message = "Votre choix : " + this._session.SelectedQuestionCard.toString(this.SelectedCard);
                console.log("MESSAGE : " + message);
                var index = this.Cards.indexOf(this.SelectedCard, 0);
                if (index > -1) {
                    this.Cards.splice(index, 1);
                }
                this.sendMessage(message);
            }
            else {
                console.log('[Player] Not found Cards : ', this.Cards);
            }
        }
    }
    masterReceiveData(data) {
        this.ChoiceWinner = this._session.players.filter(p => p.Type == PlayerType.PLAYER).find(player => player.SelectedCard.Guid == data);
    }
    sendMessage(message) {
        // Voir ici, pose problème doit envoyer le message qu'a l'utilisateur
        // this.PlayerSocket.broadcast.emit('message', 'SERVER', "[" + this.PlayerSocket['Username'] + "] - " + message);
        this.PlayerSocket.emit('message', 'SERVER', "[" + this.PlayerSocket['Username'] + "] - " + message);
    }
    givePoint() {
        this.Score += 1;
        console.log("[Player] " + this.Nickname + " score " + this.Score);
    }
    sendAllCard() {
        // console.log("[Player] Send cards to player " + this.Nickname + " : ", this.Cards);
        this.Cards.forEach((card) => {
            this.sendMessage(card.Guid + " - " + card.Value);
        });
    }
}
exports.Player = Player;
//# sourceMappingURL=player.js.map