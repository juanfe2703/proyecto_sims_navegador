class IndustrialBuilding extends Building{
    constructor(id, name, cost, maintenanceCost, electricityConsumption, waterConsumption, jobs, productionType, producionAmount){
        super(id, name, cost, maintenanceCost, electricityConsumption, waterConsumption);
        this._jobs = jobs;
        this._productionType = productionType;
        this._employees = [];
        this._producionAmount = producionAmount;
    }

    // Getters
    getJobs() { return this._jobs; }
    getProductionType() { return this._productionType; }
    getEmployees() { return this._employees; }
    getProducionAmount() { return this._producionAmount; }
 
    // Setters
    setJobs(jobs) { this._jobs = jobs; }
    setProductionType(productionType) { this._productionType = productionType; }
    setEmployees(employees) { this._employees = employees; }
    setProducionAmount(producionAmount) { this._producionAmount = producionAmount; }

    // Helpers for CitizenService
    hasVacancy() {
        return this._employees.length < this._jobs;
    }
 
    addWorker(citizen) {
        if (this.hasVacancy()) {
            this._employees.push(citizen);
        }
    }
 
    removeWorker(citizen) {
        this._employees = this._employees.filter(e => e !== citizen);
    }

    //generate money or food depend the building type 
    //productionType: "money" (fábrica) o "food" (granja)
    //corregido el metodo produce porque no reducia la produccion al 50% cuando faltaban recursos, siempre producia al 100%
    produce(city) {
    let factor = 1;
    if (city) {
        const r = city.getResources();
        const needsWater = this._waterConsumption > 0 && r.getWater() <= 0;
        const needsElec  = this._electricityConsumption > 0 && r.getElectricity() <= 0;
        if (needsWater || needsElec) factor = 0.5;
    }
    if (this._productionType === "food") {
        return new ResourceTransaction({
            food:  Math.floor(this._producionAmount * factor),
            water: -this._waterConsumption,
            electricity: -this._electricityConsumption
        });
    } else {
        return new ResourceTransaction({
            money: Math.floor(this._producionAmount * factor),
            electricity: -this._electricityConsumption,
            water: -this._waterConsumption
        });
    }
}
}