/**
 * raking_controller.js
 * Controlador simple para la vista Raking.html.
 * Lee el ranking desde localStorage usando la clase Raking y renderiza tarjetas Bootstrap.
 */

document.addEventListener("DOMContentLoaded", function () {
    const listEl  = document.getElementById("ranking-list")
    const emptyEl = document.getElementById("ranking-empty")

    if (!listEl) return

    const raking = new Raking()
    raking.loadRanking()

    const top = raking.getTop10() || []

    if (!top.length) {
        if (emptyEl) emptyEl.style.display = "block"
        return
    }

    // Render: una card por registro
    listEl.innerHTML = ""

    top.forEach((item, index) => {
        const position = index + 1

        // Campos esperados (si no existen, mostramos algo razonable)
        const cityName   = item?.cityName ?? item?.city ?? "(sin ciudad)"
        const playerName = item?.playerName ?? item?.player ?? item?.name_player ?? "(sin jugador)"
        const score      = item?.score ?? item?._score ?? 0
        const date       = item?.date ?? item?.createdAt ?? ""

        const card = document.createElement("div")
        card.className = "card bg-dark text-light"

        card.innerHTML = `
            <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">#${position} · ${cityName}</div>
                        <div style="font-size:12px;opacity:.85;">Jugador: ${playerName}${date ? ` · ${date}` : ""}</div>
                    </div>
                    <div class="text-end">
                        <div class="badge bg-success" style="font-size:12px;">${score}</div>
                        <div style="font-size:11px;opacity:.8;">Score</div>
                    </div>
                </div>
            </div>
        `

        listEl.appendChild(card)
    })
})
