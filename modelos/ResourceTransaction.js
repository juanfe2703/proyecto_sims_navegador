//Este archivo va a definir el contrato entre edificios y ciudad


class ResourceTransaction {
    constructor({ money = 0, electricity = 0, water = 0, food = 0 }) {
        this._money = money
        this._electricity = electricity
        this._water = water
        this._food = food
    }

    getMoney() { return this._money }
    getElectricity() { return this._electricity }
    getWater() { return this._water }
    getFood() { return this._food }
}