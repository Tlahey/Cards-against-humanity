import * as fs from "fs";
import * as Q from "q";

import { CardDatasJSON, CardUnitJSON } from '../interfaceData';

import { Player } from '../player';
import CardQuestion from '../card/cardQuestion';
import CardAwnser from '../card/cardAwnser';

/*
    Sites a importer : 
        - http://s3.amazonaws.com/cah/CAH_FrenchByCluchier.pdf
        - http://s3.amazonaws.com/cah/CAH_French_CA_ByAnaxagor.pdf
        - https://leschiensdelenfer.files.wordpress.com/2015/07/questionscah_complet_e-burger.pdf
        - https://leschiensdelenfer.files.wordpress.com/2015/07/rc3a9ponsescah_complet_e-burger.pdf
*/
export default class DataBase{
    
    // Récupère l'ensemble des cartes de la base de données
    public getCards() : Promise<CardResult>{
        return new Promise((success, reject) => {
           fs.readFile('./src/datas/cards.json', 'utf8', (err, datas) => {
                
                if(err){
                    console.error("[Database] getCards error : ", err);
                }
                
                // datas to JSON
                let jsonCardDatas: CardDatasJSON = JSON.parse(datas);
                console.log("[Database] getCards OK");
                            
                success(new CardResult(
                    this._createQuestionCards(jsonCardDatas.questions),
                    this._createAwnserCard(jsonCardDatas.awnsers)
                ));
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

class CardResult {

    constructor(public CardsQuestion: CardQuestion[], public CardsAwnser: CardAwnser[]){

    }
}