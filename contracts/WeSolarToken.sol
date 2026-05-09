// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title WeSolarToken (WST)
 * @notice Governance and utility token for the WeSolar community solar platform.
 *         Token holders co-own solar infrastructure, earn energy credits, and
 *         vote on expansion decisions — all governed by smart contracts.
 * @dev Built on OpenZeppelin v5. Deployed on Base Sepolia testnet.
 *      Part of The Elevation Foundation ecosystem (EIN 92-1042348).
 */
contract WeSolarToken is ERC20, ERC20Burnable, Ownable, ERC20Permit, ERC20Votes {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18; // 100M WST

    event TokensMinted(address indexed to, uint256 amount);
    event EnergyCreditsAllocated(address indexed recipient, uint256 credits);

    constructor(address initialOwner)
        ERC20("WeSolar Token", "WST")
        Ownable(initialOwner)
        ERC20Permit("WeSolar Token")
    {
        // Mint initial supply to owner for distribution
        _mint(initialOwner, 10_000_000 * 10 ** 18); // 10M initial supply
    }

    /**
     * @notice Mint new WST tokens (governance-controlled)
     * @param to Recipient address
     * @param amount Amount to mint (in wei)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "WeSolar: max supply exceeded");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    // Required overrides for ERC20Votes
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
