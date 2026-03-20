/**
 * Map.js
 * Responsabilidad: zoom, clima, noticias.
 * Al final llama a initGameController() que está en game_controller.js
 * para garantizar que el mapa se inicializa DESPUES de este archivo.
 */
document.addEventListener("DOMContentLoaded", function () {

    // ─── Zoom ─────────────────────────────────────────────────────────────────
    const gridElement = document.getElementById("id_city");
    const zoom_out    = document.getElementById("zoom-out");
    const zoom_in     = document.getElementById("zoom-in");
    let   zoom_level  = 1;

    zoom_in.addEventListener("click", function () {
        zoom_level = Math.min(2, parseFloat((zoom_level + 0.1).toFixed(1)));
        applyZoom();
    });

    zoom_out.addEventListener("click", function () {
        zoom_level = Math.max(0.5, parseFloat((zoom_level - 0.1).toFixed(1)));
        applyZoom();
    });

    function applyZoom() {
        gridElement.style.transformOrigin = "top left";
        gridElement.style.transform = `scale(${zoom_level})`;
    }

    // ─── Clima ────────────────────────────────────────────────────────────────
    window.weatherPrint = function(climate) {
        const weather_content = document.getElementById("weather-info");
        if (!climate || !weather_content) return;
        weather_content.innerHTML = `
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
    };

    // ─── Noticias ─────────────────────────────────────────────────────────────
    window.newsPrint = function(newsList) {
        const news_content = document.getElementById("news");
        if (!news_content) return;
        if (!newsList || newsList.length === 0) {
            news_content.innerHTML = "<small class='text-secondary'>Sin noticias disponibles.</small>";
            return;
        }
        let html = "";
        newsList.forEach(n => {
            html += `<div class="news-item">
                        <div class="image-container">
                            <img class="news-image" src="${n.getMedia()}" alt=""
                                 onerror="this.style.display='none'">
                        </div>
                        <div class="Text-container">
                            <h3 class="news-title">${n.getTitle()}</h3>
                            <p class="news-description">${n.getSummary()}</p>
                            <a href="${n.getLink()}" target="_blank">Leer más</a>
                        </div>
                     </div>`;
        });
        news_content.innerHTML = html;
    };

    // ─── Arrancar el controlador del juego ────────────────────────────────────
    // Llamamos a la funcion global definida en game_controller.js
    if (typeof initGameController === "function") {
        initGameController();
    } else {
        console.error("initGameController no encontrado. Verifica que game_controller.js este cargado.");
    }
});
