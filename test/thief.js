const Thief = artifacts.require("./Thief.sol");
const Flag = artifacts.require("./Flag.sol");
const BackDoor = artifacts.require("./BackDoor.sol");
web3.eth.getTransactionReceiptMined = require("../utils/getTransactionReceiptMined.js");

const { fromUtf8, sha3, toBN, toUtf8 } = web3.utils;

contract.only('Thief', function(accounts) {
    
    let flag, thief;

    beforeEach("should deploy a new flag and thief", async function() {
        flag = await Flag.new({ from: accounts[0] });
        thief = await Thief.new({ from: accounts[0] });
    });

    beforeEach("should prime the flag", async function() {
        await BackDoor.new(flag.address, { from: accounts[0], value: 30, gas: 3000000})
            // Bypassing bug https://github.com/trufflesuite/truffle/issues/2398
            .catch(e => {});
    });

    it("should have 0 balance after capture", async function() {
        await thief.steal(flag.address, fromUtf8("mwahaha"), { from: accounts[0] });
        const balance = await web3.eth.getBalance(thief.address);
        assert.strictEqual(balance, "0");
    });

    it("should have captured", async function() {
        assert.isFalse(await flag.captured(thief.address));
        await thief.steal(flag.address, fromUtf8("mwahaha"), { from: accounts[0] });
        assert.isTrue(await flag.captured(thief.address));
    });


    it("should have bragging rights", async function() {
        const txObj = await thief.steal(flag.address, fromUtf8("mwahaha"), { from: accounts[0] });
        assert.strictEqual(txObj.logs.length, 0);
        assert.strictEqual(txObj.receipt.rawLogs.length, 1);
        const brag = txObj.receipt.rawLogs[0];
        assert.strictEqual(brag.topics[0], sha3("LogCaptured(address,bytes32)"));
        flag.contract.events.LogCaptured().options.subscription.outputFormatter(brag);
        assert.strictEqual(brag.event, "LogCaptured");
        assert.strictEqual(brag.returnValues.who, thief.address);
        assert.strictEqual(toUtf8(brag.returnValues.braggingRights), "mwahaha");
    });

    it("should have returned primed Ether to sender", async function() {
        const balanceBefore = await web3.eth.getBalance(accounts[0]);
        const gasPrice = await web3.eth.getGasPrice();
        const txObj = await thief.steal(flag.address, fromUtf8("mwahaha"), { from: accounts[0], gasPrice: gasPrice });
        const txFee = toBN(gasPrice).mul(toBN(txObj.receipt.gasUsed));
        const balance = await web3.eth.getBalance(accounts[0]);
        assert.strictEqual(balance, toBN(balanceBefore).sub(txFee).add(toBN(30)).toString(10));
    });

});
