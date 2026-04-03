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

    //corregido este metodo para que no empiece la felicidad en 50 sino en cero como deberia ser
    // Recibe la ciudad para poder contar servicios y parques activos
    calculateHappiness(city) {
        let base = 0;
        if (this._hasHouse) base += 20;
        else base -= 20;           // penalización por no tener vivienda
        if (this._hasJob)   base += 15;
        else base -= 15;           // penalización por no tener empleo

        // Bonos por servicios publicos y parques
        if (city) {
            city.getBuildings().forEach(b => {
                if (b instanceof ServiceBuilding) base += b.getHappinessBoost();
                if (b instanceof Park) base += b.getHappinessBonus();
            });
        }

        // Clamp entre 0 y 100
        this._happiness = Math.max(0, Math.min(100, base));
    }
}