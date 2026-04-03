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

                // Limpia scores negativos que ya existan en localStorage
                const before = this._data.length;
                const cleaned = [];
                for (let i = 0; i < this._data.length; i++) {
                    const item = this._data[i];
                    const score = (item && typeof item.score === "number") ? item.score : 0;
                    if (score >= 0) cleaned.push(item);
                }

                // Quitar duplicados por ciudad+jugador (mantiene el último registro)
                const uniq = {};
                for (let i = 0; i < cleaned.length; i++) {
                    const item = cleaned[i];
                    if (!item) continue;
                    const cityName = (item.cityName != null) ? String(item.cityName) : "";
                    const playerName = (item.playerName != null) ? String(item.playerName) : "";
                    const key = cityName + "|" + playerName;
                    uniq[key] = item;
                }

                const deduped = [];
                for (const key in uniq) {
                    if (Object.prototype.hasOwnProperty.call(uniq, key)) {
                        deduped.push(uniq[key]);
                    }
                }

                // Reordenar por score desc y persistir si hubo cambios
                deduped.sort(function(a, b) {
                    const sa = (a && typeof a.score === "number") ? a.score : 0;
                    const sb = (b && typeof b.score === "number") ? b.score : 0;
                    return sb - sa;
                });
                this._data = deduped;
                if (this._data.length !== before) this.save();
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
        if (!gameData) return;
        if (gameData.score < 0) return; // si es negativo no se guarda

        // No duplicar: si ya existe ciudad+jugador, actualizar ese registro
        const key = String(gameData.cityName || "") + "|" + String(gameData.playerName || "");
        let idx = -1;
        for (let i = 0; i < this._data.length; i++) {
            const item = this._data[i];
            if (!item) continue;
            const k = String(item.cityName || "") + "|" + String(item.playerName || "");
            if (k === key) { idx = i; break; }
        }
        if (idx >= 0) this._data[idx] = gameData;
        else this._data.push(gameData);

        this._data.sort(function(a, b) {
            const sa = (a && typeof a.score === "number") ? a.score : 0;
            const sb = (b && typeof b.score === "number") ? b.score : 0;
            return sb - sa;
        });
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