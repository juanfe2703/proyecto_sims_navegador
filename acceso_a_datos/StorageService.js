// ─── Save ─────────────────────────────────────────────────────────────────
 
/**
 * Serializa la ciudad completa a localStorage.
 * turnService call this function in each turn
 */
function saveCity(city) {
    localStorage.setItem("city", JSON.stringify(city))
}
 
/**
 * Alias para compatibilidad con el código existente en City_panel.js.
 */
function loadCity(city) {
    saveCity(city)
}
 
// ─── Load ───────────────────────────────────────────────────────────────────
 
/**
 * read the JSON of localstorage and rebuild all the object instances
 * Retorna una instancia de City lista para usar, o null si no hay partida guardada.
 */
function loadCityFromStorage() {
    const raw = localStorage.getItem("city")
    if (!raw) return null
 
    const data = JSON.parse(raw)
    const city = new City()
 
    // Datos básicos
    city.setNameCity(data._name_city)
    city.setNamePlayer(data._name_player)
    city.setLocation(data._location)
    city.setTurn(data._turn)
 
    // Grid y celdas
    const grid = new Grid()
    grid.setWidth(data._grid._width)
    grid.setHeight(data._grid._height)
 
    data._grid._cell.forEach(cellData => {
        const cell = new Cell(cellData._x, cellData._y, cellData._type)
 
        // Reconstruir edificio en la celda
        if (cellData._building) {
            const building = _deserializeBuilding(cellData._building, cellData._type)
            if (building) {
                cell.setBuilding(building)
                city.addBuilding(building)
            }
        }
 
        // Reconstruir vía en la celda
        if (cellData._road) {
            cell.setRoad(new Road(cellData._road._cost))
        }
 
        grid.Add_position(cell)
    })
 
    city.setGrid(grid)
 
    // Recursos
    const r = data._resources
    city.setResources(new Resources(r._money, r._electricity, r._water, r._food))
 
    // Ciudadanos (sin re-asignar vivienda/trabajo — ya están en los edificios)
    data._citizens.forEach(cData => {
        const citizen = new Citizen(cData._id)
        citizen._happiness = cData._happiness
        // Las referencias a edificios se pierden en el JSON, se reasignan
        // en el primer processCitizens() del siguiente turno
        city.addCitizen(citizen)
    })
 
    // Score
    const score = new Score()
    score.calculate(city)
    city.setScore(score)
 
    // Clima
    if (data._climate) {
        city.setClimate(new Climate(
            data._climate.city || data._climate._city,
            data._climate.temperature_c || data._climate._temperature_c,
            data._climate.condition || data._climate._condition,
            data._climate.humidity || data._climate._humidity,
            data._climate.icon || data._climate._icon
        ))
    }
 
    return city
}
 
/**
 * ¿Existe una partida guardada en localStorage?
 */
function hasSavedCity() {
    return localStorage.getItem("city") !== null
}
 
/**
 * Elimina la partida guardada.
 */
function deleteSavedCity() {
    localStorage.removeItem("city")
}
 
// ─── Helper interno ───────────────────────────────────────────────────────────
 
/**
 * Reconstruye la instancia correcta de edificio a partir de los datos JSON
 * y el tipo de celda guardado.
 */
function _deserializeBuilding(b, type) {
    switch (type) {
        case "house":
            return new ResidentialBuilding(b._id, b._name, b._cost, b._maintenanceCost, b._electricityConsumption, b._waterConsumption, b._capacity)
        case "apartment":
            return new ResidentialBuilding(b._id, b._name, b._cost, b._maintenanceCost, b._electricityConsumption, b._waterConsumption, b._capacity)
        case "shop":
        case "mall":
            return new CommercialBuilding(b._id, b._name, b._cost, b._maintenanceCost, b._electricityConsumption, b._waterConsumption, b._jobs, b._incomePerTurn)
        case "factory":
        case "farm":
            return new IndustrialBuilding(b._id, b._name, b._cost, b._maintenanceCost, b._electricityConsumption, b._waterConsumption, b._jobs, b._productionType, b._producionAmount)
        case "police":
        case "fire":
        case "hospital":
            return new ServiceBuilding(b._id, b._name, b._cost, b._maintenanceCost, b._electricityConsumption, b._waterConsumption, b._radius, b._happinessBoost)
        case "electric_plant":
        case "water_plant":
            return new UtilityPlant(b._id, b._name, b._cost, b._maintenanceCost, b._electricityConsumption, b._waterConsumption, b._productionType, b._productionAmount)
        case "park":
            return new Park(b._id, b._name, b._cost, b._maintenanceCost, b._happinessBonus)
        default:
            return null
    }
}