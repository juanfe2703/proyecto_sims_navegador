class Grid{
    constructor(){
        this._width = null;
        this._height = null;
        this._cell = [];
    }

    // Getters
    getWidth() { return this._width; }
    getHeight() { return this._height; }
    getCell() { return this._cell; }

    // Setters
    setWidth(width) {
       this._width = width;
    }

    setHeight(height){
        this._height = height;
    }

    setCell(cell) { this._cell = cell; }
    
    Add_position(){
        this._cell.push(new Cell());
    }
}