"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CardType;
(function (CardType) {
    CardType[CardType["QUESTION"] = 0] = "QUESTION";
    CardType[CardType["AWNSER"] = 1] = "AWNSER";
})(CardType || (CardType = {}));
class Card {
    get Value() {
        return this._value;
    }
    get Guid() {
        return this._guid;
    }
    constructor(type, card) {
        this._guid = card.guid;
        this._value = card.value;
        switch (type) {
            case 'question':
                this._cardType = CardType.QUESTION;
                break;
            case 'awnser':
                this._cardType = CardType.AWNSER;
                break;
        }
    }
}
exports.default = Card;
//# sourceMappingURL=card.js.map