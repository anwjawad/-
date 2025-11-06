/* ============================
   transactions.js
   إدارة الدخل والمصروف
   ============================ */



function normalizeCategories(input) {
  if (Array.isArray(input)) {
    return input
      .map(x => (x == null ? "" : String(x).trim()))
      .filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(/[,،]/)
      .map(s => s.trim())
      .filter(Boolean);
  }
  if (input == null) return [];
  return [String(input).trim()].filter(Boolean);
}

/*
هذا الملف يمسك:
1. قراءة آخر الحركات من الشيت وعرضها في شاشة "آخر الحركات".
2. إضافة دخل (من modal-income).
3. إضافة مصروف (من modal-expense).
4. حذف حركة.

كل حركة لازم تروح على Google Sheets فوراً.
ما في تخزين محلي دائم.
*/

const TransactionsState = {
  list: [], // آخر الحركات (رح تجي من الشيت), كل عنصر: {id, type, categories[], amount, note, source, timestamp}
};

document.addEventListener("DOMContentLoaded", () => {
  const saveIncomeBtn = document.getElementById("save-income");
  const saveExpenseBtn = document.getElementById("save-expense");
  const transactionsListEl = document.getElementById("transactions-list");

  // أزرار / مدخلات الدخل
  const incomeSourceInput = document.getElementById("income-source");
  const incomeCategoryInput = document.getElementById("income-category");
  const incomeAmountInput = document.getElementById("income-amount");
  const incomeNoteInput = document.getElementById("income-note");

  // أزرار / مدخلات المصروف
  const expenseCategoryInput = document.getElementById("expense-category");
  const expenseAmountInput = document.getElementById("expense-amount");
  const expenseNoteInput = document.getElementById("expense-note");

  // تحميل أولي للحركات لما ندخل
  refreshTransactionsUI();

  // لما أضغط "حفظ الدخل"
  if (saveIncomeBtn) {
    saveIncomeBtn.addEventListener("click", async () => {
      const source = incomeSourceInput.value.trim();
      const catsStr = incomeCategoryInput.value.trim();
      const catsArr = parseCategoriesInput(catsStr);
      const amount = Number(incomeAmountInput.value || 0);
      const note = incomeNoteInput.value.trim();

      if (!amount || amount <= 0) {
        alert("فضلاً أدخل مبلغ دخل صحيح");
        return;
      }

      // تأكد إضافة الفئات لقائمة الفئات الدائمة
      ensureCategoriesFromTransaction(catsArr);

      // سجل الحركة عند GAS
      const res = await addTransaction({
        type: "income",
        categories: catsArr,
        amount,
        note,
        source,
      });

      if (!res || !res.ok) {
        alert("خطأ في حفظ الدخل");
        return;
      }

      // امسح الحقول
      incomeSourceInput.value = "";
      incomeCategoryInput.value = "";
      incomeAmountInput.value = "";
      incomeNoteInput.value = "";

      // سكّر المودال
      const modalIncome = document.getElementById("modal-income");
      if (modalIncome) {
        modalIncome.classList.add("hidden");
      }

      // حدّث الواجهة
      refreshTransactionsUI();
    });
  }

  // لما أضغط "حفظ المصروف"
  if (saveExpenseBtn) {
    saveExpenseBtn.addEventListener("click", async () => {
      const catsStr = expenseCategoryInput.value.trim();
      const catsArr = parseCategoriesInput(catsStr);
      const amount = Number(expenseAmountInput.value || 0);
      const note = expenseNoteInput.value.trim();

      if (!amount || amount <= 0) {
        alert("فضلاً أدخل مبلغ مصروف صحيح");
        return;
      }

      ensureCategoriesFromTransaction(catsArr);

      const res = await addTransaction({
        type: "expense",
        categories: catsArr,
        amount,
        note,
        source: "", // المصروف ما يحتاج مصدر دخل
      });

      if (!res || !res.ok) {
        alert("خطأ في حفظ المصروف");
        return;
      }

      // نظف الحقول
      expenseCategoryInput.value = "";
      expenseAmountInput.value = "";
      expenseNoteInput.value = "";

      // سكّر المودال
      const modalExpense = document.getElementById("modal-expense");
      if (modalExpense) {
        modalExpense.classList.add("hidden");
      }

      refreshTransactionsUI();
    });
  }

  // عرض آخر الحركات
  async function refreshTransactionsUI() {
    const res = await fetchTransactions();
    if (!res || !res.ok || !Array.isArray(res.transactions)) {
      console.warn("فشل تحميل الحركات");
      TransactionsState.list = [];
    } else {
      TransactionsState.list = res.transactions.map(tx => ({
      ...tx,
      categories: normalizeCategories(tx.categories),
    }));
    }

    renderTransactionsList();
  }

  // رسم القائمة على الشاشة
  function renderTransactionsList() {
    if (!transactionsListEl) return;

    // فضّي
    transactionsListEl.innerHTML = "";

    if (!TransactionsState.list.length) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "tiny-note";
      emptyDiv.textContent = "لا توجد حركات بعد.";
      transactionsListEl.appendChild(emptyDiv);
      return;
    }

    // لكل حركة
    TransactionsState.list.forEach(tx => {
      /*
      tx expected:
      {
        id: "abc123",
        type: "income" | "expense",
        categories: ["أكل","بنزين"],
        amount: 150,
        note: "غداء",
        source: "الراتب الأساسي" (للدخل فقط),
        timestamp: "2025-10-30T10:00:00Z"
      }
      */

      const row = document.createElement("div");
      row.className = "list-row";

      const header = document.createElement("div");
      header.className = "list-row-header";

      const leftSide = document.createElement("div");
      const rightSide = document.createElement("div");

      // نوع الحركة + المبلغ
      leftSide.textContent =
        (tx.type === "income" ? "دخل" : "مصروف") +
        " - " +
        (tx.amount || 0) +
        " شيكل";

      // التاريخ (نكتفي بعرضه كنص)
      rightSide.textContent = formatTimestamp(tx.timestamp);

      header.appendChild(leftSide);
      header.appendChild(rightSide);

      const sub = document.createElement("div");
      sub.className = "list-row-sub";

      // الفئات
      const catDiv = document.createElement("div");
      const cats = normalizeCategories(tx.categories);
      catDiv.textContent = "فئات: " + (cats.length ? cats.join(", ") : "—");
      sub.appendChild(catDiv);

      // المصدر (للدخل)
      if (tx.type === "income" && tx.source) {
        const srcDiv = document.createElement("div");
        srcDiv.textContent = "المصدر: " + tx.source;
        sub.appendChild(srcDiv);
      }

      // الملاحظة
      if (tx.note) {
        const noteDiv = document.createElement("div");
        noteDiv.textContent = "ملاحظة: " + tx.note;
        sub.appendChild(noteDiv);
      }

      // أزرار الإجراءات
      const actions = document.createElement("div");
      actions.className = "list-row-actions";

      const delBtn = document.createElement("button");
      delBtn.className = "row-delete-btn";
      delBtn.textContent = "حذف";

      delBtn.addEventListener("click", async () => {
        // شوف إعداد التأكيد
        if (AppState.preferences.deleteConfirm === "on") {
          const sure = confirm("هل أنت متأكد أنك تريد الحذف؟");
          if (!sure) return;
        }

        // استدعاء الحذف
        const delRes = await deleteTransaction(tx.id);
        if (!delRes || !delRes.ok) {
          alert("لم يتم الحذف");
          return;
        }

        // تحديث القائمة
        refreshTransactionsUI();
      });

      actions.appendChild(delBtn);

      // ركّب العناصر
      row.appendChild(header);
      row.appendChild(sub);
      row.appendChild(actions);

      transactionsListEl.appendChild(row);
    });
  }

  // تنسيق التاريخ/الوقت بشكل بسيط للعرض
  function formatTimestamp(ts) {
    if (!ts) return "";
    // رح نعرضه بشكل "YYYY-MM-DD HH:mm"
    try {
      const d = new Date(ts);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${y}-${m}-${day} ${hh}:${mm}`;
    } catch (e) {
      return ts;
    }
  }
});

console.log("transactions.js جاهز ✅");
