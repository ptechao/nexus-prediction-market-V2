import pkg from "hardhat";
const { ethers, network } = pkg;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("----------------------------------------------------------------");
    console.log(`🚀 Starting deployment on network: ${network.name}`);
    console.log(`👤 Deployer address: ${deployer.address}`);
    console.log("----------------------------------------------------------------");

    // 1. Deploy MockUSDC
    console.log("📦 Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("contracts/MockUSDC.sol:MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log(`✅ MockUSDC deployed at: ${usdcAddress}`);

    // 2. Deploy BinaryMarketFactory
    console.log("📦 Deploying BinaryMarketFactory...");
    const BinaryMarketFactory = await ethers.getContractFactory("BinaryMarketFactory");
    // We'll use the deployer as the initial treasury for now
    const marketFactory = await BinaryMarketFactory.deploy(usdcAddress, deployer.address);
    await marketFactory.waitForDeployment();
    const marketFactoryAddress = await marketFactory.getAddress();
    console.log(`✅ BinaryMarketFactory deployed at: ${marketFactoryAddress}`);

    // 3. Deploy VaultFactory
    console.log("📦 Deploying VaultFactory...");
    const VaultFactory = await ethers.getContractFactory("VaultFactory");
    const vaultFactory = await VaultFactory.deploy(usdcAddress);
    await vaultFactory.waitForDeployment();
    const vaultFactoryAddress = await vaultFactory.getAddress();
    console.log(`✅ VaultFactory deployed at: ${vaultFactoryAddress}`);

    console.log("----------------------------------------------------------------");
    console.log("🎉 All contracts deployed successfully!");
    console.log("----------------------------------------------------------------");
    console.log(`USDC: ${usdcAddress}`);
    console.log(`MARKET_FACTORY: ${marketFactoryAddress}`);
    console.log(`VAULT_FACTORY: ${vaultFactoryAddress}`);
    console.log("----------------------------------------------------------------");
    console.log("⚠️  Please update your .env and client/src/lib/web3Config.ts with these addresses.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
