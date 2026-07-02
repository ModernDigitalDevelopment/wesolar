const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WeSolarFinancing", function () {
  let financing;
  let mockCUSD;
  let owner, borrower, lender, stranger;

  const PRINCIPAL = ethers.parseEther("1000"); // 1,000 cUSD
  const RATE_BPS = 500n; // 5% annual
  const TERM_MONTHS = 12n; // 12 months
  const INSTALL_ID = "panel-001";

  beforeEach(async function () {
    [owner, borrower, lender, stranger] = await ethers.getSigners();

    // Deploy mock cUSD stablecoin
    const MockCUSD = await ethers.getContractFactory("MockCUSD");
    mockCUSD = await MockCUSD.deploy();
    await mockCUSD.waitForDeployment();

    // Deploy WeSolarFinancing with mock cUSD
    const WeSolarFinancing = await ethers.getContractFactory("WeSolarFinancing");
    financing = await WeSolarFinancing.deploy(owner.address, await mockCUSD.getAddress());
    await financing.waitForDeployment();

    // Fund lender with cUSD
    await mockCUSD.mint(lender.address, ethers.parseEther("100000"));
    // Fund borrower with cUSD for repayments
    await mockCUSD.mint(borrower.address, ethers.parseEther("10000"));
  });

  // ─── Deployment ─────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("should set the stablecoin address correctly", async function () {
      expect(await financing.stablecoin()).to.equal(await mockCUSD.getAddress());
    });

    it("should set the owner correctly", async function () {
      expect(await financing.owner()).to.equal(owner.address);
    });

    it("should start with zero loans", async function () {
      expect(await financing.loanCount()).to.equal(0n);
    });

    it("should revert if stablecoin address is zero", async function () {
      const WeSolarFinancing = await ethers.getContractFactory("WeSolarFinancing");
      await expect(
        WeSolarFinancing.deploy(owner.address, ethers.ZeroAddress)
      ).to.be.revertedWith("WeSolarFinancing: invalid stablecoin address");
    });
  });

  // ─── calculateMonthlyPayment ─────────────────────────────────────────────────
  describe("calculateMonthlyPayment", function () {
    it("should return principal/term for zero-interest loans", async function () {
      const monthly = await financing.calculateMonthlyPayment(
        ethers.parseEther("1200"),
        0,
        12
      );
      expect(monthly).to.equal(ethers.parseEther("100"));
    });

    it("should return correct amortized payment for 5% annual rate", async function () {
      // 1000 cUSD, 5% annual, 12 months
      // Expected monthly ≈ 85.61 cUSD (standard amortization)
      const monthly = await financing.calculateMonthlyPayment(PRINCIPAL, RATE_BPS, TERM_MONTHS);
      // Allow ±0.1 cUSD tolerance for integer math
      const expected = ethers.parseEther("85.61");
      const tolerance = ethers.parseEther("0.1");
      expect(monthly).to.be.closeTo(expected, tolerance);
    });

    it("should return higher monthly payment for higher interest rate", async function () {
      const low = await financing.calculateMonthlyPayment(PRINCIPAL, 300n, TERM_MONTHS);
      const high = await financing.calculateMonthlyPayment(PRINCIPAL, 1000n, TERM_MONTHS);
      expect(high).to.be.gt(low);
    });

    it("should revert if term is zero", async function () {
      await expect(
        financing.calculateMonthlyPayment(PRINCIPAL, RATE_BPS, 0)
      ).to.be.revertedWith("WeSolarFinancing: term must be > 0");
    });

    it("should revert if principal is zero", async function () {
      await expect(
        financing.calculateMonthlyPayment(0, RATE_BPS, TERM_MONTHS)
      ).to.be.revertedWith("WeSolarFinancing: principal must be > 0");
    });

    it("should handle ceiling division for zero-interest non-divisible amounts", async function () {
      // 1001 cUSD / 12 months = 83.41... → should ceil to ensure full repayment
      const monthly = await financing.calculateMonthlyPayment(
        ethers.parseEther("1001"),
        0,
        12
      );
      const totalPaid = monthly * 12n;
      expect(totalPaid).to.be.gte(ethers.parseEther("1001"));
    });
  });

  // ─── requestLoan ─────────────────────────────────────────────────────────────
  describe("requestLoan", function () {
    it("should create a loan and emit LoanRequested", async function () {
      const monthly = await financing.calculateMonthlyPayment(PRINCIPAL, RATE_BPS, TERM_MONTHS);
      await expect(
        financing.connect(borrower).requestLoan(PRINCIPAL, RATE_BPS, TERM_MONTHS, INSTALL_ID)
      )
        .to.emit(financing, "LoanRequested")
        .withArgs(1n, borrower.address, PRINCIPAL, TERM_MONTHS, monthly);
    });

    it("should store loan data correctly", async function () {
      await financing.connect(borrower).requestLoan(PRINCIPAL, RATE_BPS, TERM_MONTHS, INSTALL_ID);
      const loan = await financing.loans(1);
      expect(loan.borrower).to.equal(borrower.address);
      expect(loan.principal).to.equal(PRINCIPAL);
      expect(loan.interestRateBps).to.equal(RATE_BPS);
      expect(loan.termMonths).to.equal(TERM_MONTHS);
      expect(loan.status).to.equal(0n); // Pending
      expect(loan.installationId).to.equal(INSTALL_ID);
    });

    it("should track borrower loans", async function () {
      await financing.connect(borrower).requestLoan(PRINCIPAL, RATE_BPS, TERM_MONTHS, INSTALL_ID);
      const loans = await financing.getBorrowerLoans(borrower.address);
      expect(loans.length).to.equal(1);
      expect(loans[0]).to.equal(1n);
    });

    it("should revert if principal is zero", async function () {
      await expect(
        financing.connect(borrower).requestLoan(0, RATE_BPS, TERM_MONTHS, INSTALL_ID)
      ).to.be.revertedWith("WeSolarFinancing: invalid principal");
    });

    it("should revert if term is zero", async function () {
      await expect(
        financing.connect(borrower).requestLoan(PRINCIPAL, RATE_BPS, 0, INSTALL_ID)
      ).to.be.revertedWith("WeSolarFinancing: invalid term");
    });

    it("should revert if term exceeds 360 months", async function () {
      await expect(
        financing.connect(borrower).requestLoan(PRINCIPAL, RATE_BPS, 361, INSTALL_ID)
      ).to.be.revertedWith("WeSolarFinancing: invalid term");
    });

    it("should revert if interest rate exceeds 50% annual cap", async function () {
      await expect(
        financing.connect(borrower).requestLoan(PRINCIPAL, 5001, TERM_MONTHS, INSTALL_ID)
      ).to.be.revertedWith("WeSolarFinancing: rate exceeds 50% annual cap");
    });
  });

  // ─── fundLoan ─────────────────────────────────────────────────────────────────
  describe("fundLoan", function () {
    beforeEach(async function () {
      await financing.connect(borrower).requestLoan(PRINCIPAL, RATE_BPS, TERM_MONTHS, INSTALL_ID);
      await mockCUSD.connect(lender).approve(await financing.getAddress(), PRINCIPAL);
    });

    it("should fund a loan and transfer cUSD to borrower", async function () {
      const borrowerBefore = await mockCUSD.balanceOf(borrower.address);
      await expect(financing.connect(lender).fundLoan(1))
        .to.emit(financing, "LoanFunded")
        .withArgs(1n, lender.address, PRINCIPAL);

      const borrowerAfter = await mockCUSD.balanceOf(borrower.address);
      expect(borrowerAfter - borrowerBefore).to.equal(PRINCIPAL);
    });

    it("should set loan status to Active after funding", async function () {
      await financing.connect(lender).fundLoan(1);
      const loan = await financing.loans(1);
      expect(loan.status).to.equal(1n); // Active
      expect(loan.lender).to.equal(lender.address);
    });

    it("should track lender loans", async function () {
      await financing.connect(lender).fundLoan(1);
      const loans = await financing.getLenderLoans(lender.address);
      expect(loans.length).to.equal(1);
      expect(loans[0]).to.equal(1n);
    });

    it("should revert if loan is not pending", async function () {
      await financing.connect(lender).fundLoan(1);
      await mockCUSD.connect(stranger).approve(await financing.getAddress(), PRINCIPAL);
      await mockCUSD.mint(stranger.address, PRINCIPAL);
      await expect(
        financing.connect(stranger).fundLoan(1)
      ).to.be.revertedWith("WeSolarFinancing: loan not pending");
    });

    it("should revert if borrower tries to self-fund", async function () {
      await mockCUSD.connect(borrower).approve(await financing.getAddress(), PRINCIPAL);
      await expect(
        financing.connect(borrower).fundLoan(1)
      ).to.be.revertedWith("WeSolarFinancing: cannot self-fund");
    });
  });

  // ─── makePayment ──────────────────────────────────────────────────────────────
  describe("makePayment", function () {
    let monthly;

    beforeEach(async function () {
      await financing.connect(borrower).requestLoan(PRINCIPAL, RATE_BPS, TERM_MONTHS, INSTALL_ID);
      await mockCUSD.connect(lender).approve(await financing.getAddress(), PRINCIPAL);
      await financing.connect(lender).fundLoan(1);
      monthly = (await financing.loans(1)).monthlyPayment;
      // Approve enough for full repayment
      await mockCUSD.connect(borrower).approve(await financing.getAddress(), monthly * TERM_MONTHS);
    });

    it("should accept a payment and emit PaymentMade", async function () {
      const totalOwed = await financing.getTotalOwed(1);
      const remaining = totalOwed - monthly;
      await expect(financing.connect(borrower).makePayment(1, monthly))
        .to.emit(financing, "PaymentMade")
        .withArgs(1n, borrower.address, monthly, monthly, remaining);
    });

    it("should transfer cUSD from borrower to lender", async function () {
      const lenderBefore = await mockCUSD.balanceOf(lender.address);
      await financing.connect(borrower).makePayment(1, monthly);
      const lenderAfter = await mockCUSD.balanceOf(lender.address);
      expect(lenderAfter - lenderBefore).to.equal(monthly);
    });

    it("should mark loan as Repaid after full repayment", async function () {
      for (let i = 0; i < 12; i++) {
        await financing.connect(borrower).makePayment(1, monthly);
      }
      const loan = await financing.loans(1);
      expect(loan.status).to.equal(2n); // Repaid
    });

    it("should emit LoanRepaid on final payment", async function () {
      for (let i = 0; i < 11; i++) {
        await financing.connect(borrower).makePayment(1, monthly);
      }
      await expect(financing.connect(borrower).makePayment(1, monthly))
        .to.emit(financing, "LoanRepaid")
        .withArgs(1n);
    });

    it("should cap payment at remaining balance (no overpayment)", async function () {
      // Pay all but 1 wei, then try to overpay
      const totalOwed = await financing.getTotalOwed(1);
      const almostAll = totalOwed - 1n;
      await mockCUSD.connect(borrower).approve(await financing.getAddress(), totalOwed * 2n);
      await financing.connect(borrower).makePayment(1, almostAll);

      // Final payment: send 1000 cUSD but only 1 wei should be taken
      const lenderBefore = await mockCUSD.balanceOf(lender.address);
      await financing.connect(borrower).makePayment(1, ethers.parseEther("1000"));
      const lenderAfter = await mockCUSD.balanceOf(lender.address);
      expect(lenderAfter - lenderBefore).to.equal(1n); // only 1 wei taken
    });

    it("should revert if non-borrower tries to make payment", async function () {
      await expect(
        financing.connect(stranger).makePayment(1, monthly)
      ).to.be.revertedWith("WeSolarFinancing: not borrower");
    });

    it("should revert if loan is not active", async function () {
      await expect(
        financing.connect(borrower).makePayment(99, monthly)
      ).to.be.revertedWith("WeSolarFinancing: loan not active");
    });

    it("should revert if amount is zero", async function () {
      await expect(
        financing.connect(borrower).makePayment(1, 0)
      ).to.be.revertedWith("WeSolarFinancing: invalid amount");
    });
  });

  // ─── markDefault ─────────────────────────────────────────────────────────────
  describe("markDefault", function () {
    beforeEach(async function () {
      await financing.connect(borrower).requestLoan(PRINCIPAL, RATE_BPS, TERM_MONTHS, INSTALL_ID);
      await mockCUSD.connect(lender).approve(await financing.getAddress(), PRINCIPAL);
      await financing.connect(lender).fundLoan(1);
    });

    it("should allow owner to mark an active loan as defaulted", async function () {
      await expect(financing.connect(owner).markDefault(1))
        .to.emit(financing, "LoanDefaulted")
        .withArgs(1n);
      const loan = await financing.loans(1);
      expect(loan.status).to.equal(3n); // Defaulted
    });

    it("should revert if non-owner tries to mark default", async function () {
      await expect(
        financing.connect(stranger).markDefault(1)
      ).to.be.revertedWithCustomError(financing, "OwnableUnauthorizedAccount");
    });

    it("should revert if loan is not active", async function () {
      await expect(
        financing.connect(owner).markDefault(99)
      ).to.be.revertedWith("WeSolarFinancing: loan not active");
    });
  });

  // ─── getRemainingBalance ──────────────────────────────────────────────────────
  describe("getRemainingBalance", function () {
    it("should return full amount owed before any payments", async function () {
      await financing.connect(borrower).requestLoan(PRINCIPAL, RATE_BPS, TERM_MONTHS, INSTALL_ID);
      await mockCUSD.connect(lender).approve(await financing.getAddress(), PRINCIPAL);
      await financing.connect(lender).fundLoan(1);

      const totalOwed = await financing.getTotalOwed(1);
      const remaining = await financing.getRemainingBalance(1);
      expect(remaining).to.equal(totalOwed);
    });

    it("should decrease after each payment", async function () {
      await financing.connect(borrower).requestLoan(PRINCIPAL, RATE_BPS, TERM_MONTHS, INSTALL_ID);
      await mockCUSD.connect(lender).approve(await financing.getAddress(), PRINCIPAL);
      await financing.connect(lender).fundLoan(1);

      const monthly = (await financing.loans(1)).monthlyPayment;
      await mockCUSD.connect(borrower).approve(await financing.getAddress(), monthly * 3n);

      const before = await financing.getRemainingBalance(1);
      await financing.connect(borrower).makePayment(1, monthly);
      const after = await financing.getRemainingBalance(1);
      expect(before - after).to.equal(monthly);
    });
  });
});
