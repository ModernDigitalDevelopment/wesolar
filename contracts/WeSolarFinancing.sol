// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title WeSolarFinancing
 * @notice Peer-to-peer solar installation financing via smart contracts.
 *         Community members can fund solar installations for neighbors,
 *         earning repayment through energy savings over time.
 *         
 *         This implements the core WeSolar whitepaper concept:
 *         "Share peer-to-peer solar installation financing dApp"
 *
 * @dev Part of the WeSolar platform — a project of The Elevation Foundation (EIN 92-1042348).
 *      Designed for Celo Climate Collective grant application.
 */
contract WeSolarFinancing is Ownable, ReentrancyGuard {
    IERC20 public wstToken;

    enum LoanStatus { Pending, Active, Repaid, Defaulted }

    struct SolarLoan {
        uint256 loanId;
        address borrower;         // Homeowner receiving solar installation
        address lender;           // Community member funding the installation
        uint256 principal;        // Loan amount in WST tokens
        uint256 interestRateBps;  // Annual interest rate in basis points (e.g., 500 = 5%)
        uint256 termMonths;       // Loan term in months
        uint256 monthlyPayment;   // Calculated monthly payment in WST
        uint256 startTime;        // Unix timestamp when loan became active
        uint256 totalRepaid;      // Total WST repaid so far
        LoanStatus status;
        string installationId;    // Reference to SolarPanelRegistry panel ID
    }

    uint256 public loanCount;
    mapping(uint256 => SolarLoan) public loans;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(address => uint256[]) public lenderLoans;

    event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 principal, uint256 termMonths);
    event LoanFunded(uint256 indexed loanId, address indexed lender, uint256 amount);
    event PaymentMade(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 totalRepaid);
    event LoanRepaid(uint256 indexed loanId);
    event LoanDefaulted(uint256 indexed loanId);

    constructor(address initialOwner, address _wstToken) Ownable(initialOwner) {
        wstToken = IERC20(_wstToken);
    }

    /**
     * @notice Homeowner requests a solar installation loan
     */
    function requestLoan(
        uint256 principal,
        uint256 interestRateBps,
        uint256 termMonths,
        string calldata installationId
    ) external returns (uint256 loanId) {
        require(principal > 0, "WeSolarFinancing: invalid principal");
        require(termMonths > 0 && termMonths <= 360, "WeSolarFinancing: invalid term");
        
        loanId = ++loanCount;
        
        // Calculate monthly payment using simple interest approximation
        uint256 totalInterest = (principal * interestRateBps * termMonths) / (10000 * 12);
        uint256 monthlyPayment = (principal + totalInterest) / termMonths;
        
        loans[loanId] = SolarLoan({
            loanId: loanId,
            borrower: msg.sender,
            lender: address(0),
            principal: principal,
            interestRateBps: interestRateBps,
            termMonths: termMonths,
            monthlyPayment: monthlyPayment,
            startTime: 0,
            totalRepaid: 0,
            status: LoanStatus.Pending,
            installationId: installationId
        });
        
        borrowerLoans[msg.sender].push(loanId);
        emit LoanRequested(loanId, msg.sender, principal, termMonths);
    }

    /**
     * @notice Community member funds a pending loan
     */
    function fundLoan(uint256 loanId) external nonReentrant {
        SolarLoan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Pending, "WeSolarFinancing: loan not pending");
        require(loan.lender == address(0), "WeSolarFinancing: already funded");
        require(msg.sender != loan.borrower, "WeSolarFinancing: cannot self-fund");
        
        // Transfer WST from lender to borrower
        require(wstToken.transferFrom(msg.sender, loan.borrower, loan.principal), 
            "WeSolarFinancing: transfer failed");
        
        loan.lender = msg.sender;
        loan.startTime = block.timestamp;
        loan.status = LoanStatus.Active;
        lenderLoans[msg.sender].push(loanId);
        
        emit LoanFunded(loanId, msg.sender, loan.principal);
    }

    /**
     * @notice Borrower makes a monthly repayment
     */
    function makePayment(uint256 loanId, uint256 amount) external nonReentrant {
        SolarLoan storage loan = loans[loanId];
        require(loan.status == LoanStatus.Active, "WeSolarFinancing: loan not active");
        require(msg.sender == loan.borrower, "WeSolarFinancing: not borrower");
        require(amount > 0, "WeSolarFinancing: invalid amount");
        
        require(wstToken.transferFrom(msg.sender, loan.lender, amount),
            "WeSolarFinancing: transfer failed");
        
        loan.totalRepaid += amount;
        
        // Calculate total owed
        uint256 totalInterest = (loan.principal * loan.interestRateBps * loan.termMonths) / (10000 * 12);
        uint256 totalOwed = loan.principal + totalInterest;
        
        emit PaymentMade(loanId, msg.sender, amount, loan.totalRepaid);
        
        if (loan.totalRepaid >= totalOwed) {
            loan.status = LoanStatus.Repaid;
            emit LoanRepaid(loanId);
        }
    }

    /**
     * @notice Mark a loan as defaulted (governance action)
     */
    function markDefault(uint256 loanId) external onlyOwner {
        require(loans[loanId].status == LoanStatus.Active, "WeSolarFinancing: loan not active");
        loans[loanId].status = LoanStatus.Defaulted;
        emit LoanDefaulted(loanId);
    }

    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }

    function getLenderLoans(address lender) external view returns (uint256[] memory) {
        return lenderLoans[lender];
    }
}
