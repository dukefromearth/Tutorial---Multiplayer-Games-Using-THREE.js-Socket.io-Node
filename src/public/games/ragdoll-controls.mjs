let clickRequest = false;
let mouseCoords = new THREE.Vector2();
let debug = true;

export default class RagdollControls {
    constructor() {
    }
    initInput() {
        window.addEventListener('mousedown', function (event) {
            event.stopPropagation();
            event.preventDefault();
            if (!clickRequest) {
                mouseCoords.set(
                    (event.clientX / window.innerWidth) * 2 - 1,
                    - (event.clientY / window.innerHeight) * 2 + 1
                );
                clickRequest = true;
            }
        }, false);
        window.addEventListener('touchstart', function (event) {
            console.log(event);
            event.stopPropagation();
            event.preventDefault();
            if (!clickRequest) {
                mouseCoords.set(
                    (event.touches[0].clientX / window.innerWidth) * 2 - 1,
                    - (event.touches[0].clientY / window.innerHeight) * 2 + 1
                );
                clickRequest = true;
            }
        }, false);
    }
    setup() {
        this.initInput();
    }
    play(socket) {
        if (clickRequest) {
            if (debug) console.log(mouseCoords);
            socket.emit('clickRequest', mouseCoords);

        }
        clickRequest = false;
    }
}