class TurnService {
 
    constructor() {
        this._citizenService      = new CitizenService()
        this._scoreService        = new ScoreService()
        this._timerInterval       = null
        this._turnsNegElectricity = 0
        this._turnsNegWater       = 0
    }
 
    processTurn(city, config = {}) {
        const { growthRate = 3, onGameOver = null, onTurnEnd = null } = config
 
        try {
            // 1. Produccion y consumo
            city.getBuildings().forEach(building => {
                if (typeof building.produce === "function") {
                    const tx = building.produce()
                    city.getResources().applyTransaction(tx)
                }
            })
        } catch(e) { console.error("TurnService ERROR en produce:", e); return; }
 
        try {
            // 2. Mantenimiento
            city.getBuildings().forEach(building => {
                const m = building.getMaintenanceCost()
                if (m > 0) city.getResources().setMoney(city.getResources().getMoney() - m)
            })
        } catch(e) { console.error("TurnService ERROR en mantenimiento:", e); return; }
 
        try {
            // 3. Ciudadanos
            this._citizenService.processCitizens(city, growthRate)
        } catch(e) { console.error("TurnService ERROR en ciudadanos:", e); return; }
 
        try {
            // 4. Score
            this._scoreService.updateScore(city)
        } catch(e) { console.error("TurnService ERROR en score:", e); return; }
 
        // 5. Avanzar turno
        city.incrementTurn()
 
        // 6. Guardar
        try { saveCity(city) } catch(e) { console.error("TurnService ERROR en saveCity:", e); }
 
        // 7. Notificar UI
        try { if (onTurnEnd) onTurnEnd(city) } catch(e) { console.error("TurnService ERROR en onTurnEnd:", e); }
 
        // 8. Game over
        const go = this._checkGameOver(city)
        if (go) { this.stopTimer(); if (onGameOver) onGameOver(go) }
 
        console.log(`Turno ${city.getTurn()} | $${city.getResources().getMoney()} | ⚡${city.getResources().getElectricity()} | 💧${city.getResources().getWater()} | 👥${city.getCitizens().length}`)
    }
 
    startTimer(city, intervalSeconds = 10, config = {}) {
        this.stopTimer()
        console.log(`Timer iniciado: cada ${intervalSeconds}s`)
        this._timerInterval = setInterval(() => {
            this.processTurn(city, config)
        }, intervalSeconds * 1000)
    }
 
    stopTimer() {
        if (this._timerInterval !== null) {
            clearInterval(this._timerInterval)
            this._timerInterval = null
        }
    }
 
    toggleTimer(city, intervalSeconds = 10, config = {}) {
        if (this._timerInterval !== null) this.stopTimer()
        else this.startTimer(city, intervalSeconds, config)
    }
 
    isRunning() { return this._timerInterval !== null }
 
    _checkGameOver(city) {
        const r = city.getResources()
        if (r.getElectricity() < 0) {
            this._turnsNegElectricity++
            if (this._turnsNegElectricity >= 2) return "¡Sin electricidad por 2 turnos! La ciudad colapsó."
        } else { this._turnsNegElectricity = 0 }
 
        if (r.getWater() < 0) {
            this._turnsNegWater++
            if (this._turnsNegWater >= 2) return "¡Sin agua por 2 turnos! La ciudad colapsó."
        } else { this._turnsNegWater = 0 }
 
        return null
    }
}