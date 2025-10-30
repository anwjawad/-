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

document.addEventListener("DOMContentLoaded", () => {
  const chartModeSel = document.getElementById("chart-mode");
  const chartValSel  = document.getElementById("chart-value-mode");

  async function updateChart() {
    const txRes = await fetchTransactions();
    if (!txRes || !txRes.ok || !Array.isArray(txRes.transactions)) {
      drawPieChart([], [], "لا توجد بيانات");
      return;
    }

    const mode = chartModeSel ? chartModeSel.value : "all"; // all | income | expense
    const valMode = chartValSel ? chartValSel.value : "percent"; // percent | amount

    // نحسب مجموع المبالغ لكل فئة بناءً على mode
    const { labels, amounts } = calcCategoryTotals(txRes.transactions, mode);

    if (!labels.length) {
      drawPieChart([], [], "لا توجد بيانات");
      return;
    }

    // لو المستخدم اختار percent، حوّل القيم لنِسَب
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

  // استمع لأي تغيير على الإعدادات
  if (chartModeSel) {
    chartModeSel.addEventListener("change", updateChart);
  }
  if (chartValSel) {
    chartValSel.addEventListener("change", updateChart);
  }

  // أول رسم
  updateChart();
});

/*
تحسب التوتال لكل فئة
mode:
 - "all": خد دخل + مصروف
 - "income": فقط دخل
 - "expense": فقط مصروف
*/
function calcCategoryTotals(transactions, mode) {
  const mapTotals = {}; // { "أكل": 1200, "بنزين": 300, ... }

  transactions.forEach(tx => {
    if (mode === "income" && tx.type !== "income") return;
    if (mode === "expense" && tx.type !== "expense") return;

    const amount = Number(tx.amount || 0);
    if (!amount) return;

    const cats = Array.isArray(tx.categories) ? tx.categories : [];
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
    // نعرض نص placeholder فوق مكان الرسم (أسلوب بسيط)
    ctx.getContext("2d").clearRect(0, 0, ctx.width, ctx.height);
    // ما في نص بالرسم نفسه، بس الواجهة عندك بتكون فاضية
    return;
  }

  // إذا فيه مخطط قديم امسحه
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
          // Chart.js رح يعطي ألوان تلقائياً لو ما حددنا،
          // وهذا مناسب لطلبك (ما طلبت ألوان ثيم مخصصة للمخطط نفسه).
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
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

console.log("charts.js جاهز ✅");
