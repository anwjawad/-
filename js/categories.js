/* ============================
   categories.js
   إدارة الفئات (مصروف / دخل)
   ============================ */

/*
شو بيعمل هذا الملف:
1. يحفظ لستة الفئات الحالية (بالميموري، وعملياً بالـGoogle Sheet عبر GAS).
2. يسمح بإضافة فئات جديدة من داخل مودال الدخل/المصروف.
3. يسمح بإضافة عدة فئات دفعة واحدة مفصولة بفواصل.
4. يوفّر دالة تساعد في اقتراح الفئات كمصدر للاختيار (autocomplete-style).

مهم:
- ما في فئات افتراضية بالبداية. المستخدم رح يضيف بنفسه.
*/

const CategoriesState = {
  list: [], // ["أكل","بنزين","أطفال", ...]
};

/*
تحميل الفئات من GAS عند بداية تشغيل التطبيق
لازم تنادَى بعد تسجيل الدخول الناجح.
*/
async function loadCategories() {
  const res = await fetchCategories();
  if (res && res.ok && Array.isArray(res.categories)) {
    CategoriesState.list = res.categories;
  } else {
    CategoriesState.list = [];
  }
  renderCategoriesHints();
}

/*
حفظ لستة الفئات كاملة لـ GAS
(مثلاً بعد ما نضيف فئات جديدة دفعة واحدة)
*/
async function persistCategories() {
  await saveCategories(CategoriesState.list);
  renderCategoriesHints();
}

/*
دالة لإضافة فئات جديدة (واحدة أو أكثر).
inputString ممكن يكون "أكل, مواصلات, حفاضات"
بتنقسم على الفواصل.
*/
function addCategoriesFromInput(inputString) {
  if (!inputString) return;
  const parts = inputString
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // ضيفهم إذا مش موجودين
  parts.forEach(cat => {
    if (!CategoriesState.list.includes(cat)) {
      CategoriesState.list.push(cat);
    }
  });

  // خزّنهم على GAS
  persistCategories();
}

/*
عرض فئات مقترحة/موجودة للمستخدم
فكرة بسيطة: نعرضهم كملاحظة فقط تحت حقول الإدخال
حتى يعرف الفئات اللي عنده
*/
function renderCategoriesHints() {
  const incomeCatInput = document.getElementById("income-category");
  const expenseCatInput = document.getElementById("expense-category");

  const hintText = CategoriesState.list.length
    ? "الفئات الحالية: " + CategoriesState.list.join(" | ")
    : "لا توجد فئات محفوظة بعد، أضف فئات جديدة باستخدام الفواصل";

  if (incomeCatInput) {
    incomeCatInput.setAttribute("placeholder", hintText);
  }
  if (expenseCatInput) {
    expenseCatInput.setAttribute("placeholder", hintText);
  }
}

/*
مساعدة لإرجاع الآري تبعت الفئات من سترينغ إدخال
*/
function parseCategoriesInput(str) {
  if (!str) return [];
  return str
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

/*
بعد ما نسجل دخل / مصروف:
- لازم نتأكد إن كل الفئات اللي دخلها المستخدم انضافت على القائمة الدائمة
*/
function ensureCategoriesFromTransaction(catsArr) {
  let changed = false;
  catsArr.forEach(cat => {
    if (!CategoriesState.list.includes(cat)) {
      CategoriesState.list.push(cat);
      changed = true;
    }
  });
  if (changed) {
    persistCategories();
  }
}

// كشف جاهزية
console.log("categories.js جاهز ✅");
