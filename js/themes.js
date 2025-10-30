/* ============================
   themes.js
   إدارة الثيمات
   ============================ */

/*
المهام:
1. تطبيق الثيم على الـ <body> على شكل class مثل "theme-ocean".
2. تحديث النص أعلى الهيدر لعرض اسم الثيم.
3. ربط قائمة اختيار الثيم من صفحة preferences مع AppState.
*/

document.addEventListener("DOMContentLoaded", () => {
  const themeSelect = document.getElementById("theme-select");

  // عند تحميل الصفحة، طبق الثيم الموجود بالـstate
  applyTheme(AppState.preferences.theme);

  // لو المستخدم غيّر الثيم من الـselect
  if (themeSelect) {
    themeSelect.value = AppState.preferences.theme;

    themeSelect.addEventListener("change", () => {
      const newTheme = themeSelect.value;
      updatePreferences({ theme: newTheme });
    });
  }
});

/*
applyTheme:
- تاخد اسم الثيم بدون "theme-"
- تعدل كلاس الـbody ليصير "app theme-<الاسم>"
- تحدث النص في الهيدر
*/

window.applyTheme = function(themeName) {
  // عدل الـclass على الـbody
  document.body.className = `app theme-${themeName}`;

  // حدّث اللابل بالهيدر
  const themeLabel = document.getElementById("app-current-theme");
  if (themeLabel) {
    themeLabel.textContent = `ثيم: ${themeName}`;
  }

  // خزّن بالـstate
  AppState.preferences.theme = themeName;
};
