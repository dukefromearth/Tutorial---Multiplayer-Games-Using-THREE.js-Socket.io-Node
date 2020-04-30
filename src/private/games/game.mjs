import Player from "./player.mjs";

export default class Game {
    #players;
    #type;
    constructor(gameType){
        this.#players = {};
        this.#type = gameType;
    }
    addPlayer(id, userName, position){
        this.#players[id] = new Player(id, userName, position);
    }
    removePlayer(id){
        delete this.#players[id];
    }
    getPlayer(id){
        return this.#players[id].serialize();
    }
    getType(){
        return this.#type;
    }
    getAllPlayers(){
        let allPlayers = [];
        this.#players.forEach(function(player){
            allPlayers.push(player.serialize());
        });
    }
}