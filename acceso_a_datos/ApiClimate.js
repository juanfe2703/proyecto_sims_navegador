class ApiClimate{
    constructor(){
        this.baseUrl = "http://api.weatherapi.com/v1"; // definimos la URL base

    }
    

    getCurrentWeather(city) {
    return fetch(`${this.baseUrl}/current.json?key=4d7f8ba035e44669aa943645261303&q=${city}`)
        .then(res => {
            if (!res.ok) throw new Error("Error retrieving weather data");
            return res.json();
        })
        .then(data => {
            return {
                city: data.location.name,
                country: data.location.country,
                temperature_c: data.current.temp_c,
                condition: data.current.condition.text,
                humidity: data.current.humidity,
                icon: data.current.condition.icon
            };
        })
        .catch(error => {
            console.error(error);
            return null; // if it fails, return null
        });
}
}