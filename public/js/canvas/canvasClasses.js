import CONST from './constants.js';
class MasterJasonFile{
    constructor(cnvW,cnvH,bgc,gridH,gridV,layers){
        this.canvas = function(cnvW,cnvH){
            this.width = cnvW;
            this.height = cnvH;
        };
        this.canvas.width = cnvW;
        this.canvas.height = cnvH;
        
        this.bgc = bgc;
        
        this.grid = function(gridH,gridV){
            this.height = gridH;
            this.v = gridV;
        };
        this.grid.height = gridH;
        this.grid.v = gridV;
        this.layers = layers;
    }
    
}
//Shapes
class Rect{
    constructor(x,y,width,height,backgroundColor,borderColor,borderWidth = 0,rorationInDegrees = 0){
        this.desc = CONST.RECT;
        this.pos = 0;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = borderWidth;
        this.rorationInDegrees = rorationInDegrees;
    }
    
    draw (context, plusX = 0, plusY = 0) {
        if (this.rorationInDegrees)
        context.rotate(this.grad*Math.PI/180);
        
        context.fillStyle=this.backgroundColor;//BACKGROUND
        context.fillRect(this.x + plusX,this.y + plusY,this.width,this.height);
        /*if (this.borderWidth) {
            context.strokeRect(this.x,this.y,this.width,this.height);
            context.strokeStyle = this.borderColor;
            context.lineWidth=this.borderWidth;
            context.stroke();
        }*/
        if (this.rorationInDegrees)
        context.rotate((360-this.rorationInDegrees)*Math.PI/180);
    }
}
class Arc{
    constructor(x,y,radius,startAngle,endAngle,backgroundColor,borderColor,borderWidth){
        this.desc = CONST.ARC;
        this.pos = 0;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = borderWidth;
    }
    draw(context, plusX = 0, plusY = 0){
        if(this.radius<0)this.radius*=-1;
        context.beginPath();
        context.fillStyle = this.backgroundColor;//BACKGROUND
        context.arc(this.x + plusX,this.y + plusY,this.radius, this.startAngle, this.endAngle);
        if(this.borderWidth>0){
            context.strokeStyle = borderColor;//BORDER
            context.strokeStyle = this.borderColor;
            context.lineWidth=this.borderWidth;
            context.stroke();
        }
        
        context.fill();
    }
}
class Ellipse{
    constructor(x,y,radiusX,radiusY,rotation,startAngle,endAngle,backgroundColor,borderColor,borderWidth){
        this.desc = CONST.ELLIPSE;
        this.pos = 0;
        this.x = x;
        this.y = y;
        this.radiusX = radiusX;
        this.radiusY = radiusY;
        this.rotation = rotation;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = borderWidth;
    }
    draw(context, plusX = 0, plusY = 0){
        if(this.radius<0)this.radius*=-1;
        context.beginPath();
        context.fillStyle = this.backgroundColor;//BACKGROUND
        context.ellipse(this.x + plusX,this.y + plusY,this.radiusX,this.radiusY,this.rotation, this.startAngle, this.endAngle);
        if(this.borderWidth>0){
            context.strokeStyle = borderColor;//BORDER
            //context.strokeArc(this.x,this.y,this.width,this.height);
            context.strokeStyle = this.borderColor;
            context.lineWidth=this.borderWidth;
            context.stroke();
        }
        
        context.fill();
    }
}
class Line{
    constructor(x1,y1,x2,y2,borderColor,borderWidth){
        this.desc = CONST.LINE;
        this.pos = 0;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.borderColor = borderColor;
        this.borderWidth = borderWidth;
    }
    draw(context, plusX = 0, plusY = 0){
        context.beginPath();
        context.strokeStyle = this.borderColor;//BORDER
        context.moveTo(this.x1 + plusX,this.y1 + plusY);
        context.lineTo(this.x2 + plusX,this.y2 + plusY);
        context.lineWidth = this.borderWidth; 
        context.stroke();
        context.fill();
    }
}
class Poligon{
    constructor(points,backgroundColor,borderColor,borderWidth){
        this.desc = CONST.POLIGON;
        this.pos = 0;
        this.points = points || [];
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = borderWidth;
    }
    draw(context, plusX = 0, plusY = 0){
        if(this.points.length>0){
            context.fillStyle= this.backgroundColor;
            context.strokeStyle = this.borderColor;
            context.beginPath();
            context.moveTo(this.points[0].x + plusX, this.points[0].y + plusY);
            for(var i = 1; i < this.points.length; i++){
                context.lineTo(this.points[i].x + plusX,this.points[i].y + plusY);
            }
            context.lineWidth = this.borderWidth;
            context.closePath();
            context.fill();
            context.stroke();
        }
    }
}
class Pencil{
    constructor(points = [], color, borderWidth = 1){
        this.desc = CONST.PENCIL;
        this.pos = 0;
        this.points = points;
        this.color = color;
        this.borderWidth = borderWidth;
    }
    draw(context, plusX = 0, plusY = 0){
        context.strokeStyle = this.color;
        context.beginPath();
        context.moveTo(this.points[0].x + plusX, this.points[0].y + plusY);
        for(var i = 1; i < this.points.length; i++){
            context.lineTo(this.points[i].x + plusX,this.points[i].y + plusY);
        }
        context.lineWidth = this.borderWidth;
        context.stroke();
    }
}
class ClosedPencil{
    constructor(points,backgroundColor,borderColor,cbrw){
        this.desc = CONST.CLOSEDPENCIL;
        this.pos = 0;
        if(points !== undefined){
            this.points = points;
        }else{
            this.points = [];
        }
        this.borderColor = borderColor;
        this.backgroundColor = backgroundColor;
        this.cbrw = cbrw;
    }
    draw(context, plusX = 0, plusY = 0){
        context.fillStyle= this.backgroundColor;
        context.strokeStyle = this.borderColor;
        context.beginPath();
        context.moveTo(this.points[0].x + plusX, this.points[0].y + plusY);
        for(var i = 1; i < this.points.length; i++){
            context.lineTo(this.points[i].x + plusX,this.points[i].y + plusY);
        }
        context.lineTo(this.points[0].x + plusX, this.points[0].y + plusY);
        context.lineWidth = this.borderWidth;
        context.closePath();
        context.fill();
        if(context.lineWidth>0){
            context.stroke();
        }
    }
}
class Rubber{
    constructor(points,cbrw){
        this.desc = CONST.RUBBER;
        this.pos = 0;
        if(points !== undefined){
            this.points = points;
        }else{
            this.points = [];
        }
        this.cbrw = cbrw;
    }
    draw(context){
        for(var i = 0; i < this.points.length-1; i++){
            context.clearRect(this.points[i].x-this.borderWidth/2,this.points[i].y-this.borderWidth/2,this.borderWidth/2,this.borderWidth/2);
        }
        context.stroke();
    }
}
class Picture{
    constructor(img,src,sx,sy,sw,sh,x,y,width,height,grad){
        this.desc = CONST.PICTURE;
        this.pos = 0;
        this.img = img;
        this.src = src;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        //Area to cut from image
        this.sx = sx;
        this.sy = sy;
        this.sw = sw;
        this.sh = sh;
        
        this.grad = grad;
        
        var elem = this;
    }
    draw(context, plusX = 0, plusY = 0){
        context.rotate(this.grad*Math.PI/180);
        context.drawImage(this.img,this.sx + plusX,this.sy + plusY,this.sw,this.sh,this.x,this.y,this.width,this.height);
        context.rotate((360-this.grad)*Math.PI/180);
    }
    getImageFromSrc(src){
        var image = new Image();
        image.onload = function(){
            elem = addImgToElem(elem, this);
            
            elem.img = image;//ctx.drawImage(this.src,0,0); // Or at whatever offset you like
        };
        image.src = src;
    }
    addImgToElem(elem, img){
        elem.img = img;
        return elem;
    }
}

