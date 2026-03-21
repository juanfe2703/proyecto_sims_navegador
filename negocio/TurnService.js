class TurnService { // Servicio que ejecuta el avance de la partida por turnos
 
    constructor() { // Inicializa dependencias y estado interno
        this._citizenService      = new CitizenService() // Lógica de ciudadanos (crecimiento, felicidad, etc.)
        this._scoreService        = new ScoreService()   // Lógica de score (recalcular puntaje)
        this._timerInterval       = null                 // ID del setInterval cuando el timer está corriendo
        this._turnsNegElectricity = 0                    // Contador de turnos seguidos con electricidad negativa
        this._turnsNegWater       = 0                    // Contador de turnos seguidos con agua negativa
    }
 
    processTurn(city, config = {}) { // Ejecuta un turno completo sobre la ciudad
        const { growthRate = 3, onGameOver = null, onTurnEnd = null } = config // Opciones: crecimiento y callbacks
 
        try { // Si algo falla aquí, se corta el turno (return)
            // 1. Produccion y consumo
            city.getBuildings().forEach(building => { // Recorre cada edificio de la ciudad
                if (typeof building.produce === "function") { // Solo si el edificio implementa produce()
                    const tx = building.produce() // Crea una transacción de recursos (money/electricity/water/food)
                    city.getResources().applyTransaction(tx) // Aplica la transacción a los recursos de la ciudad
                }
            })
        } catch(e) { console.error("TurnService ERROR en produce:", e); return; } // Log + cortar turno
 
        try {
            // 2. Mantenimiento
            city.getBuildings().forEach(building => { // Recorre edificios para cobrar mantenimiento
                const m = building.getMaintenanceCost() // Costo de mantenimiento del edificio
                if (m > 0) city.getResources().setMoney(city.getResources().getMoney() - m) // Resta dinero
            })
        } catch(e) { console.error("TurnService ERROR en mantenimiento:", e); return; } // Log + cortar turno
 
        try {
            // 3. Ciudadanos
            this._citizenService.processCitizens(city, growthRate) // Actualiza ciudadanos (crecimiento/empleo/vivienda/etc.)
        } catch(e) { console.error("TurnService ERROR en ciudadanos:", e); return; } // Log + cortar turno
 
        try {
            // 4. Score
            this._scoreService.updateScore(city) // Recalcula el score en base al estado actual de la ciudad
        } catch(e) { console.error("TurnService ERROR en score:", e); return; } // Log + cortar turno
 
        // 5. Avanzar turno
        city.incrementTurn() // Aumenta el contador de turno de la ciudad
 
        // 6. Guardar
        try { saveCity(city) } catch(e) { console.error("TurnService ERROR en saveCity:", e); } // Persistencia en localStorage
 
        // 7. Notificar UI
        try { if (onTurnEnd) onTurnEnd(city) } catch(e) { console.error("TurnService ERROR en onTurnEnd:", e); } // Callback para refrescar UI
 
        // 8. Game over
        const go = this._checkGameOver(city) // Devuelve string si hay condición de game over, o null si no
        if (go) { this.stopTimer(); if (onGameOver) onGameOver(go) } // Detiene timer y notifica el motivo
 
        console.log(`Turno ${city.getTurn()} | $${city.getResources().getMoney()} | ⚡${city.getResources().getElectricity()} | 💧${city.getResources().getWater()} | 👥${city.getCitizens().length}`) // Log de resumen
    }
 
    startTimer(city, intervalSeconds = 10, config = {}) { // Empieza turnos automáticos
        this.stopTimer() // Evita tener dos timers corriendo al mismo tiempo
        console.log(`Timer iniciado: cada ${intervalSeconds}s`) // Log informativo
        this._timerInterval = setInterval(() => { // Guarda el ID del intervalo
            this.processTurn(city, config) // Ejecuta un turno cada intervalo
        }, intervalSeconds * 1000) // Convierte segundos a milisegundos
    }
 
    stopTimer() { // Detiene turnos automáticos
        if (this._timerInterval !== null) { // Si hay un timer activo
            clearInterval(this._timerInterval) // Detiene el setInterval
            this._timerInterval = null // Marca como no activo
        }
    }
 
    toggleTimer(city, intervalSeconds = 10, config = {}) { // Alterna entre iniciar y parar
        if (this._timerInterval !== null) this.stopTimer() // Si está corriendo -> parar
        else this.startTimer(city, intervalSeconds, config) // Si no -> iniciar
    }
 
    isRunning() { return this._timerInterval !== null } // True si el timer está activo
 
    _checkGameOver(city) { // Reglas simples para terminar el juego
        const r = city.getResources() // Atajo a recursos de la ciudad
        if (r.getElectricity() < 0) { // Si electricidad está en negativo
            this._turnsNegElectricity++ // Suma 1 turno negativo seguido
            if (this._turnsNegElectricity >= 2) return "¡Sin electricidad por 2 turnos! La ciudad colapsó." // Game over
        } else { this._turnsNegElectricity = 0 } // Si vuelve a normal, resetea contador
 
        if (r.getWater() < 0) { // Si agua está en negativo
            this._turnsNegWater++ // Suma 1 turno negativo seguido
            if (this._turnsNegWater >= 2) return "¡Sin agua por 2 turnos! La ciudad colapsó." // Game over
        } else { this._turnsNegWater = 0 } // Si vuelve a normal, resetea contador
 
        return null // Si no hay game over, devuelve null
    }
}