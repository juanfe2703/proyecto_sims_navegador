/**
 * Map.js - Zoom, clima y noticias.
 * NO usa DOMContentLoaded propio.
 * initGameController() en game_controller.js lo llama cuando esta listo.
 */

function initMap() {
    // ─── Zoom ─────────────────────────────────────────────────────────────────
    const gridElement = document.getElementById("id_city");
    const viewportEl  = document.getElementById("map-viewport");
    const zoom_out    = document.getElementById("zoom-out");
    const zoom_in     = document.getElementById("zoom-in");
    let   zoom_level  = 1;

    // ─── Desplazamiento (pan) ────────────────────────────────────────────────
    const pan_up    = document.getElementById("pan-up");
    const pan_down  = document.getElementById("pan-down");
    const pan_left  = document.getElementById("pan-left");
    const pan_right = document.getElementById("pan-right");

    const PAN_MIN_ZOOM = 1.1; // primer nivel de zoom (después de 1.0)
    const PAN_STEP = 140;
    let pan_x = 0;
    let pan_y = 0;

    function applyPan() {
        if (!gridElement) return;
        if (zoom_level < PAN_MIN_ZOOM) {
            pan_x = 0;
            pan_y = 0;
        }
        // No toca el zoom (transform). Solo mueve el contenido.
        gridElement.style.translate = pan_x + "px " + pan_y + "px";
    }

    function clampPan() {
        if (!viewportEl || !gridElement) return;
        if (zoom_level < PAN_MIN_ZOOM) {
            pan_x = 0;
            pan_y = 0;
            return;
        }

        const viewportW = viewportEl.clientWidth;
        const viewportH = viewportEl.clientHeight;
        const baseW = gridElement.offsetWidth;
        const baseH = gridElement.offsetHeight;

        const scaledW = baseW * zoom_level;
        const scaledH = baseH * zoom_level;

        // Limites para que el mapa no se salga del viewport.
        const minX = Math.min(0, viewportW - scaledW);
        const minY = Math.min(0, viewportH - scaledH);

        if (pan_x > 0) pan_x = 0;
        if (pan_y > 0) pan_y = 0;
        if (pan_x < minX) pan_x = minX;
        if (pan_y < minY) pan_y = minY;
    }

    if (zoom_in) {
        zoom_in.addEventListener("click", function () {
            zoom_level = Math.min(2, parseFloat((zoom_level + 0.1).toFixed(1)));
            gridElement.style.transformOrigin = "top center"; // Mantener el origen del zoom en la parte superior central
            gridElement.style.transform = `scale(${zoom_level})`;
            clampPan();
            applyPan();
        });
    }

    if (zoom_out) {
        zoom_out.addEventListener("click", function () {
            zoom_level = Math.max(0.5, parseFloat((zoom_level - 0.1).toFixed(1)));
            gridElement.style.transformOrigin = "top center"; // Mantener el origen del zoom en la parte superior central
            gridElement.style.transform = `scale(${zoom_level})`;
            clampPan();
            applyPan();
        });
    }

    if (pan_left) {
        pan_left.addEventListener("click", function () {
            if (zoom_level < PAN_MIN_ZOOM) return;
            pan_x = pan_x + PAN_STEP;
            clampPan();
            applyPan();
        });
    }

    if (pan_right) {
        pan_right.addEventListener("click", function () {
            if (zoom_level < PAN_MIN_ZOOM) return;
            pan_x = pan_x - PAN_STEP;
            clampPan();
            applyPan();
        });
    }

    if (pan_up) {
        pan_up.addEventListener("click", function () {
            if (zoom_level < PAN_MIN_ZOOM) return;
            pan_y = pan_y + PAN_STEP;
            clampPan();
            applyPan();
        });
    }

    if (pan_down) {
        pan_down.addEventListener("click", function () {
            if (zoom_level < PAN_MIN_ZOOM) return;
            pan_y = pan_y - PAN_STEP;
            clampPan();
            applyPan();
        });
    }

    applyPan();
}

// ─── Clima ────────────────────────────────────────────────────────────────────
function weatherPrint(climate) {
    const el = document.getElementById("weather-info");
    if (!climate || !el) return;
    el.innerHTML = `
        <div id="weather-content">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <h3 id="CityName" class="city-name">${climate.getCity()}</h3>
                <img id="Icon" class="weather-icon" src="${climate.getIcon()}" alt="">
            </div>
            <div class="temperature">
                <span id="TempValue" class="temp-value">${climate.getTemperatureC()}°C</span>
            </div>
            <div class="details">
                <p id="Condition" class="Condition">Condición: ${climate.getCondition()}</p>
                <p id="Humidity" class="Humidity">Humedad: ${climate.getHumidity()}%</p>
            </div>
        </div>`;
}

// ─── Noticias ─────────────────────────────────────────────────────────────────
function newsPrint(newsList) {
    const el = document.getElementById("news");
    if (!el) return;
    if (!newsList || newsList.length === 0) {
        el.innerHTML = "<small class='text-secondary'>Sin noticias disponibles.</small>";
        return;
    }
    el.innerHTML = newsList.map(n => `
        <div class="news-item">
            <div class="image-container">
                <img class="news-image" src="${n.getMedia()}" alt=""
                     onerror="this.style.display='none'">
            </div>
            <div class="Text-container">
                <h3 class="news-title">${n.getTitle()}</h3>
                <p class="news-description">${n.getSummary()}</p>
                <a href="${n.getLink()}" target="_blank">Leer más</a>
            </div>
        </div>`).join("");
}
