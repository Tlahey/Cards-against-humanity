"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const CardQuestion_1 = require("../card/CardQuestion");
const CardAwnser_1 = require("../card/CardAwnser");
class DataBase {
    // Récupère l'ensemble des cartes de la base de données
    getCards() {
        return new Promise((success, reject) => {
            fs.readFile('./node/datas/cards.json', 'utf8', (err, datas) => {
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
            cardQuestion.push(new CardQuestion_1.default(card));
        });
        return cardQuestion;
    }
    // récupère les cartes réponses
    _createAwnserCard(jsonCardAwnser) {
        console.log("[Game] _createAwnserCard");
        let cardAwnser = [];
        jsonCardAwnser.forEach((card) => {
            cardAwnser.push(new CardAwnser_1.default(card));
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