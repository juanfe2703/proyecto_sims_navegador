class Climate{
    constructor(city = "", temperature_c = 0, condition = "", humidity = 0, icon = "") {
        this.city = city;
        this.temperature_c = temperature_c;
        this.condition = condition;
        this.humidity = humidity;
        this.icon = icon;
    }

    // Getters
    getCity() { return this.city; }
    getTemperatureC() { return this.temperature_c; }
    getCondition() { return this.condition; }
    getHumidity() { return this.humidity; }
    getIcon() { return this.icon; }

    // Setters
    setCity(city) { this.city = city; }
    setTemperatureC(temperature_c) { this.temperature_c = temperature_c; }
    setCondition(condition) { this.condition = condition; }
    setHumidity(humidity) { this.humidity = humidity; }
    setIcon(icon) { this.icon = icon; }
    
}
