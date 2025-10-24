import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.0.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";

Clarinet.test({
  name: "Scenario: New producer enrolls in system",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Maria Santos"), types.ascii("São Paulo")],
        wallet1.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "Prevents duplicate producer enrollment",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const user = accounts.get("wallet_2")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("John Smith"), types.ascii("Iowa")],
        user.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Jane Doe"), types.ascii("Nebraska")],
        user.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(err u102)");
  },
});

Clarinet.test({
  name: "Registered producer can create land plot",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const producer = accounts.get("wallet_3")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Alex Kumar"), types.ascii("Punjab")],
        producer.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Latitude: 31.5N, Longitude: 74.3E"),
          types.uint(150),
          types.ascii("Alluvial Silt"),
        ],
        producer.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(ok u1)");
  },
});

Clarinet.test({
  name: "Unregistered principal cannot register plot",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const unauthorized = accounts.get("wallet_4")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Field Location Data"),
          types.uint(100),
          types.ascii("Sandy Loam"),
        ],
        unauthorized.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(err u100)");
  },
});

Clarinet.test({
  name: "Plot owner can modify plot properties",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const producer = accounts.get("wallet_5")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Fatima Hassan"), types.ascii("Sudan")],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Central Region Coordinates"),
          types.uint(200),
          types.ascii("Clay"),
        ],
        producer.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "adjust-plot-properties",
        [
          types.uint(1),
          types.ascii("Updated Coordinates"),
          types.uint(220),
          types.ascii("Clay Loam"),
          types.bool(true),
        ],
        producer.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "Non-owner cannot modify plot",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const owner = accounts.get("wallet_6")!;
    const other = accounts.get("wallet_7")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Owner Name"), types.ascii("Region A")],
        owner.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Plot Location"),
          types.uint(100),
          types.ascii("Soil Type"),
        ],
        owner.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "adjust-plot-properties",
        [
          types.uint(1),
          types.ascii("New Location"),
          types.uint(150),
          types.ascii("New Soil"),
          types.bool(true),
        ],
        other.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(err u100)");
  },
});

Clarinet.test({
  name: "Producer initiates crop cultivation cycle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const producer = accounts.get("wallet_8")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Carlos Mendez"), types.ascii("Chile")],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Vineyard Location"),
          types.uint(300),
          types.ascii("Granitic Soil"),
        ],
        producer.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "initiate-crop-cycle",
        [
          types.uint(1),
          types.ascii("Cabernet Sauvignon"),
          types.uint(1678000000),
          types.ascii("Organic fertilizer, drip irrigation"),
          types.ascii("Early spring planting"),
        ],
        producer.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(ok u1)");
  },
});

Clarinet.test({
  name: "Non-owner cannot initiate crop cycle on plot",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const owner = accounts.get("wallet_9")!;
    const intruder = accounts.get("wallet_10")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Plot Owner"), types.ascii("Region")],
        owner.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Location"),
          types.uint(100),
          types.ascii("Soil"),
        ],
        owner.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "initiate-crop-cycle",
        [
          types.uint(1),
          types.ascii("Wheat"),
          types.uint(1700000000),
          types.ascii("Inputs"),
          types.ascii("Notes"),
        ],
        intruder.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(err u100)");
  },
});

Clarinet.test({
  name: "Producer records harvest production output",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const producer = accounts.get("wallet_11")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Rajesh Patel"), types.ascii("Gujarat")],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Cotton Field Coordinates"),
          types.uint(250),
          types.ascii("Black Soil"),
        ],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "initiate-crop-cycle",
        [
          types.uint(1),
          types.ascii("Cotton"),
          types.uint(1675000000),
          types.ascii("Neem-based pesticide"),
          types.ascii("Monsoon season"),
        ],
        producer.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "record-production-output",
        [
          types.uint(1),
          types.uint(45000),
          types.ascii("Grade A: Staple length 28-30mm, color white"),
          types.uint(1680000000),
          types.ascii("Excellent yield this season"),
        ],
        producer.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(ok u1)");
  },
});

Clarinet.test({
  name: "Harvest must be recorded by cycle owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const farmer = accounts.get("wallet_12")!;
    const stranger = accounts.get("wallet_13")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Farmer One"), types.ascii("Region One")],
        farmer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Plot Coords"),
          types.uint(100),
          types.ascii("Soil"),
        ],
        farmer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "initiate-crop-cycle",
        [
          types.uint(1),
          types.ascii("Crop"),
          types.uint(1670000000),
          types.ascii("Inputs"),
          types.ascii("Notes"),
        ],
        farmer.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "record-production-output",
        [
          types.uint(1),
          types.uint(5000),
          types.ascii("Assessment"),
          types.uint(1675000000),
          types.ascii("Notes"),
        ],
        stranger.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(err u100)");
  },
});

Clarinet.test({
  name: "New certifier can register",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const certifier = accounts.get("wallet_14")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-as-certifier",
        [
          types.ascii("International Organic Certification Board"),
          types.ascii("organic"),
        ],
        certifier.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "Prevents duplicate certifier registration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const certifier = accounts.get("wallet_15")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-as-certifier",
        [
          types.ascii("First Organization"),
          types.ascii("sustainability"),
        ],
        certifier.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-as-certifier",
        [
          types.ascii("Second Organization"),
          types.ascii("quality"),
        ],
        certifier.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(err u102)");
  },
});

