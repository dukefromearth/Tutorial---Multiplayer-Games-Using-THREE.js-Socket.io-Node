// Dependencies.
/*jshint esversion: 6 *///
import express from 'express';
import http from 'http';
import path from 'path';
import socketIO from 'socket.io';
import Game from './games/game.mjs';
import DecisionMaker from './probability-logic/decision-maker.mjs';

const __dirname = path.resolve(path.dirname(''));
const environment = process.env.ENV || "prod";
const app = express();
const server = http.Server(app);
const io = socketIO(server);
const port_num = 8000;
const debug = true;
const decisionMaker = new DecisionMaker();
decisionMaker.runTest();

let game = null;

app.set('port', port_num);
app.use('/', express.static('../../'));

// Routing
app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, '/index.html'));
});

server.listen(port_num, function () {
    console.log(`Running as ${environment} environment`);
    console.log('Starting server on port', port_num);
});

// Establish a connection with the user and add listeners
io.on('connection', function (socket) {

    socket.on('new player', function (info) {
        let player;
        if (!game) game = new Game(info.game);       // If the game type isn't running, create a new instance of it. 
        player = game.addPlayer(socket.id, info.userName, info.character);   // Add player to the current game
        let data = decisionMaker.getProbs("test");
        io.emit('setup game', game.getType(), data);  // Send the current game type to the end user
        io.emit('new player', player);              // Notify all existing players that a new player has arrived
        if (debug) {
            console.log("New User: ", player);
            console.log("Data: ", data);
        }
        run();
    });
    // When a player disconnects, remove them from the game and emit to other players
    socket.on('disconnect', function () {
        if (game) game.removePlayer(socket.id);
        io.emit('remove player', socket.id);
    });

    socket.on('click request', function (coords) {
        if (debug) console.log(coords);
        io.emit('click request', { player: game.getPlayer(socket.id), coords: coords });
    });

    socket.on('player ready', function () {
        if (debug) console.log(game.getPlayer(socket.id).id, " is ready.");
        game.players[socket.id].ready = true;
    })

});

function run() {
    setInterval(function () {
        io.emit('state', game.getAllPlayers());
        console.log(game.getAllPlayers());
    }, 1000 / 30);
}
