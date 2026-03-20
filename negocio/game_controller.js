/**
 * game_controller.js
 * Unico punto de entrada del juego via DOMContentLoaded.
 * Map.js solo define funciones (weatherPrint, newsPrint, initMap).
 */

document.addEventListener("DOMContentLoaded", function () {

    // ─── 1. Cargar ciudad ────────────────────────────────────────────────────
    const myCity = loadCityFromStorage();

    if (!myCity) {
        alert("No hay partida guardada. Redirigiendo...");
        window.location.href = "City_Setup_Panel.html";
        return;
    }

    if (!myCity.getResources()) myCity.setResources(new Resources(50000, 0, 0, 0));
    if (!myCity.getScore())     myCity.setScore(new Score());

    window.gameCity = myCity;

    // ─── 2. Inicializar Map.js (zoom) ────────────────────────────────────────
    if (typeof initMap === "function") initMap();

    // ─── 3. Servicios ────────────────────────────────────────────────────────
    const buildingService = new BuildingService();
    const turnService     = new TurnService();
    const routingService  = new RoutingService();

    // ─── 4. Estado ───────────────────────────────────────────────────────────
    let currentMode      = "none";
    let selectedType     = null;
    let routeOrigin      = null;
    let highlightedCells = [];

    // ─── 5. DOM ──────────────────────────────────────────────────────────────
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

    // ─── 6. Renderizar mapa ──────────────────────────────────────────────────

    function renderMap() {
        const grid   = myCity.getGrid();
        const width  = grid.getWidth();
        const height = grid.getHeight();

        gridEl.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
        gridEl.style.gridTemplateRows    = `repeat(${height}, 1fr)`;

        if (grid.getCell().length === 0) {
            for (let y = 0; y < height; y++)
                for (let x = 0; x < width; x++)
                    grid.Add_position(new Cell(x, y, "empty"));
        }

        const imgMap = {
            house:"../../recourses/casa.png", apartment:"../../recourses/apartamento.png",
            shop:"../../recourses/tienda.png", mall:"../../recourses/centro-comercial.png",
            factory:"../../recourses/fabrica-electrica.png", farm:"../../recourses/granja.png",
            police:"../../recourses/estacion-de-policia.png", fire:"../../recourses/bombero.png",
            hospital:"../../recourses/hospital.png",
            electric_plant:"../../recourses/fabrica-electrica.png",
            water_plant:"../../recourses/filtro-de-agua.png",
            park:"../../recourses/naturaleza.png", road:"../../recourses/camino.png"
        };

        function cellImg(cell) {
            if (!cell) return null;
            if (cell.getRoad())     return imgMap.road;
            if (cell.getBuilding()) return imgMap[cell.getType()] || null;
            return null;
        }
        function cellCls(cell) {
            if (!cell) return "";
            if (cell.getRoad())     return "cell-road";
            if (cell.getBuilding()) return `cell-building cell-${cell.getType()}`;
            return "";
        }

        let html = "";
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = grid.getCell().find(c => c.getX()===x && c.getY()===y);
                const img  = cellImg(cell);
                html += `<div class="cell ${cellCls(cell)}" data-x="${x}" data-y="${y}">`
                      + (img ? `<img src="${img}" class="cell-img" alt="">` : "")
                      + `</div>`;
            }
        }
        gridEl.innerHTML = html;

        gridEl.querySelectorAll(".cell").forEach(d =>
            d.addEventListener("click", onCellClick));

        // Guardar helpers para refreshCell
        gridEl._imgMap = imgMap;
        gridEl._cellImg = cellImg;
        gridEl._cellCls = cellCls;
    }

    function refreshCell(x, y) {
        const cell = myCity.getGrid().getCell().find(c => c.getX()===x && c.getY()===y);
        const div  = gridEl.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (!div || !cell) return;

        const imgMap = gridEl._imgMap;
        let img = null, cls = "";
        if (cell.getRoad())     { img = imgMap.road; cls = "cell-road"; }
        else if (cell.getBuilding()) { img = imgMap[cell.getType()]||null; cls = `cell-building cell-${cell.getType()}`; }

        div.className = `cell ${cls}`;
        div.innerHTML = img ? `<img src="${img}" class="cell-img" alt="">` : "";
    }

    // ─── 7. Paneles info ─────────────────────────────────────────────────────

    function updateInfoPanels() {
        if (cityInfoEl) cityInfoEl.innerHTML = `
            <p><strong>${myCity.getNameCity()}</strong></p>
            <p>Alcalde: ${myCity.getNamePlayer()}</p>
            <p>Region: ${myCity.getLocation()}</p>`;

        const r = myCity.getResources();
        if (resourcesEl) {
            const mc = r.getMoney()>10000?"text-success":r.getMoney()<1000?"text-danger":"text-warning";
            resourcesEl.innerHTML = `
                <div class="resource-row"><span>💰 Dinero</span><span class="${mc}">$${r.getMoney().toLocaleString()}</span></div>
                <div class="resource-row"><span>⚡ Electricidad</span><span class="${r.getElectricity()<0?"text-danger":"text-light"}">${r.getElectricity()}</span></div>
                <div class="resource-row"><span>💧 Agua</span><span class="${r.getWater()<0?"text-danger":"text-light"}">${r.getWater()}</span></div>
                <div class="resource-row"><span>🌽 Alimentos</span><span class="text-light">${r.getFood()}</span></div>
                <div class="resource-row"><span>👥 Poblacion</span><span class="text-light">${myCity.getCitizens().length}</span></div>
                <div class="resource-row"><span>😊 Felicidad</span><span class="text-light">${getAvgHappiness()}%</span></div>`;
        }
        if (scoreEl) scoreEl.textContent = myCity.getScore()?.getTotal() ?? 0;
        if (turnEl)  turnEl.textContent  = myCity.getTurn();
    }

    function getAvgHappiness() {
        const c = myCity.getCitizens();
        if (!c.length) return 0;
        return Math.round(c.reduce((s,ci)=>s+ci.getHappiness(),0)/c.length);
    }

    // ─── 8. Clicks en el mapa ────────────────────────────────────────────────

    function onCellClick(e) {
        const x = parseInt(e.currentTarget.dataset.x);
        const y = parseInt(e.currentTarget.dataset.y);
        if      (currentMode==="build")    handleBuild(x,y);
        else if (currentMode==="demolish") handleDemolish(x,y);
        else if (currentMode==="route")    handleRoute(x,y);
        else                               handleInfo(x,y);
    }

    function handleBuild(x,y) {
        if (!selectedType) return;
        const result = selectedType==="road"
            ? buildingService.placeRoad(myCity,x,y)
            : buildingService.placeBuilding(myCity,selectedType,x,y);
        showToast(result.message, result.ok?"success":"danger");
        if (result.ok) { refreshCell(x,y); updateInfoPanels(); saveCity(myCity); }
    }

    function handleDemolish(x,y) {
        const cell = myCity.getGrid().getCell().find(c=>c.getX()===x&&c.getY()===y);
        if (!cell||(!cell.getBuilding()&&!cell.getRoad())) { showToast("Nada que demoler.","warning"); return; }
        const name = cell.getBuilding()?cell.getBuilding().getName():"Via";
        if (!confirm(`¿Demoler ${name}? Recuperas el 50%.`)) return;
        const result = buildingService.demolish(myCity,x,y);
        showToast(result.message, result.ok?"success":"danger");
        if (result.ok) { refreshCell(x,y); updateInfoPanels(); saveCity(myCity); }
    }

    function handleRoute(x,y) {
        const cell = myCity.getGrid().getCell().find(c=>c.getX()===x&&c.getY()===y);
        if (!cell||!cell.getBuilding()) { showToast("Selecciona un edificio.","warning"); return; }
        if (!routeOrigin) {
            routeOrigin = cell.getBuilding();
            const d = gridEl.querySelector(`[data-x="${x}"][data-y="${y}"]`);
            if (d) d.classList.add("cell-route-origin");
            showToast(`Origen: ${routeOrigin.getName()}. Selecciona el destino.`,"info");
        } else {
            if (cell.getBuilding()===routeOrigin) { showToast("Destino diferente al origen.","warning"); return; }
            calcRoute(routeOrigin, cell.getBuilding());
            routeOrigin = null;
        }
    }

    async function calcRoute(origin, dest) {
        showToast("Calculando ruta...","info");
        clearRouteHighlight();
        const result = await routingService.calculateRoute(myCity, origin, dest);
        if (!result.ok) { showToast(result.message,"danger"); return; }
        result.route.forEach(([row,col])=>{
            const d = gridEl.querySelector(`[data-x="${col}"][data-y="${row}"]`);
            if (d) { d.classList.add("cell-route"); highlightedCells.push(d); }
        });
        showToast(result.message,"success");
        setTimeout(clearRouteHighlight,5000);
    }

    function clearRouteHighlight() {
        highlightedCells.forEach(d=>d.classList.remove("cell-route","cell-route-origin"));
        highlightedCells=[];
        gridEl.querySelectorAll(".cell-route-origin").forEach(d=>d.classList.remove("cell-route-origin"));
    }

    function handleInfo(x,y) {
        const cell = myCity.getGrid().getCell().find(c=>c.getX()===x&&c.getY()===y);
        if (!cell||!buildingInfoEl) return;
        if (cell.getRoad()) {
            buildingInfoEl.innerHTML=`<h6>Via</h6><p>(${x},${y})</p><p>Costo: $100</p>
                <button class="btn btn-sm btn-danger mt-2" onclick="demolishAt(${x},${y})">Demoler</button>`;
            buildingInfoEl.style.display="block"; return;
        }
        const b=cell.getBuilding();
        if (!b) { buildingInfoEl.style.display="none"; return; }
        let extra="";
        if (b instanceof ResidentialBuilding) extra=`<p>Capacidad: ${b.getCitizens().length}/${b.getCapacity()}</p>`;
        else if (b instanceof CommercialBuilding||b instanceof IndustrialBuilding) extra=`<p>Empleados: ${b.getEmployees().length}/${b.getJobs()}</p>`;
        else if (b instanceof ServiceBuilding) extra=`<p>Radio: ${b.getRadius()} · +${b.getHappinessBoost()} felicidad</p>`;
        buildingInfoEl.innerHTML=`<h6>${b.getName()}</h6>
            <p>Costo: $${b.getCost().toLocaleString()}</p>
            <p>Mantenimiento/t: $${b.getMaintenanceCost()}</p>
            <p>⚡ ${b.getElectricityConsumption()} u/t · 💧 ${b.getWaterConsumption()} u/t</p>
            ${extra}
            <button class="btn btn-sm btn-danger mt-2" onclick="demolishAt(${x},${y})">Demoler</button>`;
        buildingInfoEl.style.display="block";
    }

    window.demolishAt = function(x,y) {
        handleDemolish(x,y);
        if (buildingInfoEl) buildingInfoEl.style.display="none";
    };

    // ─── 9. Menu edificios ───────────────────────────────────────────────────

    document.querySelectorAll(".building-item[data-type]").forEach(item=>{
        item.addEventListener("click",function(){
            selectedType=this.dataset.type;
            setMode("build");
            document.querySelectorAll(".building-item").forEach(i=>i.classList.remove("selected"));
            this.classList.add("selected");
            const lbl=this.querySelector(".building-name");
            showToast(`Construir: ${lbl?lbl.textContent:selectedType}`,"info");
        });
    });

    // ─── 10. Botones ─────────────────────────────────────────────────────────

    if (demolishBtn) demolishBtn.addEventListener("click",function(){
        if (currentMode==="demolish") { setMode("none"); showToast("Demolicion desactivada.","secondary"); }
        else { setMode("demolish"); showToast("Clic en edificio o via para demoler.","warning"); }
    });

    if (routeBtn) routeBtn.addEventListener("click",function(){
        if (currentMode==="route") { setMode("none"); clearRouteHighlight(); routeOrigin=null; showToast("Ruta desactivada.","secondary"); }
        else { setMode("route"); showToast("Selecciona el edificio origen.","info"); }
    });

    if (pauseBtn) pauseBtn.addEventListener("click",function(){
        const speed = parseInt(turnSpeedInput?.value)||10;
        const rate  = parseInt(growthInput?.value)||3;
        if (turnService.isRunning()) {
            turnService.stopTimer();
            this.textContent="▶ Reanudar";
        } else {
            turnService.startTimer(myCity, speed, { growthRate:rate, onTurnEnd, onGameOver });
            this.textContent="⏸ Pausar";
        }
    });

    if (saveBtn) saveBtn.addEventListener("click",function(){
        saveCity(myCity); showToast("Partida guardada.","success");
    });

    // ─── 11. Modo ────────────────────────────────────────────────────────────

    function setMode(mode) {
        currentMode=mode;
        if (mode!=="build") selectedType=null;
        if (mode!=="route") { routeOrigin=null; clearRouteHighlight(); }
        gridEl.style.cursor=mode==="none"?"default":"crosshair";
        if (demolishBtn) demolishBtn.classList.toggle("btn-warning",mode==="demolish");
        if (routeBtn)    routeBtn.classList.toggle("btn-info",mode==="route");
        if (mode!=="build") document.querySelectorAll(".building-item").forEach(i=>i.classList.remove("selected"));
        if (modeIndicator) modeIndicator.textContent={none:"",build:"Construyendo",demolish:"Demoliendo",route:"Trazando ruta"}[mode]||"";
    }

    // ─── 12. Callbacks TurnService ───────────────────────────────────────────

    function onTurnEnd() { updateInfoPanels(); }
    function onGameOver(msg) {
        if (pauseBtn) pauseBtn.textContent="▶ Iniciar";
        alert("GAME OVER: "+msg);
    }

    // ─── 13. Toast ───────────────────────────────────────────────────────────

    function showToast(msg, type="info") {
        let c=document.getElementById("toast-container");
        if (!c) {
            c=document.createElement("div");
            c.id="toast-container";
            c.style.cssText="position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;";
            document.body.appendChild(c);
        }
        const t=document.createElement("div");
        t.className=`alert alert-${type} py-2 px-3 mb-0`;
        t.style.cssText="min-width:220px;max-width:320px;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.3);";
        t.textContent=msg;
        c.appendChild(t);
        setTimeout(()=>t.remove(),3000);
    }

    // ─── 14. Guardado automatico cada 30s ────────────────────────────────────
    setInterval(()=>saveCity(myCity),30000);

    // ─── 15. Arranque ────────────────────────────────────────────────────────
    renderMap();
    updateInfoPanels();

    if (myCity.getClimate()) weatherPrint(myCity.getClimate());
    if (myCity.getNews())    newsPrint(myCity.getNews());

    // Actualizar clima y noticias cada 30 minutos
    setInterval(()=>{
        myCity.ensureClimate().then(()=>weatherPrint(myCity.getClimate())).catch(()=>{});
        myCity.ensureNews().then(()=>newsPrint(myCity.getNews())).catch(()=>{});
    }, 1800000);

    if (pauseBtn) pauseBtn.textContent="▶ Iniciar";
    console.log("✓ Juego listo |", myCity.getNameCity(),
                "| Grid:", myCity.getGrid().getWidth()+"x"+myCity.getGrid().getHeight(),
                "| Edificios:", myCity.getBuildings().length);
});
