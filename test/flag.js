const Flag = artifacts.require("./Flag.sol");
const expectedExceptionPromise = require("../utils/expectedExceptionPromise.js");

const { fromUtf8, toBN } = web3.utils;

contract('Flag', function(accounts) {
    
    let flag;

    beforeEach("should deploy a new instance", async function() {
        flag = await Flag.new({ from: accounts[0] });
    });

    it("should start empty", async function() {
        const balance = await web3.eth.getBalancePromise(flag.address);
        assert.strictEqual(balance, "0");
    });

    it("should emit event when receive Ether", async function() {
        const txObj = await flag.sneakUpOn({ from: accounts[0], value: 10 });
        assert.strictEqual(txObj.logs.length, 1);
        const theEvent = txObj.logs[0];
        assert.strictEqual(theEvent.event, "LogSneakedUpOn");
        assert.strictEqual(theEvent.args.who, accounts[0]);
        assert.strictEqual(theEvent.args.howMuch.toString(10), "10");
    });

    it("should remain at balance 0 when receive Ether", async function() {
        await flag.sneakUpOn({ from: accounts[0], value: 10 });
        const balance = await web3.eth.getBalancePromise(flag.address);
        assert.strictEqual(balance, "0");
    });

    it("should have returned all to sender when receive Ether", async function() {
        const balanceBefore = await web3.eth.getBalancePromise(accounts[0]);
        const gasPrice = await web3.eth.getGasPricePromise();
        const txObj = await flag.sneakUpOn({ from: accounts[0], value: 10, gasPrice: gasPrice });
        const txFee = toBN(gasPrice).mul(toBN(txObj.receipt.gasUsed));
        const balance = await web3.eth.getBalancePromise(accounts[0]);
        assert.strictEqual(balance, toBN(balanceBefore).sub(txFee).toString(10));
    });

    it("should reject capture", async function() {
        await expectedExceptionPromise(
            () => flag.capture(fromUtf8("mwahaha"), { from: accounts[0], gas: 3000000 }),
            3000000);
    });

});
