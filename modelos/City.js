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
        this._climate = null;
        this._News = null;
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
    getClimate() { return this._climate }
    getNews() { return this._News }

    // Setters: actualizan el valor de cada atributo (con validaciones simples)
    setNameCity(name_city) {
        if (name_city.length <= 50) {
            this._name_city = name_city;
        } else {
            throw new("No es un nombre  de ciudad valido ")
        }
    }

    setNamePlayer(name_player) { 
        if (name_player.length <= 50) {
            this._name_player = name_player;
        } else {
            throw new("No es un nombre  de jugador valido ")
        }
    }

    setLocation(location) {
        if (location.length <= 50) {
            this._location = location;
        } else {
            throw new("No es una ubicacion valida ")
        }
    }

    setGrid(grid) { this._grid = grid }
    setBuildings(buildings) { this._buildings = buildings }
    setCitizens(citizens) { this._citizens = citizens }
    setResources(resources) { this._resources = resources }
    setScore(score) { this._score = score }
    setTurn(turn) { this._turn = turn }
    setNews(news) { this._News = news }
    setClimate(climate) { 
        if(climate == null) {
            throw new Error("Problema con la generacion del clima");
        }else{
            this._climate = climate;
        }
        
    }

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

    Create_climate(){
        const apiClimate = new ApiClimate();
        return apiClimate.getCurrentWeather(this._location).then(climate => {
            if(climate){
                console.log("Clima obtenido con exito: " + climate);
                return new Climate(
                    climate.city,
                    climate.temperature_c,
                    climate.condition,
                    climate.humidity,
                    climate.icon
                );
            }else{
                return null;
            }
        })
    }

    Create_news(){
        const apiNews = new ApiNews();
        return apiNews.getCurrentNews(this._location).then(news_articles => {
            if (!news_articles) return null;

            let new_list = [];
            news_articles.forEach(new_current => {
                let title = new_current.title;
                let summary = new_current.description;
                let link = new_current.url;
                let media = new_current.image;
                let new_obj = new News(title, summary, link, media);
                new_list.push(new_obj);
            });
            return new_list;
        })
    }

    async ensureClimate(){
        const myClimate = await this.Create_climate();
        this.setClimate(myClimate);
        return myClimate;
    }

    async ensureNews(){
        const myNews = await this.Create_news();
        this.setNews(myNews);
        return myNews;
    }
}