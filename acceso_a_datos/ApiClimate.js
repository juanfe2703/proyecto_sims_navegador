class ApiClimate{
    constructor(){
        this.baseUrl = "http://api.weatherapi.com/v1"; // definimos la URL base

    }

    getCurrentWeather(city) {
        return fetch(`${this.baseUrl}/current.json?key=4d7f8ba035e44669aa943645261303&q=${city}&lang=es`)
            .then(res => {
                if (!res.ok) throw new Error("Error retrieving weather data");
                return res.json();
            })
            .then(data => {

                // verificar si la API devolvió error
                if (data.error) {
                    throw new Error(data.error.message);
                }

                // validar que la ciudad esté en Colombia
                if (data.location.country !== "Colombia") {
                    throw new Error("La ciudad ingresada no pertenece a Colombia");
                }

                // retornar solo los datos que necesitas
                return {
                    city: data.location.name,
                    temperature_c: data.current.temp_c,
                    condition: data.current.condition.text,
                    humidity: data.current.humidity,
                    icon: data.current.condition.icon
                };
            })
            .catch(error => {
                console.error(error);
                return null;
            });
}
}