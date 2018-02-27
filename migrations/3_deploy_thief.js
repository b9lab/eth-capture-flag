const Thief = artifacts.require("./Thief.sol");

module.exports = function(deployer) {
  deployer.deploy(Thief);
};
