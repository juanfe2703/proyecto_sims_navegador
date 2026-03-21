/**
 * game_controller.js
 * Unico punto de entrada del juego via DOMContentLoaded.
 * Map.js solo define funciones (weatherPrint, newsPrint, initMap).
 */

document.addEventListener("DOMContentLoaded", function () { // Ejecuta cuando el HTML ya cargó

    // ─── 1. Cargar ciudad ────────────────────────────────────────────────────
    const myCity = loadCityFromStorage(); // Intenta cargar la ciudad desde localStorage

    if (!myCity) { // Si no hay partida guardada
        alert("No hay partida guardada. Redirigiendo..."); // Avisa al usuario
        window.location.href = "City_Setup_Panel.html"; // Vuelve al panel de setup
        return; // Corta el arranque del juego
    }

    if (!myCity.getResources()) myCity.setResources(new Resources(50000, 0, 0, 0)); // Asegura recursos mínimos
    if (!myCity.getScore())     myCity.setScore(new Score()); // Asegura que exista score

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
    const turnSpeedInput = document.getElementById("turn-speed");
    const growthInput    = document.getElementById("growth-rate");

    // Navegar a la vista de puntajes (ranking)
    if (cityInfoEl) {
        cityInfoEl.addEventListener("click", function (e) {
            const t = e.target;
            if (t && t.id === "btn-scores") {
                window.location.href = "Raking.html";
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

    function updateInfoPanels() { // Refresca panel de ciudad/recursos/score/turno
        if (cityInfoEl) cityInfoEl.innerHTML = `
            <p class="d-flex align-items-center justify-content-between mb-1">
                <strong>${myCity.getNameCity()}</strong>
                <button id="btn-scores" type="button" class="btn btn-sm btn-outline-light">Puntajes</button>
            </p>
            <p class="mb-1">Alcalde: ${myCity.getNamePlayer()}</p>
            <p class="mb-0">Region: ${myCity.getLocation()}</p>`;

        const r = myCity.getResources(); // Atajo a recursos
        if (resourcesEl) { // Si existe el panel de recursos en el DOM
            const mc = r.getMoney()>10000?"text-success":r.getMoney()<1000?"text-danger":"text-warning"; // Color del dinero
            resourcesEl.innerHTML = `
                <div class="resource-row"><span>💰 Dinero</span><span class="${mc}">$${r.getMoney().toLocaleString()}</span></div>
                <div class="resource-row"><span>⚡ Electricidad</span><span class="${r.getElectricity()<0?"text-danger":"text-light"}">${r.getElectricity()}</span></div>
                <div class="resource-row"><span>💧 Agua</span><span class="${r.getWater()<0?"text-danger":"text-light"}">${r.getWater()}</span></div>
                <div class="resource-row"><span>🌽 Alimentos</span><span class="text-light">${r.getFood()}</span></div>
                <div class="resource-row"><span>👥 Poblacion</span><span class="text-light">${myCity.getCitizens().length}</span></div>
                <div class="resource-row"><span>😊 Felicidad</span><span class="text-light">${getAvgHappiness()}%</span></div>`;
        }
        if (scoreEl) scoreEl.textContent = myCity.getScore()?.getTotal() ?? 0; // Muestra score
        if (turnEl)  turnEl.textContent  = myCity.getTurn(); // Muestra turno
    }

    function getAvgHappiness() { // Promedio de felicidad de ciudadanos
        const c = myCity.getCitizens(); // Lista de ciudadanos
        if (!c.length) return 0; // Si no hay ciudadanos, felicidad 0
        return Math.round(c.reduce((s,ci)=>s+ci.getHappiness(),0)/c.length); // Suma felicidad / cantidad
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
        if (!cell||!buildingInfoEl) return; // Si no hay celda o panel, no hace nada
        if (cell.getRoad()) { // Si es una vía
            buildingInfoEl.innerHTML=`<h6>Via</h6><p>(${x},${y})</p><p>Costo: $100</p>
                <button class="btn btn-sm btn-danger mt-2" onclick="demolishAt(${x},${y})">Demoler</button>`;
            buildingInfoEl.style.display="block"; return; // Muestra panel y termina
        }
        const b=cell.getBuilding(); // Edificio en la celda (si hay)
        if (!b) { buildingInfoEl.style.display="none"; return; } // Si no hay edificio, oculta panel
        let extra=""; // HTML extra según tipo de edificio
        if (b instanceof ResidentialBuilding) extra=`<p>Capacidad: ${b.getCitizens().length}/${b.getCapacity()}</p>`; // Viviendas
        else if (b instanceof CommercialBuilding||b instanceof IndustrialBuilding) extra=`<p>Empleados: ${b.getEmployees().length}/${b.getJobs()}</p>`; // Trabajos
        else if (b instanceof ServiceBuilding) extra=`<p>Radio: ${b.getRadius()} · +${b.getHappinessBoost()} felicidad</p>`; // Servicios
        buildingInfoEl.innerHTML=`<h6>${b.getName()}</h6>
            <p>Costo: $${b.getCost().toLocaleString()}</p>
            <p>Mantenimiento/t: $${b.getMaintenanceCost()}</p>
            <p>⚡ ${b.getElectricityConsumption()} u/t · 💧 ${b.getWaterConsumption()} u/t</p>
            ${extra}
            <button class="btn btn-sm btn-danger mt-2" onclick="demolishAt(${x},${y})">Demoler</button>`;
        buildingInfoEl.style.display="block"; // Muestra panel
    }

    window.demolishAt = function(x,y) {
        handleDemolish(x,y); // Reusa la lógica de demolición
        if (buildingInfoEl) buildingInfoEl.style.display="none"; // Oculta panel luego de demoler
    };

    // ─── 9. Menu edificios ───────────────────────────────────────────────────

    document.querySelectorAll(".building-item[data-type]").forEach(item=>{ // Lista de items del menú de edificios
        item.addEventListener("click",function(){ // Click en un tipo de edificio
            selectedType=this.dataset.type; // Guarda el tipo elegido
            setMode("build"); // Pone el modo en construir
            document.querySelectorAll(".building-item").forEach(i=>i.classList.remove("selected")); // Limpia selección previa
            this.classList.add("selected"); // Marca el item actual
            const lbl=this.querySelector(".building-name"); // Intenta leer el nombre visible
            showToast(`Construir: ${lbl?lbl.textContent:selectedType}`,"info"); // Mensaje de modo construir
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
        // 1) Guardar puntaje en ranking (localStorage) usando la clase Raking
        try {
            if (typeof Raking === "function") {
                const r = new Raking();
                r.loadRanking();
                r.add({
                    cityName: myCity.getNameCity(),
                    playerName: myCity.getNamePlayer(),
                    score: myCity.getScore()?.getTotal() ?? 0,
                    date: new Date().toLocaleString()
                });
            }
        } catch (e) {
            console.warn("No se pudo guardar en ranking:", e);
        }

        // 2) Guardar partida (ciudad) en localStorage
        saveCity(myCity); showToast("Partida guardada.","success"); // Guarda manualmente y avisa
    });

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

    function onTurnEnd() { updateInfoPanels(); } // Al terminar un turno: refrescar paneles
    function onGameOver(msg) {
        if (pauseBtn) pauseBtn.textContent="▶ Iniciar"; // Deja el botón listo para iniciar
        alert("GAME OVER: "+msg); // Muestra motivo de fin de partida
    }

    // ─── 13. Toast ───────────────────────────────────────────────────────────

    function showToast(msg, type="info") {
        let c=document.getElementById("toast-container"); // Contenedor de toasts
        if (!c) { // Si no existe, lo crea
            c=document.createElement("div"); // Crea el div contenedor
            c.id="toast-container"; // ID para encontrarlo luego
            c.style.cssText="position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;"; // Posición
            document.body.appendChild(c); // Lo agrega al body
        }
        const t=document.createElement("div"); // Crea un toast
        t.className=`alert alert-${type} py-2 px-3 mb-0`; // Usa clases bootstrap
        t.style.cssText="min-width:220px;max-width:320px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.3);"; // Estilo
        t.textContent=msg; // Texto a mostrar
        c.appendChild(t); // Agrega el toast al contenedor
        setTimeout(()=>t.remove(),3000); // Quita el toast luego de 3s
    }

    // ─── 14. Guardado automatico cada 30s ────────────────────────────────────
    setInterval(()=>saveCity(myCity),30000); // Autoguardado cada 30 segundos

    // ─── 15. Arranque ────────────────────────────────────────────────────────
    renderMap(); // Dibuja el mapa
    updateInfoPanels(); // Dibuja paneles

    if (myCity.getClimate()) weatherPrint(myCity.getClimate()); // Si hay clima, lo muestra
    if (myCity.getNews())    newsPrint(myCity.getNews()); // Si hay noticias, las muestra

    // Actualizar clima y noticias cada 30 minutos
    setInterval(()=>{ // Timer para refrescar clima y noticias
        myCity.ensureClimate().then(()=>weatherPrint(myCity.getClimate())).catch(()=>{}); // Pide clima y lo pinta
        myCity.ensureNews().then(()=>newsPrint(myCity.getNews())).catch(()=>{}); // Pide noticias y las pinta
    }, 1800000); // 30 minutos

    if (pauseBtn) pauseBtn.textContent="▶ Iniciar"; // Texto inicial del botón
    console.log("✓ Juego listo |", myCity.getNameCity(),
                "| Grid:", myCity.getGrid().getWidth()+"x"+myCity.getGrid().getHeight(),
                "| Edificios:", myCity.getBuildings().length);
});
