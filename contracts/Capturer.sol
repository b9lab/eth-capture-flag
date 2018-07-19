pragma solidity 0.4.24;

import "./Flag.sol";
import "./BackDoor.sol";

contract Capturer {
    constructor() public {
    }

    function capture(Flag flag, bytes32 braggingRights) public payable {
        uint beforeBalance = address(this).balance;
        (new BackDoor).value(msg.value)(flag);
        flag.capture(braggingRights);
        assert(flag.captured(this));
        assert(beforeBalance == address(this).balance);
        msg.sender.transfer(msg.value);
    }

    function() public payable {}
}
