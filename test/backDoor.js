const BackDoor = artifacts.require("./BackDoor.sol");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");

const { toBN } = web3.utils;

contract('BackDoor', function(accounts) {
    
    it("should destroy on deploy", async function() {
        let txHash;
        await BackDoor.new(accounts[1], { from: accounts[0], value: 30, gas: 3000000})
            // Bypassing bug https://github.com/trufflesuite/truffle/issues/2398
            .on("transactionHash", hash => txHash = hash)
            .catch(e => {});
        const receipt = await web3.eth.getTransactionReceiptMined(txHash);
        const code = await web3.eth.getCodePromise(receipt.contractAddress);
        assert.strictEqual(parseInt(code + "0"), 0);
    });

    it("should send balance on deploy", async function() {
        const balanceBefore = await web3.eth.getBalancePromise(accounts[1]);
        let txHash;
        await BackDoor.new(accounts[1], { from: accounts[0], value: 30, gas: 3000000})
            // Bypassing bug https://github.com/trufflesuite/truffle/issues/2398
            .on("transactionHash", hash => txHash = hash)
            .catch(e => {});
        await web3.eth.getTransactionReceiptMined(txHash);
        const balance = await web3.eth.getBalancePromise(accounts[1]);
        assert.strictEqual(balance, toBN(balanceBefore).add(toBN(30)).toString(10));
    });

});
