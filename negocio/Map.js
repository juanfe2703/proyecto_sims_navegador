/**
 * Módulo de generación del mapa.
 * - Lee la ciudad guardada en localStorage.
 * - Construye instancias de City/Grid.
 * - Renderiza la cuadrícula en el contenedor #id_city.
 */
document.addEventListener("DOMContentLoaded",function(){
    let City_datos = JSON.parse(localStorage.getItem("city"));
    let myCity = Creacion_city(City_datos);
    let gridElement = document.getElementById("id_city");
    let weather_content = document.getElementById("weather-info")

    setInterval(function(){
            myCity.ensureClimate()
                .then(() => Weather_print(myCity.getClimate()))
                .catch((error) => console.error("Error al actualizar el clima:", error));
    }, 5000); // Actualiza el clima cada 30 minutos (1800000 ms)

    function Weather_print(Climate_object) {
        weather_content.innerHTML = `<div class = "header p-50x">
            <h2 class = "city-name" >${Climate_object.getCity()}</h2>
            <img class = "weather-icon" src="${Climate_object.getIcon()}" alt="Weather Icon"></img>
            </div>
        <div class = "temperature">
            <span class = "temp-value">${Climate_object.getTemperatureC()}°C</span>
        </div>
        <div class = "details">
            <p class = "Condition">Condición: ${Climate_object.getCondition()}</p>
            <p class = "Humidity">Humedad: ${Climate_object.getHumidity()}%</p>
        </div>`;
        console.log("Clima actualizado en el panel");
    }
    /**
     * Genera el HTML de la cuadrícula y lo inserta en el contenedor.
     * Usa 2 bucles: primero recorre filas (y) y luego columnas (x).
     * Cada celda queda como: <div class="cell" data-x="..." data-y="..."></div>
     *
     * @param {number} width  Número de columnas del grid.
     * @param {number} height Número de filas del grid.
     */
    function Map_generation(width = myCity.getGrid().getWidth(), height = myCity.getGrid().getHeight()){        // Generar el contenido de la cuadrícula
        let Conten = "";
        gridElement.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        gridElement.style.gridTemplateRows = `repeat(${height}, 1fr)`;

        for(let position_y = 0; position_y < height; position_y++){
            for(let position_x = 0; position_x < width; position_x++){
                Conten += `<div class="cell" data-x="${position_x}" data-y="${position_y}"></div>`;
                myCity.getGrid().Add_position(Create_position(position_x, position_y));
            }
        }
        gridElement.innerHTML = Conten;
    }

    /**
     * Crea una celda del modelo (objeto Cell) y le asigna coordenadas.
     *
     * @param {number} x Coordenada X (columna).
     * @param {number} y Coordenada Y (fila).
     * @returns {Cell} Instancia de Cell con x/y seteadas.
     */
    function Create_position(x, y){
        myCell = new Cell();
        myCell.setX(x);
        myCell.setY(y)
        console.log(myCell);
        return myCell;   
    }
   
    Map_generation(myCity.getGrid().getWidth(), myCity.getGrid().getHeight());
    Weather_print(myCity.getClimate());
})

// Funcion para convertir los datos de la ciudad guardada en localStorage a una instancia de City
function Creacion_city(City_datos){
    let myCity = new City();
    myCity.setNameCity(City_datos._name_city);
    myCity.setNamePlayer(City_datos._name_player);
    myCity.setLocation(City_datos._location);

    let myGrid = new Grid();
    myGrid.setWidth(City_datos._grid._width);
    myGrid.setHeight(City_datos._grid._height);
    myCity.setGrid(myGrid);

    let myClimate = new Climate(
     City_datos._climate.city,
     City_datos._climate.temperature_c,
     City_datos._climate.condition,
     City_datos._climate.humidity,
     City_datos._climate.icon
    );

    let myNews = new News(
        City_datos._News._title,
        City_datos._News._summary,
        City_datos._News._link,
        City_datos._News._media
    )
    myCity.setNews(myNews);
    myCity.setClimate(myClimate);

    return myCity;
}

 /**
     * Crea una celda del modelo (objeto Cell) y le asigna coordenadas.
     *
     * @param {number} x Coordenada X (columna).
     * @param {number} y Coordenada Y (fila).
     * @returns {Cell} Instancia de Cell con x/y seteadas.
     */
function Create_position(x, y){
        myCell = new Cell();
        myCell.setX(x);
        myCell.setY(y)
        console.log(myCell);
        return myCell;   
}