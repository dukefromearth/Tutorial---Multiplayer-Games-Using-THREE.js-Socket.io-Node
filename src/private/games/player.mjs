/**
 *
 *
 * @export
 * @class Player
 */
export default class Player {
    constructor(id, userName, character, position){
        this.id = id;
        this.userName = userName;
        this.character = character;
        this.position = position; 
        this.ready = false;
    }
    // Return only the information from the player we need
    serialize() {
        return {
            id: this.id,
            userName: this.userName,
            character: this.character,
            position: this.position,
            ready: this.ready,
        }
    }
}