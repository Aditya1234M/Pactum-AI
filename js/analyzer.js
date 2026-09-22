// Pactum AI - Document Analyzer & Legal Parsing Engine

class PactumAnalyzer {
  constructor() {
    this.jargonDictionary = {
      "indemnify": "Promise to pay for the other party's legal damages, penalties, and lawyer bills.",
      "hold harmless": "Absolve the other party from responsibility for any harm or losses caused.",
      "liquidated damages": "Pre-agreed financial penalties automatically deducted if a deadline is missed.",
      "covenant not to compete": "A ban that stops you from working for competitors or in the same industry.",
      "unilateral": "One-sided; where only one party has the power to make decisions or changes.",
      "arbitration": "Private dispute resolution outside public court, usually waiving your right to a jury.",
      "joint and several": "Every signer is 100% individually liable for the total debt if others cannot pay.",
      "triple net": "Lease terms where tenant pays base rent plus taxes, insurance, and all maintenance.",
      "moral rights": "Right of creators to claim authorship and prevent modification of their work.",
      "consequential damages": "Indirect losses like lost potential profits, downtime, or reputational impact."
    };
  }

  // Parse raw text into structured clauses
  parseDocument(text) {
    if (!text || !text.trim()) return null;

    const rawParagraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 20);
    const clauses = [];
    let totalRiskPoints = 0;
    let highRiskCount = 0;
    let medRiskCount = 0;

    rawParagraphs.forEach((para, index) => {
      const clauseAnalysis = this.analyzeParagraph(para, index + 1);
      clauses.push(clauseAnalysis);
      totalRiskPoints += clauseAnalysis.riskScore;
      if (clauseAnalysis.riskLevel === 'High') highRiskCount++;
      if (clauseAnalysis.riskLevel === 'Medium') medRiskCount++;
    });

    const averageScore = clauses.length > 0 ? Math.round(totalRiskPoints / clauses.length) : 0;
    // Scale total risk score nicely
    let compositeRiskScore = Math.min(95, Math.max(15, Math.round((highRiskCount * 25) + (medRiskCount * 10) + (averageScore * 0.4))));

