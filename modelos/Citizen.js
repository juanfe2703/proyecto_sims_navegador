//esta clase me sirve para manejar la info de los ciudadanos

class Citizen {
    constructor(id) {
        this._id = id
        this._happiness = 50
        this._hasJob = false
        this._hasHouse = false
        this._workplace = null
        this._residence = null
    }

    getId() { return this._id }
    getHappiness() { return this._happiness }
    hasJob() { return this._hasJob }
    hasHouse() { return this._hasHouse }

    setWorkplace(building) {
        this._workplace = building
        this._hasJob = building !== null
    }

    setResidence(building) {
        this._residence = building
        this._hasHouse = building !== null
    }

    // Recibe la ciudad para poder contar servicios y parques activos
    calculateHappiness(city) {
        let base = 50
 
        if (this._hasHouse) base += 20   // +20 por tener vivienda
        if (this._hasJob)   base += 15   // +15 por tener empleo 
 
        // Bonos por servicios publicos y parques (afectan a todos los ciudadanos)
        if (city) {
            city.getBuildings().forEach(b => {
                if (b instanceof ServiceBuilding) base += b.getHappinessBoost()
                if (b instanceof Park)            base += b.getHappinessBonus()
            })
        }
 
        // Clamp entre 0 y 100
        this._happiness = Math.max(0, Math.min(100, base))
    }
}