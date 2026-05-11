import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { C } from "../../shared/constants/colors.js";
import { STORY_TYPE_COLORS, STORY_TYPES_LABELS, UPDATE_TYPES } from "../../shared/utils/listing.js";
import { S, mergeStyles } from "../../shared/styles/primitives.js";
import { M } from "../../shared/styles/modalStyles.js";
import { getCurrentAuthUser } from "../services/authService.js";
import { checkConversationExists, upsertRating, checkExistingReport, insertReport } from "../services/ratingService.js";
import { updateListingBasic } from "../services/listingService.js";
import { insertStory } from "../services/storyService.js";
import { getListingShareData, buildListingShareText } from "../../shared/utils/listingFormatters.js";

function Modal({
  children
}) {
  return createPortal(children, document.body);
}

function CenterOverlay({
  onClose,
  children,
  hi = false,
  overlayStyle = S.overlay40
}) {
  return <div style={hi ? S.fixedCenterHi : S.fixedCenter}>
      <div onClick={onClose} style={overlayStyle} />
      {children}
    </div>;
}

function BottomSheet({
  onClose,
  children,
  overlayStyle = S.overlay45,
  style,
  portal = false
}) {
  const content = <div style={S.fixedBottomSheet999}>
      <div onClick={onClose} style={overlayStyle} />
      <div style={style}>{children}</div>
    </div>;
  return portal ? <Modal>{content}</Modal> : content;
}

function SheetHandle({
  theme = C,
  marginBottom = 18
}) {
  return <div style={M.handle(theme, marginBottom)} />;
}

function SecondaryButton({
  children,
  onClick,
  theme = C,
  style,
  ...props
}) {
  return <button onClick={onClick} style={mergeStyles(M.sheetButton(theme), {
    border: `1px solid ${theme.border}`,
    background: theme.white
  }, style)} {...props}>
      {children}
    </button>;
}

function PrimaryButton({
  children,
  onClick,
  style,
  ...props
}) {
  return <button onClick={onClick} style={mergeStyles(M.primaryButton(), style)} {...props}>
      {children}
    </button>;
}

// ---- RatingModal ----
function RatingModal({
  onClose,
  sellerName,
  sellerId
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!rating) return;
    setLoading(true);
    setError("");

    try {
      const user = await getCurrentAuthUser();

      if (!user) {
        setError("يجب تسجيل الدخول");
        setLoading(false);
        return;
      }

      if (user.id === sellerId) {
        setError("لا يمكنك تقييم نفسك");
        setLoading(false);
        return;
      }

      const hasConversation = await checkConversationExists(user.id, sellerId);

      if (!hasConversation) {
        setError("يجب التواصل مع البائع أولاً قبل التقييم");
        setLoading(false);
        return;
      }

      const { error: ie } = await upsertRating(user.id, sellerId, rating, comment);

      if (ie) {
        setError("خطأ:" + ie.message);
        setLoading(false);
        return;
      }

      setDone(true);
    } catch (e) {
      setError("خطأ غير متوقع");
    }

    setLoading(false);
  };

  const sx = {
    s1: {
      marginTop: 20
    },
    s2: {
      display: "flex",
      justifyContent: "center",
      gap: 8,
      marginBottom: 8
    },
    s3: {
      flex: 1,
      border: "1.5px solid #E5E7EB",
      fontFamily: "inherit"
    }
  };

  if (done) return <CenterOverlay onClose={onClose}>
        <div style={mergeStyles(M.centerCard, M.confirmCard)}>
          <div style={S.font56}>⭐</div>
          <div style={S.modalTitle17}>تم إرسال تقييمك!</div>
          <div style={M.bodyText(C, {
        marginTop: 6
      })}>شكراً لمساعدتك في بناء الثقة</div>
          <PrimaryButton onClick={onClose} style={sx.s1}>
            إغلاق
          </PrimaryButton>
        </div>
      </CenterOverlay>;

  return <CenterOverlay onClose={onClose} overlayStyle={S.overlay50}>
      <div style={mergeStyles(M.centerCard, {
      padding: "24px 20px"
    })}>
        <div style={M.titleCenter}>تقييم البائع</div>
        <div style={M.subtitleCenter(C)}>{sellerName}</div>

        <div style={M.successBox}>ℹ️ التقييم متاح فقط بعد التواصل مع البائع</div>

        <div style={sx.s2}>
          {[1, 2, 3, 4, 5].map(i => {
          const sx = {
            s1: (i, hover, rating, C) => ({
              fontSize: 36,
              cursor: "pointer",
              color: i <= (hover || rating) ? C.gold2 : "#D1D5DB",
              transition: "color 0.1s"
            })
          };

          return <span key={i} onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} style={sx.s1(i, hover, rating, C)}>
              {"★"}
            </span>;
        })}
        </div>

        <div style={mergeStyles(M.subtitleCenter(C), {
        marginBottom: 12,
        fontWeight: 600
      })}>
          {["", "ضعيف 😞", "مقبول 😐", "جيد 🙂", "جيد جداً 😊", "ممتاز 🌟"][hover || rating] || "اختر تقييمك"}
        </div>

        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="أضف تعليقاً يساعد الآخرين... (اختياري)" style={M.textarea({
        ...C,
        bg: C.white,
        text: C.text
      }, 70, {
        background: C.white
      })} />

        {error && <div style={M.errorBox}>{"⚠️"}{error}</div>}

        <div style={M.footerRow}>
          <SecondaryButton onClick={onClose} style={sx.s3}>
            إلغاء
          </SecondaryButton>

          <button onClick={submit} disabled={!rating || loading} style={mergeStyles(M.sheetButton(C), {
          flex: 2,
          border: "none",
          background: rating && !loading ? C.primary : "#D1D5DB",
          color: "white",
          cursor: rating ? "pointer" : "default",
          fontFamily: "inherit"
        })}>
            {loading ? "جاري الإرسال..." : "إرسال التقييم ⭐"}
          </button>
        </div>

        <div style={M.infoTextCenter}>{"🛡️ يتطلب 3 تقييمات لعرض المعدل · تقييم واحد لكل مستخدم"}</div>
      </div>
    </CenterOverlay>;
}

