/**
 * Map.js - Zoom, clima y noticias.
 * NO usa DOMContentLoaded propio.
 * initGameController() en game_controller.js lo llama cuando esta listo.
 */

function initMap() {
    // ─── Zoom ─────────────────────────────────────────────────────────────────
    const gridElement = document.getElementById("id_city");
    const zoom_out    = document.getElementById("zoom-out");
    const zoom_in     = document.getElementById("zoom-in");
    let   zoom_level  = 1;

    if (zoom_in) {
        zoom_in.addEventListener("click", function () {
            zoom_level = Math.min(2, parseFloat((zoom_level + 0.1).toFixed(1)));
            gridElement.style.transformOrigin = "top center"; // Mantener el origen del zoom en la parte superior central
            gridElement.style.transform = `scale(${zoom_level})`;
        });
    }

    if (zoom_out) {
        zoom_out.addEventListener("click", function () {
            zoom_level = Math.max(0.5, parseFloat((zoom_level - 0.1).toFixed(1)));
            gridElement.style.transformOrigin = "top center"; // Mantener el origen del zoom en la parte superior central
            gridElement.style.transform = `scale(${zoom_level})`;
        });
    }
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
