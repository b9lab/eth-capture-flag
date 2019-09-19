pragma solidity 0.5.8;

import "./Flag.sol";

contract Thief {
    constructor() public {
    }

    function steal(Flag flag, bytes32 braggingRights) public {
        flag.capture(braggingRights);
        assert(flag.captured(address(this)));
        msg.sender.transfer(address(this).balance);
    }

    function() external payable {}
}
