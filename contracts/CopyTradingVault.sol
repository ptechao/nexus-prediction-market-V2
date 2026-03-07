// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./BinaryMarket.sol";

/**
 * @title CopyTradingVault
 * @dev A pooled fund vault for copy trading with no loops (gas efficient)
 * 
 * Architecture:
 * - Vault owns all positions (no individual follower tracking)
 * - Followers own Vault Shares (ERC-20 style)
 * - Leader earns 20% performance fee on profits
 * - High watermark tracking for fair fee calculation
 * 
 * Key Features:
 * 1. Pooled Betting: Leader calls leaderBuyYes/leaderBuyNo ONCE, vault places single bet
 * 2. Share System: Followers mint/burn shares based on deposit/withdrawal
 * 3. Asset Tracking: totalAssets() = USDC balance + estimated position value
 * 4. Performance Fee: 20% of profits minted to leader as new shares
 * 5. High Watermark: Tracks highest NAV to ensure fair fee calculation
 */
contract CopyTradingVault is ERC20, Ownable, ReentrancyGuard {
    // ============ State Variables ============
    
    IERC20 public usdc;
    
    uint256 public vaultId;
    string public leaderName;
    
    // Share system
    uint256 public totalShares; // Total vault shares outstanding
    
    // Asset tracking
    uint256 public highWaterMark; // Highest NAV per share (for performance fee calculation)
    
    // Performance fee tracking
    uint256 public constant PERFORMANCE_FEE_BPS = 2000; // 20% = 2000 basis points
    uint256 public accumulatedFees; // Accumulated performance fees (in USDC equivalent)
    
    // Position tracking
    struct Position {
        address market;
        bool isYes;
        uint256 amount;
        uint256 claimedWinnings;
        bool isClosed;
    }
    
    Position[] public positions;
    mapping(address => uint256) public activePositionCount; // Track active positions per market
    
    // Lock mechanism: prevent withdrawals while positions are active
    bool public isLocked;
    
    // ============ Events ============
    
    event DepositMade(
        address indexed depositor,
        uint256 usdcAmount,
        uint256 sharesIssued,
        uint256 timestamp
    );
    
    event WithdrawalMade(
        address indexed withdrawer,
        uint256 sharesBurned,
        uint256 usdcReceived,
        uint256 timestamp
    );
    
    event PositionOpened(
        uint256 indexed positionId,
        address indexed market,
        bool isYes,
        uint256 amount,
        uint256 timestamp
    );
    
    event PositionClosed(
        uint256 indexed positionId,
        uint256 winnings,
        uint256 performanceFee,
        uint256 timestamp
    );
    
    event PerformanceFeeEarned(
        address indexed leader,
        uint256 feeAmount,
        uint256 sharesIssued,
        uint256 timestamp
    );
    
    event HighWaterMarkUpdated(
        uint256 newHighWaterMark,
        uint256 timestamp
    );
    
    event VaultLocked(uint256 timestamp);
    event VaultUnlocked(uint256 timestamp);
    
    // ============ Constructor ============
    
    constructor(
        address _usdc,
        uint256 _vaultId,
        string memory _leaderName
    ) ERC20(
        string(abi.encodePacked("NEXUS-", _leaderName)),
        string(abi.encodePacked("NXS-", _leaderName))
    ) {
        require(_usdc != address(0), "Invalid USDC address");
        
        usdc = IERC20(_usdc);
        vaultId = _vaultId;
        leaderName = _leaderName;
        
        // Initialize high watermark at 1 USDC per share
        highWaterMark = 1e6; // 1 USDC (assuming 6 decimals)
        totalShares = 0;
        isLocked = false;
    }
    
    // ============ Deposit & Withdrawal (Share System) ============
    
    /**
     * @dev Deposit USDC and receive vault shares
     * @param amount Amount of USDC to deposit
     * @return sharesIssued Number of shares minted to depositor
     * 
     * Share calculation:
     * If vault is empty: shares = amount
     * If vault has assets: shares = (amount * totalShares) / totalAssets
     */
    function deposit(uint256 amount) external nonReentrant returns (uint256 sharesIssued) {
        require(amount > 0, "Deposit amount must be greater than 0");
        require(!isLocked, "Vault is locked during active positions");
        
        // Transfer USDC from depositor to vault
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        // Calculate shares to mint
        uint256 assets = totalAssets();
        
        if (totalShares == 0) {
            // First deposit: 1 share per 1 USDC
            sharesIssued = amount;
        } else {
            // Subsequent deposits: proportional to vault value
            sharesIssued = (amount * totalShares) / assets;
        }
        
        require(sharesIssued > 0, "Share amount too small");
        
        // Mint shares to depositor
        _mint(msg.sender, sharesIssued);
        totalShares += sharesIssued;
        
        emit DepositMade(msg.sender, amount, sharesIssued, block.timestamp);
        
        return sharesIssued;
    }
    
    /**
     * @dev Withdraw USDC by burning vault shares
     * @param shares Number of shares to burn
     * @return usdcReceived Amount of USDC returned to withdrawer
     * 
     * Withdrawal calculation:
     * usdcReceived = (shares * totalAssets) / totalShares
     */
    function withdraw(uint256 shares) external nonReentrant returns (uint256 usdcReceived) {
        require(shares > 0, "Withdrawal amount must be greater than 0");
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        require(!isLocked, "Vault is locked during active positions");
        
        uint256 assets = totalAssets();
        
        // Calculate USDC to return
        usdcReceived = (shares * assets) / totalShares;
        require(usdcReceived > 0, "Withdrawal amount too small");
        
        // Burn shares from withdrawer
        _burn(msg.sender, shares);
        totalShares -= shares;
        
        // Transfer USDC to withdrawer
        require(usdc.transfer(msg.sender, usdcReceived), "USDC transfer failed");
        
        emit WithdrawalMade(msg.sender, shares, usdcReceived, block.timestamp);
        
        return usdcReceived;
    }
    
    // ============ Asset Tracking ============
    
    /**
     * @dev Get total assets under management
     * 
     * Formula: totalAssets = USDC balance + estimated value of active positions
     * 
     * For MVP: We assume positions are either:
     * - Active (locked, can't withdraw)
     * - Closed (winnings received back to vault)
     * 
     * Estimated position value = original bet amount (conservative estimate)
     */
    function totalAssets() public view returns (uint256) {
        uint256 usdcBalance = usdc.balanceOf(address(this));
        
        // Add estimated value of active positions
        uint256 activePositionValue = 0;
        for (uint256 i = 0; i < positions.length; i++) {
            if (!positions[i].isClosed) {
                activePositionValue += positions[i].amount;
            }
        }
        
        return usdcBalance + activePositionValue;
    }
    
    /**
     * @dev Get Net Asset Value (NAV) per share
     * @return navPerShare NAV per share (in USDC, scaled by 1e6)
     */
    function getNavPerShare() public view returns (uint256) {
        if (totalShares == 0) return 1e6; // 1 USDC per share if no shares
        return (totalAssets() * 1e6) / totalShares;
    }
    
    /**
     * @dev Get vault statistics
     */
    function getVaultStats() external view returns (
        uint256 assets,
        uint256 shares,
        uint256 navPerShare,
        uint256 hwm,
        uint256 activePositions,
        bool locked
    ) {
        return (
            totalAssets(),
            totalShares,
            getNavPerShare(),
            highWaterMark,
            positions.length,
            isLocked
        );
    }
    
    // ============ Leader Functions (Pooled Betting) ============
    
    /**
     * @dev Leader places a YES bet using vault's pooled funds
     * 
     * Key: Vault places ONE bet with total amount, no loops through followers
     * 
     * @param market Address of the BinaryMarket contract
     * @param amount Amount to bet (from vault's USDC balance)
     */
    function leaderBuyYes(address market, uint256 amount) external onlyOwner nonReentrant {
        require(market != address(0), "Invalid market address");
        require(amount > 0, "Bet amount must be greater than 0");
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient USDC balance");
        
        // Lock vault during active position
        isLocked = true;
        emit VaultLocked(block.timestamp);
        
        // Approve and place bet
        require(usdc.approve(market, amount), "Approval failed");
        BinaryMarket(market).buyYes(amount);
        
        // Record position
        uint256 positionId = positions.length;
        positions.push(Position({
            market: market,
            isYes: true,
            amount: amount,
            claimedWinnings: 0,
            isClosed: false
        }));
        
        activePositionCount[market]++;
        
        emit PositionOpened(positionId, market, true, amount, block.timestamp);
    }
    
    /**
     * @dev Leader places a NO bet using vault's pooled funds
     * 
     * @param market Address of the BinaryMarket contract
     * @param amount Amount to bet (from vault's USDC balance)
     */
    function leaderBuyNo(address market, uint256 amount) external onlyOwner nonReentrant {
        require(market != address(0), "Invalid market address");
        require(amount > 0, "Bet amount must be greater than 0");
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient USDC balance");
        
        // Lock vault during active position
        isLocked = true;
        emit VaultLocked(block.timestamp);
        
        // Approve and place bet
        require(usdc.approve(market, amount), "Approval failed");
        BinaryMarket(market).buyNo(amount);
        
        // Record position
        uint256 positionId = positions.length;
        positions.push(Position({
            market: market,
            isYes: false,
            amount: amount,
            claimedWinnings: 0,
            isClosed: false
        }));
        
        activePositionCount[market]++;
        
        emit PositionOpened(positionId, market, false, amount, block.timestamp);
    }
    
    // ============ Claim Winnings & Performance Fee ============
    
    /**
     * @dev Claim winnings from a resolved market position
     * 
     * Process:
     * 1. Call market.claimWinnings() to get winnings
     * 2. Calculate profit = winnings - original bet
     * 3. Calculate performance fee = 20% of profit
     * 4. Mint new shares to leader equal to fee value
     * 5. Update high watermark if NAV increased
     * 6. Unlock vault if all positions closed
     * 
     * @param positionId ID of the position to claim
     */
    function claimWinnings(uint256 positionId) external onlyOwner nonReentrant {
        require(positionId < positions.length, "Invalid position ID");
        
        Position storage position = positions[positionId];
        require(!position.isClosed, "Position already closed");
        
        BinaryMarket market = BinaryMarket(position.market);
        
        // Claim winnings from market
        uint256 balanceBefore = usdc.balanceOf(address(this));
        market.claimWinnings();
        uint256 balanceAfter = usdc.balanceOf(address(this));
        
        uint256 winnings = balanceAfter - balanceBefore;
        position.claimedWinnings = winnings;
        position.isClosed = true;
        activePositionCount[position.market]--;
        
        // Calculate profit and performance fee
        uint256 profit = 0;
        if (winnings > position.amount) {
            profit = winnings - position.amount;
        }
        
        uint256 performanceFee = 0;
        uint256 leaderSharesIssued = 0;
        
        if (profit > 0) {
            // Calculate 20% performance fee
            performanceFee = (profit * PERFORMANCE_FEE_BPS) / 10000;
            
            // Mint shares to leader for the fee
            // Fee shares = (feeAmount * totalShares) / totalAssets
            uint256 assets = totalAssets();
            if (assets > 0) {
                leaderSharesIssued = (performanceFee * totalShares) / assets;
                
                if (leaderSharesIssued > 0) {
                    _mint(owner(), leaderSharesIssued);
                    totalShares += leaderSharesIssued;
                    accumulatedFees += performanceFee;
                }
            }
        }
        
        // Update high watermark
        uint256 currentNav = getNavPerShare();
        if (currentNav > highWaterMark) {
            highWaterMark = currentNav;
            emit HighWaterMarkUpdated(currentNav, block.timestamp);
        }
        
        // Unlock vault if all positions are closed
        if (activePositionCount[position.market] == 0) {
            bool allClosed = true;
            for (uint256 i = 0; i < positions.length; i++) {
                if (!positions[i].isClosed) {
                    allClosed = false;
                    break;
                }
            }
            
            if (allClosed) {
                isLocked = false;
                emit VaultUnlocked(block.timestamp);
            }
        }
        
        emit PositionClosed(positionId, winnings, performanceFee, block.timestamp);
        
        if (leaderSharesIssued > 0) {
            emit PerformanceFeeEarned(owner(), performanceFee, leaderSharesIssued, block.timestamp);
        }
    }
    
    /**
     * @dev Claim refund if market is cancelled
     * 
     * @param positionId ID of the position to refund
     */
    function claimRefund(uint256 positionId) external onlyOwner nonReentrant {
        require(positionId < positions.length, "Invalid position ID");
        
        Position storage position = positions[positionId];
        require(!position.isClosed, "Position already closed");
        
        BinaryMarket market = BinaryMarket(position.market);
        
        // Claim refund from market
        uint256 balanceBefore = usdc.balanceOf(address(this));
        market.claimRefund();
        uint256 balanceAfter = usdc.balanceOf(address(this));
        
        uint256 refund = balanceAfter - balanceBefore;
        position.claimedWinnings = refund;
        position.isClosed = true;
        activePositionCount[position.market]--;
        
        // Unlock vault if all positions are closed
        if (activePositionCount[position.market] == 0) {
            bool allClosed = true;
            for (uint256 i = 0; i < positions.length; i++) {
                if (!positions[i].isClosed) {
                    allClosed = false;
                    break;
                }
            }
            
            if (allClosed) {
                isLocked = false;
                emit VaultUnlocked(block.timestamp);
            }
        }
        
        emit PositionClosed(positionId, refund, 0, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get position details
     */
    function getPosition(uint256 positionId) external view returns (
        address market,
        bool isYes,
        uint256 amount,
        uint256 claimedWinnings,
        bool isClosed
    ) {
        require(positionId < positions.length, "Invalid position ID");
        Position storage pos = positions[positionId];
        return (pos.market, pos.isYes, pos.amount, pos.claimedWinnings, pos.isClosed);
    }
    
    /**
     * @dev Get total number of positions
     */
    function getPositionCount() external view returns (uint256) {
        return positions.length;
    }
    
    /**
     * @dev Get leader information
     */
    function getLeaderInfo() external view returns (
        address leaderAddress,
        string memory name,
        uint256 vaultIdNumber
    ) {
        return (owner(), leaderName, vaultId);
    }
    
    /**
     * @dev Get performance fee information
     */
    function getPerformanceFeeInfo() external view returns (
        uint256 feeBps,
        uint256 accumulatedFeesAmount,
        uint256 currentHighWaterMark
    ) {
        return (PERFORMANCE_FEE_BPS, accumulatedFees, highWaterMark);
    }
    
    /**
     * @dev Calculate expected shares from deposit
     */
    function calculateSharesFromDeposit(uint256 usdcAmount) external view returns (uint256) {
        if (totalShares == 0) return usdcAmount;
        return (usdcAmount * totalShares) / totalAssets();
    }
    
    /**
     * @dev Calculate expected USDC from withdrawal
     */
    function calculateUsdcFromWithdrawal(uint256 shares) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares * totalAssets()) / totalShares;
    }
}
