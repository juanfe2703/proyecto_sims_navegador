// ─── Save ─────────────────────────────────────────────────────────────────

function saveCity(city) {
    localStorage.setItem("city", JSON.stringify(city));
}

// Alias usado en City_panel.js
function loadCity(city) {
    saveCity(city);
}

// ─── Load ─────────────────────────────────────────────────────────────────

/**
 * Lee el JSON del localStorage y reconstruye todas las instancias de objetos.
 * Retorna una instancia de City lista para usar, o null si no hay partida.
 * Maneja de forma segura datos nulos o partidas guardadas con versiones anteriores.
 */
function loadCityFromStorage() {
    const raw = localStorage.getItem("city");
    if (!raw) return null;

    let data;
    try {
        data = JSON.parse(raw);
    } catch(e) {
        console.error("Error al parsear la ciudad del localStorage:", e);
        return null;
    }

    try {
        const city = new City();

        // ── Datos basicos ────────────────────────────────────────────────────
        city.setNameCity(data._name_city   || "Ciudad");
        city.setNamePlayer(data._name_player || "Alcalde");
        city.setLocation(data._location    || "");
        city.setTurn(data._turn            || 0);

        // ── Grid y celdas ────────────────────────────────────────────────────
        const grid = new Grid();
        grid.setWidth( data._grid._width);
        grid.setHeight(data._grid._height);

        const cells = data._grid._cell || [];
        cells.forEach(cellData => {
            const cell = new Cell(cellData._x, cellData._y, cellData._type || "empty");

            if (cellData._building) {
                const building = _deserializeBuilding(cellData._building, cellData._type);
                if (building) {
                    cell.setBuilding(building);
                    city.addBuilding(building);
                }
            }

            if (cellData._road) {
                cell.setRoad(new Road(cellData._road._cost || 100));
            }

            grid.Add_position(cell);
        });

        city.setGrid(grid);

        // ── Recursos ─────────────────────────────────────────────────────────
        const r = data._resources;
        if (r) {
            city.setResources(new Resources(
                r._money       || 50000,
                r._electricity || 0,
                r._water       || 0,
                r._food        || 0
            ));
        } else {
            // Partida guardada sin recursos (version antigua) - valores iniciales
            city.setResources(new Resources(50000, 0, 0, 0));
        }

        // ── Ciudadanos ───────────────────────────────────────────────────────
        const citizens = data._citizens || [];
        citizens.forEach(cData => {
            const citizen = new Citizen(cData._id);
            citizen._happiness = cData._happiness || 50;
            city.addCitizen(citizen);
        });

        // ── Score ────────────────────────────────────────────────────────────
        const score = new Score();
        score.calculate(city);
        city.setScore(score);

        // ── Clima (opcional) ─────────────────────────────────────────────────
        const c = data._climate;
        if (c) {
            try {
                city.setClimate(new Climate(
                    c.city            || c._city            || "",
                    c.temperature_c   || c._temperature_c   || 0,
                    c.condition       || c._condition       || "",
                    c.humidity        || c._humidity        || 0,
                    c.icon            || c._icon            || ""
                ));
            } catch(e) {
                console.warn("No se pudo restaurar el clima:", e.message);
            }
        }

        // ── Noticias (opcional) ──────────────────────────────────────────────
        const newsList = data._News || data._news;
        if (newsList && Array.isArray(newsList)) {
            const rebuilt = newsList.map(n => new News(
                n._title   || n.title   || "",
                n._summary || n.summary || "",
                n._link    || n.link    || "",
                n._media   || n.media   || ""
            ));
            city.setNews(rebuilt);
        }

        return city;

    } catch(e) {
        console.error("Error al reconstruir la ciudad:", e);
        return null;
    }
}

function hasSavedCity() {
    return localStorage.getItem("city") !== null;
}

function deleteSavedCity() {
    localStorage.removeItem("city");
}

// ─── Deserializacion de edificios ────────────────────────────────────────────

function _deserializeBuilding(b, type) {
    try {
        switch (type) {
            case "house":
            case "apartment":
                return new ResidentialBuilding(b._id, b._name, b._cost, b._maintenanceCost,
                    b._electricityConsumption, b._waterConsumption, b._capacity);
            case "shop":
            case "mall":
                return new CommercialBuilding(b._id, b._name, b._cost, b._maintenanceCost,
                    b._electricityConsumption, b._waterConsumption, b._jobs, b._incomePerTurn);
            case "factory":
            case "farm":
                return new IndustrialBuilding(b._id, b._name, b._cost, b._maintenanceCost,
                    b._electricityConsumption, b._waterConsumption, b._jobs,
                    b._productionType, b._producionAmount);
            case "police":
            case "fire":
            case "hospital":
                return new ServiceBuilding(b._id, b._name, b._cost, b._maintenanceCost,
                    b._electricityConsumption, b._waterConsumption, b._radius, b._happinessBoost);
            case "electric_plant":
            case "water_plant":
                return new UtilityPlant(b._id, b._name, b._cost, b._maintenanceCost,
                    b._electricityConsumption, b._waterConsumption,
                    b._productionType, b._productionAmount);
            case "park":
                return new Park(b._id, b._name, b._cost, b._maintenanceCost, b._happinessBonus);
            default:
                return null;
        }
    } catch(e) {
        console.warn("No se pudo deserializar edificio tipo:", type, e.message);
        return null;
    }
}