// ---- EditListingModal ----
function EditListingModal({
  listing,
  onClose,
  onSave
}) {
  const [title, setTitle] = useState(listing.title || "");
  const [price, setPrice] = useState(String(listing.price || "").replace(/,/g, ""));
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    await updateListingBasic(listing.id, {
      title: title || listing.title,
      price: parseFloat(price) || 0
    });

    onSave({
      ...listing,
      title,
      price: parseFloat(price) || 0
    });

    setSaving(false);
    setDone(true);
  };

  const sx = {
    s1: {
      marginTop: 20,
      fontSize: 13,
      fontFamily: "Tajawal, sans-serif"
    },
    s2: {
      fontSize: 16,
      fontWeight: 800,
      marginBottom: 20
    },
    s3: {
      flex: 1
    }
  };

  if (done) return <Modal>
        <CenterOverlay onClose={onClose} hi>
          <div style={mergeStyles(M.centerCard, M.confirmCard)}>
            <div style={S.font56}>{"✅"}</div>
            <div style={S.modalTitle17}>تم حفظ التعديل</div>
            <PrimaryButton onClick={onClose} style={sx.s1}>
              حسناً
            </PrimaryButton>
          </div>
        </CenterOverlay>
      </Modal>;

  const inp = M.input(C, {
    marginBottom: 14
  });

  return <BottomSheet onClose={onClose} overlayStyle={S.overlay40} portal style={M.bottomSheet(C, {
    borderRadius: "20px 20px 0 0",
    padding: "20px 20px 40px"
  })}>
      <SheetHandle theme={C} marginBottom={20} />
      <div style={sx.s2}>تعديل الإعلان</div>

      <div style={S.label12(C)}>عنوان الإعلان</div>
      <input value={title} onChange={e => setTitle(e.target.value)} style={inp} />

      <div style={S.label12(C)}>السعر</div>
      <input value={price} onChange={e => setPrice(e.target.value)} style={mergeStyles(inp, S.ltrRight)} type="number" />

      <div style={S.gap10}>
        <SecondaryButton onClick={onClose} theme={C} style={sx.s3}>إلغاء</SecondaryButton>

        <button onClick={handleSave} disabled={saving} style={mergeStyles(M.sheetButton(C), {
        flex: 2,
        border: "none",
        background: saving ? "#9CA3AF" : listing?.type === "want_buy" || listing?.type === "want_rent" ? "#C8952A" : C.primary,
        color: "white",
        cursor: saving ? "not-allowed" : "pointer"
      })}>
          {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
        </button>
      </div>
    </BottomSheet>;
}

