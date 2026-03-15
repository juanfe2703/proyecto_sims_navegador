//aqui va el puntaje 
 
class Score {
    constructor() {
        this._total            = 0
        this._populationPoints = 0
        this._happinessPoints  = 0
        this._resourcePoints   = 0
        this._buildingPoints   = 0
        this._electricityPoints= 0
        this._waterPoints      = 0
        this._bonuses          = 0
        this._penalties        = 0
    }

    getTotal()             { return this._total }
    getPopulationPoints()  { return this._populationPoints }
    getHappinessPoints()   { return this._happinessPoints }
    getResourcePoints()    { return this._resourcePoints }
    getBuildingPoints()    { return this._buildingPoints }
    getElectricityPoints() { return this._electricityPoints }
    getWaterPoints()       { return this._waterPoints }
    getBonuses()           { return this._bonuses }
    getPenalties()         { return this._penalties }


    calculate(city) {
        const citizens   = city.getCitizens()
        const resources  = city.getResources()
        const buildings  = city.getBuildings()
 
        const population    = citizens.length
        const avgHappiness  = population > 0
            ? citizens.reduce((sum, c) => sum + c.getHappiness(), 0) / population
            : 0
        const money         = resources.getMoney()
        const electricity   = resources.getElectricity()
        const water         = resources.getWater()
 
        // ── Base Point ──────────────────────────────────────────────────────
        // score = (población×10) + (felicidad_avg×5) + (dinero÷100)
        //       + (edificios×50) + (electricidad×2) + (agua×2)
        this._populationPoints  = population * 10
        this._happinessPoints   = Math.floor(avgHappiness * 5)
        this._resourcePoints    = Math.floor(money / 100)
        this._buildingPoints    = buildings.length * 50
        this._electricityPoints = electricity * 2
        this._waterPoints       = water * 2
 
        // ── Bonifications ───────────────────────────────────────────────────
        this._bonuses = 0
 
        // all citizens are employed: +500
        const allEmployed = population > 0 && citizens.every(c => c.hasJob())
        if (allEmployed) this._bonuses += 500
 
        // average happines > 80: +300
        if (avgHappiness > 80) this._bonuses += 300
 
        // all of resources are positives: +200
        if (money > 0 && electricity > 0 && water > 0) this._bonuses += 200
 
        //city with 1000 citizens or more: +1000
        if (population > 1000) this._bonuses += 1000
 
        // ── Debuffs ───────────────────────────────────────────────────
        this._penalties = 0
 
        // Negative Money: -500
        if (money < 0) this._penalties += 500
 
        // Negative electricity: -300
        if (electricity < 0) this._penalties += 300
 
        // negative water: -300
        if (water < 0) this._penalties += 300
 
        // average happines < 40: -400
        if (avgHappiness < 40) this._penalties += 400
 
        // per any unemployed citizen: -10
        const unemployed = citizens.filter(c => !c.hasJob()).length
        this._penalties += unemployed * 10
 
        // ── total ────────────────────────────────────────────────────────────
        this._total =
            this._populationPoints +
            this._happinessPoints  +
            this._resourcePoints   +
            this._buildingPoints   +
            this._electricityPoints+
            this._waterPoints      +
            this._bonuses          -
            this._penalties
    }
}