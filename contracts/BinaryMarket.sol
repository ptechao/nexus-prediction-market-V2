// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BinaryMarket
 * @dev A binary (Yes/No) prediction market contract with fee mechanism and emergency cancel
 * 
 * Features:
 * - Users can bet on Yes or No outcomes
 * - Market owner can resolve the outcome (simple oracle for MVP)
 * - Emergency cancel functionality with refund mechanism
 * - Protocol fee deducted from winnings (configurable basis points)
 * - Correct payout calculation: payout = (userBet * totalPool) / winningPool
 * - Edge case handling: if winning pool is 0, all losers get refunded
 */
contract BinaryMarket is Ownable, ReentrancyGuard {
    // ============ State Variables ============
    
    IERC20 public usdc;
    address public treasury;
    
    uint256 public marketId;
    string public eventTitle;
    uint256 public endTime;
    
    // Fee mechanism: basis points (e.g., 200 = 2%)
    uint256 public feeBps;
    
    enum MarketStatus { OPEN, RESOLVED, CANCELLED }
    MarketStatus public status;
    
    enum Outcome { UNRESOLVED, YES, NO }
    Outcome public resolvedOutcome;
    
    // Total amount bet on each outcome
    uint256 public yesPoolAmount;
    uint256 public noPoolAmount;
    
    // Mapping of user address to their bets
    mapping(address => uint256) public yesBets;
    mapping(address => uint256) public noBets;
    mapping(address => bool) public hasClaimed;
    mapping(address => bool) public hasClaimedRefund;
    
    // ============ Events ============
    
    event BetPlaced(
        address indexed bettor,
        bool isYes,
        uint256 amount,
        uint256 timestamp
    );
    
    event MarketResolved(
        Outcome outcome,
        uint256 timestamp
    );
    
    event WinningsClaimed(
        address indexed winner,
        uint256 winnings,
        uint256 feeAmount,
        uint256 netPayout,
        uint256 timestamp
    );
    
    event MarketCancelled(uint256 timestamp);
    
    event RefundClaimed(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event TreasuryFeesCollected(
        uint256 totalFees,
        uint256 timestamp
    );
    
    event FeeUpdated(uint256 newFeeBps, uint256 timestamp);
    
    event TreasuryUpdated(address newTreasury, uint256 timestamp);
    
    // ============ Constructor ============
    
    constructor(
        address _usdc,
        address _treasury,
        uint256 _marketId,
        string memory _eventTitle,
        uint256 _endTime,
        uint256 _feeBps
    ) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_treasury != address(0), "Invalid treasury address");
        require(_endTime > block.timestamp, "End time must be in the future");
        require(_feeBps <= 10000, "Fee cannot exceed 100%");
        
        usdc = IERC20(_usdc);
        treasury = _treasury;
        marketId = _marketId;
        eventTitle = _eventTitle;
        endTime = _endTime;
        feeBps = _feeBps;
        status = MarketStatus.OPEN;
        resolvedOutcome = Outcome.UNRESOLVED;
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev Place a bet on YES outcome
     * @param amount Amount of USDC to bet
     */
    function buyYes(uint256 amount) external nonReentrant {
        require(status == MarketStatus.OPEN, "Market is not open");
        require(block.timestamp < endTime, "Market has ended");
        require(amount > 0, "Bet amount must be greater than 0");
        
        // Transfer USDC from user to contract
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        yesBets[msg.sender] += amount;
        yesPoolAmount += amount;
        
        emit BetPlaced(msg.sender, true, amount, block.timestamp);
    }
    
    /**
     * @dev Place a bet on NO outcome
     * @param amount Amount of USDC to bet
     */
    function buyNo(uint256 amount) external nonReentrant {
        require(status == MarketStatus.OPEN, "Market is not open");
        require(block.timestamp < endTime, "Market has ended");
        require(amount > 0, "Bet amount must be greater than 0");
        
        // Transfer USDC from user to contract
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        noBets[msg.sender] += amount;
        noPoolAmount += amount;
        
        emit BetPlaced(msg.sender, false, amount, block.timestamp);
    }
    
    /**
     * @dev Claim winnings after market is resolved
     * 
     * Payout formula: payout = (userBet * totalPool) / winningPool
     * Fee is deducted from winnings and sent to treasury
     * 
     * Edge case: If winning pool is 0 (no one bet on winning outcome),
     * all losers get refunded their principal bet amount
     */
    function claimWinnings() external nonReentrant {
        require(status == MarketStatus.RESOLVED, "Market is not resolved");
        require(!hasClaimed[msg.sender], "Already claimed winnings");
        
        uint256 userBet = 0;
        uint256 winningPool = 0;
        uint256 totalPool = yesPoolAmount + noPoolAmount;
        
        // Determine user's bet and winning pool based on resolved outcome
        if (resolvedOutcome == Outcome.YES) {
            userBet = yesBets[msg.sender];
            winningPool = yesPoolAmount;
            require(userBet > 0, "No YES bets to claim");
        } else if (resolvedOutcome == Outcome.NO) {
            userBet = noBets[msg.sender];
            winningPool = noPoolAmount;
            require(userBet > 0, "No NO bets to claim");
        } else {
            revert("Market outcome is unresolved");
        }
        
        hasClaimed[msg.sender] = true;
        
        uint256 winnings = 0;
        
        // Edge case: if winning pool is 0, refund the user's principal
        if (winningPool == 0) {
            winnings = userBet;
        } else {
            // Standard payout: (userBet * totalPool) / winningPool
            winnings = (userBet * totalPool) / winningPool;
        }
        
        // Calculate and deduct protocol fee
        uint256 feeAmount = (winnings * feeBps) / 10000;
        uint256 netPayout = winnings - feeAmount;
        
        // Transfer net payout to user
        require(usdc.transfer(msg.sender, netPayout), "USDC transfer to user failed");
        
        // Transfer fee to treasury
        if (feeAmount > 0) {
            require(usdc.transfer(treasury, feeAmount), "USDC transfer to treasury failed");
        }
        
        emit WinningsClaimed(msg.sender, winnings, feeAmount, netPayout, block.timestamp);
    }
    
    /**
     * @dev Claim refund if market is cancelled
     * Users get back their principal bet amount
     */
    function claimRefund() external nonReentrant {
        require(status == MarketStatus.CANCELLED, "Market is not cancelled");
        require(!hasClaimedRefund[msg.sender], "Already claimed refund");
        
        uint256 refundAmount = yesBets[msg.sender] + noBets[msg.sender];
        require(refundAmount > 0, "No bets to refund");
        
        hasClaimedRefund[msg.sender] = true;
        
        require(usdc.transfer(msg.sender, refundAmount), "USDC refund transfer failed");
        
        emit RefundClaimed(msg.sender, refundAmount, block.timestamp);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Simple oracle resolution function (admin-controlled for MVP)
     * In production, this would be replaced with UMA or Chainlink oracle
     * @param outcome The resolved outcome (1 for YES, 2 for NO)
     */
    function adminResolve(uint256 outcome) external onlyOwner nonReentrant {
        require(status == MarketStatus.OPEN, "Market already resolved");
        require(outcome == 1 || outcome == 2, "Invalid outcome");
        require(block.timestamp >= endTime, "Market has not ended");
        
        status = MarketStatus.RESOLVED;
        resolvedOutcome = outcome == 1 ? Outcome.YES : Outcome.NO;
        
        emit MarketResolved(resolvedOutcome, block.timestamp);
    }
    
    /**
     * @dev Emergency cancel the market
     * Users can call claimRefund() to get their principal back
     */
    function cancelMarket() external onlyOwner {
        require(status == MarketStatus.OPEN, "Market already resolved or cancelled");
        
        status = MarketStatus.CANCELLED;
        
        emit MarketCancelled(block.timestamp);
    }
    
    /**
     * @dev Update the protocol fee (basis points)
     * @param newFeeBps New fee in basis points (e.g., 200 = 2%)
     */
    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 10000, "Fee cannot exceed 100%");
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps, block.timestamp);
    }
    
    /**
     * @dev Update the treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury, block.timestamp);
    }
    
    /**
     * @dev Collect accumulated fees from the contract
     * This is a view of what fees have been collected (for accounting)
     * Fees are automatically sent to treasury during claimWinnings()
     */
    function getCollectedFees() external view returns (uint256) {
        // Total pool minus what's been claimed
        uint256 totalPool = yesPoolAmount + noPoolAmount;
        uint256 contractBalance = usdc.balanceOf(address(this));
        return totalPool - contractBalance;
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get current odds for YES outcome (as percentage 0-100)
     */
    function getYesOdds() external view returns (uint256) {
        uint256 totalPool = yesPoolAmount + noPoolAmount;
        if (totalPool == 0) return 50; // Default 50/50 if no bets
        return (yesPoolAmount * 100) / totalPool;
    }
    
    /**
     * @dev Get current odds for NO outcome (as percentage 0-100)
     */
    function getNoOdds() external view returns (uint256) {
        uint256 totalPool = yesPoolAmount + noPoolAmount;
        if (totalPool == 0) return 50; // Default 50/50 if no bets
        return (noPoolAmount * 100) / totalPool;
    }
    
    /**
     * @dev Get total pool size
     */
    function getTotalPool() external view returns (uint256) {
        return yesPoolAmount + noPoolAmount;
    }
    
    /**
     * @dev Get user's bet amounts
     */
    function getUserBets(address user) external view returns (uint256 yesBet, uint256 noBet) {
        return (yesBets[user], noBets[user]);
    }
    
    /**
     * @dev Get market status
     */
    function getMarketStatus() external view returns (string memory) {
        if (status == MarketStatus.OPEN) return "OPEN";
        if (status == MarketStatus.RESOLVED) return "RESOLVED";
        return "CANCELLED";
    }
    
    /**
     * @dev Calculate expected payout for a hypothetical bet
     * @param betAmount The amount to bet
     * @param isYes Whether betting on YES
     * @return expectedPayout The expected payout if this outcome wins
     * @return expectedFee The expected fee deducted
     */
    function calculateExpectedPayout(uint256 betAmount, bool isYes) external view returns (uint256 expectedPayout, uint256 expectedFee) {
        require(status == MarketStatus.OPEN, "Market is not open");
        
        uint256 totalPool = yesPoolAmount + noPoolAmount;
        uint256 winningPool = isYes ? yesPoolAmount : noPoolAmount;
        
        // If winning pool is 0, user gets their principal back
        if (winningPool == 0) {
            expectedPayout = betAmount;
            expectedFee = 0;
        } else {
            uint256 grossPayout = ((betAmount + totalPool) * (betAmount + totalPool)) / (winningPool + betAmount);
            expectedFee = (grossPayout * feeBps) / 10000;
            expectedPayout = grossPayout - expectedFee;
        }
    }
    
    /**
     * @dev Get market details
     */
    function getMarketDetails() external view returns (
        uint256 id,
        string memory title,
        uint256 end,
        uint256 yesPool,
        uint256 noPool,
        string memory currentStatus,
        uint256 currentFeeBps
    ) {
        return (
            marketId,
            eventTitle,
            endTime,
            yesPoolAmount,
            noPoolAmount,
            getMarketStatus(),
            feeBps
        );
    }
}
