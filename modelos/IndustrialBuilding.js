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
}