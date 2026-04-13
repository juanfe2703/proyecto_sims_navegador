class ApiNews {
    getCurrentNews(city) {
        const url = `https://gnews.io/api/v4/top-headlines?q=${encodeURIComponent(city)}&lang=es&country=CO&max=5&apikey=1429bb08dfde85dee9c391754fdef3a7`;

        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                const articles = data?.articles;
                if (!Array.isArray(articles) || articles.length === 0) {
                    throw new Error("Ciudad no valida");
                }
                return articles;
            });
}
}