import assert from "node:assert/strict";
import {
  assertListingAreaAllowed,
  findRestrictedArea,
  isRestrictedArea,
  normalizeArabicText,
  partitionRestrictedListings,
} from "../src/shared/utils/restrictedAreas.js";

assert.equal(normalizeArabicText("  أَرَاضِي   المَغمورين  "), "اراضي المغمورين");

assert.equal(
  findRestrictedArea({ district: "السُّومَرِيَّة" }),
  "السومرية"
);

assert.equal(
  findRestrictedArea({ location_detail: "العقار قرب قرية الشراشير مباشرة" }),
  "الشراشير"
);

assert.equal(
  findRestrictedArea({ village: "منطقة البلان" }),
  "البلان"
);

// لا نفحص العنوان أو الوصف إطلاقًا.
assert.equal(
  findRestrictedArea({
    city: "دمشق",
    district: "المزة",
    title: "إطلالة باتجاه السومرية",
    description: "ورد اسم الحزام العربي في وصف عابر",
  }),
  null
);

// لا تُحظر هذه المدن بكاملها.
assert.equal(isRestrictedArea({ city: "القامشلي" }), false);
assert.equal(isRestrictedArea({ city: "المالكية" }), false);
assert.equal(isRestrictedArea({ city: "رأس العين" }), false);

const { allowedListings, restrictedListings } = partitionRestrictedListings([
  { title: "إعلان مسموح", city: "دمشق", district: "المزة" },
  { title: "إعلان محظور 1", district: "محطة القدم" },
  { title: "إعلان محظور 2", village: "أراضي المغمورين" },
]);

assert.equal(allowedListings.length, 1);
assert.equal(restrictedListings.length, 2);
assert.equal(restrictedListings[0].area, "محطة القدم");
assert.equal(restrictedListings[1].area, "أراضي المغمورين");

// إثبات أن الحارس يوقف التنفيذ قبل استدعاء الإدخال الوهمي.
let insertCalled = false;
try {
  assertListingAreaAllowed(
    { title: "اختبار", district: "الحزام العربي" },
    "add"
  );
  insertCalled = true;
} catch (error) {
  assert.equal(error.code, "RESTRICTED_AREA");
}
assert.equal(insertCalled, false);

console.log("restricted area tests passed");
