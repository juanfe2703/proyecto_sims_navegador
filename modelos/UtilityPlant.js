class UtilityPlant extends Building{
    constructor(id, name, cost, maintenanceCost, electricityConsumption, waterConsumption, productionType, productionAmount){
        super(id, name, cost, maintenanceCost, electricityConsumption, waterConsumption);
        this._productionType = productionType;
        this._productionAmount = productionAmount;
    }

    // Getters
    getProductionType() { return this._productionType; }
    getProductionAmount() { return this._productionAmount; }
 
    // Setters
    setProductionType(productionType) { this._productionType = productionType; }
    setProductionAmount(productionAmount) { this._productionAmount = productionAmount; }
}