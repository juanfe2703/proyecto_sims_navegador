// este seria el estado central del sistema

/**
 * Modelo City (estado central del juego).
 * Guarda la información principal de la ciudad y el avance de la partida:
 * - Identidad: name_city, name_player, location
 * - Mapa: grid
 * - Estado: buildings, citizens, resources, score, turn
 */
class City {
    /**
     * Inicializa la ciudad con valores por defecto.
     * Nota: aquí se crean/declaran las propiedades internas (prefijo _).
     */
    constructor() {
        this._name_city = null;
        this._name_player = null;
        this._location = null;
        this._grid = null;
        this._buildings = []
        this._citizens = []
        this._resources = null;
        this._score = null
        this._turn = 0
    }

    // Getters: devuelven el valor actual de cada atributo

    getNameCity() { return this._name_city }
    getNamePlayer() { return this._name_player }
    getLocation() { return this._location }
    getGrid() { return this._grid }
    getBuildings() { return this._buildings }
    getCitizens() { return this._citizens }
    getResources() { return this._resources }
    getScore() { return this._score }
    getTurn() { return this._turn }

    // Setters: actualizan el valor de cada atributo (con validaciones simples)
    setNameCity(name_city) {
        if (name_city.length <= 50) {
            this._name_city = name_city;
        } else {
            alert(name_city + " No es un nombre valido ")
        }
    }

    setNamePlayer(name_player) { 
        if (name_player.length <= 50) {
            this._name_player = name_player;
        } else {
            alert(name_player + " No es un nombre valido ")
        }
    }

    setLocation(location) {
        if (location.length <= 50) {
            this._location = location;
        } else {
            alert(location + " No es una ubicacion valida ")
        }
    }

    setGrid(grid) { this._grid = grid }
    setBuildings(buildings) { this._buildings = buildings }
    setCitizens(citizens) { this._citizens = citizens }
    setResources(resources) { this._resources = resources }
    setScore(score) { this._score = score }
    setTurn(turn) { this._turn = turn }

    incrementTurn() { this._turn++ }

    addBuilding(building) {
        this._buildings.push(building)
    }

    removeBuilding(building) {
        this._buildings = this._buildings.filter(b => b !== building)
    }

    addCitizen(citizen) {
        this._citizens.push(citizen)
    }
}