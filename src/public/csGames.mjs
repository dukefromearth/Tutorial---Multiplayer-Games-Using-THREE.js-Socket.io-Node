import { hideDiv, showDiv, DeviceInfo, isMobile, showHTML } from './utils.mjs'
import Ragdoll from './games/ragdoll.mjs';
import RagdollControls from './games/ragdoll-controls.mjs';
import { constants } from '../shared/constants.mjs';

const playButton = document.getElementById('play-button');
const socket = io();
const debug = true;
let players = {};
let game = null;

function initMobile() {
    hideDiv('loading');

    // When the user submits their name, send it through the socket and hide the sign in div
    playButton.onclick = () => {
        const userName = document.getElementById('user-name');
        const game = document.getElementById('game');
        const type = document.getElementById('type');
        const character = document.getElementById('character');
        socket.emit('new player', { userName: userName.value, game: game.value, type: type.value, character: character.value });
        hideDiv('sign-in');
        showDiv('loading');
    };

    //Sets up the game based on user input
    socket.on('setup game', function (gameType) {
        if (!game) {
            let setupDiv = document.getElementById('container');
            setupDiv.remove();
            if (gameType === "ragdoll") game = new RagdollControls();
            game.setup();
            run();
        };
    });

    showHTML();
}

function initGame() {

    hideDiv('sign-in');

    // Add new user to players variable
    socket.on('new player', function (player) {
        players[player.id] = player;
        if (debug) console.log("New Player: ", players[player.id]);
    });

    // Remove user from players variable
    socket.on('remove player', function (player) {
        delete players[player.id];
    });

    // If a game isn't running, set it up
    socket.on('setup game', function (gameType) {
        if (!game) {
            let container = document.getElementById('container');
            container.remove();
            if (gameType === "ragdoll") game = new Ragdoll();
            game.setup();
            run();
        };
    });

    socket.on('clickRequest', function(data){
        game.processClickRequest(data.player, data.coords)
    });

    showHTML();
}

if (isMobile()) {
    initMobile();
    if (debug) console.log("Mobile Starting");
} else {
    initGame();
    if (debug) console.log("Game Starting")
}

const run = () => {
    requestAnimationFrame(run);
    if(game) game.play(socket);
}

