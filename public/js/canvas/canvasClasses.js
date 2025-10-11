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
    constructor(x, y, width, height, backgroundColor, borderColor, borderWidth = 0, rotation = 0, name) {
        this.desc = CONST.RECT;
        this.name = name || this.desc;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = parseInt(borderWidth);
        this.rotation = rotation;
    }

    draw(context, options = { x: 0, y: 0 }) {
        context.translate(options.x, options.y);
        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }

        if (this.rotation > 0) {
            const moveX = this.x + this.width / 2;
            const moveY = this.y + this.height / 2;
            context.translate(moveX, moveY);
            context.rotate(this.rotation);
            context.translate(-moveX, -moveY);
        }

        context.beginPath();
        context.rect(this.x, this.y, this.width, this.height);
        context.fillStyle = this.backgroundColor;
        context.fill();
        if (this.borderWidth > 0) {
            context.strokeStyle = this.borderColor;
            context.lineWidth = this.borderWidth;
            context.stroke();
        }

        context.setTransform(1, 0, 0, 1, 0, 0);

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(-options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }
        context.translate(-options.x, -options.y);
        //context.setTransform(1, 0, 0, 1, 0, 0);
    }

    drawResized(context, resizeSize) {
        let scale;
        if (this.width >= this.height) {
            scale = resizeSize / context.canvas.width;
        } else {
            scale = resizeSize / context.canvas.height;
        }
        scale = 1;

        context.scale(scale, scale);

        if (this.rotation > 0) {
            const moveX = this.x + this.width / 2;
            const moveY = this.y + this.height / 2;
            context.translate(moveX, moveY);
            context.rotate(this.rotation);
            context.translate(-moveX, -moveY);
        }

        context.fillStyle = this.backgroundColor;//BACKGROUND
        context.fillRect(this.x, this.y, this.width, this.height);

        if (this.borderWidth) {
            context.strokeStyle = this.borderColor;
            context.lineWidth = this.borderWidth;
            context.strokeRect(moveX, moveY, this.width, this.height);
        }

        context.setTransform(1, 0, 0, 1, 0, 0);
    }
}
class Arc {
    constructor(x, y, radius, backgroundColor, borderColor, borderWidth, startAngle = 0, endAngle = 2 * Math.PI, name, mirror = false) {
        this.desc = CONST.ARC;
        this.name = name || this.desc;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = parseInt(borderWidth);
        this.mirror = mirror;
        this.rotation = 0;
    }
    draw(context, options = { x: 0, y: 0, rotate: 0 }) {
        context.translate(options.x, options.y);

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }

        if (this.rotation > 0) {
            const moveX = this.x// + this.width / 2;
            const moveY = this.y// + this.height / 2;
            context.translate(moveX, moveY);
            context.rotate(this.rotation);
            context.translate(-moveX, -moveY);
        }

