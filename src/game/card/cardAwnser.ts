import Card from './card';
import { CardUnitJSON } from './../interfaceData';

export default class CardAnwser extends Card{
    
    constructor(card: CardUnitJSON){
        super('question', card);
    }
    
}