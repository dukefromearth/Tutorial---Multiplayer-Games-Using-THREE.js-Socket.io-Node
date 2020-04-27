import { hideDiv } from './utils.mjs'
import { constants } from '../shared/constants.mjs';

const playButton = document.getElementById('play-button');
const socket = io();
const debug = true;
let players = {};

// When the user submits their name, send it through the socket and hide the sign in div
playButton.onclick = () => {
    const userName = document.getElementById('user-name');
    socket.emit('new player', userName.value);
    hideDiv('sign-in');
};

// Add new user to players variable
socket.on('new player', function(player){
    players[player.id] = player;
    if(debug) console.log("New Player: ", players[player.id]);
});

// Remove user from players variable
socket.on('remove player', function(player){
    delete players[player.id];
});