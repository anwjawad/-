/* ============================
   bills.js
   إدارة الفواتير الشهرية
   ============================ */

/*
المهام:
1. جلب قائمة الفواتير الشهرية من الشيت.
2. عرضها في شاشة "الفواتير الشهرية".
3. إضافة فاتورة جديدة (اسم، مبلغ، تاريخ استحقاق، حالة الدفع).
4. تحديث حالة الدفع (مدفوعة/غير مدفوعة).
5. إطلاق التنبيه الإجباري (الـoverlay مع الـblur) عند الاقتراب من الاستحقاق.
*/

const BillsState = {
  list: [], // [{id,name,amount,dueDate,status}]
};

document.addEventListener("DOMContentLoaded", () => {
  const billsListEl = document.getElementById("bills-list");

  const billNameInput   = document.getElementById("bill-name");
  const billAmountInput = document.getElementById("bill-amount");
  const billDueInput    = document.getElementById("bill-due");
  const billStatusSel   = document.getElementById("bill-status");

  const saveBillBtn = document.getElementById("save-bill");
  const modalBill   = document.getElementById("modal-bill");

  // تحميل الفواتير أول ما ندخل على الشاشة
  refreshBillsUI();

  // زر "حفظ الفاتورة"
  if (saveBillBtn) {
    saveBillBtn.addEventListener("click", async () => {
      const name = (billNameInput.value || "").trim();
      const amount = Number(billAmountInput.value || 0);
      const dueDate = billDueInput.value; // "YYYY-MM-DD"
      const status = billStatusSel.value;

      if (!name || !amount || !dueDate) {
        alert("يرجى إدخال اسم، مبلغ، وتاريخ استحقاق.");
        return;
      }

      const res = await addBill({
        name,
        amount,
        dueDate,
        status,
      });

      if (!res || !res.ok) {
        alert("فشل حفظ الفاتورة");
        return;
      }

      // نظّف
      billNameInput.value = "";
      billAmountInput.value = "";
      billDueInput.value = "";
      billStatusSel.value = "unpaid";

      // سكّر المودال
      if (modalBill) modalBill.classList.add("hidden");

      // حدث الواجهة
      refreshBillsUI();
    });
  }

  // تحميل الفواتير من GAS
  async function refreshBillsUI() {
    const res = await fetchBills();
    if (!res || !res.ok || !Array.isArray(res.bills)) {
      BillsState.list = [];
    } else {
      BillsState.list = res.bills;
    }

    renderBillsList();
    checkCriticalBills();
  }

  // عرض الفواتير
  function renderBillsList() {
    if (!billsListEl) return;
    billsListEl.innerHTML = "";

    if (!BillsState.list.length) {
      const empty = document.createElement("div");
      empty.className = "tiny-note";
      empty.textContent = "لا توجد فواتير مسجلة.";
      billsListEl.appendChild(empty);
      return;
    }

    BillsState.list.forEach(bill => {
      /*
      bill: {
        id, name, amount, dueDate("2025-11-05"), status("paid"|"unpaid")
      }
      */
      const row = document.createElement("div");
      row.className = "list-row";

      const header = document.createElement("div");
      header.className = "list-row-header";

      const leftSide = document.createElement("div");
      leftSide.textContent = `${bill.name} - ${bill.amount} شيكل`;

      const rightSide = document.createElement("div");
      rightSide.textContent = `استحقاق: ${bill.dueDate || ""}`;

      header.appendChild(leftSide);
      header.appendChild(rightSide);

      const sub = document.createElement("div");
      sub.className = "list-row-sub";

      const st = document.createElement("div");
      st.textContent = "الحالة: " + (bill.status === "paid" ? "مدفوعة" : "غير مدفوعة");
      sub.appendChild(st);

      const actions = document.createElement("div");
      actions.className = "list-row-actions";

      // زر "تم الدفع"
      const paidBtn = document.createElement("button");
      paidBtn.className = "btn success-btn";
      paidBtn.style.minHeight = "32px";
      paidBtn.style.fontSize = "13px";
      paidBtn.textContent = "تم الدفع";
      paidBtn.addEventListener("click", async () => {
        const upd = await updateBillStatus({ billId: bill.id, status: "paid" });
        if (!upd || !upd.ok) {
          alert("تعذّر التحديث");
          return;
        }
        refreshBillsUI();
      });
      actions.appendChild(paidBtn);

      // زر "غير مدفوعة"
      const unpaidBtn = document.createElement("button");
      unpaidBtn.className = "btn danger-btn";
      unpaidBtn.style.minHeight = "32px";
      unpaidBtn.style.fontSize = "13px";
      unpaidBtn.textContent = "غير مدفوعة";
      unpaidBtn.addEventListener("click", async () => {
        const upd = await updateBillStatus({ billId: bill.id, status: "unpaid" });
        if (!upd || !upd.ok) {
          alert("تعذّر التحديث");
          return;
        }
        refreshBillsUI();
      });
      actions.appendChild(unpaidBtn);

      row.appendChild(header);
      row.appendChild(sub);
      row.appendChild(actions);

      billsListEl.appendChild(row);
    });
  }

  /*
   checkCriticalBills:
   - نشيك الفواتير اللي قرب موعدها (خلال 7 أيام من اليوم).
   - لو لقينا فاتورة غير مدفوعة وموعدها قريب → نعرض الـoverlay الإجباري.
  */
  function checkCriticalBills() {
    const now = new Date();
    const nowTime = now.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    for (const b of BillsState.list) {
      if (b.status === "paid") continue;
      if (!b.dueDate) continue;

      const due = new Date(b.dueDate + "T00:00:00");
      const diff = due.getTime() - nowTime;

      // إذا الفاتورة خلال أسبوع أو أقل (>=0 يعني لسه ما مر الموعد)
      if (diff <= sevenDaysMs && diff >= 0) {
        // اعرض التحذير
        if (typeof showCriticalBillAlert === "function") {
          showCriticalBillAlert({
            name: b.name,
            amount: b.amount,
            dueDate: b.dueDate,
            status: b.status === "paid" ? "مدفوعة" : "غير مدفوعة",
          });
        }
        // أول فاتورة كفاية
        break;
      }
    }
  }
});

console.log("bills.js جاهز ✅");
