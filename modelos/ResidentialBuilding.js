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



    // Produce: only consumption, no generate anything 
    produce() {
        return new ResourceTransaction({
            electricity: -this._electricityConsumption,
            water: -this._waterConsumption
        });
    }


    // Helpers For CitizenService------------------------------------------------------------------------------
    hasSpace() {
        return this._citizens.length < this._capacity;
    }
 
    addResident(citizen) {
        if (this.hasSpace()) {
            this._citizens.push(citizen);
        }
    }
 
    removeResident(citizen) {
        this._citizens = this._citizens.filter(c => c !== citizen);
    }
}