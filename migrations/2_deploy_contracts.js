const PlayerProgress = artifacts.require("PlayerProgress");

module.exports = function(deployer) {
    deployer.deploy(PlayerProgress);
};
