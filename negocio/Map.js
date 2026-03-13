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

    // Reconstruye Climate si venía persistido en localStorage
    if (City_datos._climate) {
        const climateData = City_datos._climate;
        const climate = new Climate(
            climateData.city ?? climateData.ciudad,
            climateData.country ?? climateData.pais,
            climateData.temperature_c ?? climateData.temperatura_c,
            climateData.condition ?? climateData.condicion,
            climateData.humidity ?? climateData.humedad,
            climateData.icon ?? climateData.icono
        );
        myCity.setClimate(climate);
    }

    return myCity;
}


