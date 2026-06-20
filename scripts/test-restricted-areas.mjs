import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertListingAreaAllowed,
  findRestrictedArea,
  normalizeArabicText,
  partitionRestrictedListings,
} from "../src/shared/utils/restrictedAreas.js";
import {
  buildDatabaseRestrictionIndex,
  findRestrictedAreaInDatabaseIndex,
} from "../src/shared/utils/restrictedAreaDatabaseMatcher.js";

function assertAllowed(listing, label) {
  assert.equal(findRestrictedArea(listing), null, label);
}

function assertRestricted(listing, expected, label) {
  assert.equal(findRestrictedArea(listing), expected, label);
}

assert.equal(
  normalizeArabicText("  أَرَاضِي   المَغمورين ٨٦  "),
  "اراضي المغمورين 86"
);

assertAllowed(
  { city: "ريف دمشق", district: "معضمية الشام" },
  "معضمية الشام وحدها يجب ألا تُحظر"
);

assertRestricted(
  { city: "ريف دمشق", district: "معضمية الشام", village: "مساكن السومرية" },
  "السومرية",
  "السومرية يجب أن تُحظر"
);

assertRestricted(
  { city: "دمشق", district: "المزة ٨٦" },
  "المزة 86",
  "المزة 86 يجب أن تُحظر"
);

assertRestricted(
  { city: "دمشق", district: "حي الورود" },
  "حي الورود بدمشق",
  "حي الورود داخل دمشق يجب أن يُحظر"
);

assertAllowed(
  { city: "حلب", district: "حي الورود" },
  "حي الورود خارج دمشق يجب ألا يُحظر"
);

assertRestricted(
  { city: "دمشق", location_detail: "مشروع ماروتا سيتي" },
  "ماروتا سيتي",
  "ماروتا سيتي يجب أن تُحظر"
);

assertAllowed(
  { city: "دمشق", district: "المزة" },
  "المزة العادية يجب ألا تُحظر"
);

assertAllowed(
  { city: "القامشلي", district: "وسط المدينة" },
  "القامشلي وحدها يجب ألا تُحظر"
);

assertAllowed(
  { city: "الحسكة", district: "القحطانية" },
  "القحطانية في district وحده يجب ألا تُحظر"
);

assertRestricted(
  {
    city: "الحسكة",
    district: "القامشلي",
    village: "القحطانية",
  },
  "القحطانية",
  "قرية القحطانية ضمن الحسكة يجب أن تُحظر"
);

assertRestricted(
  {
    city: "القامشلي",
    district: "ريف القامشلي",
    location_detail: "العقار ضمن قرية القحطانية",
  },
  "القحطانية",
  "الصيغة الواضحة قرية القحطانية يجب أن تُحظر"
);

assertAllowed(
  { city: "حلب", district: "حي الزهراء" },
  "حي الزهراء في حلب يجب ألا يُحظر"
);

assertAllowed(
  {
    city: "دمشق",
    district: "ركن الدين",
    title: "إطلالة باتجاه السومرية",
    description: "ذُكرت ماروتا سيتي ضمن نص عابر",
  },
  "العنوان والوصف لا يدخلان في فحص المناطق"
);

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

// اختبار أعمدة الحظر المضافة إلى districts وvillages.
const databaseIndex = buildDatabaseRestrictionIndex({
  cities: [
    { id: 1, name: "دمشق" },
    { id: 2, name: "الحسكة" },
  ],
  districts: [
    {
      id: 10,
      name: "حي تجريبي",
      city_id: 1,
      is_restricted: true,
      restriction_reason: "يلزم التحقق من الملكية",
      restricted_aliases: ["الحي التجريبي", "حي الاختبار"],
    },
    {
      id: 20,
      name: "القامشلي",
      city_id: 2,
      is_restricted: false,
      restricted_aliases: [],
    },
  ],
  villages: [
    {
      id: 100,
      name: "قرية اختبار",
      district_id: 20,
      is_restricted: true,
      restriction_reason: "قرية تحتاج إلى مراجعة",
      restricted_aliases: ["اختبار"],
    },
  ],
});

const databaseDistrictRestriction = findRestrictedAreaInDatabaseIndex(
  { city: "دمشق", district: "حي الاختبار" },
  databaseIndex
);
assert.equal(databaseDistrictRestriction?.area, "حي تجريبي");
assert.equal(
  databaseDistrictRestriction?.reason,
  "يلزم التحقق من الملكية"
);
assert.equal(databaseDistrictRestriction?.source, "database");

assert.equal(
  findRestrictedAreaInDatabaseIndex(
    { city: "حلب", district: "حي الاختبار" },
    databaseIndex
  ),
  null,
  "يجب احترام سياق المدينة في قواعد قاعدة البيانات"
);

assert.equal(
  findRestrictedAreaInDatabaseIndex(
    {
      city: "الحسكة",
      district: "القامشلي",
      village: "اختبار",
    },
    databaseIndex
  )?.area,
  "قرية اختبار"
);

assert.equal(
  findRestrictedAreaInDatabaseIndex(
    {
      city: "الحسكة",
      district: "القامشلي",
      location_detail: "العقار ضمن قرية اختبار",
    },
    databaseIndex
  )?.area,
  "قرية اختبار"
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

assert.match(userGuardSource, /await assertListingAreaAllowedAsync/);
assert.match(importerServiceSource, /await assertListingAreaAllowedAsync/);
assert.doesNotMatch(userGuardSource, /adminService/);
assert.doesNotMatch(adminServiceSource, /assertListingAreaAllowedAsync|findRestrictedAreaResolved/);

console.log("restricted area tests passed: static and database rules");
