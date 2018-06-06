pragma solidity 0.4.21;

contract BackDoor {
    function BackDoor(address target) public payable {
        selfdestruct(target);
    }
}
