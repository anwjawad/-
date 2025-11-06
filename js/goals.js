/* ============================
   goals.js
   الأهداف والميزانية السنوية
   ============================ */

/* ========= Utilities ========= */

function normalizeGoal(row) {
  return {
    id: (row?.id ?? "").toString(),
    goalName: (row?.goalName ?? "").toString().trim(),
    goalTarget: Number(row?.goalTarget ?? 0),
    goalNote: (row?.goalNote ?? "").toString().trim(),
  };
}

function normalizeYearly(row) {
  return {
    id: (row?.id ?? "").toString(),
    yearlyName: (row?.yearlyName ?? "").toString().trim(),
    yearlyAmount: Number(row?.yearlyAmount ?? 0),
  };
}

function fmtMoney(n) {
  const v = Number(n || 0);
  return v.toFixed(2);
}

/* ========= State ========= */

const GoalsState = {
  goals: [],
  yearly: [],
  els: {
    goalsList: null,
    yearlyList: null,
    yearlyMonthlyCost: null,

    // goal inputs
    goalNameInput: null,
    goalTargetInput: null,
    goalNoteInput: null,
    saveGoalBtn: null,

    // yearly inputs
    yearlyNameInput: null,
    yearlyAmountInput: null,
    saveYearlyBtn: null,

    // 50/30/20
    calc532Btn: null,
    apply532Btn: null,
    calc532Result: null,
  },
};

/* ========= Renderers ========= */

function renderGoalsList() {
  const el = GoalsState.els.goalsList;
  if (!el) return;

  el.innerHTML = "";

  if (!GoalsState.goals.length) {
    const empty = document.createElement("div");
    empty.className = "tiny-note";
    empty.textContent = "لا توجد أهداف بعد.";
    el.appendChild(empty);
    return;
  }

  GoalsState.goals.forEach(g => {
    const row = document.createElement("div");
    row.className = "list-row";

    const title = document.createElement("div");
    title.className = "list-row-main";
    title.textContent = g.goalName || "(هدف بدون اسم)";

    const sub = document.createElement("div");
    sub.className = "list-row-sub";
    const target = document.createElement("div");
    target.textContent = "القيمة المستهدفة: " + fmtMoney(g.goalTarget) + " شيكل";
    sub.appendChild(target);

    if (g.goalNote) {
      const note = document.createElement("div");
      note.textContent = "ملاحظة: " + g.goalNote;
      sub.appendChild(note);
    }

    row.appendChild(title);
    row.appendChild(sub);
    el.appendChild(row);
  });
}

function renderYearlyList() {
  const listEl = GoalsState.els.yearlyList;
  const costEl = GoalsState.els.yearlyMonthlyCost;

  if (listEl) {
    listEl.innerHTML = "";
    if (!GoalsState.yearly.length) {
      const empty = document.createElement("div");
      empty.className = "tiny-note";
      empty.textContent = "لا توجد بنود سنوية بعد.";
      listEl.appendChild(empty);
    } else {
      GoalsState.yearly.forEach(y => {
        const row = document.createElement("div");
        row.className = "list-row";

        const title = document.createElement("div");
        title.className = "list-row-main";
        title.textContent = y.yearlyName || "(بند سنوي)";

        const sub = document.createElement("div");
        sub.className = "list-row-sub";
        const amt = document.createElement("div");
        amt.textContent = "المبلغ السنوي: " + fmtMoney(y.yearlyAmount) + " شيكل";
        sub.appendChild(amt);

        row.appendChild(title);
        row.appendChild(sub);
        listEl.appendChild(row);
      });
    }
  }

  // تكلفة شهرية = مجموع السنوي / 12
  if (costEl) {
    const sumYearly = GoalsState.yearly.reduce((acc, y) => acc + Number(y.yearlyAmount || 0), 0);
    const perMonth = sumYearly / 12;
    costEl.textContent = "تكلفة شهرية " + fmtMoney(perMonth) + " شيكل";
  }
}

/* ========= Main refresh ========= */

async function refreshGoalsAndYearlyUI() {
  // fetchGoalsAndYearly() موجودة في gas-api.js (نسخة JSONP)
  const res = await fetchGoalsAndYearly();

  const rawGoals = Array.isArray(res?.goals) ? res.goals : [];
  // GAS يرجع yearlyItems؛ ندعم أيضًا اسم 'yearly' لو نسخة قديمة من الواجهة
  const rawYearly = Array.isArray(res?.yearlyItems)
    ? res.yearlyItems
    : (Array.isArray(res?.yearly) ? res.yearly : []);

  GoalsState.goals = rawGoals.map(normalizeGoal);
  GoalsState.yearly = rawYearly.map(normalizeYearly);

  renderGoalsList();
  renderYearlyList();
}

/* ========= 50/30/20 ========= */