// ---- DeleteConfirmModal ----
function DeleteConfirmModal({
  listing,
  onClose,
  onConfirm
}) {
  const [deletePulse, setDeletePulse] = useState(false);

  const sx = {
    s1: {
      textAlign: "center",
      marginBottom: 20
    },
    s2: C => ({
      fontWeight: 700,
      color: C.text
    }),
    s3: {
      flex: 1
    },
    s4: active => ({
      flex: 1,
      border: "none",
      background: C.danger,
      color: "white",
      transform: active ? "scale(0.96)" : "scale(1)",
      boxShadow: active ? "0 0 0 6px rgba(239,68,68,0.16)" : "none",
      transition: "transform 120ms ease, box-shadow 120ms ease"
    })
  };

  return <Modal>
      <CenterOverlay onClose={onClose} hi>
        <div style={mergeStyles(M.centerCard, M.confirmCardCompact)}>
          <div style={sx.s1}>
            <div style={S.font48}>{"🗑️"}</div>
            <div style={S.modalTitle17}>حذف الإعلان</div>

            <div style={mergeStyles(M.bodyText(C), {
            marginTop: 8,
            lineHeight: 1.5
          })}>
              هل أنت متأكد من حذف إعلان<br />
              <span style={sx.s2(C)}>
                "{listing.title}"
              </span>
              ؟<br />
              لا يمكن التراجع عن هذا الإجراء.
            </div>
          </div>

          <div style={S.gap10}>
            <SecondaryButton onClick={onClose} theme={C} style={sx.s3}>إلغاء</SecondaryButton>

            <button
              onClick={() => {
                setDeletePulse(true);
                setTimeout(() => setDeletePulse(false), 140);
                setTimeout(() => onConfirm(listing.id), 120);
              }}
              style={mergeStyles(M.sheetButton(C), sx.s4(deletePulse))}
            >
              حذف نهائياً
            </button>
          </div>
        </div>
      </CenterOverlay>
    </Modal>;
}

