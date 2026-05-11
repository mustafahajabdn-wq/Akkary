import React from "react";
import { S } from "../../shared/styles/primitives.js";

const ACCOUNT_TYPES = [
  ["individual", "👤", "حساب فردي", "للأفراد الراغبين في البيع أو الشراء"],
  ["office", "🏢", "مكتب عقاري", "للمكاتب والوسطاء العقاريين"],
];

export function AccountTypeSheet({
  open,
  pendingGoogleUser,
  googleTermsAccepted,
  sx,
  onClose,
  onToggleTerms,
  onOpenTerms,
  onSelectAccountType,
}) {
  if (!open || !pendingGoogleUser) return null;

  return <div style={sx.bottomSheetWrap}>
      <div style={sx.overlayDark} onClick={onClose} />
      <div style={sx.sheet}>
        <div style={sx.handle} />
        <div style={sx.centerBlock}>
          <div style={sx.s1}>👋</div>
          <div style={sx.title17}>أهلاً {pendingGoogleUser.name}!</div>
          <div style={sx.text13}>اختر نوع حسابك لإكمال التسجيل</div>
        </div>

        <div style={sx.termsBox}>
          <div onClick={onToggleTerms} style={sx.termsCheck(googleTermsAccepted)}>
            {googleTermsAccepted && <span style={sx.termsCheckMark}>✓</span>}
          </div>
          <div style={sx.termsText}>
            أوافق على{" "}
            <span onClick={onOpenTerms} style={sx.termsLink}>
              الشروط والأحكام
            </span>
            {" "}بما فيها التزام الضمير برسوم الخدمة
          </div>
        </div>

        <div style={sx.accountButtons}>
          {ACCOUNT_TYPES.map(([type, icon, label, desc]) => <button
              key={type}
              disabled={!googleTermsAccepted}
              onClick={() => onSelectAccountType(type)}
              style={sx.accountButton(googleTermsAccepted)}
            >
              <div style={sx.accountIcon}>{icon}</div>
              <div style={sx.accountLabel(googleTermsAccepted)}>{label}</div>
              <div style={sx.accountDesc}>{desc}</div>
            </button>)}
        </div>

        <button onClick={onOpenTerms} style={sx.linkBtn}>
          قراءة الشروط والأحكام كاملة
        </button>
      </div>
    </div>;
}

export function GoogleTermsSheet({ open, sx, onClose, onAccept }) {
  if (!open) return null;

  return <div style={S.fixedBottomSheet}>
      <div onClick={onClose} style={sx.overlayDark} />
      <div style={sx.whiteSheet}>
        <div style={sx.sheetHeader}>
          <div style={sx.sheetHeaderTitle}>الشروط والأحكام</div>
          <button onClick={onClose} style={sx.closeBtn}>✕</button>
        </div>
        <div style={sx.sheetBody}>
          <p><strong>طبيعة الخدمة:</strong> طابو أخضر وسيط تقني فقط، لا تتحمل مسؤولية المحتوى المنشور أو نتائج الصفقات.</p>
          <p style={sx.s2}><strong>رسوم الخدمة:</strong> رسوم المنصة رمزية (0.1 دولار) عن كل صفقة تتم عبر المنصة، وهي التزام أخلاقي على البائع دعماً لاستمرار الخدمة. لا تفرض المنصة آلية إلزامية للدفع، وتعتمد على أمانة المستخدمين وضميرهم.</p>
          <p style={sx.s3}><strong>مسؤولية المستخدم:</strong> تتحمل المسؤولية الكاملة عن أي محتوى مرئي أو فيديو أو معلومات تنشرها.</p>
          <p style={sx.s4}><strong>حقوق المنصة:</strong> تحتفظ المنصة بحق حذف أي محتوى مخالف وتعليق الحسابات المخالفة.</p>
        </div>
        <div style={sx.sheetFooter}>
          <button onClick={onAccept} style={sx.primaryAction}>
            ✓ أوافق على الشروط والأحكام
          </button>
        </div>
      </div>
    </div>;
}

export function LoginGateSheet({ open, sx, onClose, onLogin }) {
  if (!open) return null;

  return <div style={sx.bottomSheetWrap} onClick={onClose}>
      <div style={sx.overlaySoft} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          ...sx.s5,
          paddingBottom: "calc(118px + env(safe-area-inset-bottom))",
          position: "relative",
          zIndex: 50
        }}
      >
        <div style={sx.handle} />
        <div style={sx.centerBlockSmall}>
          <div style={sx.loginIconWrap}>🔐</div>
          <div style={sx.title17}>سجّل دخولك للمتابعة</div>
          <div style={sx.loginText}>
            يمكنك تصفح الإعلانات بحرية.<br />
            سجّل دخولك للإضافة والتواصل والمتابعة.
          </div>
        </div>
        <button onClick={onLogin} style={sx.loginPrimary}>
          تسجيل الدخول
        </button>
        <button
          onClick={onClose}
          style={{
            ...sx.loginSecondary,
            position: "relative",
            zIndex: 60
          }}
        >
          تصفح فقط
        </button>
      </div>
    </div>;
}

export function DeniedNotificationSheet({ open, sx, onClose }) {
  if (!open) return null;

  return <div style={sx.deniedWrap} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={sx.deniedSheet}>
        <div style={sx.deniedHandle} />
        <div style={sx.deniedEmoji}>🔔</div>
        <div style={sx.deniedTitle}>الإشعارات محظورة</div>
        <div style={sx.deniedText}>
          رفضت إذن الإشعارات مسبقاً.<br />لإعادة تفعيلها يدوياً:
        </div>
        <div style={sx.androidBox}>
          <div style={sx.androidTitle}>🤖 Android Chrome</div>
          <div style={S.bodyText374151}>
            ١. افتح <b>إعدادات Chrome</b><br />
            ٢. إعدادات الموقع ← الإشعارات<br />
            ٣. ابحث عن <b>blabladar.com</b><br />
            ٤. غيّر إلى <b>سماح</b>
          </div>
        </div>
        <div style={sx.iosBox}>
          <div style={sx.iosTitle}>🍎 iPhone Safari</div>
          <div style={S.bodyText374151}>
            ١. افتح <b>الإعدادات</b> ← Safari<br />
            ٢. ابحث عن <b>blabladar.com</b><br />
            ٣. الإشعارات ← <b>سماح</b>
          </div>
        </div>
        <button onClick={onClose} style={sx.darkPrimaryBtn}>
          فهمت
        </button>
      </div>
    </div>;
}
