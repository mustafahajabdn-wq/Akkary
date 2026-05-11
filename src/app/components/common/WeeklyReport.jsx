import React, { useEffect, useState } from "react";
import { C } from "../../../shared/constants/colors.js";
import { getCurrentUserId } from "../../services/authService.js";
import { fetchUserStats } from "../../services/userService.js";
import { CG } from "../../../shared/styles/componentStyles.js";

export function WeeklyReport({ items, DC = C }) {
  const [stats, setStats] = useState({
    views: 0,
    messages: 0,
    favorites: 0,
    listings: 0,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          if (active) setStats({ views: 0, messages: 0, favorites: 0, listings: items?.length || 0, loading: false });
          return;
        }
        const result = await fetchUserStats(userId);
        if (active && result) {
          setStats({
            views: result.views,
            messages: result.messages,
            favorites: result.favorites,
            listings: result.listings || items?.length || 0,
            loading: false,
          });
        }
      } catch {
        if (active) setStats({ views: 0, messages: 0, favorites: 0, listings: items?.length || 0, loading: false });
      }
    };

    loadStats();
    return () => {
      active = false;
    };
  }, [items?.length]);

  return (
    <div style={CG.weeklyCard(DC)}>
      <div style={CG.weeklyTitle(DC)}>التقرير الإجمالي</div>
      {stats.loading ? (
        <div style={CG.weeklyLoading(DC)}>جارٍ تحميل التقرير...</div>
      ) : (
        <div style={CG.weeklyGrid}>
          <div style={CG.weeklyItem(DC)}>👁️ مجموع المشاهدات: {stats.views}</div>
          <div style={CG.weeklyItem(DC)}>💬 الرسائل الواردة: {stats.messages}</div>
          <div style={CG.weeklyItem(DC)}>⭐ عدد مرات الحفظ: {stats.favorites}</div>
          <div style={CG.weeklyItem(DC)}>📦 عدد إعلاناتك: {stats.listings}</div>
        </div>
      )}
    </div>
  );
}
