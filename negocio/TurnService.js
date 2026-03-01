//este seria como el motor de la aplicacion pues son los turnos 

class TurnService {
    processTurn(city) {
        const transactions = []

        city.getBuildings().forEach(building => {
            if (typeof building.produce === "function") {
                transactions.push(building.produce())
            }
        })

        transactions.forEach(t => {
            if (city.getResources().hasEnough(t)) {
                city.getResources().applyTransaction(t)
            }
        })

        city.getCitizens().forEach(c => {
            c.calculateHappiness()
        })

        if (city.getScore()) {
            city.getScore().calculate(city)
        }

        city.incrementTurn()
    }
}