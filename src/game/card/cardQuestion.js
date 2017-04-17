"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const card_1 = require("./card");
class CardQuestion extends card_1.default {
    constructor(card) {
        super('question', card);
    }
    toString(card) {
        return this._value.replace("{0}", card.Value);
    }
}
exports.default = CardQuestion;
//# sourceMappingURL=cardQuestion.js.map