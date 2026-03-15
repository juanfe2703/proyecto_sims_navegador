class Park extends Building{
    constructor(id, name, cost, maintenanceCost, happinessBonus){
        super(id, name, cost, maintenanceCost, 0, 0);
        this._happinessBonus = happinessBonus;
    }

    // Getters
    getHappinessBonus() { return this._happinessBonus; }
 
    // Setters
    setHappinessBonus(happinessBonus) { this._happinessBonus = happinessBonus; }
}