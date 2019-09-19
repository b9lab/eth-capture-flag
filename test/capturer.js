const Capturer = artifacts.require("./Capturer.sol");
const Flag = artifacts.require("./Flag.sol");

const { fromUtf8, sha3, toBN, toUtf8 } = web3.utils;

contract('Capturer', function(accounts) {
    
    let flag, capturer;

    beforeEach("should deploy a new flag and capturer", async function() {
        flag = await Flag.new({ from: accounts[0] });
        capturer = await Capturer.new({ from: accounts[0] });
    });

    it("should have 0 balance after capture", async function() {
        await capturer.capture(flag.address, fromUtf8("mwahaha"), { from: accounts[0], value: 30 });
        const balance = await web3.eth.getBalance(capturer.address);
        assert.strictEqual(balance, "0");
    });

    it("should have captured", async function() {
        assert.isFalse(await flag.captured(capturer.address));
        await capturer.capture(flag.address, fromUtf8("mwahaha"), { from: accounts[0], value: 30 });
        assert.isTrue(await flag.captured(capturer.address));
    });

    it("should have bragging rights", async function() {
        const txObj = await capturer.capture(flag.address, fromUtf8("mwahaha"), { from: accounts[0], value: 30 });
        assert.strictEqual(txObj.logs.length, 0);
        assert.strictEqual(txObj.receipt.rawLogs.length, 1);
        const brag = txObj.receipt.rawLogs[0];
        assert.strictEqual(brag.topics[0], sha3("LogCaptured(address,bytes32)"));
        flag.contract.events.LogCaptured().options.subscription.outputFormatter(brag);
        assert.strictEqual(brag.event, "LogCaptured");
        assert.strictEqual(brag.returnValues.who, capturer.address);
        assert.strictEqual(toUtf8(brag.returnValues.braggingRights), "mwahaha");
    });

    it("should have returned all Ether to sender", async function() {
        const balanceBefore = toBN(await web3.eth.getBalance(accounts[0]));
        const gasPrice = toBN(await web3.eth.getGasPrice());
        const txObj = await capturer.capture(flag.address, fromUtf8("mwahaha"), { from: accounts[0], value: 30, gasPrice: gasPrice });
        const txFee = gasPrice.mul(toBN(txObj.receipt.gasUsed));
        const balance = await web3.eth.getBalance(accounts[0]);
        assert.strictEqual(balance.toString(10), balanceBefore.sub(txFee).toString());
    });

});
