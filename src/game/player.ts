import { Session, SessionState, MessageType, Guid } from './session';
import CardQuestion from './card/cardQuestion';
import CardAwnser from './card/cardAwnser';

export enum PlayerType{
    MASTER,
    PLAYER
}

export class IPlayerInformations{
    Nickname: string;
    Score: number;
    Type: PlayerType;
    HaveSelectedCard: boolean;
}

export class Player implements IPlayerInformations {

    public Cards: CardAwnser[] = [];
    public Type : PlayerType;
    public SelectedCard: CardAwnser;
    public ChoiceWinner: Player;
    public Score: number;
    public HaveSelectedCard: boolean;
    public IsWinner : boolean;

    private _guid : string;
    get Guid() : string { return this._guid; }

    constructor(public PlayerSocket : SocketIO.Socket, private _session : Session, public Nickname: string){
        this._guid = Guid.newGuid();

        PlayerSocket['Player'] = this;
        PlayerSocket['Room'] = this._session.Guid;
        PlayerSocket['Username'] = this.Nickname;

        PlayerSocket.leave('');
        PlayerSocket.join(this._session.Guid);

        // todo : déconnexion
        PlayerSocket.on('disconnect', () => {
            console.log(`Player [${this.Nickname}] disconnected`);
            this._session.playerLeave(this);
        });

        this.Score = 0;
        this.reinitialize(false);

        // A la déconnexion d'un utilisateur
        PlayerSocket.on('disconnect', () => {
            this._session.disconnectPlayer(this);
        });

        PlayerSocket.on('setNickname', (data) => {
            this.PlayerSocket['Username'] = data;
        });

        PlayerSocket.on('sendData', (data : any) => {

            console.log(`Player : ${PlayerSocket['Username']} Data : `, data);

            // si message envoyé par l'utilisateur
            if(data.message){
                this._session.sendToAllPlayers(`[${this.Nickname}] ${data.message}`, MessageType.MESSAGE);
                return;
            }

            switch(this.Type){
                case PlayerType.PLAYER:
                    this.playerReceiveData(data.data);
                    break;
                case PlayerType.MASTER:
                    if(this._session.SessionState == SessionState.WAIT_MASTER_RESPONSE){
                        this.masterReceiveData(data.data);
                    }
                    break;
            }

            this._session.update(data.playerGuid);
        });

        // Un joueur à été créé
        console.log('[Player] - User created');
    }

    toPlayerInformations(): IPlayerInformations {
        return {
            'Nickname': this.Nickname,
            'Score': this.Score,
            'Type': this.Type,
            'HaveSelectedCard': (this.SelectedCard != undefined)
        } as IPlayerInformations;
    }

    setSession(session: Session){
        this._session = session;
        this.PlayerSocket['Room'] = this._session.Guid;
        this.PlayerSocket.leave('');
        this.PlayerSocket.join(this._session.Guid);
    }

    reinitialize(reinitAll : boolean){
        this.ChoiceWinner = undefined;
        this.SelectedCard = undefined;
        if(reinitAll){
            this.Cards = [];
            this._session = undefined;
            this.Score = 0;
        }
    }

    private playerReceiveData(data:string){
        console.log('[Player] SelectedCard ', this.SelectedCard);
        if(this.SelectedCard == undefined){
            this.SelectedCard = this.Cards.find((x) => x.Guid == data);
            if(this.SelectedCard){
                console.log('SelectedCard : ' + this.SelectedCard);
                let message = `Votre choix : ${this._session.SelectedQuestionCard.toString(this.SelectedCard)}`;
                console.log(`MESSAGE : ${message}`);
                var index = this.Cards.indexOf(this.SelectedCard, 0);
                if(index > -1){
                    this.Cards.splice(index, 1);
                }
                this.sendMessage(message, MessageType.INFORMATION);
            }else{
                console.log('[Player] Not found Cards : ', this.Cards);
            }
        }
    }

    private masterReceiveData(data:string){
        this.ChoiceWinner = this._session.players.filter(p => p.Type == PlayerType.PLAYER).find(player => player.SelectedCard.Guid == data);
    }

    sendMessage(message: string, messageType: MessageType){
        // Voir ici, pose problème doit envoyer le message qu'a l'utilisateur
        // this.PlayerSocket.broadcast.emit('message', 'SERVER', "[" + this.PlayerSocket['Username'] + "] - " + message);
        this.PlayerSocket.emit('message', MessageType, `[${this.PlayerSocket['Username']}] - ${message}`)
    }

    givePoint(){
        this.Score += 1;
        console.log("[Player] " + this.Nickname + " score " + this.Score);
    }

    sendAllCard(){
        // console.log("[Player] Send cards to player " + this.Nickname + " : ", this.Cards);
        this.Cards.forEach((card) => {
            this.sendMessage(`${card.Guid} - ${card.Value}`, MessageType.INFORMATION);
        });

    }
}
