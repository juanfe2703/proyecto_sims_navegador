document.addEventListener("DOMContentLoaded",function(){
    let grid = new Grid();


    function Map_generation(width = grid.getWidth(), height = grid.getHeight()){
        let gridElement = document.getElementById("id_city");
        // Generar el contenido de la cuadrícula
        let Conten = "";

        for(let position_y = 0; position_y < height; position_y++){
            for(let position_x = 0; position_x < width; position_x++){
                Conten += `<div class="cell" data-x="${position_x}" data-y="${position_y}"></div>`;
                grid.Add_position(Create_position(position_x, position_y));
            }
        }
        gridElement.innerHTML = Conten;

    }

    function Create_position(x, y){
        myCell = new Cell();
        myCell.setX(x);
        myCell.setY(y)
        console.log(myCell);
        return myCell;   
    }
   

    Map_generation();
})