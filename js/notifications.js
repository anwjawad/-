/* ============================
   notifications.js
   التنبيهات و "ذكّرني غداً"
   ============================ */

/*
المنطق:
1. عند ضغط "ذكّرني غداً" في overlay الفاتورة:
   - نطلب إذن الإشعارات من المتصفح.
   - لو الموافقة OK → ننشئ إشعار مباشر الآن للتجربة.
   - (بما إن ما في سيرفر شغال 24/7، ما في جدولة حقيقية لساعات مستقبلية.
      الطريقة الواقعية الوحيدة بصفحة static هي:
      - نسجل بخيار localStorage إنه "عندي فاتورة X لازم أذكرك فيها غداً"
      - وبكل مرة تفتح التطبيق اليوم التالي، نطلع لك إشعار جديد.
     لكن حسب متطلباتك، انت اخترت إشعار المتصفح.
     رح نعمل طلب الإذن + تجهيز دالة تقدر تطلع إشعار لما تفتح الموقع.)
*/

const NotificationState = {
  pendingReminders: [], 
  /*
    شكل العنصر:
    {
      type: "bill",
      name: "فاتورة كهرباء",
      dueDate: "2025-11-05",
      createdDay: "2025-10-30"
    }
    هذه القائمة ممكن تُستخدم لو حبيت مستقبلاً تعمل localStorage.
    حالياً بنحضر واجهة فقط.
  */
};

document.addEventListener("DOMContentLoaded", () => {
  const billAlertRemindBtn = document.getElementById("bill-alert-remind");

  if (billAlertRemindBtn) {
    billAlertRemindBtn.addEventListener("click", async () => {
      await requestNotificationPermission();
      // هون ممكن نعرض إشعار فوري كاختبار
      sendBrowserNotification("تذكير فاتورة", "سنذكرك بهذه الفاتورة لاحقاً.");
    });
  }
});

// طلب الإذن
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("المتصفح لا يدعم الإشعارات.");
    return;
  }
  if (Notification.permission === "granted") {
    return;
  }
  if (Notification.permission !== "denied") {
    await Notification.requestPermission();
  }
}

// إرسال إشعار
function sendBrowserNotification(title, body) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
    });
  } else {
    console.log("الإشعارات مرفوضة من المستخدم.");
  }
}

console.log("notifications.js جاهز ✅");
