import { Text } from './canvasClasses.js';

export default class MessagesManager {
    constructor(game) {
        this.game = game;
        this.player = game.player;
        this.canvas = game.canvas;
        this.context = game.context;
        this.messages = [];
        this.fontSize = game.fontSize;
        this.fontFamily = 'Arcade';
        this.lineHeight = game.lineHeight;
        this.y = parseInt(game.canvas.height - game.lineHeight * 6);
    }
    add(msg) {
        this.messages.push({
            text: msg,
            exp: Date.now() + 3000,
            opacity: 1
        });
    }
    getColor(alpha) {
        return `rgba(19, 255, 3, ${alpha})`;
    }
    draw() {
        const x = this.player.x - this.canvas.width / 2 + this.player.width / 2 + this.lineHeight;
        const y = this.player.y - this.canvas.height / 2 + this.player.height / 2 + this.y;
        const text = new Text('', x, y, this.fontSize, this.fontFamily);
        this.messages = this.messages.filter((msg, i) => {
            if (Date.now() > msg.exp) {
                msg.opacity -= 0.01;
            }
            if(msg.opacity > 0) {
                text.color = this.getColor(msg.opacity);
                text.text = msg.text;
                text.y = y + this.lineHeight * i;
                text.draw(this.context);
            }
            return msg.opacity > 0;
        });
    }
}