/**
 * Lógica del panel de configuración de ciudad.
 * - Lee los inputs del formulario.
 * - Construye el Grid según la opción elegida.
 * - Crea la City y la persiste (loadCity) antes de redirigir a game.html.
 */
document.addEventListener("DOMContentLoaded",function(){
    let btnCreateCity = document.getElementById("btn-create-city");
    btnCreateCity.addEventListener("click", async function(){
        // Captura de elementos del DOM (inputs/select)
        let Imput_name = document.getElementById("city-name");
        let Imput_mayor = document.getElementById("mayor-name");
        let Imput_location = document.getElementById("location");
        let Imput_mapSize = document.getElementById("map-size");
        
        //Valida los campos del formulario (no vacíos) antes de crear la ciudad y el mapa
        if (Imput_name.value != "" && Imput_mayor.value != "" && Imput_location.value != "") {
            // Valida que se haya seleccionado un tamaño de mapa válido (no "Seleccione")
            if(Imput_mapSize.value == "3"){
                alert("Seleccione un tamaño de mapa valido");
            }else{
                // Construye el Grid a partir de la opción seleccionada (15x15 o 30x30)
                let mapSize = createMape(Imput_mapSize);
                 // Crea el objeto City con los datos ingresados
                let myCity = await createCity(Imput_name,Imput_mayor,Imput_location, mapSize);
                // Valida que la ciudad se haya creado correctamente antes de persistirla y redirigir
                if(myCity){
                    console.log("Ciudad creada con exito" + myCity);
                    // Guarda/persiste la ciudad (función definida en StorageService.js)
                    // Importante: NO usar un método local llamado "loadCity" porque pisa el global.
                    if (typeof window.loadCity === "function") {
                        window.loadCity(myCity);
                    } else {
                        console.warn("No se encontró window.loadCity(). Verifica que StorageService.js esté cargado.");
                    }
                    // Navega a la vista del juego (misma carpeta de vistas)
                    window.location.href = "game.html";
                }
            } 
            
        }else{
            alert("Complete todos los datos para crear la ciudad");
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
        if(Option.value == "1"){
            myGrid.setWidth(15);
            myGrid.setHeight(15);
            return myGrid;
        }else if(Option.value == "2"){
            myGrid.setWidth(30);
            myGrid.setHeight(30);
            return myGrid;
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
    async function createCity(name_city, name_player, location, mapSize) {
        let myCity = new City();
        try{

            myCity.setNameCity(name_city.value);
            myCity.setNamePlayer(name_player.value);
            myCity.setLocation(location.value);
            myCity.setGrid(mapSize);

            // Resuelve la promesa del clima y deja la ciudad lista para usar más adelante
            await myCity.ensureClimate();
            await myCity.ensureNews();
            
            alert("Ciudad creada exitosamente");
            console.log("Ciudad creada con exito" + myCity);
            return myCity;
        }catch(error){
            alert("Error al crear la ciudad: " + error.message);
            console.error(error.message);
        }
    }



    

});

