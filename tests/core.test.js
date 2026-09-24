const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const context = vm.createContext({ window: {}, console });
for (const file of ["analyzer.js", "comparator.js", "prepkit.js"]) {
  const source = fs.readFileSync(path.join(__dirname, "..", "js", file), "utf8");
  vm.runInContext(source, context, { filename: file });
}

const analyzer = context.window.pactumAnalyzer;
const comparator = context.window.pactumComparator;
const prepKit = context.window.pactumPrepKit;

const harshContract = `
1. PAYMENT TERMS
Client shall pay Contractor within ninety (90) calendar days. Any delay exceeding twenty-four (24) hours allows Client to withhold 25% as liquidated damages.

2. INTELLECTUAL PROPERTY
Contractor assigns all Works and Pre-Existing Materials and waives all moral rights.

3. LIABILITY
Contractor shall defend and indemnify Client. Contractor's liability shall be unlimited while Client's liability is capped at $100.
`;

const balancedContract = `
1. PAYMENT TERMS
Client shall pay Contractor within thirty (30) calendar days of an undisputed invoice.

2. INTELLECTUAL PROPERTY
Contractor retains sole ownership of all pre-existing tools and assigns bespoke Deliverables upon full payment.

3. LIABILITY
Each party's total aggregate liability is limited to fees paid in the prior six months.
`;

test("analyzer identifies material risk and obligations", () => {
  const result = analyzer.parseDocument(harshContract);
  assert.ok(result);
  assert.equal(result.totalClauses, 3);
  assert.ok(result.riskScore >= 70);
  assert.ok(result.highRiskCount >= 2);
  assert.ok(result.keyDates.some(item => item.timeframe.includes("24")));
  assert.ok(result.financialTerms.length > 0);
});

test("comparator reports a favorable counter-offer", () => {
  const result = comparator.compareDocuments(harshContract, balancedContract);
  assert.ok(result.riskDelta > 0);
  assert.ok(result.rows.some(row => row.status === "modified"));
  assert.match(result.winner, /Document B/);
});

test("prep kit produces actionable deliverables", () => {
  const result = analyzer.parseDocument(harshContract);
  const checklist = prepKit.generateChecklist(result);
  const playbook = prepKit.generateNegotiationPlaybook(result);
  const questions = prepKit.generateLawyerPrepSheet(result);
  assert.ok(checklist.length >= 3);
  assert.ok(playbook.length >= 2);
  assert.equal(questions.topQuestionsForLawyer.length, 5);
});
