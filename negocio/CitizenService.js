class CitizenService {
    //actualización citizen. ahora deberia devolver al ciudadano creado y tambien 
    //podre agregarle luego una casa y un trabajo
    createCitizen(city) {

        const id = city.getCitizens().length + 1

        const citizen = new Citizen(id)

        city.addCitizen(citizen)

        return citizen
    }




    //asignar casita
    assignHousing(city){
        //with this i search citizens
        const citizens = city.getCitizens()

        //with this i search residential buildings
        const residentialBuildings = city.getBuildings().filter(
            b => b.type === "residential"
        )

        //for eachc to see if the citizen have house, then find an empty house and finally give him
        citizens.forEach(citizen => {

            if(!citizen.home){

                const house = residentialBuildings.find(
                    building => building.hasSpace()
                )

                if(house){

                    house.addResident(citizen)

                    citizen.home = house

                }

            }

        })

    }




    assignJobs(city){
        //got citizens
        const citizens = city.getCitizens()

        //search buildings with jobs
        const workplaces = city.getBuildings().filter(
            b => b.type === "commercial" || b.type === "industrial"
        )

        //see if any citizen doesnt have job and find an empty job to asigned him
        citizens.forEach(citizen => {

            if(!citizen.job){

                const job = workplaces.find(
                    workplace => workplace.hasVacancy()
                )

                if(job){

                    job.addWorker(citizen)

                    citizen.job = job

                }

            }

        })

    }


    //this method will execute all
     processCitizens(city){

        this.assignHousing(city)

        this.assignJobs(city)

    }

    
}