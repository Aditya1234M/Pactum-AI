// Pactum AI - Main Application Controller & UI Coordinator

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const docInputText = document.getElementById("docInputText");
  const fileUploadInput = document.getElementById("fileUploadInput");
  const runAnalyzeBtn = document.getElementById("runAnalyzeBtn");
  const clearTextBtn = document.getElementById("clearTextBtn");
  const docStats = document.getElementById("docStats");
  const sampleButtons = document.getElementById("sampleButtons");

  // Metrics
  const metricRiskScore = document.getElementById("metricRiskScore");
  const metricRiskGrade = document.getElementById("metricRiskGrade");
  const metricRedFlags = document.getElementById("metricRedFlags");
  const metricSafeClauses = document.getElementById("metricSafeClauses");
  const metricTotalClauses = document.getElementById("metricTotalClauses");
  const clausesContainer = document.getElementById("clausesContainer");
  const clauseFilters = document.getElementById("clauseFilters");

  // Compare Tab
  const compareDocA = document.getElementById("compareDocA");
  const compareDocB = document.getElementById("compareDocB");
  const runCompareBtn = document.getElementById("runCompareBtn");
  const compareWinnerTitle = document.getElementById("compareWinnerTitle");
  const compareDeltaBadge = document.getElementById("compareDeltaBadge");
  const compareVerdictText = document.getElementById("compareVerdictText");
  const diffTableBody = document.getElementById("diffTableBody");
  const docARiskBadge = document.getElementById("docARiskBadge");
  const docBRiskBadge = document.getElementById("docBRiskBadge");

  // Chat Tab
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendChatBtn = document.getElementById("sendChatBtn");

  // PrepKit Tab
  const checklistContainer = document.getElementById("checklistContainer");
  const playbookContainer = document.getElementById("playbookContainer");
  const lawyerQuestionsList = document.getElementById("lawyerQuestionsList");
  const printChecklistBtn = document.getElementById("printChecklistBtn");

  // Modals & Actions
  const openSettingsBtn = document.getElementById("openSettingsBtn");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const apiProviderSelect = document.getElementById("apiProviderSelect");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const exportReportBtn = document.getElementById("exportReportBtn");

  let currentParsedDoc = null;
  let activeFilter = "all";

  // 1. Initial State: Load Default Sample
  function loadSample(sampleKey) {
    const sample = window.LEGAL_SAMPLES[sampleKey];
    if (!sample) return;

    docInputText.value = sample.text;
    
    // Also preload compare tab
    if (sampleKey === "consulting_harsh") {
      compareDocA.value = window.LEGAL_SAMPLES.consulting_harsh.text;
      compareDocB.value = window.LEGAL_SAMPLES.consulting_balanced.text;
    } else {
      compareDocA.value = sample.text;
      compareDocB.value = window.LEGAL_SAMPLES.consulting_balanced.text;
    }

    runAnalysis();
    runComparison();

    // Update active chip state
    document.querySelectorAll(".chip-btn[data-sample]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.sample === sampleKey);
    });

    showToast(`Loaded sample: ${sample.title}`);
  }

  // 2. Navigation Tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(btn.dataset.tab);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  // 3. Document Analysis Runner
  function runAnalysis() {
    const text = docInputText.value.trim();
    if (!text) {
      showToast("Please enter or upload a legal document first.", "warning");
      return;
    }

    const parsed = window.pactumAnalyzer.parseDocument(text);
    if (!parsed) return;
    currentParsedDoc = parsed;
    updateDocumentStats(text, parsed);

    // Update Metrics
    metricRiskScore.textContent = `${parsed.riskScore} / 100`;
    metricRiskGrade.textContent = parsed.riskGrade;
    metricRedFlags.textContent = `${parsed.highRiskCount} Traps`;
    metricSafeClauses.textContent = `${parsed.safeCount} Clauses`;
    metricTotalClauses.textContent = `${parsed.totalClauses}`;

    // Color code risk score card
    const riskCard = metricRiskScore.closest(".metric-card");
    const riskIcon = document.getElementById("riskScoreIcon");
    if (parsed.riskScore >= 70) {
      riskIcon.className = "metric-icon-box danger";
      riskIcon.textContent = "🔥";
    } else if (parsed.riskScore >= 40) {
      riskIcon.className = "metric-icon-box warning";
      riskIcon.textContent = "⚠️";
    } else {
      riskIcon.className = "metric-icon-box success";
      riskIcon.textContent = "🛡️";
    }

    renderClauses();
    renderPrepKit();
  }

  // 4. Render Clauses Matrix
  function renderClauses() {
    if (!currentParsedDoc) return;
    clausesContainer.innerHTML = "";

    const filtered = currentParsedDoc.clauses.filter(c => {
      if (activeFilter === "all") return true;
      return c.riskLevel === activeFilter;
    });

    if (filtered.length === 0) {
      clausesContainer.innerHTML = `<div style="text-align: center; padding: 32px; color: var(--text-muted);">No clauses found for the selected filter '${activeFilter}'.</div>`;
      return;
    }

    filtered.forEach(clause => {
      const card = document.createElement("div");
      card.className = `clause-card risk-${clause.riskLevel.toLowerCase()}`;

      const badgeClass = clause.riskLevel === 'High' ? 'badge-high' : clause.riskLevel === 'Medium' ? 'badge-medium' : 'badge-safe';

      let redFlagsHtml = "";
      if (clause.redFlags.length > 0) {
        redFlagsHtml = `
          <div class="red-flags-alert">
            <div class="red-flags-title">⚠️ Identified Hidden Traps / Red Flags:</div>
            <div class="red-flags-content">${clause.redFlags.map(escapeHtml).join("<br>")}</div>
          </div>
        `;
      }

      let lawyerTipHtml = "";
      if (clause.lawyerAdvice) {
        lawyerTipHtml = `
          <div class="lawyer-tip-box">
            <span>💡</span>
            <div class="lawyer-tip-text"><strong>Attorney Negotiation Advice:</strong> ${escapeHtml(clause.lawyerAdvice)}</div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="clause-top">
          <div class="clause-title-wrap">
            <h4 style="font-size: 1.05rem; font-weight: 700;">${escapeHtml(clause.title)}</h4>
            <span class="clause-badge ${badgeClass}">${clause.riskLevel} Risk (${clause.riskScore}/100)</span>
          </div>
          <span class="category-tag">${escapeHtml(clause.category)}</span>
        </div>

        <div class="clause-raw-text">"${escapeHtml(clause.text)}"</div>

        <div class="plain-english-box">
          <div class="box-title-sm">✨ Plain English Translation (What it actually means):</div>
          <p class="plain-english-content">${escapeHtml(clause.plainEnglish)}</p>
        </div>

        ${redFlagsHtml}
        ${lawyerTipHtml}
      `;

      clausesContainer.appendChild(card);
    });
  }

  // 5. Clause Filter buttons
  clauseFilters.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      clauseFilters.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderClauses();
    });
  });

  // 6. Contract Comparison Runner
  function runComparison() {
    const textA = compareDocA.value.trim();
    const textB = compareDocB.value.trim();

    if (!textA || !textB) {
      showToast("Please provide both Document A and Document B to compare.", "warning");
      return;
    }

    const diffResult = window.pactumComparator.compareDocuments(textA, textB);
    if (!diffResult) return;

    // Update Verdict Card
    compareWinnerTitle.textContent = diffResult.winner;
    compareVerdictText.textContent = diffResult.verdict;

    const deltaSign = diffResult.riskDelta >= 0 ? `-${diffResult.riskDelta}` : `+${Math.abs(diffResult.riskDelta)}`;
    compareDeltaBadge.textContent = `${deltaSign} Risk Points`;
    compareDeltaBadge.className = diffResult.riskDelta >= 0 ? "clause-badge badge-safe" : "clause-badge badge-high";

    docARiskBadge.textContent = `Score: ${diffResult.analysisA.riskScore} (${diffResult.analysisA.riskGrade})`;
    docARiskBadge.className = riskBadgeClass(diffResult.analysisA.riskScore);

    docBRiskBadge.textContent = `Score: ${diffResult.analysisB.riskScore} (${diffResult.analysisB.riskGrade})`;
    docBRiskBadge.className = riskBadgeClass(diffResult.analysisB.riskScore);

    // Populate Table
    diffTableBody.innerHTML = "";
    diffResult.rows.forEach(row => {
      const tr = document.createElement("tr");
      tr.className = `diff-row-${row.status}`;

      const statusBadge = row.status === "added" 
        ? `<span class="clause-badge badge-safe">+ Added</span>`
        : row.status === "removed"
        ? `<span class="clause-badge badge-high">- Removed</span>`
        : row.status === "modified"
        ? `<span class="clause-badge badge-medium">✎ Modified</span>`
        : `<span class="clause-badge badge-safe">✓ Identical</span>`;

      tr.innerHTML = `
        <td style="font-weight: 700; color: #94a3b8;">${row.index}</td>
        <td><div style="max-height: 120px; overflow-y: auto; font-size: 0.82rem; line-height: 1.5;">${escapeHtml(row.docA) || "<em>[No corresponding clause]</em>"}</div></td>
        <td><div style="max-height: 120px; overflow-y: auto; font-size: 0.82rem; line-height: 1.5;">${escapeHtml(row.docB) || "<em>[Clause removed]</em>"}</div></td>
        <td>${statusBadge}</td>
        <td style="font-size: 0.8rem; font-weight: 500; color: #e2e8f0;">${row.keyDelta}</td>
      `;

      diffTableBody.appendChild(tr);
    });
  }

  // 7. Interactive Q&A Assistant
  async function handleUserQuestion(qText) {
    const question = qText || chatInput.value.trim();
    if (!question) return;

    chatInput.value = "";

    // Append user message
    appendChatMessage("user", question);

    // Typing indicator
    const typingId = appendChatMessage("ai", "Analyzing contract text with grounded legal citations...", true);

    try {
      const activeDocText = docInputText.value;
      const response = await window.pactumAssistant.askQuestion(question, activeDocText);

      // Remove typing indicator and replace
      removeChatMessage(typingId);

      const aiContent = `
        <p>${escapeHtml(response.answer).replace(/\n/g, "<br>")}</p>
        <div class="citation-card">
          <div style="font-weight: 700; font-size: 0.72rem; color: #818cf8; text-transform: uppercase; margin-bottom: 2px;">📌 Exact Document Quote:</div>
          <em>${escapeHtml(response.citation)}</em>
        </div>
        ${response.actionItem ? `<div style="margin-top: 8px; font-size: 0.82rem; color: #a7f3d0;"><strong>Recommended Action:</strong> ${escapeHtml(response.actionItem)}</div>` : ''}
      `;

      appendChatMessage("ai", aiContent);
    } catch (err) {
      removeChatMessage(typingId);
      appendChatMessage("ai", "An error occurred while analyzing the document: " + err.message);
    }
  }

  function appendChatMessage(sender, content, isTyping = false) {
    const msgId = "msg-" + Date.now();
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${sender}`;
    msgDiv.id = msgId;

    const avatar = sender === "ai" ? `<div class="chat-avatar ai">🤖</div>` : `<div class="chat-avatar user-avatar">👤</div>`;

    msgDiv.innerHTML = `
      ${avatar}
      <div class="chat-bubble" ${isTyping ? 'style="font-style: italic; color: #94a3b8;"' : ''}>
        ${content}
      </div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgId;
  }

  function removeChatMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  // Quick Questions
  document.querySelectorAll(".chat-quick-questions .chip-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      handleUserQuestion(btn.dataset.question);
    });
  });

  sendChatBtn.addEventListener("click", () => handleUserQuestion());
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleUserQuestion();
  });

  // 8. Render Actionable Prep Kit & Checklist
  function renderPrepKit() {
    if (!currentParsedDoc) return;

    // Checklist
    const checklist = window.pactumPrepKit.generateChecklist(currentParsedDoc);
    checklistContainer.innerHTML = "";
    checklist.forEach(item => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "checklist-item";
      itemDiv.innerHTML = `
        <input type="checkbox" class="checklist-checkbox">
        <div class="checklist-content">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; gap: 12px;">
            <span class="checklist-title">${escapeHtml(item.title)}</span>
            <span class="clause-badge ${item.priority === 'High' ? 'badge-high' : 'badge-safe'}">${item.badge}</span>
          </div>
          <p class="checklist-desc">${escapeHtml(item.description)}</p>
        </div>
      `;
      checklistContainer.appendChild(itemDiv);
      const checklistKey = `pactum_check_${item.title}`;
      const checkbox = itemDiv.querySelector(".checklist-checkbox");
      checkbox.checked = localStorage.getItem(checklistKey) === "done";
      itemDiv.classList.toggle("is-complete", checkbox.checked);
      checkbox.addEventListener("change", () => {
        localStorage.setItem(checklistKey, checkbox.checked ? "done" : "open");
        itemDiv.classList.toggle("is-complete", checkbox.checked);
      });
    });

    // Negotiation Playbook
    const playbook = window.pactumPrepKit.generateNegotiationPlaybook(currentParsedDoc);
    playbookContainer.innerHTML = "";
    playbook.slice(0, 3).forEach(p => {
      const pDiv = document.createElement("div");
      pDiv.className = "playbook-card";
      pDiv.innerHTML = `
        <div class="playbook-clause-title">
          <span>${escapeHtml(p.clauseTitle)}</span>
          <button class="copy-btn" type="button" data-redline="${escapeAttr(p.proposedRedline)}">Copy Redline</button>
        </div>
        <div style="font-size: 0.78rem; color: #94a3b8; margin-bottom: 4px;">Commercial Strategy: ${escapeHtml(p.leverageArgument)}</div>
        <div class="redline-box"><strong>Proposed Counter-Language:</strong><br>${escapeHtml(p.proposedRedline)}</div>
      `;
      playbookContainer.appendChild(pDiv);
      pDiv.querySelector(".copy-btn").addEventListener("click", async (event) => {
        await navigator.clipboard.writeText(event.currentTarget.dataset.redline);
        showToast("Counter-clause copied to clipboard!");
      });
    });

    // Top 5 Lawyer Questions
    const prepSheet = window.pactumPrepKit.generateLawyerPrepSheet(currentParsedDoc);
    lawyerQuestionsList.innerHTML = "";
    prepSheet.topQuestionsForLawyer.forEach(q => {
      const li = document.createElement("li");
      li.textContent = q;
      lawyerQuestionsList.appendChild(li);
    });
  }

  // 9. File Upload
  fileUploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      docInputText.value = event.target.result;
      runAnalysis();
      showToast(`Successfully uploaded ${file.name}!`);
    };
    reader.readAsText(file);
  });

  // 10. Sample Buttons
  sampleButtons.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip-btn[data-sample]");
    if (btn) {
      loadSample(btn.dataset.sample);
    }
  });

  // 11. Clear text
  docInputText.addEventListener("input", () => updateDocumentStats(docInputText.value, null));

  clearTextBtn.addEventListener("click", () => {
    docInputText.value = "";
    currentParsedDoc = null;
    metricRiskScore.textContent = "—";
    metricRiskGrade.textContent = "Awaiting document";
    metricRedFlags.textContent = "—";
    metricSafeClauses.textContent = "—";
    metricTotalClauses.textContent = "—";
    clausesContainer.innerHTML = `<div class="empty-state"><strong>No document loaded</strong><span>Paste a contract or load a sample to begin the review.</span></div>`;
    checklistContainer.innerHTML = `<div class="empty-state"><strong>Prep kit is waiting</strong><span>Run a contract review to generate obligations and redlines.</span></div>`;
    playbookContainer.innerHTML = `<div class="empty-state"><strong>No redlines yet</strong><span>Risk-aware negotiation language will appear after review.</span></div>`;
    lawyerQuestionsList.innerHTML = "";
    updateDocumentStats("", null);
    showToast("Input text cleared.");
  });

  runAnalyzeBtn.addEventListener("click", runAnalysis);
  runCompareBtn.addEventListener("click", runComparison);

  // 12. Settings Modal
  openSettingsBtn.addEventListener("click", () => {
    apiProviderSelect.value = localStorage.getItem("pactum_api_provider") || "gemini";
    apiKeyInput.value = localStorage.getItem("pactum_api_key") || "";
    settingsModal.classList.add("active");
  });

  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.remove("active");
  });

  saveSettingsBtn.addEventListener("click", () => {
    const prov = apiProviderSelect.value;
    const key = apiKeyInput.value.trim();
    window.pactumAssistant.setCredentials(prov, key);
    settingsModal.classList.remove("active");
    showToast("Settings updated successfully!");
  });

  // 13. Export Report (Print or Markdown download)
  exportReportBtn.addEventListener("click", () => {
    if (!currentParsedDoc) {
      showToast("Analyze a document before exporting.", "warning");
      return;
    }

    const reportMarkdown = `# PACTUM AI - LEGAL INTELLIGENCE AUDIT BRIEF
Generated: ${new Date().toLocaleDateString()}
Document Health Grade: ${currentParsedDoc.riskGrade} (Risk Score: ${currentParsedDoc.riskScore}/100)

## SUMMARY METRICS
- Total Clauses Analyzed: ${currentParsedDoc.totalClauses}
- High Risk Traps: ${currentParsedDoc.highRiskCount}
- Moderate Terms: ${currentParsedDoc.medRiskCount}
- Balanced Provisions: ${currentParsedDoc.safeCount}

## CLAUSE BREAKDOWN
${currentParsedDoc.clauses.map(c => `### ${c.title} [${c.riskLevel} Risk]
- Original text: ${c.text}
- Plain English: ${c.plainEnglish}
${c.redFlags.length ? `- Red Flags: ${c.redFlags.join("; ")}` : ''}
${c.lawyerAdvice ? `- Attorney Advice: ${c.lawyerAdvice}` : ''}
`).join("\n\n")}

---
DISCLAIMER: Pactum AI provides educational information and document analysis, not formal legal advice. Consult a licensed attorney for binding counsel.
`;

    const blob = new Blob([reportMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Pactum_AI_Legal_Audit_Report.md";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Legal Audit Report downloaded as Markdown!");
  });

  printChecklistBtn.addEventListener("click", () => {
    window.print();
  });

  // Helper Functions
  function showToast(msg, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>${type === 'warning' ? '⚠️' : '✨'}</span> <span>${escapeHtml(msg)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }
  window.pactumShowToast = showToast;

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    if (!str) return "";
    return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
  }

  function updateDocumentStats(text, parsed) {
    if (!docStats) return;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    docStats.textContent = parsed
      ? `${words.toLocaleString()} words · ${parsed.totalClauses} clauses reviewed`
      : `${words.toLocaleString()} words · Ready for review`;
  }

  function riskBadgeClass(score) {
    if (score >= 70) return "clause-badge badge-high";
    if (score >= 40) return "clause-badge badge-medium";
    return "clause-badge badge-safe";
  }

  // Load Initial Default Contract
  loadSample("consulting_harsh");
});
