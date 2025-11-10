/* ============================
   charts.js
   الرسم البياني (Pie Chart)
   ============================ */

/*
المهام:
1. رسم مخطط دائري Pie يعرض توزيع حسب الفئات.
2. المستخدم يختار:
   - chart-mode: all / income / expense
   - chart-value-mode: percent / amount
3. نجيب آخر الحركات من الشيت ونحسب الإجماليات حسب الفئات.

ملاحظة:
- لازم يكون <canvas id="main-pie-chart"> موجود (وهو موجود بالـHTML).
- نعتمد على Chart.js (تم تضمينه في index.html).
*/

let mainPieChart = null;

const chartModeSel = document.getElementById("chart-mode");
const chartValSel  = document.getElementById("chart-value-mode");

if (chartModeSel) chartModeSel.addEventListener("change", () => updateChart());
if (chartValSel)  chartValSel.addEventListener("change", () => updateChart());

/*
تجهيز بيانات الفئات (labels + totals) حسب نوع التصفية:
- all: كل شيء
- income: دخل فقط
- expense: مصروف فقط
*/
function calcCategoryTotals(transactions, mode) {
  const mapTotals = {}; // { "أكل": 1200, "بنزين": 300, ... }

  transactions.forEach(tx => {
    if (mode === "income" && tx.type !== "income") return;
    if (mode === "expense" && tx.type !== "expense") return;

    const amount = Number(tx.amount || 0);
    if (!amount) return;

    // دعم إرجاع الفئات كنص من GAS (مثل: "أكل, بنزين") أو Array
    const cats = Array.isArray(tx.categories)
      ? tx.categories
      : parseCategoriesInput(String(tx.categories || ""));

    cats.forEach(cat => {
      if (!mapTotals[cat]) mapTotals[cat] = 0;
      mapTotals[cat] += amount;
    });
  });

  const labels = Object.keys(mapTotals);
  const amounts = labels.map(lbl => mapTotals[lbl]);

  return { labels, amounts };
}

/*
ملء كرت "ملخص سريع" للشهر الحالي
*/
function renderSummary(transactions){
  const box = document.getElementById("summary-lines");
  if (!box) return;
  let income = 0, expense = 0;
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();

  transactions.forEach(tx => {
    if (!tx.timestamp) return;
    const d = new Date(tx.timestamp);
    if (d.getFullYear() === y && d.getMonth() === m) {
      const amt = Number(tx.amount || 0);
      if (tx.type === "income")  income  += amt;
      if (tx.type === "expense") expense += amt;
    }
  });

  const net = income - expense;
  box.innerHTML = `
    <div>إجمالي الدخل: <b>${income.toFixed(2)}</b></div>
    <div>إجمالي المصروف: <b>${expense.toFixed(2)}</b></div>
    <div>الصافي: <b>${net.toFixed(2)}</b></div>
  `;
}

/*
رسم/تحديث الـPie Chart باستخدام Chart.js
*/
function drawPieChart(labels, values, placeholderText) {
  const ctx = document.getElementById("main-pie-chart");
  if (!ctx) return;

  // لو ما في بيانات
  if (!labels.length) {
    if (mainPieChart) {
      mainPieChart.destroy();
      mainPieChart = null;
    }
    // نعرض نص placeholder فوق مكان الرسم (حل بسيط)
    const holder = document.getElementById("chart-placeholder");
    if (holder) {
      holder.textContent = placeholderText || "لا توجد بيانات";
      holder.style.display = "block";
    }
    return;
  }

  const holder = document.getElementById("chart-placeholder");
  if (holder) holder.style.display = "none";

  if (mainPieChart) {
    mainPieChart.destroy();
    mainPieChart = null;
  }

  mainPieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values,
          // الألوان تعتمد على الثيم (لو عندك CSS variables)
          backgroundColor: [
            getComputedStyle(document.documentElement).getPropertyValue("--c1") || "#4dc9f6",
            getComputedStyle(document.documentElement).getPropertyValue("--c2") || "#f67019",
            getComputedStyle(document.documentElement).getPropertyValue("--c3") || "#f53794",
            getComputedStyle(document.documentElement).getPropertyValue("--c4") || "#537bc4",
            getComputedStyle(document.documentElement).getPropertyValue("--c5") || "#acc236",
            getComputedStyle(document.documentElement).getPropertyValue("--c6") || "#166a8f",
            getComputedStyle(document.documentElement).getPropertyValue("--c7") || "#00a950",
            getComputedStyle(document.documentElement).getPropertyValue("--c8") || "#58595b",
            getComputedStyle(document.documentElement).getPropertyValue("--c9") || "#8549ba",
          ],
          borderWidth: 0
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            // لون النص حسب الثيم
            color: getComputedStyle(document.documentElement)
              .getPropertyValue("--text-main") || "#fff",
          },
        },
        title: {
          display: false,
          text: "",
        },
      },
    },
  });
}

async function updateChart() {
    const txRes = await fetchTransactions();
    if (!txRes || !txRes.ok || !Array.isArray(txRes.transactions)) {
      drawPieChart([], [], "لا توجد بيانات");
      renderSummary([]);
      return;
    }

    // ملخص سريع للشهر الحالي
    renderSummary(txRes.transactions);

    const mode = chartModeSel ? chartModeSel.value : "all"; // all | income | expense
    const valMode = chartValSel ? chartValSel.value : "percent"; // percent | amount

    // نحسب مجموع المبالغ لكل فئة بناءً على mode
    const { labels, amounts } = calcCategoryTotals(txRes.transactions, mode);

    if (!labels.length) {
      drawPieChart([], [], "لا توجد بيانات");
      return;
    }

    // التحويل لنِسَب مئوية عند الحاجة
    let finalAmounts = amounts.slice();
    let displayLabels = labels.slice();

    if (valMode === "percent") {
      const total = amounts.reduce((a, b) => a + b, 0);
      if (total > 0) {
        finalAmounts = amounts.map(v => (v / total) * 100);
      }

      // عدّل الليبل ليبين النسبة تقريبياً
      displayLabels = labels.map((lbl, i) => {
        const pct = finalAmounts[i].toFixed(1) + "%";
        return `${lbl} (${pct})`;
      });
    } else {
      // valMode === "amount"
      displayLabels = labels.map((lbl, i) => {
        return `${lbl} (${amounts[i].toFixed(2)} شيكل)`;
      });
    }

    drawPieChart(displayLabels, finalAmounts, "");
}

document.addEventListener("DOMContentLoaded", () => {
  updateChart();
});

console.log("charts.js جاهز ✅");
