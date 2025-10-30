/* ============================
   preferences.js
   إدارة الإعدادات (Preferences)
   ============================ */

/*
المهام:
1. قراءة الإعدادات الحالية من AppState.preferences وعرضها في صفحة الإعدادات.
2. لما المستخدم يغير السرعة / نوع الحركة / التأكيد على الحذف، نحدث AppState
   ونطبّق التأثير على الـCSS / السلوك العام.
3. التحكم بخاصية التأكيد قبل الحذف.
4. التحكم بسرعة و نوع الأنيميشن (transition).
*/

document.addEventListener("DOMContentLoaded", () => {
  const speedInput = document.getElementById("pref-transition-speed");
  const typeSelect = document.getElementById("pref-transition-type");
  const deleteConfirmSelect = document.getElementById("pref-delete-confirm");

  // عيّن القيم الحالية من الـstate
  if (speedInput) {
    speedInput.value = AppState.preferences.transitionSpeed;
  }
  if (typeSelect) {
    typeSelect.value = AppState.preferences.transitionType;
  }
  if (deleteConfirmSelect) {
    deleteConfirmSelect.value = AppState.preferences.deleteConfirm;
  }

  // استمع للتغييرات
  if (speedInput) {
    speedInput.addEventListener("input", () => {
      const newSpeed = Number(speedInput.value);
      updatePreferences({ transitionSpeed: newSpeed });
    });
  }

  if (typeSelect) {
    typeSelect.addEventListener("change", () => {
      const newType = typeSelect.value;
      updatePreferences({ transitionType: newType });
    });
  }

  if (deleteConfirmSelect) {
    deleteConfirmSelect.addEventListener("change", () => {
      const mode = deleteConfirmSelect.value; // "on" | "off"
      updatePreferences({ deleteConfirm: mode });
    });
  }
});

/*
applyTransitionSettings:
- نضبط متغيرات CSS بحيث سرعة الحركة ونوعها يتأثروا ديناميكياً.
- سرعة الحركة:slider من 0 لـ 100. بنحولها لثانية.
- نوع الحركة: fade/slide/glow/scale (بتأثر لاحقاً على الكلاسات اللي بنحطها).
*/

window.applyTransitionSettings = function(speedValue, typeValue) {
  // خزن في الstate
  AppState.preferences.transitionSpeed = speedValue;
  AppState.preferences.transitionType = typeValue;

  // حول الـspeed من 0-100 لثانية تقريبية:
  // نخلي أقل اشي 0.1 ثانية، أعلى اشي 1 ثانية.
  const minSec = 0.1;
  const maxSec = 1.0;
  const ratio = speedValue / 100; // بين 0 و1
  const finalSec = minSec + (maxSec - minSec) * ratio;

  // نضبط CSS variables العامة
  document.documentElement.style.setProperty(
    "--transition-speed",
    finalSec.toFixed(2) + "s"
  );

  // نوع الحركة:
  // هون منخزن نوع الحركة كنص. ملفات ثانية (مثلاً animations، ui) ممكن تستخدمه
  document.documentElement.style.setProperty(
    "--transition-type",
    typeValue === "slide"
      ? "cubic-bezier(0.16, 1, 0.3, 1)"
      : "ease"
  );
};

/*
applyDeleteConfirmSetting:
- تفعيل/إلغاء نافذة التأكيد قبل الحذف.
- هذا الإعداد حيستخدمه ملف transactions.js لما يحذف حركة،
  بحيث لو كان "off" يعمل حذف مباشر بدون ما يسأل.
*/

window.applyDeleteConfirmSetting = function(mode) {
  AppState.preferences.deleteConfirm = mode; // "on" أو "off"
};
