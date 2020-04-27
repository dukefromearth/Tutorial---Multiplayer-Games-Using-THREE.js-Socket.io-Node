import Player from "./player.mjs";

export default class Game {
    #players;
    constructor(){
        this.#players = {};
    }
    addPlayer(id, userName){
        this.#players[id] = new Player(userName);
    }
    removePlayer(id){
        delete this.#players[id];
    }
    getPlayer(id){
        return this.#players[id].serialize();
    }
    getAllPlayers(){
        let allPlayers = [];
        this.#players.forEach(function(player){
            allPlayers.push(player.serialize());
        })
    }
}