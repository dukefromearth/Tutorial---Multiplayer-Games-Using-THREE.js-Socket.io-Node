/**
 *
 *
 * @export
 * @class DecisionData
 */
export default class DecisionData {
    constructor(_id, _isTimeBased) {
        this.data = {
            id: _id,
            isTimeBased: _isTimeBased,
            decisions: {}
        }
    }
    addDecision(_type, _value, _weight, _time) {
        this.data.decisions[_type] = {
            type: _type,
            value: _value,
            weight: _weight,
            epoch: _time
        };
    }
    // Takes in JSON data with option to remove 
    loadDecisions(jsonData, doRemove) {
        let data = JSON.parse(jsonData);
        if (doRemove) this.data.decisions = {};
        for (let i in data) {
            let d = data[i];
            this.data.decisions[d.type] = d;
        }
    }
    removeDecision(_type) {
        delete this.data.decisions[_type];
    }
    loadTest() {
        this.addDecision("sweep", 1, 1, Date.now());
        this.addDecision("mop", 1, 2, Date.now());
        this.addDecision("dust", 1, 2, Date.now());
    }
}