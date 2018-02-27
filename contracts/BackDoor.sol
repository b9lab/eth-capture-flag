pragma solidity ^0.4.15;

contract BackDoor {
    function BackDoor(address target) public payable {
        selfdestruct(target);
    }
}
