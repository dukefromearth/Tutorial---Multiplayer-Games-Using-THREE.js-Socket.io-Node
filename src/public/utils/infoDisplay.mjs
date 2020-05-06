export default class InfoDisplay {
    constructor() {
        this.random = Math.random().toString();
        this.div = null;
    }
    update(info) {
        console.log(info);
        this.div.innerHTML = ""; 
        for(let i in info){
            let infoObj = info[i];
            let ready = infoObj.ready ? " is ready :)" : " is not ready :(";
            let content = infoObj.userName + ready;
            let newContent = document.createTextNode(content);
            let lineBreak = document.createElement("br");
            this.div.appendChild(newContent);
            this.div.appendChild(lineBreak);
        }
    }
    setup() {
        var newDiv = document.createElement("div");
        newDiv.id = "infoDiv" + this.random;
        document.body.appendChild(newDiv);
        this.div = newDiv;
    }
}