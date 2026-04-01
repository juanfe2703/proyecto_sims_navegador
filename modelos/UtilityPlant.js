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

    //generate water or electricity depend of type 
    //productionType: "electricity" (planta eléctrica) o "water" (planta de agua)
    produce() {
        if (this._productionType === "electricity") {
            // Planta eléctrica: produce electricity, without any consume
            return new ResourceTransaction({
                electricity: this._productionAmount
            });
        } else {
            // Planta de agua: produce water, consume electricity
            return new ResourceTransaction({
                water: this._productionAmount,
                electricity: -this._electricityConsumption
            });
        }
    }
}