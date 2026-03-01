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

    calculateHappiness() {
        let base = 50

        if (this._hasHouse) base += 20
        if (this._hasJob) base += 20

        this._happiness = base
    }
}