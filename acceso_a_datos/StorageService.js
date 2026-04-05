// ─── Save ─────────────────────────────────────────────────────────────────────
 
function saveCity(city) {
    const data = serializeCity(city);
    localStorage.setItem("city", JSON.stringify(data));
    console.log(city + "[saveCity] Ciudad guardada:", data);
}

// ─── Export (descarga archivo JSON) ─────────────────────────────────────────

function _safeFileName(name) {
    if (!name) return "ciudad";
    // Quitar caracteres inválidos en Windows y simplificar espacios.
    return String(name)
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .replace(/\s+/g, "_");
}

function _dateStamp() {
    const d = new Date();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function exportCityToJsonFile(city, fileName) {
    const data = serializeCity(city);
    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;

    const cityName = (city && typeof city.getNameCity === "function") ? city.getNameCity() : "ciudad";
    const safeCity = _safeFileName(cityName);
    const baseName = fileName ? fileName : (`ciudad_${safeCity}_${_dateStamp()}.json`);
    a.download = baseName;

    document.body.appendChild(a);
    a.click();
    a.remove();

    // Liberar el blob (en el siguiente tick por seguridad)
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
}
 
function loadCity(city) { saveCity(city); }
 
// ─── Serializacion manual (evita referencias circulares) ──────────────────────
// El problema: CommercialBuilding._employees -> Citizen -> Citizen._workplace
// apunta de vuelta al mismo edificio. JSON.stringify explota con eso.
// Solucion: serializar cada parte a mano guardando solo datos primitivos.
 
function serializeCity(city) {
    const grid = city.getGrid();
 
    // Serializar celdas (sin referencias a objetos complejos internos)
    const cells = grid.getCell().map(cell => {
        const cd = { _x: cell.getX(), _y: cell.getY(), _type: cell.getType() || "empty",
                     _building: null, _road: null };
        if (cell.getRoad()) {
            cd._road = { _cost: cell.getRoad().getCost() };
        }
        if (cell.getBuilding()) {
            cd._building = serializeBuilding(cell.getBuilding(), cell.getType());
        }
        return cd;
    });
 
    // Serializar ciudadanos (solo datos primitivos, sin referencias a edificios)
    const citizens = city.getCitizens().map(c => ({
        _id:        c.getId(),
        _happiness: c.getHappiness(),
        _hasJob:    c.hasJob(),
        _hasHouse:  c.hasHouse()
    }));
 
    // Serializar recursos
    const r = city.getResources();
    const resources = {
        _money:       r.getMoney(),
        _electricity: r.getElectricity(),
        _water:       r.getWater(),
        _food:        r.getFood()
    };
 
    // Serializar clima
    let climate = null;
    if (city.getClimate()) {
        const cl = city.getClimate();
        climate = {
            city:          cl.getCity(),
            temperature_c: cl.getTemperatureC(),
            condition:     cl.getCondition(),
            humidity:      cl.getHumidity(),
            icon:          cl.getIcon()
        };
    }
 
    // Serializar noticias
    let news = null;
    if (city.getNews()) {
        news = city.getNews().map(n => ({
            _title:   n.getTitle(),
            _summary: n.getSummary(),
            _link:    n.getLink(),
            _media:   n.getMedia()
        }));
    }
 
    // Serializar score
    let score = null;
    if (city.getScore()) {
        score = { _total: city.getScore().getTotal() };
    }
 
    return {
        _name_city:   city.getNameCity(),
        _name_player: city.getNamePlayer(),
        _location:    city.getLocation(),
        _turn:        city.getTurn(),
        _grid: {
            _width:  grid.getWidth(),
            _height: grid.getHeight(),
            _cell:   cells
        },
        _resources: resources,
        _citizens:  citizens,
        _score:     score,
        _climate:   climate,
        _News:      news
    };
}
 
function serializeBuilding(b, type) {
    // Base comun a todos los edificios
    const base = {
        _id:                    b.getId(),
        _name:                  b.getName(),
        _cost:                  b.getCost(),
        _maintenanceCost:       b.getMaintenanceCost(),
        _electricityConsumption:b.getElectricityConsumption(),
        _waterConsumption:      b.getWaterConsumption()
    };
 
    switch (type) {
        case "house": case "apartment":
            return { ...base, _capacity: b.getCapacity() };
 
        case "shop": case "mall":
            return { ...base, _jobs: b.getJobs(), _incomePerTurn: b.getIncomePerTurn(),
                     _employees: [] }; // referencias circulares — se reasignan al cargar
 
        case "factory": case "farm":
            return { ...base, _jobs: b.getJobs(), _productionType: b.getProductionType(),
                     _producionAmount: b.getProducionAmount(), _employees: [] };
 
        case "police": case "fire": case "hospital":
            return { ...base, _radius: b.getRadius(), _happinessBoost: b.getHappinessBoost() };
 
        case "electric_plant": case "water_plant":
            return { ...base, _productionType: b.getProductionType(),
                     _productionAmount: b.getProductionAmount() };
 
        case "park":
            return { ...base, _happinessBonus: b.getHappinessBonus() };
 
        default:
            return base;
    }
}
 
// ─── Load ─────────────────────────────────────────────────────────────────────
 
function loadCityFromStorage() {
    const raw = localStorage.getItem("city");
    if (!raw) return null;
 
    let data;
    try { data = JSON.parse(raw); }
    catch(e) { console.error("Error al parsear localStorage:", e); return null; }
 
    try {
        const city = new City();
        city.setNameCity(data._name_city     || "Ciudad");
        city.setNamePlayer(data._name_player || "Alcalde");
        city.setLocation(data._location      || "");
        city.setTurn(data._turn              || 0);
 
        // Grid
        const grid = new Grid();
        grid.setWidth(data._grid._width);
        grid.setHeight(data._grid._height);
 
        (data._grid._cell || []).forEach(cd => {
            const cell = new Cell(cd._x, cd._y, cd._type || "empty");
            if (cd._road) cell.setRoad(new Road(cd._road._cost || 100));
            if (cd._building) {
                const b = _deserializeBuilding(cd._building, cd._type);
                if (b) { cell.setBuilding(b); city.addBuilding(b); }
            }
            grid.Add_position(cell);
        });
        city.setGrid(grid);
 
        // Recursos
        const r = data._resources;
        if (r) {
            const money = (r._money ?? r.money ?? 50000);
            const electricity = (r._electricity ?? r.electricity ?? 0);
            const water = (r._water ?? r.water ?? 0);
            const food = (r._food ?? r.food ?? 0);
            city.setResources(new Resources(money, electricity, water, food));
        } else {
            city.setResources(new Resources(50000, 0, 0, 0));
        }
 
        // Ciudadanos (las referencias a edificios se reasignan en el primer processCitizens)
        (data._citizens || []).forEach(cd => {
            const c = new Citizen(cd._id);
            c._happiness = cd._happiness || 50;
            // No restaurar hasHouse/hasJob — se reasignan en el primer turno
            //
            c._hasHouse = false;
            c._hasJob = false;
            city.addCitizen(c);
        });
 
        // Score
        const score = new Score();
        score.calculate(city);
        city.setScore(score);
 
        // Clima
        const cl = data._climate;
        if (cl) {
            try {
                city.setClimate(new Climate(
                    cl.city||cl._city||"", cl.temperature_c||cl._temperature_c||0,
                    cl.condition||cl._condition||"", cl.humidity||cl._humidity||0,
                    cl.icon||cl._icon||""
                ));
            } catch(e) { console.warn("Clima no restaurado:", e.message); }
        }
 
        // Noticias
        const nl = data._News || data._news;
        if (nl && Array.isArray(nl)) {
            city.setNews(nl.map(n => new News(
                n._title||"", n._summary||"", n._link||"", n._media||""
            )));
        }
 
        return city;
    } catch(e) {
        console.error("Error al reconstruir la ciudad:", e);
        return null;
    }
}
 
function hasSavedCity()  { return localStorage.getItem("city") !== null; }
function deleteSavedCity(){ localStorage.removeItem("city"); }
 
// ─── Deserializar edificio ────────────────────────────────────────────────────
 
function _deserializeBuilding(b, type) {
    try {
        switch (type) {
            case "house": case "apartment":
                return new ResidentialBuilding(b._id, b._name, b._cost, b._maintenanceCost,
                    b._electricityConsumption, b._waterConsumption, b._capacity);
            case "shop": case "mall":
                return new CommercialBuilding(b._id, b._name, b._cost, b._maintenanceCost,
                    b._electricityConsumption, b._waterConsumption, b._jobs, b._incomePerTurn);
            case "factory": case "farm":
                return new IndustrialBuilding(b._id, b._name, b._cost, b._maintenanceCost,
                    b._electricityConsumption, b._waterConsumption, b._jobs,
                    b._productionType, b._producionAmount);
            case "police": case "fire": case "hospital":
                return new ServiceBuilding(b._id, b._name, b._cost, b._maintenanceCost,
                    b._electricityConsumption, b._waterConsumption, b._radius, b._happinessBoost);
            case "electric_plant": case "water_plant":
                return new UtilityPlant(b._id, b._name, b._cost, b._maintenanceCost,
                    b._electricityConsumption, b._waterConsumption,
                    b._productionType, b._productionAmount);
            case "park":
                return new Park(b._id, b._name, b._cost, b._maintenanceCost, b._happinessBonus);
            default: return null;
        }
    } catch(e) {
        console.warn("No se pudo deserializar edificio tipo:", type, e.message);
        return null;
    }
}