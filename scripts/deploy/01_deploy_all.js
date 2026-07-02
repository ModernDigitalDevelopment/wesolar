const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying WeSolar contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // 1. Deploy WeSolarToken
  console.log("\n1. Deploying WeSolarToken (WST)...");
  const WeSolarToken = await ethers.getContractFactory("WeSolarToken");
  const wstToken = await WeSolarToken.deploy(deployer.address);
  await wstToken.waitForDeployment();
  const wstAddress = await wstToken.getAddress();
  console.log("   WeSolarToken deployed to:", wstAddress);

  // 2. Deploy SolarPanelRegistry
  console.log("\n2. Deploying SolarPanelRegistry...");
  const SolarPanelRegistry = await ethers.getContractFactory("SolarPanelRegistry");
  const registry = await SolarPanelRegistry.deploy(deployer.address, deployer.address); // deployer as oracle initially
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("   SolarPanelRegistry deployed to:", registryAddress);

  // 3. Deploy WeSolarFinancing
  console.log("\n3. Deploying WeSolarFinancing...");
  const WeSolarFinancing = await ethers.getContractFactory("WeSolarFinancing");
  const financing = await WeSolarFinancing.deploy(deployer.address, wstAddress);
  await financing.waitForDeployment();
  const financingAddress = await financing.getAddress();
  console.log("   WeSolarFinancing deployed to:", financingAddress);

  console.log("\n=== WeSolar Deployment Summary ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("");
  console.log("Contract Addresses:");
  console.log("  WeSolarToken (WST):    ", wstAddress);
  console.log("  SolarPanelRegistry:    ", registryAddress);
  console.log("  WeSolarFinancing:      ", financingAddress);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Deploy WeSolarDAO with TimelockController");
  console.log("  2. Set up energy oracle for SolarPanelRegistry");
  console.log("  3. Register initial solar panel installations");
  console.log("  4. Apply for Celo Climate Collective grant");

  return { wstToken, registry, financing };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
