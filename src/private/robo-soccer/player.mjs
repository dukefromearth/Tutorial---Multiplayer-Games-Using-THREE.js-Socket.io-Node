export default class Player {
    #userName;
    constructor(userName){
        this.#userName = userName;
    }
    // Return only the information from the player we need
    serialize() {
        return {
            userName: this.#userName
        }
    }
}