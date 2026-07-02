// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title WeSolarFinancing
 * @notice Peer-to-peer solar installation financing for underserved communities.
 *         Loans are denominated in a stablecoin (cUSD on Celo) to protect
 *         low-income borrowers from token price volatility.
 *
 * @dev Key design decisions:
 *      - Uses cUSD (or any ERC-20 stablecoin) instead of WST to eliminate
 *        volatility risk for borrowers.
 *      - Monthly payment calculated using standard amortization formula:
 *        M = P * [r(1+r)^n] / [(1+r)^n - 1]
 *        where P = principal, r = monthly rate, n = term in months.
 *      - Uses SafeERC20 for all token transfers.
 *      - Part of The Elevation Foundation ecosystem (EIN 92-1042348).
 *      - Designed for Celo Climate Collective grant application.
 */
contract WeSolarFinancing is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice The stablecoin used for all loans (cUSD on Celo mainnet)
    IERC20 public immutable stablecoin;

    enum LoanStatus { Pending, Active, Repaid, Defaulted }

    struct SolarLoan {
        uint256 loanId;
        address borrower;           // Homeowner receiving solar installation
        address lender;             // Community member funding the installation
        uint256 principal;          // Loan amount in stablecoin (18 decimals)
        uint256 interestRateBps;    // Annual interest rate in basis points (e.g., 500 = 5%)
        uint256 termMonths;         // Loan term in months
        uint256 monthlyPayment;     // Calculated monthly payment (amortized)
        uint256 startTime;          // Unix timestamp when loan became active
        uint256 totalRepaid;        // Total stablecoin repaid so far
        LoanStatus status;
        string installationId;      // Reference to SolarPanelRegistry panel ID
    }

    uint256 public loanCount;
    mapping(uint256 => SolarLoan) public loans;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(address => uint256[]) public lenderLoans;

    // Precision factor for amortization calculation (avoids integer division loss)
    uint256 private constant PRECISION = 1e18;

    event LoanRequested(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 principal,
        uint256 termMonths,
        uint256 monthlyPayment
    );
    event LoanFunded(uint256 indexed loanId, address indexed lender, uint256 amount);
    event PaymentMade(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 totalRepaid,
        uint256 remainingBalance
    );
    event LoanRepaid(uint256 indexed loanId);
    event LoanDefaulted(uint256 indexed loanId);

    constructor(address initialOwner, address _stablecoin) Ownable(initialOwner) {
        require(_stablecoin != address(0), "WeSolarFinancing: invalid stablecoin address");
        stablecoin = IERC20(_stablecoin);
    }

    /**
     * @notice Calculate the monthly amortized payment.
     * @dev Uses the standard amortization formula:
     *      M = P * [r(1+r)^n] / [(1+r)^n - 1]
     *      For zero-interest loans: M = ceil(P / n)
     * @param principal      Loan amount in stablecoin base units
     * @param annualRateBps  Annual interest rate in basis points (500 = 5%)
     * @param termMonths     Loan term in months
     * @return monthly       Monthly payment amount in stablecoin base units
     */
    function calculateMonthlyPayment(
        uint256 principal,
        uint256 annualRateBps,
        uint256 termMonths
    ) public pure returns (uint256 monthly) {
        require(termMonths > 0, "WeSolarFinancing: term must be > 0");
        require(principal > 0, "WeSolarFinancing: principal must be > 0");

        // Zero-interest loan: ceiling division to ensure full repayment
        if (annualRateBps == 0) {
            return (principal + termMonths - 1) / termMonths;
        }

        // Monthly rate scaled by PRECISION: r = annualRateBps / (10000 * 12)
        uint256 monthlyRateScaled = (annualRateBps * PRECISION) / (10000 * 12);

        // Compute (1 + r)^n using iterative multiplication with PRECISION
        uint256 compoundFactor = PRECISION; // starts at 1.0 scaled
        for (uint256 i = 0; i < termMonths; i++) {
            compoundFactor = (compoundFactor * (PRECISION + monthlyRateScaled)) / PRECISION;
        }

        // M = P * r * (1+r)^n / ((1+r)^n - 1)
        // numerator   = principal * monthlyRateScaled * compoundFactor
        // denominator = (compoundFactor - PRECISION) * PRECISION
        uint256 numerator = principal * monthlyRateScaled * compoundFactor;
        uint256 denominator = (compoundFactor - PRECISION) * PRECISION;

        // Ceiling division to ensure full repayment
        monthly = (numerator + denominator - 1) / denominator;
    }

    /**
     * @notice Homeowner requests a solar installation loan.
     * @param principal       Loan amount in stablecoin base units (e.g., 1000e18 = 1000 cUSD)
     * @param interestRateBps Annual interest rate in basis points (0 = interest-free)
     * @param termMonths      Loan term (1-360 months)
     * @param installationId  Reference ID linking to a SolarPanelRegistry entry
     */
    function requestLoan(
        uint256 principal,
        uint256 interestRateBps,
        uint256 termMonths,
        string calldata installationId
    ) external returns (uint256 loanId) {
        require(principal > 0, "WeSolarFinancing: invalid principal");
        require(termMonths > 0 && termMonths <= 360, "WeSolarFinancing: invalid term");
        require(interestRateBps <= 5000, "WeSolarFinancing: rate exceeds 50% annual cap");

        uint256 monthly = calculateMonthlyPayment(principal, interestRateBps, termMonths);

        loanId = ++loanCount;
        loans[loanId] = SolarLoan({
            loanId: loanId,
            borrower: msg.sender,
            lender: address(0),
            principal: principal,
            interestRateBps: interestRateBps,
            termMonths: termMonths,
            monthlyPayment: monthly,
            startTime: 0,
            totalRepaid: 0,
            status: LoanStatus.Pending,
            installationId: installationId
        });

        borrowerLoans[msg.sender].push(loanId);
        emit LoanRequested(loanId, msg.sender, principal, termMonths, monthly);
    }

    /**
     * @notice Community member funds a pending loan.
     *         Transfers `principal` stablecoin from lender to borrower.
     * @param loanId  The loan to fund
     */
    function fundLoan(uint256 loanId) external nonReentrant {
        SolarLoan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Pending, "WeSolarFinancing: loan not pending");
        require(loan.lender == address(0), "WeSolarFinancing: already funded");
        require(msg.sender != loan.borrower, "WeSolarFinancing: cannot self-fund");

        loan.lender = msg.sender;
        loan.startTime = block.timestamp;
        loan.status = LoanStatus.Active;
        lenderLoans[msg.sender].push(loanId);

        // Transfer stablecoin from lender directly to borrower
        stablecoin.safeTransferFrom(msg.sender, loan.borrower, loan.principal);

        emit LoanFunded(loanId, msg.sender, loan.principal);
    }

    /**
     * @notice Borrower makes a repayment installment.
     *         Any amount is accepted; loan is marked Repaid when totalRepaid
     *         reaches or exceeds the total amount owed.
     * @param loanId  The loan to repay
     * @param amount  Amount of stablecoin to pay (in base units)
     */
    function makePayment(uint256 loanId, uint256 amount) external nonReentrant {
        SolarLoan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "WeSolarFinancing: loan not active");
        require(msg.sender == loan.borrower, "WeSolarFinancing: not borrower");
        require(amount > 0, "WeSolarFinancing: invalid amount");

        uint256 totalOwed = _totalOwed(loan);
        uint256 remaining = totalOwed > loan.totalRepaid ? totalOwed - loan.totalRepaid : 0;

        // Cap payment at remaining balance to prevent overpayment
        uint256 actualPayment = amount > remaining ? remaining : amount;
        require(actualPayment > 0, "WeSolarFinancing: loan already fully repaid");

        loan.totalRepaid += actualPayment;

        // Transfer stablecoin from borrower to lender
        stablecoin.safeTransferFrom(msg.sender, loan.lender, actualPayment);

        uint256 newRemaining = totalOwed > loan.totalRepaid ? totalOwed - loan.totalRepaid : 0;
        emit PaymentMade(loanId, msg.sender, actualPayment, loan.totalRepaid, newRemaining);

        if (loan.totalRepaid >= totalOwed) {
            loan.status = LoanStatus.Repaid;
            emit LoanRepaid(loanId);
        }
    }

    /**
     * @notice Mark a loan as defaulted (governance/owner action).
     * @param loanId  The loan to mark as defaulted
     */
    function markDefault(uint256 loanId) external onlyOwner {
        require(loans[loanId].status == LoanStatus.Active, "WeSolarFinancing: loan not active");
        loans[loanId].status = LoanStatus.Defaulted;
        emit LoanDefaulted(loanId);
    }

    /**
     * @notice Returns the total amount owed for a loan (monthlyPayment * termMonths).
     */
    function getTotalOwed(uint256 loanId) external view returns (uint256) {
        return _totalOwed(loans[loanId]);
    }

    /**
     * @notice Returns the remaining balance on a loan.
     */
    function getRemainingBalance(uint256 loanId) external view returns (uint256) {
        SolarLoan storage loan = loans[loanId];
        uint256 owed = _totalOwed(loan);
        return owed > loan.totalRepaid ? owed - loan.totalRepaid : 0;
    }

    /**
     * @notice Returns all loan IDs for a borrower.
     */
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }

    /**
     * @notice Returns all loan IDs for a lender.
     */
    function getLenderLoans(address lender) external view returns (uint256[] memory) {
        return lenderLoans[lender];
    }

    // ─── Internal helpers ───────────────────────────────────────────────────────

    /**
     * @dev Total amount owed = monthlyPayment * termMonths.
     *      This is consistent with the amortization formula where the sum of
     *      all monthly payments equals principal + total interest.
     */
    function _totalOwed(SolarLoan storage loan) internal view returns (uint256) {
        return loan.monthlyPayment * loan.termMonths;
    }
}
