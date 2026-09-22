// Pactum AI - Actionable Deliverables & Lawyer Consultation Prep Kit

class PactumPrepKit {
  generateChecklist(parsedDoc) {
    if (!parsedDoc) return [];

    const checklist = [];

    // Milestone & Deadlines
    parsedDoc.keyDates.forEach(dateObj => {
      checklist.push({
        type: "Time-Sensitive Obligation",
        title: `Calendar Critical Deadline: ${dateObj.timeframe}`,
        description: dateObj.context,
        priority: "High",
        badge: "Urgent"
      });
    });

    // High risk remediation tasks
    parsedDoc.clauses.filter(c => c.riskLevel === "High").forEach(c => {
      checklist.push({
        type: "Redline & Negotiate",
        title: `Negotiate ${c.title}`,
        description: c.lawyerAdvice || "Request revision to standard balanced industry language.",
        priority: "High",
        badge: "Must Revise"
      });
    });

    // General best practices
    checklist.push({
      type: "Verification Step",
      title: "Confirm Corporate Signing Authority",
      description: "Ensure the signatory has verified power of attorney or executive authority to bind the counterparty.",
      priority: "Medium",
      badge: "Standard"
    });

    checklist.push({
      type: "Record Keeping",
      title: "Archive Signed Counterparts & Addenda",
      description: "Maintain an encrypted digital repository of all fully-executed copies and exhibits.",
      priority: "Low",
      badge: "Compliance"
    });

    return checklist;
  }

  generateNegotiationPlaybook(parsedDoc) {
    if (!parsedDoc) return [];

    const playbook = [];

    parsedDoc.clauses.forEach(clause => {
      if (clause.riskLevel === "High" || clause.riskLevel === "Medium") {
        let proposedRedline = "";
        let leverageArgument = "";

        if (clause.category === "Liability & Indemnity") {
          proposedRedline = "Each party's maximum cumulative aggregate liability under this Agreement shall be strictly limited to the total fees actually paid in the six (6) months preceding the incident. Each party shall mutually defend and indemnify the other against third-party claims arising from gross negligence.";
          leverageArgument = "Unlimited liability is commercially unreasonable for an independent contractor. Mutual caps aligned with project fees represent prevailing tech industry standards.";
        } else if (clause.category === "Intellectual Property") {
          proposedRedline = "Contractor assigns to Client all right and title to bespoke Deliverables upon full receipt of payment. Contractor retains all right, title, and ownership in and to Contractor's pre-existing tools, code libraries, and general methodologies, granting Client a non-exclusive license.";
          leverageArgument = "Assigning pre-existing IP would prevent the contractor from doing business in the future. Tying assignment to full payment ensures mutual performance.";
        } else if (clause.category === "Restrictive Covenants") {
          proposedRedline = "Strike Section 5 entirely, or replace with: Contractor agrees not to knowingly solicit full-time employees of Client for a period of twelve (12) months following completion of the project.";
          leverageArgument = "Broad non-compete clauses against independent contractors are restrictive, discourage innovation, and are increasingly legally unenforceable in major jurisdictions.";
        } else if (clause.category === "Payment & Audit") {
          proposedRedline = "Payment shall be due thirty (30) days from receipt of an undisputed invoice. In the event of an unforeseen delay, Contractor shall notify Client in good faith without imposition of punitive deductions.";
          leverageArgument = "Net 90 creates severe working capital constraints. Net 30 is the established norm for professional consulting services.";
        } else if (clause.category === "Termination") {
          proposedRedline = "Either party may terminate this Agreement for convenience upon thirty (30) days prior written notice. Client shall pay Contractor for all services rendered and incurred expenses through the termination date.";
          leverageArgument = "A one-sided immediate termination without payment exposes the contractor to unhedged labor risk. Mutual 30-day notice ensures smooth knowledge transfer.";
        } else {
          proposedRedline = "Both parties agree to standard mutual terms consistent with fair commercial practice.";
          leverageArgument = "Ensure equitable reciprocity across all covenants.";
        }

        playbook.push({
          clauseTitle: clause.title,
          riskLevel: clause.riskLevel,
          currentText: clause.text,
          proposedRedline,
          leverageArgument
        });
      }
    });

    return playbook;
  }

  generateLawyerPrepSheet(parsedDoc, title = "Contract Review Brief") {
    if (!parsedDoc) return null;

    const highRisks = parsedDoc.clauses.filter(c => c.riskLevel === "High");
    
    return {
      docTitle: title,
      generatedDate: new Date().toLocaleDateString(),
      compositeRiskScore: parsedDoc.riskScore,
      riskGrade: parsedDoc.riskGrade,
      totalClausesAnalyzed: parsedDoc.totalClauses,
      flaggedConcerns: highRisks.map(c => ({
        title: c.title,
        issue: c.redFlags.join(" ") || "Unbalanced clause requiring legal review.",
        advice: c.lawyerAdvice
      })),
      topQuestionsForLawyer: [
        "Given our jurisdiction, is the non-compete / restrictive covenant clause legally enforceable against an independent contractor or employee?",
        "How can we modify the indemnification and liability cap so that our personal assets and pre-existing IP are 100% safeguarded?",
        "Does the termination clause expose us to unpaid work or sudden breach liabilities if the client disputes deliverables?",
        "What specific carve-outs or riders should be attached to protect our proprietary tools and background know-how?",
        "Are there any mandatory statutory rights or local labor laws being waived by the dispute resolution and arbitration provisions?"
      ]
    };
  }
}

window.pactumPrepKit = new PactumPrepKit();
