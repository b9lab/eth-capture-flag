const Promise = require("bluebird");
const BackDoor = artifacts.require("./BackDoor.sol");
const Flag = artifacts.require("./Flag.sol");
const expectedExceptionPromise = require("../utils/expectedExceptionPromise.js");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");

Promise.promisifyAll(web3.eth, { suffix: "Promise" });

contract('BackDoor', function(accounts) {
    
    const deployData = BackDoor.binary + accounts[1].replace("0x", "000000000000000000000000");
    let backDoor, flag;

    it("should destroy on deploy", function() {
        return web3.eth.sendTransactionPromise({ from: accounts[0], data: deployData, value: 30, gas: 3000000 })
            .then(txHash => web3.eth.getTransactionReceiptMined(txHash))
            .then(receipt => web3.eth.getCodePromise(receipt.contractAddress))
            .then(code => assert.strictEqual(parseInt(code + "0"), 0));
    });

    it("should send balance on deploy", function() {
        let balanceBefore;
        return web3.eth.getBalancePromise(accounts[1])
            .then(balance => balanceBefore = balance)
            .then(() => web3.eth.sendTransactionPromise({ from: accounts[0], data: deployData, value: 30, gas: 3000000 }))
            .then(txObj => web3.eth.getBalancePromise(accounts[1]))
            .then(balance => assert.strictEqual(balance.toString(10), balanceBefore.plus(30).toString(10)));
    });

});
