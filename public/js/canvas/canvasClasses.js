import _const from './constants.js';
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
//FORMS
class Rect{
    constructor(x,y,width,height,backgroundColor,borderColor,borderWidth = 0,rorationInDegrees = 0){
        this.desc = _const.RECT;
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
    
    draw (context) {
        if (this.rorationInDegrees)
        context.rotate(this.grad*Math.PI/180);
        
        context.fillStyle=this.backgroundColor;//BACKGROUND
        context.fillRect(this.x,this.y,this.width,this.height);
        if (this.borderWidth) {
            context.strokeRect(this.x,this.y,this.width,this.height);
            context.strokeStyle = this.borderColor;
            context.lineWidth=this.borderWidth;
            context.stroke();
        }
        if (this.rorationInDegrees)
        context.rotate((360-this.rorationInDegrees)*Math.PI/180);
    }
}
class Arc{
    constructor(x,y,radius,startAngle,endAngle,backgroundColor,borderColor,borderWidth){
        this.desc = _const.ARC;
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
    draw(context){
        if(this.radius<0)this.radius*=-1;
        context.beginPath();
        context.fillStyle = this.backgroundColor;//BACKGROUND
        context.arc(this.x,this.y,this.radius, this.startAngle, this.endAngle);
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
        this.desc = _const.ELLIPSE;
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
    draw(context){
        if(this.radius<0)this.radius*=-1;
        context.beginPath();
        context.fillStyle = this.backgroundColor;//BACKGROUND
        context.ellipse(this.x,this.y,this.radiusX,this.radiusY,this.rotation, this.startAngle, this.endAngle);
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
        this.desc = _const.LINE;
        this.pos = 0;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.borderColor = borderColor;
        this.borderWidth = borderWidth;
    }
    draw(context){
        context.beginPath();
        context.strokeStyle = this.borderColor;//BORDER
        context.moveTo(this.x1,this.y1);
        context.lineTo(this.x2,this.y2);
        context.lineWidth = this.borderWidth; 
        context.stroke();
        context.fill();
    }
}
class Poligon{
    constructor(points,backgroundColor,borderColor,borderWidth){
        this.desc = _const.POLIGON;
        this.pos = 0;
        this.points = points || [];
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = borderWidth;
    }
    draw(context){
        if(this.points.length>0){
            context.fillStyle= this.backgroundColor;
            context.strokeStyle = this.borderColor;
            context.beginPath();
            context.moveTo(this.points[0].x, this.points[0].y);
            for(var i = 1; i < this.points.length; i++){
                context.lineTo(this.points[i].x,this.points[i].y);
            }
            context.lineWidth = this.borderWidth;
            context.closePath();
            context.fill();
            context.stroke();
        }
    }
}
class Pencil{
    constructor(points,borderColor,cbrw){
        this.desc = _const.PENCIL;
        this.pos = 0;
        if(points !== undefined){
            this.points = points;
        }else{
            this.points = [];
        }
        this.borderColor = borderColor;
        this.cbrw = cbrw;
    }
    draw(context){
        context.strokeStyle = this.borderColor;
        context.beginPath();
        context.moveTo(this.points[0].x, this.points[0].y);
        for(var i = 1; i < this.points.length; i++){
            context.lineTo(this.points[i].x,this.points[i].y);
        }
        context.lineWidth = this.borderWidth;
        context.stroke();
    }
}
class ClosedPencil{
    constructor(points,backgroundColor,borderColor,cbrw){
        this.desc = _const.CLOSEDPENCIL;
        this.pos = 0;
        if(points !== undefined){
            this.points = points;
        }else{
            this.points = [];
        }
        this.borderColor = borderColor;
        this.cbrw = cbrw;
    }
    draw(context){
        context.fillStyle= this.backgroundColor;
        context.strokeStyle = this.borderColor;
        context.beginPath();
        context.moveTo(this.points[0].x, this.points[0].y);
        for(var i = 1; i < this.points.length; i++){
            context.lineTo(this.points[i].x,this.points[i].y);
        }
        context.lineTo(this.points[0].x, this.points[0].y);
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
        this.desc = _const.RUBBER;
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
        this.desc = _const.PICTURE;
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
    draw(context){
        context.rotate(this.grad*Math.PI/180);
        context.drawImage(this.img,this.sx,this.sy,this.sw,this.sh,this.x,this.y,this.width,this.height);
        context.rotate((360-this.grad)*Math.PI/180);
    }
    getImageFromSrc(src){
        var image = new Image();
        var b = false;
        image.onload = function(){
            elem = addImgToElem(elem, this);
            
            elem.img = image;//ctx.drawImage(this.src,0,0); // Or at whatever offset you like
        };
        image.src = src;
        //while(!b);
    }
    addImgToElem(elem, img){
        elem.img = img;
        return elem;
    }
}

class Text {
    constructor(text, x, y, fontSize, fontFamily) {

    }
    draw(context) {
        context.font = `${fontSize} ${fontFamily}`;
        context.fillText(text, x, y);
    }
}

class ClickXY{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
}
class Layer{
    constructor(elements){
        this.pos = 0;
        
        if(elements === undefined){
            this.elements = [];
        }else{
            this.elements = elements;
        }
        this.name = "name";
        this.desc = "desc";
        this.visible = true;
    }
}

export {
    Arc,
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
    Rubber
}