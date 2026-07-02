// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockCUSD
 * @notice A mock cUSD stablecoin for local Hardhat testing.
 *         Allows any address to mint tokens for test setup.
 */
contract MockCUSD is ERC20 {
    constructor() ERC20("Mock Celo Dollar", "cUSD") {}

    /// @notice Mint tokens to any address (test only)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
