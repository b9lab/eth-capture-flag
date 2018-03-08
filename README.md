# Capture the flag

You need to capture the flag, or rather to put Ether in the `Flag` contract without a `Thief` taking it before you can claim the flag.

## Goals

* The exercise serves to show that not all Ether comes with a beautiful transaction.
* It also serves to show that if you forgot to make your operations atomic, someone may exploit it by sneaking in between your operations.
* Accessorily it shows the _power_ of gas price.

## Notes

* You need to run the `node/watchAndSteal.js` trap for the challenge to be fun.
* The `Thief` contract is not strictly needed, it is only here so that the `capture` call happens in an internal transaction, and as such is semi-invisible on Etherscan.
* The `sneakUpOn` function is totally useless and acts as a decoy. Do not remove it.

When deploying the IPFS page, you need to adjust, manually?, for `./static` and `../../fonts`.