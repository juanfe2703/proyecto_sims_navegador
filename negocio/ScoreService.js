class ScoreService {
    updateScore(city) {
        if (!city.getScore()) {
            city.setScore(new Score())
        }

        city.getScore().calculate(city)
    }
}