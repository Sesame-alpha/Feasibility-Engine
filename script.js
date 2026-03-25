 // ----- Initial Data & State -----
let departmentBudgets = {};

// Load from localStorage or set default
function loadBudgets() {
  const stored = localStorage.getItem('deptBudgets');
  if (stored) {
    departmentBudgets = JSON.parse(stored);
  } else {
    departmentBudgets = { Finance: 10000, Marketing: 8000 };
    localStorage.setItem('deptBudgets', JSON.stringify(departmentBudgets));
  }
  updateBudgetUI();
}

// Update budget input fields and summary
function updateBudgetUI() {
  const container = document.getElementById('budget-inputs');
  container.innerHTML = '';
  let summaryHtml = '';
  for (const [dept, budget] of Object.entries(departmentBudgets)) {
    container.innerHTML += `
      <div class="col-md-4">
        <label class="form-label">${dept} Budget ($)</label>
        <input type="number" class="form-control budget-input bg-black text-white border-purple" data-dept="${dept}" value="${budget}">
      </div>
    `;
    summaryHtml += `<span class="badge bg-purple me-2">${dept}: $${budget}</span>`;
  }
  document.getElementById('budget-summary').innerHTML = summaryHtml;
}

// Save budgets from input fields
function saveBudgets() {
  const inputs = document.querySelectorAll('.budget-input');
  inputs.forEach(input => {
    const dept = input.getAttribute('data-dept');
    const newBudget = parseFloat(input.value);
    if (!isNaN(newBudget) && newBudget >= 0) {
      departmentBudgets[dept] = newBudget;
    }
  });
  localStorage.setItem('deptBudgets', JSON.stringify(departmentBudgets));
  updateBudgetUI();
  alert('Budgets saved!');
  // Optionally reset processed data to reflect new budgets
  resetProcessedData();
}

function resetProcessedData() {
  // Clear approved/rejected tables and insights
  document.getElementById('approved-table').innerHTML = '';
  document.getElementById('rejected-table').innerHTML = '';
  document.getElementById('insights-area').innerHTML = '<p class="text-muted">No data processed yet.</p>';
  // Clear charts? They will be updated when new data is processed.
  if (window.budgetChart) window.budgetChart.destroy();
  if (window.profitChart) window.profitChart.destroy();
}

// ----- CSV Parsing & Decision Engine -----
let approvedProjects = [];
let rejectedProjects = [];

function processCSV(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const csvText = e.target.result;
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    // Validate headers
    if (headers.length < 4 || headers[0] !== 'department' || headers[1] !== 'project' || headers[2] !== 'cost' || headers[3] !== 'expectedrevenue') {
      alert('Invalid CSV format. Headers must be: Department,Project,Cost,ExpectedRevenue');
      return;
    }

    const projects = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length >= 4) {
        projects.push({
          department: row[0].trim(),
          project: row[1].trim(),
          cost: parseFloat(row[2]),
          revenue: parseFloat(row[3])
        });
      }
    }
    runFeasibility(projects);
  };
  reader.readAsText(file);
}

function runFeasibility(projects) {
  // Reset previous session
  approvedProjects = [];
  rejectedProjects = [];
  // Work on a copy of budgets
  let remainingBudgets = { ...departmentBudgets };

  for (let p of projects) {
    const budget = remainingBudgets[p.department] || 0;
    let status, reason;

    if (p.cost > budget) {
      status = "Rejected";
      reason = "Over budget";
    } else if (p.revenue > p.cost) {
      status = "Approved";
      reason = "Profitable";
      // Update budget for this department
      remainingBudgets[p.department] -= p.cost;
    } else {
      status = "Rejected";
      reason = "Not profitable";
    }

    const result = {
      ...p,
      status,
      reason,
      profit: p.revenue - p.cost
    };

    if (status === "Approved") {
      approvedProjects.push(result);
    } else {
      rejectedProjects.push(result);
    }
  }

  // Update global budgets with remaining amounts
  departmentBudgets = remainingBudgets;
  localStorage.setItem('deptBudgets', JSON.stringify(departmentBudgets));
  updateBudgetUI();

  // Render dashboard
  renderTables();
  generateInsights();
  renderCharts();
}

function renderTables() {
  const approvedTbody = document.getElementById('approved-table');
  approvedTbody.innerHTML = '';
  approvedProjects.forEach(p => {
    const row = `<tr>
      <td>${p.department}</td><td>${p.project}</td><td>$${p.cost}</td><td>$${p.revenue}</td><td>$${p.profit}</td>
    </tr>`;
    approvedTbody.innerHTML += row;
  });

  const rejectedTbody = document.getElementById('rejected-table');
  rejectedTbody.innerHTML = '';
  rejectedProjects.forEach(p => {
    const row = `<tr>
      <td>${p.department}</td><td>${p.project}</td><td>$${p.cost}</td><td>$${p.revenue}</td><td>${p.reason}</td>
    </tr>`;
    rejectedTbody.innerHTML += row;
  });
}

