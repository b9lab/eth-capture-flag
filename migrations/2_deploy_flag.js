const Flag = artifacts.require("./Flag.sol");

module.exports = function(deployer) {
  deployer.deploy(Flag);
};
