/**
 * game_controller.js
 * Controlador principal del juego.
 * Se expone como funcion global initGameController()
 * que es invocada por Map.js despues de su DOMContentLoaded.
 *
 * Modos de interaccion con el mapa:
 *   "none"     - sin modo activo (ver info al hacer clic)
 *   "build"    - construir edificio o via
 *   "demolish" - demoler
 *   "route"    - calcular ruta (2 clics: origen y destino)
 */

function initGameController() {

    // ─── 1. Cargar ciudad desde localStorage ────────────────────────────────
    const myCity = loadCityFromStorage();

    if (!myCity) {
        alert("No hay partida guardada. Redirigiendo al menu principal...");
        window.location.href = "City_Setup_Panel.html";
        return;
    }

    // Inicializar recursos si vienen nulos
    if (!myCity.getResources()) {
        myCity.setResources(new Resources(50000, 0, 0, 0));
    }
    if (!myCity.getScore()) {
        myCity.setScore(new Score());
    }

    // Exponer la ciudad globalmente para Map.js (clima/noticias)
    window.gameCity = myCity;

    // ─── 2. Servicios ───────────────────────────────────────────────────────
    const buildingService = new BuildingService();
    const turnService     = new TurnService();
    const routingService  = new RoutingService();

    // ─── 3. Estado del controlador ──────────────────────────────────────────
    let currentMode      = "none";
    let selectedType     = null;
    let routeOrigin      = null;
    let highlightedCells = [];

    // ─── 4. Referencias al DOM ──────────────────────────────────────────────
    const gridEl         = document.getElementById("id_city");
    const cityInfoEl     = document.getElementById("city-info");
    const resourcesEl    = document.getElementById("resources-panel");
    const scoreEl        = document.getElementById("score-value");
    const turnEl         = document.getElementById("turn-value");
    const modeIndicator  = document.getElementById("mode-indicator");
    const buildingInfoEl = document.getElementById("building-info-panel");
    const demolishBtn    = document.getElementById("btn-demolish");
    const routeBtn       = document.getElementById("btn-route");
    const pauseBtn       = document.getElementById("btn-pause");
    const saveBtn        = document.getElementById("btn-save");
    const turnSpeedInput = document.getElementById("turn-speed");
    const growthInput    = document.getElementById("growth-rate");

    // ─── 5. Renderizar el mapa ──────────────────────────────────────────────

    function renderMap() {
        const grid   = myCity.getGrid();
        const width  = grid.getWidth();
        const height = grid.getHeight();

        gridEl.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        gridEl.style.gridTemplateRows    = `repeat(${height}, 1fr)`;

        // Crear celdas del modelo si no existen todavia
        if (grid.getCell().length === 0) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    grid.Add_position(new Cell(x, y, "empty"));
                }
            }
        }

        // Generar HTML del mapa
        let html = "";
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = grid.getCell().find(c => c.getX() === x && c.getY() === y);
                const cls  = getCellClass(cell);
                const img  = getCellImage(cell);
                html += `<div class="cell ${cls}" data-x="${x}" data-y="${y}">`
                      + (img ? `<img src="${img}" class="cell-img" alt="">` : "")
                      + `</div>`;
            }
        }
        gridEl.innerHTML = html;

        // Listeners de clic en cada celda
        gridEl.querySelectorAll(".cell").forEach(cellDiv => {
            cellDiv.addEventListener("click", onCellClick);
        });
    }

    function getCellClass(cell) {
        if (!cell) return "";
        if (cell.getRoad())     return "cell-road";
        if (cell.getBuilding()) return `cell-building cell-${cell.getType()}`;
        return "";
    }

    function getCellImage(cell) {
        if (!cell) return null;
        const imgMap = {
            house:          "../../recourses/casa.png",
            apartment:      "../../recourses/apartamento.png",
            shop:           "../../recourses/tienda.png",
            mall:           "../../recourses/centro-comercial.png",
            factory:        "../../recourses/fabrica-electrica.png",
            farm:           "../../recourses/granja.png",
            police:         "../../recourses/estacion-de-policia.png",
            fire:           "../../recourses/bombero.png",
            hospital:       "../../recourses/hospital.png",
            electric_plant: "../../recourses/fabrica-electrica.png",
            water_plant:    "../../recourses/filtro-de-agua.png",
            park:           "../../recourses/naturaleza.png",
            road:           "../../recourses/camino.png"
        };
        if (cell.getRoad())     return imgMap["road"];
        if (cell.getBuilding()) return imgMap[cell.getType()] || null;
        return null;
    }

    // Actualizar solo la celda visual que cambio
    function refreshCell(x, y) {
        const cell    = myCity.getGrid().getCell().find(c => c.getX() === x && c.getY() === y);
        const cellDiv = gridEl.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (!cellDiv || !cell) return;
        cellDiv.className = "cell " + getCellClass(cell);
        const img = getCellImage(cell);
        cellDiv.innerHTML = img ? `<img src="${img}" class="cell-img" alt="">` : "";
    }

    // ─── 6. Paneles de informacion ───────────────────────────────────────────

    function updateInfoPanels() {
        if (cityInfoEl) {
            cityInfoEl.innerHTML = `
                <p><strong>${myCity.getNameCity()}</strong></p>
                <p>Alcalde: ${myCity.getNamePlayer()}</p>
                <p>Region: ${myCity.getLocation()}</p>`;
        }

        const r = myCity.getResources();
        if (resourcesEl) {
            const moneyCls = r.getMoney() > 10000 ? "text-success"
                           : r.getMoney() < 1000  ? "text-danger"
                           : "text-warning";
            resourcesEl.innerHTML = `
                <div class="resource-row">
                    <span>💰 Dinero</span>
                    <span class="${moneyCls}">$${r.getMoney().toLocaleString()}</span>
                </div>
                <div class="resource-row">
                    <span>⚡ Electricidad</span>
                    <span class="${r.getElectricity() < 0 ? "text-danger":"text-light"}">${r.getElectricity()}</span>
                </div>
                <div class="resource-row">
                    <span>💧 Agua</span>
                    <span class="${r.getWater() < 0 ? "text-danger":"text-light"}">${r.getWater()}</span>
                </div>
                <div class="resource-row">
                    <span>🌽 Alimentos</span>
                    <span class="text-light">${r.getFood()}</span>
                </div>
                <div class="resource-row">
                    <span>👥 Poblacion</span>
                    <span class="text-light">${myCity.getCitizens().length}</span>
                </div>
                <div class="resource-row">
                    <span>😊 Felicidad</span>
                    <span class="text-light">${getAvgHappiness()}%</span>
                </div>`;
        }

        if (scoreEl) scoreEl.textContent = myCity.getScore() ? myCity.getScore().getTotal() : 0;
        if (turnEl)  turnEl.textContent  = myCity.getTurn();
    }

    function getAvgHappiness() {
        const c = myCity.getCitizens();
        if (!c.length) return 0;
        return Math.round(c.reduce((s, ci) => s + ci.getHappiness(), 0) / c.length);
    }

    // ─── 7. Interaccion con el mapa ──────────────────────────────────────────

    function onCellClick(e) {
        const x = parseInt(e.currentTarget.dataset.x);
        const y = parseInt(e.currentTarget.dataset.y);

        if      (currentMode === "build")    handleBuild(x, y);
        else if (currentMode === "demolish") handleDemolish(x, y);
        else if (currentMode === "route")    handleRoute(x, y);
        else                                 handleInfo(x, y);
    }

    function handleBuild(x, y) {
        if (!selectedType) return;
        const result = selectedType === "road"
            ? buildingService.placeRoad(myCity, x, y)
            : buildingService.placeBuilding(myCity, selectedType, x, y);

        showToast(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            refreshCell(x, y);
            updateInfoPanels();
            saveCity(myCity);
        }
    }

    function handleDemolish(x, y) {
        const cell = myCity.getGrid().getCell().find(c => c.getX() === x && c.getY() === y);
        if (!cell || (!cell.getBuilding() && !cell.getRoad())) {
            showToast("No hay nada que demoler aqui.", "warning");
            return;
        }
        const name = cell.getBuilding() ? cell.getBuilding().getName() : "Via";
        if (!confirm(`¿Demoler ${name}? Recuperaras el 50% del costo.`)) return;

        const result = buildingService.demolish(myCity, x, y);
        showToast(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            refreshCell(x, y);
            updateInfoPanels();
            saveCity(myCity);
        }
    }

    function handleRoute(x, y) {
        const cell = myCity.getGrid().getCell().find(c => c.getX() === x && c.getY() === y);
        if (!cell || !cell.getBuilding()) {
            showToast("Selecciona un edificio para la ruta.", "warning");
            return;
        }
        if (!routeOrigin) {
            routeOrigin = cell.getBuilding();
            const div = gridEl.querySelector(`[data-x="${x}"][data-y="${y}"]`);
            if (div) div.classList.add("cell-route-origin");
            showToast(`Origen: ${routeOrigin.getName()}. Selecciona el destino.`, "info");
        } else {
            if (cell.getBuilding() === routeOrigin) {
                showToast("El destino debe ser diferente al origen.", "warning");
                return;
            }
            calculateAndShowRoute(routeOrigin, cell.getBuilding());
            routeOrigin = null;
        }
    }

    async function calculateAndShowRoute(origin, destination) {
        showToast("Calculando ruta...", "info");
        clearRouteHighlight();
        const result = await routingService.calculateRoute(myCity, origin, destination);
        if (!result.ok) { showToast(result.message, "danger"); return; }

        result.route.forEach(([row, col]) => {
            const div = gridEl.querySelector(`[data-x="${col}"][data-y="${row}"]`);
            if (div) { div.classList.add("cell-route"); highlightedCells.push(div); }
        });
        showToast(result.message, "success");
        setTimeout(clearRouteHighlight, 5000);
    }

    function clearRouteHighlight() {
        highlightedCells.forEach(d => d.classList.remove("cell-route", "cell-route-origin"));
        highlightedCells = [];
        gridEl.querySelectorAll(".cell-route-origin").forEach(d => d.classList.remove("cell-route-origin"));
    }

    function handleInfo(x, y) {
        const cell = myCity.getGrid().getCell().find(c => c.getX() === x && c.getY() === y);
        if (!cell || !buildingInfoEl) return;

        if (cell.getRoad()) {
            buildingInfoEl.innerHTML = `
                <h6>Via</h6>
                <p>Coordenadas: (${x}, ${y})</p>
                <p>Costo: $100</p>
                <button class="btn btn-sm btn-danger mt-2" onclick="demolishAt(${x},${y})">Demoler</button>`;
            buildingInfoEl.style.display = "block";
            return;
        }

        const b = cell.getBuilding();
        if (!b) { buildingInfoEl.style.display = "none"; return; }

        let extra = "";
        if (b instanceof ResidentialBuilding)
            extra = `<p>Capacidad: ${b.getCitizens().length} / ${b.getCapacity()} hab.</p>`;
        else if (b instanceof CommercialBuilding || b instanceof IndustrialBuilding)
            extra = `<p>Empleados: ${b.getEmployees().length} / ${b.getJobs()}</p>`;
        else if (b instanceof ServiceBuilding)
            extra = `<p>Radio: ${b.getRadius()} celdas · +${b.getHappinessBoost()} felicidad</p>`;

        buildingInfoEl.innerHTML = `
            <h6>${b.getName()}</h6>
            <p>Costo: $${b.getCost().toLocaleString()}</p>
            <p>Mantenimiento/t: $${b.getMaintenanceCost()}</p>
            <p>⚡ Consumo: ${b.getElectricityConsumption()} u/t</p>
            <p>💧 Consumo: ${b.getWaterConsumption()} u/t</p>
            ${extra}
            <button class="btn btn-sm btn-danger mt-2" onclick="demolishAt(${x},${y})">Demoler</button>`;
        buildingInfoEl.style.display = "block";
    }

    window.demolishAt = function(x, y) {
        handleDemolish(x, y);
        if (buildingInfoEl) buildingInfoEl.style.display = "none";
    };

    // ─── 8. Menu de edificios ────────────────────────────────────────────────

    document.querySelectorAll(".building-item[data-type]").forEach(item => {
        item.addEventListener("click", function () {
            selectedType = this.dataset.type;
            setMode("build");
            document.querySelectorAll(".building-item").forEach(i => i.classList.remove("selected"));
            this.classList.add("selected");
            const label = this.querySelector(".building-name");
            showToast(`Modo construccion: ${label ? label.textContent : selectedType}`, "info");
        });
    });

    // ─── 9. Botones de control ───────────────────────────────────────────────

    if (demolishBtn) {
        demolishBtn.addEventListener("click", function () {
            if (currentMode === "demolish") {
                setMode("none");
                showToast("Modo demolicion desactivado.", "secondary");
            } else {
                setMode("demolish");
                showToast("Modo demolicion activado. Clic en edificio o via.", "warning");
            }
        });
    }

    if (routeBtn) {
        routeBtn.addEventListener("click", function () {
            if (currentMode === "route") {
                setMode("none");
                clearRouteHighlight();
                routeOrigin = null;
                showToast("Modo ruta desactivado.", "secondary");
            } else {
                setMode("route");
                showToast("Modo ruta: selecciona el edificio origen.", "info");
            }
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener("click", function () {
            const speed = turnSpeedInput ? parseInt(turnSpeedInput.value) || 10 : 10;
            const rate  = growthInput    ? parseInt(growthInput.value)   || 3  : 3;

            if (turnService.isRunning()) {
                turnService.stopTimer();
                this.textContent = "▶ Reanudar";
            } else {
                turnService.startTimer(myCity, speed, {
                    growthRate: rate,
                    onTurnEnd:  onTurnEnd,
                    onGameOver: onGameOver
                });
                this.textContent = "⏸ Pausar";
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", function () {
            saveCity(myCity);
            showToast("Partida guardada.", "success");
        });
    }

    // ─── 10. Cambio de modo ──────────────────────────────────────────────────

    function setMode(mode) {
        currentMode = mode;
        if (mode !== "build")   selectedType = null;
        if (mode !== "route")   { routeOrigin = null; clearRouteHighlight(); }

        gridEl.style.cursor = mode === "none" ? "default" : "crosshair";
        if (demolishBtn) demolishBtn.classList.toggle("btn-warning",  mode === "demolish");
        if (routeBtn)    routeBtn.classList.toggle("btn-info",        mode === "route");
        if (mode !== "build") document.querySelectorAll(".building-item").forEach(i => i.classList.remove("selected"));

        if (modeIndicator) {
            modeIndicator.textContent = { none:"", build:"Construyendo", demolish:"Demoliendo", route:"Trazando ruta" }[mode] || "";
        }
    }

    // ─── 11. Callbacks del TurnService ──────────────────────────────────────

    function onTurnEnd() { updateInfoPanels(); }

    function onGameOver(message) {
        if (pauseBtn) pauseBtn.textContent = "▶ Iniciar";
        alert("GAME OVER: " + message);
    }

    // ─── 12. Toast de notificaciones ────────────────────────────────────────

    function showToast(message, type = "info") {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;";
            document.body.appendChild(container);
        }
        const toast = document.createElement("div");
        toast.className = `alert alert-${type} py-2 px-3 mb-0`;
        toast.style.cssText = "min-width:220px;max-width:320px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,0.3);";
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ─── 13. Guardado automatico cada 30 segundos ───────────────────────────
    setInterval(() => saveCity(myCity), 30000);

    // ─── 14. Arranque ───────────────────────────────────────────────────────
    renderMap();
    updateInfoPanels();

    // Mostrar clima y noticias iniciales
    if (myCity.getClimate() && typeof weatherPrint === "function") weatherPrint(myCity.getClimate());
    if (myCity.getNews()    && typeof newsPrint    === "function") newsPrint(myCity.getNews());

    if (pauseBtn) pauseBtn.textContent = "▶ Iniciar";
    console.log("Game controller listo. Ciudad:", myCity.getNameCity(),
                "| Grid:", myCity.getGrid().getWidth(), "x", myCity.getGrid().getHeight());
}
