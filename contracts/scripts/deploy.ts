import { ethers } from "hardhat";

async function main() {
    // World Chain addresses
    const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
    const SWAP_ROUTER_V3 = "0x091AD9e2e6e5eD44c1c66dB50e49A601F9f36cF6";
    const UNIVERSAL_ROUTER_V4 = "0x8ac7bee993bb44dab564ea4bc9ea67bf9eb5e743";
    const FEE_RECIPIENT = "0xc248F2b195B6D328879e76F210fdC7276A2ddE1E";

    console.log("Deploying OrbIdSwapRelay...");
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    console.log("Deployer:", (await ethers.getSigners())[0].address);

    const OrbIdSwapRelay = await ethers.getContractFactory("OrbIdSwapRelay");

    const relay = await OrbIdSwapRelay.deploy(
        PERMIT2,
        SWAP_ROUTER_V3,
        UNIVERSAL_ROUTER_V4,
        FEE_RECIPIENT
    );

    await relay.waitForDeployment();

    const address = await relay.getAddress();
    console.log("\n========================================");
    console.log("OrbIdSwapRelay deployed to:", address);
    console.log("========================================");
    console.log("\nUpdate src/lib/uniswap/config.ts with:");
    console.log(`export const ORBID_SWAP_RELAY_ADDRESS = '${address}';`);
    console.log("\nTo verify on WorldScan:");
    console.log(`npx hardhat verify --network worldchain ${address} ${PERMIT2} ${SWAP_ROUTER_V3} ${UNIVERSAL_ROUTER_V4} ${FEE_RECIPIENT}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
