// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PlayerProgress {
    struct Player {
        string name;
        uint health;
        uint x;
        uint y;
        string[] completedQuests;
        bool[] enemiesDefeated;
    }

    mapping(address => Player) private players;

    function saveProgress(string memory playerName, uint health, uint x, uint y, string[] memory completedQuests, bool[] memory enemiesDefeated) public {
        players[msg.sender] = Player(playerName, health, x, y, completedQuests, enemiesDefeated);
    }

    function getPlayerProgress(address playerAddress) public view returns (string memory, uint, uint, uint, string[] memory, bool[] memory) {
        Player memory player = players[playerAddress];
        return (player.name, player.health, player.x, player.y, player.completedQuests, player.enemiesDefeated);
    }
}
