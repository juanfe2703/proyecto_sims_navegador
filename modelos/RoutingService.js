/**
 * RoutingService.js
 * Construye la matriz del mapa y llama al microservicio de nuestro amado profe Felipe
 * para calcular la ruta optima entre dos edificios via algoritmo Dijkstra.
 *
 * API del profesor:
 *   POST http://127.0.0.1:5000/api/calculate-route
 *   Body: { "map": [[0,1,...], ...], "start": [fila, col], "end": [fila, col] }
 *   Exito:  { "route": [[fila, col], ...] }
 *   Error:  HTTP 400 { "error": "Edificios no conectados por vias: imposible calcular" }
 *
 * Convencion del mapa:
 *   0 = celda no transitable (edificio o terreno vacio)
 *   1 = via (transitable)
 *
 * Coordenadas: [fila, columna] === [y, x] en el sistema del juego
 */

class RoutingService {

    constructor() {
        this._apiUrl = "http://127.0.0.1:5000/api/calculate-route";
    }

    // ─── Construccion de la matriz ───────────────────────────────────────────

    /**
     * Convierte el grid de la ciudad en una matriz binaria [filas][columnas].
     * 1 = via, 0 = cualquier otra cosa (edificio, terreno vacio).
     *
     * @param {City} city
     * @returns {number[][]} Matriz height x width
     */
    buildMatrix(city) {
        const grid   = city.getGrid();
        const width  = grid.getWidth();
        const height = grid.getHeight();

        // Inicializar matriz con ceros
        const matrix = Array.from({ length: height }, () => new Array(width).fill(0));

        grid.getCell().forEach(cell => {
            if (cell.getRoad() !== null) {
                // Fila = Y, Columna = X  (convencion del microservicio)
                matrix[cell.getY()][cell.getX()] = 1;
            }
        });

        return matrix;
    }

    // ─── Busqueda de celda por coordenadas ──────────────────────────────────

    /**
     * Dado un edificio en la ciudad, retorna la celda que lo contiene.
     * @param {City}     city
     * @param {Building} building
     * @returns {Cell|null}
     */
    _findCellOfBuilding(city, building) {
        return city.getGrid().getCell().find(c => c.getBuilding() === building) || null;
    }

    // ─── Llamada al microservicio ────────────────────────────────────────────

    /**
     * Solicita la ruta optima entre dos edificios al backend del profesor.
     *
     * @param {City}     city
     * @param {Building} originBuilding      Instancia del edificio origen.
     * @param {Building} destinationBuilding Instancia del edificio destino.
     * @returns {Promise<{ ok: boolean, route: [number,number][], message: string }>}
     *          route: array de [fila, columna] si ok=true
     */
    async calculateRoute(city, originBuilding, destinationBuilding) {

        // 1. Localizar las celdas de ambos edificios
        const originCell = this._findCellOfBuilding(city, originBuilding);
        const destCell   = this._findCellOfBuilding(city, destinationBuilding);

        if (!originCell) {
            return { ok: false, route: [], message: "No se encontro la celda del edificio origen." };
        }
        if (!destCell) {
            return { ok: false, route: [], message: "No se encontro la celda del edificio destino." };
        }
        if (originCell === destCell) {
            return { ok: false, route: [], message: "El origen y el destino son el mismo edificio." };
        }

        // 2. Construir la matriz
        const matrix = this.buildMatrix(city);

        // 3. start y end en formato [fila, columna]
        const start = [originCell.getY(),  originCell.getX()];
        const end   = [destCell.getY(),    destCell.getX()];

        // 4. Los edificios no son vias (=0 en la matriz) pero Dijkstra
        //    necesita que start y end sean "transitables" para que la ruta
        //    incluya esas celdas. Los marcamos temporalmente como 1.
        matrix[start[0]][start[1]] = 1;
        matrix[end[0]][end[1]]     = 1;

        // 5. Llamada al microservicio
        try {
            const response = await fetch(this._apiUrl, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ map: matrix, start, end })
            });

            const data = await response.json();

            if (!response.ok) {
                // HTTP 400: sin ruta posible
                return {
                    ok:      false,
                    route:   [],
                    message: data.error || "No hay ruta disponible entre estos edificios."
                };
            }

            // Exito: data.route es [[fila,col], ...]
            return {
                ok:      true,
                route:   data.route,
                message: `Ruta encontrada: ${data.route.length} pasos.`
            };

        } catch (error) {
            console.error("Error al contactar el microservicio de rutas:", error);
            return {
                ok:      false,
                route:   [],
                message: "No se pudo conectar con el servidor de rutas. ¿Esta corriendo en http://127.0.0.1:5000?"
            };
        }
    }
}
