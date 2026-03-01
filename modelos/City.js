//este seria el estado central del sistema

class City {
    constructor(name) {
        this._name = name
        this._buildings = []
        this._citizens = []
        this._resources = new Resources()
        this._score = null
        this._turn = 0
    }

    // Getters
    getName() { return this._name }
    getBuildings() { return this._buildings }
    getCitizens() { return this._citizens }
    getResources() { return this._resources }
    getScore() { return this._score }
    getTurn() { return this._turn }

    setScore(score) { this._score = score }

    incrementTurn() { this._turn++ }

    addBuilding(building) {
        this._buildings.push(building)
    }

    removeBuilding(building) {
        this._buildings = this._buildings.filter(b => b !== building)
    }

    addCitizen(citizen) {
        this._citizens.push(citizen)
    }
}