/**
 * raking_controller.js
 * Controlador simple para la vista Raking.html.
 * Lee el ranking desde localStorage usando la clase Raking y renderiza tarjetas Bootstrap.
 */

document.addEventListener("DOMContentLoaded", function () {
    const listEl  = document.getElementById("ranking-list")
    const emptyEl = document.getElementById("ranking-empty")
    const youEl   = document.getElementById("ranking-you")

    const btnReset  = document.getElementById("btn-ranking-reset")
    const btnExport = document.getElementById("btn-ranking-export")

    if (!listEl) return


    const raking = new Raking()
    raking.loadRanking()

    function getCurrentCityKey() {
        // Preferir sessionStorage (cuando viene desde game.html)
        try {
            const k = sessionStorage.getItem("currentCityKey")
            if (k) return k
        } catch {}

        // Fallback: leer ciudad actual desde localStorage (sin reconstruir modelos)
        try {
            const raw = localStorage.getItem("city")
            if (!raw) return null
            const data = JSON.parse(raw)
            const cityName = data?._name_city
            const playerName = data?._name_player
            if (!cityName || !playerName) return null
            return String(cityName) + "|" + String(playerName)
        } catch {}

        return null
    }

    function fmtDate(value) {
        if (!value) return ""
        try {
            // si viene en ISO, esto lo vuelve legible
            const d = new Date(value)
            if (isNaN(d.getTime())) return String(value)
            return d.toLocaleString()
        } catch {
            return String(value)
        }
    }

    function render() {
        const top = raking.getTop10() || []
        const all = raking.getData() || []
        const currentKey = getCurrentCityKey()

        if (!top.length) {
            if (emptyEl) emptyEl.style.display = "block"
            if (youEl) youEl.style.display = "none"
            listEl.innerHTML = ""
            return
        }

        if (emptyEl) emptyEl.style.display = "none"
        listEl.innerHTML = ""

        top.forEach((item, index) => {
            const position = index + 1
            const cityName   = item?.cityName ?? item?.city ?? "(sin ciudad)"
            const mayorName  = item?.mayor ?? item?.playerName ?? item?.player ?? item?.name_player ?? "(sin jugador)"
            const score      = item?.score ?? item?._score ?? 0
            const population = item?.population ?? item?.pop ?? 0
            const happiness  = item?.happiness ?? item?.happiness_avg ?? 0
            const turns      = item?.turns ?? item?.turn ?? 0
            const date       = fmtDate(item?.date ?? item?.createdAt ?? "")

            const itemKey = String(cityName) + "|" + String(mayorName)
            const isCurrent = currentKey && itemKey === currentKey

            const card = document.createElement("div")
            card.className = "card bg-dark text-light" + (isCurrent ? " border border-warning" : "")

            const badgeClass = isCurrent ? "badge bg-warning text-dark fw-bold" : "badge bg-success"

            card.innerHTML = `
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="fw-bold">#${position} · ${cityName}</div>
                            <div style="font-size:12px;opacity:.85;">Alcalde: ${mayorName}${date ? ` · ${date}` : ""}</div>
                            <div style="font-size:12px;opacity:.85;">Población: ${population} · Felicidad: ${happiness}% · Turnos: ${turns}</div>
                        </div>
                        <div class="text-end">
                            <div class="${badgeClass}" style="font-size:12px;">${score}</div>
                            <div style="font-size:11px;opacity:.8;">Score</div>
                        </div>
                    </div>
                </div>
            `

            listEl.appendChild(card)
        })

        // "Tu ciudad: #XX" si no está en top 10
        if (youEl) {
            youEl.style.display = "none"
            if (currentKey && all.length) {
                const idx = all.findIndex(it => {
                    const cityName = it?.cityName ?? it?.city ?? ""
                    const mayorName = it?.mayor ?? it?.playerName ?? it?.player ?? it?.name_player ?? ""
                    return String(cityName) + "|" + String(mayorName) === currentKey
                })
                if (idx >= 0 && idx >= 10) {
                    youEl.textContent = `Tu ciudad: #${idx + 1}`
                    youEl.style.display = "block"
                }
            }
        }
    }

    // Botones
    if (btnReset) {
        btnReset.addEventListener("click", function(){
            if (!confirm("¿Reiniciar ranking? Se borrarán los puntajes guardados.")) return
            raking.reset()
            raking.loadRanking()
            render()
        })
    }

    if (btnExport) {
        btnExport.addEventListener("click", function(){
            const json = raking.export()
            const blob = new Blob([json], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "ranking.json"
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        })
    }

    // Permite que otras pantallas (ej. modal en game.html) refresquen sin duplicar lógica
    window.refreshRankingUI = function () {
        try {
            raking.loadRanking()
            render()
        } catch (e) {
            console.warn("No se pudo refrescar el ranking:", e)
        }
    }

    render()
})
