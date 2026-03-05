class Cell{
    constructor(x, y , type){
        this._x = x;
        this._y = y;
        this._type = type;
        this._road = road;
        this._building = building;
    }

    // Getters
    getX() { return this._x }
    getY() { return this._y }
    getType() { return this._type }
    getRoad() { return this._road }
    getBuilding() { return this._building }

    // Setters
    setX(x) { this._x = x }
    setY(y) { this._y = y }
    setType(type) { this._type = type }
    setRoad(road) { this._road = road }
    setBuilding(building) { this._building = building }
}