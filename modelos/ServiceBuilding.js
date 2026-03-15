class ServiceBuilding extends Building {
    constructor(id, name, cost, maintenanceCost, electricityConsumption, waterConsumption, radius, happinessBoost){
        super(id, name, cost, maintenanceCost, electricityConsumption, waterConsumption);
        this._radius = radius;
        this._happinessBoost = happinessBoost;
    }

    // Getters
    getRadius() { return this._radius; }
    getHappinessBoost() { return this._happinessBoost; }
 
    // Setters
    setRadius(radius) { this._radius = radius; }
    setHappinessBoost(happinessBoost) { this._happinessBoost = happinessBoost; }


    //only consume electricity (and water if is hospital)
    produce() {
        return new ResourceTransaction({
            electricity: -this._electricityConsumption,
            water: -this._waterConsumption
        });
    }
}