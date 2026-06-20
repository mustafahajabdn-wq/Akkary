import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { C } from "../../shared/constants/colors.js";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";
import { normalizeArabicText } from "../../shared/utils/restrictedAreas.js";
import {
  clearRestrictedAreaRulesCache,
  primeRestrictedAreaRules,
} from "../../shared/services/restrictedAreaRulesService.js";
import {
  fetchRestrictedAreasAdminData,
  saveRestrictedDistrict,
  saveRestrictedVillage,
  setDistrictRestriction,
  setVillageRestriction,
} from "../services/restrictedAreasAdminService.js";

const DEFAULT_REASON = "يلزم التحقق من أصل الملكية قبل نشر الإعلان";

function emptyForm(kind = "district", cityId = "") {
  return {
    open: false,
    kind,
    id: null,
    cityId: cityId ? String(cityId) : "",
    districtId: "",
    name: "",
    reason: DEFAULT_REASON,
  };
}

function sameName(a, b) {
  return normalizeArabicText(a) === normalizeArabicText(b);
}

function nextSortOrder(items, parentKey, parentId) {
  const values = items
    .filter(item => String(item?.[parentKey]) === String(parentId))
    .map(item => Number(item?.sort_order || 0))
    .filter(Number.isFinite);

  return (values.length ? Math.max(...values) : 0) + 1;
}

