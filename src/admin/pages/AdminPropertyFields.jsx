import { BackButton } from "../../shared/components/common/BackButton.jsx";
import React, { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { C } from "../../shared/constants/colors.js";
import { createPropertyField, deletePropertyFieldIds, loadAdminPropertyFieldsBoot, runPropertyFieldsMaintenance, updatePropertyFieldIds } from "../services/adminService.js";
import { S } from "../../shared/styles/primitives.js";
const PF = {
  page: DC => ({
    maxWidth: 1200,
    margin: "0 auto",
    minHeight: "100vh",
    background: DC?.bg || "#F2F5F3",
    fontFamily: "Tajawal,sans-serif",
    direction: "rtl"
  }),
  hero: {
    background: "linear-gradient(135deg,#1A4A2E,#2D6B45)",
    padding: "48px 16px 40px",
    position: "relative",
    overflow: "hidden"
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: "white"
  },
  heroHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4
  },
  pageBody: {
    padding: "14px",
    paddingBottom: 120
  },
  guideCard: {
    background: "#F0FDF4",
    border: "1.5px solid #BBF7D0",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 14
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: "#14532D",
    marginBottom: 6
  },
  guideText: {
    fontSize: 12,
    color: "#166534",
    lineHeight: 1.8
  },
  toolbarButton: (bg, disabled) => ({
    padding: "8px 14px",
    borderRadius: 9,
    border: "none",
    background: bg,
    color: "white",
    fontSize: 12,
    fontWeight: 800,
    cursor: disabled ? "default" : "pointer",
    fontFamily: "inherit"
  }),
  maintenanceMsg: ok => ({
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 10,
    background: ok ? "#F0FDF4" : "#FEF2F2",
    color: ok ? "#166534" : "#B91C1C",
    border: `1px solid ${ok ? "#BBF7D0" : "#FECACA"}`,
    fontSize: 12,
    fontWeight: 700
  }),
  searchInput: DC => ({
    flex: 1,
    minWidth: 160,
    padding: "8px 12px",
    borderRadius: 9,
    border: "1.5px solid " + (DC?.border || "#DDE8E1"),
    fontSize: 12,
    fontFamily: "Tajawal,sans-serif",
    direction: "rtl",
    outline: "none",
    background: DC?.white || "#fff",
    color: DC?.text
  }),
  selectInput: (DC, direction = "rtl") => ({
    padding: "8px 12px",
    borderRadius: 9,
    border: "1.5px solid " + (DC?.border || "#DDE8E1"),
    fontSize: 12,
    fontFamily: "Tajawal,sans-serif",
    direction,
    outline: "none",
    background: DC?.white || "#fff",
    color: DC?.text,
    cursor: "pointer"
  }),
  scopeRow: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap"
  },
  scopeButton: (active, DC) => ({
    padding: "7px 10px",
    borderRadius: 8,
    border: `1.5px solid ${active ? C.primary : DC?.border || "#DDE8E1"}`,
    background: active ? "#E8F4F0" : "transparent",
    color: active ? C.primary : DC?.text2,
    fontSize: 11,
    fontWeight: active ? 800 : 600,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap"
  }),
  scopeCount: {
    fontSize: 9,
    opacity: 0.7
  },
  summaryCard: DC => ({
    background: DC?.white || "#fff",
    border: "1.5px solid " + (DC?.border || "#DDE8E1"),
    borderRadius: 12,
    padding: "12px",
    marginBottom: 12
  }),
  summaryTitle: (DC, marginBottom = 8) => ({
    fontSize: 13,
    fontWeight: 800,
    color: DC?.text,
    marginBottom
  }),
  pillWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6
  },
  countPill: count => ({
    fontSize: 11,
    padding: "5px 8px",
    borderRadius: 20,
    background: count > 1 ? "#FEF2F2" : "#F3F4F6",
    color: count > 1 ? "#B91C1C" : "#374151",
    fontWeight: 700,
    border: `1px solid ${count > 1 ? "#FECACA" : "#E5E7EB"}`
  }),
  alignEnd: {
    marginBottom: 10,
    display: "flex",
    justifyContent: "flex-end"
  },
  primaryBtn: {
    padding: "8px 16px",
    borderRadius: 9,
    border: "none",
    background: C.primary,
    color: "white",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit"
  },
  addFieldCard: DC => ({
    background: DC?.white || "#fff",
    borderRadius: 12,
    border: "1.5px solid " + (DC?.border || "#DDE8E1"),
    padding: "14px",
    marginBottom: 12
  }),
  fieldFormGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 8
  },
  formInput: (DC, direction = "rtl") => ({
    padding: "7px 10px",
    borderRadius: 8,
    border: "1.5px solid " + (DC?.border || "#DDE8E1"),
    fontSize: 12,
    fontFamily: "Tajawal,sans-serif",
    direction,
    outline: "none"
  }),
  formSelect: DC => ({
    padding: "7px 10px",
    borderRadius: 8,
    border: "1.5px solid " + (DC?.border || "#DDE8E1"),
    fontSize: 12,
    fontFamily: "Tajawal,sans-serif",
    outline: "none"
  })
};
const DEFAULT_TYPE_LABELS = {
  number: "رقم",
  text: "نص",
  textarea: "نص طويل",
  select: "قائمة",
  boolean: "نعم/لا",
  chips: "اختيار متعدد",
  city_select: "مدينة",
  district_select: "حي"
};
function prettifyKey(key = "") {
  return String(key).replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}
