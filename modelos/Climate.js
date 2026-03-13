class Climate{
    constructor(city, country, temperature_c, condition, humidity, icon) {
        this.city = city;
        this.country = country;
        this.temperature_c = temperature_c;
        this.condition = condition;
        this.humidity = humidity;
        this.icon = icon;
    }

    // Getters
    getCity() { return this.city; }
    getCountry() { return this.country; }
    getTemperatureC() { return this.temperature_c; }
    getCondition() { return this.condition; }
    getHumidity() { return this.humidity; }
    getIcon() { return this.icon; }

    // Setters
    setCity(city) { this.city = city; }
    setCountry(country) { this.country = country; }
    setTemperatureC(temperature_c) { this.temperature_c = temperature_c; }
    setCondition(condition) { this.condition = condition; }
    setHumidity(humidity) { this.humidity = humidity; }
    setIcon(icon) { this.icon = icon; }
}
