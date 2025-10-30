/* ============================
   gas-api.js (JSONP VERSION)
   تجاوز CORS بدون fetch
   ============================

الفكرة:
بدل ما نستخدم fetch() وننحظر من CORS،
نستخدم JSONP.

يعني:
- بنعمل كولباك global مؤقت في window.
- بنبعت اسمه للـGAS كـ callback=<name>.
- بنضيف <script src="...&callback=<name>"> للدوم.
- GAS بيرجع استدعاء الدالة مع البيانات.
- منستلم الرد ونرجعه كبرومايز.

كل الدوال أدناه (fetchTransactions, addTransaction, ...) ما تغيرت من ناحية الاستعمال في باقي الملفات.
بس بدل ما تستعمل fetchCall، رح تستعمل gasCallJSONP.
*/

function gasCallJSONP(paramsObj = {}) {
  return new Promise((resolve) => {
    const base = AppState.dataConfig.gasBaseUrl;
    if (!base) {
      console.warn("⚠ لم يتم ضبط gasBaseUrl بعد في AppState.dataConfig.gasBaseUrl");
      resolve({ ok: false, error: "NO_GAS_URL" });
      return;
    }

    // نولّد اسم كولباك فريد
    const cbName = "__gas_cb_" + Date.now() + "_" + Math.floor(Math.random() * 1e9);

    // نخزن الدالة بالغobal حتى GAS يقدر يناديها
    window[cbName] = function(data) {
      // نظف بعد الاستقبال
      try {
        delete window[cbName];
      } catch (e) {
        window[cbName] = undefined;
      }

      // شيل السكربت tag من الـDOM
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }

      // رجّع الرد
      resolve(data);
    };

    // جهز الـquery string
    const queryObj = {
      ...paramsObj,
      callback: cbName,
    };

    const qs = new URLSearchParams(queryObj).toString();
    const finalUrl = base + "?" + qs;

    // أنشئ <script> ديناميكي
    const scriptTag = document.createElement("script");
    scriptTag.src = finalUrl;
    scriptTag.async = true;
    scriptTag.onerror = function() {
      // فشل تحميل السكربت (يعني فشل الطلب)
      try {
        delete window[cbName];
      } catch (e) {
        window[cbName] = undefined;
      }
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
      resolve({ ok: false, error: "SCRIPT_LOAD_ERROR" });
    };

    document.body.appendChild(scriptTag);
  });
}

/*
دوال عالية المستوى. نفس التواقيع السابقة،
لكن صارت تستعمل gasCallJSONP بدل fetch/gasCall.
*/

function fetchTransactions() {
  return gasCallJSONP({
    action: "getTransactions",
  });
}

function addTransaction({ type, categories, amount, note, source }) {
  return gasCallJSONP({
    action: "addTransaction",
    type,
    categories: JSON.stringify(categories || []),
    amount: amount || 0,
    note: note || "",
    source: source || "",
  });
}

function deleteTransaction(id) {
  return gasCallJSONP({
    action: "deleteTransaction",
    id,
  });
}

function fetchCategories() {
  return gasCallJSONP({
    action: "getCategories",
  });
}

function saveCategories(newList) {
  return gasCallJSONP({
    action: "saveCategories",
    categories: JSON.stringify(newList || []),
  });
}

/* الفواتير */

function fetchBills() {
  return gasCallJSONP({
    action: "getBills",
  });
}

function addBill({ name, amount, dueDate, status }) {
  return gasCallJSONP({
    action: "addBill",
    name,
    amount,
    dueDate,
    status,
  });
}

function updateBillStatus({ billId, status }) {
  return gasCallJSONP({
    action: "updateBillStatus",
    billId,
    status,
  });
}

/* الأهداف / البنود السنوية */

function fetchGoalsAndYearly() {
  return gasCallJSONP({
    action: "getGoalsAndYearly",
  });
}

function addGoal({ goalName, goalTarget, goalNote }) {
  return gasCallJSONP({
    action: "addGoal",
    goalName,
    goalTarget,
    goalNote,
  });
}

function addYearlyItem({ yearlyName, yearlyAmount }) {
  return gasCallJSONP({
    action: "addYearlyItem",
    yearlyName,
    yearlyAmount,
  });
}

/* قائمة المشتريات */

function fetchShoppingList() {
  return gasCallJSONP({
    action: "getShoppingList",
  });
}

function addShoppingItem({ itemName }) {
  return gasCallJSONP({
    action: "addShoppingItem",
    itemName,
  });
}

function markShoppingItemPurchased({ itemId, price }) {
  return gasCallJSONP({
    action: "markShoppingPurchased",
    itemId,
    price,
  });
}

console.log("gas-api.js (JSONP version) جاهز ✅");