export default function AdminPropertyFields({
  setPage,
  DC,
  user
}) {
  const [types, setTypes] = useState([]);
  const [fields, setFields] = useState([]);
  const [listingColumns, setListingColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState("");
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState({
    field_key: "",
    label: "",
    field_type: "text",
    section: "تفاصيل",
    section_icon: "📋",
    options: "",
    field_scope: "dynamic"
  });
  const [editingOptions, setEditingOptions] = useState(null);
  const [newOption, setNewOption] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const sx = {
    s1: {
      position: "absolute",
      top: 14,
      right: 16,
      zIndex: 2
    },
    s2: {
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
      marginTop: 4
    },
    s3: {
      background: "#F0FDF4",
      border: "1.5px solid #BBF7D0",
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 14
    },
    s4: {
      fontSize: 13,
      fontWeight: 900,
      color: "#14532D",
      marginBottom: 6
    },
    s5: maintenanceLoading => ({
      padding: "8px 14px",
      borderRadius: 9,
      border: "none",
      background: "#DC2626",
      color: "white",
      fontSize: 12,
      fontWeight: 800,
      cursor: maintenanceLoading ? "default" : "pointer",
      fontFamily: "inherit"
    }),
    s6: maintenanceLoading => ({
      padding: "8px 14px",
      borderRadius: 9,
      border: "none",
      background: "#2563EB",
      color: "white",
      fontSize: 12,
      fontWeight: 800,
      cursor: maintenanceLoading ? "default" : "pointer",
      fontFamily: "inherit"
    }),
    s7: maintenanceMsg => ({
      marginBottom: 12,
      padding: "10px 12px",
      borderRadius: 10,
      background: maintenanceMsg.startsWith("✅") ? "#F0FDF4" : "#FEF2F2",
      color: maintenanceMsg.startsWith("✅") ? "#166534" : "#B91C1C",
      border: `1px solid ${maintenanceMsg.startsWith("✅") ? "#BBF7D0" : "#FECACA"}`,
      fontSize: 12,
      fontWeight: 700
    }),
    s8: DC => ({
      flex: 1,
      minWidth: 160,
      padding: "8px 12px",
      borderRadius: 9,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 12,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
      outline: "none",
      background: DC?.white || "#fff",
      color: DC?.text
    }),
    s9: DC => ({
      padding: "8px 12px",
      borderRadius: 9,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 12,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
      outline: "none",
      background: DC?.white || "#fff",
      color: DC?.text,
      cursor: "pointer"
    }),
    s10: DC => ({
      background: DC?.white || "#fff",
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      borderRadius: 12,
      padding: "12px",
      marginBottom: 12
    }),
    s11: C => ({
      padding: "8px 16px",
      borderRadius: 9,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s12: DC => ({
      background: DC?.white || "#fff",
      borderRadius: 12,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      padding: "14px",
      marginBottom: 12
    }),
    s13: DC => ({
      padding: "7px 10px",
      borderRadius: 8,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 12,
      fontFamily: "Tajawal,sans-serif",
      direction: "ltr",
      outline: "none"
    }),
    s14: DC => ({
      padding: "7px 10px",
      borderRadius: 8,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 12,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
      outline: "none"
    }),
    s15: DC => ({
      padding: "7px 10px",
      borderRadius: 8,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 12,
      fontFamily: "Tajawal,sans-serif",
      outline: "none"
    }),
    s16: DC => ({
      padding: "7px 10px",
      borderRadius: 8,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 12,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
      outline: "none"
    }),
    s17: DC => ({
      padding: "7px 10px",
      borderRadius: 8,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 12,
      fontFamily: "Tajawal,sans-serif",
      outline: "none"
    }),
    s18: DC => ({
      padding: "7px 10px",
      borderRadius: 8,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 12,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
      outline: "none"
    }),
    s19: DC => ({
      width: "100%",
      padding: "7px 10px",
      borderRadius: 8,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 11,
      fontFamily: "monospace",
      direction: "ltr",
      outline: "none",
      height: 60,
      resize: "none",
      boxSizing: "border-box",
      marginBottom: 8
    }),
    s20: DC => ({
      fontSize: 11,
      fontWeight: 700,
      color: DC?.text3,
      marginBottom: 6
    }),
    s21: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 10
    },
    s22: C => ({
      padding: "9px 20px",
      borderRadius: 9,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s23: {
      position: "fixed",
      inset: 0,
      zIndex: 999,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center"
    },
    s24: {
      position: "absolute",
      inset: 0,
      background: "rgba(0,0,0,0.5)"
    },
    s25: DC => ({
      position: "relative",
      background: DC?.white || "#fff",
      borderRadius: "22px 22px 0 0",
      padding: "20px",
      paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
      width: "100%",
      maxWidth: 500,
      maxHeight: "80vh",
      overflowY: "auto"
    }),
    s26: {
      display: "flex",
      gap: 8,
      marginBottom: 16
    },
    s27: C => ({
      flex: 2,
      padding: "11px",
      borderRadius: 10,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s28: DC => ({
      flex: 1,
      padding: "11px",
      borderRadius: 10,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      background: "transparent",
      color: DC?.text,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s29: DC => ({
      fontSize: 15,
      fontWeight: 900,
      color: DC?.text,
      marginBottom: 14
    }),
    s30: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      marginBottom: 14
    },
    s31: {
      display: "flex",
      gap: 6,
      marginBottom: 14
    },
    s32: DC => ({
      flex: 1,
      padding: "7px 10px",
      borderRadius: 8,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      fontSize: 12,
      fontFamily: "Tajawal,sans-serif",
      direction: "rtl",
      outline: "none"
    }),
    s33: C => ({
      padding: "7px 14px",
      borderRadius: 8,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s34: C => ({
      flex: 2,
      padding: "11px",
      borderRadius: 10,
      border: "none",
      background: C.primary,
      color: "white",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s35: DC => ({
      flex: 1,
      padding: "11px",
      borderRadius: 10,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      background: "transparent",
      color: DC?.text,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }),
    s36: DC => ({
      textAlign: "center",
      padding: 40,
      color: DC?.text3
    }),
    s37: DC => ({
      overflowX: "auto",
      borderRadius: 12,
      border: "1.5px solid " + (DC?.border || "#DDE8E1"),
      background: DC?.white || "#fff"
    }),
    s38: {
      borderCollapse: "collapse",
      minWidth: 700,
      width: "100%"
    },
    s39: {
      background: "#F8FAFC"
    },
    s40: DC => ({
      padding: "10px 14px",
      textAlign: "right",
      fontSize: 12,
      fontWeight: 800,
      color: DC?.text || "#1A2E20",
      borderBottom: "2px solid #E5E7EB",
      position: "sticky",
      right: 0,
      background: "#F8FAFC",
      zIndex: 10,
      minWidth: 120
    }),
    s41: DC => ({
      padding: "10px 14px",
      textAlign: "center",
      fontSize: 12,
      fontWeight: 800,
      color: DC?.text || "#1A2E20",
      borderBottom: "2px solid #E5E7EB",
      minWidth: 70
    }),
    s42: DC => ({
      padding: "10px 14px",
      textAlign: "right",
      fontSize: 12,
      fontWeight: 800,
      color: DC?.text || "#1A2E20",
      borderBottom: "2px solid #E5E7EB",
      minWidth: 160,
      maxWidth: 200
    }),
    s43: DC => ({
      padding: "10px 14px",
      textAlign: "right",
      fontSize: 12,
      fontWeight: 800,
      color: DC?.text || "#1A2E20",
      borderBottom: "2px solid #E5E7EB",
      minWidth: 120
    }),
    s44: DC => ({
      padding: "10px 14px",
      textAlign: "right",
      fontSize: 12,
      fontWeight: 800,
      color: DC?.text || "#1A2E20",
      borderBottom: "2px solid #E5E7EB",
      minWidth: 90
    }),
    s45: {
      padding: "12px 14px",
      borderTop: "2px solid #E5E7EB",
      background: "#FAFAFA"
    },
    s46: {
      fontSize: 11,
      fontWeight: 800,
      color: "#6B7280",
      marginBottom: 8
    },
    s47: DC => ({
      padding: "10px 14px",
      fontSize: 11,
      color: DC?.text3,
      borderTop: "1px solid #F3F4F6",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    })
  };
  if (user?.role !== "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  useEffect(() => {
    load();
  }, []);
  async function load() {
    setLoading(true);
    setMaintenanceMsg("");
    try {
      const bundle = await loadAdminPropertyFieldsBoot();
      setTypes(bundle.types);
      setFields(bundle.fields);
      setListingColumns(bundle.listingColumns);
    } catch {
      setTypes([]);
      setFields([]);
      setListingColumns([]);
    } finally {
      setLoading(false);
    }
  }
  async function deleteDuplicateFields() {
    if (!window.confirm("سيتم حذف كل الصفوف المكررة التي لها نفس type_id و field_key مع الإبقاء على أول سجل فقط. هل أنت متأكد؟")) {
      return;
    }
    try {
      setMaintenanceLoading("dedupe");
      setMaintenanceMsg("");
      await runPropertyFieldsMaintenance("cleanup_duplicate_property_fields");
      setMaintenanceMsg("✅ تم حذف الصفوف المكررة بنجاح");
      await load();
    } catch (e) {
      setMaintenanceMsg("❌ " + (e?.message || "حدث خطأ"));
    } finally {
      setMaintenanceLoading("");
    }
  }
  async function fillMissingCoreFields() {
    if (!window.confirm("سيتم نسخ كل الحقول الأساسية الناقصة إلى جميع أنواع العقارات. هل أنت متأكد؟")) {
      return;
    }
    try {
      setMaintenanceLoading("fill-core");
      setMaintenanceMsg("");
      await runPropertyFieldsMaintenance("fill_missing_core_property_fields");
      setMaintenanceMsg("✅ تم نسخ الحقول الأساسية الناقصة بنجاح");
      await load();
    } catch (e) {
      setMaintenanceMsg("❌ " + (e?.message || "حدث خطأ"));
    } finally {
      setMaintenanceLoading("");
    }
  }
  const listingKeySet = useMemo(() => {
    return new Set((listingColumns || []).map(c => c.key).filter(Boolean));
  }, [listingColumns]);
  const fieldLabelMap = useMemo(() => {
    const map = {};
    for (const c of listingColumns) {
      if (c?.key && !map[c.key]) {
        map[c.key] = c.label || prettifyKey(c.key);
      }
    }
    for (const f of fields) {
      if (f?.field_key && !map[f.field_key]) {
        map[f.field_key] = f.label || prettifyKey(f.field_key);
      }
    }
    return map;
  }, [fields, listingColumns]);
  const fieldTypeOptions = useMemo(() => {
    const base = ["text", "textarea", "number", "select", "boolean", "chips", "city_select", "district_select"];
    const found = fields.map(f => f.field_type).filter(Boolean);
    return Array.from(new Set([...base, ...found]));
  }, [fields]);
  const fieldStats = useMemo(() => {
    const map = {};
    for (const f of fields) {
      if (!map[f.field_key]) {
        map[f.field_key] = {
          field_key: f.field_key,
          label: f.label || fieldLabelMap[f.field_key] || f.field_key,
          scope: f.field_scope || "dynamic",
          count: 0,
          typeIds: new Set(),
          sample: f
        };
      }
      map[f.field_key].count += 1;
      if (f.type_id) map[f.field_key].typeIds.add(f.type_id);
    }
    return Object.values(map).map(item => ({
      ...item,
      typeIds: Array.from(item.typeIds)
    }));
  }, [fields, fieldLabelMap]);
  const filteredFieldStats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fieldStats.filter(item => {
      const keyMatch = !q || item.field_key.toLowerCase().includes(q) || (item.label || "").toLowerCase().includes(q);
      if (!keyMatch) return false;
      if (scopeFilter !== "all" && item.scope !== scopeFilter) return false;
      if (typeFilter !== "all") {
        const tid = parseInt(typeFilter, 10);
        if (!item.typeIds.includes(tid)) return false;
      }
      return true;
    });
  }, [fieldStats, search, scopeFilter, typeFilter]);
  const allKeys = useMemo(() => {
    return filteredFieldStats.map(item => item.field_key);
  }, [filteredFieldStats]);
  const counts = useMemo(() => {
    return {
      all: fieldStats.length,
      core: fieldStats.filter(f => f.scope === "core").length,
      dynamic: fieldStats.filter(f => (f.scope || "dynamic") === "dynamic").length,
      system: fieldStats.filter(f => f.scope === "system").length
    };
  }, [fieldStats]);
  const matrix = useMemo(() => {
    const m = {};
    for (const t of types) m[t.id] = {};
    for (const f of fields) {
      if (!m[f.type_id]) m[f.type_id] = {};
      m[f.type_id][f.field_key] = f;
    }
    return m;
  }, [types, fields]);
  const filteredTypes = typeFilter === "all" ? types : types.filter(t => t.id === parseInt(typeFilter, 10));

  // هذا القسم صار يعتمد على listings فقط
  const availableListingColumns = useMemo(() => {
    return (listingColumns || []).filter(c => c?.key).map(c => ({
      key: c.key,
      label: c.label || fieldLabelMap[c.key] || prettifyKey(c.key),
      scope: c.scope || "dynamic"
    }));
  }, [listingColumns, fieldLabelMap]);
  async function saveOptions(fieldKey, opts) {
    const ids = fields.filter(f => f.field_key === fieldKey).map(f => f.id);
    await updatePropertyFieldIds(ids, {
      options: opts
    });
    setFields(p => p.map(f => f.field_key === fieldKey ? {
      ...f,
      options: opts
    } : f));
    setEditingOptions(null);
  }
  async function addNewField() {
    if (!newField.field_key || !newField.label) {
      alert("المفتاح والعنوان مطلوبان");
      return;
    }
    const checkedTypes = types.filter(t => newField[`type_${t.id}`]);
    const isSystem = newField.field_scope === "system";
    const isCore = newField.field_scope === "core";
    if (!checkedTypes.length && !isSystem && !isCore) {
      alert("اختر نوعاً واحداً على الأقل");
      return;
    }
    let opts = null;
    if ((newField.field_type === "select" || newField.field_type === "chips") && newField.options?.trim()) {
      try {
        opts = JSON.parse(newField.options);
      } catch {
        alert('صيغة الخيارات غير صحيحة. استخدم JSON مثل ["خيار 1","خيار 2"]');
        return;
      }
    }
    if (!listingKeySet.has(newField.field_key)) {
      alert("هذا الحقل غير موجود فعليًا في جدول listings، لذلك لن يظهر في قائمة الحقول المتاحة أسفل الصفحة.");
    }
    const targetTypes = isSystem || isCore ? types : checkedTypes;
    for (let i = 0; i < targetTypes.length; i++) {
      const createdRows = await createPropertyField({
        type_id: targetTypes[i].id,
        field_key: newField.field_key,
        label: newField.label,
        field_type: newField.field_type,
        options: opts,
        required: false,
        sort_order: 99,
        section: newField.section,
        section_icon: newField.section_icon,
        field_scope: newField.field_scope
      });
      const [created] = Array.isArray(createdRows) ? createdRows : [{}];
      if (created?.id) setFields(p => [...p, created]);
    }
    setShowAddField(false);
    setNewField({
      field_key: "",
      label: "",
      field_type: "text",
      section: "تفاصيل",
      section_icon: "📋",
      options: "",
      field_scope: "dynamic"
    });
  }
  async function toggle(typeId, fieldKey) {
    const stat = fieldStats.find(f => f.field_key === fieldKey);
    const scope = stat?.scope || "dynamic";
    if (scope !== "dynamic") return;
    const typeName = types.find(t => t.id === typeId)?.name || "";
    const fieldName = fieldLabelMap[fieldKey] || fieldKey;
    const existing = matrix[typeId]?.[fieldKey];
    const msg = existing ? `إلغاء خاصية "${fieldName}" من "${typeName}"؟` : `إضافة خاصية "${fieldName}" إلى "${typeName}"؟`;
    if (!window.confirm(msg)) return;
    const key = `${typeId}-${fieldKey}`;
    setSaving(key);
    try {
      if (existing) {
        await deletePropertyFieldIds([existing.id]);
        setFields(p => p.filter(f => f.id !== existing.id));
      } else {
        const template = fields.find(f => f.field_key === fieldKey);
        const payload = {
          type_id: typeId,
          field_key: fieldKey,
          label: template?.label || fieldLabelMap[fieldKey] || fieldKey,
          field_type: template?.field_type || "text",
          options: template?.options || null,
          required: false,
          sort_order: matrix[typeId] ? Object.keys(matrix[typeId]).length + 1 : 1,
          section: template?.section || "تفاصيل",
          section_icon: template?.section_icon || "📋",
          field_scope: template?.field_scope || "dynamic"
        };
        const createdRows = await createPropertyField(payload);
        const [created] = Array.isArray(createdRows) ? createdRows : [{}];
        if (created?.id) setFields(p => [...p, created]);
      }
    } finally {
      setSaving(null);
    }
  }
  const colStyle = {
    minWidth: 80,
    maxWidth: 100,
    textAlign: "center",
    padding: "6px 4px",
    fontSize: 10,
    fontWeight: 700,
    borderLeft: "1px solid #E5E7EB"
  };
  return <div style={PF.page(DC)}>
      <div style={PF.hero}>
        <div style={sx.s1}>
          <BackButton onPress={() => setPage("adminDashboard")} />
        </div>

        <div style={S.relZ1}>
          <div style={PF.heroTitle}>
            🏗️ خصائص العقار
          </div>
          <div style={sx.s2}>
            إدارة الخصائص لكل نوع عقار
          </div>
        </div>
      </div>

      <div style={PF.pageBody}>
        <div style={sx.s3}>
          <div style={sx.s4}>
            🏗️ كيف تعمل هذه الصفحة؟
          </div>

          <div style={PF.guideText}>
            • كل <strong>صف</strong> = خاصية
            <br />• كل <strong>عمود</strong> = نوع عقار
            <br />• <strong>✓ أخضر</strong> = الخاصية مفعّلة لهذا النوع
            <br />• <strong>○ رمادي</strong> = غير مفعّلة
            <br />• الحقول <strong>الأساسية</strong> و<strong>النظامية</strong>{" "}
            ثابتة على جميع الأنواع
            <br />• الحقول <strong>الديناميكية</strong> فقط هي التي تقبل
            التفعيل والإلغاء
            <br />• قائمة <strong>حقول listings</strong> في الأسفل تُبنى من
            أعمدة جدول <strong>listings</strong> الفعلية فقط
          </div>
        </div>

        <div style={S.flexGap8Mb12Wrap}>
          <button onClick={deleteDuplicateFields} disabled={!!maintenanceLoading} style={sx.s5(maintenanceLoading)}>
            {maintenanceLoading === "dedupe" ? "⏳ جارٍ حذف المكرر..." : "🧹 حذف كل المكرر"}
          </button>

          <button onClick={fillMissingCoreFields} disabled={!!maintenanceLoading} style={sx.s6(maintenanceLoading)}>
            {maintenanceLoading === "fill-core" ? "⏳ جارٍ نسخ الـ core..." : "📌 نسخ كل الـ core الناقصة"}
          </button>
        </div>

        {maintenanceMsg && <div style={sx.s7(maintenanceMsg)}>
            {maintenanceMsg}
          </div>}

        <div style={S.flexGap8Mb12Wrap}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ابحث عن خاصية..." style={sx.s8(DC)} />

          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={sx.s9(DC)}>
            <option value="all">كل الأنواع</option>
            {types.map(t => <option key={t.id} value={t.id}>
                {t.name}
              </option>)}
          </select>

          <div style={PF.scopeRow}>
            {[["all", "الكل"], ["core", "📌 أساسي"], ["dynamic", "🔧 ديناميكي"], ["system", "⚙️ نظام"]].map(([v, l]) => {
            const sx = {
              s1: (scopeFilter, v, C, DC) => ({
                padding: "7px 10px",
                borderRadius: 8,
                border: `1.5px solid ${scopeFilter === v ? C.primary : DC?.border || "#DDE8E1"}`,
                background: scopeFilter === v ? "#E8F4F0" : "transparent",
                color: scopeFilter === v ? C.primary : DC?.text2,
                fontSize: 11,
                fontWeight: scopeFilter === v ? 800 : 600,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap"
              })
            };
            return <button key={v} onClick={() => setScopeFilter(v)} style={sx.s1(scopeFilter, v, C, DC)}>
                {l} <span style={PF.scopeCount}>({counts[v]})</span>
              </button>;
          })}
          </div>
        </div>

        <div style={sx.s10(DC)}>
          <div style={PF.summaryTitle(DC)}>
            📊 عدد تكرار كل حقل
          </div>

          <div style={PF.pillWrap}>
            {filteredFieldStats.map(item => {
            const sx = {
              s1: item => ({
                fontSize: 11,
                padding: "5px 8px",
                borderRadius: 20,
                background: item.count > 1 ? "#FEF2F2" : "#F3F4F6",
                color: item.count > 1 ? "#B91C1C" : "#374151",
                fontWeight: 700,
                border: `1px solid ${item.count > 1 ? "#FECACA" : "#E5E7EB"}`
              })
            };
            return <span key={item.field_key} title={`مربوط مع ${item.typeIds.length} نوع`} style={sx.s1(item)}>
                {item.label}: {item.count}
              </span>;
          })}
          </div>
        </div>

        <div style={PF.alignEnd}>
          <button onClick={() => setShowAddField(p => !p)} style={sx.s11(C)}>
            {showAddField ? "✕ إغلاق" : "+ إضافة خاصية جديدة"}
          </button>
        </div>

        {showAddField && <div style={sx.s12(DC)}>
            <div style={PF.summaryTitle(DC, 10)}>
              ➕ خاصية جديدة
            </div>

            <div style={PF.fieldFormGrid}>
              <input value={newField.field_key} onChange={e => setNewField(p => ({
            ...p,
            field_key: e.target.value
          }))} placeholder="المفتاح (مثال: balconies)" style={sx.s13(DC)} />

              <input value={newField.label} onChange={e => setNewField(p => ({
            ...p,
            label: e.target.value
          }))} placeholder="العنوان بالعربية" style={sx.s14(DC)} />

              <select value={newField.field_type} onChange={e => setNewField(p => ({
            ...p,
            field_type: e.target.value
          }))} style={sx.s15(DC)}>
                {fieldTypeOptions.map(t => <option key={t} value={t}>
                    {DEFAULT_TYPE_LABELS[t] || t}
                  </option>)}
              </select>

              <input value={newField.section} onChange={e => setNewField(p => ({
            ...p,
            section: e.target.value
          }))} placeholder="القسم" style={sx.s16(DC)} />

              <select value={newField.field_scope} onChange={e => setNewField(p => ({
            ...p,
            field_scope: e.target.value
          }))} style={sx.s17(DC)}>
                <option value="dynamic">ديناميكي</option>
                <option value="core">أساسي</option>
                <option value="system">نظام</option>
              </select>

              <input value={newField.section_icon} onChange={e => setNewField(p => ({
            ...p,
            section_icon: e.target.value
          }))} placeholder="أيقونة القسم" style={sx.s18(DC)} />
            </div>

            {(newField.field_type === "select" || newField.field_type === "chips") && <textarea value={newField.options} onChange={e => setNewField(p => ({
          ...p,
          options: e.target.value
        }))} placeholder='["خيار 1","خيار 2"]' style={sx.s19(DC)} />}

            {newField.field_scope === "dynamic" && <>
                <div style={sx.s20(DC)}>
                  اختر الأنواع:
                </div>

                <div style={sx.s21}>
                  {types.map(t => {
              const sx = {
                s1: {
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  fontSize: 12
                }
              };
              return <label key={t.id} style={sx.s1}>
                      <input type="checkbox" checked={!!newField[`type_${t.id}`]} onChange={e => setNewField(p => ({
                  ...p,
                  [`type_${t.id}`]: e.target.checked
                }))} />
                      {t.name}
                    </label>;
            })}
                </div>
              </>}

            <button onClick={addNewField} style={sx.s22(C)}>
              💾 حفظ الخاصية
            </button>
          </div>}

        {editingOptions && <div style={sx.s23}>
            <div onClick={() => setEditingOptions(null)} style={sx.s24} />

            <div style={sx.s25(DC)}>
              <div style={sx.s26}>
                <button onClick={() => saveOptions(editingOptions.fieldKey, editingOptions.options)} style={sx.s27(C)}>
                  💾 حفظ
                </button>

                <button onClick={() => setEditingOptions(null)} style={sx.s28(DC)}>
                  إلغاء
                </button>
              </div>

              <div style={sx.s29(DC)}>
                ✏️ تعديل خيارات —{" "}
                {fieldLabelMap[editingOptions.fieldKey] || editingOptions.fieldKey}
              </div>

              <div style={sx.s30}>
                {editingOptions.options.map((o, i) => {
              const sx = {
                s1: {
                  display: "flex",
                  gap: 6,
                  alignItems: "center"
                },
                s2: DC => ({
                  flex: 1,
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1.5px solid " + (DC?.border || "#DDE8E1"),
                  fontSize: 12,
                  fontFamily: "Tajawal,sans-serif",
                  direction: "rtl",
                  outline: "none"
                }),
                s3: {
                  padding: "5px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: "#FEF2F2",
                  color: "#EF4444",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flexShrink: 0
                }
              };
              return <div key={i} style={sx.s1}>
                    <input value={o} onChange={e => setEditingOptions(p => ({
                  ...p,
                  options: p.options.map((x, j) => j === i ? e.target.value : x)
                }))} style={sx.s2(DC)} />

                    <button onClick={() => setEditingOptions(p => ({
                  ...p,
                  options: p.options.filter((_, j) => j !== i)
                }))} style={sx.s3}>
                      🗑
                    </button>
                  </div>;
            })}
              </div>

              <div style={sx.s31}>
                <input value={newOption} onChange={e => setNewOption(e.target.value)} placeholder="خيار جديد..." style={sx.s32(DC)} />

                <button onClick={() => {
              if (newOption.trim()) {
                setEditingOptions(p => ({
                  ...p,
                  options: [...p.options, newOption.trim()]
                }));
                setNewOption("");
              }
            }} style={sx.s33(C)}>
                  + إضافة
                </button>
              </div>

              <div style={S.gap8}>
                <button onClick={() => saveOptions(editingOptions.fieldKey, editingOptions.options)} style={sx.s34(C)}>
                  💾 حفظ
                </button>

                <button onClick={() => setEditingOptions(null)} style={sx.s35(DC)}>
                  إلغاء
                </button>
              </div>
            </div>
          </div>}

        {loading ? <div style={sx.s36(DC)}>
            ⏳ جارٍ التحميل...
          </div> : <div style={sx.s37(DC)}>
            <table style={sx.s38}>
              <thead>
                <tr style={sx.s39}>
                  <th style={sx.s40(DC)}>
                    الخاصية
                  </th>

                  <th style={sx.s41(DC)}>
                    التكرار
                  </th>

                  <th style={sx.s42(DC)}>
                    الخيارات
                  </th>

                  <th style={sx.s43(DC)}>
                    القسم
                  </th>

                  <th style={sx.s44(DC)}>
                    النطاق
                  </th>

                  {filteredTypes.map(t => {
                const sx = {
                  s1: (colStyle, C) => ({
                    ...colStyle,
                    borderBottom: "2px solid #E5E7EB",
                    color: C.primary,
                    fontSize: 10
                  })
                };
                return <th key={t.id} style={sx.s1(colStyle, C)}>
                      {t.name}
                    </th>;
              })}
                </tr>
              </thead>

              <tbody>
                {allKeys.map((key, ri) => {
              const stat = fieldStats.find(f => f.field_key === key);
              const fieldScope = stat?.scope || "dynamic";
              const sx = {
                s1: (ri, DC) => ({
                  background: ri % 2 === 0 ? DC?.white || "#fff" : DC?.bg || "#F8FAFC"
                }),
                s2: (DC, ri) => ({
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: DC?.text || "#1A2E20",
                  borderBottom: "1px solid #F3F4F6",
                  position: "sticky",
                  right: 0,
                  background: ri % 2 === 0 ? DC?.white || "#fff" : DC?.bg || "#F8FAFC",
                  zIndex: 5
                }),
                s3: DC => ({
                  fontSize: 9,
                  color: DC?.text3 || "#9CA3AF",
                  fontWeight: 400
                }),
                s4: {
                  marginTop: 4,
                  background: "none",
                  border: "none",
                  color: "#EF4444",
                  fontSize: 10,
                  cursor: "pointer",
                  padding: 0
                },
                s5: stat => ({
                  padding: "8px 10px",
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  borderBottom: "1px solid #F3F4F6",
                  color: stat?.count > 1 ? "#B91C1C" : "#374151"
                }),
                s6: {
                  padding: "8px 14px",
                  fontSize: 11,
                  borderBottom: "1px solid #F3F4F6",
                  verticalAlign: "top",
                  maxWidth: 200
                },
                s7: {
                  padding: "8px 14px",
                  fontSize: 11,
                  borderBottom: "1px solid #F3F4F6",
                  verticalAlign: "middle"
                },
                s8: {
                  padding: "8px 14px",
                  fontSize: 11,
                  borderBottom: "1px solid #F3F4F6",
                  verticalAlign: "middle"
                }
              };
              return <tr key={key} style={sx.s1(ri, DC)}>
                      <td style={sx.s2(DC, ri)}>
                        <div>{fieldLabelMap[key] || key}</div>
                        <div style={sx.s3(DC)}>
                          {key}
                        </div>

                        {(() => {
                    const t = fields.find(f => f.field_key === key);
                    const sx = {
                      s1: {
                        fontSize: 8,
                        background: "#EDE9FE",
                        color: "#7C3AED",
                        borderRadius: 4,
                        padding: "1px 4px",
                        marginTop: 2,
                        display: "inline-block"
                      }
                    };
                    return t ? <span style={sx.s1}>
                              {DEFAULT_TYPE_LABELS[t.field_type] || t.field_type}
                            </span> : null;
                  })()}

                        <button onClick={async () => {
                    if (!window.confirm(`حذف خاصية "${fieldLabelMap[key] || key}" من كل الأنواع؟`)) {
                      return;
                    }
                    const ids = fields.filter(f => f.field_key === key).map(f => f.id);
                    await deletePropertyFieldIds(ids);
                    setFields(p => p.filter(f => f.field_key !== key));
                  }} style={sx.s4}>
                          🗑
                        </button>
                      </td>

                      <td style={sx.s5(stat)}>
                        {stat?.count || 0}
                      </td>

                      <td style={sx.s6}>
                        {(() => {
                    const f = fields.find(x => x.field_key === key);
                    const opts = Array.isArray(f?.options) ? f.options : [];
                    const sx = {
                      s1: {
                        color: "#D1D5DB",
                        fontSize: 10
                      },
                      s2: {
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 3
                      },
                      s3: {
                        fontSize: 9,
                        padding: "2px 6px",
                        borderRadius: 10,
                        background: "#EDE9FE",
                        color: "#7C3AED",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit"
                      }
                    };
                    if (!opts.length) {
                      return <span style={sx.s1}>—</span>;
                    }
                    return <div style={sx.s2}>
                              {opts.map(o => {
                        const sx = {
                          s1: {
                            fontSize: 9,
                            padding: "2px 6px",
                            borderRadius: 10,
                            background: "#F3F4F6",
                            color: "#374151",
                            fontWeight: 600
                          }
                        };
                        return <span key={o} style={sx.s1}>
                                  {o}
                                </span>;
                      })}

                              <button onClick={() => setEditingOptions({
                        fieldKey: key,
                        options: [...opts]
                      })} style={sx.s3}>
                                ✏️ تعديل
                              </button>
                            </div>;
                  })()}
                      </td>

                      <td style={sx.s7}>
                        {(() => {
                    const f = fields.find(x => x.field_key === key);
                    const sx = {
                      s1: {
                        display: "flex",
                        flexDirection: "column",
                        gap: 3
                      },
                      s2: {
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#374151"
                      },
                      s3: {
                        fontSize: 9,
                        padding: "2px 6px",
                        borderRadius: 6,
                        background: "#F3F4F6",
                        color: "#6B7280",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        width: "fit-content"
                      }
                    };
                    if (!f) return null;
                    return <div style={sx.s1}>
                              <span style={sx.s2}>
                                {f.section_icon} {f.section}
                              </span>

                              <button onClick={() => {
                        const newSection = window.prompt("اسم القسم:", f.section);
                        if (!newSection || newSection === f.section) return;
                        const newIcon = window.prompt("أيقونة القسم:", f.section_icon);
                        const ids = fields.filter(x => x.field_key === key).map(x => x.id);
                        updatePropertyFieldIds(ids, {
                          section: newSection,
                          section_icon: newIcon || f.section_icon
                        }).then(() => {
                          setFields(p => p.map(x => x.field_key === key ? {
                            ...x,
                            section: newSection,
                            section_icon: newIcon || x.section_icon
                          } : x));
                        });
                      }} style={sx.s3}>
                                ✏️ تعديل
                              </button>
                            </div>;
                  })()}
                      </td>

                      <td style={sx.s8}>
                        {(() => {
                    const f = fields.find(x => x.field_key === key);
                    const sx = {
                      s1: s => ({
                        padding: "3px 6px",
                        borderRadius: 6,
                        border: "1.5px solid " + s.bg,
                        background: s.bg,
                        color: s.color,
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "Tajawal,sans-serif",
                        outline: "none",
                        cursor: "pointer"
                      })
                    };
                    if (!f) return null;
                    const scope = f.field_scope || "dynamic";
                    const scopeColors = {
                      core: {
                        bg: "#EFF6FF",
                        color: "#1D4ED8"
                      },
                      dynamic: {
                        bg: "#F0FDF4",
                        color: "#16A34A"
                      },
                      system: {
                        bg: "#F3F4F6",
                        color: "#6B7280"
                      }
                    };
                    const s = scopeColors[scope] || scopeColors.dynamic;
                    return <select value={scope} onChange={async e => {
                      const newScope = e.target.value;
                      const ids = fields.filter(x => x.field_key === key).map(x => x.id);
                      await updatePropertyFieldIds(ids, {
                        field_scope: newScope
                      });
                      setFields(p => p.map(x => x.field_key === key ? {
                        ...x,
                        field_scope: newScope
                      } : x));
                    }} style={sx.s1(s)}>
                              <option value="dynamic">ديناميكي</option>
                              <option value="core">أساسي</option>
                              <option value="system">نظام</option>
                            </select>;
                  })()}
                      </td>

                      {filteredTypes.map(t => {
                  const active = !!matrix[t.id]?.[key];
                  const isLoading = saving === `${t.id}-${key}`;
                  const disabled = fieldScope !== "dynamic";
                  const sx = {
                    s1: colStyle => ({
                      ...colStyle,
                      borderBottom: "1px solid #F3F4F6"
                    }),
                    s2: (disabled, isLoading, active, C, saving) => ({
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "none",
                      background: disabled ? "#E5E7EB" : isLoading ? "#E5E7EB" : active ? "#E8F4F0" : "#F3F4F6",
                      color: disabled ? "#9CA3AF" : isLoading ? "#9CA3AF" : active ? C.primary : "#D1D5DB",
                      fontSize: 16,
                      cursor: disabled || saving ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                      transition: "all 0.15s",
                      boxShadow: active && !disabled ? "0 0 0 2px " + C.primary : "none",
                      opacity: disabled ? 0.85 : 1
                    })
                  };
                  return <td key={t.id} style={sx.s1(colStyle)}>
                            <button onClick={() => toggle(t.id, key)} disabled={!!saving || disabled} title={disabled ? "الحقول الأساسية والنظامية ثابتة" : active ? "إلغاء التفعيل" : "تفعيل"} style={sx.s2(disabled, isLoading, active, C, saving)}>
                              {isLoading ? "⏳" : active ? "✓" : "○"}
                            </button>
                          </td>;
                })}
                    </tr>;
            })}
              </tbody>
            </table>

            <div style={sx.s45}>
              <div style={sx.s46}>
                📋 حقول listings — الخضراء مربوطة بخاصية، الرمادية غير مربوطة بعد
              </div>

              {["core", "dynamic", "system"].map(scope => {
            const scopeLabel = scope === "core" ? "📌 أساسية" : scope === "dynamic" ? "🔧 ديناميكية" : "⚙️ نظام";
            const scopeColor = scope === "core" ? "#1D4ED8" : scope === "dynamic" ? C.primary : "#6B7280";
            const cols = availableListingColumns.filter(c => c.scope === scope);
            const sx = {
              s1: {
                marginBottom: 8
              },
              s2: scopeColor => ({
                fontSize: 10,
                fontWeight: 800,
                color: scopeColor,
                marginBottom: 4
              }),
              s3: {
                display: "flex",
                flexWrap: "wrap",
                gap: 5
              }
            };
            if (!cols.length) return null;
            return <div key={scope} style={sx.s1}>
                    <div style={sx.s2(scopeColor)}>
                      {scopeLabel}
                    </div>

                    <div style={sx.s3}>
                      {cols.map(col => {
                  const linked = fieldStats.some(f => f.field_key === col.key);
                  const sx = {
                    s1: (linked, C) => ({
                      fontSize: 10,
                      padding: "3px 8px",
                      borderRadius: 20,
                      fontWeight: 700,
                      background: linked ? "#E8F4F0" : "#F3F4F6",
                      color: linked ? C.primary : "#9CA3AF",
                      border: `1px solid ${linked ? "#BBF7D0" : "#E5E7EB"}`,
                      cursor: !linked ? "pointer" : "default"
                    })
                  };
                  return <span key={col.key} title={linked ? "مربوط بخاصية" : "اضغط لإضافة خاصية"} onClick={() => {
                    if (linked) return;
                    setNewField(p => ({
                      ...p,
                      field_key: col.key,
                      label: col.label,
                      field_scope: col.scope || "dynamic"
                    }));
                    setShowAddField(true);
                  }} style={sx.s1(linked, C)}>
                            {linked ? "✓ " : ""}
                            {col.label}
                          </span>;
                })}
                    </div>
                  </div>;
          })}
            </div>

            <div style={sx.s47(DC)}>
              <span>
                {fieldStats.length} خاصية · {types.length} نوع عقار
              </span>
            </div>
          </div>}
      </div>
    </div>;
      }
