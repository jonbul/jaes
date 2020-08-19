import CONST from './constants.js';
class MasterJasonFile {
    constructor(cnvW, cnvH, bgc, gridH, gridV, layers) {
        this.canvas = function (cnvW, cnvH) {
            this.width = cnvW;
            this.height = cnvH;
        };
        this.canvas.width = cnvW;
        this.canvas.height = cnvH;

        this.bgc = bgc;

        this.grid = function (gridH, gridV) {
            this.height = gridH;
            this.v = gridV;
        };
        this.grid.height = gridH;
        this.grid.v = gridV;
        this.layers = layers;
    }

}
//Shapes
class Rect {
    constructor(x, y, width, height, backgroundColor, borderColor, borderWidth = 0, rorationInDegrees = 0) {
        this.desc = CONST.RECT;
        this.pos = 0;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = parseInt(borderWidth);
        this.rorationInDegrees = rorationInDegrees;
    }

    draw(context, plusX = 0, plusY = 0) {
        let moveX = this.x;
        let moveY = this.y;
        context.translate(moveX, moveY);
        if(this.rorationInDegrees>0) {
            moveX = this.x + this.width / 2;
            moveY = this.y + this.height / 2;
            context.rotate((this.rorationInDegrees * 2 / 360) * Math.PI);
        }

        context.fillStyle = this.backgroundColor;//BACKGROUND
        context.fillRect(plusX, plusY, this.width, this.height);

        context.strokeRect(plusX, plusY, this.width, this.height);
        context.strokeStyle = this.borderColor;
        context.lineWidth = this.borderWidth;
        context.stroke();
        
        context.setTransform(1, 0, 0, 1, 0, 0);
    }
    draw100x100(context, boardSmallSideSize = 100) {
        const minLength = boardSmallSideSize * 90 / 100;
        const padding = boardSmallSideSize * 5 / 100;

        let width, height;
        if (this.width >= this.height) {
            width = minLength;
            height = this.height * minLength / this.width;
        } else {
            height = minLength;
            width = this.width * minLength / this.height;
        }
        if(this.rorationInDegrees>0)
            context.rotate(this.rorationInDegrees*Math.PI/180);

        context.fillStyle = this.backgroundColor;
        context.fillRect(padding, padding, width, height);
        
        context.strokeRect(padding, padding, width, height);
        context.strokeStyle = this.borderColor;
        context.lineWidth = this.borderWidth;
        
        context.stroke();
        context.setTransform(1, 0, 0, 1, 0, 0);
    }
}
class Arc {
    constructor(x, y, radius, backgroundColor, borderColor, borderWidth, startAngle = 0, endAngle = 360) {
        this.desc = CONST.ARC;
        this.pos = 0;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.startAngle = (startAngle * 2 / 360) * Math.PI;
        this.endAngle = (endAngle * 2 / 360) * Math.PI;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = parseInt(borderWidth);
    }
    draw(context, plusX = 0, plusY = 0) {
        if (this.radius < 0) this.radius *= -1;
        context.beginPath();
        context.fillStyle = this.backgroundColor;//BACKGROUND
        context.arc(this.x + plusX, this.y + plusY, this.radius, this.startAngle, this.endAngle);
        if (this.borderWidth > 0) {
            context.strokeStyle = this.borderColor;//BORDER
            context.lineWidth = this.borderWidth;
            context.stroke();
        }

        context.fill();
    }
    draw100x100(context, boardSmallSideSize = 100) {
        const radius = boardSmallSideSize / 2;
        if (this.radius < 0) this.radius *= -1;
        context.beginPath();
        context.fillStyle = this.backgroundColor;//BACKGROUND
        context.arc(radius, radius, radius, this.startAngle, this.endAngle);
        if (this.borderWidth > 0) {
            context.strokeStyle = this.borderColor;//BORDER
            context.lineWidth = this.borderWidth;
            context.stroke();
        }

        context.fill();
    }
}
class Ellipse {
    constructor(x, y, radiusX, radiusY, rotation, backgroundColor, borderColor, borderWidth, startAngle = 0, endAngle = 360) {
        this.desc = CONST.ELLIPSE;
        this.pos = 0;
        this.x = x;
        this.y = y;
        this.radiusX = radiusX;
        this.radiusY = radiusY;
        this.rotation = rotation;
        this.startAngle = (startAngle * 2 / 360) * Math.PI;
        this.endAngle = (endAngle * 2 / 360) * Math.PI;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = parseInt(borderWidth);
    }
    draw(context, plusX = 0, plusY = 0) {
        if (this.radius < 0) this.radius *= -1;
        context.beginPath();
        context.fillStyle = this.backgroundColor;//BACKGROUND
        context.ellipse(this.x + plusX, this.y + plusY, this.radiusX, this.radiusY, this.rotation, this.startAngle, this.endAngle);
        if (this.borderWidth > 0) {
            context.strokeStyle = this.borderColor;//BORDER
            context.lineWidth = this.borderWidth;
            context.stroke();
        }

        context.fill();
    }
    draw100x100(context, boardSmallSideSize = 100) {
        let rx, ry;
        if (this.radiusX >= this.radiusY) {
            rx = boardSmallSideSize / 2;
            ry = this.radiusY * boardSmallSideSize / this.radiusX;
        } else {
            ry = boardSmallSideSize / 2;
            rx = this.radiusX * boardSmallSideSize / this.radiusY;
        }
        context.beginPath();
        context.fillStyle = this.backgroundColor;//BACKGROUND
        context.ellipse(rx, ry, rx, ry, this.rotation, this.startAngle, this.endAngle);
        if (this.borderWidth > 0) {
            context.strokeStyle = this.borderColor;//BORDER
            context.lineWidth = this.borderWidth;
            context.stroke();
        }

        context.fill();

    }
}
class Line {
    constructor(x1, y1, x2, y2, borderColor, borderWidth) {
        this.desc = CONST.LINE;
        this.pos = 0;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.borderColor = borderColor;
        this.borderWidth = parseInt(borderWidth);
    }
    draw(context, plusX = 0, plusY = 0) {
        context.beginPath();
        context.strokeStyle = this.borderColor;//BORDER
        context.moveTo(this.x1 + plusX, this.y1 + plusY);
        context.lineTo(this.x2 + plusX, this.y2 + plusY);
        context.lineWidth = this.borderWidth;
        context.stroke();
        context.fill();
    }
    draw100x100(context, boardSmallSideSize = 100) {
        let x1, x2, y1, y2;
        let maxValue = Math.max(this.x1, this.x2, this.y1, this.y2);
        x1 = this.x1 * boardSmallSideSize / maxValue;
        x2 = this.x2 * boardSmallSideSize / maxValue;
        y1 = this.y1 * boardSmallSideSize / maxValue;
        y2 = this.y2 * boardSmallSideSize / maxValue;
        context.beginPath();
        context.strokeStyle = this.borderColor;//BORDER
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.lineWidth = this.borderWidth * 2;
        context.stroke();
        context.fill();
    }
}
class Polygon {
    constructor(points = [], backgroundColor, borderColor, borderWidth) {
        this.desc = CONST.POLYGON;
        this.pos = 0;
        this.points = points;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = parseInt(borderWidth);
    }
    draw(context, plusX = 0, plusY = 0) {
        if (this.points.length > 0) {
            context.fillStyle = this.backgroundColor;
            context.strokeStyle = this.borderColor;
            context.beginPath();
            context.moveTo(this.points[0].x + plusX, this.points[0].y + plusY);
            for (var i = 1; i < this.points.length; i++) {
                context.lineTo(this.points[i].x + plusX, this.points[i].y + plusY);
            }
            context.lineWidth = this.borderWidth;
            context.closePath();
            context.fill();
            context.stroke();
        }
    }
    draw100x100(context, boardSmallSideSize = 100) {
        let newPoints = [];
        this.points.forEach(p => {
            newPoints.push(p.x);
            newPoints.push(p.y);
        });
        let maxValue = Math.max(...newPoints);
        let minValue = Math.min(...newPoints);

        let x = (this.points[0].x - minValue) * boardSmallSideSize / maxValue;
        let y = (this.points[0].y - minValue) * boardSmallSideSize / maxValue;

        context.fillStyle = this.backgroundColor;
        context.strokeStyle = this.borderColor;
        context.beginPath();
        context.moveTo(x, y);
        for (var i = 1; i < this.points.length; i++) {
            let x = (this.points[i].x - minValue) * boardSmallSideSize / maxValue;
            let y = (this.points[i].y - minValue) * boardSmallSideSize / maxValue;
            context.lineTo(x, y);
        }
        x = (this.points[0].x - minValue) * boardSmallSideSize / maxValue;
        y = (this.points[0].y - minValue) * boardSmallSideSize / maxValue;
        context.lineTo(x, y);
        context.lineWidth = this.borderWidth;
        context.closePath();
        context.fill();
        if (context.lineWidth > 0) {
            context.stroke();
        }
    }
}
class Pencil {
    constructor(points = [], color, borderWidth = 1) {
        this.desc = CONST.PENCIL;
        this.pos = 0;
        this.points = points;
        this.color = color;
        this.borderWidth = parseInt(borderWidth);
    }
    draw(context, plusX = 0, plusY = 0) {
        context.strokeStyle = this.color;
        context.beginPath();
        context.moveTo(this.points[0].x + plusX, this.points[0].y + plusY);
        for (var i = 1; i < this.points.length; i++) {
            context.lineTo(this.points[i].x + plusX, this.points[i].y + plusY);
        }
        context.lineWidth = this.borderWidth;
        context.stroke();
    }
    draw100x100(context, boardSmallSideSize = 100) {
        let newPoints = [];
        this.points.forEach(p => {
            newPoints.push(p.x);
            newPoints.push(p.y);
        });
        let maxValue = Math.max(...newPoints);
        let minValue = Math.min(...newPoints);

        let x = (this.points[0].x - minValue) * boardSmallSideSize / maxValue;
        let y = (this.points[0].y - minValue) * boardSmallSideSize / maxValue;
        context.strokeStyle = this.color;
        context.beginPath();
        context.moveTo(x, y);
        for (var i = 1; i < this.points.length; i++) {
            let x = (this.points[i].x - minValue) * boardSmallSideSize / maxValue;
            let y = (this.points[i].y - minValue) * boardSmallSideSize / maxValue;
            context.lineTo(x, y);
        }
        context.lineWidth = this.borderWidth * 2;
        context.stroke();
    }
}
class Abstract {
    constructor(points, backgroundColor, borderColor, borderWidth) {
        this.desc = CONST.ABSTRACT;
        this.pos = 0;
        if (points !== undefined) {
            this.points = points;
        } else {
            this.points = [];
        }
        this.borderColor = borderColor;
        this.backgroundColor = backgroundColor;
        this.borderWidth = parseInt(borderWidth);
    }
    draw(context, plusX = 0, plusY = 0) {
        context.fillStyle = this.backgroundColor;
        context.strokeStyle = this.borderColor;
        context.beginPath();
        context.moveTo(this.points[0].x + plusX, this.points[0].y + plusY);
        for (var i = 1; i < this.points.length; i++) {
            context.lineTo(this.points[i].x + plusX, this.points[i].y + plusY);
        }
        context.lineTo(this.points[0].x + plusX, this.points[0].y + plusY);
        context.lineWidth = this.borderWidth;
        context.closePath();
        context.fill();
        if (context.lineWidth > 0) {
            context.stroke();
        }
    }
    draw100x100(context, boardSmallSideSize = 100) {
        let newPoints = [];
        this.points.forEach(p => {
            newPoints.push(p.x);
            newPoints.push(p.y);
        });
        let maxValue = Math.max(...newPoints);
        let minValue = Math.min(...newPoints);

        let x = (this.points[0].x - minValue) * boardSmallSideSize / maxValue;
        let y = (this.points[0].y - minValue) * boardSmallSideSize / maxValue;

        context.fillStyle = this.backgroundColor;
        context.strokeStyle = this.borderColor;
        context.beginPath();
        context.moveTo(x, y);
        for (var i = 1; i < this.points.length; i++) {
            let x = (this.points[i].x - minValue) * boardSmallSideSize / maxValue;
            let y = (this.points[i].y - minValue) * boardSmallSideSize / maxValue;
            context.lineTo(x, y);
        }
        x = (this.points[0].x - minValue) * boardSmallSideSize / maxValue;
        y = (this.points[0].y - minValue) * boardSmallSideSize / maxValue;
        context.lineTo(x, y);
        context.lineWidth = this.borderWidth;
        context.closePath();
        context.fill();
        if (context.lineWidth > 0) {
            context.stroke();
        }
    }
}
class Rubber {
    constructor(points, borderWidth) {
        this.desc = CONST.RUBBER;
        this.pos = 0;
        if (points !== undefined) {
            this.points = points;
        } else {
            this.points = [];
        }
        this.borderWidth = parseInt(borderWidth);
    }
    draw(context) {
        for (var i = 0; i < this.points.length - 1; i++) {
            context.clearRect(this.points[i].x - this.borderWidth / 2, this.points[i].y - this.borderWidth / 2, this.borderWidth / 2, this.borderWidth / 2);
        }
        context.stroke();
    }
    draw100x100(context, boardSmallSideSize = 100) {
        let newPoints = [];
        this.points.forEach(p => {
            newPoints.push(p.x);
            newPoints.push(p.y);
        });
        let maxValue = Math.max(...newPoints);
        let minValue = Math.min(...newPoints);

        let x = (this.points[0].x - minValue) * boardSmallSideSize / maxValue;
        let y = (this.points[0].y - minValue) * boardSmallSideSize / maxValue;
        context.strokeStyle = '#000000';
        context.beginPath();
        context.moveTo(x, y);
        for (var i = 1; i < this.points.length; i++) {
            let x = (this.points[i].x - minValue) * boardSmallSideSize / maxValue;
            let y = (this.points[i].y - minValue) * boardSmallSideSize / maxValue;
            context.lineTo(x, y);
        }
        context.lineWidth = this.borderWidth * 2;
        context.stroke();
    }
}
class Picture {
    constructor(img, src, sx, sy, sw, sh, x, y, width, height, grad) {
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
    draw(context, plusX = 0, plusY = 0) {
        context.rotate(this.grad * Math.PI / 180);
        context.drawImage(this.img, this.sx + plusX, this.sy + plusY, this.sw, this.sh, this.x, this.y, this.width, this.height);
        context.rotate((360 - this.grad) * Math.PI / 180);
    }
    getImageFromSrc(src) {
        var image = new Image();
        image.onload = function () {
            elem = addImgToElem(elem, this);

            elem.img = image;//ctx.drawImage(this.src,0,0); // Or at whatever offset you like
        };
        image.src = src;
    }
    addImgToElem(elem, img) {
        elem.img = img;
        return elem;
    }
}

class Text {
    constructor(text, x, y, fontSize = 12, fontFamily = 'Helvetica', color = '#000000') {
        this.text = text;
        this.x = x;
        this.y = y;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.color = color;
    }
    draw(context, plusX = 0, plusY = 0) {
        context.font = `${this.fontSize} ${this.fontFamily}`;
        context.fillStyle = this.color;
        context.fillText(this.text, this.x + plusX, this.y + plusY);
    }
}

class ClickXY {
    constructor(evt) {
        this.canvas = evt.target;
        this.x = evt.layerX / (parseFloat(getComputedStyle(this.canvas).width) / this.canvas.width);
        this.y = evt.layerY / (parseFloat(getComputedStyle(this.canvas).height) / this.canvas.height);
    }
}
class Layer {
    constructor(name, shapes = []) {
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
    constructor(username, shapes = [], x = 0, y = 0) {
        this.name = username;
        this.shapes = shapes;
        this.x = x;
        this.y = y;
        this.nameShape = new Text(this.name, this.x, this.y - 10, 10, 'Helvetica', '#222222')
    }
    draw(context) {
        this.shapes.forEach(shape => {
            shape.draw(context, this.x, this.y);
        });
        this.nameShape.draw(context, this.x, this.y);
    }
}
export {
    Abstract,
    Arc,
    Character,
    ClickXY,
    Ellipse,
    Layer,
    Line,
    MasterJasonFile,
    Pencil,
    Picture,
    Polygon,
    Rect,
    Rubber,
    Text
}

export default {
    Abstract,
    Arc,
    Character,
    ClickXY,
    Ellipse,
    Layer,
    Line,
    MasterJasonFile,
    Pencil,
    Picture,
    Polygon,
    Rect,
    Rubber,
    Text
}