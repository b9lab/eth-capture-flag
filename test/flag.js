const Promise = require("bluebird");
const Flag = artifacts.require("./Flag.sol");
const expectedExceptionPromise = require("../utils/expectedExceptionPromise.js");

Promise.promisifyAll(web3.eth, { suffix: "Promise" });

contract('Flag', function(accounts) {
    
    let flag;

    beforeEach("should deploy a new instance", function() {
        return Flag.new({ from: accounts[0] })
            .then(created => flag = created);
    });

    it("should start empty", function() {
        return web3.eth.getBalancePromise(flag.address)
            .then(balance => assert.strictEqual(balance.toNumber(), 0));
    });

    it("should emit event when receive Ether", function() {
        return flag.sneakUpOn({ from: accounts[0], value: 10 })
            .then(txObj => {
                assert.strictEqual(txObj.logs.length, 1);
                const theEvent = txObj.logs[0];
                assert.strictEqual(theEvent.event, "LogSneakedUpOn");
                assert.strictEqual(theEvent.args.who, accounts[0]);
                assert.strictEqual(theEvent.args.howMuch.toString(10), "10");
            });
    });

    it("should remain at balance 0 when receive Ether", function() {
        return flag.sneakUpOn({ from: accounts[0], value: 10 })
            .then(txObj => web3.eth.getBalancePromise(flag.address))
            .then(balance => assert.strictEqual(balance.toNumber(), 0));            
    });

    it("should have returned all to sender when receive Ether", function() {
        let balanceBefore, gasPrice, txFee;
        return web3.eth.getBalancePromise(accounts[0])
            .then(balance => balanceBefore = balance)
            .then(() => web3.eth.getGasPricePromise())
            .then(_gasPrice => gasPrice = web3.toBigNumber(_gasPrice))
            .then(() => flag.sneakUpOn({ from: accounts[0], value: 10, gasPrice: gasPrice }))
            .then(txObj => txFee = gasPrice.times(txObj.receipt.gasUsed))
            .then(() => web3.eth.getBalancePromise(accounts[0]))
            .then(balance => assert.strictEqual(balance.toString(10), balanceBefore.minus(txFee).toString(10)));
    });

    it("should reject capture", function() {
        return expectedExceptionPromise(
            () => flag.capture("mwahaha", { from: accounts[0], gas: 3000000 }),
            3000000);
    });

});
