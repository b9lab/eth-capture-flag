pragma solidity ^0.4.15;

import "./Flag.sol";

contract Thief {
    function Thief() public {
    }

    function steal(Flag flag, bytes32 braggingRights) public {
    	flag.capture(braggingRights);
        assert(flag.captured(this));
        msg.sender.transfer(this.balance);
    }

    function() public payable {}
}
