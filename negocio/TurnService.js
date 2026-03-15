//este seria como el motor de la aplicacion pues son los turnos 
 
class TurnService {
 
    constructor() {
        this._citizenService = new CitizenService()
        this._scoreService   = new ScoreService()
        this._timerInterval  = null
    }
 
    // ─── principal cycle ─────────────────────────────────────────────────────
 
    /**
     * procces the complete tunr in the correct order:
     * 1. production and consumption of resources (all the buildings)
     * 2. manteinance costs
     * 3. citizens: growth (crecimiento), assingment, happines
     * 4. Score
     * 5. verification of end game 
     * 6. autosave
     * 7. continue turn
     *
     * @param {City} city
     * @param {object} config  Opciones configurables desde la UI.
     * @param {number} config.growthRate  Ciudadanos nuevos por turno (1-3).
     * @param {Function} config.onGameOver  Callback si se acaban recursos críticos.
     * @param {Function} config.onTurnEnd   Callback para actualizar la UI.
     */
    processTurn(city, config = {}) {
        const { growthRate = 3, onGameOver = null, onTurnEnd = null } = config
 
        // 1. each building produce/consume resources
        city.getBuildings().forEach(building => {
            if (typeof building.produce === "function") {
                const transaction = building.produce()
                // Se aplica la transacción aunque deje recursos en negativo
                // (el fin de juego se verifica después)
                city.getResources().applyTransaction(transaction)
            }
        })
 
        //maintenance cost of each building
        city.getBuildings().forEach(building => {
            const maintenance = building.getMaintenanceCost()
            if (maintenance > 0) {
                city.getResources().setMoney(
                    city.getResources().getMoney() - maintenance
                )
            }
        })
 
        // 3. citizens: crecimiento → assingment → happines
        this._citizenService.processCitizens(city, growthRate)
 
        // 4. Score
        this._scoreService.updateScore(city)
 
        // 5. endgame verification
        const gameOver = this._checkGameOver(city)
        if (gameOver) {
            this.stopTimer()
            if (onGameOver) onGameOver(gameOver)
            return
        }
 
        // 6. autosave in localStorage
        saveCity(city)
 
        // 7. next turn
        city.incrementTurn()
 
        // 8. Notificar a la UI
        if (onTurnEnd) onTurnEnd(city)
    }
 
    // ─── Auto Timer ────────────────────────────────────────────────────
 
    /**
     * Inicia el ciclo automático de turnos.
     *
     * @param {City} city
     * @param {number} intervalSeconds  Duración de un turno en segundos (default 10).
     * @param {object} config           Mismo config que processTurn().
     */
    startTimer(city, intervalSeconds = 10, config = {}) {
        this.stopTimer() // Evita timers duplicados
        this._timerInterval = setInterval(() => {
            this.processTurn(city, config)
        }, intervalSeconds * 1000)
    }
 
    /**
     * stop the auto cycle of turns
     */
    stopTimer() {
        if (this._timerInterval !== null) {
            clearInterval(this._timerInterval)
            this._timerInterval = null
        }
    }
 
    /**
     * Pause or continue the timer.
     */
    toggleTimer(city, intervalSeconds = 10, config = {}) {
        if (this._timerInterval !== null) {
            this.stopTimer()
        } else {
            this.startTimer(city, intervalSeconds, config)
        }
    }
 
    isRunning() {
        return this._timerInterval !== null
    }
 
    // ─── EndGame ────────────────────────────────────────────────────────
 
    /**
     * verify if any critic resource was negative 
     * end game if electricity or water are negative
     *
     * @returns {string|null}  Mensaje de fin de juego, o null si todo está bien.
     */
    _checkGameOver(city) {
        const resources = city.getResources()
 
        if (resources.getElectricity() < 0) {
            return "¡Se acabó la electricidad! La ciudad colapsó."
        }
 
        if (resources.getWater() < 0) {
            return "¡Se acabó el agua! La ciudad colapsó."
        }
 
        return null
    }
}