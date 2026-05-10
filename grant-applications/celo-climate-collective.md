# Celo Climate Collective Grant Application — WeSolar

**Organization:** The Elevation Foundation  
**EIN:** 93-2511290  
**Status:** 501(c)(3) Nonprofit  
**Website:** [elevation.foundation/wesolar](https://elevation.foundation/wesolar)  
**GitHub:** [github.com/ModernDigitalDevelopment/wesolar](https://github.com/ModernDigitalDevelopment/wesolar)  
**Contact:** [grants@elevation.foundation](mailto:grants@elevation.foundation)  
**Requested Amount:** $25,000–$100,000  
**Grant Program:** [Celo Climate Collective](https://celo.org/climate)

---

## Executive Summary

WeSolar is a decentralized peer-to-peer solar financing platform that enables low-income communities to co-own solar infrastructure through fractional NFT ownership, earn energy credits for generation, and govern expansion decisions through on-chain voting. Built on the IOTA Tangle for feeless microtransactions and designed for Celo's mobile-first, carbon-negative blockchain ecosystem, WeSolar directly addresses the intersection of energy poverty and climate justice.

**The problem:** Energy poverty disproportionately affects low-income communities. Utility companies charge the highest rates to those who can least afford them, while solar energy remains inaccessible due to high upfront costs ($15,000–$30,000 per residential installation). Community solar programs exist but are opaque, centrally managed, and exclude the communities they claim to serve.

**Our solution:** WeSolar replaces the utility company middleman with four smart contracts that make community solar ownership transparent, accessible, and self-governing.

---

## The Problem: Energy Poverty as a Justice Issue

In the United States alone, 31 million households — disproportionately Black, Latino, and low-income — experience energy insecurity. They spend 8–10% of household income on energy bills, compared to 3% for higher-income households. This "energy burden" compounds existing economic inequality.

Community solar programs have emerged as a partial solution, but they suffer from three critical failures:

1. **Opacity:** Residents cannot verify how energy credits are calculated or distributed
2. **Centralization:** A single company or utility controls the program and can change terms unilaterally
3. **Exclusion:** Credit checks, minimum income requirements, and complex enrollment processes exclude the most vulnerable residents

WeSolar solves all three failures through blockchain transparency, smart contract automation, and open access.

---

## Technical Architecture

### Smart Contracts (Solidity / EVM-compatible)

**WeSolarToken.sol (WST)**
- ERC-20 token representing energy credits
- Minted automatically when solar panels generate electricity
- Tradeable on decentralized exchanges for fiat or stablecoins
- Burned when redeemed for energy bill credits

**SolarPanelRegistry.sol**
- ERC-1155 multi-token contract for fractional panel ownership
- Each panel is tokenized into 100 shares (minimum 1% ownership)
- Ownership NFTs earn proportional WST rewards
- Transferable — residents can sell their ownership stake

**WeSolarFinancing.sol**
- Crowdfunding contract for new panel installations
- Community members pool capital to fund installations
- Automated revenue sharing based on ownership percentage
- Integrates with Celo's cUSD stablecoin for stable-value contributions

**WeSolarDAO.sol**
- Governance contract for community decisions
- Token-weighted voting on: new installation locations, energy pricing, treasury allocation
- Proposal threshold: 1% of WST supply
- Quorum: 10% of circulating supply
- Timelock: 48-hour delay on all approved proposals

### Why Celo?

Celo's architecture is uniquely suited to WeSolar's mission:

- **Mobile-first:** 70% of energy-insecure households have smartphones but not computers — Celo's mobile SDK enables participation without technical barriers
- **Carbon-negative:** Celo offsets more carbon than it produces — aligning with WeSolar's climate mission
- **cUSD stablecoin:** Enables stable-value energy credit redemption without cryptocurrency volatility risk
- **Low fees:** Sub-cent transactions make energy credit microtransactions economically viable
- **Valora wallet:** Existing user base in underserved communities globally

---

## Impact Metrics

### Year 1 Targets (with grant funding)

| Metric | Target |
|--------|--------|
| Community solar installations | 3 pilot installations |
| Households served | 150 households |
| Energy credits issued (WST) | 500,000 WST |
| Average energy bill reduction | 25–40% |
| Carbon offset | 45 metric tons CO₂ |
| DAO governance participants | 200 token holders |

### 3-Year Vision

By Year 3, WeSolar aims to operate 25 community solar installations across 5 cities, serving 1,500 households and offsetting 375 metric tons of CO₂ annually.

---

## Budget Breakdown

| Category | Amount | Description |
|----------|--------|-------------|
| Smart contract audit | $15,000 | Third-party security audit by Certik or Trail of Bits |
| Celo mainnet deployment | $2,000 | Gas costs and deployment infrastructure |
| Pilot installation (1 site) | $45,000 | Solar panel hardware, installation, grid connection |
| Community outreach | $10,000 | Resident education, enrollment support, translation |
| Legal/compliance | $8,000 | Utility interconnection agreements, regulatory review |
| Development (6 months) | $20,000 | Frontend dApp, Celo integration, Valora wallet support |
| **Total** | **$100,000** | Full program launch |

*Minimum viable grant ($25,000): Covers smart contract audit + Celo deployment + 3 months development.*

---

## Team

**The Elevation Foundation** is a 501(c)(3) nonprofit founded to build transparent, community-governed financial systems using blockchain technology.

- **Smart Contract Development:** 20+ contracts written across the Sotility Protocol, WeSolar, and Transparently DApp
- **Community Organizing:** Relationships with community development organizations in 3 cities
- **Legal:** 501(c)(3) status, EIN 93-2511290, experienced in nonprofit governance

---

## Open Source Commitment

All WeSolar code is and will remain open source under the MIT License. Smart contracts, deployment scripts, and documentation are publicly available at [github.com/ModernDigitalDevelopment/wesolar](https://github.com/ModernDigitalDevelopment/wesolar).

We commit to:
- Publishing all audit reports in `audits/`
- Maintaining comprehensive deployment documentation
- Contributing improvements back to the Celo ecosystem
- Publishing quarterly impact reports on [elevation.foundation/transparency](https://elevation.foundation/transparency)

---

## Alignment with Celo Climate Collective

WeSolar directly advances the Celo Climate Collective's mission of using blockchain technology to address the climate crisis with a focus on equity and inclusion:

1. **Climate impact:** Direct carbon offset through renewable energy deployment
2. **Equity focus:** Designed specifically for low-income, energy-burdened communities
3. **Celo ecosystem:** Built on Celo with cUSD integration and Valora wallet support
4. **Open source:** All code publicly available for the broader ecosystem
5. **Community governance:** Token holders govern the protocol — no corporate control

---

## Links

- **Website:** [elevation.foundation/wesolar](https://elevation.foundation/wesolar)
- **GitHub:** [github.com/ModernDigitalDevelopment/wesolar](https://github.com/ModernDigitalDevelopment/wesolar)
- **Whitepaper:** [github.com/ModernDigitalDevelopment/wesolar/tree/main/docs/whitepapers](https://github.com/ModernDigitalDevelopment/wesolar/tree/main/docs/whitepapers)
- **Foundation:** [elevation.foundation](https://elevation.foundation)
- **Contact:** [grants@elevation.foundation](mailto:grants@elevation.foundation)

---

*The Elevation Foundation is a 501(c)(3) tax-exempt nonprofit organization. EIN: 93-2511290. Contributions are tax-deductible to the extent permitted by law.*