class Text {
    constructor(text, x, y, fontSize, fontFamily) {

    }
    draw(context, plusX = 0, plusY = 0) {
        context.font = `${fontSize} ${fontFamily}`;
        context.fillText(text, x + plusX, y + plusY);
    }
}

class ClickXY{
    constructor(evt){
        this.canvas = evt.target;
        this.x = evt.layerX / (parseFloat(getComputedStyle(this.canvas).width) / this.canvas.width);
        this.y = evt.layerY / (parseFloat(getComputedStyle(this.canvas).height) / this.canvas.height);
    }
}
class Layer{
    constructor(name, shapes = []){
        this.pos = 0;
        
        this.shapes = shapes;
        this.name = name;
        this.desc = "desc";
        this.visible = true;
    }
    draw(context) {
        if (this.visible) {
            this.shapes.forEach(shape => {
                shape.draw(context);
            });
        }
    }
}
class Character {
    constructor (username, shapes = [], x = 0, y = 0) {
        this.name = username;
        this.shapes = shapes;
        this.x = x;
        this.y = y;
    }
    draw (context) {
        this.shapes.forEach(shape => {
            shape.draw(context, this.x, this.y);
        });
    }
}
export {
    Arc,
    Character,
    ClickXY,
    ClosedPencil,
    Ellipse,
    Layer,
    Line,
    MasterJasonFile,
    Pencil,
    Picture,
    Poligon,
    Rect,
    Rubber,
    Text
}

export default {
    Arc,
    Character,
    ClickXY,
    ClosedPencil,
    Ellipse,
    Layer,
    Line,
    MasterJasonFile,
    Pencil,
    Picture,
    Poligon,
    Rect,
    Rubber,
    Text
}