        if (this.radius < 0) this.radius *= -1;
        context.beginPath();
        context.fillStyle = this.backgroundColor;//BACKGROUND
        context.arc(this.x, this.y, this.radius, this.startAngle, this.endAngle, this.mirror);
        if (this.borderWidth) {
            context.strokeStyle = this.borderColor;//BORDER
            context.lineWidth = this.borderWidth;
            context.stroke();
        }
        context.fill();
        context.setTransform(1, 0, 0, 1, 0, 0);

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(-options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }
        context.translate(-options.x, -options.y);
        //context.setTransform(1, 0, 0, 1, 0, 0);
    }
    drawResized(context, resizeSize = 100) {
        const radius = resizeSize / 2;
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
    constructor(x, y, radiusX, radiusY, rotation = 0, backgroundColor, borderColor, borderWidth, startAngle = 0, endAngle = 2 * Math.PI, name) {
        this.desc = CONST.ELLIPSE;
        this.name = name || this.desc;
        this.x = x;
        this.y = y;

        this.radiusX = Math.abs(radiusX);
        this.radiusY = Math.abs(radiusY);
        this.rotation = rotation;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = parseInt(borderWidth);
    }
    draw(context, options = { x: 0, y: 0, rotate: 0 }) {
        context.translate(options.x, options.y);

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }

        context.beginPath();
        context.fillStyle = this.backgroundColor;//BACKGROUND
        context.ellipse(this.x, this.y, this.radiusX, this.radiusY, this.rotation, this.startAngle, this.endAngle);
        if (this.borderWidth > 0) {
            context.strokeStyle = this.borderColor;//BORDER
            context.lineWidth = this.borderWidth;
            context.stroke();
        }
        context.fill();

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(-options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }
        context.translate(-options.x, -options.y);
    }

    drawResized(context, resizeSize = 100) {
        let rx, ry;
        if (this.radiusX >= this.radiusY) {
            rx = resizeSize / 2;
            ry = this.radiusY * resizeSize / this.radiusX;
        } else {
            ry = resizeSize / 2;
            rx = this.radiusX * resizeSize / this.radiusY;
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
    constructor(points = [], borderColor = '#ffffff', borderWidth = 1, name) {
        this.desc = CONST.LINE;
        this.name = name || this.desc;
        this.points = points;
        this.borderColor = borderColor;
        this.borderWidth = parseInt(borderWidth);
    }
    draw(context, options = { x: 0, y: 0, rotate: 0 }) {
        context.translate(options.x, options.y);

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }

        context.beginPath();
        context.strokeStyle = this.borderColor;//BORDER
        context.moveTo(this.points[0].x, this.points[0].y);
        context.lineTo(this.points[1].x, this.points[1].y);
        context.lineWidth = this.borderWidth;
        context.stroke();
        context.fill();

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(-options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }
        context.translate(-options.x, -options.y);
    }
    drawResized(context, resizeSize = 100) {
        let x1, x2, y1, y2;
        let maxValue = Math.max(this.x1, this.x2, this.y1, this.y2);
        x1 = this.points[0].x * resizeSize / maxValue;
        x2 = this.points[1].x * resizeSize / maxValue;
        y1 = this.points[0].y * resizeSize / maxValue;
        y2 = this.points[1].y * resizeSize / maxValue;
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
    constructor(points = [], backgroundColor, borderColor, borderWidth, name, rotation = 0) {
        this.desc = CONST.POLYGON;
        this.name = name || this.desc;
        this.points = points;
        this.backgroundColor = backgroundColor;
        this.borderColor = borderColor;
        this.borderWidth = parseInt(borderWidth);
        this.rotation = rotation;
    }
    draw(context, options = { x: 0, y: 0, rotate: 0 }) {
        context.translate(options.x, options.y);

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }


        if (this.rotation > 0) {
            // min x and y in points
            const minX = Math.min(...this.points.map(p => p.x));
            const minY = Math.min(...this.points.map(p => p.y));
            // max x and y in points
            const maxX = Math.max(...this.points.map(p => p.x));
            const maxY = Math.max(...this.points.map(p => p.y));
            const moveX = minX + (maxX - minX) / 2;
            const moveY = minY + (maxY - minY) / 2;
            context.translate(moveX, moveY);
            context.rotate(this.rotation);
            context.translate(-moveX, -moveY);
        }

        if (this.points.length > 0) {
            context.fillStyle = this.backgroundColor;
            context.beginPath();
            context.moveTo(this.points[0].x, this.points[0].y);
            for (var i = 1; i < this.points.length; i++) {
                context.lineTo(this.points[i].x, this.points[i].y);
            }
            context.lineWidth = this.borderWidth;
            context.closePath();
            context.fill();
            if (this.borderWidth) {
                context.strokeStyle = this.borderColor;
                context.stroke();
            }

            context.fill();
            context.setTransform(1, 0, 0, 1, 0, 0);
        }
        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(-options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }
        context.translate(-options.x, -options.y);
        //context.setTransform(1, 0, 0, 1, 0, 0);
    }
    drawResized(context, resizeSize = 100) {
        let newPoints = [];
        this.points.forEach(p => {
            newPoints.push(p.x);
            newPoints.push(p.y);
        });
        let maxValue = Math.max(...newPoints);
        let minValue = Math.min(...newPoints);

        let x = (this.points[0].x - minValue) * resizeSize / maxValue;
        let y = (this.points[0].y - minValue) * resizeSize / maxValue;

        if (this.rotation > 0) {
            // min x and y in points
            const minX = Math.min(...this.points.map(p => p.x));
            const minY = Math.min(...this.points.map(p => p.y));
            // max x and y in points
            const maxX = Math.max(...this.points.map(p => p.x));
            const maxY = Math.max(...this.points.map(p => p.y));
            const moveX = minX + (maxX - minX) / 2;
            const moveY = minY + (maxY - minY) / 2;
            context.translate(moveX, moveY);
            context.rotate(this.rotation);
            context.translate(-moveX, -moveY);
        }

        context.fillStyle = this.backgroundColor;
        context.strokeStyle = this.borderColor;
        context.beginPath();
        context.moveTo(x, y);
        for (var i = 1; i < this.points.length; i++) {
            let x = (this.points[i].x - minValue) * resizeSize / maxValue;
            let y = (this.points[i].y - minValue) * resizeSize / maxValue;
            context.lineTo(x, y);
        }
        x = (this.points[0].x - minValue) * resizeSize / maxValue;
        y = (this.points[0].y - minValue) * resizeSize / maxValue;
        context.lineTo(x, y);
        context.lineWidth = this.borderWidth;
        context.closePath();
        context.fill();
        if (context.lineWidth > 0) {
            context.stroke();
        }

        context.fill();
        context.setTransform(1, 0, 0, 1, 0, 0);
    }
}
class Pencil {
    constructor(points = [], color, borderWidth = 1, name) {
        this.desc = CONST.PENCIL;
        this.name = name || this.desc;
        this.points = points;
        this.color = color;
        this.borderWidth = parseInt(borderWidth);
    }
    draw(context, options = { x: 0, y: 0 }) {
        context.translate(options.x, options.y);
        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }

