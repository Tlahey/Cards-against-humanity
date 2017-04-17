export interface CardDatasJSON{
    questions: CardUnitJSON[];
    awnsers: CardUnitJSON[];
}

export interface CardUnitJSON{
    guid: string;
    value: string;
}