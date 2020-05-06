import fs from 'fs';
import DecisionData from './decision-data.mjs';

/**
 *
 *
 * @export
 * @class DecisionMaker
 */
export default class DecisionMaker {
    constructor() {
        this.decisions = {};
    }
    addDecision(_id, _data) {
        this.decisions[_id] = _data;
    }
    loadFromFile(fileName) {
        let self = this;
        fs.readFile(fileName, function (err, jsonData) {
            if (err) throw err;
            let data = JSON.parse(jsonData);
            let id = Object.getOwnPropertyNames(data);
            self.addDecision(id, data);
        });
    }
    getProbs(decisionID) {
        let total = 0;
        let probabilites = [];
        let data = this.decisions[decisionID].decision.data;
        let isTimeBased = data.isTimeBased;
        if (!this.decisions[decisionID]) {
            console.log(decisionID, " decision does not exist");
            return;
        }
        for (let i in data.decisions) {
            let d = data.decisions[i];
            let timeBasedWeight = d.weight * (1 + Math.round((Date.now() - d.epoch) / 86400000));
            let weight = isTimeBased ? d.weight : timeBasedWeight;
            total += d.value / weight;
        }
        for (let i in data.decisions) {
            let d = data.decisions[i];
            let timeBasedWeight = d.weight * (1 + Math.round((Date.now() - d.epoch) / 86400000));
            let prob = isTimeBased ? d.value / d.weight / total : d.value / timeBasedWeight / total;
            probabilites.push({ type: d.type, prob: prob });
        }
        return (probabilites);
    }
    writeToFile(fileName) {
        let dataJSON = JSON.stringify(this.decisions, null, "\t");
        fileName = fileName;
        fs.writeFile(fileName, dataJSON, function (err) {
            if (err) throw err;
        });
    }
    runTest() {
        let decisions = new DecisionData("test", false);
        decisions.loadTest();
        this.decisions["test"] = { decision: decisions };
        this.decisions["test2"] = { decision: decisions };
        this.writeToFile("./data/test.json");
        this.loadFromFile("./data/test.json");
    }
}