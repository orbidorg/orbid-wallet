import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("OrbIdSwapRelay Simulation (World Chain Fork)", function () {
    // World Chain Mainnet Addresses
    const WETH = "0x4200000000000000000000000000000000000006";
    const USDC = "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1";
    const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
    const SWAP_ROUTER_V3 = "0x091AD9e2e6e5eD44c1c66dB50e49A601F9f36cF6";
    const UNIVERSAL_ROUTER_V4 = "0x8ac7bee993bb44dab564ea4bc9ea67bf9eb5e743";
    const FEE_RECIPIENT = "0xc248F2b195B6D328879e76F210fdC7276A2ddE1E";

    let relay: any;
    let weth: any;
    let usdc: any;
    let user: any;
    let feeCollector: any;

    before(async function () {
        [user] = await ethers.getSigners();
        feeCollector = FEE_RECIPIENT;

        // Deploy Relay
        const OrbIdSwapRelay = await ethers.getContractFactory("OrbIdSwapRelay");
        relay = await OrbIdSwapRelay.deploy(
            PERMIT2,
            SWAP_ROUTER_V3,
            UNIVERSAL_ROUTER_V4,
            FEE_RECIPIENT
        );
        await relay.waitForDeployment();

        weth = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", WETH);
        usdc = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", USDC);

        // Get some WETH (Deposit ETH)
        const wethDeposit = "0xd0e30db0"; // deposit()
        await user.sendTransaction({
            to: WETH,
            data: wethDeposit,
            value: ethers.parseEther("1.0"),
        });

        console.log("User WETH balance:", ethers.formatEther(await weth.balanceOf(user.address)));
    });

    it("Should execute a v3 swap (WETH -> USDC) and collect 0.5% fee", async function () {
        const amountIn = ethers.parseEther("0.1");
        const amountOutMin = 1;

        // Try different fees
        const fees = [500, 3000, 10000];
        let success = false;
        let lastError = "";

        for (const poolFee of fees) {
            console.log(`Trying swap with fee: ${poolFee}...`);
            try {
                // 1. Approve Relay
                await weth.approve(await relay.getAddress(), amountIn);

                // 2. Prep params
                const params = {
                    tokenIn: WETH,
                    tokenOut: USDC,
                    amountIn: amountIn,
                    amountOutMin: amountOutMin,
                    poolFee: poolFee,
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
                    useV4: false,
                };

                const initialFeeRecipientBalance = await weth.balanceOf(FEE_RECIPIENT);
                const initialUserUsdcBalance = await usdc.balanceOf(user.address);

                // 3. Execute swap
                const tx = await relay.swap(params);
                await tx.wait();

                // 4. Verify balances
                const feeAmount = (amountIn * BigInt(50)) / BigInt(10000);
                expect(await weth.balanceOf(FEE_RECIPIENT)).to.equal(initialFeeRecipientBalance + feeAmount);
                expect(await usdc.balanceOf(user.address)).to.be.gt(initialUserUsdcBalance);

                console.log(`Swap successful with fee ${poolFee}!`);
                console.log("USDC received:", ethers.formatUnits(await usdc.balanceOf(user.address), 6));
                success = true;
                break;
            } catch (e: any) {
                console.log(`Failed with fee ${poolFee}:`, e.message);
                lastError = e.message;
            }
        }

        if (!success) {
            throw new Error(`All fee tiers failed. Last error: ${lastError}`);
        }
    });

    it("Should execute a swap with Permit2 signature (WETH -> USDC)", async function () {
        const amountIn = ethers.parseEther("0.05");
        const amountOutMin = 1;
        const fees = [500, 3000, 10000];
        let success = false;

        // 1. Approve Permit2 contract to spend user's WETH
        await weth.approve(PERMIT2, amountIn);

        for (const poolFee of fees) {
            console.log(`Trying swapWithPermit with fee: ${poolFee}...`);
            try {
                const nonce = Math.floor(Math.random() * 1000000); // Use random nonce to avoid collision
                const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

                // 2. Prepare Permit2 Signature (EIP-712)
                const domain = {
                    name: "Permit2",
                    chainId: 480,
                    verifyingContract: PERMIT2,
                };

                const types = {
                    PermitTransferFrom: [
                        { name: "permitted", type: "TokenPermissions" },
                        { name: "spender", type: "address" },
                        { name: "nonce", type: "uint256" },
                        { name: "deadline", type: "uint256" },
                    ],
                    TokenPermissions: [
                        { name: "token", type: "address" },
                        { name: "amount", type: "uint256" },
                    ],
                };

                const message = {
                    permitted: {
                        token: WETH,
                        amount: amountIn,
                    },
                    spender: await relay.getAddress(),
                    nonce: nonce,
                    deadline: deadline,
                };

                const signature = await user.signTypedData(domain, types, message);

                // 3. Prep params
                const params = {
                    tokenIn: WETH,
                    tokenOut: USDC,
                    amountIn: amountIn,
                    amountOutMin: amountOutMin,
                    poolFee: poolFee,
                    deadline: deadline,
                    useV4: false,
                };

                // Encode permitData: (uint256 nonce, uint256 deadline)
                const permitData = ethers.AbiCoder.defaultAbiCoder().encode(
                    ["uint256", "uint256"],
                    [nonce, deadline]
                );

                const initialUserUsdcBalance = await usdc.balanceOf(user.address);

                // 4. Execute swapWithPermit
                const tx = await relay.swapWithPermit(params, permitData, signature);
                await tx.wait();

                expect(await usdc.balanceOf(user.address)).to.be.gt(initialUserUsdcBalance);
                console.log(`SwapWithPermit successful with fee ${poolFee}!`);
                console.log("USDC received:", ethers.formatUnits(await usdc.balanceOf(user.address), 6));
                success = true;
                break;
            } catch (e: any) {
                console.log(`Failed swapWithPermit with fee ${poolFee}:`, e.message);
            }
        }

        if (!success) {
            throw new Error("All fee tiers failed for swapWithPermit");
        }
    });

    it("Should fail if amountOutMin is not met", async function () {
        const amountIn = ethers.parseEther("0.01");
        // We expect SwapFailed because Uniswap router reverts and we catch it as SwapFailed
        const amountOutMin = ethers.parseUnits("10000", 6);

        await weth.approve(await relay.getAddress(), amountIn);

        const params = {
            tokenIn: WETH,
            tokenOut: USDC,
            amountIn: amountIn,
            amountOutMin: amountOutMin,
            poolFee: 500,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
            useV4: false,
        };

        await expect(relay.swap(params)).to.be.revertedWithCustomError(relay, "SwapFailed");
    });
});
