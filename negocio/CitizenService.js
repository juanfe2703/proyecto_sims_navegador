class CitizenService {
    assignHousing(city) {
        // lógica futura
    }

    assignJobs(city) {
        // lógica futura
    }

    createCitizen(city) {
        const id = city.getCitizens().length + 1
        const citizen = new Citizen(id)
        city.addCitizen(citizen)
    }
}