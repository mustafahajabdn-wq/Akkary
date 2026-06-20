import React from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../../shared/constants/colors.js";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";
import { normalizeArabicText } from "../../shared/utils/restrictedAreas.js";
import {
  clearRestrictedAreaRulesCache,
  primeRestrictedAreaRules,
} from "../../shared/services/restrictedAreaRulesService.js";
import { refreshGeoCache } from "../../app/services/geoCache.js";
import {
  fetchLocationsAdminData,
  saveCity,
  saveDistrict,
  saveVillage,
  updateDistrictRestriction,
  updateVillageRestriction,
} from "../services/locationsAdminService.js";

const DEFAULT_REASON = "يلزم التحقق من أصل الملكية قبل نشر الإعلان";

function emptyForm(kind = "city", cityId = "", districtId = "") {
  return {
    open: false,
    kind,
    id: null,
    name: "",
    cityId: String(cityId || ""),
    districtId: String(districtId || ""),
    lat: "",
    lng: "",
    sortOrder: "0",
    isRestricted: false,
    reason: DEFAULT_REASON,
  };
}

function sameName(a, b) {
  return normalizeArabicText(a) === normalizeArabicText(b);
}

function nextOrder(items, parentKey = null, parentId = null) {
  const rows = parentKey
    ? items.filter(item => String(item?.[parentKey]) === String(parentId))
    : items;
  const values = rows
    .map(item => Number(item?.sort_order || 0))
    .filter(Number.isFinite);
  return String((values.length ? Math.max(...values) : 0) + 1);
}