Clarinet.test({
  name: "Certifier submits attestation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const certifier = accounts.get("wallet_16")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-as-certifier",
        [
          types.ascii("Quality Testing Lab"),
          types.ascii("quality"),
        ],
        certifier.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "lodge-attestation",
        [
          types.ascii("production"),
          types.uint(1),
          types.ascii("verified"),
          types.ascii("All quality standards met"),
        ],
        certifier.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(ok u1)");
  },
});

Clarinet.test({
  name: "Non-certifier cannot submit attestation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const random = accounts.get("wallet_17")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "lodge-attestation",
        [
          types.ascii("plot"),
          types.uint(1),
          types.ascii("verified"),
          types.ascii("Remarks here"),
        ],
        random.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(err u107)");
  },
});

Clarinet.test({
  name: "Producer grants data access to viewer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const producer = accounts.get("wallet_18")!;
    const distributor = accounts.get("wallet_19")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Producer Name"), types.ascii("Region")],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Plot Location"),
          types.uint(100),
          types.ascii("Soil Type"),
        ],
        producer.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "authorize-viewer",
        [
          types.ascii("plot"),
          types.uint(1),
          types.principal(distributor.address),
          types.ascii("full"),
        ],
        producer.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "Only record owner can grant access",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const owner = accounts.get("wallet_20")!;
    const unauthorized = accounts.get("wallet_21")!;
    const viewer = accounts.get("wallet_22")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Owner"), types.ascii("Region")],
        owner.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Coords"),
          types.uint(100),
          types.ascii("Soil"),
        ],
        owner.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "authorize-viewer",
        [
          types.ascii("plot"),
          types.uint(1),
          types.principal(viewer.address),
          types.ascii("limited"),
        ],
        unauthorized.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(err u100)");
  },
});

Clarinet.test({
  name: "Producer can revoke data access",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const producer = accounts.get("wallet_23")!;
    const viewer = accounts.get("wallet_24")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Prod"), types.ascii("Loc")],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Loc"),
          types.uint(100),
          types.ascii("Soil"),
        ],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "authorize-viewer",
        [
          types.ascii("plot"),
          types.uint(1),
          types.principal(viewer.address),
          types.ascii("full"),
        ],
        producer.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "withdraw-viewer-access",
        [
          types.ascii("plot"),
          types.uint(1),
          types.principal(viewer.address),
        ],
        producer.address
      ),
    ]);

    assertEquals(block.receipts[0].result, "(ok true)");
  },
});

Clarinet.test({
  name: "Read function retrieves producer profile",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const producer = accounts.get("wallet_25")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Ahmed El Sayed"), types.ascii("Egypt")],
        producer.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "fetch-producer-profile",
        [types.principal(producer.address)],
        producer.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
  },
});

Clarinet.test({
  name: "Read function retrieves land plot data",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const producer = accounts.get("wallet_26")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Producer"), types.ascii("Area")],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Coordinates Here"),
          types.uint(500),
          types.ascii("Sandy Soil"),
        ],
        producer.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "fetch-land-data",
        [types.uint(1)],
        producer.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
  },
});

Clarinet.test({
  name: "Read function retrieves cycle data",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const producer = accounts.get("wallet_27")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Producer"), types.ascii("Region")],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("Location"),
          types.uint(100),
          types.ascii("Soil Type"),
        ],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "initiate-crop-cycle",
        [
          types.uint(1),
          types.ascii("Crop Type"),
          types.uint(1650000000),
          types.ascii("Materials"),
          types.ascii("Notes"),
        ],
        producer.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "fetch-cycle-data",
        [types.uint(1)],
        producer.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
  },
});

Clarinet.test({
  name: "Read function retrieves production record",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const producer = accounts.get("wallet_28")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "enroll-as-producer",
        [types.ascii("Prod"), types.ascii("Loc")],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-plot",
        [
          types.ascii("L"),
          types.uint(100),
          types.ascii("S"),
        ],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "initiate-crop-cycle",
        [
          types.uint(1),
          types.ascii("C"),
          types.uint(1650000000),
          types.ascii("M"),
          types.ascii("N"),
        ],
        producer.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "record-production-output",
        [
          types.uint(1),
          types.uint(1000),
          types.ascii("A"),
          types.uint(1655000000),
          types.ascii("X"),
        ],
        producer.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "fetch-production-data",
        [types.uint(1)],
        producer.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
  },
});

Clarinet.test({
  name: "Read function retrieves certifier profile",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const certifier = accounts.get("wallet_29")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-as-certifier",
        [
          types.ascii("Certifier Org"),
          types.ascii("specialization"),
        ],
        certifier.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "fetch-certifier-profile",
        [types.principal(certifier.address)],
        certifier.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
  },
});

Clarinet.test({
  name: "Read function retrieves attestation data",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const certifier = accounts.get("wallet_30")!;

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "register-as-certifier",
        [
          types.ascii("Org"),
          types.ascii("spec"),
        ],
        certifier.address
      ),
    ]);

    chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "lodge-attestation",
        [
          types.ascii("plot"),
          types.uint(1),
          types.ascii("verified"),
          types.ascii("Remarks"),
        ],
        certifier.address
      ),
    ]);

    let block = chain.mineBlock([
      Tx.contractCall(
        "yield-ledger",
        "fetch-attestation-data",
        [types.uint(1)],
        certifier.address
      ),
    ]);

    assertEquals(block.receipts.length, 1);
  },
});