        context.strokeStyle = this.color;
        context.beginPath();
        context.moveTo(this.points[0].x, this.points[0].y);
        for (var i = 1; i < this.points.length; i++) {
            context.lineTo(this.points[i].x, this.points[i].y);
        }
        context.lineWidth = this.borderWidth;
        context.stroke();

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(-options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }
        context.translate(-options.x, -options.y);
        //context.setTransform(1, 0, 0, 1, 0, 0);
    }
    drawResized(context, resizeSize = 100) {
        let newPoints = [];
        this.points.forEach(p => {
            newPoints.push(p.x);
            newPoints.push(p.y);
        });
        let maxValue = Math.max(...newPoints);
        let minValue = Math.min(...newPoints);

        let x = (this.points[0].x - minValue) * resizeSize / maxValue;
        let y = (this.points[0].y - minValue) * resizeSize / maxValue;
        context.strokeStyle = this.color;
        context.beginPath();
        context.moveTo(x, y);
        for (var i = 1; i < this.points.length; i++) {
            let x = (this.points[i].x - minValue) * resizeSize / maxValue;
            let y = (this.points[i].y - minValue) * resizeSize / maxValue;
            context.lineTo(x, y);
        }
        context.lineWidth = this.borderWidth * 2;
        context.stroke();
    }
}
class Abstract {
    constructor(points, backgroundColor, borderColor, borderWidth, name, rotation = 0) {
        this.desc = CONST.ABSTRACT;
        this.name = name || this.desc;
        if (points !== undefined) {
            this.points = points;
        } else {
            this.points = [];
        }
        this.borderColor = borderColor;
        this.backgroundColor = backgroundColor;
        this.borderWidth = borderWidth ? parseInt(borderWidth) : 0;
        this.rotation = rotation;
    }
    draw(context, options = { x: 0, y: 0, rotate: 0 }) {
        context.translate(options.x, options.y);
        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }

        if (this.rotation > 0) {
            // min x and y in points
            const minX = Math.min(...this.points.map(p => p.x));
            const minY = Math.min(...this.points.map(p => p.y));
            // max x and y in points
            const maxX = Math.max(...this.points.map(p => p.x));
            const maxY = Math.max(...this.points.map(p => p.y));
            const moveX = minX + (maxX - minX) / 2;
            const moveY = minY + (maxY - minY) / 2;
            context.translate(moveX, moveY);
            context.rotate(this.rotation);
            context.translate(-moveX, -moveY);
        }

        context.beginPath();
        context.fillStyle = this.backgroundColor;
        context.moveTo(this.points[0].x, this.points[0].y);
        for (var i = 1; i < this.points.length; i++) {
            context.lineTo(this.points[i].x, this.points[i].y);
        }
        context.lineTo(this.points[0].x, this.points[0].y);
        context.closePath();
        context.fill();
        if (this.borderWidth) {
            context.strokeStyle = this.borderColor;
            context.lineWidth = this.borderWidth;
            context.stroke();
        }

