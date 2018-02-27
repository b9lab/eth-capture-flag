const Promise = require("bluebird");
const Capturer = artifacts.require("./Capturer.sol");
const Flag = artifacts.require("./Flag.sol");
const expectedExceptionPromise = require("../utils/expectedExceptionPromise.js");

Promise.promisifyAll(web3.eth, { suffix: "Promise" });

contract('Capturer', function(accounts) {
    
    let flag, capturer;

    beforeEach("should deploy a new flag and capturer", function() {
        return Flag.new({ from: accounts[0] })
            .then(created => flag = created)
            .then(() => Capturer.new({ from: accounts[0] }))
            .then(created => capturer = created);
    });

    it("should have 0 balance after capture", function() {
        return capturer.capture(flag.address, "mwahaha", { from: accounts[0], value: 30 })
            .then(txObj => web3.eth.getBalancePromise(capturer.address))
            .then(balance => assert.strictEqual(balance.toNumber(), 0));
    });

    it("should have captured", function() {
        return flag.captured(capturer.address)
            .then(captured => assert.isFalse(captured))
            .then(() => capturer.capture(flag.address, "mwahaha", { from: accounts[0], value: 30 }))
            .then(txObj => flag.captured(capturer.address))
            .then(captured => assert.isTrue(captured));
    });


    it("should have bragging rights", function() {
        return capturer.capture(flag.address, "mwahaha", { from: accounts[0], value: 30 })
            .then(txObj => {
                assert.strictEqual(txObj.logs.length, 0);
                assert.strictEqual(txObj.receipt.logs.length, 1);
                const brag = txObj.receipt.logs[0];
                assert.strictEqual(brag.topics[0], web3.sha3("LogCaptured(address,bytes32)"));
                flag.LogCaptured().formatter(brag);
                assert.strictEqual(brag.event, "LogCaptured");
                assert.strictEqual(brag.args.who, capturer.address);
                assert.strictEqual(web3.toUtf8(brag.args.braggingRights), "mwahaha");
            });
    });

    it("should have returned all Ether to sender", function() {
        let balanceBefore, gasPrice, txFee;
        return web3.eth.getBalancePromise(accounts[0])
            .then(balance => balanceBefore = balance)
            .then(() => web3.eth.getGasPricePromise())
            .then(_gasPrice => gasPrice = web3.toBigNumber(_gasPrice))
            .then(() => capturer.capture(flag.address, "mwahaha", { from: accounts[0], value: 30, gasPrice: gasPrice }))
            .then(txObj => txFee = gasPrice.times(txObj.receipt.gasUsed))
            .then(() => web3.eth.getBalancePromise(accounts[0]))
            .then(balance => assert.strictEqual(balance.toString(10), balanceBefore.minus(txFee).toString(10)));
    });

});
