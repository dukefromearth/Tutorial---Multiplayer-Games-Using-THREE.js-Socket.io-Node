export default class Player {
    #id;
    #userName;
    #position;
    constructor(id, userName, position){
        this.#userName = userName;
        this.#position = position;
        this.#id = id;
    }
    // Return only the information from the player we need
    serialize() {
        return {
            id: this.#id,
            userName: this.#userName,
            position: this.#position
        }
    }
}