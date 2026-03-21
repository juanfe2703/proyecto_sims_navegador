class Raking{
    constructor() {
        this._data = [];
    }

    // Getters
    getData() { return this._data }

    // Setters
    setData(data) { this._data = data }

    // Métodos
    // Crea la estructura base del ranking en localStorage.
    // Nota: usamos la key "ranking" y el campo "ranking" para mantener consistencia.
    CreateRanking() {
        const initialData = { ranking: [] };
        localStorage.setItem("ranking", JSON.stringify(initialData));
    }

    // Alias por compatibilidad (si en algún lado llamas CreateRaking)
    CreateRaking() { this.CreateRanking(); }

    loadRanking() {
        const rankingData = localStorage.getItem("ranking");

        if (rankingData) {
            try {
                const parsedData = JSON.parse(rankingData);
                this._data = parsedData.ranking || [];
            } catch (e) {
                console.error("Error al parsear el ranking:", e);
                this._data = [];
            }
        } else {
            this.CreateRanking();
            this._data = [];
        }
    }

    add(gameData) {
        this._data.push(gameData);
        this._data.sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
        this.save();
    }

    save() {
        localStorage.setItem("ranking", JSON.stringify({
            ranking: this._data
        }));
    }

    getTop10() {
        return this._data.slice(0, 10);
    }

    getPosition(cityName, date) {
        return this._data.findIndex(
            item => item.cityName === cityName && item.date === date
        ) + 1;
    }

    reset() {
        this._data = [];
        this.save();
    }

    export() {
        return JSON.stringify({
            ranking: this._data
        }, null, 2);
    }


}