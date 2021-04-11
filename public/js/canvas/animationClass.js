import { Arc, Layer } from './canvasClasses.js';

class Animation {
    constructor({ repeat=false, frames =[], layer = new Layer(), x=0, y=0, width=0, height = 0, speed = 1, onEnd }) {
        const details = arguments[0];
        if (!details.speed) details.speed = 1;
        for (const prop in details) {
            this[prop] = details[prop];
        }
        this.currentFrame = -1;
    }
    play() {
        this.playing = true;
    }
    pause() {
        this.playing = true;
    }
    stop() {
        this.playing = false;
        this.currentFrame = -1;
    }
    drawFrame(context, drawable) {
        this.currentFrame += this.speed;
        if (this.currentFrame >= this.frames.length) {
            if (this.repeat) {
                this.currentFrame = 0;
            } else {
                this.stop();
            }
        }
        const frameActions = this.frames[this.currentFrame];
        if (frameActions && frameActions.length && drawable) frameActions.forEach(action => action());
        this.layer.draw(context, {x: this.x, y: this.y});

        if (this.onEnd && !this.repeat && this.currentFrame >= this.frames.length-1)
         this.onEnd();
    }
}


function getExplossionFrames() {
    const arc1 = new Arc(50, 50, 0, '#ff0000');
    const arc2 = new Arc(25, 25, 0, '#ff0000');
    const arc3 = new Arc(25, 75, 0, '#ff0000');
    const arc4 = new Arc(75, 25, 0, '#ff0000');
    const arc5 = new Arc(75, 75, 0, '#ff0000');
    const shapes = [arc1, arc2, arc3, arc4, arc5];
    const layer = new Layer('', shapes);
    const incArc = (e) => e.radius++;
    const toWhite = (e) => e.backgroundColor = '#ffffff';
    const toRed = (e) => e.backgroundColor = '#ff0000';
    const incArcWhite = (e) => {
        incArc(e);
        toWhite(e);
    }
    const incArcRed = (e) => {
        incArc(e);
        toRed(e);
    }
    const restart = () => {
        arc1.radius = 0;
        arc2.radius = 0;
        arc3.radius = 0;
        arc4.radius = 0;
        arc5.radius = 0;
    }
    const frames = [[restart]];

    for(let i = 0; i < 49; i++) {
        addActionInFrame(i*10, incArcRed.bind(null, arc1)) ;
        addActionInFrame(i*10 + 5, incArcWhite.bind(null, arc1)) ;
    }

    for(let i = 0; i < 49; i++) {
        addActionInFrame(i*10 + 5, toRed.bind(null, arc2)) ;
        addActionInFrame(i*10, incArcWhite.bind(null, arc2)) ;
        addActionInFrame(i*10 + 5, toRed.bind(null, arc3)) ;
        addActionInFrame(i*10, incArcWhite.bind(null, arc3)) ;
        addActionInFrame(i*10 + 5, toRed.bind(null, arc4)) ;
        addActionInFrame(i*10, incArcWhite.bind(null, arc4)) ;
        addActionInFrame(i*10 + 5, toRed.bind(null, arc5)) ;
        addActionInFrame(i*10, incArcWhite.bind(null, arc5)) ;
    }

    return {layer, frames}

    function addActionInFrame(frame = 0, action) {
        frames[frame] = frames[frame] || [];
        frames[frame].push(action);
    }
}

export { Animation, getExplossionFrames };