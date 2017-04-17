"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const cardQuestion_1 = require("../card/cardQuestion");
const cardAwnser_1 = require("../card/cardAwnser");
class DataBase {
    // Récupère l'ensemble des cartes de la base de données
    getCards() {
        return new Promise((success, reject) => {
            fs.readFile('./src/datas/cards.json', 'utf8', (err, datas) => {
                if (err) {
                    console.error("[Database] getCards error : ", err);
                }
                // datas to JSON
                let jsonCardDatas = JSON.parse(datas);
                console.log("[Database] getCards OK");
                success(new CardResult(this._createQuestionCards(jsonCardDatas.questions), this._createAwnserCard(jsonCardDatas.awnsers)));
            });
        });
    }
    // Récupère les cartes questions
    _createQuestionCards(jsonCardQuestion) {
        console.log("[Game] _createQuestionCards");
        let cardQuestion = [];
        jsonCardQuestion.forEach((card) => {
            cardQuestion.push(new cardQuestion_1.default(card));
        });
        return cardQuestion;
    }
    // récupère les cartes réponses
    _createAwnserCard(jsonCardAwnser) {
        console.log("[Game] _createAwnserCard");
        let cardAwnser = [];
        jsonCardAwnser.forEach((card) => {
            cardAwnser.push(new cardAwnser_1.default(card));
        });
        return cardAwnser;
    }
}
exports.default = DataBase;
class CardResult {
    constructor(CardsQuestion, CardsAwnser) {
        this.CardsQuestion = CardsQuestion;
        this.CardsAwnser = CardsAwnser;
    }
}
//# sourceMappingURL=database.js.map