// ---- ReportModal ----
function ReportModal({
  onClose,
  itemTitle,
  itemId,
  itemType = "listing",
  DC,
  onReported,
  conversationId
}) {
  const sx = {
    s1: {
      fontSize: 15,
      fontWeight: 800,
      marginTop: 10
    },
    s2: {
      marginTop: 10,
      fontSize: 12,
      color: "#92400E",
      background: "#FFFBEB",
      border: "1px solid #FDE68A",
      borderRadius: 10,
      padding: "8px 10px"
    },
    s3: {
      marginTop: 20
    },
    s4: {
      marginTop: 20
    },
    s5: DC => ({
      fontSize: 12,
      fontWeight: 700,
      color: DC.text,
      marginBottom: 8
    }),
    s6: DC => ({
      flex: 1,
      border: `1.5px solid ${DC.border}`,
      fontFamily: "inherit"
    })
  };

  if (!DC) DC = C;

  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [alreadyReported, setAlreadyReported] = useState(null);

  const REASONS_LISTING = ["إعلان وهمي أو احتيالي", "صور مضللة أو غير حقيقية", "سعر مبالغ فيه أو غير منطقي", "محتوى مسيء أو غير لائق", "رقم هاتف خاطئ أو غير موجود", "إعلان مكرر", "غير ذلك"];
  const REASONS_USER = ["سلوك مسيء أو تحرش", "احتيال أو نصب", "رسائل مزعجة", "انتحال شخصية", "محتوى مخالف", "غير ذلك"];
  const REASONS = itemType === "listing" ? REASONS_LISTING : REASONS_USER;

  const title = itemType === "listing" ? "🚩 الإبلاغ عن إعلان" : itemType === "profile" ? "🚩 الإبلاغ عن مستخدم" : "🚩 الإبلاغ عن محادثة";
  const duplicateMessage = itemType === "listing" ? "لقد أرسلت بلاغاً على هذا الإعلان مسبقاً" : itemType === "profile" ? "لقد أرسلت بلاغاً على هذا المستخدم مسبقاً" : "لقد أرسلت بلاغاً على هذه المحادثة مسبقاً";

  useEffect(() => {
    let alive = true;

    async function checkExisting() {
      if (!itemId) {
        if (alive) setCheckingExisting(false);
        return;
      }

      try {
        const currentUser = await getCurrentAuthUser();

        if (!currentUser?.id) {
          if (alive) setCheckingExisting(false);
          return;
        }

        const {
          data,
          error: queryError
        } = await checkExistingReport(currentUser.id, itemType, itemId, conversationId);

        if (!alive) return;

        if (!queryError && data) {
          setAlreadyReported(data);

          try {
            localStorage.setItem(`report_sent:${currentUser.id}:${itemType}:${itemType === "chat" && conversationId ? conversationId : itemId}`, "1");
          } catch {}
        }
      } catch {}

      if (alive) setCheckingExisting(false);
    }

    checkExisting();

    return () => {
      alive = false;
    };
  }, [itemId, itemType]);

  const submit = async () => {
    if (!reason) return;

    setLoading(true);

    try {
      const user = await getCurrentAuthUser();

      const row = {
        reporter_id: user?.id || null,
        reason,
        details: details.trim() || null,
        source: itemType,
        created_at: new Date().toISOString()
      };

      if (itemType === "listing") row.listing_id = itemId;
      else row.reported_user_id = itemId;

      if (itemType === "chat" && conversationId) row.conversation_id = conversationId;

      const { error: ie } = await insertReport(row);

      if (ie) {
        if (ie.code === "23505") {
          setAlreadyReported({
            id: "duplicate",
            status: "pending",
            created_at: new Date().toISOString()
          });
          setError(duplicateMessage);
        } else {
          setError("حدث خطأ، حاول مجدداً");
        }

        setLoading(false);
        return;
      }

      try {
        if (user?.id && itemId) {
          localStorage.setItem(`report_sent:${user.id}:${itemType}:${itemType === "chat" && conversationId ? conversationId : itemId}`, "1");
        }
      } catch {}

      onReported && onReported();
      setLoading(false);
      setDone(true);
    } catch (e) {
      setError("حدث خطأ غير متوقع");
      setLoading(false);
      return;
    }
  };

  if (checkingExisting) return <CenterOverlay onClose={onClose}>
        <div style={mergeStyles(M.centerCard, {
      background: DC.white,
      padding: "28px 24px",
      textAlign: "center"
    })}>
          <div style={S.font40}>⏳</div>
          <div style={sx.s1}>جاري التحقق من البلاغ السابق...</div>
        </div>
      </CenterOverlay>;

  if (alreadyReported) return <CenterOverlay onClose={onClose}>
        <div style={mergeStyles(M.centerCard, {
      background: DC.white,
      padding: "30px 24px",
      textAlign: "center"
    })}>
          <div style={S.font52}>🛡️</div>
          <div style={S.modalTitle17}>تم استلام بلاغك مسبقًا</div>
          <div style={M.bodyText(DC, {
        marginTop: 6,
        lineHeight: 1.7
      })}>{duplicateMessage}</div>
          <div style={sx.s2}>
            لن تحتاج إلى إرسال البلاغ مرة أخرى، وهو ظاهر للإدارة للمراجعة.
          </div>
          <PrimaryButton onClick={onClose} style={sx.s3}>إغلاق</PrimaryButton>
        </div>
      </CenterOverlay>;

  if (done) return <CenterOverlay onClose={onClose}>
        <div style={mergeStyles(M.centerCard, {
      background: DC.white,
      padding: "30px 24px",
      textAlign: "center"
    })}>
          <div style={S.font52}>{"✅"}</div>
          <div style={S.modalTitle17}>تم إرسال البلاغ</div>
          <div style={M.bodyText(DC, {
        marginTop: 6,
        lineHeight: 1.6
      })}>سيتم مراجعته من فريقنا خلال 24 ساعة</div>
          <PrimaryButton onClick={onClose} style={sx.s4}>إغلاق</PrimaryButton>
        </div>
      </CenterOverlay>;

  return <CenterOverlay onClose={onClose} overlayStyle={S.overlay50}>
      <div style={mergeStyles(M.centerCardWide, {
      background: DC.white,
      padding: "20px"
    })}>
        <div style={M.titleCenter}>{title}</div>
        {itemTitle && <div style={mergeStyles(M.subtitleCenter(DC, {
        fontSize: 12,
        marginBottom: 14
      }))}>{itemTitle}</div>}

        <div style={sx.s5(DC)}>سبب البلاغ *</div>

        {REASONS.map(r => {
        const sx = {
          s1: (reason, r, C, DC) => ({
            width: "100%",
            textAlign: "right",
            padding: "10px 14px",
            marginBottom: 6,
            borderRadius: 10,
            border: "2px solid",
            borderColor: reason === r ? C.danger : DC.border,
            background: reason === r ? "#FEF2F2" : DC.bg,
            color: reason === r ? C.danger : DC.text,
            fontSize: 13,
            fontWeight: reason === r ? 700 : 400,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 8
          })
        };

        return <button key={r} onClick={() => setReason(r)} style={sx.s1(reason, r, C, DC)}>
            <span style={S.font16}>{reason === r ? "🔴" : "⚪"}</span>
            {r}
          </button>;
      })}

        <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="تفاصيل إضافية (اختياري)..." style={M.textarea(DC, 60, {
        marginTop: 8
      })} />

        {error && <div style={M.errorBox}>⚠️ {error}</div>}

        <div style={M.footerRow}>
          <SecondaryButton onClick={onClose} theme={DC} style={sx.s6(DC)}>
            إلغاء
          </SecondaryButton>

          <button onClick={submit} disabled={!reason || loading} style={mergeStyles(M.sheetButton(C), {
          flex: 2,
          border: "none",
          background: reason && !loading ? C.danger : "#D1D5DB",
          color: "white",
          cursor: reason ? "pointer" : "default",
          fontFamily: "inherit"
        })}>
            {loading ? "جاري الإرسال..." : "إرسال البلاغ 🚩"}
          </button>
        </div>
      </div>
    </CenterOverlay>;
}

