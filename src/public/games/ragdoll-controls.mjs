let clickRequest = false;
let mouseCoords = new THREE.Vector2();
let debug = true;

export default class RagdollControls {
    constructor() {
        this.ready = false;
    }
    addReadyButton(){
        let self = this;
        let btn = document.createElement('BUTTON');
        btn.innerHTML = "Ready?";
        btn.className = "btn login_btn ready_btn";
        btn.id = "ready-btn";
        btn.addEventListener("click", function(){
            self.ready = true;
            self.removeReadyButton();
        })
        document.body.appendChild(btn);
        console.log(btn);
    }
    removeReadyButton(){
        let btn = document.getElementById('ready-btn');
        btn.removeEventListener('click');
        if(btn) document.body.removeChild(btn);
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
        this.addReadyButton();
    }
    play(socket) {
        if (clickRequest && this.ready) {
            if (debug) console.log(mouseCoords);
            socket.emit('clickRequest', mouseCoords);
        } else if (this.ready) {
            socket.emit('player ready');
        }
        clickRequest = false;
    }
}