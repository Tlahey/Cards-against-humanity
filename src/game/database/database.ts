import * as fs from "fs";
import * as Q from "q";

import { CardDatasJSON, CardUnitJSON } from '../interfaceData';

import { Player } from '../player';
import CardQuestion from '../card/cardQuestion';
import CardAwnser from '../card/cardAwnser';

interface ICardResult {
    CardsQuestion: CardQuestion[];
    CardsAwnser: CardAwnser[];
}

/*
    Sites a importer : 
        - http://s3.amazonaws.com/cah/CAH_FrenchByCluchier.pdf
        - http://s3.amazonaws.com/cah/CAH_French_CA_ByAnaxagor.pdf
*/
export default class DataBase{
    
    // Récupère l'ensemble des cartes de la base de données
    public getCards() : Promise<any>{
        return new Promise<ICardResult>((success, reject) => {
           fs.readFile('./src/datas/cards.json', 'utf8', (err, datas) => {
                
                if(err){
                    console.error("[Database] getCards error : ", err);
                }
                
                // datas to JSON
                let jsonCardDatas: CardDatasJSON = JSON.parse(datas);
                console.log("[Database] getCards OK");
                            
                success({
                    'CardsQuestion': this._createQuestionCards(jsonCardDatas.questions),
                    'CardsAwnser': this._createAwnserCard(jsonCardDatas.awnsers)
                } as ICardResult);
            });           
        });
    }

        // Récupère les cartes questions
    private _createQuestionCards(jsonCardQuestion: CardUnitJSON[]){
        console.log("[Game] _createQuestionCards");
        let cardQuestion: CardQuestion[] = [];
        jsonCardQuestion.forEach((card) => {
            cardQuestion.push(new CardQuestion(card));
        });
        return cardQuestion;
    }
    // récupère les cartes réponses
    private _createAwnserCard(jsonCardAwnser: CardUnitJSON[]){
        console.log("[Game] _createAwnserCard");
        let cardAwnser : CardAwnser[] = [];
        jsonCardAwnser.forEach((card) => {
            cardAwnser.push(new CardAwnser(card));
        });
        return cardAwnser;
    }
}