// ---- ShareModal ----
function ShareModal({
  item,
  onClose,
  DC
}) {
  const _DC = DC || C;
  const [copied, setCopied] = useState(false);
  const share = getListingShareData(item);
  const txt = buildListingShareText(item);

  const sx = {
    s1: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      zIndex: 2000,
      display: "flex",
      alignItems: "flex-end"
    },
    s2: _DC => ({
      width: "100%",
      maxWidth: 430,
      margin: "0 auto",
      background: _DC.white,
      borderRadius: "20px 20px 0 0",
      padding: "20px 16px 36px"
    }),
    s3: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    },
    s4: _DC => ({
      fontSize: 15,
      fontWeight: 800,
      color: _DC.text
    }),
    s5: _DC => ({
      background: _DC.bg,
      border: "none",
      borderRadius: "50%",
      width: 28,
      height: 28,
      cursor: "pointer",
      fontSize: 14
    }),
    s6: {
      background: "linear-gradient(135deg,#1A4A2E,#2D6B45)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 14
    },
    s7: {
      fontSize: 9,
      color: "rgba(255,255,255,0.5)",
      marginBottom: 3
    },
    s8: {
      fontSize: 15,
      fontWeight: 900,
      color: "white",
      marginBottom: 5,
      lineHeight: 1.3
    },
    s9: {
      fontSize: 20,
      fontWeight: 900,
      color: "#E8B84B",
      marginBottom: 8
    },
    s10: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap"
    },
    s11: {
      fontSize: 11,
      color: "rgba(255,255,255,0.85)"
    },
    s12: {
      fontSize: 11,
      color: "rgba(255,255,255,0.85)"
    },
    s13: {
      fontSize: 11,
      color: "rgba(255,255,255,0.85)"
    },
    s14: {
      marginTop: 10,
      background: "rgba(255,255,255,0.15)",
      borderRadius: 7,
      padding: "5px 10px",
      fontSize: 12,
      color: "white",
      fontWeight: 700
    },
    s15: _DC => ({
      background: _DC.bg,
      borderRadius: 10,
      padding: "10px 12px",
      marginBottom: 12,
      fontSize: 12,
      color: _DC.text2,
      lineHeight: 1.9,
      whiteSpace: "pre-line"
    }),
    s16: {
      flex: 2,
      padding: 13,
      borderRadius: 12,
      border: "none",
      background: "#25D366",
      color: "white",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      fontFamily: "inherit"
    },
    s17: _DC => ({
      flex: 1,
      padding: 13,
      borderRadius: 12,
      border: "1px solid " + _DC.border,
      background: _DC.white,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    })
  };

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return createPortal(<div style={sx.s1} onClick={onClose}>
      <div style={sx.s2(_DC)} onClick={e => e.stopPropagation()}>
        <div style={sx.s3}>
          <span style={sx.s4(_DC)}>📤 مشاركة الإعلان</span>
          <button onClick={onClose} style={sx.s5(_DC)}>
            {"✕"}
          </button>
        </div>

        <div style={sx.s6}>
          <div style={sx.s7}>{share.brand}</div>
          <div style={sx.s8}>{share.title}</div>
          <div style={sx.s9}>{share.price}</div>

          <div style={sx.s10}>
            {share.location && <span style={sx.s11}>📍 {share.location}</span>}
            {share.rooms && <span style={sx.s12}>🛏 {share.rooms}</span>}
            {share.area && <span style={sx.s13}>📐 {share.area}</span>}
          </div>

          {share.phone && <div style={sx.s14}>📞 {share.phone}</div>}
        </div>

        <div style={sx.s15(_DC)}>{txt}</div>

        <div style={S.gap10}>
          <button onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank")} style={sx.s16}>
            {"💬 مشاركة واتساب"}
          </button>

          <button onClick={copy} style={sx.s17(_DC)}>
            {copied ? "✅ نُسخ" : "📋 نسخ"}
          </button>
        </div>
      </div>
    </div>, document.body);
}