    return {
      totalClauses: clauses.length,
      riskScore: compositeRiskScore,
      riskGrade: compositeRiskScore >= 70 ? 'High Risk' : compositeRiskScore >= 40 ? 'Moderate Risk' : 'Low Risk / Fair',
      highRiskCount,
      medRiskCount,
      safeCount: clauses.length - (highRiskCount + medRiskCount),
      clauses,
      keyDates: this.extractDeadlines(text),
      financialTerms: this.extractFinancialObligations(text)
    };
  }

  analyzeParagraph(text, clauseNumber) {
    const lower = text.toLowerCase();
    let category = "General Terms";
    let riskLevel = "Safe";
    let riskScore = 20;
    let redFlags = [];
    let plainEnglish = "";
    let lawyerAdvice = "";

    // Identification of categories & risk checks
    if (lower.includes("indemnif") || lower.includes("hold harmless") || lower.includes("liabilit")) {
      category = "Liability & Indemnity";
      if (lower.includes("unlimited") || lower.includes("capped at $100") || (lower.includes("contractor shall defend") && !lower.includes("mutual"))) {
        riskLevel = "High";
        riskScore = 90;
        redFlags.push("Extreme One-Sided Liability: Contractor bears unlimited liability while Client's liability is capped near zero.");
        plainEnglish = "If anything goes wrong, you pay all damages, legal fees, and liabilities with zero financial cap. Meanwhile, the other party caps their liability to almost nothing.";
        lawyerAdvice = "Request a mutual liability cap tied to fees paid (e.g., last 6 to 12 months) and carve out general damages.";
      } else if (lower.includes("mutual") || lower.includes("each party")) {
        riskLevel = "Safe";
        riskScore = 25;
        plainEnglish = "Both parties agree to fair mutual liability caps, protecting each other proportionally against gross negligence.";
        lawyerAdvice = "Standard fair commercial wording.";
      } else {
        riskLevel = "Medium";
        riskScore = 55;
        redFlags.push("Broad indemnification obligation without mutual protection.");
        plainEnglish = "You are obligated to compensate the other party for potential legal claims.";
        lawyerAdvice = "Propose making indemnification obligations reciprocal and limited to third-party claims.";
      }
    } else if (lower.includes("intellectual property") || lower.includes("assign") || lower.includes("works") || lower.includes("moral rights")) {
      category = "Intellectual Property";
      if (lower.includes("all works") || lower.includes("pre-existing") || lower.includes("waives all moral rights") || lower.includes("whether or not created on client's premises")) {
        riskLevel = "High";
        riskScore = 85;
        redFlags.push("Sweeping IP Transfer: Strips ownership of your background tools, pre-existing code, and outside work.");
        plainEnglish = "The client claims ownership of everything you make—even things you created before this contract or in your personal time outside office hours.";
        lawyerAdvice = "Exclude 'Pre-Existing Materials' and 'Background IP'; assign only bespoke deliverables upon full receipt of payment.";
      } else {
        riskLevel = "Safe";
        riskScore = 20;
        plainEnglish = "Ownership of newly created work is transferred upon receiving payment, while you keep your preexisting tools and code.";
        lawyerAdvice = "Ensure assignment is contingent upon full payment of fees.";
      }
    } else if (lower.includes("compete") || lower.includes("non-compete") || lower.includes("solicit")) {
      category = "Restrictive Covenants";
      if (lower.includes("covenant not to compete") || lower.includes("24 months") || lower.includes("any entity")) {
        riskLevel = "High";
        riskScore = 85;
        redFlags.push("Overly Broad Non-Compete: Restricts your ability to work in your industry for up to 2 years post-contract.");
        plainEnglish = "You cannot work with or consult for anyone in this entire industry for 24 months after finishing this job, severely limiting your earning potential.";
        lawyerAdvice = "Strike the non-compete entirely. In many jurisdictions (e.g., California/FTC rules) broad non-competes are unenforceable for contractors.";
      } else {
        riskLevel = "Medium";
        riskScore = 45;
        plainEnglish = "Restricts direct solicitation of employees, but leaves you free to work with third parties and competitors.";
        lawyerAdvice = "Ensure the non-solicitation only applies to employees you personally worked with.";
      }
    } else if (lower.includes("terminat")) {
      category = "Termination";
      if (lower.includes("immediately upon written notice") && lower.includes("without further obligation") && !lower.includes("either party")) {
        riskLevel = "High";
        riskScore = 75;
        redFlags.push("Asymmetrical Termination: Client can cancel anytime without paying; contractor locked in with 90-day notice.");
        plainEnglish = "The client can fire you instantly without paying future fees, but you are trapped and must give 90 days notice.";
        lawyerAdvice = "Make termination notice periods equal (e.g. 14 to 30 days) and ensure payment for all work performed to date.";
      } else {
        riskLevel = "Safe";
        riskScore = 25;
        plainEnglish = "Either party can exit the contract by providing fair 30-day advance written notice.";
        lawyerAdvice = "Standard balanced termination clause.";
      }
    } else if (lower.includes("net 90") || lower.includes("liquidated damages") || lower.includes("withhold 25%") || lower.includes("audit")) {
      category = "Payment & Audit";
      riskLevel = "High";
      riskScore = 80;
      redFlags.push("Extended Net-90 Payment & Punitive 25% liquidated damages for minor delays.");
      plainEnglish = "You won't get paid until 3 months after invoicing, and client can deduct 25% of your pay for a 1-day delay.";
      lawyerAdvice = "Push for Net 15 or Net 30, and replace liquidated damages with a standard good-faith delay notification clause.";
    } else if (lower.includes("personal guarantee") || lower.includes("personal assets") || lower.includes("7%") || lower.includes("triple net")) {
      category = "Financial Obligations & Guarantees";
      riskLevel = "High";
      riskScore = 85;
      redFlags.push("Personal Asset Exposure & Uncapped Escalation: Pierces corporate shield via personal guarantee.");
      plainEnglish = "Founders risk their personal savings, home, and assets if the company defaults, coupled with compounding annual rent hikes.";
      lawyerAdvice = "Seek a Good Guy Guarantee or a higher cash deposit in lieu of full personal liability.";
    } else if (lower.includes("arbitration") || lower.includes("waives all rights to trial") || lower.includes("class action waiver")) {
      category = "Dispute Resolution";
      riskLevel = "Medium";
      riskScore = 60;
      redFlags.push("Mandatory Arbitration & Class Action Waiver: Restricts public court access.");
      plainEnglish = "Any legal fights must happen behind closed doors via private arbitration, and you waive your right to join class actions.";
      lawyerAdvice = "Ensure arbitration venue is local or accessible, and include a prerequisite good-faith mediation step.";
    } else {
      category = "General Provisions";
      riskLevel = "Safe";
      riskScore = 20;
      plainEnglish = "Standard operational and legal definitions specifying the scope and operational guidelines.";
      lawyerAdvice = "Review against standard business expectations.";
    }

    // Identify title/heading if present
    const firstLine = text.split('\n')[0].replace(/^[0-9]+\.\s*/, '').trim();
    const title = firstLine.length < 60 ? firstLine : `Clause ${clauseNumber}`;

    return {
      clauseNumber,
      title,
      text,
      category,
      riskLevel,
      riskScore,
      redFlags,
      plainEnglish,
      lawyerAdvice
    };
  }

  extractDeadlines(text) {
    const deadlines = [];
    const regex = /(\d+\s*(?:days|calendar days|months|years|hours|weeks))/gi;
    let match;
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      while ((match = regex.exec(line)) !== null) {
        if (line.toLowerCase().includes("notice") || line.toLowerCase().includes("payment") || line.toLowerCase().includes("delay") || line.toLowerCase().includes("terminat")) {
          deadlines.push({
            timeframe: match[0],
            context: line.trim().slice(0, 140),
            lineNumber: index + 1
          });
          break;
        }
      }
    });
    return deadlines.slice(0, 6);
  }

  extractFinancialObligations(text) {
    const financials = [];
    const lines = text.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.includes("$") || trimmed.includes("%") || trimmed.toLowerCase().includes("net 90") || trimmed.toLowerCase().includes("net 30")) {
        financials.push(trimmed);
      }
    });
    return financials.slice(0, 5);
  }
}

window.pactumAnalyzer = new PactumAnalyzer();
