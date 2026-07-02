# WeSolar ☀️

**Decentralized Community Solar for Underserved Communities**

[![Tests](https://github.com/ModernDigitalDevelopment/wesolar/actions/workflows/test.yml/badge.svg)](https://github.com/ModernDigitalDevelopment/wesolar/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built on Celo](https://img.shields.io/badge/Built%20on-Celo-35D07F.svg)](https://celo.org)
[![501(c)(3)](https://img.shields.io/badge/Nonprofit-501(c)(3)-blue.svg)](https://elevation.foundation)

> *"Putting the 'We' in Web3 Energy — community-owned solar infrastructure powered by blockchain."*

WeSolar is a decentralized platform that democratizes access to solar energy by enabling communities to **co-own solar infrastructure**, **finance installations through peer-to-peer lending**, **earn energy credits**, and **govern expansion decisions** — all through transparent smart contracts on the Celo blockchain.

Built by the [Elevation Foundation](https://elevation.foundation) — a federally recognized 501(c)(3) nonprofit (EIN: 92-1042348).

---

## The Problem

31 million U.S. households — disproportionately Black, Latino, and low-income — experience energy insecurity. They spend 8–10% of household income on energy bills, compared to 3% for higher-income households. Solar energy remains inaccessible due to:

- **$15,000–$30,000** upfront installation costs
- Credit checks and income requirements that exclude the most vulnerable
- Opaque utility-controlled community solar programs with no resident governance

## The Solution

WeSolar replaces the utility company middleman with four smart contracts that make community solar ownership **transparent**, **accessible**, and **self-governing**:

| Contract | Purpose | Status |
|---|---|---|
| `WeSolarToken.sol` (WST) | ERC-20 energy credit token, minted per kWh generated | Written |
| `SolarPanelRegistry.sol` | ERC-1155 fractional ownership — 100 shares per installation | Written |
| `WeSolarFinancing.sol` | P2P loan lifecycle: request → fund → repay | Written |
| `WeSolarDAO.sol` | Community governance via OpenZeppelin Governor v5 | Written |

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│              COMMUNITY SOLAR PROJECT                     │
│  Homeowner requests installation → Financing contract    │
├─────────────────────────────────────────────────────────┤
│              P2P LENDING MARKETPLACE                      │
│  Community members fund the project in cUSD stablecoin   │
├─────────────────────────────────────────────────────────┤
│              FRACTIONAL OWNERSHIP                         │
│  SolarPanelRegistry mints 100 NFT shares per panel       │
├─────────────────────────────────────────────────────────┤
│              ENERGY PRODUCTION & CREDITS                  │
│  Solar produces energy → WST tokens minted per kWh       │
├─────────────────────────────────────────────────────────┤
│              COMMUNITY GOVERNANCE                         │
│  WST holders vote on: new installations, pricing, grants  │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- A wallet with Celo Alfajores testnet tokens ([get free tokens here](https://faucet.celo.org/alfajores))

### Installation

```bash
git clone https://github.com/ModernDigitalDevelopment/wesolar.git
cd wesolar
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env and add your PRIVATE_KEY (never commit this file)
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy to Celo Alfajores Testnet

```bash
npx hardhat run scripts/deploy/01_deploy_all.js --network celo-alfajores
```

---

## Repository Structure

```
wesolar/
├── contracts/
│   ├── core/                    # The four production smart contracts
│   │   ├── WeSolarToken.sol     # WST energy credit token (ERC-20)
│   │   ├── SolarPanelRegistry.sol # Fractional ownership NFTs (ERC-1155)
│   │   ├── WeSolarFinancing.sol # P2P loan lifecycle
│   │   └── WeSolarDAO.sol       # Community governance (OZ Governor v5)
│   ├── interfaces/              # Contract interfaces (IWeSolarToken, etc.)
│   └── mocks/                   # Mock contracts for testing
├── test/                        # Hardhat test suite (target: 90%+ coverage)
├── scripts/
│   ├── deploy/                  # Deployment scripts
│   └── verify/                  # Celoscan verification scripts
├── deployments/
│   ├── alfajores/               # Testnet deployment addresses
│   └── celo/                    # Mainnet deployment addresses
├── frontend/                    # React dApp (Phase 2)
├── api/                         # Backend API (Phase 2)
├── docs/
│   ├── architecture/            # Technical documentation
│   ├── business/                # Executive summary, whitepaper
│   └── guides/                  # Getting started, deployment guides
└── grant-applications/          # Active grant applications
    ├── celo-climate-collective.md  # Ready to submit
    ├── energy-web-foundation.md
    └── epa-ecj-thriving-communities.md
```

---

## Why Celo?

Celo's architecture is uniquely suited to WeSolar's mission:

- **Mobile-first:** 70% of energy-insecure households have smartphones — Celo's mobile SDK enables participation without computers
- **Carbon-negative:** Celo offsets more carbon than it produces, aligning with WeSolar's climate mission
- **cUSD stablecoin:** Enables stable-value loans without cryptocurrency volatility risk
- **Sub-cent fees:** Makes energy credit microtransactions economically viable
- **MiniPay wallet:** 4M+ existing users in underserved communities globally

---

## Development Roadmap

### Phase 1 — Foundation & Testnet (Months 1–3) 🔄 IN PROGRESS
- [ ] Refactor `WeSolarFinancing.sol` to use cUSD stablecoin for loans
- [ ] Fix amortization interest calculation
- [ ] Write comprehensive test suite (target: 90%+ coverage)
- [ ] Deploy all 4 contracts to Celo Alfajores testnet
- [ ] Set up GitHub Actions CI/CD pipeline
- [ ] Build minimal demo web interface
- [ ] Submit Celo Climate Collective grant application
- [ ] Register for Gitcoin GG25

### Phase 2 — MVP dApp (Months 4–8) ⏳ PLANNED
- [ ] Full React dApp with wallet integration (MiniPay, MetaMask, Valora)
- [ ] Homeowner dashboard: ownership shares, WST earnings, bill credits
- [ ] Lender dashboard: loan portfolio, yield tracking
- [ ] DAO voting interface
- [ ] 3 pilot installations (150 households)
- [ ] Smart contract security audit

### Phase 3 — Scale & Ecosystem (Months 9–24) 🔮 FUTURE
- [ ] Mobile app (React Native + MiniPay SDK)
- [ ] Chainlink oracle integration for trustless energy data
- [ ] Secondary market for ownership NFT trading
- [ ] Multi-chain expansion (Base, Polygon)
- [ ] 25 installations, 1,500 households, 5 cities

---

## Grant Pipeline

| Program | Amount | Status |
|---|---|---|
| Celo Climate Collective | $25K–$100K | Draft ready — submitting |
| Energy Web Foundation | $50K–$200K | Drafting |
| EPA ECJ Thriving Communities | $500K–$3M | Researching |
| DOE Community Solar Partnership | $100K–$500K | Researching |
| Gitcoin GG25 | $5K–$50K matching | Needs testnet deployment |
| Ethereum Foundation ESP | $30K–$100K | Drafting |

---

## Token Economy

The **WeSolar Token (WST)** serves multiple functions:

| Function | Description |
|---|---|
| **Energy Credits** | 1 WST = 1 kWh of solar energy produced by the network |
| **Governance** | Vote on platform upgrades, new installations, treasury allocation |
| **Ownership Rewards** | Earned proportionally by SolarPanelRegistry NFT holders |
| **Bill Credits** | Redeemable for energy bill discounts with partner utilities |

---

## Related Projects

| Project | Repository | Description |
|---|---|---|
| **Sotilitarianism** | [sotilitarianism](https://github.com/ModernDigitalDevelopment/sotilitarianism) | The philosophical framework |
| **Transparently** | [transparently](https://github.com/ModernDigitalDevelopment/transparently) | Blockchain governance DApp |
| **Elevation Engine** | [elevation-engine](https://github.com/ModernDigitalDevelopment/elevation-engine) | Autonomous DeFi yield engine |
| **Website** | [elevation.foundation](https://elevation.foundation) | Official website |

---

## Contributing

We welcome contributions from developers, solar energy professionals, and community organizers. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

---

## About the Elevation Foundation

The Elevation Foundation is a federally recognized 501(c)(3) nonprofit organization (EIN: 92-1042348) that builds open-source blockchain infrastructure for transparent governance, community finance, and economic empowerment.

- Website: [elevation.foundation](https://elevation.foundation)
- Email: [grants@elevation.foundation](mailto:grants@elevation.foundation)
- GitHub: [ModernDigitalDevelopment](https://github.com/ModernDigitalDevelopment)

---

## License

MIT License — see [LICENSE](LICENSE) for details.
