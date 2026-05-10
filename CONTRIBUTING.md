# Contributing to WeSolar

Thank you for your interest in contributing to WeSolar — a decentralized peer-to-peer solar financing platform built on the IOTA Tangle. WeSolar is a project of [The Elevation Foundation](https://elevation.foundation), a 501(c)(3) nonprofit organization dedicated to building transparent, community-governed financial systems.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Smart Contract Guidelines](#smart-contract-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community & Support](#community--support)

---

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this standard. Please report unacceptable behavior to [dev@elevation.foundation](mailto:dev@elevation.foundation).

---

## How to Contribute

### Reporting Bugs

Before filing a bug report, please search [existing issues](https://github.com/ModernDigitalDevelopment/wesolar/issues) to avoid duplicates. When filing a report, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Environment details (Node.js version, Hardhat version, network)
- Relevant logs or error messages

### Suggesting Enhancements

Enhancement suggestions are welcome via [GitHub Issues](https://github.com/ModernDigitalDevelopment/wesolar/issues). Label your issue `enhancement` and include:

- A clear description of the proposed feature
- The problem it solves or the value it adds
- Any relevant prior art or reference implementations

### Contributing Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the guidelines below
4. Write or update tests
5. Submit a pull request

---

## Development Setup

### Prerequisites

- Node.js v18+
- pnpm or npm
- Hardhat
- An IOTA Tangle endpoint (for integration tests)

### Installation

```bash
git clone https://github.com/ModernDigitalDevelopment/wesolar.git
cd wesolar
npm install
cp .env.example .env
# Fill in your environment variables
```

### Running Tests

```bash
npx hardhat test
npx hardhat coverage
```

### Local Deployment

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

---

## Smart Contract Guidelines

WeSolar smart contracts govern real community assets — solar panel ownership, energy credits, and governance votes. Please follow these standards:

### Security

- All contracts must pass `npx hardhat test` with 100% of existing tests passing
- New contracts must include a corresponding test file in `test/`
- Run `slither .` (if available) before submitting contracts for review
- Never introduce reentrancy vulnerabilities — use `ReentrancyGuard` from OpenZeppelin
- All external calls must follow the checks-effects-interactions pattern
- Emit events for all state-changing operations

### Code Style

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use NatSpec documentation for all public functions
- Prefer explicit visibility modifiers (`public`, `external`, `internal`, `private`)
- Use `uint256` rather than `uint`
- Avoid magic numbers — use named constants

### Contract Architecture

WeSolar uses four core contracts:
- `WeSolarToken.sol` — ERC-20 energy credit token (WST)
- `SolarPanelRegistry.sol` — fractional NFT ownership of solar panels
- `WeSolarFinancing.sol` — P2P solar financing and crowdfunding
- `WeSolarDAO.sol` — community governance for expansion decisions

New contracts should integrate cleanly with this architecture. Discuss major architectural changes in an issue before implementing.

---

## Pull Request Process

1. Ensure all tests pass: `npx hardhat test`
2. Update the README if your changes affect setup or usage
3. Add a clear description of what your PR changes and why
4. Reference any related issues: `Closes #123`
5. Request review from at least one maintainer
6. PRs are merged by maintainers after review — please be patient

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add WeSolarMarketplace contract for P2P energy credit trading
fix: prevent double-spend in WeSolarToken transfer
docs: update deployment guide for IOTA Shimmer testnet
test: add coverage for WeSolarDAO proposal lifecycle
```

---

## Community & Support

- **Website:** [elevation.foundation/wesolar](https://elevation.foundation/wesolar)
- **Email:** [dev@elevation.foundation](mailto:dev@elevation.foundation)
- **GitHub Issues:** [github.com/ModernDigitalDevelopment/wesolar/issues](https://github.com/ModernDigitalDevelopment/wesolar/issues)

WeSolar is built by and for communities. Every contribution — code, documentation, testing, or feedback — moves us closer to a world where clean energy is community-owned and community-governed.

---

*The Elevation Foundation is a 501(c)(3) nonprofit. EIN: 93-2511290.*
