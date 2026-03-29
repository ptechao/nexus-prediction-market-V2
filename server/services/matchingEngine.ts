import { ethers } from "ethers";
import { getDb } from "../db";
import { orders, markets } from "../../drizzle/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_ENDPOINT || "https://polygon-rpc.com";

// ABI for the matchOrders function
const BINARY_MARKET_ABI = [
  "function matchOrders((address user, uint256 amount, uint256 price, bool isYes, bool isBuying, uint256 nonce, uint256 expiry) buyOrder, bytes buySig, (address user, uint256 amount, uint256 price, bool isYes, bool isBuying, uint256 nonce, uint256 expiry) sellOrder, bytes sellSig, uint256 fillAmount) external"
];

export async function runMatchingEngine() {
  const db = await getDb();
  if (!db) return;

  console.log("[Matching Engine] Scanning for matchable orders...");

  try {
    // 1. Get all OPEN orders
    const openOrders = await db.select().from(orders).where(eq(orders.status, 'OPEN'));
    if (openOrders.length === 0) return;

    // Group orders by marketId and side (YES/NO)
    const marketGroups: Record<string, typeof openOrders> = {};
    for (const order of openOrders) {
      const key = `${order.marketId}_${order.isYes}`;
      if (!marketGroups[key]) marketGroups[key] = [];
      marketGroups[key].push(order);
    }

    for (const key in marketGroups) {
      const group = marketGroups[key];
      const buyers = group.filter(o => o.isBuying).sort((a, b) => b.price - a.price); // Highest buy price first
      const sellers = group.filter(o => !o.isBuying).sort((a, b) => a.price - b.price); // Lowest sell price first

      if (buyers.length === 0 || sellers.length === 0) continue;

      for (const buyer of buyers) {
        for (const seller of sellers) {
          if (seller.remaining <= 0) continue;
          if (buyer.remaining <= 0) break;

          // Check if prices match (Buy Price >= Sell Price)
          if (buyer.price >= seller.price) {
            const fillAmount = Math.min(buyer.remaining, seller.remaining);
            
            console.log(`[Matching Engine] Match found in Market ${buyer.marketId}: ${fillAmount} shares @ ${seller.price}`);

            // Execute on-chain if keys are available
            if (PRIVATE_KEY && buyer.signature && seller.signature) {
              await executeMatchOnChain(buyer, seller, fillAmount);
            } else {
              console.log("[Matching Engine] Skipping on-chain execution: Missing private key or signatures (Simulation Mode)");
            }

            // Update database
            const newBuyerRemaining = buyer.remaining - fillAmount;
            const newSellerRemaining = seller.remaining - fillAmount;

            await db.update(orders).set({ 
              remaining: newBuyerRemaining, 
              status: newBuyerRemaining <= 0 ? 'FILLED' : 'OPEN' 
            }).where(eq(orders.id, buyer.id));

            await db.update(orders).set({ 
              remaining: newSellerRemaining, 
              status: newSellerRemaining <= 0 ? 'FILLED' : 'OPEN' 
            }).where(eq(orders.id, seller.id));
            
            buyer.remaining = newBuyerRemaining;
            seller.remaining = newSellerRemaining;
          }
        }
      }
    }
  } catch (error) {
    console.error("[Matching Engine] Error during matching loop:", error);
  }
}

async function executeMatchOnChain(buyer: any, seller: any, fillAmount: number) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
    
    // We need the market contract address. 
    // In a real scenario, this would be stored in the 'markets' table.
    const db = await getDb();
    const marketResult = await db!.select().from(markets).where(eq(markets.id, buyer.marketId)).limit(1);
    const contractAddress = marketResult[0]?.contractAddress;

    if (!contractAddress || contractAddress === "0x...") {
      console.warn(`[Matching Engine] Invalid contract address for market ${buyer.marketId}`);
      return;
    }

    const contract = new ethers.Contract(contractAddress, BINARY_MARKET_ABI, wallet);

    const buyOrderStruct = {
      user: buyer.maker,
      amount: ethers.parseUnits(buyer.amount.toString(), 0),
      price: ethers.parseUnits(buyer.price.toString(), 0),
      isYes: buyer.isYes,
      isBuying: true,
      nonce: buyer.nonce || 0,
      expiry: buyer.expiry || 0
    };

    const sellOrderStruct = {
      user: seller.maker,
      amount: ethers.parseUnits(seller.amount.toString(), 0),
      price: ethers.parseUnits(seller.price.toString(), 0),
      isYes: seller.isYes,
      isBuying: false,
      nonce: seller.nonce || 0,
      expiry: seller.expiry || 0
    };

    const tx = await contract.matchOrders(
      buyOrderStruct,
      buyer.signature,
      sellOrderStruct,
      seller.signature,
      ethers.parseUnits(fillAmount.toString(), 0)
    );

    console.log(`[Matching Engine] Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`[Matching Engine] Transaction confirmed: ${tx.hash}`);
  } catch (error) {
    console.error(`[Matching Engine] On-chain execution failed for match:`, error);
  }
}
