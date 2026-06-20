import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertListingAreaAllowed,
  findRestrictedArea,
  normalizeArabicText,
  partitionRestrictedListings,
} from "../src/shared/utils/restrictedAreas.js";

function assertAllowed(listing, label) {
  assert.equal(findRestrictedArea(listing), null, label);
}

function assertRestricted(listing, expected, label) {
  assert.equal(findRestrictedArea(listing), expected, label);
}

// التوحيد: التشكيل والهمزات والتاء المربوطة والأرقام العربية والمسافات.
assert.equal(
  normalizeArabicText("  أَرَاضِي   المَغمورين ٨٦  "),
  "اراضي المغمورين 86"
);

// 1. معضمية الشام العادية: مسموحة.
assertAllowed(
  { city: "ريف دمشق", district: "معضمية الشام" },
  "معضمية الشام وحدها يجب ألا تُحظر"
);

// 2. السومرية: محظورة.
assertRestricted(
  { city: "ريف دمشق", district: "معضمية الشام", village: "مساكن السومرية" },
  "السومرية",
  "السومرية يجب أن تُحظر"
);

// 3. المزة 86، مع رقم عربي: محظورة.
assertRestricted(
  { city: "دمشق", district: "المزة ٨٦" },
  "المزة 86",
  "المزة 86 يجب أن تُحظر"
);

// 4. حي الورود في دمشق: محظور.
assertRestricted(
  { city: "دمشق", district: "حي الورود" },
  "حي الورود بدمشق",
  "حي الورود داخل دمشق يجب أن يُحظر"
);

// 5. حي باسم الورود خارج دمشق: مسموح.
assertAllowed(
  { city: "حلب", district: "حي الورود" },
  "حي الورود خارج دمشق يجب ألا يُحظر"
);

// 6. ماروتا سيتي: محظورة.
assertRestricted(
  { city: "دمشق", location_detail: "مشروع ماروتا سيتي" },
  "ماروتا سيتي",
  "ماروتا سيتي يجب أن تُحظر"
);

// 7. المزة العادية: مسموحة.
assertAllowed(
  { city: "دمشق", district: "المزة" },
  "المزة العادية يجب ألا تُحظر"
);

// 8. القامشلي كاملة ليست محظورة.
assertAllowed(
  { city: "القامشلي", district: "وسط المدينة" },
  "القامشلي وحدها يجب ألا تُحظر"
);

// القحطانية كمنطقة فقط لا تكفي للحظر.
assertAllowed(
  { city: "الحسكة", district: "القحطانية" },
  "القحطانية في district وحده يجب ألا تُحظر"
);

// 9. قرية محظورة ضمن الحسكة: محظورة من حقل village.
assertRestricted(
  {
    city: "الحسكة",
    district: "القامشلي",
    village: "القحطانية",
  },
  "القحطانية",
  "قرية القحطانية ضمن الحسكة يجب أن تُحظر"
);

// وعند غياب village تُطابق فقط بصيغة قرية واضحة في location_detail.
assertRestricted(
  {
    city: "القامشلي",
    district: "ريف القامشلي",
    location_detail: "العقار ضمن قرية القحطانية",
  },
  "القحطانية",
  "الصيغة الواضحة قرية القحطانية يجب أن تُحظر"
);

// 10. حي الزهراء في حلب: مسموح.
assertAllowed(
  { city: "حلب", district: "حي الزهراء" },
  "حي الزهراء في حلب يجب ألا يُحظر"
);

// لا يُفحص العنوان أو الوصف.
assertAllowed(
  {
    city: "دمشق",
    district: "ركن الدين",
    title: "إطلالة باتجاه السومرية",
    description: "ذُكرت ماروتا سيتي ضمن نص عابر",
  },
  "العنوان والوصف لا يدخلان في فحص المناطق"
);

// 11. الاستيراد الجماعي: تقسيم المسموح عن المحظور.
const batch = partitionRestrictedListings([
  { title: "معضمية عادية", city: "ريف دمشق", district: "معضمية الشام" },
  { title: "مزة عادية", city: "دمشق", district: "المزة" },
  { title: "مزة 86", city: "دمشق", district: "مزة 86" },
  { title: "ماروتا", city: "دمشق", district: "مشروع ماروتا سيتي" },
]);

assert.equal(batch.allowedListings.length, 2);
assert.equal(batch.restrictedListings.length, 2);
assert.deepEqual(
  batch.restrictedListings.map((item) => item.area),
  ["المزة 86", "ماروتا سيتي"]
);

// الحارس يمنع الوصول إلى الإدخال عند المستخدم.
let insertCalled = false;
try {
  assertListingAreaAllowed(
    { title: "اختبار", city: "دمشق", district: "عش الورور" },
    "add"
  );
  insertCalled = true;
} catch (error) {
  assert.equal(error.code, "RESTRICTED_AREA");
  assert.equal(error.area, "عش الورور");
}
assert.equal(insertCalled, false);

// 12. الإضافة الإدارية اليدوية لا تُلف بالحارس الخاص بالمستخدم.
const userGuardSource = readFileSync(
  new URL("../src/shared/utils/installRestrictedAreaGuards.js", import.meta.url),
  "utf8"
);
const adminServiceSource = readFileSync(
  new URL("../src/admin/services/adminService.js", import.meta.url),
  "utf8"
);

assert.match(userGuardSource, /listingService\.createListing/);
assert.doesNotMatch(userGuardSource, /adminService/);
assert.doesNotMatch(adminServiceSource, /assertListingAreaAllowed|findRestrictedArea/);

console.log("restricted area tests passed: 12 scenarios");
