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
 
}