pragma solidity 0.4.24;

import "./Flag.sol";

contract Thief {
    constructor() public {
    }

    function steal(Flag flag, bytes32 braggingRights) public {
        flag.capture(braggingRights);
        assert(flag.captured(this));
        msg.sender.transfer(address(this).balance);
    }

    function() public payable {}
}
