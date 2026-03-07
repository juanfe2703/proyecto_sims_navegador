/**
 * Lógica del panel de configuración de ciudad.
 * - Lee los inputs del formulario.
 * - Construye el Grid según la opción elegida.
 * - Crea la City y la persiste (loadCity) antes de redirigir a game.html.
 */
document.addEventListener("DOMContentLoaded",function(){
    let btnCreateCity = document.getElementById("btn-create-city");
    btnCreateCity.addEventListener("click",function(){
        // Captura de elementos del DOM (inputs/select)
        let Imput_name = document.getElementById("city-name");
        let Imput_mayor = document.getElementById("mayor-name");
        let Imput_location = document.getElementById("location");
        let Imput_mapSize = document.getElementById("map-size");

        // Construye el Grid a partir de la opción seleccionada (15x15 o 30x30)
        let mapSize = createMape(Imput_mapSize);

        // Crea el objeto City con los datos ingresados
        let myCity = createCity(Imput_name,Imput_mayor,Imput_location, mapSize);
        if (myCity) {
            // Guarda/persiste la ciudad (función definida en StorageService.js)
            loadCity(myCity);

            // Navega a la vista del juego (misma carpeta de vistas)
            window.location.href = "game.html";
        }
    })



    /**
     * Crea un Grid con ancho/alto según la opción del <select>.
     *
     * @param {HTMLSelectElement} Option Select donde value indica el tamaño.
     * @returns {Grid|undefined} Grid configurado o undefined si falla la validación.
     */
    function createMape(Option) {
        let myGrid = new Grid();
        try{
            if(Option.value == "1"){
                myGrid.setWidth(15);
                myGrid.setHeight(15);
                return myGrid;
            }else if(Option.value == "2"){
                myGrid.setWidth(30);
                myGrid.setHeight(30);
                return myGrid;
            }else{
                alert("No se selecciono un tamaño de mapa valido");
                throw new Error("No se selecciono un tamaño de mapa valido");
            }
        }catch(error){
            console.error(error.message);
        }
    }

    /**
     * Crea una City a partir de los inputs del formulario y el Grid.
     * Valida que los campos no estén vacíos.
     *
     * @param {HTMLInputElement} name_city  Input del nombre de la ciudad.
     * @param {HTMLInputElement} name_player Input del nombre del alcalde/jugador.
     * @param {HTMLInputElement} location Input de ubicación.
     * @param {Grid} mapSize Grid previamente configurado.
     * @returns {City|undefined} City creada o undefined si hay error/validación.
     */
    function createCity(name_city, name_player, location, mapSize) {
        try{
            if(name_city.value == "" || name_player.value == "" || location.value == ""){
                alert("Todos los campos deben ser llenados");
                throw new Error("Todos los campos deben ser llenados");
            }else{
                let myCity = new City();
                myCity.setNameCity(name_city.value);
                myCity.setNamePlayer(name_player.value);
                myCity.setLocation(location.value);
                myCity.setGrid(mapSize);
                alert("Ciudad creada exitosamente");
                return myCity;
            }
        }catch(error){
            console.error(error.message);
        }
    }
})

