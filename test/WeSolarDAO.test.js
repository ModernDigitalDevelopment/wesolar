const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("WeSolarDAO", function () {
  let token;
  let timelock;
  let dao;
  let owner, proposer, voter1, voter2, stranger;

  // DAO settings
  const VOTING_DELAY = 1n;       // 1 block
  const VOTING_PERIOD = 50400n;  // ~1 week
  const PROPOSAL_THRESHOLD = ethers.parseEther("1000"); // 1,000 WST
  const QUORUM_FRACTION = 4n;    // 4%
  const TIMELOCK_DELAY = 3600n;  // 1 hour in seconds

  beforeEach(async function () {
    [owner, proposer, voter1, voter2, stranger] = await ethers.getSigners();

    // Deploy WeSolarToken
    const WeSolarToken = await ethers.getContractFactory("WeSolarToken");
    token = await WeSolarToken.deploy(owner.address);
    await token.waitForDeployment();

    // Deploy TimelockController
    const TimelockController = await ethers.getContractFactory("TimelockController");
    timelock = await TimelockController.deploy(
      TIMELOCK_DELAY,
      [], // proposers (will be set to DAO)
      [], // executors (will be set to DAO)
      owner.address // admin
    );
    await timelock.waitForDeployment();

    // Deploy WeSolarDAO
    const WeSolarDAO = await ethers.getContractFactory("WeSolarDAO");
    dao = await WeSolarDAO.deploy(await token.getAddress(), await timelock.getAddress());
    await dao.waitForDeployment();

    // Grant DAO roles on timelock
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
    await timelock.connect(owner).grantRole(PROPOSER_ROLE, await dao.getAddress());
    await timelock.connect(owner).grantRole(EXECUTOR_ROLE, await dao.getAddress());
    await timelock.connect(owner).grantRole(CANCELLER_ROLE, await dao.getAddress());

    // Distribute tokens: proposer needs 1,000+ WST to propose
    await token.connect(owner).transfer(proposer.address, ethers.parseEther("5000"));
    await token.connect(owner).transfer(voter1.address, ethers.parseEther("2000000")); // 2M WST (large voter)
    await token.connect(owner).transfer(voter2.address, ethers.parseEther("1000000")); // 1M WST

    // Delegate voting power (required for ERC20Votes)
    await token.connect(proposer).delegate(proposer.address);
    await token.connect(voter1).delegate(voter1.address);
    await token.connect(voter2).delegate(voter2.address);
    await token.connect(owner).delegate(owner.address);

    // Mine a block so delegation takes effect
    await mine(1);
  });

  // ─── Deployment & Settings ────────────────────────────────────────────────────
  describe("Deployment & Settings", function () {
    it("should set the correct name", async function () {
      expect(await dao.name()).to.equal("WeSolarDAO");
    });

    it("should set the correct voting delay", async function () {
      expect(await dao.votingDelay()).to.equal(VOTING_DELAY);
    });

    it("should set the correct voting period", async function () {
      expect(await dao.votingPeriod()).to.equal(VOTING_PERIOD);
    });

    it("should set the correct proposal threshold", async function () {
      expect(await dao.proposalThreshold()).to.equal(PROPOSAL_THRESHOLD);
    });

    it("should have 4% quorum fraction", async function () {
      // quorumNumerator() returns the fraction (4)
      expect(await dao.quorumNumerator()).to.equal(QUORUM_FRACTION);
    });
  });

  // ─── Proposal Threshold ───────────────────────────────────────────────────────
  describe("Proposal threshold enforcement", function () {
    it("should revert if proposer has insufficient tokens", async function () {
      // stranger has 0 WST
      await expect(
        dao.connect(stranger).propose(
          [ethers.ZeroAddress],
          [0],
          ["0x"],
          "Test proposal"
        )
      ).to.be.revertedWithCustomError(dao, "GovernorInsufficientProposerVotes");
    });

    it("should allow proposal from address with enough tokens", async function () {
      // proposer has 5,000 WST > 1,000 threshold
      await expect(
        dao.connect(proposer).propose(
          [ethers.ZeroAddress],
          [0],
          ["0x"],
          "Test proposal: approve new solar installation"
        )
      ).to.not.be.reverted;
    });
  });

  // ─── Full Governance Lifecycle ────────────────────────────────────────────────
  describe("Full governance lifecycle", function () {
    let proposalId;
    const description = "Proposal: approve solar installation at 123 Main St";

    beforeEach(async function () {
      // Create a proposal
      const tx = await dao.connect(proposer).propose(
        [ethers.ZeroAddress],
        [0],
        ["0x"],
        description
      );
      const receipt = await tx.wait();
      // Extract proposalId from ProposalCreated event
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "ProposalCreated"
      );
      proposalId = event.args[0];
    });

    it("should create a proposal in Pending state", async function () {
      // State 0 = Pending
      expect(await dao.state(proposalId)).to.equal(0n);
    });

    it("should transition to Active after voting delay", async function () {
      await mine(Number(VOTING_DELAY) + 1);
      // State 1 = Active
      expect(await dao.state(proposalId)).to.equal(1n);
    });

    it("should allow voting For, Against, and Abstain", async function () {
      await mine(Number(VOTING_DELAY) + 1);
      // 0 = Against, 1 = For, 2 = Abstain
      await expect(dao.connect(voter1).castVote(proposalId, 1)).to.not.be.reverted;
      await expect(dao.connect(voter2).castVote(proposalId, 0)).to.not.be.reverted;
    });

    it("should succeed if quorum is met and For votes win", async function () {
      await mine(Number(VOTING_DELAY) + 1);
      // voter1 has 2M WST — well above 4% quorum of ~10M total supply
      await dao.connect(voter1).castVote(proposalId, 1); // For
      await mine(Number(VOTING_PERIOD) + 1);
      // State 4 = Succeeded
      expect(await dao.state(proposalId)).to.equal(4n);
    });

    it("should be Defeated if Against votes win", async function () {
      await mine(Number(VOTING_DELAY) + 1);
      await dao.connect(voter1).castVote(proposalId, 0); // Against
      await dao.connect(voter2).castVote(proposalId, 0); // Against
      await mine(Number(VOTING_PERIOD) + 1);
      // State 3 = Defeated
      expect(await dao.state(proposalId)).to.equal(3n);
    });

    it("should prevent double voting", async function () {
      await mine(Number(VOTING_DELAY) + 1);
      await dao.connect(voter1).castVote(proposalId, 1);
      await expect(
        dao.connect(voter1).castVote(proposalId, 1)
      ).to.be.revertedWithCustomError(dao, "GovernorAlreadyCastVote");
    });
  });
});
