import hre from "hardhat";

async function main() {
  // Connect to the local network
  const connection = await hre.network.connect();
  const { ethers } = connection;

  const Portal = await ethers.getContractFactory("BenefitsPortal");
  const portal = await Portal.deploy();
  await portal.waitForDeployment();

  const address = await portal.getAddress();
  console.log("✅ BenefitsPortal deployed to:", address);

  // Fund the contract with test ETH for benefits
  const [owner] = await ethers.getSigners();
  const fundTx = await owner.sendTransaction({
    to: address,
    value: ethers.parseEther("0.5"),
  });
  await fundTx.wait();
  console.log("💰 Contract funded with 0.5 ETH");

  console.log("\n📋 Contract address for team:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});