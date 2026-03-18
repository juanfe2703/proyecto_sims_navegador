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
    let news_content = document.getElementById("news")

    setInterval(function(){
            myCity.ensureClimate()
                .then(() => Weather_print(myCity.getClimate()))
                .catch((error) => console.error("Error al actualizar el clima:", error));

            myCity.ensureNews()
                .then(() => News_print(myCity.getNews()))
                .catch((error) => console.error("Error al actualizar las noticias:", error));
    }, 1800000); // Actualiza clima y noticias cada 30 minutos (1800000 ms)

    function Weather_print(Climate_object) {
        weather_content.innerHTML = `<div id="weather-content">
            <div class = "header p-50x">
                <h3 id="CityName" class = "city-name" >${Climate_object.getCity()}</h3>
                <img id="Icon" class = "weather-icon" src="${Climate_object.getIcon()}" alt="Weather Icon"></img>
            </div>
            <div class = "temperature">
                <span id="TempValue" class = "temp-value">${Climate_object.getTemperatureC()}°C</span>
            </div>
            <div class = "details">
                <p id="Condition" class = "Condition">Condición: ${Climate_object.getCondition()}</p>
                <p id="Humidity" class = "Humidity">Humedad: ${Climate_object.getHumidity()}%</p>
            </div>
        </div>`;
        console.log("Clima actualizado en el panel");
    }

    function News_print(News_object) {
        let cont = "";

        if (!News_object) {
            news_content.innerHTML = cont;
            return;
        }

        News_object.forEach(new_current => {
            cont += `<div class="news-item">
                        <div class="image-container">
                            <img class="news-image" src="${new_current.getMedia()}" alt="News Image">
                        </div>
                        <div class="Text-container">
                            <h3 class="news-title">${new_current.getTitle()}</h3>
                            <p class="news-description">${new_current.getSummary()}</p>
                            <a href="${new_current.getLink()}" target="_blank">Leer más</a>
                        </div>
                    </div>`;
        });

        news_content.innerHTML = cont;
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
    News_print(myCity.getNews());
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

    // Reconstruir News desde JSON (o desde estructura cruda del API si aplica)
    let news_list = null;
    if (City_datos._News) {
        news_list = [];
        City_datos._News.forEach(_new_current => {
            const _title = _new_current._title;
            const _summary = _new_current._summary;
            const _link = _new_current._link;
            const _media = _new_current._media;
            news_list.push(new News(_title, _summary, _link, _media));
        });
    }
    myCity.setNews(news_list);
    console.log(myCity.getNews())
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