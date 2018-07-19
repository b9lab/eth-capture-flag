pragma solidity 0.4.24;

contract BackDoor {
    constructor(address target) public payable {
        selfdestruct(target);
    }
}
