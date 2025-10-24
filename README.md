# Farm Yield Ledger

An immutable ledger system for agricultural production metadata, built on Stacks blockchain. Farm Yield Ledger enables producers to register land parcels, track cultivation cycles, record harvests, and allow authorized third parties to verify and access their agricultural data with granular permission controls.

## Features

- **Producer Account Management**: Registration and profile management for agricultural producers
- **Land Plot Registry**: Document and manage cultivatable plots with detailed properties
- **Crop Cycle Tracking**: Record cultivation periods including inputs and methodologies
- **Production Records**: Log harvest results and quality assessments
- **Certification Framework**: Third-party certifiers can lodge attestations
- **Permission-Based Access**: Fine-grained control over data visibility
- **Immutable Audit Trail**: All operations recorded on Stacks blockchain

## Problem Statement & Solution

Agricultural supply chains often lack transparency and verifiability. Buyers, regulators, and consumers struggle to validate production claims and farming practices. Farm Yield Ledger addresses this by creating a single source of truth for production data—immutable, auditable, and accessible only to authorized parties.

## Smart Contract Architecture

The system consists of seven interconnected data structures and operational layers:

### Data Structures

1. **Producer Directory** - Manages agricultural producer accounts and status
2. **Land Registry** - Tracks physical plot characteristics and ownership  
3. **Crop Cycles** - Documents cultivation periods and agricultural inputs
4. **Production Records** - Stores harvest outputs and quality assessments
5. **Certifier Registry** - Maintains authorized certification organizations
6. **Attestation Ledger** - Records verification claims from certifiers
7. **Permission Matrix** - Manages access rights across data types

### Core Operations

**Producer Operations:**
- `enroll-as-producer` - Register new agricultural producer
- `register-plot` - Create new land plot record
- `adjust-plot-properties` - Modify plot characteristics
- `initiate-crop-cycle` - Begin cultivation cycle
- `record-production-output` - Log harvest results
- `authorize-viewer` - Grant data access to third parties
- `withdraw-viewer-access` - Revoke data permissions

**Certification Operations:**
- `register-as-certifier` - Register as certification authority
- `lodge-attestation` - Submit verification attestation

**Query Functions:**
- `fetch-producer-profile` - Retrieve producer information
- `fetch-land-data` - Look up plot details
- `fetch-cycle-data` - Get cultivation cycle info
- `fetch-production-data` - Access harvest records
- `fetch-certifier-profile` - View certifier details
- `fetch-attestation-data` - Retrieve verification records
- `query-access-permission` - Check viewing permissions

## Getting Started

### Prerequisites
- Node.js and npm installed
- Clarinet framework (install via npm)
- Stacks wallet with testnet STX

### Installation & Setup

```bash
# Clone repository
git clone <repository-url>
cd farm-yield-ledger

# Install dependencies
npm install

# Verify contract syntax
clarinet check

# Run test suite
clarinet test
```

### Deployment

```bash
# Deploy to testnet
clarinet deploy --testnet

# Deploy to mainnet (production)
clarinet deploy --mainnet
```

## Usage Examples

### Producer Workflow

1. **Enroll as Producer**
```clarity
(contract-call? .yield-ledger enroll-as-producer 
  "Maria Santos" "São Paulo Region")
```

2. **Register Land Plot**
```clarity
(contract-call? .yield-ledger register-plot 
  "Latitude: 23.5N, Longitude: 46.6W" 
  u150 
  "Alluvial Silt")
```

3. **Initiate Cultivation**
```clarity
(contract-call? .yield-ledger initiate-crop-cycle
  u1 
  "Corn Hybrid XYZ"
  u1678000000
  "NPK 10-10-10, Organic pesticide"
  "Planted during optimal weather window")
```

4. **Record Harvest Output**
```clarity
(contract-call? .yield-ledger record-production-output
  u1
  u85000
  "Grade A: Moisture content 14.2%, Foreign material <0.1%"
  u1690000000
  "Exceptional yield, harvest completed within 3-day window")
```

5. **Grant Data Access**
```clarity
(contract-call? .yield-ledger authorize-viewer
  "production"
  u1
  'SP2JXKMH007ZPJXKMH007ZPJXKMH007ZPJXKXY0Q
  "full")
```

### Certifier Workflow

1. **Register as Certifier**
```clarity
(contract-call? .yield-ledger register-as-certifier
  "Organic Certification International"
  "organic-compliance")
```

2. **Lodge Attestation**
```clarity
(contract-call? .yield-ledger lodge-attestation
  "production"
  u1
  "verified"
  "Production methods confirmed compliant with IFOAM standards")
```

### Query Data

```clarity
;; Check producer profile
(contract-call? .yield-ledger fetch-producer-profile tx-sender)

;; Retrieve plot information
(contract-call? .yield-ledger fetch-land-data u1)

;; Access harvest record
(contract-call? .yield-ledger fetch-production-data u1)

;; Verify certifications
(contract-call? .yield-ledger fetch-attestation-data u1)
```

## Security Architecture

### Authorization Model
- **Owner-Exclusive Actions**: Only plot owners can initiate cycles and record harvests
- **Role-Based Verification**: Only registered certifiers can lodge attestations  
- **Permission Tokens**: Explicit grants required for third-party data access
- **Revocation Capability**: Data owners can immediately revoke access grants

### Data Integrity
- Sequential ID generation prevents collisions
- Immutable historical records via blockchain
- Timestamp validation via block height
- Principal-based identity verification

### Error Handling
- Comprehensive error codes for all failure scenarios
- Clear authorization boundary enforcement
- Input validation on all parameters
- Safe handling of optional map entries

## Testing

The project includes comprehensive test coverage:

```bash
# Run full test suite
clarinet test

# Run with verbose output
clarinet test --verbose

# Test specific function
clarinet test --filter "Producer"
```

Test categories:
- Account creation and validation
- Land plot registration and updates
- Cultivation cycle management
- Production record capture
- Certifier registration and attestation
- Permission grant and revocation
- Read-only query functions
- Authorization and error scenarios

## Development Roadmap

- [ ] Multi-signature authorization for large plot transfers
- [ ] Reputation scoring for certifiers based on historical attestations
- [ ] Batch operations for seasonal enrollment
- [ ] Integration with external oracles for weather/soil data
- [ ] Supply chain traceability linking producers to distributors
- [ ] Mobile application for producer data entry

## License

Specify your chosen license here

## Support

For questions or issues, please open a GitHub issue or contact the development team.