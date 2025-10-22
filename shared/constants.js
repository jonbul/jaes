const RECT = 'Rect';
const ARC = 'Arc';
const SEMIARC = 'Semiarc';
const LINE = 'Line';
const PENCIL = 'Pencil';
const ABSTRACT = 'Abstract';
const POLYGON = 'Polygon';
const RUBBER = 'Rubber';
const PICTURE = 'Picture';
const ELLIPSE = 'Ellipse';
const LAYER = 'Layer';
const TEXT = 'Text';
const PROJECT_SHAPE = 'ProjectShape';
const POLYFORM = 'Polyform';
const COLORPICKER = 'ColorPicker';
const KEYS = {
    TAB: 9,
    SHIFT: 16,
    CTRL: 17,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    PLUS: 107,
    MINUS: 109,
    F11: 122
}
const MOUSE_KEYS = {
    LEFT: 0,
    CENTER: 1,
    RIGHT: 2
}
const MOUSE_KEYS_BUTTONS = {
    LEFT: 0b0001,
    CENTER: 0b0100,
    RIGHT: 0b0010
}
const KILLWORDS = [
    'KILLED',
    'DEFEATED',
    'HUMILIATED',
    'DESTROYED',
    'TRAMPLED',
    'KICKED'
]
const CHARGE_TIME = 4;
const CHARGE_TIME_OVERFLOW = 1;


const ALERT_TYPES = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    SUCCESS: 'success',
    DANGER: 'danger',
    WARNING: 'warning',
    INFO: 'info',
    LIGHT: 'light',
    DARK: 'dark'
}


const CONST = {
    RECT, ARC, SEMIARC, LINE, PENCIL, ABSTRACT, POLYGON, RUBBER, PICTURE, ELLIPSE, LAYER, POLYFORM, TEXT, PROJECT_SHAPE, KEYS, MOUSE_KEYS, MOUSE_KEYS_BUTTONS, COLORPICKER, KILLWORDS, CHARGE_TIME, CHARGE_TIME_OVERFLOW, ALERT_TYPES
};

// CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONST;
}

// ESM (Frontend, bundler)
export {
    RECT, ARC, SEMIARC, LINE, PENCIL, ABSTRACT, POLYGON, RUBBER, PICTURE, ELLIPSE, LAYER, POLYFORM, TEXT, PROJECT_SHAPE, KEYS, MOUSE_KEYS, MOUSE_KEYS_BUTTONS, COLORPICKER, KILLWORDS, CHARGE_TIME, CHARGE_TIME_OVERFLOW, ALERT_TYPES
};
export default CONST;