import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env.local" });

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    paths: {
        sources: "./src",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    networks: {
        hardhat: {
            forking: {
                url: `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
                enabled: true,
            },
            chainId: 480,
        },
        worldchain: {
            url: `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
            chainId: 480,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
        },
        // World Chain Testnet (if available)
        worldchain_sepolia: {
            url: `https://worldchain-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
            chainId: 4801,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
        },
    },
    etherscan: {
        apiKey: {
            worldchain: process.env.WORLDSCAN_API_KEY || "",
        },
        customChains: [
            {
                network: "worldchain",
                chainId: 480,
                urls: {
                    apiURL: "https://worldscan.org/api",
                    browserURL: "https://worldscan.org",
                },
            },
        ],
    },
};

export default config;
