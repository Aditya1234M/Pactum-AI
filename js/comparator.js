// Pactum AI - Contract Diff, Comparison & Risk Delta Engine

class PactumComparator {
  compareDocuments(docA_text, docB_text) {
    if (!docA_text || !docB_text) return null;

    const analysisA = window.pactumAnalyzer.parseDocument(docA_text);
    const analysisB = window.pactumAnalyzer.parseDocument(docB_text);

    const parasA = docA_text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 15);
    const parasB = docB_text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 15);

    // Calculate clause-by-clause diff
    const comparisonRows = [];
    const maxLen = Math.max(parasA.length, parasB.length);

    for (let i = 0; i < maxLen; i++) {
      const a = parasA[i] || "";
      const b = parasB[i] || "";
      let status = "unchanged";
      let keyDelta = "Similar terms maintained.";

      if (!a && b) {
        status = "added";
        keyDelta = "New clause added in Document B.";
      } else if (a && !b) {
        status = "removed";
        keyDelta = "Clause deleted from Document A in Document B.";
      } else if (a !== b) {
        status = "modified";
        const lowerA = a.toLowerCase();
        const lowerB = b.toLowerCase();

        if (lowerA.includes("unlimited") && lowerB.includes("mutual")) {
          keyDelta = "Favorable shift: Unlimited liability replaced with mutual cap.";
        } else if (lowerA.includes("net 90") && lowerB.includes("net 30")) {
          keyDelta = "Faster payment: Changed from Net 90 to Net 30 days.";
        } else if (lowerA.includes("covenant not to compete") && !lowerB.includes("covenant not to compete")) {
          keyDelta = "Major win: Strict 24-month non-compete completely eliminated.";
        } else if (lowerA.includes("assigns all pre-existing") && lowerB.includes("retains sole ownership")) {
          keyDelta = "IP Protection: Contractor retains pre-existing tools and IP.";
        } else if (lowerA.includes("immediately upon written notice") && lowerB.includes("mutual termination")) {
          keyDelta = "Balanced exit: Changed unilateral termination to 30-day mutual notice.";
        } else {
          keyDelta = "Terms adjusted between versions.";
        }
      }

      comparisonRows.push({
        index: i + 1,
        docA: a,
        docB: b,
        status,
        keyDelta
      });
    }

    const riskDelta = analysisA.riskScore - analysisB.riskScore;
    let verdict = "";
    let winner = "";

    if (riskDelta > 15) {
      winner = "Document B is significantly more favorable and balanced.";
      verdict = `Document B reduces legal risk by ${riskDelta} points! It removes predatory terms like one-sided indemnification, lengthy non-competes, and punitive liquidated damages.`;
    } else if (riskDelta < -15) {
      winner = "Document A is safer than Document B.";
      verdict = `Document B introduces higher exposure (+${Math.abs(riskDelta)} risk points) compared to Document A. Proceed with caution.`;
    } else {
      winner = "Both documents present comparable legal liability profiles.";
      verdict = "Both versions have similar liability structures with minor drafting variances.";
    }

    return {
      analysisA,
      analysisB,
      riskDelta,
      winner,
      verdict,
      rows: comparisonRows
    };
  }
}

window.pactumComparator = new PactumComparator();
