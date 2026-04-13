/**
 * game_controller.js
 * Unico punto de entrada del juego via DOMContentLoaded.
 * Map.js solo define funciones (weatherPrint, newsPrint, initMap).
 */

document.addEventListener("DOMContentLoaded", function () { // Ejecuta cuando el HTML ya cargó

    function isMobileViewport() {
        try { return window.matchMedia && window.matchMedia("(max-width: 767.98px)").matches; }
        catch { return window.innerWidth < 768; }
    }

    function openOverlayModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.remove("show");
        modalEl.hidden = false;
        requestAnimationFrame(() => modalEl.classList.add("show"));
    }

    function closeOverlayModal(modalEl, transitionMs = 300) {
        if (!modalEl) return;
        modalEl.classList.remove("show");
        window.setTimeout(() => {
            modalEl.hidden = true;
        }, transitionMs);
    }

    // ─── 1. Cargar ciudad ────────────────────────────────────────────────────
    const myCity = loadCityFromStorage(); // Intenta cargar la ciudad desde localStorage

    if (!myCity) { // Si no hay partida guardada
        alert("No hay partida guardada. Redirigiendo..."); // Avisa al usuario
        window.location.href = "City_Setup_Panel.html"; // Vuelve al panel de setup
        return; // Corta el arranque del juego
    }

    if (!myCity.getResources()) myCity.setResources(new Resources(50000, 0, 0, 0)); // Asegura recursos mínimos
    if (!myCity.getScore())     myCity.setScore(new Score()); // Asegura que exista score

    // Clave de ciudad actual para resaltado en ranking (modal/pantalla)
    try {
        sessionStorage.setItem(
            "currentCityKey",
            String(myCity.getNameCity?.() ?? "") + "|" + String(myCity.getNamePlayer?.() ?? "")
        );
    } catch {}

    window.gameCity = myCity; // Expone la ciudad en consola (debug)

    // ─── 2. Inicializar Map.js (zoom) ────────────────────────────────────────
    if (typeof initMap === "function") initMap(); // Inicializa zoom/drag del mapa si existe

    // ─── 3. Servicios ────────────────────────────────────────────────────────
    const buildingService = new BuildingService(); // Colocar/demoler edificios y vías
    const turnService     = new TurnService();     // Procesar turnos y timer
    const routingService  = new RoutingService();  // Calcular rutas entre edificios

    // ─── 4. Estado ───────────────────────────────────────────────────────────
    let currentMode      = "none"; // Modo actual: none/build/demolish/route/info
    let selectedType     = null;    // Tipo seleccionado para construir (house, road, etc.)
    let routeOrigin      = null;    // Edificio de origen cuando se calcula una ruta
    let highlightedCells = [];      // Celdas resaltadas (para limpiar luego)

    // ─── 5. DOM ──────────────────────────────────────────────────────────────
    const gridEl         = document.getElementById("id_city"); // Contenedor del grid
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
    const openBuildingsBtnEl = document.getElementById("btn-open-buildings");
    const turnSpeedInput = document.getElementById("turn-speed");
    const growthInput    = document.getElementById("growth-rate");

    // HU-022 (móvil): stats flotantes + modal info edificio
    const mobileStatsBtnEl = document.getElementById("btn-open-stats");
    const mobileStatsOverlayEl = document.getElementById("Mobile_stats_modal");
    const mobileTurnEl = document.getElementById("m-turn-value");
    const mobileScoreEl = document.getElementById("m-score-value");
    const mobileScoreBreakdownEl = document.getElementById("m-score-breakdown");

    const buildingInfoOverlayEl = document.getElementById("Building_info_modal");
    const buildingInfoOverlayContentEl = document.getElementById("building-info-modal-content");

    const mobileBuildMenuEl = document.getElementById("mobile-build-menu");

    function syncMobileVisibility() {
        const isMobile = isMobileViewport();

        // Menú inferior: solo móvil
        if (mobileBuildMenuEl) {
            // En desktop limpiamos el inline style para que Bootstrap (d-md-none) mande
            mobileBuildMenuEl.style.display = isMobile ? "block" : "";
        }

        // Botón de construcción: solo desktop
        if (openBuildingsBtnEl) {
            openBuildingsBtnEl.style.display = isMobile ? "none" : "";
        }
    }

    try { syncMobileVisibility(); } catch {}
    try { window.addEventListener("resize", syncMobileVisibility); } catch {}


    // ─── Música de fondo ───────────────────────────────────────────────────
    const bgmEl = document.getElementById("bgm");
    function startBgm() {
        if (!bgmEl) return;
        // Volumen suave por defecto
        try { bgmEl.volume = 0.25; } catch {}
        try {
            const p = bgmEl.play();
            if (p && typeof p.catch === "function") p.catch(()=>{});
        } catch {}
    }
    // Intentar arrancar con el primer gesto del usuario (autoplay suele bloquearse)
    try { document.addEventListener("pointerdown", startBgm, { once: true }); } catch {}

    // Si ya hubo Game Over, al volver lo restaura.
    // Nota: sessionStorage se pierde al cerrar la pestaña; localStorage persiste.
    try {
        const active = sessionStorage.getItem("gameOverActive") === "1"
            || localStorage.getItem("gameOverActive") === "1";
        if (active) {
            const reason = sessionStorage.getItem("gameOverReason")
                || localStorage.getItem("gameOverReason")
                || "Game Over";
            onGameOver(reason);
        }
    } catch {}

    // Si el storage no está disponible o se limpió, aun así aplica Game Over
    // si el estado guardado ya está en condición de colapso.
    try {
        const r = myCity.getResources?.();
        if (r) {
            if (r.getElectricity?.() < 0) onGameOver("¡Sin electricidad! La ciudad colapsó.");
            else if (r.getWater?.() < 0) onGameOver("¡Sin agua! La ciudad colapsó.");
        }
    } catch {}

    // Abrir ranking (modal)
    if (cityInfoEl) {
        cityInfoEl.addEventListener("click", function (e) {
            const t = e.target;
            if (t && t.id === "btn-scores") {
                try { e.preventDefault?.(); } catch {}
                openRankingModal();
            }
        });
    }

    // ─── 6. Renderizar mapa ──────────────────────────────────────────────────

    function renderMap() { // Dibuja el mapa completo en el DOM
        const grid   = myCity.getGrid(); // Modelo Grid (estado)
        const width  = grid.getWidth();  // Ancho del grid
        const height = grid.getHeight(); // Alto del grid

        gridEl.style.gridTemplateColumns = `repeat(${width}, 1fr)`;  // Define columnas CSS Grid
        gridEl.style.gridTemplateRows    = `repeat(${height}, 1fr)`; // Define filas CSS Grid

        if (grid.getCell().length === 0) { // Si no hay celdas creadas, las inicializa
            for (let y = 0; y < height; y++) // Recorre filas
                for (let x = 0; x < width; x++) // Recorre columnas
                    grid.Add_position(new Cell(x, y, "empty")); // Crea celda vacía en (x,y)
        }

        const imgMap = { // Mapa: tipo de edificio -> imagen
            house:"../../recourses/casa.png", apartment:"../../recourses/apartamento.png",
            shop:"../../recourses/tienda.png", mall:"../../recourses/centro-comercial.png",
            factory:"../../recourses/fabrica-electrica.png", farm:"../../recourses/granja.png",
            police:"../../recourses/estacion-de-policia.png", fire:"../../recourses/bombero.png",
            hospital:"../../recourses/hospital.png",
            electric_plant:"../../recourses/fabrica-electrica.png",
            water_plant:"../../recourses/filtro-de-agua.png",
            park:"../../recourses/naturaleza.png", road:"../../recourses/camino.png"
        };

        function cellImg(cell) { // Decide qué imagen mostrar en una celda
            if (!cell) return null; // Si no hay celda, no hay imagen
            if (cell.getRoad())     return imgMap.road; // Si hay vía, usa imagen de vía
            if (cell.getBuilding()) return imgMap[cell.getType()] || null; // Si hay edificio, usa imagen por tipo
            return null; // Celda vacía
        }
        function cellCls(cell) { // Decide qué clases CSS poner en una celda
            if (!cell) return ""; // Sin celda
            if (cell.getRoad())     return "cell-road"; // Clase para vía
            if (cell.getBuilding()) return `cell-building cell-${cell.getType()}`; // Clase para edificio + tipo
            return ""; // Celda vacía
        }

        let html = ""; // HTML acumulado para todas las celdas
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = grid.getCell().find(c => c.getX()===x && c.getY()===y); // Busca celda del modelo
                const img  = cellImg(cell); // Imagen a renderizar (o null)
                html += `<div class="cell ${cellCls(cell)}" data-x="${x}" data-y="${y}">` // Div de celda
                      + (img ? `<img src="${img}" class="cell-img" alt="">` : "") // Imagen si aplica
                      + `</div>`; // Cierra celda
            }
        }
        gridEl.innerHTML = html; // Inserta el grid en el DOM

        gridEl.querySelectorAll(".cell").forEach(d => // Para cada celda del DOM
            d.addEventListener("click", onCellClick)); // Agrega handler de click

        // Guardar helpers para refreshCell
        gridEl._imgMap = imgMap;   // Guarda mapa de imágenes en el elemento (para reusar)
        gridEl._cellImg = cellImg; // Guarda helper (para refreshCell)
        gridEl._cellCls = cellCls; // Guarda helper (para refreshCell)
    }

    function refreshCell(x, y) { // Redibuja SOLO una celda (más rápido que renderMap)
        const cell = myCity.getGrid().getCell().find(c => c.getX()===x && c.getY()===y); // Celda modelo
        const div  = gridEl.querySelector(`[data-x="${x}"][data-y="${y}"]`); // Celda DOM
        if (!div || !cell) return; // Si falta algo, no hace nada

        const imgMap = gridEl._imgMap; // Recupera el mapa de imágenes
        let img = null, cls = ""; // Defaults
        if (cell.getRoad())     { img = imgMap.road; cls = "cell-road"; } // Caso: vía
        else if (cell.getBuilding()) { img = imgMap[cell.getType()]||null; cls = `cell-building cell-${cell.getType()}`; } // Caso: edificio

        div.className = `cell ${cls}`; // Actualiza clases
        div.innerHTML = img ? `<img src="${img}" class="cell-img" alt="">` : ""; // Actualiza imagen
    }

    // ─── 7. Paneles info ─────────────────────────────────────────────────────

    function getResourceBreakdown() {
        let elecProd = 0, elecCons = 0, waterProd = 0, waterCons = 0;
        myCity.getBuildings().forEach(b => {
            if (b instanceof UtilityPlant) {
                if (b.getProductionType() === "electricity") elecProd += b.getProductionAmount();
                if (b.getProductionType() === "water") waterProd += b.getProductionAmount();
            }
            elecCons += b.getElectricityConsumption();
            waterCons += b.getWaterConsumption();
        });
        return { elecProd, elecCons, waterProd, waterCons };
    }

    function updateInfoPanels() { // Refresca panel de ciudad/recursos/score/turno
        if (cityInfoEl) cityInfoEl.innerHTML = `
            <p class="d-flex align-items-center justify-content-between mb-1">
                <strong>${myCity.getNameCity()}</strong>
                <button id="btn-scores" type="button" class="btn btn-sm btn-outline-coffee" data-bs-toggle="tooltip" data-bs-title="Puntajes">🏆</button>
            </p>
            <p class="mb-1">Alcalde: ${myCity.getNamePlayer()}</p>
            <p class="mb-0">Region: ${myCity.getLocation()}</p>`;

        const r = myCity.getResources(); // Atajo a recursos
        const { elecProd, elecCons, waterProd, waterCons } = getResourceBreakdown();
        if (resourcesEl) { // Si existe el panel de recursos en el DOM
            const mc = r.getMoney()>10000?"text-success":r.getMoney()<1000?"text-danger":"text-warning"; // Color del dinero
            resourcesEl.innerHTML = `
                <div class="resource-row"><span>💰 Dinero</span><span class="${mc}">$${r.getMoney().toLocaleString()}</span></div>
                <div class="resource-row"><span>⚡ Electricidad</span>
                    <span 
                        class="${r.getElectricity()<0?"text-danger":"text-light"}"
                        data-bs-toggle="tooltip" data-bs-title="Producción: ${elecProd} | Consumo: ${elecCons}">
                        ${elecProd} / ${elecCons}
                    </span>
                </div>
                <div class="resource-row"><span>💧 Agua</span>
                    <span 
                        class="${r.getWater()<0?"text-danger":"text-light"}"
                        data-bs-toggle="tooltip" data-bs-title="Producción: ${waterProd} | Consumo: ${waterCons}">
                        ${waterProd} / ${waterCons}
                    </span>
                </div>
                <div class="resource-row"><span>🌽 Alimentos</span><span class="text-light">${r.getFood()}</span></div>
                <div class="resource-row"><span>👥 Poblacion</span><span class="text-light">${myCity.getCitizens().length}</span></div>
                <div class="resource-row"><span>😊 Felicidad</span><span class="text-light">${getAvgHappiness()}%</span></div>`;
        }
        const scoreObj = myCity.getScore?.();
        if (scoreEl) scoreEl.textContent = scoreObj?.getTotal?.() ?? 0; // Muestra score

        // Stats en modal móvil
        if (mobileScoreEl) mobileScoreEl.textContent = scoreObj?.getTotal?.() ?? 0;

        const scoreBreakdownEl = document.getElementById("score-breakdown");
        if (scoreBreakdownEl && scoreObj) {
            const pop  = scoreObj.getPopulationPoints?.()  ?? 0;
            const hap  = scoreObj.getHappinessPoints?.()   ?? 0;
            const res  = scoreObj.getResourcePoints?.()    ?? 0;
            const bld  = scoreObj.getBuildingPoints?.()    ?? 0;
            const elec = scoreObj.getElectricityPoints?.() ?? 0;
            const wat  = scoreObj.getWaterPoints?.()       ?? 0;
            const bon  = scoreObj.getBonuses?.()           ?? 0;
            const pen  = scoreObj.getPenalties?.()         ?? 0;
            const tot  = scoreObj.getTotal?.()             ?? 0;

            // Tip informativo (hover) con el desglose
            scoreBreakdownEl.textContent = "Detalle";
            scoreBreakdownEl.style.cursor = "help";
            const scoreTipHtml = [
                `Población: +${pop}`,
                `Felicidad: +${hap}`,
                `Dinero: +${res}`,
                `Edificios: +${bld}`,
                `Electricidad: ${elec>=0?"+":""}${elec}`,
                `Agua: ${wat>=0?"+":""}${wat}`,
                `Bonos: +${bon}`,
                `Penalizaciones: -${pen}`,
                `Total: ${tot}`
            ].join("<br>");
            scoreBreakdownEl.setAttribute("data-bs-toggle", "tooltip");
            scoreBreakdownEl.setAttribute("data-bs-html", "true");
            scoreBreakdownEl.setAttribute("data-bs-title", scoreTipHtml);
            scoreBreakdownEl.removeAttribute("title");

            // Mismo detalle para el modal móvil
            if (mobileScoreBreakdownEl) {
                mobileScoreBreakdownEl.textContent = "Detalle";
                mobileScoreBreakdownEl.style.cursor = "help";
                mobileScoreBreakdownEl.setAttribute("data-bs-toggle", "tooltip");
                mobileScoreBreakdownEl.setAttribute("data-bs-html", "true");
                mobileScoreBreakdownEl.setAttribute("data-bs-title", scoreTipHtml);
                mobileScoreBreakdownEl.removeAttribute("title");
            }
        }
        if (turnEl)  turnEl.textContent  = myCity.getTurn(); // Muestra turno
        if (mobileTurnEl) mobileTurnEl.textContent = myCity.getTurn();

        refreshTooltips();
    }

    function refreshTooltips() {
        try {
            if (!window.bootstrap || !bootstrap.Tooltip) return;
            document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
                const inst = bootstrap.Tooltip.getInstance(el);
                if (inst) inst.dispose();
                new bootstrap.Tooltip(el, {
                    trigger: 'hover focus',
                    boundary: 'window'
                });
            });
        } catch (_) {
            // No bloquear el juego si falla el tooltip
        }
    }

    function getAvgHappiness() { // Promedio de felicidad de ciudadanos
        const c = myCity.getCitizens(); // Lista de ciudadanos
        if (!c.length) return 0; // Si no hay ciudadanos, felicidad 0
        return Math.round(c.reduce((s,ci)=>s+ci.getHappiness(),0)/c.length); // Suma felicidad / cantidad
    }

    function saveRankingSnapshot() {
        try {
            if (typeof Raking !== "function") return;
            const r = new Raking();
            r.loadRanking();

            const cityName = myCity.getNameCity();
            const mayor = myCity.getNamePlayer();
            const score = myCity.getScore()?.getTotal() ?? 0;
            const population = myCity.getCitizens()?.length ?? 0;
            const happiness = getAvgHappiness();
            const turns = myCity.getTurn();
            const date = new Date().toISOString();

            // Para resaltar en la pantalla de ranking
            try { sessionStorage.setItem("currentCityKey", String(cityName) + "|" + String(mayor)); } catch {}

            r.add({
                cityName,
                mayor,
                // Compatibilidad
                playerName: mayor,
                score,
                population,
                happiness,
                turns,
                date
            });
        } catch (e) {
            console.warn("No se pudo guardar en ranking:", e);
        }
    }

    // ─── 8. Clicks en el mapa ────────────────────────────────────────────────

    function onCellClick(e) { // Handler general de click sobre una celda
        const x = parseInt(e.currentTarget.dataset.x); // Lee coordenada x desde data-x
        const y = parseInt(e.currentTarget.dataset.y); // Lee coordenada y desde data-y
        if      (currentMode==="build")    handleBuild(x,y); // Modo construir
        else if (currentMode==="demolish") handleDemolish(x,y); // Modo demoler
        else if (currentMode==="route")    handleRoute(x,y); // Modo ruta
        else                               handleInfo(x,y); // Modo info (default)
    }

    function handleBuild(x,y) { // Construir en (x,y)
        if (!selectedType) return; // Si no hay tipo elegido, no hace nada
        const result = selectedType==="road" // Decide entre vía o edificio
            ? buildingService.placeRoad(myCity,x,y) // Intenta poner vía
            : buildingService.placeBuilding(myCity,selectedType,x,y); // Intenta poner edificio
        showToast(result.message, result.ok?"success":"danger"); // Notifica resultado
        if (result.ok) { refreshCell(x,y); updateInfoPanels(); saveCity(myCity); } // Si ok: actualiza UI y guarda
    }

    function handleDemolish(x,y) { // Demoler en (x,y)
        const cell = myCity.getGrid().getCell().find(c=>c.getX()===x&&c.getY()===y); // Busca celda modelo
        if (!cell||(!cell.getBuilding()&&!cell.getRoad())) { showToast("Nada que demoler.","warning"); return; } // Validación
        const name = cell.getBuilding()?cell.getBuilding().getName():"Via"; // Nombre para el confirm
        if (!confirm(`¿Demoler ${name}? Recuperas el 50%.`)) return; // Confirmación del usuario
        const result = buildingService.demolish(myCity,x,y); // Ejecuta demolición
        showToast(result.message, result.ok?"success":"danger"); // Notifica
        if (result.ok) { refreshCell(x,y); updateInfoPanels(); saveCity(myCity); } // Si ok: refresca + guarda
    }

    function handleRoute(x,y) { // Selección de origen/destino para ruta
        const cell = myCity.getGrid().getCell().find(c=>c.getX()===x&&c.getY()===y); // Celda clickeada
        if (!cell||!cell.getBuilding()) { showToast("Selecciona un edificio.","warning"); return; } // Solo edificios
        if (!routeOrigin) { // Si todavía no elegiste origen
            routeOrigin = cell.getBuilding(); // Guarda edificio origen
            const d = gridEl.querySelector(`[data-x="${x}"][data-y="${y}"]`); // Celda DOM
            if (d) d.classList.add("cell-route-origin"); // Marca visualmente el origen
            showToast(`Origen: ${routeOrigin.getName()}. Selecciona el destino.`,"info"); // Instrucción
        } else { // Ya hay origen; este click es el destino
            if (cell.getBuilding()===routeOrigin) { showToast("Destino diferente al origen.","warning"); return; } // Evita mismo edificio
            calcRoute(routeOrigin, cell.getBuilding()); // Calcula ruta entre ambos edificios
            routeOrigin = null; // Resetea para la próxima ruta
        }
    }

    async function calcRoute(origin, dest) { // Calcula y pinta una ruta
        showToast("Calculando ruta...","info"); // Feedback al usuario
        clearRouteHighlight(); // Limpia resaltados previos
        const result = await routingService.calculateRoute(myCity, origin, dest); // Llama al servicio de rutas
        if (!result.ok) { showToast(result.message,"danger"); return; } // Si falla, muestra error
        result.route.forEach(([row,col])=>{ // Recorre celdas de la ruta (row=y, col=x)
            const d = gridEl.querySelector(`[data-x="${col}"][data-y="${row}"]`); // Busca celda DOM
            if (d) { d.classList.add("cell-route"); highlightedCells.push(d); } // Resalta y guarda para limpiar
        });
        showToast(result.message,"success"); // Mensaje final
        setTimeout(clearRouteHighlight,5000); // Limpia resaltado después de 5s
    }

    function clearRouteHighlight() { // Quita clases CSS de ruta/origen
        highlightedCells.forEach(d=>d.classList.remove("cell-route","cell-route-origin")); // Limpia celdas guardadas
        highlightedCells=[]; // Resetea lista
        gridEl.querySelectorAll(".cell-route-origin").forEach(d=>d.classList.remove("cell-route-origin")); // Limpia origen
    }

    function handleInfo(x,y) {
        const cell = myCity.getGrid().getCell().find(c=>c.getX()===x&&c.getY()===y); // Celda clickeada
        if (!cell) return;
        const hasDesktopPanel = !!buildingInfoEl;
        const hasMobileModal = !!buildingInfoOverlayContentEl;
        if (!hasDesktopPanel && !hasMobileModal) return;

        function setInfoHtml(html) {
            if (buildingInfoEl) {
                buildingInfoEl.innerHTML = html;
                buildingInfoEl.style.display = "block";
            }
            if (buildingInfoOverlayContentEl) {
                buildingInfoOverlayContentEl.innerHTML = html;
            }
        }

        function openInfoOnMobileIfNeeded() {
            if (!buildingInfoOverlayEl) return;
            if (!isMobileViewport()) return;
            openOverlayModal(buildingInfoOverlayEl);
        }
        if (cell.getRoad()) { // Si es una vía
            const html = `
                <div class="d-flex align-items-center justify-content-between">
                    <h6 class="mb-0">Via</h6>
                    <button type="button" class="btn btn-sm btn-outline-light" data-close-building-info data-close-buildinginfo-modal>✕</button>
                </div>
                <p class="mb-1">(${x},${y})</p>
                <p class="mb-1">Costo: $100</p>
                <p class="mb-2">Producción/t: —</p>
                <button class="btn btn-sm btn-danger" onclick="demolishAt(${x},${y})">Demoler</button>`;
            setInfoHtml(html);
            openInfoOnMobileIfNeeded();
            return;
        }
        const b=cell.getBuilding(); // Edificio en la celda (si hay)
        if (!b) {
            if (buildingInfoEl) buildingInfoEl.style.display = "none";
            if (buildingInfoOverlayEl && isMobileViewport()) closeOverlayModal(buildingInfoOverlayEl);
            return;
        }

        function getProductionText(building) {
            // Producción/efecto usando getters existentes (sin ejecutar lógica de turno)
            if (building instanceof UtilityPlant) {
                const type = building.getProductionType();
                const amount = building.getProductionAmount();
                if (type === "electricity") return `⚡ +${amount}/t`;
                if (type === "water") return `💧 +${amount}/t`;
            }
            if (building instanceof CommercialBuilding) {
                const inc = building.getIncomePerTurn?.() ?? 0;
                const needsElec = (building.getElectricityConsumption?.() ?? 0) > 0;
                return `💰 +$${inc.toLocaleString()}/t${needsElec ? " (requiere ⚡)" : ""}`;
            }
            if (building instanceof IndustrialBuilding) {
                const type = building.getProductionType?.();
                const amount = building.getProducionAmount?.() ?? 0;
                const needsElec = (building.getElectricityConsumption?.() ?? 0) > 0;
                const needsWater = (building.getWaterConsumption?.() ?? 0) > 0;
                const hint = (needsElec || needsWater) ? " (50% si faltan recursos)" : "";
                if (type === "food") return `🌽 +${amount}/t${hint}`;
                if (type === "money") return `💰 +$${amount.toLocaleString()}/t${hint}`;
                return `+${amount}/t${hint}`;
            }
            if (building instanceof ServiceBuilding) {
                return `Efecto: +${building.getHappinessBoost()} felicidad`;
            }
            if (building instanceof Park) {
                return `Efecto: +${building.getHappinessBonus()} felicidad`;
            }
            return "—";
        }

        let extra=""; // HTML extra según tipo de edificio
        if (b instanceof ResidentialBuilding) {
            const residents = b.getCitizens();
            const avg = residents.length
                ? Math.round(residents.reduce((s,c)=>s+(c.getHappiness?.() ?? 0),0) / residents.length)
                : 0;
            extra = `<p class="mb-1">Capacidad: ${residents.length}/${b.getCapacity()}</p>
                     <p class="mb-1">Felicidad prom.: ${avg}%</p>`;
        }
        else if (b instanceof CommercialBuilding||b instanceof IndustrialBuilding) {
            extra = `<p class="mb-1">Empleados: ${b.getEmployees().length}/${b.getJobs()}</p>`;
        }
        else if (b instanceof ServiceBuilding) {
            extra = `<p class="mb-1">Radio: ${b.getRadius()} celdas</p>
                     <p class="mb-1">Bono: +${b.getHappinessBoost()} felicidad</p>`;
        }

        const productionText = getProductionText(b);
        const html = `
            <div class="d-flex align-items-center justify-content-between">
                <h6 class="mb-0">${b.getName()}</h6>
                <button type="button" class="btn btn-sm btn-outline-light" data-close-building-info data-close-buildinginfo-modal>✕</button>
            </div>
            <p class="mb-1">Costo: $${b.getCost().toLocaleString()}</p>
            <p class="mb-1">Mantenimiento/t: $${b.getMaintenanceCost()}</p>
            <p class="mb-1">Consumo/t: ⚡ ${b.getElectricityConsumption()} · 💧 ${b.getWaterConsumption()}</p>
            <p class="mb-2">Producción/t: ${productionText}</p>
            ${extra}
            <button class="btn btn-sm btn-danger" onclick="demolishAt(${x},${y})">Demoler</button>`;
        setInfoHtml(html);
        openInfoOnMobileIfNeeded();
    }

    window.demolishAt = function(x,y) {
        handleDemolish(x,y); // Reusa la lógica de demolición
        if (buildingInfoEl) buildingInfoEl.style.display="none"; // Oculta panel luego de demoler
    };

    // Cerrar panel de info (botón o click fuera)
    if (buildingInfoEl) {
        buildingInfoEl.addEventListener("click", function(e) {
            const btn = e.target?.closest?.("[data-close-building-info]");
            if (btn) {
                buildingInfoEl.style.display = "none";
            }
            // Evita que el click dentro del panel lo cierre por el handler global
            try { e.stopPropagation(); } catch {}
        });

        document.addEventListener("click", function(e) {
            // Si el usuario está clickeando el mapa (una celda), dejamos que el flujo de handleInfo controle
            if (e.target?.closest?.(".cell")) return;
            if (buildingInfoEl.style.display === "block") {
                buildingInfoEl.style.display = "none";
            }
        });
    }

    // Cerrar modal móvil de info edificio
    if (buildingInfoOverlayEl) {
        buildingInfoOverlayEl.addEventListener("click", function (e) {
            const closeEl = e.target?.closest?.("[data-close-buildinginfo-modal]");
            if (closeEl) closeOverlayModal(buildingInfoOverlayEl);
        });
    }

    // ─── 9. Menu edificios ───────────────────────────────────────────────────

    document.querySelectorAll(".building-item[data-type]").forEach(item=>{ // Lista de items del menú de edificios
        item.addEventListener("click",function(){ // Click en un tipo de edificio
            selectedType=this.dataset.type; // Guarda el tipo elegido
            setMode("build"); // Pone el modo en construir
            document.querySelectorAll(".building-item").forEach(i=>i.classList.remove("selected")); // Limpia selección previa
            this.classList.add("selected"); // Marca el item actual
            const lbl=this.querySelector(".building-name"); // Intenta leer el nombre visible
            showToast(`Construir: ${lbl?lbl.textContent:selectedType}`,"info"); // Mensaje de modo construir

            // Si el menú está en modal, lo cerramos y dejamos listo para construir
            try { closeBuildingsModal(); } catch {}
        });
    });

    // ─── 10. Botones ─────────────────────────────────────────────────────────

    if (demolishBtn) demolishBtn.addEventListener("click",function(){
        if (currentMode==="demolish") { setMode("none"); showToast("Demolicion desactivada.","secondary"); } // Si estaba activo, lo apaga
        else { setMode("demolish"); showToast("Clic en edificio o via para demoler.","warning"); } // Si estaba apagado, lo activa
    });

    if (routeBtn) routeBtn.addEventListener("click",function(){
        if (currentMode==="route") { setMode("none"); clearRouteHighlight(); routeOrigin=null; showToast("Ruta desactivada.","secondary"); } // Apaga ruta
        else { setMode("route"); showToast("Selecciona el edificio origen.","info"); } // Activa ruta
    });

    if (pauseBtn) pauseBtn.addEventListener("click",function(){
        startBgm();
        const speed = parseInt(turnSpeedInput?.value)||10; // Velocidad de turnos (segundos)
        const rate  = parseInt(growthInput?.value)||3; // Tasa de crecimiento de ciudadanos
        if (turnService.isRunning()) { // Si ya está corriendo
            turnService.stopTimer(); // Pausa el timer
            this.textContent="▶ Reanudar"; // Cambia texto del botón
        } else { // Si está pausado
            turnService.startTimer(myCity, speed, { growthRate:rate, onTurnEnd, onGameOver }); // Arranca turnos automáticos
            this.textContent="⏸ Pausar"; // Cambia texto del botón
        }
    });

    if (saveBtn) saveBtn.addEventListener("click",function(){
        // 1) Guardar puntaje en ranking (localStorage)
        saveRankingSnapshot();

        // 2) Guardar partida (ciudad) en localStorage
        saveCity(myCity); // Guarda manualmente

        // 3) Exportar a archivo JSON
        try {
            if (typeof exportCityToJsonFile === "function") {
                exportCityToJsonFile(myCity);
                showToast("Partida exportada a JSON.","success");
            } else {
                showToast("Export JSON no disponible.","warning");
            }
        } catch (e) {
            console.warn("No se pudo exportar JSON:", e);
            showToast("No se pudo exportar el JSON.","danger");
        }

        showToast("Partida guardada.","success");
    });

    // ─── 10.1 Atajos de teclado ────────────────────────────────────────────

    const gameOverOverlayEl = document.getElementById("Game_over_modal");
    const rankingOverlayEl = document.getElementById("Ranking_modal");
    const buildingsOverlayEl = document.getElementById("Buildings_modal");

    function isTypingInInput(target) {
        if (!target) return false;
        const tag = (target.tagName || "").toLowerCase();
        return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
    }

    function isGameOverOverlayActive() {
        return !!(gameOverOverlayEl && !gameOverOverlayEl.hidden);
    }

    function isRankingOverlayActive() {
        return !!(rankingOverlayEl && !rankingOverlayEl.hidden);
    }

    function isBuildingsOverlayActive() {
        return !!(buildingsOverlayEl && !buildingsOverlayEl.hidden);
    }

    function openRankingModal() {
        if (isGameOverOverlayActive()) return;
        if (!rankingOverlayEl) return;
        openOverlayModal(rankingOverlayEl);
        try {
            if (typeof window.refreshRankingUI === "function") window.refreshRankingUI();
        } catch {}
    }

    function closeRankingModal() {
        if (!rankingOverlayEl) return;
        closeOverlayModal(rankingOverlayEl);
    }

    function openBuildingsModal() {
        if (isGameOverOverlayActive()) return;
        if (!buildingsOverlayEl) return;
        openOverlayModal(buildingsOverlayEl);
    }

    function closeBuildingsModal() {
        if (!buildingsOverlayEl) return;
        closeOverlayModal(buildingsOverlayEl);
    }

    function toggleBuildingsModal() {
        if (isBuildingsOverlayActive()) closeBuildingsModal();
        else openBuildingsModal();
    }

    document.addEventListener("keydown", function (e) {
        if (!e) return;
        if (e.repeat) return;
        if (isGameOverOverlayActive()) return;
        if (isRankingOverlayActive() && e.key === "Escape") {
            closeRankingModal();
            return;
        }
        if (isBuildingsOverlayActive() && e.key === "Escape") {
            closeBuildingsModal();
            return;
        }
        if (isTypingInInput(e.target)) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const key = (e.key || "").toLowerCase();

        // ESC: cancelar modo actual
        if (e.key === "Escape") {
            setMode("none");
            return;
        }

        // Space: pausar/reanudar (evita scroll)
        if (e.code === "Space" || e.key === " ") {
            e.preventDefault();
            pauseBtn?.click();
            return;
        }

        // B: abrir menú de construcción
        if (key === "b") {
            if (!isMobileViewport()) toggleBuildingsModal();
            return;
        }

        // R: modo construcción de vías (selecciona el item road)
        if (key === "r") {
            if (!isBuildingsOverlayActive()) openBuildingsModal();
            const roadItem = document.querySelector('.building-item[data-type="road"]');
            if (roadItem) roadItem.click();
            else {
                selectedType = "road";
                setMode("build");
            }
            return;
        }

        // D: modo demolición
        if (key === "d") {
            demolishBtn?.click();
            return;
        }

        // S: guardar partida
        if (key === "s") {
            try {
                saveCity(myCity);
                showToast("Partida guardada.", "success");
            } catch (e) {
                console.warn("No se pudo guardar la partida:", e);
                showToast("No se pudo guardar la partida.", "danger");
            }
            return;
        }
    });

    // ─── 10.2 Modal Ranking (HU-019) ───────────────────────────────────────
    // Se abre desde el botón 🏆 del panel de ciudad (#btn-scores)

    if (rankingOverlayEl) {
        rankingOverlayEl.addEventListener("click", function (e) {
            const closeEl = e.target?.closest?.("[data-close-ranking-modal]");
            if (closeEl) {
                closeRankingModal();
            }
        });
    }

    // ─── 10.3 Modal Construcción ──────────────────────────────────────────
    if (openBuildingsBtnEl) {
        openBuildingsBtnEl.addEventListener("click", function () {
            openBuildingsModal();
        });
    }

    if (buildingsOverlayEl) {
        buildingsOverlayEl.addEventListener("click", function (e) {
            const closeEl = e.target?.closest?.("[data-close-buildings-modal]");
            if (closeEl) closeBuildingsModal();
        });
    }

    // ─── 11. Modo ────────────────────────────────────────────────────────────

    function setMode(mode) {
        currentMode=mode; // Guarda el modo actual
        if (mode!=="build") selectedType=null; // Si no estás construyendo, borra tipo seleccionado
        if (mode!=="route") { routeOrigin=null; clearRouteHighlight(); } // Si no estás en ruta, limpia selección/colores
        gridEl.style.cursor=mode==="none"?"default":"crosshair"; // Cambia cursor según modo
        if (demolishBtn) demolishBtn.classList.toggle("btn-warning",mode==="demolish"); // Resalta botón demoler
        if (routeBtn)    routeBtn.classList.toggle("btn-info",mode==="route"); // Resalta botón ruta
        if (mode!=="build") document.querySelectorAll(".building-item").forEach(i=>i.classList.remove("selected")); // Limpia menú
        if (modeIndicator) modeIndicator.textContent={none:"",build:"Construyendo",demolish:"Demoliendo",route:"Trazando ruta"}[mode]||""; // Texto de estado
    }

    // ─── 12. Callbacks TurnService ───────────────────────────────────────────

    function onTurnEnd() {
        updateInfoPanels();
        // Guardar ranking en cada turno (score en tiempo real)
        saveRankingSnapshot();
    } // Al terminar un turno: refrescar paneles
    function onGameOver(msg) {
        try {
            sessionStorage.setItem("gameOverActive", "1");
            sessionStorage.setItem("gameOverReason", msg ?? "Game Over");
        } catch {}

        // Persistir también para cuando se cierre completamente y se vuelva a abrir.
        try {
            localStorage.setItem("gameOverActive", "1");
            localStorage.setItem("gameOverReason", msg ?? "Game Over");
        } catch {}

        if (pauseBtn) pauseBtn.textContent="▶ Iniciar"; // Deja el botón listo para iniciar
        const goEl = document.getElementById("Game_over_modal");
        if (!goEl) {
            console.warn("GAME OVER (sin #Game_over_modal):", msg);
            return;
        }
        // Motivo
        const reasonEl = goEl.querySelector("[data-gameover-reason]");
        if (reasonEl) reasonEl.textContent = msg;
        else goEl.textContent = msg;

        // Mostrar overlay
        openOverlayModal(goEl);

        // Bloquear interacción (no modificar nada)
        try { if (typeof turnService?.stopTimer === "function") turnService.stopTimer(); } catch {}
        try { setMode("none"); } catch {}

        if (gridEl) gridEl.style.pointerEvents = "none";
        const mapViewport = document.getElementById("map-viewport");
        if (mapViewport) mapViewport.style.pointerEvents = "none";

        // Deshabilitar botones principales (evita cambios de estado)
        if (pauseBtn) pauseBtn.disabled = true;
        if (saveBtn) saveBtn.disabled = true;
        if (demolishBtn) demolishBtn.disabled = true;
        if (routeBtn) routeBtn.disabled = true;

        // Cerrar/deshabilitar construcción
        try { closeOverlayModal(document.getElementById("Buildings_modal")); } catch {}
        const buildBtn = document.getElementById("btn-open-buildings");
        if (buildBtn) buildBtn.disabled = true;

        // Nota: ya no hay acordeón; construcción es modal
    }

    // ─── 13. Toast ───────────────────────────────────────────────────────────

    function showToast(msg, type="info") {
        let c=document.getElementById("toast-container"); // Contenedor de toasts
        if (!c) { // Si no existe, lo crea
            c=document.createElement("div"); // Crea el div contenedor
            c.id="toast-container"; // ID para encontrarlo luego
            // En móvil se muestran arriba; en desktop se mantienen abajo/derecha
            if (isMobileViewport()) {
                c.style.cssText="position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;";
            } else {
                c.style.cssText="position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;"; // Posición
            }
            document.body.appendChild(c); // Lo agrega al body
        }
        const t=document.createElement("div"); // Crea un toast
        t.className=`alert alert-${type} py-2 px-3 mb-0`; // Usa clases bootstrap
        t.style.cssText="min-width:220px;max-width:320px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.3);"; // Estilo
        t.textContent=msg; // Texto a mostrar
        c.appendChild(t); // Agrega el toast al contenedor
        setTimeout(()=>t.remove(),3000); // Quita el toast luego de 3s
    }

    // ─── 13.1 Stats móvil (HU-022) ───────────────────────────────────────
    function openMobileStats() {
        if (!mobileStatsOverlayEl) return;
        openOverlayModal(mobileStatsOverlayEl);
    }

    function closeMobileStats() {
        if (!mobileStatsOverlayEl) return;
        closeOverlayModal(mobileStatsOverlayEl);
    }

    if (mobileStatsBtnEl) {
        mobileStatsBtnEl.addEventListener("click", function () {
            openMobileStats();
        });
    }

    if (mobileStatsOverlayEl) {
        mobileStatsOverlayEl.addEventListener("click", function (e) {
            const closeEl = e.target?.closest?.("[data-close-mobile-stats]");
            if (closeEl) closeMobileStats();
        });
    }

    // ─── 14. Guardado automatico cada 30s ────────────────────────────────────
    setInterval(function(){
        // 1) Guardar partida
        try { saveCity(myCity); } catch (e) {}

        // 2) Guardar ranking
        saveRankingSnapshot();
    },30000); // Autoguardado cada 30 segundos

    // ─── 15. Arranque ────────────────────────────────────────────────────────
    renderMap(); // Dibuja el mapa
    updateInfoPanels(); // Dibuja paneles
    // ─── Configuración dinámica de recursos ───────────────────

    document.getElementById("init-electricity")?.addEventListener("change", function() {
        myCity.getResources().setElectricity(parseInt(this.value) || 0);
        updateInfoPanels();
        saveCity(myCity);
    });

    document.getElementById("init-water")?.addEventListener("change", function() {
        myCity.getResources().setWater(parseInt(this.value) || 0);
        updateInfoPanels();
        saveCity(myCity);
    });

    document.getElementById("init-food")?.addEventListener("change", function() {
        myCity.getResources().setFood(parseInt(this.value) || 0);
        updateInfoPanels();
        saveCity(myCity);
    });

    document.getElementById("service-bonus")?.addEventListener("change", function() {
        const val = parseInt(this.value) || 10;

        myCity.getBuildings().forEach(b => {
            if (b instanceof ServiceBuilding) b.setHappinessBoost(val);
        });

        updateInfoPanels();
        saveCity(myCity);
    });

    if (myCity.getClimate()) weatherPrint(myCity.getClimate()); // Si hay clima, lo muestra
    if (myCity.getNews())    newsPrint(myCity.getNews()); // Si hay noticias, las muestra

    // Actualizar clima y noticias cada 30 minutos
    setInterval(()=>{ // Timer para refrescar clima y noticias
        myCity.ensureClimate().then(()=>weatherPrint(myCity.getClimate())).catch(()=>{}); // Pide clima y lo pinta
        myCity.ensureNews().then(()=>newsPrint(myCity.getNews())).catch(()=>{}); // Pide noticias y las pinta
    }, 1800000); // 30 minutos

    if (pauseBtn) pauseBtn.textContent="▶ Iniciar"; // Texto inicial del botón
});
