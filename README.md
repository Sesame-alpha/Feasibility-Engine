# Feasibility-Engine
# Department Budget Feasibility & Decision System

A complete front-end web application that helps organizations evaluate project proposals based on departmental budgets and profitability. It combines **Business Intelligence** (insights, charts) with **Systems Development** (decision logic, state management).

## 🚀 Features

- **Manual Budget Setup** – Admin can set and edit budgets per department (stored in localStorage).
- **CSV Upload** – Upload projects with department, project name, cost, and expected revenue.
- **Feasibility Decision Engine** – Automatically checks each project against:
  - Budget availability
  - Profitability (revenue > cost)
- **Dynamic Budget Update** – Approved projects deduct cost from the department’s budget; rejected projects leave budget unchanged.
- **Dashboard**:
  - Tables of approved & rejected projects with reasons
  - Insights & recommendations based on processed data
  - Charts: Budget usage per department, Profit vs Cost for approved projects
- **Persistent Storage** – Budgets remain after page reload (localStorage).
- **Modern UI** – Bootstrap 5 with custom dark purple/white/black theme, fully responsive.

## 🛠️ Technologies

- HTML5
- CSS3 (Bootstrap 5 + custom styles)
- JavaScript (ES6)
- Chart.js for visualizations
- LocalStorage for data persistence

## 🧪 How to Use

1. **Set Budgets**: Enter budget amounts for each department and click "Save Budgets". Default budgets: Finance $10,000, Marketing $8,000.
2. **Prepare CSV File**: Create a CSV with the following headers (case-insensitive):3. **Upload & Process**: Select the CSV file and click "Process & Decide". The system will evaluate each project, update budgets, and show results.
4. **Review Dashboard**: Approved/rejected tables, insights, and charts update automatically.
5. **Iterate**: You can change budgets, upload another CSV, and the system will recompute using the latest budgets.

## 📊 Example CSV

```csv
Department,Project,Cost,ExpectedRevenue
Marketing,Social Media Ads,2000,4500
Finance,Audit Software,5000,4000
Marketing,Influencer Campaign,4000,9000
IT,Cloud Migration,7000,12000
