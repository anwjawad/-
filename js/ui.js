/* ============================
   ui.js
   إدارة الواجهة، المودالات، والشاشات
   ============================ */

/*
هذا الملف يمسك:
- فتح مودالات (الدخل، المصروف، الفاتورة، الهدف، البند السنوي).
- إغلاق المودالات.
- التحكم بإظهار/إخفاء تنبيه الفاتورة الإجباري.
*/

document.addEventListener("DOMContentLoaded", () => {
  // مراجع لعناصر المودالات
  const modalIncome   = document.getElementById("modal-income");
  const modalExpense  = document.getElementById("modal-expense");
  const modalBill     = document.getElementById("modal-bill");
  const modalGoal     = document.getElementById("modal-goal");
  const modalYearly   = document.getElementById("modal-yearly");

  // أزرار فتح المودالات
  const addIncomeBtn      = document.getElementById("add-income-btn");
  const addExpenseBtn     = document.getElementById("add-expense-btn");
  const addBillBtn        = document.getElementById("add-bill-btn");
  const addGoalBtn        = document.getElementById("add-goal-btn");
  const addYearlyItemBtn  = document.getElementById("add-yearly-item-btn");

  // overlay تبع الفاتورة الإجباري
  const billAlertOverlay  = document.getElementById("bill-alert-overlay");
  const billAlertPaidBtn  = document.getElementById("bill-alert-paid");
  const billAlertNotPaidBtn = document.getElementById("bill-alert-notpaid");
  const billAlertRemindBtn  = document.getElementById("bill-alert-remind");

  // دوال عامة لفتح / إغلاق مودال
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("hidden");
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add("hidden");
  }

  // ربط الأزرار الكبيرة (+ دخل / - مصروف)
  if (addIncomeBtn && modalIncome) {
    addIncomeBtn.addEventListener("click", () => {
      openModal(modalIncome);
    });
  }

  if (addExpenseBtn && modalExpense) {
    addExpenseBtn.addEventListener("click", () => {
      openModal(modalExpense);
    });
  }

  // ربط زر إضافة فاتورة
  if (addBillBtn && modalBill) {
    addBillBtn.addEventListener("click", () => {
      openModal(modalBill);
    });
  }

  // ربط زر إضافة هدف مالي
  if (addGoalBtn && modalGoal) {
    addGoalBtn.addEventListener("click", () => {
      openModal(modalGoal);
    });
  }

  // ربط زر إضافة بند سنوي
  if (addYearlyItemBtn && modalYearly) {
    addYearlyItemBtn.addEventListener("click", () => {
      openModal(modalYearly);
    });
  }

  // زر الإغلاق (X) لأي مودال
  const closeButtons = document.querySelectorAll(".modal-close-btn");
  closeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-close");
      const modalEl = document.getElementById(modalId);
      closeModal(modalEl);
    });
  });

  // كليك خارج الصندوق يغلق المودال
  [modalIncome, modalExpense, modalBill, modalGoal, modalYearly].forEach(m => {
    if (!m) return;
    m.addEventListener("click", (e) => {
      // لو كبس على الخلفية وليس على الصندوق الداخلي
      if (e.target === m) {
        closeModal(m);
      }
    });
  });

  // ===========================
  //   تنبيه الفاتورة الإجباري
  // ===========================
  // إظهار تنبيه الفاتورة الحرجة
  // راح نستخدم هالدالة من bills.js لما فاتورة تكون قريبة الاستحقاق
  window.showCriticalBillAlert = function(billData) {
    // billData متوقع يكون فيه:
    // { name, amount, dueDate, status }
    const nameEl = document.getElementById("bill-alert-name");
    const amountEl = document.getElementById("bill-alert-amount");
    const dueEl = document.getElementById("bill-alert-due");
    const statusEl = document.getElementById("bill-alert-status");

    if (nameEl)   nameEl.textContent = billData?.name   || "";
    if (amountEl) amountEl.textContent = billData?.amount || "";
    if (dueEl)    dueEl.textContent = billData?.dueDate || "";
    if (statusEl) statusEl.textContent = billData?.status || "";

    if (billAlertOverlay) {
      billAlertOverlay.classList.remove("hidden");
    }
  };

  // إخفاء التنبيه (بعد التعامل معه)
  function hideCriticalBillAlert() {
    if (billAlertOverlay) {
      billAlertOverlay.classList.add("hidden");
    }
  }

  // أزرار التنبيه
  if (billAlertPaidBtn) {
    billAlertPaidBtn.addEventListener("click", () => {
      // هنا رح نحدث حالة الفاتورة إلى "مدفوعة"
      // رح نكمّل المنطق فعلاً في bills.js مع GAS
      hideCriticalBillAlert();
    });
  }

  if (billAlertNotPaidBtn) {
    billAlertNotPaidBtn.addEventListener("click", () => {
      // نخليها "غير مدفوعة"
      hideCriticalBillAlert();
    });
  }

  if (billAlertRemindBtn) {
    billAlertRemindBtn.addEventListener("click", () => {
      // هون رح نطلب إذن تنبيهات المتصفح ونضبط "ذكّرني غداً"
      // المنطق التفصيلي رح يكون في notifications.js
      hideCriticalBillAlert();
    });
  }
});