        context.setTransform(1, 0, 0, 1, 0, 0);

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(-options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }
        context.translate(-options.x, -options.y);
        //context.setTransform(1, 0, 0, 1, 0, 0);
    }
    drawResized(context, resizeSize = 100) {
        let newPoints = [];
        this.points.forEach(p => {
            newPoints.push(p.x);
            newPoints.push(p.y);
        });
        let maxValue = Math.max(...newPoints);
        let minValue = Math.min(...newPoints);

        let x = (this.points[0].x - minValue) * resizeSize / maxValue;
        let y = (this.points[0].y - minValue) * resizeSize / maxValue;

        if (this.rotation > 0) {
            // min x and y in points
            const minX = Math.min(...this.points.map(p => p.x));
            const minY = Math.min(...this.points.map(p => p.y));
            // max x and y in points
            const maxX = Math.max(...this.points.map(p => p.x));
            const maxY = Math.max(...this.points.map(p => p.y));
            const moveX = minX + (maxX - minX) / 2;
            const moveY = minY + (maxY - minY) / 2;
            context.translate(moveX, moveY);
            context.rotate(this.rotation);
            context.translate(-moveX, -moveY);
        }

        context.fillStyle = this.backgroundColor;
        context.strokeStyle = this.borderColor;
        context.beginPath();
        context.moveTo(x, y);
        for (var i = 1; i < this.points.length; i++) {
            let x = (this.points[i].x - minValue) * resizeSize / maxValue;
            let y = (this.points[i].y - minValue) * resizeSize / maxValue;
            context.lineTo(x, y);
        }
        x = (this.points[0].x - minValue) * resizeSize / maxValue;
        y = (this.points[0].y - minValue) * resizeSize / maxValue;
        context.lineTo(x, y);
        context.lineWidth = this.borderWidth;
        context.closePath();
        context.fill();
        if (context.lineWidth > 0) {
            context.stroke();
        }
        context.setTransform(1, 0, 0, 1, 0, 0);
    }
}
class Rubber {
    constructor(points, borderWidth, name) {
        this.desc = CONST.RUBBER;
        this.name = name || this.desc;
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
    drawResized(context, resizeSize = 100, options = { x: 0, y: 0, rotate: 0 }) {
        context.translate(options.x, options.y);
        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }
        let newPoints = [];
        this.points.forEach(p => {
            newPoints.push(p.x);
            newPoints.push(p.y);
        });
        let maxValue = Math.max(...newPoints);
        let minValue = Math.min(...newPoints);

        let x = (this.points[0].x - minValue) * resizeSize / maxValue;
        let y = (this.points[0].y - minValue) * resizeSize / maxValue;
        context.strokeStyle = '#000000';
        context.beginPath();
        context.moveTo(x, y);
        for (var i = 1; i < this.points.length; i++) {
            let x = (this.points[i].x - minValue) * resizeSize / maxValue;
            let y = (this.points[i].y - minValue) * resizeSize / maxValue;
            context.lineTo(x, y);
        }
        context.lineWidth = this.borderWidth * 2;
        context.stroke();

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(-options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }
        context.translate(-options.x, -options.y);
    }
}
class Picture {
    constructor(img, src, sx, sy, sw, sh, x, y, width, height, rotation = 0, name) {
        this.desc = CONST.PICTURE;
        this.name = name || this.desc;
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

        this.rotation = rotation;

    }
    draw(context, options = { x: 0, y: 0 }) {
        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }

        if (this.rotation > 0) {
            const moveX = this.x + this.width / 2;
            const moveY = this.y + this.height / 2;
            context.translate(moveX, moveY);
            context.rotate(this.rotation);
            context.translate(-moveX, -moveY);
        }

        //context.drawImage(this.img, this.sx, this.sy, this.sw, this.sh, this.x, this.y, this.width, this.height);
        context.drawImage(this.img, this.x, this.y, this.width, this.height);
        
        context.setTransform(1, 0, 0, 1, 0, 0);

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(-options.rotate);
        }
    }
    drawResized(context, resizeSize = 100, options = { x: 0, y: 0 }) {
        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(options.rotate);
            context.translate(-options.rotationCenter.x, -options.rotationCenter.y);
        }
        context.rotate(this.rotation);
        let resizedWidth;
        let resizedHeight;
        if (this.width > this.height) {
            resizedWidth = resizeSize;
            resizedHeight = this.height * resizedWidth / this.width;
        } else {
            resizedHeight = resizeSize;
            resizedWidth = this.width * resizedHeight / this.height;
        }
        //context.drawImage(this.img, this.sx, this.sy, this.sw, this.sh, this.x, this.y, this.width, this.height);
        context.drawImage(this.img, this.x, this.y, resizedWidth, resizedHeight);
        context.rotate(2 * Math.PI - this.rotation);

        if (options.rotationCenter && options.rotate) {
            context.translate(options.rotationCenter.x, options.rotationCenter.y);
            context.rotate(-options.rotate);
        }
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
    constructor(text, x, y, fontSize = 12, fontFamily = 'Helvetica', color = '#000000', width) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.color = color;
        this.width = width;
    }
    draw(context, options = { x: 0, y: 0 }) {
        context.font = `${this.fontSize}px ${this.fontFamily}`;
        context.fillStyle = this.color;
        context.fillText(this.text, this.x + options.x, this.y + options.y, this.width);
    }
}

class ClickXY {
    constructor(data = { x: 0, y: 0 }, round = { x: 1, y: 1 }) {
        const roundX = round.x || 1;
        const roundY = round.y || 1;
        this.x = Math.round(data.x / roundX) * roundX;
        this.y = Math.round(data.y / roundY) * roundY;
    }
    getSimple() {
        return {
            x: this.x,
            y: this.y
        }
    }
}
class Layer {
    constructor(name, shapes = []) {
        this.shapes = shapes;
        this.name = name;
        this.desc = "desc";
        this.visible = true;
    }
    draw(context, options) {
        if (this.visible) {
            this.shapes.forEach(shape => {
                shape.draw(context, options);
            });
        }
    }
    drawResized(context, scale) {
        if (this.visible) {
            this.shapes.forEach(shape => {
                shape.drawResized(context, scale);
            });
        }
    }
}

export {
    Abstract,
    Arc,
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