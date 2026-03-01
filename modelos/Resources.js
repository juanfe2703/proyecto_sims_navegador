// Contenedor global 

class Resources {
    constructor(money = 0, electricity = 0, water = 0, food = 0) {
        this._money = money
        this._electricity = electricity
        this._water = water
        this._food = food
    }

    // Getters
    getMoney() { return this._money }
    getElectricity() { return this._electricity }
    getWater() { return this._water }
    getFood() { return this._food }

    // Setters
    setMoney(value) { this._money = value }
    setElectricity(value) { this._electricity = value }
    setWater(value) { this._water = value }
    setFood(value) { this._food = value }

    applyTransaction(transaction) {
        this._money += transaction.getMoney()
        this._electricity += transaction.getElectricity()
        this._water += transaction.getWater()
        this._food += transaction.getFood()
    }

    hasEnough(transaction) {
        return (
            this._money + transaction.getMoney() >= 0 &&
            this._electricity + transaction.getElectricity() >= 0 &&
            this._water + transaction.getWater() >= 0 &&
            this._food + transaction.getFood() >= 0
        )
    }
}