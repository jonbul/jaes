class GameSounds {
    constructor() {
        this.sounds = {};
        this.volumeElement = document.getElementById('audioVolume');
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
        this.play(this.sounds.shot.cloneNode(true));
    }
    explosion() {
        this.play(this.sounds.explosion.cloneNode(true));
    }
    play(s) {
        try {
            s.volume = this.volumeElement.value / 100;
            s.play();
        } catch(e) {}
    }
}

export default new GameSounds();