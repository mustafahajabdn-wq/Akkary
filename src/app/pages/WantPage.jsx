import React, { useState, useEffect } from "react";
import { C, getListingTypeStyle } from "../../shared/constants/colors.js";
import { cities } from "../../shared/utils/geo.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { countUserListings, insertWantListing } from "../services/listingService.js";
import { fetchAppSettings } from "../services/configService.js";
import { fetchPropertyTypes } from "../services/propertyService.js";
import { getAllGeoCoords, getDistricts as getDistrictsCache, getDistrictByName, getVillages } from "../services/geoCache.js";
import { resolveMapLocation } from "../../shared/utils/mapLocation.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";
import { AW } from "../../shared/styles/addWant.styles.js";
function WantPage({
  setPage,
  DC = C,
  user
}) {
  const lbl = AW.label(DC);
  const inp = AW.input(DC);
  const [wantType, setWantType] = React.useState("buy");
  const activeTypeStyle = getListingTypeStyle(wantType === "buy" ? "want_buy" : "want_rent");
  const buyTypeStyle = getListingTypeStyle("want_buy");
  const rentTypeStyle = getListingTypeStyle("want_rent");
  const [propTypes, setPropTypes] = React.useState([]);
  const [category, setCategory] = React.useState("");
  const [city, setCity] = React.useState(cities[0]);
  const [district, setDistrict] = React.useState("");
  const [village, setVillage] = React.useState("");
  const [wantDistricts, setWantDistricts] = React.useState([]);
  const [wantVillages, setWantVillages] = React.useState([]);
  const [geoCoords, setGeoCoords] = React.useState({ districts: {}, villages: {} });

  React.useEffect(() => {
    let alive = true;
    fetchPropertyTypes("id,name,icon").then(data => {
      if (!alive) return;
      const rows = Array.isArray(data) ? data : [];
      setPropTypes(rows);
      if (rows.length) setCategory(prev => prev || rows[0].name || "");
    }).catch(() => {
      if (alive) setPropTypes([]);
    });
    return () => { alive = false; };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    getAllGeoCoords()
      .then((data) => {
        if (!cancelled) setGeoCoords(data || { districts: {}, villages: {} });
      })
      .catch(() => {
        if (!cancelled) setGeoCoords({ districts: {}, villages: {} });
      });
    return () => { cancelled = true; };
  }, []);

  const sx = {
    s1: DC => ({
      maxWidth: 430,
      margin: "0 auto",
      minHeight: "100dvh",
      background: DC.bg,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12
    }),
    s2: typeStyle => ({
      fontSize: 20,
      fontWeight: 900,
      color: typeStyle.color
    }),
    s3: DC => ({
      fontSize: 13,
      color: DC.text3
    }),
    s4: typeStyle => ({
      marginTop: 16,
      padding: "12px 32px",
      borderRadius: 12,
      border: "none",
      background: typeStyle.color,
      color: "white",
      fontSize: 15,
      fontWeight: 900,
      cursor: "pointer",
      fontFamily: "Tajawal,sans-serif"
    }),
    s5: DC => ({
      maxWidth: 430,
      margin: "0 auto",
      minHeight: "100vh",
      background: DC.bg,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
      display: "flex",
      flexDirection: "column",
      position: "relative"
    }),
    s6: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    s7: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.2)",
      border: "none",
      color: "white",
      fontSize: 18,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    s8: {
      fontSize: 16,
      fontWeight: 800,
      color: "white"
    },
    s9: { width: 34 },
    s10: {
      flex: 1,
      overflowY: "auto",
      padding: "16px 16px 120px"
    },
    s11: AW.row,
    s12: (active, typeStyle) => AW.choiceButton({
      active,
      color: typeStyle.color,
      bg: typeStyle.bg,
      border: typeStyle.border
    }),
    s14: AW.grid(3, 6),
    s15: AW.row,
    s16: inp => ({ ...inp, flex: 2, marginBottom: 0 }),
    s17: inp => ({ ...inp, flex: 1, marginBottom: 0 }),
    s18: {
      display: "flex",
      gap: 6,
      marginBottom: 14
    },
    s19: AW.wrapRow,
    s20: inp => ({ ...inp, minHeight: 80, resize: "vertical" }),
    s21: DC => AW.footer(DC),
    s22: AW.warningBox,
    s23: (loading, typeStyle) => AW.submitButton({ loading, color: typeStyle.color })
  };
  React.useEffect(() => {
    setWantDistricts([]);
    setWantVillages([]);
    setDistrict("");
    setVillage("");
    getDistrictsCache(city).then(data => {
      if (data?.length) setWantDistricts(data);
    });
  }, [city]);
  React.useEffect(() => {
    if (!district) return;
    setWantVillages([]);
    setVillage("");
    const localDistrict = wantDistricts.find(d => d.name === district);
    const loadVillages = districtId => {
      if (!districtId) return;
      getVillages(districtId).then(data => {
        if (data?.length) setWantVillages(data);
      });
    };
    if (localDistrict?.id) {
      loadVillages(localDistrict.id);
      return;
    }
    getDistrictByName(district, city).then(dist => {
      if (!dist) return;
      loadVillages(dist.id);
    });
  }, [city, district, wantDistricts]);
  const [maxPrice, setMaxPrice] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");
  const [totalArea, setTotalArea] = React.useState("");
  const [beds, setBeds] = React.useState("");
  const [floor, setFloor] = React.useState("");
  const [phone, setPhone] = React.useState(user?.phone || "");
  const [notes, setNotes] = React.useState("");
  const [ownershipType, setOwnershipType] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [publishError, setPublishError] = React.useState("");
  if (done) return <div style={sx.s1(DC)}>
      <div style={S.font56}>✅</div>
      <div style={sx.s2(activeTypeStyle)}>تم نشر طلبك!</div>
      <div style={sx.s3(DC)}>سيتواصل معك أصحاب العقارات المناسبة</div>
      <button onClick={() => setPage("home")} style={sx.s4(activeTypeStyle)}>العودة للرئيسية</button>
    </div>;
  return <div style={sx.s5(DC)}>
      {/* هيدر */}
      <div style={S.primaryHero(activeTypeStyle.color)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />
        <div style={sx.s6}>
          <button onClick={() => setPage("home")} style={sx.s7}>←</button>
          <span style={sx.s8}>🔍 طلب عقار</span>
          <div style={sx.s9} />
        </div>
        <Wave />
      </div>

      <div style={sx.s10}>
        {/* نوع الطلب */}
        <label style={lbl}>نوع الطلب</label>
        <div style={sx.s11}>
          <button onClick={() => setWantType("buy")} style={sx.s12(wantType === "buy", buyTypeStyle)}>🏷️ أريد الشراء</button>
          <button onClick={() => setWantType("rent")} style={sx.s12(wantType === "rent", rentTypeStyle)}>🔑 أريد الإيجار</button>
        </div>

        {/* نوع العقار */}
        <label style={lbl}>نوع العقار</label>
        <div style={sx.s14}>
          {propTypes.map(t => {
            const active = category === t.name;
            return <button
              key={t.id || t.name}
              onClick={() => setCategory(t.name)}
              style={AW.compactButton({ active, color: activeTypeStyle.color, bg: activeTypeStyle.bg, border: activeTypeStyle.border })}
            >
              <span style={S.font22}>{t.icon || "🏠"}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: active ? "white" : activeTypeStyle.color }}>{t.name}</span>
            </button>;
          })}
        </div>

        {/* المدينة */}
        <label style={lbl}>المدينة *</label>
        <select style={inp} value={city} onChange={e => setCity(e.target.value)}>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>


        {/* المنطقة */}
        <label style={lbl}>المنطقة (اختياري)</label>
        {wantDistricts.length > 0 ? <select style={inp} value={district} onChange={e => setDistrict(e.target.value)}>
            <option value="">— اختر المنطقة —</option>
            {wantDistricts.map(d => <option key={d.id}>{d.name}</option>)}
          </select> : <input style={inp} value={district} onChange={e => setDistrict(e.target.value)} placeholder="مثال: المالكي، العزيزية..." />}
        {wantVillages.length > 0 && <>
          <label style={lbl}>البلدة / القرية (اختياري)</label>
          <select style={inp} value={village} onChange={e => setVillage(e.target.value)}>
            <option value="">— اختر البلدة —</option>
            {wantVillages.map(v => <option key={v.id}>{v.name}</option>)}
          </select>
        </>}

        {/* السعر الأقصى */}
        <label style={lbl}>السعر الأقصى (اختياري)</label>
        <div style={sx.s15}>
          <input style={sx.s16(inp)} type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="0" />
          <select style={sx.s17(inp)} value={currency} onChange={e => setCurrency(e.target.value)}>
            <option>USD</option><option>SYP</option>
          </select>
        </div>

        {/* المساحة */}
        <label style={lbl}>المساحة م² (اختياري)</label>
        <input style={inp} type="number" value={totalArea} onChange={e => setTotalArea(e.target.value)} placeholder="مثال: 100" />

        {/* عدد الغرف */}
        <label style={lbl}>عدد الغرف (اختياري)</label>
        <div style={sx.s18}>
          {["أي", "1", "2", "3", "4", "5+"].map(b => {
            const active = beds === b || (b === "أي" && !beds);
            return <button
              key={b}
              onClick={() => setBeds(b === "أي" ? "" : b)}
              style={AW.compactButton({ active, color: activeTypeStyle.color, bg: activeTypeStyle.bg, border: activeTypeStyle.border, flex: 1 })}
            >{b}</button>;
          })}
        </div>

        <label style={lbl}>الطابق (اختياري)</label>
        <input style={inp} value={floor} onChange={e => setFloor(e.target.value)} placeholder="مثال: أرضي، أول، ثاني..." />

        {/* نوع الملكية - للشراء فقط */}
        {wantType === "buy" && <>
          <label style={lbl}>نوع الملكية المقبولة (اختياري)</label>
          <div style={sx.s19}>
            {["طابو نظامي (أخضر)", "طابو زراعي", "حكم محكمة", "كاتب عدل (وكالة غير قابلة للعزل)", "أي نوع"].map(o => {
              const active = ownershipType === o;
              return <button
                key={o}
                onClick={() => setOwnershipType(active ? "" : o)}
                style={AW.chipButton({ active, color: activeTypeStyle.color, bg: activeTypeStyle.bg, border: activeTypeStyle.border })}
              >
                {o}
              </button>;
            })}
          </div>
        </>}

        {/* رقم الهاتف (اختياري) */}
         <label style={lbl}>رقم الهاتف (اختياري)</label>
         <input style={mergeStyles(inp, S.ltrRight)} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+963xxxxxxxxx" />
         {/* ملاحظات */}
        <label style={lbl}>ملاحظات إضافية (اختياري)</label>
        <textarea style={sx.s20(inp)} value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي تفاصيل إضافية تساعد في إيجاد العقار المناسب..." />
      </div>

      {/* زر النشر */}
      <div style={sx.s21(DC)}>
        {publishError && <div style={sx.s22}>⚠️ {publishError}</div>}
        <button onClick={async () => {
        if (!user) {
          alert("يجب تسجيل الدخول أولاً");
          return;
        }
        setPublishError("");
        setLoading(true);
        const count = await countUserListings(user.id);
        if (count >= 180) {
          setPublishError("وصلت إلى الحد الأقصى المسموح به حالياً، وهو 180 إعلاناً منشوراً. احذف بعض الإعلانات القديمة أو المنتهية ثم أعد المحاولة.");
          setLoading(false);
          return;
        }

        // قراءة إعداد النشر المباشر
        const settings = await fetchAppSettings(["want_auto_approve"]);
        const autoApprove = settings.want_auto_approve === "true";
        const selectedCategory = category || propTypes[0]?.name || "عقار";
        const titleStr = (wantType === "buy" ? "مطلوب شراء" : "مطلوب للإيجار") + " - " + selectedCategory + " في " + city;
        const mapLocation = resolveMapLocation({
          lat: null,
          lng: null,
          city,
          district,
          village,
          geoCoords,
        });
        const {
          error
        } = await insertWantListing({
          user_id: user.id,
          type: wantType === "buy" ? "want_buy" : "want_rent",
          category: selectedCategory,
          city,
          district: district || null,
          village: village || null,
          price: maxPrice ? parseFloat(maxPrice) : 0,
          currency: maxPrice ? currency : "USD",
          total_area: totalArea ? parseFloat(totalArea) : null,
          beds: beds ? parseInt(beds) : null,
          phone: phone || "",
          description: notes || null,
          title: titleStr,
          status: "active",
          admin_status: autoApprove ? "approved" : "pending",
          ownership: ownershipType || null,
          floor: floor ? parseInt(floor) || floor : null,
          extra_fields: null,
          ...mapLocation
        });
        if (error) {
          alert("خطأ: " + error.message);
          return;
        }
        setDone(true);
      }} style={sx.s23(loading, activeTypeStyle)}>
          {loading ? "جاري النشر..." : "🔍 نشر الطلب"}
        </button>
      </div>
    </div>;
}
export default WantPage;