// ---- AddUpdateModal ----
function AddUpdateModal({
  onClose,
  onAdd,
  DC
}) {
  const sx = {
    s1: DC => ({
      fontSize: 17,
      fontWeight: 800,
      color: DC.text,
      marginBottom: 4
    }),
    s2: DC => ({
      fontSize: 12,
      color: DC.text3,
      marginBottom: 18
    }),
    s3: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap",
      marginBottom: 18
    },
    s4: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 4,
      marginBottom: 18
    },
    s5: C => ({
      fontSize: 11,
      color: C.gold,
      fontWeight: 600
    }),
    s6: typeInfo => ({
      background: `#${typeInfo.bg}`,
      border: `1px solid #${typeInfo.color}33`,
      borderRadius: 12,
      padding: "12px 14px",
      marginBottom: 18,
      display: "flex",
      gap: 10,
      alignItems: "flex-start"
    }),
    s7: {
      fontSize: 22,
      flexShrink: 0
    },
    s8: typeInfo => ({
      fontSize: 11,
      fontWeight: 800,
      color: `#${typeInfo.color}`,
      marginBottom: 3
    }),
    s9: DC => ({
      fontSize: 13,
      color: DC.text,
      lineHeight: 1.5
    }),
    s10: DC => ({
      fontSize: 10,
      color: DC.text3,
      marginTop: 4
    })
  };

  if (!DC) DC = C;

  const [type, setType] = useState("available");
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const MAX_FREE = 3;
  const typeInfo = UPDATE_TYPES[type];

  const handleAdd = () => {
    if (!text.trim()) return;

    setSubmitted(true);

    setTimeout(() => {
      onAdd({
        id: Date.now(),
        type,
        text: text.trim(),
        time: "الآن"
      });
      onClose();
    }, 800);
  };

  return <BottomSheet onClose={onClose} overlayStyle={S.overlay45} style={M.bottomSheet(DC, {
    borderRadius: "20px 20px 0 0",
    padding: "20px 20px 40px",
    maxHeight: "90vh",
    overflowY: "auto"
  })}>
      <SheetHandle theme={DC} />

      <div style={sx.s1(DC)}>إضافة تحديث</div>
      <div style={sx.s2(DC)}>سيظهر التحديث على صفحة إعلانك ويُعلم المهتمين</div>

      <div style={S.label12(DC, 8)}>نوع التحديث</div>
      <div style={sx.s3}>
        {Object.entries(UPDATE_TYPES).map(([key, val]) => <button key={key} onClick={() => setType(key)} style={M.chipButton(DC, type === key, `#${val.bg}`, `#${val.color}`, {
        border: type === key ? `2px solid #${val.color}` : `1px solid ${DC.border}`,
        color: `#${val.color}`
      })}>
            <span>{val.icon}</span>
            <span>{val.label}</span>
          </button>)}
      </div>

      <div style={S.label12(DC, 8)}>نص التحديث</div>
      <textarea value={text} onChange={e => setText(e.target.value.slice(0, 200))} placeholder={type === "available" ? "مثال: العقار لا يزال متاحاً، يمكن المعاينة يومياً..." : type === "price" ? "مثال: تم تخفيض السعر من 90,000$ إلى 85,000$..." : type === "visit" ? "مثال: يوجد يوم مفتوح السبت 10 صباحاً..." : type === "sold" ? "مثال: تم بيع العقار، شكراً لتواصلكم..." : "اكتب تحديثك هنا..."} style={M.textarea(DC, 100, {
      padding: "12px",
      fontSize: 14,
      direction: "rtl"
    })} />

      <div style={sx.s4}>
        <span style={S.textMuted11(DC)}>{text.length}/200</span>
        <span style={sx.s5(C)}>{"✨ مجاني — حتى"}{MAX_FREE} تحديثات</span>
      </div>

      {text.trim() && <div style={sx.s6(typeInfo)}>
          <span style={sx.s7}>{typeInfo.icon}</span>
          <div>
            <div style={sx.s8(typeInfo)}>{typeInfo.label}</div>
            <div style={sx.s9(DC)}>{text}</div>
            <div style={sx.s10(DC)}>الآن</div>
          </div>
        </div>}

      <button onClick={handleAdd} disabled={!text.trim() || submitted} style={mergeStyles(M.primaryButton(!text.trim() || submitted ? DC.border : C.primary), {
      width: "100%",
      padding: "13px",
      borderRadius: 11,
      fontSize: 14,
      transition: "background 0.2s"
    })}>
        {submitted ? "✓ تم النشر!" : "نشر التحديث"}
      </button>
    </BottomSheet>;
}

