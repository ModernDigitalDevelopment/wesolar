const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SolarPanelRegistry", function () {
  let registry;
  let owner, oracle, alice, bob;

  beforeEach(async function () {
    [owner, oracle, alice, bob] = await ethers.getSigners();
    const SolarPanelRegistry = await ethers.getContractFactory("SolarPanelRegistry");
    registry = await SolarPanelRegistry.deploy(owner.address, oracle.address);
    await registry.waitForDeployment();
  });

  // ─── Deployment ─────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("should set the owner correctly", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("should set the energy oracle correctly", async function () {
      expect(await registry.energyOracle()).to.equal(oracle.address);
    });

    it("should start with zero panels", async function () {
      expect(await registry.panelCount()).to.equal(0n);
    });
  });

  // ─── Panel Registration ───────────────────────────────────────────────────────
  describe("registerPanel", function () {
    it("should allow owner to register a panel", async function () {
      await expect(registry.connect(owner).registerPanel("40.7128,-74.0060", 5000, 100))
        .to.emit(registry, "PanelRegistered")
        .withArgs(1n, "40.7128,-74.0060", 5000n, owner.address);

      expect(await registry.panelCount()).to.equal(1n);
    });

    it("should store panel data correctly", async function () {
      await registry.connect(owner).registerPanel("40.7128,-74.0060", 5000, 100);
      const panel = await registry.panels(1);
      expect(panel.panelId).to.equal(1n);
      expect(panel.location).to.equal("40.7128,-74.0060");
      expect(panel.capacityWatts).to.equal(5000n);
      expect(panel.totalShares).to.equal(100n);
      expect(panel.energyProduced).to.equal(0n);
      expect(panel.isActive).to.equal(true);
    });

    it("should revert if non-owner tries to register a panel", async function () {
      await expect(
        registry.connect(alice).registerPanel("40.7128,-74.0060", 5000, 100)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("should increment panelCount for each registration", async function () {
      await registry.connect(owner).registerPanel("loc1", 5000, 100);
      await registry.connect(owner).registerPanel("loc2", 3000, 50);
      expect(await registry.panelCount()).to.equal(2n);
    });
  });

  // ─── Share Assignment ─────────────────────────────────────────────────────────
  describe("assignShares", function () {
    beforeEach(async function () {
      await registry.connect(owner).registerPanel("40.7128,-74.0060", 5000, 100);
    });

    it("should allow owner to assign shares to a community member", async function () {
      await expect(registry.connect(owner).assignShares(1, alice.address, 30))
        .to.emit(registry, "SharesAssigned")
        .withArgs(1n, alice.address, 30n);

      const share = await registry.ownership(1, alice.address);
      expect(share.shares).to.equal(30n);
    });

    it("should allow multiple owners for the same panel", async function () {
      await registry.connect(owner).assignShares(1, alice.address, 50);
      await registry.connect(owner).assignShares(1, bob.address, 50);

      const aliceShare = await registry.ownership(1, alice.address);
      const bobShare = await registry.ownership(1, bob.address);
      expect(aliceShare.shares).to.equal(50n);
      expect(bobShare.shares).to.equal(50n);
    });

    it("should revert if shares exceed total panel shares", async function () {
      await registry.connect(owner).assignShares(1, alice.address, 60);
      await expect(
        registry.connect(owner).assignShares(1, bob.address, 50) // 60+50=110 > 100
      ).to.be.revertedWith("SolarPanelRegistry: exceeds total shares");
    });

    it("should revert if panel is not active", async function () {
      // There is no deactivate function yet; test with non-existent panel
      await expect(
        registry.connect(owner).assignShares(99, alice.address, 10)
      ).to.be.revertedWith("SolarPanelRegistry: panel not active");
    });

    it("should revert if non-owner tries to assign shares", async function () {
      await expect(
        registry.connect(alice).assignShares(1, alice.address, 10)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });

  // ─── Energy Production Updates ───────────────────────────────────────────────
  describe("updateEnergyProduction", function () {
    beforeEach(async function () {
      await registry.connect(owner).registerPanel("40.7128,-74.0060", 5000, 100);
    });

    it("should allow oracle to update energy production", async function () {
      await expect(registry.connect(oracle).updateEnergyProduction(1, 1000))
        .to.emit(registry, "EnergyUpdated")
        .withArgs(1n, 1000n);

      const panel = await registry.panels(1);
      expect(panel.energyProduced).to.equal(1000n);
    });

    it("should revert if non-oracle tries to update energy", async function () {
      await expect(
        registry.connect(alice).updateEnergyProduction(1, 1000)
      ).to.be.revertedWith("SolarPanelRegistry: caller is not oracle");
    });
  });

  // ─── Energy Credits ───────────────────────────────────────────────────────────
  describe("getUnclaimedCredits and claimEnergyCredits", function () {
    beforeEach(async function () {
      await registry.connect(owner).registerPanel("40.7128,-74.0060", 5000, 100);
      await registry.connect(owner).assignShares(1, alice.address, 25); // 25% ownership
      await registry.connect(oracle).updateEnergyProduction(1, 1000); // 1000 kWh produced
    });

    it("should calculate unclaimed credits proportionally", async function () {
      // Alice owns 25/100 shares → 25% of 1000 kWh = 250 credits
      const credits = await registry.getUnclaimedCredits(1, alice.address);
      expect(credits).to.equal(250n);
    });

    it("should return 0 credits for address with no shares", async function () {
      const credits = await registry.getUnclaimedCredits(1, bob.address);
      expect(credits).to.equal(0n);
    });

    it("should allow claiming energy credits", async function () {
      await expect(registry.connect(alice).claimEnergyCredits(1))
        .to.emit(registry, "EnergyCreditsClaimed")
        .withArgs(1n, alice.address, 250n);
    });

    it("should reduce unclaimed credits to 0 after claiming", async function () {
      await registry.connect(alice).claimEnergyCredits(1);
      const credits = await registry.getUnclaimedCredits(1, alice.address);
      expect(credits).to.equal(0n);
    });

    it("should accumulate new credits after additional energy production", async function () {
      await registry.connect(alice).claimEnergyCredits(1);
      // Oracle reports 500 more kWh (total 1500)
      await registry.connect(oracle).updateEnergyProduction(1, 1500);
      // Alice should now have 25% of 500 new kWh = 125 new credits
      const credits = await registry.getUnclaimedCredits(1, alice.address);
      expect(credits).to.equal(125n);
    });

    it("should revert if there are no credits to claim", async function () {
      await registry.connect(alice).claimEnergyCredits(1);
      await expect(
        registry.connect(alice).claimEnergyCredits(1)
      ).to.be.revertedWith("SolarPanelRegistry: no credits to claim");
    });
  });

  // ─── Oracle Management ────────────────────────────────────────────────────────
  describe("setEnergyOracle", function () {
    it("should allow owner to update the oracle address", async function () {
      await registry.connect(owner).setEnergyOracle(alice.address);
      expect(await registry.energyOracle()).to.equal(alice.address);
    });

    it("should revert if non-owner tries to update oracle", async function () {
      await expect(
        registry.connect(alice).setEnergyOracle(alice.address)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });

  // ─── View helpers ─────────────────────────────────────────────────────────────
  describe("getPanelOwners", function () {
    it("should return all owners for a panel", async function () {
      await registry.connect(owner).registerPanel("loc", 5000, 100);
      await registry.connect(owner).assignShares(1, alice.address, 40);
      await registry.connect(owner).assignShares(1, bob.address, 60);

      const owners = await registry.getPanelOwners(1);
      expect(owners).to.include(alice.address);
      expect(owners).to.include(bob.address);
    });
  });
});
