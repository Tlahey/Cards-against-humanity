import { CardUnitJSON } from './../interfaceData';

enum CardType{
    QUESTION,
    AWNSER
}

export default class Card {
    
    protected _cardType: CardType;
    
    protected _guid: string;
    protected _value: string;
    
    get Value():string {
        return this._value;
    }

    get Guid():string {
        return this._guid;
    }

    constructor(type: string, card: CardUnitJSON){
        
        this._guid = card.guid;
        this._value = card.value;
        
        switch(type){
            case 'question':
                this._cardType = CardType.QUESTION;
                break;
            case 'awnser':
                this._cardType = CardType.AWNSER;
                break;
        }
        
    }
}