class Park extends Building{
    constructor(){
        this._happinessBonus = happinessBonus;
        super();
    }

    // Getters
    getHappinessBonus() { return this._happinessBonus; }

    // Setters
    setHappinessBonus(happinessBonus) { this._happinessBonus = happinessBonus; }
}