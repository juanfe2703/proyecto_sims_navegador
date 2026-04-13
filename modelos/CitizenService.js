class CitizenService {
 
    // ─── Creation ────────────────────────────────────────────────────────────
 
    /**
     * create one citizen, then append him to the city and return him
     * for asigned him a house and work inmediatly if we want
     */
    createCitizen(city) {
        const id = city.getCitizens().length + 1;
        const citizen = new Citizen(id);
        city.addCitizen(citizen);
        // Calcular felicidad inicial inmediatamente para que el proximo
        // turno ya tenga datos reales (no el valor por defecto 50)
        citizen.calculateHappiness(city);
        return citizen;
    }
 
 
 
 
        // ─── assing home ──────────────────────────────────────────────
 
    /**
     * look the citizens without home and assing one to the first 
     * residential building with space
     */
    assignHousing(city) {
        const citizens = city.getCitizens();
 
        const residentialBuildings = city.getBuildings().filter(
            b => b instanceof ResidentialBuilding
        );
 
        citizens.forEach(citizen => {
            if (!citizen.hasHouse()) {
                const house = residentialBuildings.find(b => b.hasSpace());
 
                if (house) {
                    house.addResident(citizen);
                    citizen.setResidence(house);
                }
            }
        });
    }
 
 
 
 
    // ─── Employ assingment ────────────────────────────────────────────────
 
    /**
     * look the citizens without work and assing them to the first
     * commercial or industrial building with space 
     */
    assignJobs(city) {
        const citizens = city.getCitizens();
 
        const workplaces = city.getBuildings().filter(
            b => b instanceof CommercialBuilding || b instanceof IndustrialBuilding
        );
 
        citizens.forEach(citizen => {
            if (!citizen.hasJob()) {
                const workplace = workplaces.find(b => b.hasVacancy());
 
                if (workplace) {
                    workplace.addWorker(citizen);
                    citizen.setWorkplace(workplace);
                }
            }
        });
    }
 
 
 
 
 
    // ─── Crecimiento de población ────────────────────────────────────────────
 
    /**
     * Create new citizens if the 3 conditions of the document are check
     *   1. there are any house empty?
     *   2. average happynes > 60
     *   3. there are any work vacant? (hay empleos disponibles?)
     *
     * grouwth rate (tasa de crecimiento): between 1 and 3 citizens per turn (customisable)
     */
    growPopulation(city, growthRate = 3) {
        const hasHousing = city.getBuildings()
            .filter(b => b instanceof ResidentialBuilding)
            .some(b => b.hasSpace());
 
        const hasJobs = city.getBuildings()
            .filter(b => b instanceof CommercialBuilding || b instanceof IndustrialBuilding)
            .some(b => b.hasVacancy());
 
        // Si no hay vivienda o empleo disponible, no puede crecer
        if (!hasHousing || !hasJobs) return;
 
        const population   = city.getCitizens().length;
        const avgHappiness = this._getAverageHappiness(city);
 
        // La condicion de felicidad solo aplica cuando ya hay ciudadanos.
        // Con ciudad vacia la felicidad es 0, lo que bloquearia para siempre
        // el primer ciudadano (circulo vicioso).
        if (population > 0 && avgHappiness <= 60) return;
 
        const newCitizens = Math.floor(Math.random() * growthRate) + 1;
 
        for (let i = 0; i < newCitizens; i++) {
            // Verificar en cada iteración que aún haya espacio
            const stillHasHousing = city.getBuildings()
                .filter(b => b instanceof ResidentialBuilding)
                .some(b => b.hasSpace());
 
            if (!stillHasHousing) break;
 
            this.createCitizen(city);
        }
    }
 
 
 
 
 
    // ─── Complete procces per turn ──────────────────────────────────────────
 
    /**
     * 
     * Execute the entire citizen cycle in order:
     * growth (crecimiento) → housing assing → employment assing → happiness.
     * TurnService call this method per any turn
     */
    processCitizens(city, growthRate = 3) {
        // Primero asignar vivienda y empleo a ciudadanos existentes,
        // luego actualizar felicidad, y ENTONCES evaluar si crece la población.
        // Así growPopulation lee una felicidad real y no el valor 0 por defecto.
        this.assignHousing(city);
        this.assignJobs(city);
        this._updateHappiness(city);
        this.growPopulation(city, growthRate);
    }
 
    // ─── Inside Helpers ────────────────────────────────────────────────────
 
    /**
     * calculate and update the happynes of all the citizens
     * pass the city for that calculateHappines() can count
     * services and parks actives
     */
    _updateHappiness(city) {
        city.getCitizens().forEach(citizen => citizen.calculateHappiness(city));
    }
 
    /**
     * return the average happines of the city (0 if there are not citizens)
     */
    _getAverageHappiness(city) {
        const citizens = city.getCitizens();
        if (citizens.length === 0) return 0;
 
        const total = citizens.reduce((sum, c) => sum + c.getHappiness(), 0);
        return total / citizens.length;
    }
 
    /**
     * return the average happines in public form
     * este puede serle util para el panel de estadisticas y el ScoreService señor Cano
     * (útil para el panel de estadísticas y ScoreService).
     */
    getAverageHappiness(city) {
        return this._getAverageHappiness(city);
    }
    
}
