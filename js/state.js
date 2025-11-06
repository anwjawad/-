/* ============================
   state.js
   إدارة الحالة العامة للتطبيق
   ============================ */

/*
شرح سريع:

AppState = الحالة المركزية للتطبيق.
- currentUser: "me" أو "partner"
- pinCodes: الأكواد المسموحة لكل مستخدم
- preferences: الثيم / سرعة الترانزيشن / نوع الترانزيشن / تأكيد الحذف
- ui: أشياء بصرية حالية مثل الشاشة الحالية المفتوحة
- dataConfig: إعدادات الربط مع GAS (راح نعدلها لاحقاً لما نبني gas-api.js)

باقي السكربتات رح تقرأ وتعدل AppState بدل ما تتصرف كل وحدة لحالها.
*/

const AppState = {
  // المستخدم الحالي (بعد تسجيل الدخول)
  currentUser: null, // "me" أو "partner"

  // أكواد الـPIN: عدلهم على مزاجك
  pinCodes: {
    me: "1234",        // حسابك الكامل
    partner: "5678",   // حساب زوجتك (المشتريات فقط)
  },

  // التفضيلات اللي بتظهر في صفحة preferences
  preferences: {
    theme: "ocean",           // لازم يطابق class على <body> مثل "theme-ocean"
    transitionSpeed: 50,      // قيمة من 0 - 100 (slider)
    transitionType: "fade",   // fade | slide | glow | scale
    deleteConfirm: "on",      // on | off (تأكيد الحذف)
  },

  // واجهة المستخدم
  ui: {
    currentScreenId: "dashboard-screen", // الشاشة الحالية
    sideMenuOpen: false,
  },

  // إعدادات الاتصال مع GAS (راح نستخدمها لاحقاً في gas-api.js)
  dataConfig: {
    gasBaseUrl: "https://script.google.com/macros/s/AKfycbwSwl80v6Dy8rYambiV2gK3rBIyaaNzQgzSTvn0-aKf-WSR6qZ7Y0OJ1R5E73GpMPKEBw/exec", 
    // ملاحظة:
    // هون المطور رح يحط عنوان السكربت (الـ Web App URL) تبع GAS
    // حتى يضل موجود كـ default بداخل الكود زي ما طلبت
    // وبدون ما تحتاج تدخله كل مرة على كل جهاز
  },
};

/*
دوال مساعدة بسيطة للتعامل مع الستايت
*/

// استخدمها لتحديث تفضيل واحد أو أكثر
function updatePreferences(newPrefs = {}) {
  AppState.preferences = {
    ...AppState.preferences,
    ...newPrefs,
  };

  // طبق التغييرات البصرية مباشرة (ثيم / سرعة انيميشن / نوع انيميشن إلخ)
  applyTheme(AppState.preferences.theme);
  applyTransitionSettings(
    AppState.preferences.transitionSpeed,
    AppState.preferences.transitionType
  );

  applyDeleteConfirmSetting(AppState.preferences.deleteConfirm);
}

// تغيير المستخدم الحالي بعد تسجيل الدخول
function setCurrentUser(userKey) {
  AppState.currentUser = userKey;
  const userLabel = document.getElementById("app-current-user");
  if (userLabel) {
    userLabel.textContent =
      userKey === "partner" ? "زوجتي" : "حسابي الشخصي";
  }

  // تخصيص الواجهة بناءً على المستخدم
  enforceUserPermissions(userKey);
}

// تغيير الشاشة الحالية
function setCurrentScreen(screenId) {
  AppState.ui.currentScreenId = screenId;
  renderScreensVisibility();
}

// فتح/إغلاق القائمة الجانبية للموبايل
function toggleSideMenu(forceState) {
  const menu = document.getElementById("side-menu");
  if (!menu) return;

  if (typeof forceState === "boolean") {
    AppState.ui.sideMenuOpen = forceState;
  } else {
    AppState.ui.sideMenuOpen = !AppState.ui.sideMenuOpen;
  }

  if (AppState.ui.sideMenuOpen) {
    menu.classList.add("open");
  } else {
    menu.classList.remove("open");
  }
}

/*
الوظائف التالية سيتم تعريفها في ملفات ثانية لكن نستخدمها من هون:
- applyTheme() في themes.js
- applyTransitionSettings() في preferences.js أو themes.js
- applyDeleteConfirmSetting() في preferences.js
- enforceUserPermissions() في auth.js
- renderScreensVisibility() في ui.js

هون مجرد نضمن أنهم موجودين نظرياً لوقت ما نحمّل باقي الملفات.
عشان ما يعطي خطأ بالكونسول قبل تحميل باقي السكربتات، بنحط ديفولتهم إذا مش معرفين.
*/

if (typeof applyTheme !== "function") {
  window.applyTheme = function(themeName) {
    // placeholder، التطبيق الفعلي بملف themes.js
    document.body.className = `app theme-${themeName}`;
    const themeLabel = document.getElementById("app-current-theme");
    if (themeLabel) themeLabel.textContent = `ثيم: ${themeName}`;
  };
}

if (typeof applyTransitionSettings !== "function") {
  window.applyTransitionSettings = function(speed, type) {
    // placeholder: لاحقاً ملف preferences.js رح يضبط CSS vars حسب speed/type
    // حالياً بنحتفظ بالقيم بالـstate فقط
    AppState.preferences.transitionSpeed = speed;
    AppState.preferences.transitionType = type;
  };
}

if (typeof applyDeleteConfirmSetting !== "function") {
  window.applyDeleteConfirmSetting = function(mode) {
    // on/off
    AppState.preferences.deleteConfirm = mode;
  };
}

if (typeof enforceUserPermissions !== "function") {
  window.enforceUserPermissions = function(userKey) {
    // placeholder: رح نكمّلها فعلياً في auth.js
  };
}

if (typeof renderScreensVisibility !== "function") {
  window.renderScreensVisibility = function() {
    // placeholder: رح نكمّلها فعلياً في ui.js
  };
}

/*
تشغيل أولي عند تحميل الصفحة:
- نطبّق الثيم الافتراضي
- نعرض القيم currentUser (لسه ما سجل دخول)
*/
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(AppState.preferences.theme);
  applyTransitionSettings(
    AppState.preferences.transitionSpeed,
    AppState.preferences.transitionType
  );
  applyDeleteConfirmSetting(AppState.preferences.deleteConfirm);

  const themeLabel = document.getElementById("app-current-theme");
  if (themeLabel) {
    themeLabel.textContent = `ثيم: ${AppState.preferences.theme}`;
  }
});