function generateInsights() {
  const insightsDiv = document.getElementById('insights-area');
  let insightsHtml = '<div class="row">';

  // Insights: profitability by department
  const deptProfit = {};
  approvedProjects.forEach(p => {
    if (!deptProfit[p.department]) deptProfit[p.department] = 0;
    deptProfit[p.department] += p.profit;
  });

  if (Object.keys(deptProfit).length > 0) {
    insightsHtml += '<div class="col-md-6"><h5 class="text-purple">📈 Profitability Insights</h5><ul class="list-unstyled">';
    for (let [dept, profit] of Object.entries(deptProfit)) {
      const color = profit > 0 ? 'text-success' : 'text-danger';
      insightsHtml += `<li class="${color}">${dept}: ${profit > 0 ? '+' : ''}$${profit} total profit</li>`;
    }
    insightsHtml += '</ul></div>';
  }

  // Recommendations: departments with many budget rejections
  const deptRejectedBudget = rejectedProjects.filter(p => p.reason === "Over budget");
  const rejectCount = {};
  deptRejectedBudget.forEach(p => {
    rejectCount[p.department] = (rejectCount[p.department] || 0) + 1;
  });
  if (Object.keys(rejectCount).length > 0) {
    insightsHtml += '<div class="col-md-6"><h5 class="text-purple">💡 Recommendations</h5><ul class="list-unstyled">';
    for (let [dept, count] of Object.entries(rejectCount)) {
      insightsHtml += `<li>🔹 Consider increasing budget for <strong>${dept}</strong> – ${count} project(s) rejected due to budget.</li>`;
    }
    insightsHtml += '</ul></div>';
  }

  if (approvedProjects.length === 0 && rejectedProjects.length === 0) {
    insightsHtml = '<p class="text-muted">No projects processed yet.</p>';
  } else {
    insightsHtml += '</div>';
  }
  insightsDiv.innerHTML = insightsHtml;
}

function renderCharts() {
  // Destroy existing charts if any
  if (window.budgetChart) window.budgetChart.destroy();
  if (window.profitChart) window.profitChart.destroy();

  // Budget Usage Chart
  const depts = Object.keys(departmentBudgets);
  const originalBudgets = depts.map(dept => {
    const stored = localStorage.getItem('deptBudgets');
    const original = JSON.parse(stored)[dept];
    return original;
  });
  const remainingBudgets = depts.map(dept => departmentBudgets[dept]);
  const usedBudgets = depts.map((dept, idx) => originalBudgets[idx] - remainingBudgets[idx]);

  const budgetCtx = document.getElementById('budgetChart').getContext('2d');
  window.budgetChart = new Chart(budgetCtx, {
    type: 'bar',
    data: {
      labels: depts,
      datasets: [
        {
          label: 'Used Budget',
          data: usedBudgets,
          backgroundColor: '#9b4dff',
        },
        {
          label: 'Remaining Budget',
          data: remainingBudgets,
          backgroundColor: '#6a0dad',
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: 'white' } }
      },
      scales: {
        x: { ticks: { color: 'white' } },
        y: { ticks: { color: 'white' } }
      }
    }
  });

  // Profit vs Cost for Approved Projects
  const approvedNames = approvedProjects.map(p => p.project);
  const costs = approvedProjects.map(p => p.cost);
  const profits = approvedProjects.map(p => p.profit);

  const profitCtx = document.getElementById('profitChart').getContext('2d');
  window.profitChart = new Chart(profitCtx, {
    type: 'bar',
    data: {
      labels: approvedNames,
      datasets: [
        {
          label: 'Cost',
          data: costs,
          backgroundColor: '#ff6b6b',
        },
        {
          label: 'Profit',
          data: profits,
          backgroundColor: '#51cf66',
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: 'white' } }
      },
      scales: {
        x: { ticks: { color: 'white' } },
        y: { ticks: { color: 'white' } }
      }
    }
  });
}

// ----- Event Listeners & Initialization -----
document.addEventListener('DOMContentLoaded', () => {
  loadBudgets();

  document.getElementById('save-budgets').addEventListener('click', saveBudgets);
  document.getElementById('process-btn').addEventListener('click', () => {
    const fileInput = document.getElementById('csvFile');
    if (fileInput.files.length === 0) {
      alert('Please select a CSV file.');
      return;
    }
    processCSV(fileInput.files[0]);
  });
});
