// Dependencies.
/*jshint esversion: 6 *///
import express from 'express';
import http from 'http';
import path from 'path';
import socketIO from 'socket.io';
import Game from './robo-soccer/game.mjs';

const __dirname = path.resolve(path.dirname(''));
const environment = process.env.ENV || "prod";
const app = express();
const server = http.Server(app);
const io = socketIO(server);
const port_num = 8000;
const game = new Game();
const debug = true;

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
io.on('connection', function(socket){
    // When new player is added, add them to the game and emit to other players
    socket.on('new player', function(userName){
        let player;
        game.addPlayer(socket.id, userName);
        player = game.getPlayer(socket.id);
        if(debug) console.log("New User: ", player);
        io.emit('new player', player);
    });
    // When a player disconnects, remove them from the game and emit to other players
    socket.on('disconnect', function(){
        game.removePlayer(socket.id);
        io.emit('remove player', socket.id);
    });
});