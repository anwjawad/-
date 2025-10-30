/* ============================
   shopping.js
   قائمة المشتريات (خاصة بحساب الزوجة)
   ============================ */

/*
المهام:
1. الزوجة تقدر تضيف عناصر مشتريات مطلوبة (نص فقط).
2. عند المستخدم الأساسي (me):
   - يقدر يحط سعر الشراء لكل عنصر.
   - يقدر يضغط "تم الشراء".
   - هذا ينقل العنصر مباشرة كمصروف إلى Google Sheets
     ويزيله من قائمة الشراء.

المتطلبات:
- تظهر القائمة في تبويب "المشتريات".
*/

const ShoppingState = {
  list: [], // [{id, name, priceSuggested?, purchased? false}]
};

document.addEventListener("DOMContentLoaded", () => {
  const shoppingInput = document.getElementById("shopping-item-input");
  const shoppingAddBtn = document.getElementById("shopping-add-btn");
  const shoppingListEl = document.getElementById("shopping-list");

  // تحميل أولي
  refreshShoppingUI();

  // إضافة عنصر جديد للقائمة
  if (shoppingAddBtn) {
    shoppingAddBtn.addEventListener("click", async () => {
      const itemName = (shoppingInput.value || "").trim();
      if (!itemName) {
        alert("أدخل اسم العنصر المطلوب");
        return;
      }

      const res = await addShoppingItem({ itemName });
      if (!res || !res.ok) {
        alert("فشل إضافة العنصر");
        return;
      }

      shoppingInput.value = "";
      refreshShoppingUI();
    });
  }

  // عرض قائمة المشتريات
  async function refreshShoppingUI() {
    const res = await fetchShoppingList();
    if (!res || !res.ok || !Array.isArray(res.items)) {
      ShoppingState.list = [];
    } else {
      ShoppingState.list = res.items;
    }
    renderShoppingList();
  }

  function renderShoppingList() {
    if (!shoppingListEl) return;
    shoppingListEl.innerHTML = "";

    if (!ShoppingState.list.length) {
      const empty = document.createElement("div");
      empty.className = "tiny-note";
      empty.textContent = "لا توجد عناصر في قائمة المشتريات.";
      shoppingListEl.appendChild(empty);
      return;
    }

    ShoppingState.list.forEach(item => {
      /*
      item: {
        id,
        name,
        // priceRecorded? لما ينشتر
      }
      */

      const row = document.createElement("div");
      row.className = "list-row";

      const header = document.createElement("div");
      header.className = "list-row-header";

      const leftSide = document.createElement("div");
      leftSide.textContent = item.name;

      const rightSide = document.createElement("div");
      rightSide.textContent = item.priceRecorded
        ? `تم الشراء بـ ${item.priceRecorded} شيكل`
        : "لم يُشتر بعد";

      header.appendChild(leftSide);
      header.appendChild(rightSide);

      row.appendChild(header);

      // لو أنا المستخدم الأساسي، بعطيني فورم السعر + زر "تم الشراء"
      if (AppState.currentUser === "me") {
        const sub = document.createElement("div");
        sub.className = "list-row-sub";

        const priceInput = document.createElement("input");
        priceInput.type = "number";
        priceInput.min = "0";
        priceInput.placeholder = "السعر عند الشراء (شيكل)";
        priceInput.className = "text-input";
        priceInput.style.maxWidth = "140px";

        const buyBtn = document.createElement("button");
        buyBtn.className = "btn success-btn";
        buyBtn.style.minHeight = "32px";
        buyBtn.style.fontSize = "13px";
        buyBtn.textContent = "تم الشراء";

        buyBtn.addEventListener("click", async () => {
          const priceVal = Number(priceInput.value || 0);
          if (!priceVal || priceVal <= 0) {
            alert("يرجى إدخال سعر صحيح");
            return;
          }

          // markShoppingItemPurchased:
          // - يسجل السعر
          // - يضيف مصروف فعلي في الشيت
          // - يحذف العنصر من قائمة الشراء
          const res2 = await markShoppingItemPurchased({
            itemId: item.id,
            price: priceVal,
          });

          if (!res2 || !res2.ok) {
            alert("تعذر تسجيل الشراء");
            return;
          }

          refreshShoppingUI();
        });

        sub.appendChild(priceInput);
        sub.appendChild(buyBtn);

        row.appendChild(sub);
      }

      shoppingListEl.appendChild(row);
    });
  }
});

console.log("shopping.js جاهز ✅");
