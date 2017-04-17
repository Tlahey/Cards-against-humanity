import Card from './card';
import CardAwnser from './cardAwnser';
import { CardUnitJSON } from './../interfaceData';

export default class CardQuestion extends Card{
    
    constructor(card: CardUnitJSON){
        super('question', card);
    }
    
    toString(card: CardAwnser){
        return this._value.replace("{0}", card.Value);
    }

}

