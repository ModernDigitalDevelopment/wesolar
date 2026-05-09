# WeSolar — Celo Climate Collective Grant Application

## Project Overview

**WeSolar** is a community-owned solar energy platform that tokenizes solar infrastructure, enabling residents to co-own solar panels, earn energy credits, and vote on expansion — all governed by transparent smart contracts.

**Organization:** The Elevation Foundation (EIN 92-1042348) — 501(c)(3) nonprofit  
**Contact:** cornelius.j.sinclair@gmail.com  
**GitHub:** https://github.com/ModernDigitalDevelopment/wesolar  
**Website:** https://elevation.foundation  

---

## Problem Statement

Millions of low-income households cannot access solar energy because:
1. **High upfront costs** — residential solar installations average $15,000–$25,000
2. **No credit access** — traditional financing excludes underbanked communities
3. **No ownership** — community solar programs offer subscriptions, not ownership
4. **No transparency** — energy credits are tracked in opaque centralized systems

---

## Solution: WeSolar

WeSolar solves all four problems through blockchain-based community ownership:

| Problem | WeSolar Solution |
|---------|-----------------|
| High upfront costs | P2P financing via `WeSolarFinancing.sol` — neighbors fund neighbors |
| No credit access | WST token collateral + on-chain credit history |
| No ownership | Tokenized shares in `SolarPanelRegistry.sol` — real co-ownership |
| No transparency | All energy production + credits on-chain, publicly verifiable |

---

## Technical Architecture

### Smart Contracts (Base Sepolia Testnet)

| Contract | Purpose |
|----------|---------|
| `WeSolarToken.sol` | WST governance + utility token (ERC-20 + ERC-Votes) |
| `SolarPanelRegistry.sol` | On-chain registry of community-owned solar installations |
| `WeSolarFinancing.sol` | P2P solar installation financing with automated repayment |
| `WeSolarDAO.sol` | Community governance for platform decisions |

### Technology Stack
- **Blockchain:** Base (Coinbase L2) — low fees, Ethereum security
- **Smart Contracts:** Solidity 0.8.26, OpenZeppelin v5
- **Oracle:** Chainlink for energy production data feeds
- **Frontend:** React + ethers.js (planned)

---

## Impact Metrics (Year 1 Targets)

| Metric | Target |
|--------|--------|
| Solar panels registered | 50 |
| Community members with ownership shares | 500 |
| kWh of clean energy produced | 100,000 |
| P2P loans facilitated | 25 |
| Average loan size | $8,000 |
| CO2 avoided (tons) | 45 |

---

## Why Celo?

WeSolar aligns perfectly with Celo's mission:
- **Mobile-first:** Celo's mobile-friendly UX reaches unbanked communities
- **ReFi:** Energy credits as regenerative finance instruments
- **Climate impact:** Direct CO2 reduction through solar adoption
- **Community ownership:** Celo's values of financial inclusion

We are open to deploying on Celo in addition to Base to maximize reach.

---

## Grant Request

**Amount requested:** $50,000 USD equivalent in CELO  

**Use of funds:**
- Smart contract auditing: $15,000
- Frontend development (mobile-first): $20,000
- Pilot program (10 solar installations): $10,000
- Community outreach and onboarding: $5,000

---

## Team

**Cornelius Lawrence** — Founder, The Elevation Foundation  
- Solar industry background (Sunrise Solar Sheet Metal Systems)
- Blockchain developer and community organizer
- 501(c)(3) nonprofit operator (EIN 92-1042348)

---

## Links

- **Whitepaper:** [WeSolar — Putting the We in Web3 Energy](./WeSolar-Whitepaper.md)
- **Technical Specs:** [Detailed Technical Specifications](./Technical-Specifications.md)
- **Competitor Analysis:** [Market Analysis](./Competitor-Analysis.md)
- **GitHub:** https://github.com/ModernDigitalDevelopment/wesolar
- **Website:** https://elevation.foundation/our-work#wesolar
