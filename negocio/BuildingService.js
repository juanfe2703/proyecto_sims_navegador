class BuildingService {
    // ─── inside helpers ────────────────────────────────────────────────────
 
    /**
     * search and return a cell of the grid in the position (x, y)
     * Return null if the coordinates are out of the map
     */
    _getCell(city, x, y) {
        const grid = city.getGrid();
        if (x < 0 || y < 0 || x >= grid.getWidth() || y >= grid.getHeight()) {
            return null;
        }
        return grid.getCell().find(c => c.getX() === x && c.getY() === y) || null;
    }
 
    /**
     * verify if any adjacent cell (up, down, left or right)
     * have a road wich is obligatory for build any building
     */
    hasAdjacentRoad(city, x, y) {
        const neighbors = [
            this._getCell(city, x, y - 1),
            this._getCell(city, x, y + 1),
            this._getCell(city, x - 1, y),
            this._getCell(city, x + 1, y),
        ];
        return neighbors.some(cell => cell !== null && cell.getRoad() !== null);
    }
 
    /**
     * generate an unic ID for the new building based on how many there are
     */
    _generateId(city) {
        return city.getBuildings().length + 1;
    }




    // ─── Building construction ───────────────────────────────────────────
 
    /**
     * build a building in the cell (x, y).
     *
     * @param {City} city           Estado actual de la ciudad.
     * @param {string} buildingType Tipo: "house", "apartment", "shop", "mall",
     *                              "factory", "farm", "police", "fire", "hospital",
     *                              "electric_plant", "water_plant", "park"
     * @param {number} x            Columna del mapa.
     * @param {number} y            Fila del mapa.
     * @returns {{ ok: boolean, message: string }}
     */
    placeBuilding(city, buildingType, x, y) {
        const cell = this._getCell(city, x, y);
 
        //validate 1: valid coordinates
        if (!cell) {
            return { ok: false, message: "Posición fuera del mapa." };
        }
 
        //validate 2: empty cell
        if (cell.getBuilding() !== null || cell.getRoad() !== null) {
            return { ok: false, message: "La celda ya está ocupada." };
        }
 
        //validate 3: obligatory adjacent road
        if (!this.hasAdjacentRoad(city, x, y)) {
            return { ok: false, message: "El edificio debe estar junto a una vía." };
        }
 
        //build a correct instance depend the type
        const id = this._generateId(city);
        const building = this._createBuilding(id, buildingType);
 
        if (!building) {
            return { ok: false, message: `Tipo de edificio desconocido: ${buildingType}` };
        }
 
        //validate 4: enough money
        const cost = building.getCost();
        if (city.getResources().getMoney() < cost) {
            return { ok: false, message: `Dinero insuficiente. Necesitas $${cost}.` };
        }
 
        //aply the build
        city.getResources().setMoney(city.getResources().getMoney() - cost);
        cell.setBuilding(building);
        cell.setType(buildingType);
        city.addBuilding(building);
 
        return { ok: true, message: `${building.getName()} construido por $${cost}.` };
    }
 
    /**
     * create and return the building instance depend of the type
     * with the values of the requirements document
     */
    _createBuilding(id, buildingType) {
        // constructor: (id, name, cost, maintenanceCost, electricityConsumption, waterConsumption, ...)
        switch (buildingType) {
 
            // Residentials
            case "house":
                return new ResidentialBuilding(id, "Casa", 1000, 50, 5, 3, 4);
            case "apartment":
                return new ResidentialBuilding(id, "Apartamento", 3000, 150, 15, 10, 12);
 
            // Comercials (id, name, cost, maintenance, elec, water, jobs, incomePerTurn)
            case "shop":
                return new CommercialBuilding(id, "Tienda", 2000, 80, 8, 0, 6, 500);
            case "mall":
                return new CommercialBuilding(id, "Centro Comercial", 8000, 300, 25, 0, 20, 2000);
 
            // Industrials (id, name, cost, maintenance, elec, water, jobs, productionType, amount)
            case "factory":
                return new IndustrialBuilding(id, "Fábrica", 5000, 200, 20, 15, 15, "money", 800);
            case "farm":
                return new IndustrialBuilding(id, "Granja", 3000, 100, 0, 10, 8, "food", 50);
 
            // Services (id, name, cost, maintenance, elec, water, radius, happinessBoost)
            case "police":
                return new ServiceBuilding(id, "Estación de Policía", 4000, 150, 15, 0, 5, 10);
            case "fire":
                return new ServiceBuilding(id, "Estación de Bomberos", 4000, 150, 15, 0, 5, 10);
            case "hospital":
                return new ServiceBuilding(id, "Hospital", 6000, 250, 20, 10, 7, 10);
 
            // Utilitys (id, name, cost, maintenance, elec, water, productionType, amount)
            case "electric_plant":
                return new UtilityPlant(id, "Planta Eléctrica", 10000, 400, 0, 0, "electricity", 200);
            case "water_plant":
                return new UtilityPlant(id, "Planta de Agua", 8000, 300, 20, 0, "water", 150);
 
            // Park (id, name, cost, maintenance, happinessBonus)
            case "park":
                return new Park(id, "Parque", 1500, 0, 5);
 
            default:
                return null;
        }
    }



    // ─── building roads ────────────────────────────────────────────────
 
    /**
     * put a road in a cell (x, y).
     *
     * @returns {{ ok: boolean, message: string }}
     */
    placeRoad(city, x, y) {
        const cell = this._getCell(city, x, y);
        const ROAD_COST = 100;
 
        if (!cell) {
            return { ok: false, message: "Posición fuera del mapa." };
        }
 
        if (cell.getBuilding() !== null || cell.getRoad() !== null) {
            return { ok: false, message: "La celda ya está ocupada." };
        }
 
        if (city.getResources().getMoney() < ROAD_COST) {
            return { ok: false, message: `Dinero insuficiente. Una vía cuesta $${ROAD_COST}.` };
        }
 
        const road = new Road(ROAD_COST);
        city.getResources().setMoney(city.getResources().getMoney() - ROAD_COST);
        cell.setRoad(road);
        cell.setType("road");
 
        return { ok: true, message: `Vía construida por $${ROAD_COST}.` };
    }



    // ─── Demolition ─────────────────────────────────────────────────────────
 
    /**
     * destroy a building or road in the cell (x, y)
     * return 50% of building construction
     * the citizen afected lost her home or work
     *
     * @returns {{ ok: boolean, message: string }}
     */
    demolish(city, x, y) {
        const cell = this._getCell(city, x, y);
 
        if (!cell) {
            return { ok: false, message: "Posición fuera del mapa." };
        }
 
        // Destroy road
        if (cell.getRoad() !== null) {
            const refund = Math.floor(cell.getRoad().getCost() * 0.5);
            city.getResources().setMoney(city.getResources().getMoney() + refund);
            cell.setRoad(null);
            cell.setType(null);
            return { ok: true, message: `Vía demolida. Recuperaste $${refund}.` };
        }
 
        // Destroy building
        if (cell.getBuilding() !== null) {
            const building = cell.getBuilding();
            const refund = Math.floor(building.getCost() * 0.5);
 
            //unassing affected citizens
            this._evictCitizens(city, building);
 
            // Update state
            city.getResources().setMoney(city.getResources().getMoney() + refund);
            city.removeBuilding(building);
            cell.setBuilding(null);
            cell.setType(null);
 
            return { ok: true, message: `${building.getName()} demolido. Recuperaste $${refund}.` };
        }
 
        return { ok: false, message: "No hay nada que demoler en esa celda." };
    }
 
    /**
     * unassing citizens that live or work in the destroy building
     * Desasigna los ciudadanos que vivían o trabajaban en el edificio demolido.
     */
    _evictCitizens(city, building) {
        city.getCitizens().forEach(citizen => {
            //if was lived here, lost his house
            if (citizen._residence === building) {
                citizen.setResidence(null);
            }
            //if was worked here, lost his work
            if (citizen._workplace === building) {
                citizen.setWorkplace(null);
            }
        });
 
        //if was residential, empty the list of citizens
        if (building instanceof ResidentialBuilding) {
            building.setCitizens([]);
        }
 
        //if was comercial or industrial, empty employs
        if (building instanceof CommercialBuilding || building instanceof IndustrialBuilding) {
            building.setEmployees([]);
        }
    }
}