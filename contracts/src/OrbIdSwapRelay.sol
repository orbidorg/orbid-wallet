// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IPermit2 {
    struct TokenPermissions {
        address token;
        uint256 amount;
    }
    struct PermitTransferFrom {
        TokenPermissions permitted;
        uint256 nonce;
        uint256 deadline;
    }
    struct SignatureTransferDetails {
        address to;
        uint256 requestedAmount;
    }
    function permitTransferFrom(
        PermitTransferFrom memory permit,
        SignatureTransferDetails memory transferDetails,
        address owner,
        bytes calldata signature
    ) external;
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

/// @title OrbIdSwapRelay
/// @notice Swap relay that collects a 0.5% fee before routing to Uniswap V2/V3/V4
/// @dev Uses Permit2 for gasless token approvals
contract OrbIdSwapRelay {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Fee in basis points (50 = 0.5%)
    uint256 public constant FEE_BPS = 50;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ Immutables ============

    /// @notice Permit2 contract address
    address public immutable permit2;

    /// @notice Uniswap V2 Router02 address
    address public immutable swapRouterV2;

    /// @notice Uniswap V3 SwapRouter02 address
    address public immutable swapRouterV3;

    /// @notice Uniswap V4 UniversalRouter address
    address public immutable universalRouterV4;

    /// @notice Address that receives the swap fees
    address public immutable feeRecipient;

    /// @notice Contract owner for rescue operations
    address public immutable owner;

    // ============ Enums ============

    enum SwapVersion {
        V2,
        V3,
        V4
    }

    // ============ Structs ============

    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        uint24 poolFee; // For V3: 500, 3000, 10000
        uint256 deadline;
        SwapVersion version; // V2, V3, or V4
    }

    // ============ Events ============

    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 feeAmount,
        SwapVersion version
    );

    event TokensRescued(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    // ============ Errors ============

    error InvalidAddress();
    error SwapFailed();
    error InsufficientOutput();
    error Unauthorized();

    // ============ Constructor ============

    constructor(
        address _permit2,
        address _swapRouterV2,
        address _swapRouterV3,
        address _universalRouterV4,
        address _feeRecipient
    ) {
        if (_permit2 == address(0) || _feeRecipient == address(0)) {
            revert InvalidAddress();
        }

        permit2 = _permit2;
        swapRouterV2 = _swapRouterV2;
        swapRouterV3 = _swapRouterV3;
        universalRouterV4 = _universalRouterV4;
        feeRecipient = _feeRecipient;
        owner = msg.sender;
    }

    // ============ Owner Functions ============

    /// @notice Rescue stuck tokens from the contract
    /// @param token The token to rescue
    /// @param to The address to send tokens to
    /// @param amount The amount to rescue
    function rescueTokens(address token, address to, uint256 amount) external {
        if (msg.sender != owner) {
            revert Unauthorized();
        }
        IERC20(token).safeTransfer(to, amount);
        emit TokensRescued(token, to, amount);
    }

    // ============ External Functions ============

    /// @notice Execute a swap with fee collection using Permit2 signature
    /// @param params Swap parameters
    /// @param permitData Encoded permit data (nonce, deadline)
    /// @param signature Permit2 signature from user
    /// @return amountOut Amount of output tokens received
    function swapWithPermit(
        SwapParams calldata params,
        bytes calldata permitData,
        bytes calldata signature
    ) external returns (uint256 amountOut) {
        // Decode permit data
        (uint256 nonce, uint256 deadline) = abi.decode(
            permitData,
            (uint256, uint256)
        );

        // Build Permit2 structs
        IPermit2.PermitTransferFrom memory permit = IPermit2
            .PermitTransferFrom({
                permitted: IPermit2.TokenPermissions({
                    token: params.tokenIn,
                    amount: params.amountIn
                }),
                nonce: nonce,
                deadline: deadline
            });

        IPermit2.SignatureTransferDetails memory transferDetails = IPermit2
            .SignatureTransferDetails({
                to: address(this),
                requestedAmount: params.amountIn
            });

        // Transfer tokens from user via Permit2
        _permitTransferFrom(permit, transferDetails, msg.sender, signature);

        // Execute swap with fee
        amountOut = _executeSwap(params);
    }

    /// @notice Execute a swap with pre-approved tokens (no Permit2)
    /// @param params Swap parameters
    /// @return amountOut Amount of output tokens received
    function swap(
        SwapParams calldata params
    ) external returns (uint256 amountOut) {
        // Transfer tokens from user
        IERC20(params.tokenIn).safeTransferFrom(
            msg.sender,
            address(this),
            params.amountIn
        );

        // Execute swap with fee
        amountOut = _executeSwap(params);
    }

    // ============ Internal Functions ============

    function _executeSwap(
        SwapParams calldata params
    ) internal returns (uint256 amountOut) {
        // Calculate fee
        uint256 feeAmount = (params.amountIn * FEE_BPS) / BPS_DENOMINATOR;
        uint256 amountToSwap = params.amountIn - feeAmount;

        // Transfer fee to recipient
        IERC20(params.tokenIn).safeTransfer(feeRecipient, feeAmount);

        // Execute swap based on version
        if (params.version == SwapVersion.V2) {
            amountOut = _swapV2(params, amountToSwap);
        } else if (params.version == SwapVersion.V3) {
            amountOut = _swapV3(params, amountToSwap);
        } else {
            amountOut = _swapV4(params, amountToSwap);
        }

        // Verify minimum output
        if (amountOut < params.amountOutMin) {
            revert InsufficientOutput();
        }

        // Transfer output to user
        IERC20(params.tokenOut).safeTransfer(msg.sender, amountOut);

        emit SwapExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut,
            feeAmount,
            params.version
        );
    }

    function _permitTransferFrom(
        IPermit2.PermitTransferFrom memory permit,
        IPermit2.SignatureTransferDetails memory transferDetails,
        address tokenOwner,
        bytes calldata signature
    ) internal {
        IPermit2(permit2).permitTransferFrom(
            permit,
            transferDetails,
            tokenOwner,
            signature
        );
    }

    function _swapV2(
        SwapParams calldata params,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        // Approve V2 Router
        IERC20(params.tokenIn).forceApprove(swapRouterV2, amountIn);

        // Build path
        address[] memory path = new address[](2);
        path[0] = params.tokenIn;
        path[1] = params.tokenOut;

        // Execute V2 swap
        uint[] memory amounts = IUniswapV2Router(swapRouterV2)
            .swapExactTokensForTokens(
                amountIn,
                params.amountOutMin,
                path,
                address(this),
                params.deadline
            );

        amountOut = amounts[amounts.length - 1];
    }

    function _swapV3(
        SwapParams calldata params,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        // Approve SwapRouter
        IERC20(params.tokenIn).forceApprove(swapRouterV3, amountIn);

        // Encode swap call
        bytes memory swapCall = abi.encodeWithSignature(
            "exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))",
            params.tokenIn,
            params.tokenOut,
            params.poolFee,
            address(this),
            amountIn,
            params.amountOutMin,
            0 // sqrtPriceLimitX96
        );

        (bool success, bytes memory result) = swapRouterV3.call(swapCall);

        if (!success) {
            revert SwapFailed();
        }

        amountOut = abi.decode(result, (uint256));
    }

    function _swapV4(
        SwapParams calldata params,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        // Approve UniversalRouter
        IERC20(params.tokenIn).forceApprove(universalRouterV4, amountIn);

        // V4 swap via UniversalRouter
        bytes memory commands = hex"00"; // V4_SWAP command
        bytes[] memory inputs = new bytes[](1);
        inputs[0] = abi.encode(
            params.tokenIn,
            params.tokenOut,
            params.poolFee,
            address(this),
            amountIn,
            params.amountOutMin
        );

        (bool success, ) = universalRouterV4.call(
            abi.encodeWithSignature(
                "execute(bytes,bytes[],uint256)",
                commands,
                inputs,
                params.deadline
            )
        );

        if (!success) {
            revert SwapFailed();
        }

        // Get output balance
        amountOut = IERC20(params.tokenOut).balanceOf(address(this));
    }
}
