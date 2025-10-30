/* ============================
   auth.js
   إدارة شاشة الـPIN + الصلاحيات
   ============================ */

/*
الأهداف:
1. المستخدم يختار الحساب (أنا / زوجتي).
2. المستخدم يدخل PIN.
3. إذا النجاح:
   - نخفي شاشة auth-screen.
   - نظهر المحتوى.
   - نحدد صلاحيات الواجهة حسب المستخدم.
4. إذا فشل:
   - نعطي رسالة خطأ.

الصلاحيات:
- حسابي (me):
   يشوف كل الشاشات.
- حساب زوجتي (partner):
   تشوف فقط تبويب "قائمة المشتريات" وتقدر تضيف عناصر.
   بقية الشاشات تنشال أو تتقفل.
*/

(function initAuth() {
  document.addEventListener("DOMContentLoaded", () => {
    const authScreen = document.getElementById("auth-screen");
    const authUserSel = document.getElementById("auth-user");
    const authPinInput = document.getElementById("auth-pin");
    const authSubmitBtn = document.getElementById("auth-submit");
    const authError = document.getElementById("auth-error");

    if (!authScreen) return;

    authSubmitBtn.addEventListener("click", () => {
      const chosenUser = authUserSel.value; // "me" or "partner"
      const enteredPin = authPinInput.value.trim();

      // تحقق من الـPIN باستخدام AppState.pinCodes
      const correctPin = AppState.pinCodes[chosenUser];

      if (enteredPin === correctPin) {
        // نجاح
        authError.textContent = "";

        // حفظ المستخدم الحالي
        setCurrentUser(chosenUser);

        // إخفاء شاشة auth
        authScreen.classList.remove("visible");
        authScreen.style.display = "none";

        // تطبيق صلاحيات
        enforceUserPermissions(chosenUser);

        // عرض الشاشة الافتراضية بعد الدخول
        // لو أنا -> dashboard-screen
        // لو زوجتي -> shopping-screen
        if (chosenUser === "partner") {
          setCurrentScreen("shopping-screen");
        } else {
          setCurrentScreen("dashboard-screen");
        }

        renderScreensVisibility();
        toggleSideMenu(false);

      } else {
        // فشل
        authError.textContent = "الرمز غير صحيح";
        authPinInput.value = "";
        authPinInput.focus();
      }
    });

    // زر القفل "logout" في القائمة الجانبية
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        // رجع للتوثيق من جديد
        AppState.currentUser = null;
        // فرّغ الحقول
        authPinInput.value = "";
        authError.textContent = "";
        // أظهر شاشة الـauth
        authScreen.style.display = "flex";
        // تأكد من الـclass visible
        if (!authScreen.classList.contains("visible")) {
          authScreen.classList.add("visible");
        }

        // خبي كل المحتوى إجباري
        hideAllScreens();
        toggleSideMenu(false);
      });
    }
  });
})();

/*
تحديد صلاحيات الواجهة حسب المستخدم الحالي
- للحساب "partner": نعرض فقط shopping + settings (preferences) لو بدك نسمح، بس ما نعرض الباقي.
- للحساب "me": نعرض كل شيء.
*/
function enforceUserPermissions(userKey) {
  // روابط القائمة الجانبية
  const sideLinks = document.querySelectorAll(".side-link");

  // الشاشات نفسها
  const dashboardScreen = document.getElementById("dashboard-screen");
  const transactionsScreen = document.getElementById("transactions-screen");
  const billsScreen = document.getElementById("bills-screen");
  const goalsScreen = document.getElementById("goals-screen");
  const shoppingScreen = document.getElementById("shopping-screen");
  const preferencesScreen = document.getElementById("preferences-screen");

  if (userKey === "partner") {
    // السماح للمشتريات فقط
    if (dashboardScreen) dashboardScreen.style.display = "none";
    if (transactionsScreen) transactionsScreen.style.display = "none";
    if (billsScreen) billsScreen.style.display = "none";
    if (goalsScreen) goalsScreen.style.display = "none";
    if (preferencesScreen) preferencesScreen.style.display = "none";

    if (shoppingScreen) shoppingScreen.style.display = "flex";

    // بالقائمة الجانبية: خلي بس المشتريات + قفل التطبيق
    sideLinks.forEach(btn => {
      const screenTarget = btn.getAttribute("data-screen");
      if (
        screenTarget === "shopping-screen" ||
        screenTarget === "preferences-screen" // لو حاب تسمح لزوجتك تفوت عالإعدادات، بدك تخلي هذا السطر
      ) {
        btn.style.display = "flex";
      } else {
        btn.style.display = "none";
      }
    });

  } else {
    // أنا (me): كل شيء مفعل
    if (dashboardScreen) dashboardScreen.style.display = "flex";
    if (transactionsScreen) transactionsScreen.style.display = "flex";
    if (billsScreen) billsScreen.style.display = "flex";
    if (goalsScreen) goalsScreen.style.display = "flex";
    if (shoppingScreen) shoppingScreen.style.display = "flex";
    if (preferencesScreen) preferencesScreen.style.display = "flex";

    sideLinks.forEach(btn => {
      btn.style.display = "flex";
    });
  }
}

/*
عرض/إخفاء الشاشات حسب AppState.ui.currentScreenId
هذا رح يتم استدعاؤه بعد تسجيل الدخول وبعد ما أضغط روابط القائمة.
*/
function renderScreensVisibility() {
  const allScreens = document.querySelectorAll(".screen");
  allScreens.forEach(section => {
    if (section.id === AppState.ui.currentScreenId) {
      section.classList.add("visible");
      section.classList.remove("hidden");
      section.style.display = "flex";
    } else {
      section.classList.remove("visible");
      section.classList.add("hidden");
      section.style.display = "none";
    }
  });
}

/*
مساعد لإخفاء كل الشاشات (مثلاً عند تسجيل الخروج)
*/
function hideAllScreens() {
  const allScreens = document.querySelectorAll(".screen");
  allScreens.forEach(section => {
    section.classList.remove("visible");
    section.classList.add("hidden");
    section.style.display = "none";
  });
}

/*
سلوك القوائم الجانبية / التنقل بين التبويبات:
- أي زر في القائمة الجانبية عليه data-screen="..." ينقلنا لها
*/
document.addEventListener("DOMContentLoaded", () => {
  const sideLinks = document.querySelectorAll(".side-link");
  sideLinks.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetScreen = btn.getAttribute("data-screen");
      if (!targetScreen) return;

      // غير الشاشة الحالية
      setCurrentScreen(targetScreen);

      // طبق التغيير بصرياً
      renderScreensVisibility();

      // سكّر القائمة (مهم على الموبايل)
      toggleSideMenu(false);
    });
  });

  // زر الهامبرغر لفتح/إغلاق القائمة بالموبايل
  const menuToggleBtn = document.getElementById("menu-toggle");
  if (menuToggleBtn) {
    menuToggleBtn.addEventListener("click", () => {
      toggleSideMenu();
    });
  }
});
