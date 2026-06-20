import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertListingAreaAllowed,
  buildRestrictedAreaIndex,
  findRestrictedArea,
  normalizeArabicText,
  partitionRestrictedListings,
  setRestrictedAreaIndex,
} from "../src/shared/utils/restrictedAreas.js";

const restrictionIndex = buildRestrictedAreaIndex({
  cities: [
    { id: 1, name: "دمشق" },
    { id: 2, name: "ريف دمشق" },
    { id: 3, name: "الحسكة" },
    { id: 4, name: "حلب" },
    { id: 5, name: "اللاذقية" },
  ],
  districts: [
    { id: 10, name: "معضمية الشام", city_id: 2, is_restricted: false },
    { id: 11, name: "السومرية", city_id: 2, is_restricted: true, restriction_reason: "مراجعة الملكية" },
    { id: 12, name: "المزة 86", city_id: 1, is_restricted: true, restriction_reason: "مراجعة الملكية" },
    { id: 13, name: "حي الورود", city_id: 1, is_restricted: true, restriction_reason: "مراجعة الملكية" },
    { id: 14, name: "ماروتا سيتي", city_id: 1, is_restricted: true, restriction_reason: "مراجعة الملكية" },
    { id: 15, name: "المزة", city_id: 1, is_restricted: false },
    { id: 16, name: "القامشلي", city_id: 3, is_restricted: false },
    { id: 17, name: "حي الزهراء", city_id: 4, is_restricted: false },
    { id: 18, name: "جبلة", city_id: 5, is_restricted: false },
  ],
  villages: [
    { id: 100, name: "القحطانية", district_id: 16, is_restricted: true, restriction_reason: "قرية تحتاج إلى مراجعة" },
    { id: 101, name: "الشراشير", district_id: 18, is_restricted: true, restriction_reason: "قرية تحتاج إلى مراجعة" },
  ],
});

setRestrictedAreaIndex(restrictionIndex);

function assertAllowed(listing, label) {
  assert.equal(findRestrictedArea(listing), null, label);
}

function assertRestricted(listing, expected, label) {
  assert.equal(findRestrictedArea(listing), expected, label);
}

assert.equal(
  normalizeArabicText("  المَزَّة ٨٦  "),
  "المزه 86"
);

assertAllowed(
  { city: "ريف دمشق", district: "معضمية الشام" },
  "معضمية الشام العادية يجب أن تبقى مسموحة"
);

assertRestricted(
  { city: "ريف دمشق", district: "السومرية" },
  "السومرية",
  "السومرية يجب أن تُحظر من سجل district"
);

assertRestricted(
  { city: "دمشق", district: "المزة ٨٦" },
  "المزة 86",
  "الأرقام العربية والإنجليزية يجب أن تتطابق"
);

assertRestricted(
  { city: "دمشق", district: "حي الورود" },
  "حي الورود",
  "حي الورود بدمشق يجب أن يُحظر"
);

assertAllowed(
  { city: "حلب", district: "حي الورود" },
  "الاسم نفسه خارج دمشق لا يُحظر"
);

assertRestricted(
  { city: "دمشق", district: "ماروتا سيتي" },
  "ماروتا سيتي",
  "ماروتا سيتي يجب أن تُحظر"
);

assertAllowed(
  { city: "دمشق", district: "المزة" },
  "المزة العادية يجب أن تبقى مسموحة"
);

assertAllowed(
  { city: "الحسكة", district: "القامشلي" },
  "القامشلي ليست محظورة كاملة"
);

assertRestricted(
  {
    city: "الحسكة",
    district: "القامشلي",
    village: "القحطانية",
  },
  "القحطانية",
  "القرية المحظورة يجب أن تُحظر من حقل village"
);

assertRestricted(
  {
    city: "الحسكة",
    district: "القامشلي",
    location_detail: "العقار ضمن قرية القحطانية",
  },
  "القحطانية",
  "تُقبل صيغة قرية واضحة داخل location_detail"
);

assertAllowed(
  { city: "حلب", district: "حي الزهراء" },
  "حي الزهراء في حلب يجب أن يبقى مسموحًا"
);

assertAllowed(
  {
    city: "دمشق",
    district: "المزة",
    title: "إطلالة باتجاه السومرية",
    description: "ذُكرت ماروتا سيتي ضمن وصف عابر",
  },
  "العنوان والوصف لا يدخلان في الفحص"
);

const batch = partitionRestrictedListings([
  { title: "مسموح 1", city: "ريف دمشق", district: "معضمية الشام" },
  { title: "مسموح 2", city: "دمشق", district: "المزة" },
  { title: "محظور 1", city: "دمشق", district: "المزة 86" },
  { title: "محظور 2", city: "الحسكة", district: "القامشلي", village: "القحطانية" },
]);

assert.equal(batch.allowedListings.length, 2);
assert.equal(batch.restrictedListings.length, 2);
assert.deepEqual(
  batch.restrictedListings.map((item) => item.area),
  ["المزة 86", "القحطانية"]
);

let insertCalled = false;
try {
  assertListingAreaAllowed(
    { title: "اختبار", city: "دمشق", district: "المزة 86" },
    "add"
  );
  insertCalled = true;
} catch (error) {
  assert.equal(error.code, "RESTRICTED_AREA");
  assert.equal(error.area, "المزة 86");
}
assert.equal(insertCalled, false);

const rulesServiceSource = readFileSync(
  new URL("../src/shared/services/restrictedAreaRulesService.js", import.meta.url),
  "utf8"
);
const userGuardSource = readFileSync(
  new URL("../src/shared/utils/installRestrictedAreaGuards.js", import.meta.url),
  "utf8"
);
const importerServiceSource = readFileSync(
  new URL("../src/admin/services/importerService.js", import.meta.url),
  "utf8"
);
const adminServiceSource = readFileSync(
  new URL("../src/admin/services/adminService.js", import.meta.url),
  "utf8"
);

assert.doesNotMatch(rulesServiceSource, /restricted_aliases/);
assert.match(rulesServiceSource, /is_restricted,restriction_reason/);
assert.match(userGuardSource, /await assertListingAreaAllowedAsync/);
assert.match(importerServiceSource, /await assertListingAreaAllowedAsync/);
assert.doesNotMatch(adminServiceSource, /assertListingAreaAllowedAsync|findRestrictedAreaResolved/);

console.log("restricted area tests passed: database tables only, no JSON aliases");
