// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title BinaryMarket
 * @dev A tokenized binary prediction market with AMM and Hybrid (Offline) Order Book.
 * - Positions are ERC-1155 tokens (ID 1: YES, ID 2: NO)
 * - Supports EIP-712 signed orders for zero-gas limit orders.
 */
contract BinaryMarket is ERC1155, Ownable, ReentrancyGuard, EIP712 {
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
    
    // Token IDs
    uint256 public constant YES_TOKEN_ID = 1;
    uint256 public constant NO_TOKEN_ID = 2;
    
    // Referral fee: % of the protocol fee (e.g., 5000 = 50%)
    uint256 public constant REFERRAL_COMMISSION_BPS = 5000; 
    
    // Secondary market fee (spread): 2%
    uint256 public constant SECONDARY_FEE_BPS = 200; 

    mapping(address => address) public userReferrer;
    mapping(address => uint256) public referrerEarnings;
    
    struct OfflineOrder {
        address user;
        uint256 amount;      // Shares
        uint256 price;       // USDC per share (scaled by 1e6)
        bool isYes;
        bool isBuying;
        uint256 nonce;
        uint256 expiry;
    }

    bytes32 public constant OFFLINE_ORDER_TYPEHASH = keccak256(
        "OfflineOrder(address user,uint256 amount,uint256 price,bool isYes,bool isBuying,uint256 nonce,uint256 expiry)"
    );

    mapping(address => uint256) public userNonces;
    mapping(bytes32 => uint256) public orderFilledAmount;

    struct Order {
        uint256 id;
        address maker;
        uint256 amount;
        uint256 price;
        bool isYes;
        bool isBuying;
        uint256 remaining;
        bool isActive;
    }
    
    mapping(uint256 => Order) public orders;
    uint256 public nextOrderId;
    
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
        address indexed user,
        uint256 winnings,
        uint256 feeAmount,
        uint256 netPayout,
        uint256 timestamp
    );
    
    event PositionSold(
        address indexed user,
        bool isYes,
        uint256 shares,
        uint256 usdcReceived,
        uint256 fee,
        uint256 timestamp
    );

    event MarketCancelled(uint256 timestamp);
    
    event OrderPlaced(
        uint256 indexed orderId,
        address indexed maker,
        uint256 amount,
        uint256 price,
        bool isYes,
        bool isBuying,
        uint256 timestamp
    );
    
    event OrderCancelled(uint256 indexed orderId, uint256 timestamp);
    event OrderFilled(uint256 indexed orderId, address indexed taker, uint256 amountFilled, uint256 timestamp);
    
    event ReferralCommissionPaid(
        address indexed referrer,
        address indexed referee,
        uint256 amount,
        uint256 timestamp
    );
    
    event RefundClaimed(
        address indexed user,
        uint256 amount,
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
    ) ERC1155("") Ownable(msg.sender) EIP712("NexusBinaryMarket", "1") {
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
        nextOrderId = 1;
    }

    // ============ Hybrid Matching Book Functions ============

    /**
     * @dev Match two offline signed orders (one buyer, one seller).
     * This is called by the system backend (matching engine).
     */
    function matchOrders(
        OfflineOrder memory buyOrder,
        bytes memory buySig,
        OfflineOrder memory sellOrder,
        bytes memory sellSig,
        uint256 fillAmount
    ) external nonReentrant {
        require(status == MarketStatus.OPEN, "Market is not open");
        require(buyOrder.isBuying && !sellOrder.isBuying, "Invalid order directions");
        require(buyOrder.isYes == sellOrder.isYes, "Token IDs must match");
        require(buyOrder.price >= sellOrder.price, "Price mismatch");
        require(block.timestamp < buyOrder.expiry && block.timestamp < sellOrder.expiry, "Order expired");

        _verifyOrder(buyOrder, buySig);
        _verifyOrder(sellOrder, sellSig);

        bytes32 buyHash = _hashOrder(buyOrder);
        bytes32 sellHash = _hashOrder(sellOrder);

        require(orderFilledAmount[buyHash] + fillAmount <= buyOrder.amount, "Buy fill overflow");
        require(orderFilledAmount[sellHash] + fillAmount <= sellOrder.amount, "Sell fill overflow");

        orderFilledAmount[buyHash] += fillAmount;
        orderFilledAmount[sellHash] += fillAmount;

        // Settlement: Taker price is usually used for the trade
        uint256 tradePrice = sellOrder.price; 
        uint256 usdcAmount = (fillAmount * tradePrice) / 1e6;

        uint256 tokenId = buyOrder.isYes ? YES_TOKEN_ID : NO_TOKEN_ID;

        // Transfer USDC from buyer to seller
        require(usdc.transferFrom(buyOrder.user, sellOrder.user, usdcAmount), "USDC trade transfer failed");

        // Swap positions (if seller has positions they burn, if maker creates new positions etc.)
        // For simplicity: this model assumes positions are minted/burned via AMM logic 
        // OR transferred if they are already in hand.
        // In this hybrid model, we'll support both.
        
        uint256 sellerBalance = balanceOf(sellOrder.user, tokenId);
        if (sellerBalance >= fillAmount) {
            // Seller has existing shares, transfer them
            _safeTransferFrom(sellOrder.user, buyOrder.user, tokenId, fillAmount, "");
        } else {
            // Seller is "creating" the position by minting? 
            // In a binary market: minting 1 YES and 1 NO costs 1 USDC.
            // But here we are doing a match. 
            // Simple approach for Nexus: transfer from seller to buyer.
            // If seller doesn't have it, they must mint it first or we revert.
            revert("Seller has insufficient shares");
        }

        emit OrderFilled(0, buyOrder.user, fillAmount, block.timestamp);
    }

    function _hashOrder(OfflineOrder memory order) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            OFFLINE_ORDER_TYPEHASH,
            order.user,
            order.amount,
            order.price,
            order.isYes,
            order.isBuying,
            order.nonce,
            order.expiry
        ));
    }

    function _verifyOrder(OfflineOrder memory order, bytes memory signature) internal view {
        bytes32 digest = _hashTypedDataV4(_hashOrder(order));
        address signer = ECDSA.recover(digest, signature);
        require(signer == order.user, "Invalid signature");
    }
    
    // ============ Order Book Functions ============

    /**
     * @dev Place a limit order.
     * If isBuying is true, amount is USDC the maker is willing to spend.
     * If isBuying is false, amount is shares the maker is willing to sell.
     */
    function placeLimitOrder(uint256 amount, uint256 price, bool isYes, bool isBuying) external nonReentrant {
        require(status == MarketStatus.OPEN, "Market is not open");
        require(amount > 0, "Amount must be > 0");
        require(price > 0 && price < 1e6, "Price must be between 0 and 1 USDC");
        
        if (isBuying) {
            // Maker locks USDC to buy shares later
            require(usdc.transferFrom(msg.sender, address(this), amount), "USDC locking failed");
        } else {
            // Maker locks shares to sell later
            uint256 tokenId = isYes ? YES_TOKEN_ID : NO_TOKEN_ID;
            require(balanceOf(msg.sender, tokenId) >= amount, "Insufficient shares to sell");
            _burn(msg.sender, tokenId, amount); // Move shares to contract or escrow? Better: record and track
            // Actually, for simplicity, we keep them in contract's balance
            // but since contract is the issuer, we can just record it
        }
        
        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            id: orderId,
            maker: msg.sender,
            amount: amount,
            price: price,
            isYes: isYes,
            isBuying: isBuying,
            remaining: amount,
            isActive: true
        });
        
        emit OrderPlaced(orderId, msg.sender, amount, price, isYes, isBuying, block.timestamp);
    }
    
    function cancelLimitOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.isActive, "Order not active");
        require(order.maker == msg.sender, "Not your order");
        
        order.isActive = false;
        
        if (order.isBuying) {
            // Refund locked USDC
            require(usdc.transfer(msg.sender, order.remaining), "Refund failed");
        } else {
            // Refund locked shares (re-mint)
            uint256 tokenId = order.isYes ? YES_TOKEN_ID : NO_TOKEN_ID;
            _mint(msg.sender, tokenId, order.remaining, "");
        }
        
        emit OrderCancelled(orderId, block.timestamp);
    }

    /**
     * @dev Taker fills an existing limit order.
     */
    function fillOrder(uint256 orderId, uint256 amountToFill) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.isActive, "Order not active");
        require(amountToFill > 0 && amountToFill <= order.remaining, "Invalid fill amount");
        require(msg.sender != order.maker, "Cannot fill your own order");
        
        uint256 tokenId = order.isYes ? YES_TOKEN_ID : NO_TOKEN_ID;
        
        if (order.isBuying) {
            // Maker wants to buy. Taker is selling shares to maker.
            // amountToFill is USDC amount maker is spending.
            uint256 sharesToGive = (amountToFill * 1e6) / order.price;
            require(balanceOf(msg.sender, tokenId) >= sharesToGive, "Taker has no shares");
            
            _burn(msg.sender, tokenId, sharesToGive);
            _mint(order.maker, tokenId, sharesToGive, "");
            
            require(usdc.transfer(msg.sender, amountToFill), "USDC to taker failed");
        } else {
            // Maker wants to sell shares. Taker is buying from maker.
            // amountToFill is shares taker is buying.
            uint256 cost = (amountToFill * order.price) / 1e6;
            require(usdc.transferFrom(msg.sender, address(this), cost), "Taker payment failed");
            
            _mint(msg.sender, tokenId, amountToFill, "");
            require(usdc.transfer(order.maker, cost), "USDC to maker failed");
        }
        
        order.remaining -= amountToFill;
        if (order.remaining == 0) {
            order.isActive = false;
        }
        
        emit OrderFilled(orderId, msg.sender, amountToFill, block.timestamp);
    }
    
    // ============ Core Functions ============
    
    function buyYes(uint256 amount) external nonReentrant {
        _buyYes(amount, address(0), 0);
    }

    function buyYesWithReferrer(uint256 amount, address referrer) external nonReentrant {
        _buyYes(amount, referrer, 0); // 0 means no slippage protection
    }

    /**
     * @dev Buy YES with referrer and slippage protection
     */
    function buyYesWithSlippage(uint256 amount, address referrer, uint256 minSharesOut) external nonReentrant {
        _buyYes(amount, referrer, minSharesOut);
    }

    function _buyYes(uint256 amount, address referrer, uint256 minSharesOut) internal {
        require(status == MarketStatus.OPEN, "Market is not open");
        require(block.timestamp < endTime, "Market has ended");
        require(amount > 0, "Bet amount must be greater than 0");
        
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        uint256 totalPool = yesPoolAmount + noPoolAmount;
        uint256 sharesToMint;
        
        if (totalPool == 0) {
            sharesToMint = amount * 2; // Initial price 0.5
        } else {
            sharesToMint = (amount * totalPool) / (yesPoolAmount > 0 ? yesPoolAmount : 1);
        }
        
        require(sharesToMint >= minSharesOut, "Slippage: Too few shares");
        
        yesPoolAmount += amount;
        _mint(msg.sender, YES_TOKEN_ID, sharesToMint, "");
        
        if (referrer != address(0) && referrer != msg.sender) {
            userReferrer[msg.sender] = referrer;
        }
        
        emit BetPlaced(msg.sender, true, amount, block.timestamp);
    }
    
    function buyNo(uint256 amount) external nonReentrant {
        _buyNo(amount, address(0), 0);
    }

    function buyNoWithReferrer(uint256 amount, address referrer) external nonReentrant {
        _buyNo(amount, referrer, 0);
    }

    /**
     * @dev Buy NO with referrer and slippage protection
     */
    function buyNoWithSlippage(uint256 amount, address referrer, uint256 minSharesOut) external nonReentrant {
        _buyNo(amount, referrer, minSharesOut);
    }

    function _buyNo(uint256 amount, address referrer, uint256 minSharesOut) internal {
        require(status == MarketStatus.OPEN, "Market is not open");
        require(block.timestamp < endTime, "Market has ended");
        require(amount > 0, "Bet amount must be greater than 0");
        
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        uint256 totalPool = yesPoolAmount + noPoolAmount;
        uint256 sharesToMint;
        
        if (totalPool == 0) {
            sharesToMint = amount * 2;
        } else {
            sharesToMint = (amount * totalPool) / (noPoolAmount > 0 ? noPoolAmount : 1);
        }
        
        require(sharesToMint >= minSharesOut, "Slippage: Too few shares");
        
        noPoolAmount += amount;
        _mint(msg.sender, NO_TOKEN_ID, sharesToMint, "");
        
        if (referrer != address(0) && referrer != msg.sender) {
            userReferrer[msg.sender] = referrer;
        }
        
        emit BetPlaced(msg.sender, false, amount, block.timestamp);
    }

    /**
     * @dev Claim winnings from a resolved market
     */
    function claimWinnings() external nonReentrant {
        require(status == MarketStatus.RESOLVED, "Market is not resolved");
        address referrer = userReferrer[msg.sender];
        
        uint256 sharesToBurn;
        uint256 totalWinningShares;
        uint256 poolToDistribute = yesPoolAmount + noPoolAmount;
        uint256 tokenId;

        if (resolvedOutcome == Outcome.YES) {
            tokenId = YES_TOKEN_ID;
            sharesToBurn = balanceOf(msg.sender, YES_TOKEN_ID);
            totalWinningShares = totalSupply(YES_TOKEN_ID);
        } else if (resolvedOutcome == Outcome.NO) {
            tokenId = NO_TOKEN_ID;
            sharesToBurn = balanceOf(msg.sender, NO_TOKEN_ID);
            totalWinningShares = totalSupply(NO_TOKEN_ID);
        } else {
            revert("Outcome unresolved");
        }

        require(sharesToBurn > 0, "No winning shares");
        require(totalWinningShares > 0, "No winning shares total");

        uint256 winnings = (sharesToBurn * poolToDistribute) / totalWinningShares;
        uint256 feeAmount = (winnings * feeBps) / 10000;
        uint256 netPayout = winnings - feeAmount;
        
        _burn(msg.sender, tokenId, sharesToBurn);
        require(usdc.transfer(msg.sender, netPayout), "USDC payout failed");
        
        if (feeAmount > 0) {
            if (referrer != address(0)) {
                uint256 referralBonus = (feeAmount * REFERRAL_COMMISSION_BPS) / 10000;
                uint256 treasuryFee = feeAmount - referralBonus;
                
                referrerEarnings[referrer] += referralBonus;
                
                require(usdc.transfer(referrer, referralBonus), "Referral payout failed");
                require(usdc.transfer(treasury, treasuryFee), "Treasury payout failed");
                
                emit ReferralCommissionPaid(referrer, msg.sender, referralBonus, block.timestamp);
            } else {
                require(usdc.transfer(treasury, feeAmount), "Treasury payout failed");
            }
        }
        
        emit WinningsClaimed(msg.sender, winnings, feeAmount, netPayout, block.timestamp);
    }

    /**
     * @dev Sell a YES position back to the pool (AMM)
     */
    function sellYes(uint256 shares) external nonReentrant {
        require(status == MarketStatus.OPEN, "Market is not open");
        require(balanceOf(msg.sender, YES_TOKEN_ID) >= shares, "Insufficient shares");
        
        uint256 currentPrice = getPrice(YES_TOKEN_ID);
        uint256 usdcValue = (shares * currentPrice) / 1e6;
        
        uint256 fee = (usdcValue * SECONDARY_FEE_BPS) / 10000;
        uint256 netReceived = usdcValue - fee;
        
        _burn(msg.sender, YES_TOKEN_ID, shares);
        yesPoolAmount -= usdcValue;
        
        require(usdc.transfer(msg.sender, netReceived), "Transfer failed");
        
        address referrer = userReferrer[msg.sender];
        if (referrer != address(0) && fee > 0) {
            uint256 referralBonus = (fee * REFERRAL_COMMISSION_BPS) / 10000;
            uint256 treasuryFee = fee - referralBonus;
            
            referrerEarnings[referrer] += referralBonus;
            
            require(usdc.transfer(referrer, referralBonus), "Referral failed");
            require(usdc.transfer(treasury, treasuryFee), "Treasury failed");
            
            emit ReferralCommissionPaid(referrer, msg.sender, referralBonus, block.timestamp);
        } else {
            require(usdc.transfer(treasury, fee), "Fee failed");
        }
        
        emit PositionSold(msg.sender, true, shares, netReceived, fee, block.timestamp);
    }

    function sellNo(uint256 shares) external nonReentrant {
        require(status == MarketStatus.OPEN, "Market is not open");
        require(balanceOf(msg.sender, NO_TOKEN_ID) >= shares, "Insufficient shares");
        
        uint256 currentPrice = getPrice(NO_TOKEN_ID);
        uint256 usdcValue = (shares * currentPrice) / 1e6;
        
        uint256 fee = (usdcValue * SECONDARY_FEE_BPS) / 10000;
        uint256 netReceived = usdcValue - fee;
        
        _burn(msg.sender, NO_TOKEN_ID, shares);
        noPoolAmount -= usdcValue;
        
        require(usdc.transfer(msg.sender, netReceived), "Transfer failed");
        
        address referrer = userReferrer[msg.sender];
        if (referrer != address(0) && fee > 0) {
            uint256 referralBonus = (fee * REFERRAL_COMMISSION_BPS) / 10000;
            uint256 treasuryFee = fee - referralBonus;
            
            referrerEarnings[referrer] += referralBonus;
            
            require(usdc.transfer(referrer, referralBonus), "Referral failed");
            require(usdc.transfer(treasury, treasuryFee), "Treasury failed");
            
            emit ReferralCommissionPaid(referrer, msg.sender, referralBonus, block.timestamp);
        } else {
            require(usdc.transfer(treasury, fee), "Fee failed");
        }
        
        emit PositionSold(msg.sender, false, shares, netReceived, fee, block.timestamp);
    }

    function getPrice(uint256 tokenId) public view returns (uint256) {
        uint256 totalPool = yesPoolAmount + noPoolAmount;
        if (totalPool == 0) return 500000; // 0.5 USDC
        if (tokenId == YES_TOKEN_ID) {
            return (yesPoolAmount * 1e6) / totalPool;
        } else {
            return (noPoolAmount * 1e6) / totalPool;
        }
    }

    // Supply Tracking
    mapping(uint256 => uint256) private _supplies;
    function totalSupply(uint256 id) public view returns (uint256) {
        return _supplies[id];
    }
    
    function _update(address from, address to, uint256[] memory ids, uint256[] memory amounts) internal virtual override {
        super._update(from, to, ids, amounts);
        if (from == address(0)) {
            for (uint256 i = 0; i < ids.length; i++) _supplies[ids[i]] += amounts[i];
        }
        if (to == address(0)) {
            for (uint256 i = 0; i < ids.length; i++) _supplies[ids[i]] -= amounts[i];
        }
    }

    // ============ Admin & Helper Functions ============

    function adminResolve(uint256 outcome) external onlyOwner {
        require(status == MarketStatus.OPEN, "Reached final state");
        require(outcome == 1 || outcome == 2, "Invalid outcome");
        status = MarketStatus.RESOLVED;
        resolvedOutcome = outcome == 1 ? Outcome.YES : Outcome.NO;
        emit MarketResolved(resolvedOutcome, block.timestamp);
    }

    function cancelMarket() external onlyOwner {
        require(status == MarketStatus.OPEN, "Reached final state");
        status = MarketStatus.CANCELLED;
        emit MarketCancelled(block.timestamp);
    }

    function claimRefund(uint256 id) external nonReentrant {
        require(status == MarketStatus.CANCELLED, "Not cancelled");
        uint256 shares = balanceOf(msg.sender, id);
        require(shares > 0, "No shares");
        
        // Payout principal: In simplified token model, we use the original pool ratio
        // For simplicity in refund, we allow burning shares for their proportional share of the REMAINING pool
        uint256 pool = yesPoolAmount + noPoolAmount;
        uint256 total = totalSupply(id);
        uint256 amount = (shares * pool) / (totalSupply(YES_TOKEN_ID) + totalSupply(NO_TOKEN_ID));
        
        _burn(msg.sender, id, shares);
        require(usdc.transfer(msg.sender, amount), "Refund failed");
        emit RefundClaimed(msg.sender, amount, block.timestamp);
    }

    function getMarketDetails() external view returns (uint256 id, string memory title, uint256 end, uint256 yesPool, uint256 noPool, string memory statusStr) {
        return (marketId, eventTitle, endTime, yesPoolAmount, noPoolAmount, status == MarketStatus.OPEN ? "OPEN" : (status == MarketStatus.RESOLVED ? "RESOLVED" : "CANCELLED"));
    }
}
