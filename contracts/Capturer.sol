pragma solidity 0.5.8;

import "./Flag.sol";
import "./BackDoor.sol";

contract Capturer {
    constructor() public {
    }

    function capture(Flag flag, bytes32 braggingRights) public payable {
        uint beforeBalance = address(this).balance;
        (new BackDoor).value(msg.value)(address(uint160(address(flag))));
        flag.capture(braggingRights);
        assert(flag.captured(address(this)));
        assert(beforeBalance == address(this).balance);
        msg.sender.transfer(msg.value);
    }

    function() external payable {}
}
