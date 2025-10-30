/* ============================
   gas-api.js
   مسؤول عن التخاطب مع Google Apps Script
   ============================ */

/*
الفكرة:
- كل تواصل مع جوجل شيت بيصير عن طريق GAS web app.
- احنا بنبعت action محدد و بياناته.
- GAS بيرجع JSON.

المهم:
AppState.dataConfig.gasBaseUrl لازم يكون موجود في state.js
مثال متوقع لاحقاً:
AppState.dataConfig.gasBaseUrl = "https://script.google.com/macros/s/XXXXX/exec";

هنا ما في OAuth.
يعني الـURL رح يكون معروف فقط إلنا.

NOTE:
بما أنك طلبت "بدون CORS مشاكل" وبتحب أسلوب قريب من JSONP،
أنا رح أستخدم GET مع query params.
GAS لازم يرجع JSON عادي ومسموح للمتصفح يقرأه.
*/

async function gasCall(paramsObj = {}) {
  const base = AppState.dataConfig.gasBaseUrl;
  if (!base) {
    console.warn("⚠ لم يتم ضبط gasBaseUrl بعد.");
    return { ok: false, error: "NO_GAS_URL" };
  }

  // حوّل الـparams لكويري سترينغ
  const query = new URLSearchParams(paramsObj).toString();
  const finalUrl = `${base}?${query}`;

  try {
    const res = await fetch(finalUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
    });

    if (!res.ok) {
      console.error("gasCall error status", res.status);
      return { ok: false, error: "HTTP_" + res.status };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("gasCall fetch error", err);
    return { ok: false, error: err.message || "FETCH_ERROR" };
  }
}

/*
دوال عالية المستوى:

- fetchTransactions()    => يجيب آخر الحركات (دخل + مصروف)
- addTransaction(...)    => يضيف دخل أو مصروف
- deleteTransaction(id)  => يحذف حركة
- fetchCategories()      => يرجع الفئات المخزنة
- saveCategories(list)   => يحفظ فئات جديدة/محدثة
- fetchBills() / addBill() / updateBillStatus()
- fetchGoals() / addGoal()
- addYearlyItem()
... الخ

ملاحظة:
الـ id لكل حركة رح ننشئه داخل GAS (رح نعالجها بقسم GAS لاحقاً)،
ونرجع لك هذا الـid عشان تقدر تحذفه لاحقاً.
*/

async function fetchTransactions() {
  return gasCall({
    action: "getTransactions",
  });
}

async function addTransaction({ type, categories, amount, note, source }) {
  // type: "income" or "expense"
  // categories: array of strings
  // amount: number
  // note: string
  // source: string (مصدر الدخل مثلاً)
  return gasCall({
    action: "addTransaction",
    type,
    categories: JSON.stringify(categories || []),
    amount: amount || 0,
    note: note || "",
    source: source || "",
  });
}

async function deleteTransaction(id) {
  return gasCall({
    action: "deleteTransaction",
    id,
  });
}

async function fetchCategories() {
  return gasCall({
    action: "getCategories",
  });
}

async function saveCategories(newList) {
  return gasCall({
    action: "saveCategories",
    categories: JSON.stringify(newList || []),
  });
}

/*
الفواتير الشهرية
*/

async function fetchBills() {
  return gasCall({
    action: "getBills",
  });
}

async function addBill({ name, amount, dueDate, status }) {
  return gasCall({
    action: "addBill",
    name,
    amount,
    dueDate,
    status,
  });
}

async function updateBillStatus({ billId, status }) {
  return gasCall({
    action: "updateBillStatus",
    billId,
    status,
  });
}

/*
الأهداف والبنود السنوية
*/

async function fetchGoalsAndYearly() {
  return gasCall({
    action: "getGoalsAndYearly",
  });
}

async function addGoal({ goalName, goalTarget, goalNote }) {
  return gasCall({
    action: "addGoal",
    goalName,
    goalTarget,
    goalNote,
  });
}

async function addYearlyItem({ yearlyName, yearlyAmount }) {
  return gasCall({
    action: "addYearlyItem",
    yearlyName,
    yearlyAmount,
  });
}

/*
قائمة المشتريات (زوجتك)
*/

async function fetchShoppingList() {
  return gasCall({
    action: "getShoppingList",
  });
}

async function addShoppingItem({ itemName }) {
  return gasCall({
    action: "addShoppingItem",
    itemName,
  });
}

async function markShoppingItemPurchased({ itemId, price }) {
  // هذي العملية عندك: لما تشتري الغرض
  // 1) يسجل السعر
  // 2) ينقله لمصاريف
  // 3) يشيله من قائمة الشراء
  return gasCall({
    action: "markShoppingPurchased",
    itemId,
    price,
  });
}

/*
تنبيه الفاتورة "ذكّرني غداً":
راح نترك تنفيذه الحقيقي داخل notifications.js
المهم إنه notifications.js يقدر يستدعي
Notification API تبع المتصفح
*/

console.log("gas-api.js جاهز ✅");
