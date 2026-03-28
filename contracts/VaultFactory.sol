// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CopyTradingVault.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VaultFactory
 * @dev Factory contract to deploy and track CopyTradingVault instances.
 */
contract VaultFactory is Ownable {
    address[] public allVaults;
    mapping(uint256 => address) public getVaultById;
    mapping(address => address[]) public leaderToVaults;

    event VaultCreated(
        uint256 indexed vaultId,
        address vaultAddress,
        string leaderName,
        address leader
    );

    address public usdc;

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = _usdc;
    }

    function createVault(
        uint256 _vaultId,
        string memory _leaderName
    ) external returns (address) {
        require(getVaultById[_vaultId] == address(0), "Vault ID already exists");

        CopyTradingVault newVault = new CopyTradingVault(
            usdc,
            _vaultId,
            _leaderName
        );

        // Transfer ownership of the new vault to the caller (the leader)
        newVault.transferOwnership(msg.sender);

        address vaultAddr = address(newVault);
        
        allVaults.push(vaultAddr);
        getVaultById[_vaultId] = vaultAddr;
        leaderToVaults[msg.sender].push(vaultAddr);

        emit VaultCreated(_vaultId, vaultAddr, _leaderName, msg.sender);
        return vaultAddr;
    }

    function getVaultsCount() external view returns (uint256) {
        return allVaults.length;
    }

    function getLeaderVaults(address _leader) external view returns (address[] memory) {
        return leaderToVaults[_leader];
    }
}
