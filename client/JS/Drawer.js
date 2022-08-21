export default class Drawer{

    constructor(canvas, width, height){

        // Reference to the real canvas
        this._canvas = canvas;
        
        this._canvas.width = width;
        this._canvas.height = height;

        this._ctx = this._canvas.getContext('2d');

        // Memory canvas to save the state
        this._memCanvas = document.createElement('canvas');
        this._memCanvas.width = width;
        this._memCanvas.height = height;
        this._memCtx = this._memCanvas.getContext('2d');

        this._activeTool = 'toolbar-pen';
        this._activeColor = '#000'  //black

        this._ctx.lineWidth = 5;
        this._ctx.lineCap = 'round';
        this._ctx.lineJoin = 'round';
        
        /* 
        toolbar-pen
        toolbar-eraser
        toolbar-line
        toolbar-curve
        toolbar-circle
        toolbar-square
        toolbar-circle-solid
        toolbar-square-solid
        */

        this._drawingBool = false;
        this._points = [];
        this._emitters;
    }


    clearCanvas(){

        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._memCtx.clearRect(0, 0, this._memCanvas.width, this._memCanvas.height);
        this._memCtx.beginPath();
        this._ctx.beginPath();
        this._points = [];
        this._activeTool = 'toolbar-pen';
        this._activeColor = '#000';
        this._currentLineWidth = 5;
    }

    getEmitters(handler){
        this._emitters = handler;
    }
    
    getDrawingFunction(tool, points, color){

        // if(tool) this._activeTool = tool;
        // if(points) this._points = points;
        // if(color) this.activeColor = color;
        //const currPoints = points

        switch (this._activeTool) {
            case 'toolbar-pen':
                this.drawPointsPen();
                break;
            case 'toolbar-eraser':
                this.erasePoints();
                break;
            case 'toolbar-line':
                this.drawPointsLine();
                break;
            case 'toolbar-curve':
                this.drawPointsCurve();
                break;
            case 'toolbar-circle':
                this.drawPointsCircle();
                break;
            case 'toolbar-square':
                this.drawPointsRectangle();
                break;
            case 'toolbar-circle-solid':
                this.drawPointsSolidCircle();
                break;
            case 'toolbar-square-solid':
                this.drawPointsSolidRectangle();
                break;
        }
    }

    // Pen Drawing

    startDrawing(event){
        this._drawingBool = true;
        let point = this.getPoint(event)
        this._points.push(point);
        if(this._activeTool === 'toolbar-pen' || this._activeTool === 'toolbar-eraser') this.draw(event)
    }

    draw(event){
        if(!this._drawingBool) return;

        this._points.push(this.getPoint(event));   
        this._emitters.sendDrawingInfo({
            points: this._points,
            tool: this._activeTool,
            color: this._activeColor,
            lineWidth: this._currentLineWidth
        });
        this.getDrawingFunction();
    }

    finishDrawing(){
        this._drawingBool = false;
        this._memCtx.clearRect(0, 0, this._memCanvas.width, this._memCanvas.height);
        this._memCtx.drawImage(this._canvas, 0, 0);
        this._points = [];

        this._emitters.saveCanvas();
    }

    // Pen Drawing

    drawPointsPen(){
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._ctx.drawImage(this._memCanvas, 0, 0);
        // this._ctx.lineWidth = 5;
        // this._ctx.lineCap = 'round';
        // this._ctx.lineJoin = 'round';

        if (this._points.length < 4) {
            let b = this._points[0];
            this._ctx.beginPath();
            this._ctx.arc(b.x, b.y, this._ctx.lineWidth / 2, 0, Math.PI * 2, !0);
            this._ctx.closePath();
            this._ctx.fill();
            return
        }

        this._ctx.beginPath();
        this._ctx.moveTo(this._points[0].x, this._points[0].y);

        let i;
        for (i = 1; i < this._points.length - 2; i++) {
            let c = (this._points[i].x + this._points[i + 1].x) / 2;
            let d = (this._points[i].y + this._points[i + 1].y) / 2;
            this._ctx.quadraticCurveTo(this._points[i].x, this._points[i].y, c, d);
        }
        this._ctx.quadraticCurveTo(this._points[i].x, this._points[i].y, this._points[i + 1].x, this._points[i + 1].y);
        this._ctx.stroke();
    }

    // Circle Drawing

    drawPointsCircle(){
        let startPoint = this._points[0];
        let [currPoint] = this._points.splice(1);
        if(startPoint.x === currPoint.x) return;

        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._ctx.drawImage(this._memCanvas, 0, 0);

        this._ctx.beginPath();
        this._ctx.moveTo(startPoint.x, startPoint.y + (currPoint.y - startPoint.y) / 2);
        this._ctx.bezierCurveTo(startPoint.x, startPoint.y, currPoint.x, startPoint.y, currPoint.x, startPoint.y + (currPoint.y - startPoint.y) / 2);
        this._ctx.bezierCurveTo(currPoint.x, currPoint.y, startPoint.x, currPoint.y, startPoint.x, startPoint.y + (currPoint.y - startPoint.y) / 2);
        this._ctx.closePath();
        this._ctx.stroke();
    }
    
    // Solid Circle Drawing

    drawPointsSolidCircle(){
        let startPoint = this._points[0];
        let [currPoint] = this._points.splice(1);
        if(startPoint.x === currPoint.x) return;

        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._ctx.drawImage(this._memCanvas, 0, 0);


        this._ctx.beginPath();
        this._ctx.moveTo(startPoint.x, startPoint.y + (currPoint.y - startPoint.y) / 2);
        this._ctx.bezierCurveTo(startPoint.x, startPoint.y, currPoint.x, startPoint.y, currPoint.x, startPoint.y + (currPoint.y - startPoint.y) / 2);
        this._ctx.bezierCurveTo(currPoint.x, currPoint.y, startPoint.x, currPoint.y, startPoint.x, startPoint.y + (currPoint.y - startPoint.y) / 2);
        this._ctx.closePath();
        this._ctx.stroke();
        this._ctx.fill();
    }

    // Rectangle Drawing

    drawPointsRectangle(){
        let startPoint = this._points[0];
        let [currPoint] = this._points.splice(1);

        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._ctx.drawImage(this._memCanvas, 0, 0);

        this._ctx.beginPath();
        this._ctx.rect(startPoint.x, startPoint.y, currPoint.x - startPoint.x, currPoint.y - startPoint.y);
        this._ctx.closePath();
        this._ctx.stroke();
    }

    // Solid Rectangle Drawing

    drawPointsSolidRectangle(){
        let startPoint = this._points[0];
        let [currPoint] = this._points.splice(1);

        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._ctx.drawImage(this._memCanvas, 0, 0);

        this._ctx.beginPath();
        this._ctx.rect(startPoint.x, startPoint.y, currPoint.x - startPoint.x, currPoint.y - startPoint.y);
        this._ctx.closePath();
        this._ctx.stroke();
        this._ctx.fill();
    }

    // Line Drawing

    drawPointsLine(){
        let startPoint = this._points[0];
        let [currPoint] = this._points.splice(1);

        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._ctx.drawImage(this._memCanvas, 0, 0);

        this._ctx.beginPath();
        this._ctx.moveTo(startPoint.x, startPoint.y);
        this._ctx.lineTo(currPoint.x, currPoint.y);
        this._ctx.stroke();
    }

    // Eraser tool

    erasePoints(){

        let startPoint = this._points[this._points.length - 1];

        

        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        this._ctx.drawImage(this._memCanvas, 0, 0);

        //Save the current clipping region (default)
        this._ctx.save();

        let radius = 20;

        this._ctx.beginPath();
        this._ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI, false);
        this._ctx.clip();
        this._ctx.clearRect(startPoint.x - radius - 1, startPoint.y - radius - 1, radius * 2 + 2, radius * 2 + 2);

        //Restore default clipping region
        this._ctx.restore();
        
        this._memCtx.clearRect(0, 0, this._memCanvas.width, this._memCanvas.height);
        this._memCtx.drawImage(this._canvas, 0, 0);
    }


    // Render points when another player draws

    renderPoints(info){
        this._points = info.points;
        this._activeTool = info.tool;
        this._activeColor = info.color;
        this._currentLineWidth = info.lineWidth;
        this.getDrawingFunction();
    }

    // Auxiliar functions
    
    getActiveTool(tool){
        this._activeTool = tool;
    }

    saveInMemoryCanvasState(){
        this._memCtx.clearRect(0, 0, this._memCanvas.width, this._memCanvas.height);
        this._memCtx.drawImage(this._canvas, 0, 0);
    }

    allPoints(){
        return this._points;
    }

    getPoint(event){
        return {
            x: event.offsetX,
            y: event.offsetY
        }
    }
}
