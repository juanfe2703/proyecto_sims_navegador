//aqui va el puntaje 

class Score {
    constructor() {
        this._total = 0
        this._populationPoints = 0
        this._happinessPoints = 0
        this._resourcePoints = 0
        this._buildingPoints = 0
    }

    getTotal() { return this._total }

    calculate(city) {
        this._populationPoints = city.getCitizens().length * 10

        let happinessSum = city.getCitizens()
            .reduce((sum, c) => sum + c.getHappiness(), 0)

        this._happinessPoints = happinessSum

        this._resourcePoints = city.getResources().getMoney()

        this._buildingPoints = city.getBuildings().length * 5

        this._total =
            this._populationPoints +
            this._happinessPoints +
            this._resourcePoints +
            this._buildingPoints
    }
}