import React from "react";
import { T } from "../../utils/i18n.js";
import { CG } from "../../styles/componentStyles.js";

function BottomNavBase({ page, setPage, DC, lang, unreadMessages = 0, user = null }) {
  const t = T[lang] || T.ar;
  const isGuest = !user;

  const items = [
    { key: "home", icon: "🏠", label: t.home },
    { key: "search", icon: "🔍", label: t.search },
    { key: "add", icon: "+", label: t.add },
    { key: "messages", icon: "💬", label: t.messages },
    {
      key: "profile",
      icon: isGuest ? "🔑" : "◯",
      label: isGuest ? "دخول" : t.profile,
    },
  ];

  return (
    <div style={CG.bottomNavWrap(DC)} className="bottom-nav">
      <div style={CG.bottomNavRow}>
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => (item.key === "add" ? setPage("addChoice") : setPage(item.key))}
            style={CG.bottomNavButton}
          >
            {item.key === "add" ? (
              <div style={CG.bottomAddButton(DC)}>+</div>
            ) : (
              <div style={CG.unreadDotWrap}>
                <span style={CG.bottomIcon(page, item.key, DC)}>{item.icon}</span>
                {item.key === "messages" && unreadMessages > 0 && (
                  <span style={CG.unreadBadge(DC)}>{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                )}
              </div>
            )}
            <span style={CG.bottomLabel(page, item.key, DC)}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export const BottomNav = React.memo(BottomNavBase);
