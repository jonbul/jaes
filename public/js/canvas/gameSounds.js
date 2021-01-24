class GameSounds {
    constructor() {
        this.sounds = {};
        const paths = {
            explosion: '/sounds/explossion.wav',
            shot: '/sounds/shot.wav'
        }
        for (const soundName in paths) {
            const audio = document.createElement('audio');
            audio.id = soundName;
            const source = document.createElement('source');
            source.src = paths[soundName];
            audio.appendChild(source);
            this.sounds[soundName] = audio;
        }
    }
    shot() {
        this.sounds.shot.cloneNode(true).play();
    }
    explosion() {
        this.sounds.explosion.cloneNode(true).play();
    }
}

export default new GameSounds();