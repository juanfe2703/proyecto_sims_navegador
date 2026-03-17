class News{
    constructor(title = "", summary = "", link = "", media = ""){
        this._title = title;
        this._summary = summary;
        this._link = link;
        this._media = media;
    }

    // Getters
    getTitle() { return this._title }
    getSummary() { return this._summary }
    getLink() { return this._link }
    getMedia() { return this._media }

    // Setters
    setTitle(title) { this._title = title }
    setSummary(summary) { this._summary = summary }
    setLink(link) { this._link = link }
    setMedia(media) { this._media = media }
}