class Building {
    constructor(id, name, cost, maintenanceCost, electricityConsumption, waterConsumption){
        this._id = id;
        this._name = name;
        this._cost = cost;
        this._maintenanceCost = maintenanceCost;
        this._electricityConsumption = electricityConsumption;
        this._waterConsumption = waterConsumption;
    }


    // Getters
    getId() { return this._id; }
    getName() { return this._name; }
    getCost() { return this._cost; }
    getMaintenanceCost() { return this._maintenanceCost; }
    getElectricityConsumption() { return this._electricityConsumption; }
    getWaterConsumption() { return this._waterConsumption; }

    // Setters
    setId(id) { this._id = id; }
    setName(name) { this._name = name; }
    setCost(cost) { this._cost = cost; }
    setMaintenanceCost(maintenanceCost) { this._maintenanceCost = maintenanceCost; }
    setElectricityConsumption(electricityConsumption) { this._electricityConsumption = electricityConsumption; }
    setWaterConsumption(waterConsumption) { this._waterConsumption = waterConsumption; }
}