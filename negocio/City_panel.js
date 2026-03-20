/**
 * Lógica del panel de configuración de ciudad.
 * - Lee los inputs del formulario.
 * - Construye el Grid según la opción elegida.
 * - Crea la City y la persiste (loadCity) antes de redirigir a game.html.
 */
document.addEventListener("DOMContentLoaded",function(){
    let btnCreateCity = document.getElementById("btn-create-city");
    btnCreateCity.addEventListener("click", async function(){
        let Imput_name    = document.getElementById("city-name");
        let Imput_mayor   = document.getElementById("mayor-name");
        let Imput_location= document.getElementById("location");
        let Imput_mapSize = document.getElementById("map-size");

        if (Imput_name.value != "" && Imput_mayor.value != "" && Imput_location.value != "") {
            if(Imput_mapSize.value == "3" || Imput_mapSize.value == ""){
                alert("Seleccione un tamaño de mapa valido");
            } else {
                let mapSize = createMape(Imput_mapSize);
                let myCity  = await createCity(Imput_name, Imput_mayor, Imput_location, mapSize);
                if(myCity){
                    if (typeof window.loadCity === "function") {
                        window.loadCity(myCity);
                    } else {
                        console.warn("No se encontró window.loadCity().");
                    }
                    window.location.href = "game.html";
                }
            }
        } else {
            alert("Complete todos los datos para crear la ciudad");
        }
    });

    function createMape(Option) {
        let myGrid = new Grid();
        if(Option.value == "1"){
            myGrid.setWidth(15);
            myGrid.setHeight(15);
        } else {
            myGrid.setWidth(30);
            myGrid.setHeight(30);
        }
        return myGrid;
    }

    async function createCity(name_city, name_player, location, mapSize) {
        let myCity = new City();
        try {
            myCity.setNameCity(name_city.value);
            myCity.setNamePlayer(name_player.value);
            myCity.setLocation(location.value);
            myCity.setGrid(mapSize);

            // Recursos iniciales segun el taller
            myCity.setResources(new Resources(50000, 0, 0, 0));
            myCity.setTurn(0);
            myCity.setScore(new Score());

            // Clima (opcional - puede fallar sin bloquear)
            try { await myCity.ensureClimate(); }
            catch(e) { console.warn("Clima no disponible:", e.message); }

            // Noticias (opcional - puede fallar sin bloquear)
            try { await myCity.ensureNews(); }
            catch(e) { console.warn("Noticias no disponibles:", e.message); }

            alert("Ciudad creada exitosamente");
            return myCity;
        } catch(error) {
            alert("Error al crear la ciudad: " + error.message);
            console.error(error.message);
            return null;
        }
    }
});
