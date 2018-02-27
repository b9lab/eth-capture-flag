const Promise = require("bluebird");
const Thief = artifacts.require("./Thief.sol");
const Flag = artifacts.require("./Flag.sol");
const BackDoor = artifacts.require("./BackDoor.sol");
const expectedExceptionPromise = require("../utils/expectedExceptionPromise.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");

Promise.promisifyAll(web3.eth, { suffix: "Promise" });

contract('Thief', function(accounts) {
    
    let flag, thief;

    beforeEach("should deploy a new flag and thief", function() {
        return Flag.new({ from: accounts[0] })
            .then(created => flag = created)
            .then(() => Thief.new({ from: accounts[0] }))
            .then(created => thief = created);
    });

    beforeEach("should prime the flag", function() {
        const backDoorDeployData = BackDoor.binary + flag.address.replace("0x", "000000000000000000000000");
        return web3.eth.sendTransactionPromise({ from: accounts[0], data: backDoorDeployData, value: 30, gas: 3000000 })
            .then(txHash => web3.eth.getTransactionReceiptMined(txHash));
    });

    it("should have 0 balance after capture", function() {
        return thief.steal(flag.address, "mwahaha", { from: accounts[0] })
            .then(txObj => web3.eth.getBalancePromise(thief.address))
            .then(balance => assert.strictEqual(balance.toNumber(), 0));
    });

    it("should have captured", function() {
        return flag.captured(thief.address)
            .then(captured => assert.isFalse(captured))
            .then(() => thief.steal(flag.address, "mwahaha", { from: accounts[0] }))
            .then(txObj => flag.captured(thief.address))
            .then(captured => assert.isTrue(captured));
    });


    it("should have bragging rights", function() {
        return thief.steal(flag.address, "mwahaha", { from: accounts[0] })
            .then(txObj => {
                assert.strictEqual(txObj.logs.length, 0);
                assert.strictEqual(txObj.receipt.logs.length, 1);
                const brag = txObj.receipt.logs[0];
                assert.strictEqual(brag.topics[0], web3.sha3("LogCaptured(address,bytes32)"));
                flag.LogCaptured().formatter(brag);
                assert.strictEqual(brag.event, "LogCaptured");
                assert.strictEqual(brag.args.who, thief.address);
                assert.strictEqual(web3.toUtf8(brag.args.braggingRights), "mwahaha");
            });
    });

    it("should have returned primed Ether to sender", function() {
        let balanceBefore, gasPrice, txFee;
        return web3.eth.getBalancePromise(accounts[0])
            .then(balance => balanceBefore = balance)
            .then(() => web3.eth.getGasPricePromise())
            .then(_gasPrice => gasPrice = web3.toBigNumber(_gasPrice))
            .then(() => thief.steal(flag.address, "mwahaha", { from: accounts[0], gasPrice: gasPrice }))
            .then(txObj => txFee = gasPrice.times(txObj.receipt.gasUsed))
            .then(() => web3.eth.getBalancePromise(accounts[0]))
            .then(balance => assert.strictEqual(balance.toString(10), balanceBefore.minus(txFee).plus(30).toString(10)));
    });

});
