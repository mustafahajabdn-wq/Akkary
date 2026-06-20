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

function SmallButton({ children, onClick, tone = "blue", disabled = false }) {
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

function StepButton({ active, completed, label, value, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 0,
        flex: 1,
        border: active
          ? `2px solid ${C.primary}`
          : `1px solid ${completed ? "#86C7A5" : "#D8E0DA"}`,
        background: active ? "#E8F4F0" : completed ? "#F0FDF4" : "#fff",
        color: active || completed ? C.primary : "#64748B",
        borderRadius: 13,
        padding: "9px 5px",
        fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 900 }}>{label}</div>
      <div
        style={{
          marginTop: 3,
          fontSize: 11,
          fontWeight: 800,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {value || "اختر"}
      </div>
    </button>
  );
}

function LocationCard({
  item,
  kind,
  childCount,
  DC,
  onOpen,
  onEdit,
  onToggleRestriction,
}) {
  const restricted = item?.is_restricted === true;
  const canOpen = kind !== "village";
  const canRestrict = kind !== "city";
  const label = kind === "city" ? "المدينة" : kind === "district" ? "المنطقة / الحي" : "القرية";

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
        <button
          type="button"
          onClick={canOpen ? onOpen : undefined}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            background: "transparent",
            padding: 0,
            textAlign: "right",
            fontFamily: "inherit",
            cursor: canOpen ? "pointer" : "default",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <strong style={{ color: DC?.text || "#17251D", fontSize: 14 }}>{item.name}</strong>
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
              {label}
            </span>
            {restricted ? (
              <span style={{ borderRadius: 999, padding: "3px 8px", background: "#FEE2E2", color: "#B91C1C", fontSize: 9, fontWeight: 900 }}>
                محظورة
              </span>
            ) : null}
          </div>

          {canOpen ? (
            <div style={{ marginTop: 6, color: DC?.text3 || "#64748B", fontSize: 11 }}>
              {childCount} {kind === "city" ? "منطقة / حي" : "قرية"} · اضغط للفتح
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
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
          <SmallButton onClick={onEdit}>✏️ تعديل</SmallButton>
          {canRestrict ? (
            <SmallButton tone={restricted ? "red" : "green"} onClick={onToggleRestriction}>
              {restricted ? "إلغاء الحظر" : "تفعيل الحظر"}
            </SmallButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function LocationsHierarchyPage({ DC }) {
  const navigate = useNavigate();
  const [data, setData] = React.useState({ cities: [], districts: [], villages: [] });
  const [level, setLevel] = React.useState("city");
  const [selectedCityId, setSelectedCityId] = React.useState("");
  const [selectedDistrictId, setSelectedDistrictId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [restrictedOnly, setRestrictedOnly] = React.useState(false);
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
      setSelectedCityId(current =>
        current && next.cities.some(city => String(city.id) === String(current)) ? current : ""
      );
      setSelectedDistrictId(current =>
        current && next.districts.some(district => String(district.id) === String(current)) ? current : ""
      );
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
  const selectedCity = cityById.get(String(selectedCityId));
  const selectedDistrict = districtById.get(String(selectedDistrictId));

  const cityDistricts = React.useMemo(
    () => data.districts.filter(item => String(item.city_id) === String(selectedCityId)),
    [data.districts, selectedCityId]
  );
  const districtVillages = React.useMemo(
    () => data.villages.filter(item => String(item.district_id) === String(selectedDistrictId)),
    [data.villages, selectedDistrictId]
  );

  const sourceItems = level === "city"
    ? data.cities
    : level === "district"
      ? cityDistricts
      : districtVillages;

  const normalizedSearch = normalizeArabicText(search);
  const visibleItems = sourceItems.filter(item => {
    if (restrictedOnly && level !== "city" && item.is_restricted !== true) return false;
    if (!normalizedSearch) return true;
    return normalizeArabicText(`${item.name} ${item.restriction_reason || ""}`).includes(normalizedSearch);
  });

  async function refreshCaches() {
    clearRestrictedAreaRulesCache();
    await Promise.all([
      primeRestrictedAreaRules(),
      refreshGeoCache().catch(() => null),
    ]);
  }

  function goToCities() {
    setLevel("city");
    setSelectedCityId("");
    setSelectedDistrictId("");
    setSearch("");
    setForm(emptyForm());
  }

  function openCity(city) {
    setSelectedCityId(String(city.id));
    setSelectedDistrictId("");
    setLevel("district");
    setSearch("");
    setForm(emptyForm());
  }

  function openDistrict(district) {
    setSelectedDistrictId(String(district.id));
    setLevel("village");
    setSearch("");
    setForm(emptyForm());
  }

  function currentKind() {
    return level === "city" ? "city" : level === "district" ? "district" : "village";
  }

  function openCreate() {
    const kind = currentKind();
    const next = emptyForm(kind, selectedCityId, selectedDistrictId);
    next.open = true;
    next.sortOrder = kind === "city"
      ? nextOrder(data.cities)
      : kind === "district"
        ? nextOrder(data.districts, "city_id", selectedCityId)
        : nextOrder(data.villages, "district_id", selectedDistrictId);
    setError("");
    setNotice("");
    setForm(next);
  }

  function openEdit(item) {
    const kind = currentKind();
    const parentDistrict = kind === "village"
      ? districtById.get(String(item.district_id))
      : null;
    setForm({
      open: true,
      kind,
      id: item.id,
      name: item.name || "",
      cityId: String(kind === "city" ? item.id : parentDistrict?.city_id || item.city_id || selectedCityId || ""),
      districtId: String(kind === "village" ? item.district_id || selectedDistrictId : ""),
      lat: item.lat ?? "",
      lng: item.lng ?? "",
      sortOrder: String(item.sort_order ?? 0),
      isRestricted: item.is_restricted === true,
      reason: item.restriction_reason || DEFAULT_REASON,
    });
    setError("");
    setNotice("");
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
      setError("اختر المنطقة / الحي");
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
      setNotice("تم الحفظ وتحديث بيانات الموقع والحظر.");
    } catch (saveError) {
      setError(saveError?.message || "تعذر حفظ التعديل");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRestriction(item) {
    const kind = currentKind();
    if (kind === "city") return;
    const nextRestricted = item.is_restricted !== true;
    if (!window.confirm(nextRestricted ? `تفعيل الحظر على «${item.name}»؟` : `إلغاء الحظر عن «${item.name}»؟`)) return;

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

  const title = level === "city"
    ? "المدينة"
    : level === "district"
      ? `المنطقة / الحي في ${selectedCity?.name || ""}`
      : `القرية في ${selectedDistrict?.name || ""}`;

  const addLabel = level === "city"
    ? "+ إضافة مدينة"
    : level === "district"
      ? "+ إضافة منطقة / حي"
      : "+ إضافة قرية";

  return (
    <div style={S.pageShell(DC)} dir="rtl">
      <div style={S.primaryHero(C.primary)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => navigate("/admin/listings")} />
        </div>
        <div style={S.relZ1}>
          <div style={S.title20White}>🗺️ إدارة المواقع</div>
          <div style={S.whiteMeta12}>المدينة ← المنطقة / الحي ← القرية</div>
        </div>
        <Wave />
      </div>

      <div style={{ padding: "12px 14px 90px" }}>
        <div style={{ display: "flex", gap: 7 }}>
          <StepButton
            active={level === "city"}
            completed={Boolean(selectedCity)}
            label="المدينة"
            value={selectedCity?.name}
            onClick={goToCities}
          />
          <StepButton
            active={level === "district"}
            completed={Boolean(selectedDistrict)}
            label="المنطقة / الحي"
            value={selectedDistrict?.name}
            disabled={!selectedCity}
            onClick={() => {
              setLevel("district");
              setSelectedDistrictId("");
              setSearch("");
              setForm(emptyForm());
            }}
          />
          <StepButton
            active={level === "village"}
            completed={false}
            label="القرية"
            value={level === "village" ? "القائمة" : ""}
            disabled={!selectedDistrict}
            onClick={() => {
              setLevel("village");
              setSearch("");
              setForm(emptyForm());
            }}
          />
        </div>

        <div style={{ marginTop: 13, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: DC?.text || "#17251D" }}>{title}</div>
          <button
            type="button"
            onClick={openCreate}
            disabled={saving || (level === "district" && !selectedCity) || (level === "village" && !selectedDistrict)}
            style={{
              border: "none",
              borderRadius: 11,
              padding: "9px 12px",
              background: C.primary,
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {addLabel}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={`بحث في ${title}...`}
            style={{ ...inputStyle(DC), flex: 1 }}
          />
          {level !== "city" ? (
            <button
              type="button"
              onClick={() => setRestrictedOnly(value => !value)}
              style={{
                border: `1px solid ${restrictedOnly ? "#FCA5A5" : DC?.border || "#CBD5E1"}`,
                borderRadius: 11,
                padding: "0 10px",
                background: restrictedOnly ? "#FEF2F2" : DC?.white || "#fff",
                color: restrictedOnly ? "#B91C1C" : DC?.text2 || "#475569",
                fontFamily: "inherit",
                fontSize: 11,
                fontWeight: 900,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              🛡️ المحظورة
            </button>
          ) : null}
        </div>

        {error ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 11, background: "#FEF2F2", color: "#B91C1C", fontSize: 12, fontWeight: 800 }}>
            {error}
          </div>
        ) : null}
        {notice ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 11, background: "#F0FDF4", color: "#166534", fontSize: 12, fontWeight: 800 }}>
            {notice}
          </div>
        ) : null}

        {form.open ? (
          <form
            onSubmit={submitForm}
            style={{
              marginTop: 12,
              padding: 13,
              borderRadius: 15,
              border: `1.5px solid ${C.primary}`,
              background: DC?.white || "#fff",
              display: "grid",
              gap: 9,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 900, color: C.primary }}>
              {form.id ? "تعديل" : "إضافة"} {form.kind === "city" ? "المدينة" : form.kind === "district" ? "المنطقة / الحي" : "القرية"}
            </div>

            {form.kind === "district" ? (
              <select
                value={form.cityId}
                onChange={event => setForm(current => ({ ...current, cityId: event.target.value }))}
                style={inputStyle(DC)}
              >
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
                <select
                  value={form.districtId}
                  onChange={event => setForm(current => ({ ...current, districtId: event.target.value }))}
                  style={inputStyle(DC)}
                >
                  <option value="">اختر المنطقة / الحي</option>
                  {data.districts
                    .filter(item => String(item.city_id) === String(form.cityId))
                    .map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </>
            ) : null}

            <input
              value={form.name}
              onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
              placeholder="الاسم"
              style={inputStyle(DC)}
            />

            <input
              value={form.sortOrder}
              onChange={event => setForm(current => ({ ...current, sortOrder: event.target.value }))}
              type="number"
              placeholder="ترتيب الظهور"
              style={inputStyle(DC)}
            />

            {form.kind !== "city" ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    value={form.lat}
                    onChange={event => setForm(current => ({ ...current, lat: event.target.value }))}
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    dir="ltr"
                    style={inputStyle(DC)}
                  />
                  <input
                    value={form.lng}
                    onChange={event => setForm(current => ({ ...current, lng: event.target.value }))}
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    dir="ltr"
                    style={inputStyle(DC)}
                  />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 900, color: DC?.text || "#17251D" }}>
                  <input
                    type="checkbox"
                    checked={form.isRestricted}
                    onChange={event => setForm(current => ({ ...current, isRestricted: event.target.checked }))}
                  />
                  محظورة وتحتاج مراجعة الملكية
                </label>

                {form.isRestricted ? (
                  <textarea
                    value={form.reason}
                    onChange={event => setForm(current => ({ ...current, reason: event.target.value }))}
                    rows={3}
                    placeholder="سبب الحظر"
                    style={{ ...inputStyle(DC), resize: "vertical" }}
                  />
                ) : null}
              </>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                type="submit"
                disabled={saving}
                style={{ border: "none", borderRadius: 11, padding: 10, background: C.primary, color: "#fff", fontFamily: "inherit", fontWeight: 900, cursor: "pointer" }}
              >
                {saving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
              <button
                type="button"
                onClick={() => setForm(emptyForm())}
                disabled={saving}
                style={{ border: `1px solid ${DC?.border || "#CBD5E1"}`, borderRadius: 11, padding: 10, background: "transparent", color: DC?.text2 || "#475569", fontFamily: "inherit", fontWeight: 900, cursor: "pointer" }}
              >
                إلغاء
              </button>
            </div>
          </form>
        ) : null}

        <div style={{ marginTop: 14, display: "grid", gap: 9 }}>
          {loading ? (
            <div style={S.emptyStateCentered}>⏳</div>
          ) : visibleItems.length ? (
            visibleItems.map(item => {
              const kind = currentKind();
              const childCount = kind === "city"
                ? data.districts.filter(row => String(row.city_id) === String(item.id)).length
                : kind === "district"
                  ? data.villages.filter(row => String(row.district_id) === String(item.id)).length
                  : 0;
              return (
                <LocationCard
                  key={`${kind}-${item.id}`}
                  item={item}
                  kind={kind}
                  childCount={childCount}
                  DC={DC}
                  onOpen={() => kind === "city" ? openCity(item) : kind === "district" ? openDistrict(item) : null}
                  onEdit={() => openEdit(item)}
                  onToggleRestriction={() => toggleRestriction(item)}
                />
              );
            })
          ) : (
            <div style={S.emptyStateCentered}>لا توجد نتائج</div>
          )}
        </div>
      </div>
    </div>
  );
}
