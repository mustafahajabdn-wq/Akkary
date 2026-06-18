import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { S } from "../../shared/styles/primitives.js";
import {
  createAdminLink,
  deleteAdminLink,
  fetchAdminLinks,
  updateAdminLink,
} from "../services/adminLinksService.js";

const EMPTY_FORM = { title: "", url: "", category: "عام", description: "", sort_order: 0 };

async function copyValue(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const node = document.createElement("textarea");
  node.value = value;
  document.body.appendChild(node);
  node.select();
  document.execCommand("copy");
  node.remove();
}

export default function AdminLinksPage({ setPage, DC, user }) {
  if (user?.role !== "admin") return <Navigate to="/admin/dashboard" replace />;

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const categories = useMemo(() => [
    "الكل",
    ...Array.from(new Set(links.map(item => item.category || "عام"))),
  ], [links]);

  const visibleLinks = useMemo(() =>
    selectedCategory === "الكل"
      ? links
      : links.filter(item => (item.category || "عام") === selectedCategory),
  [links, selectedCategory]);

  useEffect(() => {
    fetchAdminLinks()
      .then(setLinks)
      .catch(err => setError(err?.message || "تعذر تحميل الروابط"))
      .finally(() => setLoading(false));
  }, []);

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: `1.5px solid ${DC?.border || "#DDE8E1"}`,
    borderRadius: 11,
    padding: "10px 11px",
    background: DC?.bg || "#fff",
    color: DC?.text || "#0F172A",
    fontFamily: "inherit",
    fontSize: 12,
    outline: "none",
    marginBottom: 9,
  };

  const actionStyle = (kind = "normal") => ({
    border: "none",
    borderRadius: 9,
    padding: "8px 5px",
    background: kind === "open" ? C.primary : kind === "delete" ? "#FEE2E2" : "#F1F5F9",
    color: kind === "open" ? "#fff" : kind === "delete" ? "#B91C1C" : "#334155",
    fontFamily: "inherit",
    fontSize: 10.5,
    fontWeight: 800,
    cursor: "pointer",
  });

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
    setFormOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      url: item.url || "",
      category: item.category || "عام",
      description: item.description || "",
      sort_order: item.sort_order ?? 0,
    });
    setError("");
    setNotice("");
    setFormOpen(true);
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (editingId) {
        const updated = await updateAdminLink(editingId, form);
        setLinks(prev => prev.map(item => item.id === editingId ? updated : item));
        setNotice("تم تعديل الرابط");
      } else {
        const created = await createAdminLink(form);
        setLinks(prev => [...prev, created]);
        setNotice("تمت إضافة الرابط");
      }
      setLinks(prev => [...prev].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)));
      setFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err?.message || "تعذر حفظ الرابط");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (!window.confirm(`هل تريد حذف رابط «${item.title}»؟`)) return;
    try {
      await deleteAdminLink(item.id);
      setLinks(prev => prev.filter(link => link.id !== item.id));
      setNotice("تم حذف الرابط");
    } catch (err) {
      setError(err?.message || "تعذر حذف الرابط");
    }
  }

  return (
    <div style={S.pageShell(DC)}>
      <div style={{ background: "#334155", padding: "48px 16px 52px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.09} color="#FFFFFF" width={430} height={210} />
        <div style={S.absTopRight14}><BackButton onPress={() => setPage("adminDashboard")} /></div>
        <div style={S.relZ1}>
          <div style={S.heroEyebrow}>لوحة الإدارة</div>
          <div style={S.title20White}>🔗 الروابط المهمة</div>
          <div style={{ color: "rgba(255,255,255,.72)", fontSize: 11, marginTop: 4 }}>وصول سريع إلى لوحات الخدمات والأدوات</div>
        </div>
        <Wave />
      </div>

      <div style={{ padding: "0 14px 90px", marginTop: -24, position: "relative", zIndex: 2 }}>
        <div style={{ background: DC?.white || "#fff", border: `1px solid ${DC?.border || "#DDE8E1"}`, borderRadius: 16, padding: 12, marginBottom: 12 }}>
          <button type="button" onClick={openCreate} style={{ width: "100%", border: "none", borderRadius: 12, padding: "12px 14px", background: C.primary, color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
            ＋ إضافة رابط جديد
          </button>
          {categories.length > 1 && (
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingTop: 10 }}>
              {categories.map(category => (
                <button key={category} type="button" onClick={() => setSelectedCategory(category)} style={{ border: `1px solid ${selectedCategory === category ? C.primary : DC?.border || "#DDE8E1"}`, borderRadius: 999, padding: "7px 12px", background: selectedCategory === category ? "#E8F4F0" : "#F8FAFC", color: selectedCategory === category ? C.primary : "#64748B", fontFamily: "inherit", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {formOpen && (
          <form onSubmit={save} style={{ background: DC?.white || "#fff", border: `1px solid ${DC?.border || "#DDE8E1"}`, borderRadius: 16, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>{editingId ? "تعديل الرابط" : "إضافة رابط"}</div>
            <input style={fieldStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="اسم الرابط" required />
            <input style={{ ...fieldStyle, direction: "ltr", textAlign: "left" }} value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." required />
            <input style={fieldStyle} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="التصنيف" />
            <textarea style={{ ...fieldStyle, minHeight: 70 }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف مختصر" />
            <input style={fieldStyle} type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} placeholder="ترتيب الظهور" />
            <div style={{ padding: 9, borderRadius: 10, background: "#FFF7ED", color: "#9A3412", fontSize: 10.5, marginBottom: 10 }}>لا تحفظ كلمات مرور أو مفاتيح سرية داخل الروابط.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button type="submit" disabled={saving} style={actionStyle("open")}>{saving ? "جارٍ الحفظ..." : "حفظ"}</button>
              <button type="button" onClick={() => setFormOpen(false)} style={actionStyle()}>إلغاء</button>
            </div>
          </form>
        )}

        {error && <div style={{ padding: 10, borderRadius: 10, background: "#FEF2F2", color: "#B91C1C", marginBottom: 10, fontSize: 11.5, fontWeight: 800 }}>{error}</div>}
        {notice && <div style={{ padding: 10, borderRadius: 10, background: "#F0FDF4", color: "#15803D", marginBottom: 10, fontSize: 11.5, fontWeight: 800 }}>{notice}</div>}

        {loading ? <div style={S.emptyStateCentered}>⏳</div> : visibleLinks.length === 0 ? <div style={S.emptyStateCentered}>لا توجد روابط محفوظة بعد.</div> : visibleLinks.map(item => (
          <div key={item.id} style={{ background: DC?.white || "#fff", border: `1px solid ${DC?.border || "#DDE8E1"}`, borderRadius: 16, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: DC?.text || "#0F172A" }}>{item.title}</div>
                <span style={{ display: "inline-block", marginTop: 5, padding: "3px 8px", borderRadius: 999, background: "#F1F5F9", color: "#475569", fontSize: 9.5, fontWeight: 800 }}>{item.category || "عام"}</span>
              </div>
              <span style={{ fontSize: 9.5, color: "#94A3B8" }}>#{item.sort_order ?? 0}</span>
            </div>
            {item.description && <div style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.7, color: "#64748B" }}>{item.description}</div>}
            <div title={item.url} style={{ marginTop: 8, padding: 8, borderRadius: 10, background: "#F8FAFC", color: "#2563EB", fontSize: 10.5, direction: "ltr", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.url}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginTop: 10 }}>
              <button type="button" onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")} style={actionStyle("open")}>فتح</button>
              <button type="button" onClick={() => copyValue(item.url).then(() => setNotice("تم نسخ الرابط"))} style={actionStyle()}>نسخ</button>
              <button type="button" onClick={() => openEdit(item)} style={actionStyle()}>تعديل</button>
              <button type="button" onClick={() => remove(item)} style={actionStyle("delete")}>حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