function RestrictionCard({ item, type, parentName, DC, onEdit, onDisable }) {
  return (
    <div
      style={{
        background: DC?.white || "#fff",
        border: `1px solid ${DC?.border || "#DDE8E1"}`,
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 5px 18px rgba(15,23,42,.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flexWrap: "wrap",
            }}
          >
            <strong style={{ color: DC?.text || "#17251D", fontSize: 15 }}>
              {item.name}
            </strong>
            <span
              style={{
                borderRadius: 999,
                padding: "3px 8px",
                background: type === "district" ? "#E8F4F0" : "#EFF6FF",
                color: type === "district" ? C.primary : "#1D4ED8",
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              {type === "district" ? "منطقة" : "قرية"}
            </span>
          </div>

          {parentName ? (
            <div style={{ marginTop: 5, fontSize: 11, color: DC?.text3 || "#64748B" }}>
              تتبع: {parentName}
            </div>
          ) : null}

          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              lineHeight: 1.8,
              color: DC?.text2 || "#475569",
            }}
          >
            {item.restriction_reason || DEFAULT_REASON}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => onEdit(item)}
            style={{
              border: "1px solid #BFDBFE",
              background: "#EFF6FF",
              color: "#1D4ED8",
              borderRadius: 10,
              padding: "7px 10px",
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            ✏️ تعديل
          </button>

          <button
            type="button"
            onClick={() => onDisable(item)}
            style={{
              border: "1px solid #FECACA",
              background: "#FEF2F2",
              color: "#B91C1C",
              borderRadius: 10,
              padding: "7px 10px",
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            إلغاء الحظر
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RestrictedAreasPage({ DC, user }) {
  const navigate = useNavigate();

  if (
    user?.role !== "admin" &&
    !(user?.allowedPages || []).includes("adminListings")
  ) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const [data, setData] = React.useState({
    cities: [],
    districts: [],
    villages: [],
  });
  const [selectedCityId, setSelectedCityId] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [form, setForm] = React.useState(() => emptyForm());

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const next = await fetchRestrictedAreasAdminData();
      setData(next);
      setSelectedCityId(current => {
        if (current && next.cities.some(city => String(city.id) === String(current))) {
          return current;
        }
        return next.cities[0]?.id ? String(next.cities[0].id) : "";
      });
    } catch (loadError) {
      setError(loadError?.message || "تعذر تحميل المناطق");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const selectedCity = data.cities.find(
    city => String(city.id) === String(selectedCityId)
  );

  const cityDistricts = data.districts.filter(
    district => String(district.city_id) === String(selectedCityId)
  );

  const districtById = React.useMemo(
    () => new Map(data.districts.map(item => [String(item.id), item])),
    [data.districts]
  );

  const restrictedDistricts = cityDistricts.filter(item => item.is_restricted === true);
  const restrictedVillages = data.villages.filter(village => {
    if (village.is_restricted !== true) return false;
    const parent = districtById.get(String(village.district_id));
    return String(parent?.city_id) === String(selectedCityId);
  });

  const normalizedSearch = normalizeArabicText(search);
  const visibleDistricts = restrictedDistricts.filter(item => {
    if (!normalizedSearch) return true;
    return normalizeArabicText(
      `${item.name} ${item.restriction_reason || ""}`
    ).includes(normalizedSearch);
  });
  const visibleVillages = restrictedVillages.filter(item => {
    if (!normalizedSearch) return true;
    const parent = districtById.get(String(item.district_id));
    return normalizeArabicText(
      `${item.name} ${parent?.name || ""} ${item.restriction_reason || ""}`
    ).includes(normalizedSearch);
  });

  function openAdd(kind) {
    setError("");
    setNotice("");
    setForm({
      ...emptyForm(kind, selectedCityId),
      open: true,
      districtId: kind === "village" ? String(cityDistricts[0]?.id || "") : "",
    });
  }

  function openEdit(kind, item) {
    const parent = kind === "village"
      ? districtById.get(String(item.district_id))
      : null;

    setError("");
    setNotice("");
    setForm({
      open: true,
      kind,
      id: item.id,
      cityId: String(parent?.city_id || item.city_id || selectedCityId),
      districtId: kind === "village" ? String(item.district_id || "") : "",
      name: item.name || "",
      reason: item.restriction_reason || DEFAULT_REASON,
    });
  }

  async function refreshRuleCache() {
    clearRestrictedAreaRulesCache();
    await primeRestrictedAreaRules();
  }

  async function saveForm(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const name = String(form.name || "").trim();
    const reason = String(form.reason || "").trim();

    if (!name) {
      setError("اكتب اسم المنطقة أو القرية");
      return;
    }

    if (!form.cityId) {
      setError("اختر المدينة");
      return;
    }

    if (form.kind === "village" && !form.districtId) {
      setError("اختر المنطقة الأب للقرية");
      return;
    }

    setSaving(true);

    try {
      if (form.kind === "district") {
        const existing = data.districts.find(
          item =>
            String(item.city_id) === String(form.cityId) &&
            sameName(item.name, name)
        );

        await saveRestrictedDistrict({
          id: form.id || existing?.id || null,
          name,
          cityId: form.cityId,
          reason,
          isRestricted: true,
          sortOrder: nextSortOrder(data.districts, "city_id", form.cityId),
        });
      } else {
        const existing = data.villages.find(
          item =>
            String(item.district_id) === String(form.districtId) &&
            sameName(item.name, name)
        );

        await saveRestrictedVillage({
          id: form.id || existing?.id || null,
          name,
          districtId: form.districtId,
          reason,
          isRestricted: true,
          sortOrder: nextSortOrder(data.villages, "district_id", form.districtId),
        });
      }

      await refreshRuleCache();
      await load();
      setForm(emptyForm(form.kind, form.cityId));
      setNotice("تم حفظ المنطقة المحظورة وتحديث قواعد الحظر.");
    } catch (saveError) {
      setError(saveError?.message || "تعذر حفظ المنطقة");
    } finally {
      setSaving(false);
    }
  }

  async function disableRestriction(kind, item) {
    if (!window.confirm(`إلغاء حظر «${item.name}»؟`)) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (kind === "district") {
        await setDistrictRestriction(item.id, false);
      } else {
        await setVillageRestriction(item.id, false);
      }

      await refreshRuleCache();
      await load();
      setNotice(`تم إلغاء حظر «${item.name}».`);
    } catch (disableError) {
      setError(disableError?.message || "تعذر إلغاء الحظر");
    } finally {
      setSaving(false);
    }
  }

  const totalRestricted = restrictedDistricts.length + restrictedVillages.length;

  return (
    <div style={S.pageShell(DC)}>
      <div style={S.primaryHero(C.primary)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" width={430} height={200} />
        <div style={S.absTopRight14}>
          <BackButton onPress={() => navigate("/admin/listings")} />
        </div>
        <div style={S.relZ1}>
          <div style={S.title20White}>🛡️ المناطق المحظورة</div>
          <div style={S.whiteMeta12}>
            {selectedCity?.name || "المدن والمناطق"} · {totalRestricted} محظورة
          </div>
        </div>
        <Wave />
      </div>

      <div style={{ padding: "12px 14px 90px" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 8,
          }}
        >
          {data.cities.map(city => {
            const active = String(city.id) === String(selectedCityId);
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => {
                  setSelectedCityId(String(city.id));
                  setForm(emptyForm());
                }}
                style={{
                  flexShrink: 0,
                  border: active ? `1.5px solid ${C.primary}` : `1px solid ${DC?.border || "#DDE8E1"}`,
                  background: active ? "#E8F4F0" : DC?.white || "#fff",
                  color: active ? C.primary : DC?.text2 || "#475569",
                  borderRadius: 999,
                  padding: "8px 13px",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {city.name}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={() => openAdd("district")}
            disabled={!selectedCityId || saving}
            style={{
              border: "none",
              borderRadius: 13,
              background: C.primary,
              color: "#fff",
              padding: 11,
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            + إضافة منطقة محظورة
          </button>

          <button
            type="button"
            onClick={() => openAdd("village")}
            disabled={!selectedCityId || !cityDistricts.length || saving}
            style={{
              border: "1px solid #93C5FD",
              borderRadius: 13,
              background: "#EFF6FF",
              color: "#1D4ED8",
              padding: 11,
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            + إضافة قرية محظورة
          </button>
        </div>

        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="بحث ضمن المناطق المحظورة..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 10,
            border: `1px solid ${DC?.border || "#DDE8E1"}`,
            borderRadius: 13,
            padding: "10px 12px",
            background: DC?.white || "#fff",
            color: DC?.text || "#17251D",
            fontFamily: "inherit",
            outline: "none",
          }}
        />

        {error ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#FEF2F2", color: "#B91C1C", fontSize: 12, fontWeight: 800 }}>
            {error}
          </div>
        ) : null}

        {notice ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 12, background: "#F0FDF4", color: "#166534", fontSize: 12, fontWeight: 800 }}>
            {notice}
          </div>
        ) : null}

        {form.open ? (
          <form
            onSubmit={saveForm}
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 16,
              background: DC?.white || "#fff",
              border: `1.5px solid ${C.primary}`,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 900, color: C.primary }}>
              {form.id ? "تعديل" : "إضافة"} {form.kind === "district" ? "منطقة محظورة" : "قرية محظورة"}
            </div>

            <select
              value={form.cityId}
              onChange={event => {
                const cityId = event.target.value;
                const firstDistrict = data.districts.find(
                  district => String(district.city_id) === String(cityId)
                );
                setForm(current => ({
                  ...current,
                  cityId,
                  districtId: current.kind === "village" ? String(firstDistrict?.id || "") : "",
                }));
              }}
              disabled={Boolean(form.id)}
              style={{ padding: 10, borderRadius: 11, border: `1px solid ${DC?.border || "#CBD5E1"}`, fontFamily: "inherit" }}
            >
              {data.cities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>

            {form.kind === "village" ? (
              <select
                value={form.districtId}
                onChange={event => setForm(current => ({ ...current, districtId: event.target.value }))}
                disabled={Boolean(form.id)}
                style={{ padding: 10, borderRadius: 11, border: `1px solid ${DC?.border || "#CBD5E1"}`, fontFamily: "inherit" }}
              >
                <option value="">اختر المنطقة الأب</option>
                {data.districts
                  .filter(district => String(district.city_id) === String(form.cityId))
                  .map(district => (
                    <option key={district.id} value={district.id}>{district.name}</option>
                  ))}
              </select>
            ) : null}

            <input
              value={form.name}
              onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
              placeholder={form.kind === "district" ? "اسم المنطقة" : "اسم القرية"}
              style={{ padding: 10, borderRadius: 11, border: `1px solid ${DC?.border || "#CBD5E1"}`, fontFamily: "inherit" }}
            />

            <textarea
              value={form.reason}
              onChange={event => setForm(current => ({ ...current, reason: event.target.value }))}
              placeholder="سبب الحظر"
              rows={3}
              style={{ padding: 10, borderRadius: 11, border: `1px solid ${DC?.border || "#CBD5E1"}`, fontFamily: "inherit", resize: "vertical" }}
            />

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

        {loading ? (
          <div style={S.emptyStateCentered}>⏳</div>
        ) : totalRestricted === 0 ? (
          <div style={S.emptyStateCentered}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>🛡️</div>
            <div style={{ fontWeight: 900, color: DC?.text || "#17251D" }}>
              لا توجد مناطق محظورة في {selectedCity?.name || "هذه المدينة"}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
            <section>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 900, color: DC?.text || "#17251D" }}>
                المناطق المحظورة ({visibleDistricts.length})
              </div>
              <div style={{ display: "grid", gap: 9 }}>
                {visibleDistricts.map(item => (
                  <RestrictionCard
                    key={`district-${item.id}`}
                    item={item}
                    type="district"
                    DC={DC}
                    onEdit={() => openEdit("district", item)}
                    onDisable={() => disableRestriction("district", item)}
                  />
                ))}
              </div>
            </section>

            <section>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 900, color: DC?.text || "#17251D" }}>
                القرى المحظورة ({visibleVillages.length})
              </div>
              <div style={{ display: "grid", gap: 9 }}>
                {visibleVillages.map(item => {
                  const parent = districtById.get(String(item.district_id));
                  return (
                    <RestrictionCard
                      key={`village-${item.id}`}
                      item={item}
                      type="village"
                      parentName={parent?.name || ""}
                      DC={DC}
                      onEdit={() => openEdit("village", item)}
                      onDisable={() => disableRestriction("village", item)}
                    />
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
