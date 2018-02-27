pragma solidity ^0.4.15;

contract Flag {
    mapping (address => bool) public captured;

    event LogSneakedUpOn(address indexed who, uint howMuch);
    event LogCaptured(address indexed who, bytes32 braggingRights);

    function Flag() public {
    }

    function sneakUpOn() public payable {
        LogSneakedUpOn(msg.sender, msg.value);
        msg.sender.transfer(msg.value);
    }

    function capture(bytes32 braggingRights) public {
        require(this.balance > 0);
        captured[msg.sender] = true;
        LogCaptured(msg.sender, braggingRights);
        msg.sender.transfer(this.balance);
    }
}
