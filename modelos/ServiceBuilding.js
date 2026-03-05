class ServiceBuilding extends Building {
    constructor(){
        super();
        this._radius = radius;
        this._happinessBoost = happinessBoost;
    }

    // Getters
    getRadius() { return this._radius; }
    getHappinessBoost() { return this._happinessBoost; }

    // Setters
    setRadius(radius) { this._radius = radius; }
    setHappinessBoost(happinessBoost) { this._happinessBoost = happinessBoost; }
}