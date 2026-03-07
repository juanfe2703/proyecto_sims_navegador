/**
 * Módulo de generación del mapa.
 * - Lee la ciudad guardada en localStorage.
 * - Construye instancias de City/Grid.
 * - Renderiza la cuadrícula en el contenedor #id_city.
 */
document.addEventListener("DOMContentLoaded",function(){
    let City_datos = JSON.parse(localStorage.getItem("city"));
    let myCity = new City();
    myCity.setNameCity(City_datos._name_city);
    myCity.setNamePlayer(City_datos._name_player);
    myCity.setLocation(City_datos._location);
    myCity.setGrid(City_datos._grid);

    let myGrid = new Grid();
    myGrid.setWidth(City_datos._grid._width);
    myGrid.setHeight(City_datos._grid._height);

    /**
     * Genera el HTML de la cuadrícula y lo inserta en el contenedor.
     * Usa 2 bucles: primero recorre filas (y) y luego columnas (x).
     * Cada celda queda como: <div class="cell" data-x="..." data-y="..."></div>
     *
     * @param {number} width  Número de columnas del grid.
     * @param {number} height Número de filas del grid.
     */
    function Map_generation(width = myGrid.getWidth(), height = myGrid.getHeight()){
        let gridElement = document.getElementById("id_city");
        // Generar el contenido de la cuadrícula
        let Conten = "";

        for(let position_y = 0; position_y < height; position_y++){
            for(let position_x = 0; position_x < width; position_x++){
                Conten += `<div class="cell" data-x="${position_x}" data-y="${position_y}"></div>`;
                myGrid.Add_position(Create_position(position_x, position_y));
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
   

    Map_generation();
})