async function calc532Into(resultBoxEl) {
  if (!resultBoxEl) return;
  // نحسب من دخل هذا الشهر عبر Transactions
  const r = await fetchTransactions();
  const arr = (r && r.ok && Array.isArray(r.transactions)) ? r.transactions : [];

  // الشهر الحالي
  const now = new Date();
  const ym = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2, "0");

  const incomesThisMonth = arr.filter(tx => {
    if (tx.type !== "income") return false;
    const ts = tx.timestamp || tx.time || tx.ts;
    if (!ts) return false;
    const date = new Date(ts);
    if (isNaN(date.getTime())) return false;
    return (date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth());
  });

  const totalIncome = incomesThisMonth.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

  const needs  = totalIncome * 0.5;
  const wants  = totalIncome * 0.3;
  const save   = totalIncome * 0.2;

  resultBoxEl.innerHTML =
    "إجمالي الدخل لهذا الشهر: " + fmtMoney(totalIncome) + " شيكل<br>" +
    "الضروريات (50%): " + fmtMoney(needs) + " شيكل<br>" +
    "الكماليات (30%): " + fmtMoney(wants) + " شيكل<br>" +
    "الادخار (20%): " + fmtMoney(save) + " شيكل";
}

/* ========= Boot ========= */

document.addEventListener("DOMContentLoaded", () => {
  // عناصر DOM (عدّل IDs هنا إذا كانت مختلفة عندك)
  GoalsState.els.goalsList         = document.getElementById("goals-list");
  GoalsState.els.yearlyList        = document.getElementById("yearly-list");
  GoalsState.els.yearlyMonthlyCost = document.getElementById("yearly-monthly-cost");

  GoalsState.els.goalNameInput   = document.getElementById("goal-name");
  GoalsState.els.goalTargetInput = document.getElementById("goal-target");
  GoalsState.els.goalNoteInput   = document.getElementById("goal-note");
  GoalsState.els.saveGoalBtn     = document.getElementById("save-goal");

  GoalsState.els.yearlyNameInput   = document.getElementById("yearly-name");
  GoalsState.els.yearlyAmountInput = document.getElementById("yearly-amount");
  GoalsState.els.saveYearlyBtn     = document.getElementById("save-yearly");

  GoalsState.els.calc532Btn    = document.getElementById("calc-532-btn");
  GoalsState.els.apply532Btn   = document.getElementById("apply-532-btn");
  GoalsState.els.calc532Result = document.getElementById("calc-532-result");

  // تحميل أولي
  refreshGoalsAndYearlyUI();

  /* حفظ هدف جديد */
  if (GoalsState.els.saveGoalBtn) {
    GoalsState.els.saveGoalBtn.addEventListener("click", async () => {
      const gName   = (GoalsState.els.goalNameInput?.value || "").trim();
      const gTarget = Number(GoalsState.els.goalTargetInput?.value || 0);
      const gNote   = (GoalsState.els.goalNoteInput?.value || "").trim();

      if (!gName || !gTarget || gTarget <= 0) {
        alert("فضلاً أدخل اسم هدف وقيمة صحيحة");
        return;
      }

      const res = await addGoal({ goalName: gName, goalTarget: gTarget, goalNote: gNote });
      if (!res || !res.ok) {
        alert("حصل خطأ في حفظ الهدف");
        return;
      }

      // تحديث فوري للمشهد
      GoalsState.goals.unshift(normalizeGoal({ id: res.id, goalName: gName, goalTarget: gTarget, goalNote: gNote }));
      renderGoalsList();

      // إعادة جلب للتأكد من التزامن
      refreshGoalsAndYearlyUI();

      // تفريغ الحقول
      if (GoalsState.els.goalNameInput) GoalsState.els.goalNameInput.value = "";
      if (GoalsState.els.goalTargetInput) GoalsState.els.goalTargetInput.value = "";
      if (GoalsState.els.goalNoteInput) GoalsState.els.goalNoteInput.value = "";
    });
  }

  /* إضافة بند سنوي */
  if (GoalsState.els.saveYearlyBtn) {
    GoalsState.els.saveYearlyBtn.addEventListener("click", async () => {
      const yName   = (GoalsState.els.yearlyNameInput?.value || "").trim();
      const yAmount = Number(GoalsState.els.yearlyAmountInput?.value || 0);

      if (!yName || !yAmount || yAmount <= 0) {
        alert("فضلاً أدخل اسم بند سنوي وقيمة صحيحة");
        return;
      }

      const res = await addYearlyItem({ yearlyName: yName, yearlyAmount: yAmount });
      if (!res || !res.ok) {
        alert("حصل خطأ في حفظ البند السنوي");
        return;
      }

      // تحديث فوري للمشهد
      GoalsState.yearly.unshift(normalizeYearly({ id: res.id, yearlyName: yName, yearlyAmount: yAmount }));
      renderYearlyList();

      // إعادة جلب للتأكد من التزامن
      refreshGoalsAndYearlyUI();

      // تفريغ الحقول
      if (GoalsState.els.yearlyNameInput) GoalsState.els.yearlyNameInput.value = "";
      if (GoalsState.els.yearlyAmountInput) GoalsState.els.yearlyAmountInput.value = "";
    });
  }

  /* 50/30/20 */
  if (GoalsState.els.calc532Btn && GoalsState.els.calc532Result) {
    GoalsState.els.calc532Btn.addEventListener("click", () => {
      calc532Into(GoalsState.els.calc532Result);
    });
  }
  if (GoalsState.els.apply532Btn) {
    GoalsState.els.apply532Btn.addEventListener("click", () => {
      alert("تم تطبيق التقسيم (إرشادي).");
    });
  }
});

console.log("goals.js جاهز ✅");
