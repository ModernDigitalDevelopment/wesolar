// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SolarPanelRegistry
 * @notice On-chain registry for community-owned solar installations.
 *         Each panel is tokenized and tracked with production data,
 *         ownership shares, and energy credit allocation.
 * @dev Part of the WeSolar platform — a project of The Elevation Foundation (EIN 92-1042348).
 */
contract SolarPanelRegistry is Ownable, ReentrancyGuard {
    struct SolarPanel {
        uint256 panelId;
        string location;          // GPS coordinates or address hash
        uint256 capacityWatts;    // Panel capacity in watts
        uint256 installedAt;      // Unix timestamp of installation
        uint256 totalShares;      // Total ownership shares (default 100)
        uint256 energyProduced;   // Cumulative kWh produced (updated by oracle)
        bool isActive;
        address installer;
    }

    struct OwnershipShare {
        address owner;
        uint256 shares;           // Out of panel.totalShares
        uint256 energyCreditsClaimed;
    }

    uint256 public panelCount;
    mapping(uint256 => SolarPanel) public panels;
    mapping(uint256 => mapping(address => OwnershipShare)) public ownership;
    mapping(uint256 => address[]) public panelOwners;

    // Oracle address for updating energy production data
    address public energyOracle;

    event PanelRegistered(uint256 indexed panelId, string location, uint256 capacityWatts, address installer);
    event SharesAssigned(uint256 indexed panelId, address indexed owner, uint256 shares);
    event EnergyUpdated(uint256 indexed panelId, uint256 newTotalKwh);
    event EnergyCreditsClaimed(uint256 indexed panelId, address indexed owner, uint256 credits);

    modifier onlyOracle() {
        require(msg.sender == energyOracle, "SolarPanelRegistry: caller is not oracle");
        _;
    }

    constructor(address initialOwner, address _energyOracle) Ownable(initialOwner) {
        energyOracle = _energyOracle;
    }

    /**
     * @notice Register a new solar panel installation
     */
    function registerPanel(
        string calldata location,
        uint256 capacityWatts,
        uint256 totalShares
    ) external onlyOwner returns (uint256 panelId) {
        panelId = ++panelCount;
        panels[panelId] = SolarPanel({
            panelId: panelId,
            location: location,
            capacityWatts: capacityWatts,
            installedAt: block.timestamp,
            totalShares: totalShares,
            energyProduced: 0,
            isActive: true,
            installer: msg.sender
        });
        emit PanelRegistered(panelId, location, capacityWatts, msg.sender);
    }

    /**
     * @notice Assign ownership shares to a community member
     */
    function assignShares(uint256 panelId, address owner, uint256 shares) external onlyOwner {
        SolarPanel storage panel = panels[panelId];
        require(panel.isActive, "SolarPanelRegistry: panel not active");
        
        uint256 currentTotal = _totalSharesAssigned(panelId);
        require(currentTotal + shares <= panel.totalShares, "SolarPanelRegistry: exceeds total shares");

        if (ownership[panelId][owner].shares == 0) {
            panelOwners[panelId].push(owner);
        }
        ownership[panelId][owner].shares += shares;
        ownership[panelId][owner].owner = owner;
        
        emit SharesAssigned(panelId, owner, shares);
    }

    /**
     * @notice Update energy production data (called by oracle)
     */
    function updateEnergyProduction(uint256 panelId, uint256 totalKwh) external onlyOracle {
        require(panels[panelId].isActive, "SolarPanelRegistry: panel not active");
        panels[panelId].energyProduced = totalKwh;
        emit EnergyUpdated(panelId, totalKwh);
    }

    /**
     * @notice Calculate unclaimed energy credits for an owner
     */
    function getUnclaimedCredits(uint256 panelId, address owner) public view returns (uint256) {
        SolarPanel storage panel = panels[panelId];
        OwnershipShare storage share = ownership[panelId][owner];
        if (share.shares == 0 || panel.totalShares == 0) return 0;
        
        uint256 totalCredits = (panel.energyProduced * share.shares) / panel.totalShares;
        return totalCredits - share.energyCreditsClaimed;
    }

    /**
     * @notice Claim accumulated energy credits
     */
    function claimEnergyCredits(uint256 panelId) external nonReentrant {
        uint256 credits = getUnclaimedCredits(panelId, msg.sender);
        require(credits > 0, "SolarPanelRegistry: no credits to claim");
        
        ownership[panelId][msg.sender].energyCreditsClaimed += credits;
        emit EnergyCreditsClaimed(panelId, msg.sender, credits);
        // In production: transfer WST tokens or energy credit NFTs here
    }

    /**
     * @notice Update the oracle address
     */
    function setEnergyOracle(address newOracle) external onlyOwner {
        energyOracle = newOracle;
    }

    function _totalSharesAssigned(uint256 panelId) internal view returns (uint256 total) {
        address[] storage owners = panelOwners[panelId];
        for (uint256 i = 0; i < owners.length; i++) {
            total += ownership[panelId][owners[i]].shares;
        }
    }

    function getPanelOwners(uint256 panelId) external view returns (address[] memory) {
        return panelOwners[panelId];
    }
}
