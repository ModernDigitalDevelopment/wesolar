const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WeSolarToken", function () {
  let token;
  let owner, alice, bob;

  const MAX_SUPPLY = ethers.parseEther("100000000"); // 100M WST
  const INITIAL_SUPPLY = ethers.parseEther("10000000"); // 10M WST

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const WeSolarToken = await ethers.getContractFactory("WeSolarToken");
    token = await WeSolarToken.deploy(owner.address);
    await token.waitForDeployment();
  });

  // ─── Deployment ─────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("should set the correct name and symbol", async function () {
      expect(await token.name()).to.equal("WeSolar Token");
      expect(await token.symbol()).to.equal("WST");
    });

    it("should mint the initial supply to the owner", async function () {
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("should set the correct max supply constant", async function () {
      expect(await token.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });

    it("should set the owner correctly", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  // ─── Minting ─────────────────────────────────────────────────────────────────
  describe("Minting", function () {
    it("should allow the owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(token.connect(owner).mint(alice.address, mintAmount))
        .to.emit(token, "TokensMinted")
        .withArgs(alice.address, mintAmount);
      expect(await token.balanceOf(alice.address)).to.equal(mintAmount);
    });

    it("should revert if non-owner tries to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        token.connect(alice).mint(alice.address, mintAmount)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("should revert if minting would exceed max supply", async function () {
      // Already have 10M minted; try to mint 91M more (would hit 101M > 100M cap)
      const overMint = ethers.parseEther("91000000");
      await expect(
        token.connect(owner).mint(alice.address, overMint)
      ).to.be.revertedWith("WeSolar: max supply exceeded");
    });

    it("should allow minting exactly up to max supply", async function () {
      const remaining = MAX_SUPPLY - INITIAL_SUPPLY; // 90M
      await expect(token.connect(owner).mint(alice.address, remaining)).to.not.be.reverted;
      expect(await token.totalSupply()).to.equal(MAX_SUPPLY);
    });
  });

  // ─── ERC20 Standard Behaviour ────────────────────────────────────────────────
  describe("ERC20 transfers", function () {
    it("should transfer tokens between accounts", async function () {
      const amount = ethers.parseEther("500");
      await token.connect(owner).transfer(alice.address, amount);
      expect(await token.balanceOf(alice.address)).to.equal(amount);
    });

    it("should revert transfer if balance is insufficient", async function () {
      const amount = ethers.parseEther("1");
      await expect(
        token.connect(alice).transfer(bob.address, amount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("should handle approvals and transferFrom correctly", async function () {
      const amount = ethers.parseEther("200");
      await token.connect(owner).approve(alice.address, amount);
      expect(await token.allowance(owner.address, alice.address)).to.equal(amount);

      await token.connect(alice).transferFrom(owner.address, bob.address, amount);
      expect(await token.balanceOf(bob.address)).to.equal(amount);
    });
  });

  // ─── ERC20Votes (governance) ─────────────────────────────────────────────────
  describe("ERC20Votes governance", function () {
    it("should allow token holders to delegate voting power", async function () {
      await token.connect(owner).delegate(owner.address);
      const votes = await token.getVotes(owner.address);
      expect(votes).to.equal(INITIAL_SUPPLY);
    });

    it("should transfer voting power on delegation", async function () {
      await token.connect(owner).delegate(alice.address);
      expect(await token.getVotes(alice.address)).to.equal(INITIAL_SUPPLY);
      expect(await token.getVotes(owner.address)).to.equal(0n);
    });

    it("should update votes on token transfer after delegation", async function () {
      const amount = ethers.parseEther("1000");
      await token.connect(owner).delegate(owner.address);
      await token.connect(owner).transfer(alice.address, amount);
      // Owner's votes should decrease
      expect(await token.getVotes(owner.address)).to.equal(INITIAL_SUPPLY - amount);
    });
  });
});
