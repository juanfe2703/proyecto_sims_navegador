class CommercialBuilding extends Building {
    constructor(id, name, cost, maintenanceCost, electricityConsumption, waterConsumption, jobs, incomePerTurn) {
        super(id, name, cost, maintenanceCost, electricityConsumption, waterConsumption);
        this._jobs = jobs;
        this._employees = [];
        this._incomePerTurn = incomePerTurn;
    }

    // Getters
    getJobs() { return this._jobs; }
    getEmployees() { return this._employees; }
    getIncomePerTurn() { return this._incomePerTurn; }
 
    // Setters
    setJobs(jobs) { this._jobs = jobs; }
    setEmployees(employees) { this._employees = employees; }
    setIncomePerTurn(incomePerTurn) { this._incomePerTurn = incomePerTurn; }

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

    //this method generate increases if there's electricity
    //if electricityConsumption > 0 but there's no electricity, it not work 
    produce() {
        return new ResourceTransaction({
            money: this._incomePerTurn,
            electricity: -this._electricityConsumption,
            water: -this._waterConsumption
        });
    }
 
}