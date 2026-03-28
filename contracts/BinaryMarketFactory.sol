// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BinaryMarket.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BinaryMarketFactory
 * @dev Factory contract to deploy and track BinaryMarket instances.
 */
contract BinaryMarketFactory is Ownable {
    address[] public allMarkets;
    mapping(uint256 => address) public getMarketById;

    event MarketCreated(
        uint256 indexed marketId,
        address marketAddress,
        string title,
        uint256 endTime,
        address creator
    );

    address public usdc;
    address public treasury;

    constructor(address _usdc, address _treasury) Ownable(msg.sender) {
        usdc = _usdc;
        treasury = _treasury;
    }

    function createMarket(
        uint256 _marketId,
        string memory _title,
        uint256 _endTime,
        uint256 _feeBps
    ) external onlyOwner returns (address) {
        require(getMarketById[_marketId] == address(0), "Market ID already exists");

        BinaryMarket newMarket = new BinaryMarket(
            usdc,
            treasury,
            _marketId,
            _title,
            _endTime,
            _feeBps
        );

        // Transfer ownership of the new market to the factory owner (or a specified admin)
        newMarket.transferOwnership(msg.sender);

        address marketAddr = address(newMarket);
        allMarkets.push(marketAddr);
        getMarketById[_marketId] = marketAddr;

        emit MarketCreated(_marketId, marketAddr, _title, _endTime, msg.sender);
        return marketAddr;
    }

    function getMarketsCount() external view returns (uint256) {
        return allMarkets.length;
    }
}