// ---- AddStoryModal ----
function AddStoryModal({
  onClose,
  onAdd,
  DC,
  user
}) {
  const sx = {
    s1: selBg => ({
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      background: `#${selBg}`,
      display: "flex",
      flexDirection: "column"
    }),
    s2: {
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    },
    s3: {
      background: "rgba(255,255,255,0.2)",
      border: "none",
      color: "white",
      borderRadius: 20,
      padding: "7px 14px",
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 700
    },
    s4: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 12
    },
    s5: C => ({
      background: C.gold,
      border: "none",
      color: "white",
      borderRadius: 20,
      padding: "7px 18px",
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 800
    }),
    s6: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 24px",
      textAlign: "center"
    },
    s7: text => ({
      fontSize: text.length < 60 ? 24 : 19,
      fontWeight: 800,
      color: "white",
      lineHeight: 1.7,
      whiteSpace: "pre-line",
      textShadow: "0 2px 8px rgba(0,0,0,0.4)"
    }),
    s8: {
      padding: "20px 16px 50px",
      textAlign: "center"
    },
    s9: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "rgba(255,255,255,0.2)",
      borderRadius: 20,
      padding: "8px 16px"
    },
    s10: {
      color: "white",
      fontSize: 13,
      fontWeight: 700
    },
    s11: {
      color: "rgba(255,255,255,0.6)",
      fontSize: 11
    },
    s12: {
      position: "fixed",
      inset: 0,
      zIndex: 1001,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end"
    },
    s13: DC => ({
      fontSize: 17,
      fontWeight: 800,
      color: DC.text,
      marginBottom: 4
    }),
    s14: DC => ({
      fontSize: 12,
      color: DC.text3,
      marginBottom: 18
    }),
    s15: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap",
      marginBottom: 16
    },
    s16: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 4,
      marginBottom: 16
    },
    s17: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 20
    },
    s18: {
      color: "#DC2626",
      fontSize: 13,
      textAlign: "center",
      padding: "8px 12px",
      background: "#FEF2F2",
      borderRadius: 8,
      marginBottom: 10
    }
  };

  if (!DC) DC = C;

  const [type, setType] = useState("listing");
  const [text, setText] = useState("");
  const [selBg, setSelBg] = useState(STORY_TYPE_COLORS["listing"]);
  const [preview, setPreview] = useState(false);
  const [storyError, setStoryError] = useState("");
  const [storyLoading, setStoryLoading] = useState(false);

  const handleTypeChange = k => {
    setType(k);
    setSelBg(STORY_TYPE_COLORS[k]);
  };

  const handleAdd = async () => {
    if (!text.trim()) return;

    if (!user?.id) {
      setStoryError("يجب تسجيل الدخول أولاً");
      return;
    }

    setStoryLoading(true);
    setStoryError("");

    const insertData = {
      user_id: user.id,
      type,
      text: text.trim(),
      bg: selBg,
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      views: 0
    };

    const { error: ie } = await insertStory(insertData);

    if (ie) {
      console.error("story insert error:", ie);
      const msg = ie.message || ie.details || ie.hint || JSON.stringify(ie);
      setStoryError("خطأ:" + msg);
      setStoryLoading(false);
      return;
    }

    setStoryLoading(false);
    onAdd();
    onClose();
  };

  const BG_PALETTES = ["1A4A2E", "2D6B45", "1565C0", "6B21A8", "92400E", "374151", "C8952A", "DC2626", "0D9488", "1E3A5F"];

  if (preview) return <div style={sx.s1(selBg)}>
        <div style={sx.s2}>
          <button onClick={() => setPreview(false)} style={sx.s3}>
            ← تعديل
          </button>
          <span style={sx.s4}>معاينة</span>
          <button onClick={handleAdd} style={sx.s5(C)}>
            {"نشر ✓"}
          </button>
        </div>

        <div style={sx.s6}>
          <div style={sx.s7(text)}>
            {text || "اكتب نص حالتك..."}
          </div>
        </div>

        <div style={sx.s8}>
          <div style={sx.s9}>
            <span style={S.font16}>{STORY_TYPES_LABELS.find(t => t.key === type)?.icon}</span>
            <span style={sx.s10}>{STORY_TYPES_LABELS.find(t => t.key === type)?.label}</span>
            <span style={sx.s11}>• تنتهي خلال 24 ساعة</span>
          </div>
        </div>
      </div>;

  const BOTTOM_NAV_HEIGHT = 64;
  const COMPOSER_FOOTER_HEIGHT = 72;

  const sheetContainerStyle = {
    background: DC.white,
    borderRadius: "22px 22px 0 0",
    width: "100%",
    maxWidth: 430,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    maxHeight: `calc(100dvh - ${BOTTOM_NAV_HEIGHT}px - env(safe-area-inset-bottom, 0px) - 10px)`,
    position: "relative"
  };

  const sheetBodyStyle = {
    flex: 1,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    padding: "20px 18px",
    paddingBottom: `calc(${COMPOSER_FOOTER_HEIGHT}px + 16px)`
  };

  const sheetFooterStyle = {
    position: "sticky",
    bottom: 0,
    left: 0,
    right: 0,
    background: DC.white,
    borderTop: `1px solid ${DC.border}`,
    padding: `12px 16px calc(12px + env(safe-area-inset-bottom, 0px))`,
    zIndex: 5,
    boxShadow: "0 -2px 8px rgba(0,0,0,0.05)"
  };

  const errorBannerStyle = { ...sx.s18, marginBottom: 10 };
  const buttonsRowStyle = { ...S.gap10 };

  return <div style={{ ...sx.s12, paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))` }}>
      <div onClick={onClose} style={S.overlay50} />

      <div style={sheetContainerStyle}>
        <SheetHandle theme={DC} />

        <div style={sheetBodyStyle}>
          <div style={sx.s13(DC)}>إضافة حالة</div>
          <div style={sx.s14(DC)}>تختفي تلقائياً بعد 24 ساعة</div>

          <div style={S.label12(DC, 8)}>نوع الحالة</div>
          <div style={sx.s15}>
            {STORY_TYPES_LABELS.map(({
            key,
            icon,
            label
          }) => <button key={key} onClick={() => handleTypeChange(key)} style={M.chipButton(DC, type === key, `#${STORY_TYPE_COLORS[key]}22`, `#${STORY_TYPE_COLORS[key]}`, {
            border: type === key ? `2px solid #${STORY_TYPE_COLORS[key]}` : `1px solid ${DC.border}`
          })}>
                <span>{icon}</span>
                <span>{label}</span>
              </button>)}
          </div>

          <div style={S.label12(DC, 8)}>نص الحالة</div>
          <textarea value={text} onChange={e => setText(e.target.value.slice(0, 180))} placeholder={type === "listing" ? "مثال: 🏠 شقة 3 غرف — المالكي — 85,000$\nتواصل معنا الآن!" : type === "price" ? "مثال: 💰 تخفيض السعر!\nمن 95,000$ إلى 85,000$" : type === "visit" ? "مثال: 📅 موعد معاينة الجمعة 11 صباحاً\nالعنوان: المزة فيلات" : type === "rent" ? "مثال: 🔑 شقة مفروشة للإيجار\n350$ شهرياً — كفرسوسة" : "اكتب ما تريد مشاركته..."} style={M.textarea(DC, 110, {
          padding: "12px",
          fontSize: 14,
          direction: "rtl"
        })} />

          <div style={sx.s16}>
            <span style={S.textMuted11(DC)}>{text.length}/180</span>
            <span style={S.textMuted11(DC)}>⏱ تنتهي بعد 24 ساعة</span>
          </div>

          <div style={S.label12(DC, 8)}>لون الخلفية</div>
          <div style={sx.s17}>
            {BG_PALETTES.map(bg => <div key={bg} onClick={() => setSelBg(bg)} style={M.colorSwatch(DC, bg, selBg === bg)} />)}
          </div>
        </div>

        <div style={sheetFooterStyle}>
          {storyError && <div style={errorBannerStyle}>{storyError}</div>}

          <div style={buttonsRowStyle}>
            <button onClick={() => text.trim() && setPreview(true)} disabled={!text.trim()} style={mergeStyles(M.sheetButton(DC), {
            flex: 1,
            background: !text.trim() ? DC.border : DC.bg,
            color: DC.text,
            border: `1.5px solid ${DC.border}`,
            borderRadius: 11,
            fontSize: 14,
            fontFamily: "inherit",
            cursor: text.trim() ? "pointer" : "default"
          })}>
              {"معاينة 👁"}
            </button>

            <button onClick={handleAdd} disabled={!text.trim() || storyLoading} style={mergeStyles(M.sheetButton(DC), {
            flex: 2,
            background: !text.trim() ? DC.border : C.primary,
            color: "white",
            border: "none",
            borderRadius: 11,
            fontSize: 14,
            fontFamily: "inherit",
            cursor: text.trim() ? "pointer" : "default"
          })}>
              {storyLoading ? "جاري النشر..." : "نشر الحالة ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>;
}

export {
  RatingModal,
  EditListingModal,
  DeleteConfirmModal,
  ReportModal,
  ShareModal,
  AddUpdateModal,
  AddStoryModal,
};
