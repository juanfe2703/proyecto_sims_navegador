document.addEventListener("DOMContentLoaded",function(){
    let grid = new Grid();
    function Map_generation(width = grid.getWidth(), height = grid.getHeight()){
        let gridElement = document.getElementById("id_city");
        // Generar el contenido de la cuadrícula
        let Conten = "";

        for(let position_y = 0; position_y < height; position_y++){
            for(let position_x = 0; position_x < width; position_x++){
                Conten += `<div class="cell" data-x="${position_x}" data-y="${position_y}"></div>`;
                console.log(`x: ${position_x} y: ${position_y}`);
            }
        }
        gridElement.innerHTML = Conten;

    }

    Map_generation();
})