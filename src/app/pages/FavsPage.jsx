import React from "react";
import { C } from "../../shared/constants/colors.js";
import { IslamicPattern, Wave } from "../../shared/components/icons.jsx";
import { ListingCard } from "../../shared/components/common/ListingCard.jsx";
import { LoadMoreButton } from "../../shared/components/common/LoadMoreButton.jsx";
import { BackButton } from "../../shared/components/common/BackButton.jsx";
import { S } from "../../shared/styles/primitives.js";

function FavsPage({
  favs,
  setPage,
  openDetail,
  toggleFav,
  DC,
  allListings = []
}) {
  const sx = {
    s1: DC => ({
      background: DC.bg,
      minHeight: "100vh",
      paddingBottom: 80
    }),
    s2: C => ({
      background: C.primary,
      padding: "48px 16px 50px",
      position: "relative",
      overflow: "hidden"
    }),
    s3: {
      position: "absolute",
      top: 16,
      right: 16,
      zIndex: 2
    },
    s4: C => ({
      position: "relative",
      zIndex: 1,
      fontSize: 20,
      fontWeight: 900,
      color: C.white,
      marginBottom: 4
    }),
    s5: {
      position: "relative",
      zIndex: 1,
      fontSize: 12,
      color: "rgba(255,255,255,0.72)",
      fontWeight: 700
    },
    s6: DC => ({
      textAlign: "center",
      padding: "60px 0",
      color: DC.text3
    }),
    s7: C => ({
      fontSize: 16,
      fontWeight: 700,
      color: C.text,
      marginTop: 14
    }),
    s8: {
      fontSize: 13,
      marginTop: 6
    },
    s9: C => ({
      marginTop: 18,
      padding: "11px 26px",
      background: C.primary,
      color: "white",
      border: "none",
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "Tajawal, sans-serif",
      cursor: "pointer"
    })
  };

  if (!DC) DC = C;

  const [visibleCount, setVisibleCount] = React.useState(20);
  const baseList = allListings || [];
  const items = baseList.filter(l => favs?.includes(Number(l.id)) || favs?.includes(String(l.id)));

  return <div style={sx.s1(DC)}>
      <div style={sx.s2(C)}>
        <IslamicPattern opacity={0.1} color="#FFFFFF" />
        <div style={sx.s3}>
          <BackButton onPress={() => setPage("profile")} />
        </div>
        <div style={sx.s4(C)}>المفضلة</div>
        <div style={sx.s5}>{items.length > 0 ? `${items.length} إعلان محفوظ` : "إعلاناتك المحفوظة"}</div>
        <Wave />
      </div>

      <div style={S.pad14}>
        {items.length === 0 ? <div style={sx.s6(DC)}>
            <div style={S.font56}>{"🤍"}</div>
            <div style={sx.s7(C)}>لا توجد مفضلة بعد</div>
            <div style={sx.s8}>{"اضغط على ❤️ في أي إعلان"}</div>
            <button onClick={() => setPage("home")} style={sx.s9(C)}>تصفّح الإعلانات</button>
          </div> : <>
            {items.slice(0, visibleCount).map(item => <ListingCard key={item.id} item={item} onPress={i => {
          openDetail(i, "favs");
        }} favs={favs} toggleFav={toggleFav} />)}
            <LoadMoreButton hasMore={items.length > visibleCount} loading={false} onPress={() => setVisibleCount(p => p + 20)} />
          </>}
      </div>
    </div>;
}

export default FavsPage;
