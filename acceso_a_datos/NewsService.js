class ApiNews {
    constructor() {
        this._url = "https://api.newscatcherapi.com/v2/search";
    }

    getCurrentNews(city) {
        const url = `https://gnews.io/api/v4/top-headlines?q=${encodeURIComponent(city)}&lang=es&country=CO&max=5&apikey=1429bb08dfde85dee9c391754fdef3a7`;

        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                return data.articles.map(article => ({
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    image: article.image
                }));
            })
            .catch(error => {
                console.error("Error al obtener noticias:", error);
                return null;
            });
}
}