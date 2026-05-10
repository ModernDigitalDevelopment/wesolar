# Security Policy — WeSolar

WeSolar smart contracts govern real community assets: fractional solar panel ownership, energy credits, and governance votes. Security is not optional — it is foundational to our mission of economic empowerment.

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` branch | ✅ Active |
| Tagged releases | ✅ Active |
| Older branches | ❌ Not supported |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in WeSolar smart contracts or supporting infrastructure, please report it responsibly:

1. **Email:** [security@elevation.foundation](mailto:security@elevation.foundation)
2. **Subject line:** `[SECURITY] WeSolar — Brief description`
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce or proof-of-concept
   - Potential impact assessment
   - Any suggested mitigations

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 5 business days
- **Resolution target:** Within 30 days for critical issues

We will keep you informed throughout the process and credit you in the security advisory (unless you prefer to remain anonymous).

## Smart Contract Security Standards

All WeSolar contracts follow these security practices:

- **OpenZeppelin libraries** for standard patterns (ERC-20, ReentrancyGuard, Ownable, AccessControl)
- **Checks-Effects-Interactions** pattern for all external calls
- **Reentrancy guards** on all state-changing functions that transfer value
- **Integer overflow protection** via Solidity 0.8.x built-in checks
- **Event emission** for all state changes to enable off-chain monitoring
- **Access control** via role-based permissions (not single-owner patterns)

## Known Limitations

WeSolar is currently in active development and has not yet undergone a formal third-party audit. The contracts are deployed on testnet only. **Do not use mainnet funds with unaudited contracts.**

A formal security audit is planned prior to mainnet deployment. Audit reports will be published in `audits/` when available.

## Bug Bounty

We do not currently operate a formal bug bounty program. However, we deeply appreciate responsible disclosure and will acknowledge contributors in our security advisories and project documentation.

---

*The Elevation Foundation is a 501(c)(3) nonprofit. EIN: 93-2511290.*
*Contact: [security@elevation.foundation](mailto:security@elevation.foundation)*
