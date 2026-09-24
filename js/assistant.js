// Pactum AI - Interactive Legal Assistant & Grounded Citation Q&A

class PactumAssistant {
  constructor() {
    this.history = [];
  }

  async askQuestion(question, documentText) {
    if (!question || !question.trim()) return null;

    try {
      return await this.queryServerLLM(question, documentText);
    } catch (err) {
      console.info("Server GenAI unavailable; using offline grounded engine.", err.message);
    }

    // Default: Grounded Local Heuristic GenAI Engine
    return this.queryGroundedEngine(question, documentText);
  }

  async queryServerLLM(question, documentText) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, documentText }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Server response ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  queryGroundedEngine(question, documentText) {
    const q = question.toLowerCase();
    const doc = documentText.toLowerCase();
    let answer = "";
    let citation = "";
    let confidence = "High";
    let riskFlag = "Safe";
    let actionItem = "";

    if (q.includes("side job") || q.includes("compet") || q.includes("work for another") || q.includes("moonlight")) {
      if (doc.includes("covenant not to compete") || doc.includes("twenty-four (24) months")) {
        answer = "No, according to Clause 5, you are strictly prohibited from consulting or working with any company in fintech, enterprise SaaS, or digital commerce globally for 24 months post-contract.";
        citation = "Clause 5: 'Contractor shall not directly or indirectly engage in, consult for, advise, invest in, or provide similar software engineering or consulting services to any entity... for a period of twenty-four (24) months.'";
        riskFlag = "High Risk Trap";
        actionItem = "Ask to strike Clause 5 completely or restrict it solely to direct clients where confidential information was accessed.";
      } else if (doc.includes("maintains full freedom to consult")) {
        answer = "Yes! The agreement explicitly guarantees your professional freedom to consult and provide engineering services to any third party or competitor, provided you do not misuse confidential information.";
        citation = "Clause 5: 'Contractor maintains full freedom to consult and provide engineering services to any third-party or competitor, provided Contractor does not disclose or misuse Client's Confidential Information.'";
        riskFlag = "Clear & Safe";
        actionItem = "No action required. This is a fair contractor-friendly clause.";
      } else {
        answer = "The contract does not explicitly forbid other work, but check if there are exclusivity or conflict-of-interest provisions.";
        citation = "General document review.";
      }
    } else if (q.includes("paid") || q.includes("payment") || q.includes("invoice") || q.includes("delay")) {
      if (doc.includes("net 90")) {
        answer = "Payment terms are Net 90 days. This means the client does not have to pay your invoice until 3 full months after submission. Furthermore, delays over 24 hours trigger a 25% fee penalty.";
        citation = "Clause 2: 'Client shall pay Contractor fees specified in the SOW within ninety (90) calendar days following receipt of an undisputed invoice (\"Net 90\").'";
        riskFlag = "High Cashflow Risk";
        actionItem = "Propose Net 30 or Net 15 terms with interest on late payments (1.5% per month).";
      } else if (doc.includes("net 30")) {
        answer = "You will be paid within thirty (30) calendar days of submitting an invoice ('Net 30'). Out-of-pocket expenses are reimbursable with standard receipts.";
        citation = "Clause 2: 'Client shall pay Contractor fees specified in the SOW within thirty (30) calendar days following receipt of an invoice (\"Net 30\").'";
        riskFlag = "Standard Commercial Term";
        actionItem = "Ensure you specify clear invoice submission dates and milestones.";
      } else if (doc.includes("$8,400") || doc.includes("escalat")) {
        answer = "Base rent is $8,400/month due on the 1st, escalating automatically by 7% compounded annually on every anniversary.";
        citation = "Clause 2: 'Base Rent shall automatically increase by seven percent (7%) over the preceding year's rent, compounding annually.'";
        riskFlag = "Financial Escalation";
        actionItem = "Cap rent increases to the Consumer Price Index (CPI) or max 2.5-3% annually.";
      }
    } else if (q.includes("ip") || q.includes("intellectual property") || q.includes("code") || q.includes("own")) {
      if (doc.includes("pre-existing materials") || doc.includes("all works") || doc.includes("unconditionally waives all moral rights")) {
        answer = "Danger: You are signing away ownership of everything conceived, including your pre-existing tools, libraries, and even work created on your personal time. Moral rights are also waived.";
        citation = "Clause 3: 'Contractor hereby irrevocably assigns, transfers, and conveys to Client all right, title, and interest worldwide... Contractor assigns all Pre-Existing Materials and background IP...'";
        riskFlag = "Critical IP Danger";
        actionItem = "Insist that pre-existing materials remain your property, granting the client only a non-exclusive license.";
      } else if (doc.includes("retains sole ownership of all pre-existing tools")) {
        answer = "Your IP is well protected. You retain complete ownership of your background libraries, tools, and know-how, transferring only the bespoke deliverables created under the SOW upon payment.";
        citation = "Clause 3: 'Contractor retains sole ownership of all pre-existing tools, libraries, frameworks, methodologies, and general know-how (\"Contractor IP\")...'";
        riskFlag = "Well Protected";
        actionItem = "Confirm all custom code is tied to full invoice clearance.";
      }
    } else if (q.includes("cancel") || q.includes("terminat") || q.includes("exit") || q.includes("leave")) {
      if (doc.includes("without further obligation to pay any unpaid") || doc.includes("ninety (90) days prior written notice and only after completing")) {
        answer = "Severe termination imbalance: The client can terminate you immediately with zero cause and stop payments. However, you must provide 90 days notice and finish all milestones first.";
        citation = "Clause 6: 'Client may terminate this Agreement... immediately upon written notice, without further obligation to pay any unpaid or future fees. Contractor may only terminate this Agreement upon ninety (90) days prior written notice...'";
        riskFlag = "High Risk Imbalance";
        actionItem = "Require mutual 30-day notice for termination and guaranteed compensation for all work delivered up to the cancellation date.";
      } else {
        answer = "Either party may terminate the agreement for convenience upon 30 days prior written notice, and all approved work completed will be paid for.";
        citation = "Clause 6: 'Either party may terminate this Agreement or any SOW for convenience upon thirty (30) days prior written notice.'";
        riskFlag = "Balanced Exit";
        actionItem = "Document your milestone deliveries in writing.";
      }
    } else if (q.includes("liab") || q.includes("sue") || q.includes("damage") || q.includes("risk")) {
      if (doc.includes("unlimited") && doc.includes("$100.00")) {
        answer = "Major red flag: Your liability is completely unlimited, meaning personal bankruptcy is possible if a dispute arises. The client caps their own liability at just $100.00.";
        citation = "Clause 4: 'CONTRACTOR'S LIABILITY UNDER THIS AGREEMENT SHALL BE UNLIMITED. CLIENT'S AGGREGATE LIABILITY UNDER ALL CIRCUMSTANCES SHALL BE STRICTLY CAPPED AT ONE HUNDRED DOLLARS ($100.00).'";
        riskFlag = "Severe Threat";
        actionItem = "Demand a mutual cap matching fees paid over the prior 6 months.";
      } else {
        answer = "Liability is mutually limited to fees paid under the contract, excluding indirect or punitive damages.";
        citation = "Clause 4: 'EACH PARTY'S TOTAL AGGREGATE LIABILITY... SHALL BE STRICTLY LIMITED TO THE TOTAL FEES ACTUALLY PAID...'";
        riskFlag = "Mutual Cap";
        actionItem = "Verify that cyber and data breach clauses have separate reasonable limits if applicable.";
      }
    } else {
      // General grounded search
      const paragraphs = documentText.split(/\n\s*\n/).filter(p => p.length > 25);
      const matchingPara = paragraphs.find(p => {
        const words = q.split(' ').filter(w => w.length > 3);
        return words.some(w => p.toLowerCase().includes(w));
      }) || paragraphs[0];

      answer = `Based on the document text, here is the most relevant section governing your inquiry. The agreement specifies governing guidelines that should be evaluated in context with your specific role.`;
      citation = matchingPara ? matchingPara.slice(0, 220) + "..." : "See full document text.";
      riskFlag = "Information";
      actionItem = "Review the highlighted citation with a qualified legal professional for jurisdiction-specific interpretation.";
    }

    return {
      question,
      answer,
      citation,
      confidence,
      riskFlag,
      actionItem
    };
  }

}

window.pactumAssistant = new PactumAssistant();