function inputStyle(DC) {
  return {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${DC?.border || "#CBD5E1"}`,
    borderRadius: 11,
    padding: "10px 11px",
    background: DC?.white || "#fff",
    color: DC?.text || "#17251D",
    fontFamily: "inherit",
    outline: "none",
  };
}

function ActionButton({ children, onClick, tone = "blue", disabled = false }) {
  const tones = {
    blue: ["#EFF6FF", "#1D4ED8", "#BFDBFE"],
    green: ["#ECFDF5", "#15803D", "#BBF7D0"],
    red: ["#FEF2F2", "#B91C1C", "#FECACA"],
    gray: ["#F8FAFC", "#475569", "#CBD5E1"],
  };
  const [background, color, border] = tones[tone] || tones.blue;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: `1px solid ${border}`,
        background,
        color,
        borderRadius: 10,
        padding: "7px 10px",
        fontFamily: "inherit",
        fontSize: 11,
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function LocationCard({
  item,
  kind,
  subtitle,
  childCount = 0,
  DC,
  onEdit,
  onToggleRestriction,
}) {
  const canRestrict = kind !== "city";
  const restricted = item?.is_restricted === true;

  return (
    <div
      style={{
        background: DC?.white || "#fff",
        border: `1px solid ${restricted ? "#FCA5A5" : DC?.border || "#DDE8E1"}`,
        borderRadius: 15,
        padding: 13,
        boxShadow: "0 4px 16px rgba(15,23,42,.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
            <strong style={{ color: DC?.text || "#17251D", fontSize: 14 }}>
              {item.name}
            </strong>
            <span
              style={{
                borderRadius: 999,
                padding: "3px 8px",
                background: kind === "city" ? "#F3E8FF" : kind === "district" ? "#E8F4F0" : "#EFF6FF",
                color: kind === "city" ? "#7E22CE" : kind === "district" ? C.primary : "#1D4ED8",
                fontSize: 9,
                fontWeight: 900,
              }}
            >
              {kind === "city" ? "مدينة" : kind === "district" ? "منطقة/حي" : "قرية"}
            </span>
            {restricted ? (
              <span style={{ borderRadius: 999, padding: "3px 8px", background: "#FEE2E2", color: "#B91C1C", fontSize: 9, fontWeight: 900 }}>
                محظورة
              </span>
            ) : null}
          </div>

          {subtitle ? (
            <div style={{ marginTop: 5, color: DC?.text3 || "#64748B", fontSize: 11 }}>
              {subtitle}
            </div>
          ) : null}

          {childCount > 0 ? (
            <div style={{ marginTop: 5, color: DC?.text3 || "#64748B", fontSize: 10 }}>
              {childCount} سجل تابع
            </div>
          ) : null}

          {item?.lat != null && item?.lng != null ? (
            <div dir="ltr" style={{ marginTop: 5, textAlign: "right", color: DC?.text3 || "#64748B", fontSize: 10 }}>
              {item.lat}, {item.lng}
            </div>
          ) : null}

          {restricted ? (
            <div style={{ marginTop: 7, color: "#991B1B", fontSize: 11, lineHeight: 1.7 }}>
              {item.restriction_reason || DEFAULT_REASON}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
          <ActionButton onClick={onEdit}>✏️ تعديل</ActionButton>
          {canRestrict ? (
            <ActionButton
              tone={restricted ? "red" : "green"}
              onClick={onToggleRestriction}
            >
              {restricted ? "إلغاء الحظر" : "تفعيل الحظر"}
            </ActionButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function LocationsPage({ DC }) {
  const navigate = useNavigate();
  const [data, setData] = React.useState({ cities: [], districts: [], villages: [] });
  const [tab, setTab] = React.useState("cities");
  const [selectedCityId, setSelectedCityId] = React.useState("");
  const [selectedDistrictId, setSelectedDistrictId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [form, setForm] = React.useState(() => emptyForm());

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await fetchLocationsAdminData();
      setData(next);
      setSelectedCityId(current => {
        if (current && next.cities.some(city => String(city.id) === String(current))) return current;
        return next.cities[0]?.id ? String(next.cities[0].id) : "";
      });
    } catch (loadError) {
      setError(loadError?.message || "تعذر تحميل المدن والمناطق");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const cityById = React.useMemo(
    () => new Map(data.cities.map(item => [String(item.id), item])),
    [data.cities]
  );
  const districtById = React.useMemo(
    () => new Map(data.districts.map(item => [String(item.id), item])),
    [data.districts]
  );

  const cityDistricts = React.useMemo(
    () => data.districts.filter(item => String(item.city_id) === String(selectedCityId)),
    [data.districts, selectedCityId]
  );

  React.useEffect(() => {
    setSelectedDistrictId(current => {
      if (current && cityDistricts.some(item => String(item.id) === String(current))) return current;
      return "";
    });
  }, [cityDistricts]);

  const selectedCity = cityById.get(String(selectedCityId));
  const normalizedSearch = normalizeArabicText(search);

  const filteredCities = data.cities.filter(city =>
    !normalizedSearch || normalizeArabicText(city.name).includes(normalizedSearch)
  );

  const filteredDistricts = cityDistricts.filter(district =>
    !normalizedSearch || normalizeArabicText(`${district.name} ${district.restriction_reason || ""}`).includes(normalizedSearch)
  );

  const cityVillages = data.villages.filter(village => {
    const parent = districtById.get(String(village.district_id));
    if (String(parent?.city_id) !== String(selectedCityId)) return false;
    if (selectedDistrictId && String(village.district_id) !== String(selectedDistrictId)) return false;
    return !normalizedSearch || normalizeArabicText(`${village.name} ${parent?.name || ""} ${village.restriction_reason || ""}`).includes(normalizedSearch);
  });

  const restrictedItems = [
    ...filteredDistricts.filter(item => item.is_restricted === true).map(item => ({ ...item, kind: "district" })),
    ...cityVillages.filter(item => item.is_restricted === true).map(item => ({ ...item, kind: "village" })),
  ];

  async function refreshCaches() {
    clearRestrictedAreaRulesCache();
    await Promise.all([
      primeRestrictedAreaRules(),
      refreshGeoCache().catch(() => null),
    ]);
  }

  function openCreate(kind) {
    setError("");
    setNotice("");
    const firstDistrict = cityDistricts[0]?.id || "";
    const next = emptyForm(kind, selectedCityId, selectedDistrictId || firstDistrict);
    next.open = true;
    next.sortOrder = kind === "city"
      ? nextOrder(data.cities)
      : kind === "district"
        ? nextOrder(data.districts, "city_id", selectedCityId)
        : nextOrder(data.villages, "district_id", next.districtId);
    setForm(next);
  }

  function openEdit(kind, item) {
    const parentDistrict = kind === "village" ? districtById.get(String(item.district_id)) : null;
    setError("");
    setNotice("");
    setForm({
      open: true,
      kind,
      id: item.id,
      name: item.name || "",
      cityId: String(kind === "city" ? item.id : parentDistrict?.city_id || item.city_id || selectedCityId || ""),
      districtId: String(kind === "village" ? item.district_id || "" : ""),
      lat: item.lat ?? "",
      lng: item.lng ?? "",
      sortOrder: String(item.sort_order ?? 0),
      isRestricted: item.is_restricted === true,
      reason: item.restriction_reason || DEFAULT_REASON,
    });
  }

  function duplicateExists() {
    if (form.kind === "city") {
      return data.cities.some(item => String(item.id) !== String(form.id) && sameName(item.name, form.name));
    }
    if (form.kind === "district") {
      return data.districts.some(item =>
        String(item.id) !== String(form.id) &&
        String(item.city_id) === String(form.cityId) &&
        sameName(item.name, form.name)
      );
    }
    return data.villages.some(item =>
      String(item.id) !== String(form.id) &&
      String(item.district_id) === String(form.districtId) &&
      sameName(item.name, form.name)
    );
  }

  async function submitForm(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!String(form.name || "").trim()) {
      setError("اكتب الاسم");
      return;
    }
    if (form.kind === "district" && !form.cityId) {
      setError("اختر المدينة");
      return;
    }
    if (form.kind === "village" && !form.districtId) {
      setError("اختر المنطقة الأب");
      return;
    }
    if (duplicateExists()) {
      setError("يوجد سجل بالاسم نفسه ضمن الأب المحدد");
      return;
    }

    setSaving(true);
    try {
      if (form.kind === "city") {
        await saveCity({ id: form.id, name: form.name, sortOrder: form.sortOrder });
      } else if (form.kind === "district") {
        await saveDistrict({
          id: form.id,
          name: form.name,
          cityId: form.cityId,
          lat: form.lat,
          lng: form.lng,
          sortOrder: form.sortOrder,
          isRestricted: form.isRestricted,
          reason: form.reason,
        });
      } else {
        await saveVillage({
          id: form.id,
          name: form.name,
          districtId: form.districtId,
          lat: form.lat,
          lng: form.lng,
          sortOrder: form.sortOrder,
          isRestricted: form.isRestricted,
          reason: form.reason,
        });
      }

      await refreshCaches();
      await load();
      setForm(emptyForm());
      setNotice("تم حفظ التعديل وتحديث بيانات المواقع والحظر.");
    } catch (saveError) {
      setError(saveError?.message || "تعذر حفظ التعديل");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRestriction(kind, item) {
    const nextRestricted = item.is_restricted !== true;
    const question = nextRestricted
      ? `تفعيل الحظر على «${item.name}»؟`
      : `إلغاء الحظر عن «${item.name}»؟`;
    if (!window.confirm(question)) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (kind === "district") {
        await updateDistrictRestriction(item.id, nextRestricted, item.restriction_reason || DEFAULT_REASON);
      } else {
        await updateVillageRestriction(item.id, nextRestricted, item.restriction_reason || DEFAULT_REASON);
      }
      await refreshCaches();
      await load();
      setNotice(nextRestricted ? "تم تفعيل الحظر." : "تم إلغاء الحظر.");
    } catch (toggleError) {
      setError(toggleError?.message || "تعذر تعديل الحظر");
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    ["cities", "🏙️", "المدن", data.cities.length],
    ["districts", "🏘️", "الأحياء والمناطق", cityDistricts.length],
    ["villages", "🌿", "القرى", cityVillages.length],
    ["restricted", "🛡️", "المحظورة", restrictedItems.length],
  ];

  return (
    <div style={S.pageShell(DC)}>
      <div style={S.primaryHero(C.primary)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => navigate("/admin/listings")} />
        </div>
        <div style={S.relZ1}>
          <div style={S.title20White}>🗺️ إدارة المدن والمناطق</div>
          <div style={S.whiteMeta12}>إضافة وتعديل المدن والأحياء والقرى والحظر</div>
        </div>
        <Wave />
      </div>

      <div style={{ padding: "12px 14px 90px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 6 }}>
          {tabs.map(([value, icon, label, count]) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTab(value);
                  setForm(emptyForm());
                }}
                style={{
                  border: active ? `1.5px solid ${C.primary}` : `1px solid ${DC?.border || "#DDE8E1"}`,
                  background: active ? "#E8F4F0" : DC?.white || "#fff",
                  color: active ? C.primary : DC?.text3 || "#64748B",
                  borderRadius: 12,
                  padding: "8px 3px",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 15 }}>{icon}</div>
                <div style={{ fontSize: 9, fontWeight: 900, marginTop: 2 }}>{label}</div>
                <div dir="ltr" style={{ fontSize: 9, fontWeight: 800, marginTop: 2 }}>{count}</div>
              </button>
            );
          })}
        </div>

        {tab !== "cities" ? (
          <div style={{ display: "flex", gap: 7, overflowX: "auto", marginTop: 11, paddingBottom: 4 }}>
            {data.cities.map(city => {
              const active = String(city.id) === String(selectedCityId);
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    setSelectedCityId(String(city.id));
                    setSelectedDistrictId("");
                  }}
                  style={{
                    flexShrink: 0,
                    border: active ? `1.5px solid ${C.primary}` : `1px solid ${DC?.border || "#DDE8E1"}`,
                    background: active ? C.primary : DC?.white || "#fff",
                    color: active ? "#fff" : DC?.text2 || "#475569",
                    borderRadius: 999,
                    padding: "7px 12px",
                    fontFamily: "inherit",
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {city.name}
                </button>
              );
            })}
          </div>
        ) : null}

        {tab === "villages" ? (
          <select
            value={selectedDistrictId}
            onChange={event => setSelectedDistrictId(event.target.value)}
            style={{ ...inputStyle(DC), marginTop: 9 }}
          >
            <option value="">كل المناطق ضمن {selectedCity?.name || "المدينة"}</option>
            {cityDistricts.map(district => (
              <option key={district.id} value={district.id}>{district.name}</option>
            ))}
          </select>
        ) : null}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="بحث بالاسم..."
            style={{ ...inputStyle(DC), flex: 1 }}
          />
          {tab !== "restricted" ? (
            <button
              type="button"
              onClick={() => openCreate(tab === "cities" ? "city" : tab === "districts" ? "district" : "village")}
              disabled={saving || (tab !== "cities" && !selectedCityId) || (tab === "villages" && !cityDistricts.length)}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "0 14px",
                background: C.primary,
                color: "#fff",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              + إضافة
            </button>
          ) : null}
        </div>

        {error ? <div style={{ marginTop: 10, padding: 10, borderRadius: 11, background: "#FEF2F2", color: "#B91C1C", fontSize: 12, fontWeight: 800 }}>{error}</div> : null}
        {notice ? <div style={{ marginTop: 10, padding: 10, borderRadius: 11, background: "#F0FDF4", color: "#166534", fontSize: 12, fontWeight: 800 }}>{notice}</div> : null}

        {form.open ? (
          <form onSubmit={submitForm} style={{ marginTop: 12, padding: 13, borderRadius: 15, border: `1.5px solid ${C.primary}`, background: DC?.white || "#fff", display: "grid", gap: 9 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.primary }}>
              {form.id ? "تعديل" : "إضافة"} {form.kind === "city" ? "مدينة" : form.kind === "district" ? "حي أو منطقة" : "قرية"}
            </div>

            {form.kind === "district" ? (
              <select value={form.cityId} onChange={event => setForm(current => ({ ...current, cityId: event.target.value }))} style={inputStyle(DC)}>
                <option value="">اختر المدينة</option>
                {data.cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select>
            ) : null}

            {form.kind === "village" ? (
              <>
                <select
                  value={form.cityId}
                  onChange={event => {
                    const cityId = event.target.value;
                    const first = data.districts.find(item => String(item.city_id) === String(cityId));
                    setForm(current => ({ ...current, cityId, districtId: String(first?.id || "") }));
                  }}
                  style={inputStyle(DC)}
                >
                  <option value="">اختر المدينة</option>
                  {data.cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                </select>
                <select value={form.districtId} onChange={event => setForm(current => ({ ...current, districtId: event.target.value }))} style={inputStyle(DC)}>
                  <option value="">اختر المنطقة الأب</option>
                  {data.districts.filter(item => String(item.city_id) === String(form.cityId)).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </>
            ) : null}

            <input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="الاسم" style={inputStyle(DC)} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input value={form.sortOrder} onChange={event => setForm(current => ({ ...current, sortOrder: event.target.value }))} type="number" placeholder="الترتيب" style={inputStyle(DC)} />
              <div />
            </div>

            {form.kind !== "city" ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input value={form.lat} onChange={event => setForm(current => ({ ...current, lat: event.target.value }))} type="number" step="any" placeholder="Latitude" dir="ltr" style={inputStyle(DC)} />
                  <input value={form.lng} onChange={event => setForm(current => ({ ...current, lng: event.target.value }))} type="number" step="any" placeholder="Longitude" dir="ltr" style={inputStyle(DC)} />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 900, color: DC?.text || "#17251D" }}>
                  <input type="checkbox" checked={form.isRestricted} onChange={event => setForm(current => ({ ...current, isRestricted: event.target.checked }))} />
                  منطقة محظورة وتحتاج مراجعة الملكية
                </label>

                {form.isRestricted ? (
                  <textarea value={form.reason} onChange={event => setForm(current => ({ ...current, reason: event.target.value }))} rows={3} placeholder="سبب الحظر" style={{ ...inputStyle(DC), resize: "vertical" }} />
                ) : null}
              </>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button type="submit" disabled={saving} style={{ border: "none", borderRadius: 11, padding: 10, background: C.primary, color: "#fff", fontFamily: "inherit", fontWeight: 900, cursor: "pointer" }}>
                {saving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
              <button type="button" onClick={() => setForm(emptyForm())} disabled={saving} style={{ border: `1px solid ${DC?.border || "#CBD5E1"}`, borderRadius: 11, padding: 10, background: "transparent", color: DC?.text2 || "#475569", fontFamily: "inherit", fontWeight: 900, cursor: "pointer" }}>
                إلغاء
              </button>
            </div>
          </form>
        ) : null}

        <div style={{ marginTop: 14, display: "grid", gap: 9 }}>
          {loading ? (
            <div style={S.emptyStateCentered}>⏳</div>
          ) : tab === "cities" ? (
            filteredCities.map(city => (
              <LocationCard
                key={city.id}
                item={city}
                kind="city"
                childCount={data.districts.filter(item => String(item.city_id) === String(city.id)).length}
                DC={DC}
                onEdit={() => openEdit("city", city)}
              />
            ))
          ) : tab === "districts" ? (
            filteredDistricts.map(district => (
              <LocationCard
                key={district.id}
                item={district}
                kind="district"
                subtitle={selectedCity?.name || ""}
                childCount={data.villages.filter(item => String(item.district_id) === String(district.id)).length}
                DC={DC}
                onEdit={() => openEdit("district", district)}
                onToggleRestriction={() => toggleRestriction("district", district)}
              />
            ))
          ) : tab === "villages" ? (
            cityVillages.map(village => {
              const parent = districtById.get(String(village.district_id));
              return (
                <LocationCard
                  key={village.id}
                  item={village}
                  kind="village"
                  subtitle={`${selectedCity?.name || ""} — ${parent?.name || ""}`}
                  DC={DC}
                  onEdit={() => openEdit("village", village)}
                  onToggleRestriction={() => toggleRestriction("village", village)}
                />
              );
            })
          ) : (
            restrictedItems.map(item => {
              const kind = item.kind;
              const parent = kind === "village" ? districtById.get(String(item.district_id)) : null;
              return (
                <LocationCard
                  key={`${kind}-${item.id}`}
                  item={item}
                  kind={kind}
                  subtitle={kind === "village" ? `${selectedCity?.name || ""} — ${parent?.name || ""}` : selectedCity?.name || ""}
                  DC={DC}
                  onEdit={() => openEdit(kind, item)}
                  onToggleRestriction={() => toggleRestriction(kind, item)}
                />
              );
            })
          )}

          {!loading && ((tab === "cities" && !filteredCities.length) || (tab === "districts" && !filteredDistricts.length) || (tab === "villages" && !cityVillages.length) || (tab === "restricted" && !restrictedItems.length)) ? (
            <div style={S.emptyStateCentered}>لا توجد نتائج</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
