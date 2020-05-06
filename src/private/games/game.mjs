import Player from "./player.mjs";

/**
 *
 *
 * @export
 * @class Game
 */
export default class Game {
    constructor(gameType){
        this.players = {};
        this.type = gameType;
    }
    addPlayer(id, userName, character, position){
        this.players[id] = new Player(id, userName, character, position);
        return this.players[id];
    }
    removePlayer(id){
        delete this.players[id];
    }
    getPlayer(id){
        console.log(id);
        return this.players[id].serialize();
    }
    getType(){
        return this.type;
    }
    getAllPlayers(){
        let allPlayers = [];
        for(let i in this.players){
            let p = this.players[i];
            allPlayers.push(p.serialize());
        }
        return allPlayers;
    }
}