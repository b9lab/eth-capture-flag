pragma solidity 0.5.8;

contract BackDoor {
    constructor(address payable target) public payable {
        selfdestruct(target);
    }
}
