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
    produce() {
        if (this._productionType === "food") {
            // Granja: produce food and consume water 
            return new ResourceTransaction({
                food: this._producionAmount,
                water: -this._waterConsumption,
                electricity: -this._electricityConsumption
            });
        } else {
            // Fábrica: produce money, consume water and electrucity
            return new ResourceTransaction({
                money: this._producionAmount,
                electricity: -this._electricityConsumption,
                water: -this._waterConsumption
            });
        }
    }
}