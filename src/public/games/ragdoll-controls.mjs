import Display from '../utils/infoDisplay.mjs';

let debug = true;

/**
 *
 *
 * @export
 * @class RagdollControls
 */
export default class RagdollControls {
    constructor(socket) {
        this.ready = false;
        this.socket = socket;
        this.mouseCoords = new THREE.Vector2();
        this.display = new Display();;
    }
    addReadyButton() {
        let self = this;
        let btn = document.createElement('BUTTON');
        btn.innerHTML = "Ready?";
        btn.className = "btn login_btn ready_btn";
        btn.id = "ready-btn";
        btn.addEventListener("click", function () {
            self.socket.emit('player ready');
            self.removeReadyButton();
        })
        document.body.appendChild(btn);
        if (debug) console.log(btn);
    }
    removeReadyButton() {
        let btn = document.getElementById('ready-btn');
        btn.removeEventListener('click', function () {
            if (debug) console.log("Removed Ready Button")
        });
        if (btn) document.body.removeChild(btn);
    }
    initInput() {
        let self = this;
        window.addEventListener('mousedown', function (event) {
            event.stopPropagation();
            event.preventDefault();
            self.mouseCoords.set(
                (event.clientX / window.innerWidth) * 2 - 1,
                - (event.clientY / window.innerHeight) * 2 + 1
            );
            self.socket.emit('click request', self.mouseCoords);
        }, false);
        window.addEventListener('touchstart', function (event) {
            event.stopPropagation();
            event.preventDefault();
            self.mouseCoords.set(
                (event.clientX / window.innerWidth) * 2 - 1,
                - (event.clientY / window.innerHeight) * 2 + 1
            );
            self.socket.emit('click request', self.mouseCoords);
        }, false);
    }
    addInfoDisplay(){
        this.display.setup();
    }
    update(state){
        this.state = state;
        this.display.update(state);
    }
    setup() {
        document.body.style.backgroundImage = "none";
        document.body.style.backgroundColor = "lightBlue";
        this.initInput();
        this.addReadyButton();
        this.addInfoDisplay();
        
    }
    play() {
        
    }
}