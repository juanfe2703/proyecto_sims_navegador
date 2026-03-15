class ResidentialBuilding extends Building {
    constructor(id, name, cost, maintenanceCost, electricityConsumption, waterConsumption, capacity){
        super(id, name, cost, maintenanceCost, electricityConsumption, waterConsumption);
        this._capacity = capacity;
        this._citizens = [];
    }

    // Getters
    getCapacity() { return this._capacity; }
    getCitizens() { return this._citizens; }
 
    // Setters
    setCapacity(capacity) { this._capacity = capacity; }
    setCitizens(citizens) { this._citizens = citizens; }
}