import { ethers } from "hardhat";

async function main() {
  console.log("Deploying DocumentVerification contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const DocumentVerification = await ethers.getContractFactory("DocumentVerification");
  const documentVerification = await DocumentVerification.deploy();

  await documentVerification.waitForDeployment();
  
  const address = await documentVerification.getAddress();
  console.log("DocumentVerification deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 