/* ============================
   goals.js
   الأهداف و الميزانية السنوية
   ============================ */

/*
المهام:
1. حفظ الأهداف المالية (اسم الهدف + القيمة المطلوبة + ملاحظة).
2. حفظ البنود السنوية (اسم بند + القيمة السنوية).
3. حساب تكلفة كل بند سنوي بالشهر (تقسيم على 12).
4. عرض النتائج في شاشة الأهداف/الميزانية.
5. حساب نموذج 50/30/20 وتحويله لأرقام شيكل وعرضه.
6. زر "طبّق هذا التقسيم": حالياً فقط يعرض للمستخدم أنه تم التطبيق (إرشادي).
*/

const GoalsState = {
  goals: [], // [{id, goalName, goalTarget, goalNote}]
  yearlyItems: [], // [{id, yearlyName, yearlyAmount, monthlySplit}]
};

document.addEventListener("DOMContentLoaded", () => {
  const addGoalBtn = document.getElementById("add-goal-btn");
  const addYearlyBtn = document.getElementById("add-yearly-item-btn");

  const saveGoalBtn = document.getElementById("save-goal");
  const saveYearlyBtn = document.getElementById("save-yearly");

  const goalNameInput   = document.getElementById("goal-name");
  const goalTargetInput = document.getElementById("goal-target");
  const goalNoteInput   = document.getElementById("goal-note");
  const modalGoal       = document.getElementById("modal-goal");

  const yearlyNameInput   = document.getElementById("yearly-name");
  const yearlyAmountInput = document.getElementById("yearly-amount");
  const modalYearly       = document.getElementById("modal-yearly");

  const yearlyListEl  = document.getElementById("yearly-budget-list");
  const calcBtn532    = document.getElementById("calc-532-btn");
  const applyBtn532   = document.getElementById("apply-532-btn");
  const calcResultBox = document.getElementById("calc-532-result");

  // تحميل أولي للبيانات
  refreshGoalsAndYearlyUI();

  // حفظ هدف جديد
  if (saveGoalBtn) {
    saveGoalBtn.addEventListener("click", async () => {
      const gName = (goalNameInput.value || "").trim();
      const gTarget = Number(goalTargetInput.value || 0);
      const gNote = (goalNoteInput.value || "").trim();

      if (!gName || !gTarget) {
        alert("يرجى إدخال اسم الهدف و قيمته المطلوبة.");
        return;
      }

      const res = await addGoal({
        goalName: gName,
        goalTarget: gTarget,
        goalNote: gNote,
      });

      if (!res || !res.ok) {
        alert("فشل حفظ الهدف");
        return;
      }

      goalNameInput.value = "";
      goalTargetInput.value = "";
      goalNoteInput.value = "";

      if (modalGoal) modalGoal.classList.add("hidden");

      refreshGoalsAndYearlyUI();
    });
  }

  // حفظ بند سنوي
  if (saveYearlyBtn) {
    saveYearlyBtn.addEventListener("click", async () => {
      const yName = (yearlyNameInput.value || "").trim();
      const yAmount = Number(yearlyAmountInput.value || 0);

      if (!yName || !yAmount) {
        alert("يرجى إدخال اسم البند وقيمته السنوية.");
        return;
      }

      const res = await addYearlyItem({
        yearlyName: yName,
        yearlyAmount: yAmount,
      });

      if (!res || !res.ok) {
        alert("فشل حفظ البند السنوي");
        return;
      }

      yearlyNameInput.value = "";
      yearlyAmountInput.value = "";

      if (modalYearly) modalYearly.classList.add("hidden");

      refreshGoalsAndYearlyUI();
    });
  }

  // حساب 50/30/20
  if (calcBtn532) {
    calcBtn532.addEventListener("click", () => {
      // من وين نجيب إجمالي الدخل الشهري الحالي؟ 
      // في هالنسخة، رح نعمل call بسيط للحركات ونحسب دخل الشهر الحالي.
      calc532ForCurrentIncome(calcResultBox);
    });
  }

  // تطبيق 50/30/20 (شكلي/إرشادي)
  if (applyBtn532) {
    applyBtn532.addEventListener("click", () => {
      alert("تم تطبيق التوزيع الإرشادي 50/30/20 (لأغراض عرض الميزانية).");
    });
  }

  // تحميل البيانات من GAS وإعادة الرسم
  async function refreshGoalsAndYearlyUI() {
    const res = await fetchGoalsAndYearly();
    if (!res || !res.ok) {
      GoalsState.goals = [];
      GoalsState.yearlyItems = [];
    } else {
      GoalsState.goals = Array.isArray(res.goals) ? res.goals : [];
      GoalsState.yearlyItems = Array.isArray(res.yearlyItems)
        ? res.yearlyItems.map(item => {
            const yearlyAmountNum = Number(item.yearlyAmount || 0);
            return {
              ...item,
              yearlyAmount: yearlyAmountNum,
              monthlySplit: (yearlyAmountNum / 12).toFixed(2),
            };
          })
        : [];
    }

    renderYearlyItemsList();
  }

  // عرض البنود السنوية
  function renderYearlyItemsList() {
    if (!yearlyListEl) return;
    yearlyListEl.innerHTML = "";

    if (!GoalsState.yearlyItems.length) {
      const empty = document.createElement("div");
      empty.className = "tiny-note";
      empty.textContent = "لا توجد بنود سنوية بعد.";
      yearlyListEl.appendChild(empty);
      return;
    }

    GoalsState.yearlyItems.forEach(item => {
      /*
      item: {
        id, yearlyName, yearlyAmount, monthlySplit
      }
      */
      const row = document.createElement("div");
      row.className = "list-row";

      const header = document.createElement("div");
      header.className = "list-row-header";

      const leftSide = document.createElement("div");
      leftSide.textContent = `${item.yearlyName} - ${item.yearlyAmount} شيكل/سنة`;

      const rightSide = document.createElement("div");
      rightSide.textContent = `تكلفة شهرية: ${item.monthlySplit} شيكل`;

      header.appendChild(leftSide);
      header.appendChild(rightSide);

      row.appendChild(header);
      yearlyListEl.appendChild(row);
    });
  }

  /*
   حساب توزيع 50/30/20:
   - نجيب إجمالي الدخل من هذا الشهر (TransactionsState أو من GAS).
   - نعرض:
     50% احتياجات
     30% كماليات
     20% ادخار
  */
  async function calc532ForCurrentIncome(resultBoxEl) {
    if (!resultBoxEl) return;

    // نجيب آخر الحركات من GAS
    const res = await fetchTransactions();
    if (!res || !res.ok || !Array.isArray(res.transactions)) {
      resultBoxEl.textContent = "لا يمكن حساب الآن.";
      return;
    }

    // احسب إجمالي الدخل للشهر الحالي فقط
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0..11

    let totalIncomeThisMonth = 0;

    res.transactions.forEach(tx => {
      if (tx.type !== "income") return;
      if (!tx.timestamp) return;
      const d = new Date(tx.timestamp);
      if (d.getFullYear() === y && d.getMonth() === m) {
        totalIncomeThisMonth += Number(tx.amount || 0);
      }
    });

    const needs  = totalIncomeThisMonth * 0.5;
    const wants  = totalIncomeThisMonth * 0.3;
    const save   = totalIncomeThisMonth * 0.2;

    resultBoxEl.innerHTML =
      "إجمالي الدخل لهذا الشهر: " + totalIncomeThisMonth.toFixed(2) + " شيكل<br>" +
      "الضروريات (50%): " + needs.toFixed(2) + " شيكل<br>" +
      "الكماليات (30%): " + wants.toFixed(2) + " شيكل<br>" +
      "الادخار (20%): " + save.toFixed(2) + " شيكل";
  }
});

console.log("goals.js جاهز ✅");
