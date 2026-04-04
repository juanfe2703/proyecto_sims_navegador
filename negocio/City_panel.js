/**
 * Lógica del panel de configuración de ciudad.
 * - Lee los inputs del formulario.
 * - Construye el Grid según la opción elegida.
 * - Crea la City y la persiste (loadCity) antes de redirigir a game.html.
 */
document.addEventListener("DOMContentLoaded",function(){
    // Cargar ciudades desde api-colombia
    fetch("https://api-colombia.com/api/v1/City")
        .then(r => r.json())
        .then(cities => {
            const select = document.getElementById("location");

            // Limpiar opciones
            select.innerHTML = '<option value="">Seleccione una ciudad</option>';

            cities.forEach(city => {
                const opt = document.createElement("option");
                opt.value = city.name;
                opt.textContent = city.name;
                select.appendChild(opt);
            });
        })
        .catch(() => console.warn("No se pudo cargar la lista de ciudades colombianas"));

    const MODAL_TRANSITION_MS = 300;

    function openOverlayModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.remove("show");
        modalEl.hidden = false;
        // Forzar un frame para que la transición ocurra (opacity 0 -> 1, scale 0.9 -> 1)
        requestAnimationFrame(() => modalEl.classList.add("show"));
    }

    function closeOverlayModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.remove("show");
        window.setTimeout(() => {
            modalEl.hidden = true;
        }, MODAL_TRANSITION_MS);
    }

    function clearGameOverSession() {
        try { sessionStorage.removeItem("gameOverActive"); } catch {}
        try { sessionStorage.removeItem("gameOverReason"); } catch {}
        try { localStorage.removeItem("gameOverActive"); } catch {}
        try { localStorage.removeItem("gameOverReason"); } catch {}
    }

    // Si hay partida guardada, ofrecer cargar o crear una nueva
    try {
        const modal = document.getElementById("Load_new_modal");
        const savedCity = (typeof loadCityFromStorage === "function") ? loadCityFromStorage() : null;
        if (modal && savedCity) {
            openOverlayModal(modal);

            const btnLoad = document.getElementById("btn-load-game");
            const btnNew  = document.getElementById("btn-new-game");

            if (btnLoad) {
                btnLoad.addEventListener("click", function(){
                    window.location.href = "game.html";
                });
            }

            if (btnNew) {
                btnNew.addEventListener("click", function(){
                    try { if (typeof deleteSavedCity === "function") deleteSavedCity(); } catch {}
                    clearGameOverSession();
                    closeOverlayModal(modal);
                });
            }
        }
    } catch {}

    document.getElementById("btn-load-map").addEventListener("click", () => {
        document.getElementById("file-map-input").click();
    });

    document.getElementById("file-map-input").addEventListener("change", function() {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const lines = e.target.result.trim().split("\n");
                const height = lines.length;
                const width  = lines[0].trim().split(/\s+/).length;

                if (width < 15 || width > 30 || height < 15 || height > 30) {
                    alert("El mapa debe tener entre 15x15 y 30x30 celdas.");
                    return;
                }

                const grid = new Grid();
                grid.setWidth(width);
                grid.setHeight(height);

                const typeMap = {
                    "R1":"house","R2":"apartment",
                    "C1":"shop","C2":"mall",
                    "I1":"factory","I2":"farm",
                    "S1":"police","S2":"fire","S3":"hospital",
                    "U1":"electric_plant","U2":"water_plant",
                    "P1":"park"
                };

                const bs = new BuildingService();
                const tempCity = new City();
                tempCity.setGrid(grid);
                tempCity.setResources(new Resources(50000, 0, 0, 0));
                tempCity.setScore(new Score());

                lines.forEach((line, y) => {
                    line.trim().split(/\s+/).forEach((token, x) => {
                        const cell = new Cell(x, y, "empty");
                        grid.Add_position(cell);
                        if (token === "r") {
                            cell.setRoad(new Road(100));
                            cell.setType("road");
                            tempCity.getResources().setMoney(
                                tempCity.getResources().getMoney() - 100
                            );
                        } else if (typeMap[token]) {
                            // Se omite la validación de vía adyacente al cargar mapa
                            const id = tempCity.getBuildings().length + 1;
                            const building = bs._createBuilding(id, typeMap[token]);
                            if (building) {
                                cell.setBuilding(building);
                                cell.setType(typeMap[token]);
                                tempCity.getResources().setMoney(
                                    tempCity.getResources().getMoney() - building.getCost()
                                );
                                tempCity.addBuilding(building);
                            }
                        }
                    });
                });

                // Guardar el grid cargado en sessionStorage para recuperarlo
                // en createCity() después de llenar el formulario
                sessionStorage.setItem("preloadedGrid", JSON.stringify({
                    width, height,
                    // solo guardamos el tipo de celda para reconstruir
                    cells: grid.getCell().map(c => ({ x: c.getX(), y: c.getY(), type: c.getType() }))
                }));
                alert(`Mapa cargado: ${width}x${height}. Ahora completa los datos y crea la ciudad.`);
                document.getElementById("map-size").value = width; // actualizar el input
            } catch(err) {
                alert("Error al leer el archivo: " + err.message);
            }
        };
        reader.readAsText(file);
    });

    let btnCreateCity = document.getElementById("btn-create-city");
    btnCreateCity.addEventListener("click", async function(){
        let Imput_name    = document.getElementById("city-name");
        let Imput_mayor   = document.getElementById("mayor-name");
        let Imput_location= document.getElementById("location");
        let Imput_mapSize = document.getElementById("map-size");

        if (Imput_name.value != "" && Imput_mayor.value != "" && Imput_location.value != "") {
            //actualizacion para que no reciba un numero estatico
            if (Imput_mapSize.value == "" || isNaN(parseInt(Imput_mapSize.value))) {
                alert("Seleccione un tamaño de mapa válido (15-30)");
            } else {
                let mapSize = createMape(Imput_mapSize);
                let myCity  = await createCity(Imput_name, Imput_mayor, Imput_location, mapSize);
                if(myCity){
                    let savedOk = false;
                    try {
                        if (typeof loadCity === "function") { loadCity(myCity); savedOk = true; }
                        else if (typeof saveCity === "function") { saveCity(myCity); savedOk = true; }
                        else console.warn("No se encontró loadCity() ni saveCity().");
                    } catch (e) {
                        console.warn("No se pudo guardar la ciudad:", e);
                    }

                    if (savedOk) {
                        clearGameOverSession();
                        window.location.href = "game.html";
                    }
                    else alert("No se pudo guardar la ciudad. Revisa StorageService.js");
                }
            }
        } else {
            alert("Complete todos los datos para crear la ciudad");
        }
    });

    //actualizacion para que el mapa pueda ser de 15 a 30 y no de solo 15 o 30
    function createMape(input) {
        const size = Math.max(15, Math.min(30, parseInt(input.value) || 20));

        let myGrid = new Grid();
        myGrid.setWidth(size);
        myGrid.setHeight(size);

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

            // Clima (obligatorio): valida que la ubicación pertenezca a Colombia
            await myCity.ensureClimate();

            // Noticias (opcional - puede fallar sin bloquear)
            try { await myCity.ensureNews(); }
            catch(e) {
                if (e && e.message === "Ciudad no valida") throw e;
                console.warn("Noticias no disponibles:", e.message);
            }

            alert("Ciudad creada exitosamente");
            return myCity;
        } catch(error) {
            alert("Error al crear la ciudad: " + error.message);
            console.error(error.message);
            return null;
        }
    }
});
