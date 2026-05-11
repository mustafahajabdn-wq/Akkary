import React, { useEffect, useMemo, useRef, useState } from "react";
import { C } from "../../../shared/constants/colors.js";
import { timeAgo } from "../../../shared/utils/time.js";
import { deleteStory, fetchStories, incrementStoryViews } from "../../services/storyService.js";
import { S } from "../../../shared/styles/primitives.js";

export const storyBubbleStyles = {
    s1: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 5,
      cursor: "pointer",
      flexShrink: 0
    },
    s2: {
      position: "relative"
    },
    s3: (hasStories, isViewed, isMe, DC, C) => ({
      width: 58,
      height: 58,
      borderRadius: "50%",
      background: hasStories
        ? isViewed
          ? "linear-gradient(135deg, #9CA3AF, #D1D5DB)"
          : "linear-gradient(135deg, #C8952A, #1A4A2E)"
        : isMe
          ? "#E8F4F0"
          : DC.bg,
      padding: 2.5,
      boxSizing: "border-box",
      border: hasStories ? "none" : "2px dashed " + (isMe ? C.primary : DC.border)
    }),
    s4: (DC, C) => ({
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      background: DC.white,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      fontWeight: 800,
      color: C.primary,
      border: "2px solid " + DC.white
    }),
    s5: (C, DC) => ({
      position: "absolute",
      bottom: -1,
      left: -1,
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: C.primary,
      border: "2px solid " + DC.white,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
      color: "white",
      fontWeight: 900,
      lineHeight: 1
    }),
    s6: (C, DC) => ({
      position: "absolute",
      bottom: -1,
      right: -1,
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: C.gold,
      border: "2px solid " + DC.white,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 9
    }),
    s7: (DC, isMe) => ({
      fontSize: 10,
      color: DC.text2,
      fontWeight: 600,
      maxWidth: 60,
      textAlign: "center",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      cursor: isMe ? "default" : "pointer"
    })
  };

export const storyViewerStyles = {
    s1: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "#111",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    },
    s2: {
      fontSize: 60,
      marginBottom: 16
    },
    s3: {
      fontSize: 18,
      fontWeight: 800,
      color: "white",
      marginBottom: 8
    },
    s4: {
      fontSize: 13,
      color: "#aaa",
      marginBottom: 32
    },
    s5: C => ({
      padding: "13px 32px",
      background: C.primary,
      color: "white",
      border: "none",
      borderRadius: 12,
      fontSize: 15,
      fontWeight: 700,
      fontFamily: "inherit",
      cursor: "pointer"
    }),
    s6: {
      marginTop: 16,
      background: "none",
      border: "none",
      color: "#aaa",
      fontSize: 13,
      cursor: "pointer",
      fontFamily: "inherit"
    },
    s7: bg => ({
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "#" + bg,
      display: "flex",
      flexDirection: "column"
    }),
    s8: {
      display: "flex",
      gap: 3,
      padding: "12px 12px 0",
      position: "relative",
      zIndex: 2
    },
    s9: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      position: "relative",
      zIndex: 2
    },
    s10: user => ({
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.25)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
      fontWeight: 800,
      color: "white",
      flexShrink: 0,
      cursor: user.isMe ? "default" : "pointer"
    }),
    s11: {
      flex: 1
    },
    s12: {
      fontSize: 14,
      fontWeight: 800,
      color: "white"
    },
    s13: {
      fontSize: 11,
      color: "rgba(255,255,255,0.7)"
    },
    s14: {
      display: "flex",
      alignItems: "center",
      gap: 6
    },
    s15: {
      background: "rgba(0,0,0,0.35)",
      borderRadius: 12,
      padding: "3px 8px",
      fontSize: 11,
      color: "rgba(255,255,255,0.9)",
      display: "flex",
      alignItems: "center",
      gap: 3
    },
    s16: {
      background: "rgba(255,255,255,0.2)",
      border: "none",
      color: "white",
      fontSize: 18,
      cursor: "pointer",
      borderRadius: "50%",
      width: 30,
      height: 30,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    s17: {
      background: "rgba(255,0,0,0.3)",
      border: "none",
      color: "white",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      borderRadius: 20,
      padding: "5px 10px",
      marginLeft: 6,
      fontFamily: "inherit"
    },
    s18: {
      background: "none",
      border: "none",
      color: "white",
      fontSize: 22,
      cursor: "pointer",
      lineHeight: 1
    },
    s19: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: "90px",
      display: "flex",
      zIndex: 1
    },
    s20: {
      width: "35%",
      height: "100%"
    },
    s21: {
      width: "65%",
      height: "100%"
    },
    s22: {
      position: "absolute",
      inset: "20%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
      pointerEvents: "none"
    },
    s23: {
      textAlign: "center",
      padding: "0 24px"
    },
    s24: story => ({
      fontSize: story.text.length < 60 ? 22 : 18,
      fontWeight: 800,
      color: "white",
      lineHeight: 1.7,
      textShadow: "0 2px 8px rgba(0,0,0,0.5)",
      whiteSpace: "pre-line"
    }),
    s25: {
      padding: "0 16px 20px",
      position: "relative",
      marginTop: "auto",
      zIndex: 3
    },
    s26: {
      textAlign: "center",
      background: "rgba(255,255,255,0.2)",
      borderRadius: 20,
      padding: "12px",
      color: "white",
      fontSize: 13,
      fontWeight: 700
    },
    s27: {
      flex: 1,
      padding: "11px 14px",
      background: "rgba(255,255,255,0.15)",
      border: "1px solid rgba(255,255,255,0.3)",
      borderRadius: 22,
      color: "white",
      fontSize: 13,
      fontFamily: "inherit",
      outline: "none"
    },
    s28: (replyText, C) => ({
      padding: "11px 16px",
      background: replyText.trim() ? C.primary : "rgba(255,255,255,0.2)",
      border: "none",
      borderRadius: 22,
      color: "white",
      fontSize: 18,
      cursor: replyText.trim() ? "pointer" : "default"
    })
  };

export const followButtonStyles = {
    s1: (sm, following, DC, C) => ({
      padding: sm ? "5px 12px" : "8px 18px",
      borderRadius: 20,
      border: following ? "1.5px solid " + DC.border : "none",
      background: following ? DC.bg : C.primary,
      color: following ? DC.text2 : "white",
      fontSize: sm ? 11 : 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      gap: 4,
      transition: "all 0.2s",
      flexShrink: 0
    })
  };

export const storiesBarStyles = {
    s1: DC => ({
      display: "flex",
      gap: 12,
      padding: "10px 14px 6px",
      overflowX: "auto",
      scrollbarWidth: "none",
      background: DC.white,
      borderBottom: "1px solid " + DC.border
    }),
    s2: DC => ({
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "4px 8px",
      color: DC.text3,
      fontSize: 11
    })
  };


const normalizeFollowId = (item) => {
  if (!item) return null;
  if (typeof item === "string") return item;
  return item.seller_id || item.user_id || item.id || null;
};

const STORY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const getStoriesCacheKey = (userId) => `aqari_stories_cache_${userId || "guest"}`;

const getStoryExpiryMs = (story) => {
  if (!story) return null;

  if (typeof story.expiresAt === "number") return story.expiresAt;
  if (typeof story.expires_at === "number") return story.expires_at;

  const expiresAtValue = story.expiresAt || story.expires_at;
  if (typeof expiresAtValue === "string") {
    const parsed = new Date(expiresAtValue).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  const createdAtValue = story.createdAt || story.created_at;
  if (typeof createdAtValue === "number") return createdAtValue + STORY_CACHE_TTL_MS;
  if (typeof createdAtValue === "string") {
    const parsed = new Date(createdAtValue).getTime();
    if (!Number.isNaN(parsed)) return parsed + STORY_CACHE_TTL_MS;
  }

  return null;
};

const normalizeStoryId = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const getStoryCreatedAtMs = (story) => {
  if (!story) return 0;
  if (typeof story.createdAt === "number") return story.createdAt;
  if (typeof story.created_at === "number") return story.created_at;

  const value = story.createdAt || story.created_at;
  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
};

const buildViewedUserMarker = (storyUser) => {
  if (!storyUser?.id || !Array.isArray(storyUser.stories) || !storyUser.stories.length) return null;

  const latestStory = storyUser.stories.reduce((latest, current) => {
    return getStoryCreatedAtMs(current) >= getStoryCreatedAtMs(latest) ? current : latest;
  }, storyUser.stories[0]);

  return {
    lastStoryAt: getStoryCreatedAtMs(latestStory),
    expiresAt: getStoryExpiryMs(latestStory) || 0,
    seenAt: Date.now()
  };
};

const pruneStoriesCache = (payload) => {
  const now = Date.now();
  if (!Array.isArray(payload)) return [];

  return payload
    .filter(user => user && user.id)
    .map(user => ({
      ...user,
      stories: Array.isArray(user.stories)
        ? user.stories
            .map(story => ({
              ...story,
              expiresAt: getStoryExpiryMs(story) || now + STORY_CACHE_TTL_MS
            }))
            .filter(story => story.expiresAt > now)
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        : []
    }))
    .filter(user => user.isMe || (user.stories && user.stories.length > 0));
};

function StoryBubble({
  user,
  onView,
  onAdd,
  onProfile,
  onOpenMark,
  DC,
  viewedIds = [],
  viewedUsers = {}
}) {
  const sx = storyBubbleStyles;

  if (!DC) DC = C;

  const hasStories = user.stories && user.stories.length > 0;
  const isMe = user.isMe;
  const normalizedViewedIds = useMemo(
    () => new Set((viewedIds || []).map(id => normalizeStoryId(id)).filter(Boolean)),
    [viewedIds]
  );
  const latestStoryAt = useMemo(() => {
    if (!hasStories) return 0;
    return user.stories.reduce((max, story) => Math.max(max, getStoryCreatedAtMs(story)), 0);
  }, [hasStories, user.stories]);
  const userViewedMarker = user?.id ? viewedUsers?.[user.id] : null;
  const isViewedByUserMarker = Boolean(
    hasStories &&
    userViewedMarker &&
    (!userViewedMarker.expiresAt || userViewedMarker.expiresAt > Date.now()) &&
    latestStoryAt > 0 &&
    (userViewedMarker.lastStoryAt || 0) >= latestStoryAt
  );
  const isViewedByIds = Boolean(
    hasStories && user.stories.every((st) => normalizedViewedIds.has(normalizeStoryId(st.id)))
  );
  const isViewed = isViewedByUserMarker || isViewedByIds;

  const openStory = () => {
    if (isMe && !hasStories) {
      onAdd && onAdd();
    } else {
      if (hasStories) onOpenMark && onOpenMark(user);
      onView && onView(user);
    }
  };

  return <div onClick={openStory} style={sx.s1}>
      <div style={sx.s2} onDoubleClick={e => {
      if (isMe || !onProfile) return;
      e.stopPropagation();
      onProfile(user);
    }}>
        <div style={sx.s3(hasStories, isViewed, isMe, DC, C)}>
          <div style={sx.s4(DC, C)}>
            {user.init}
          </div>
        </div>

        {isMe && <div style={sx.s5(C, DC)}>
            +
          </div>}

        {user.accountType === "office" && <div style={sx.s6(C, DC)}>
            🏢
          </div>}
      </div>

      <span onClick={e => {
      if (isMe || !onProfile) return;
      e.stopPropagation();
      onProfile(user);
    }} style={sx.s7(DC, isMe)}>
        {isMe ? "حالتي" : user.name.split(" ")[0]}
      </span>
    </div>;
}
function StoryViewer({
  users,
  startIndex,
  onClose,
  onAddStory,
  onDelete,
  DC,
  onReply,
  onViewProfile,
  onViewed
}) {
  const sx = storyViewerStyles;
  if (!DC) DC = C;
  const [userIdx, setUserIdx] = useState(startIndex || 0);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);
  const countedViewIdsRef = useRef(new Set());
  const user = users[userIdx];
  const story = user?.stories?.[storyIdx];
  const total = user?.stories?.length || 0;
  const DURATION = 5000;

  useEffect(() => {
    if (!story?.id || user?.isMe) return;

    onViewed?.(story, user);

    if (countedViewIdsRef.current.has(story.id)) return;
    countedViewIdsRef.current.add(story.id);

    incrementStoryViews(story.id, story.views || 0).catch(() => {
      countedViewIdsRef.current.delete(story.id);
    });
  }, [story?.id, user?.isMe, onViewed, story?.views]);

  const handleDelete = async () => {
    if (!story?.id) return;
    setDeleting(true);
    await deleteStory(story.id);
    setDeleting(false);
    if (onDelete) onDelete();
    if (total <= 1) onClose();else goNext();
  };
  useEffect(() => {
    setProgress(0);
    if (!story || paused) return;
    const step = 50;
    const inc = step / DURATION * 100;
    const iv = setInterval(() => {
      setProgress(p => {
        if (p + inc >= 100) {
          clearInterval(iv);
          goNext();
          return 100;
        }
        return p + inc;
      });
    }, step);
    return () => clearInterval(iv);
  }, [story?.id, paused]);
  const goNext = () => {
    setReplyText("");
    setReplySent(false);
    if (storyIdx < total - 1) {
      setStoryIdx(s => s + 1);
      setProgress(0);
    } else if (userIdx < (users?.length || 1) - 1) {
      setUserIdx(u => u + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  };
  const goPrev = () => {
    if (storyIdx > 0) {
      setStoryIdx(s => s - 1);
      setProgress(0);
    } else if (userIdx > 0) {
      setUserIdx(u => u - 1);
      const prevUserStories = users[userIdx - 1]?.stories || [];
      setStoryIdx(Math.max(0, prevUserStories.length - 1));
      setProgress(0);
    }
  };
  if (!user) {
    onClose();
    return null;
  }
  if (!story) {
    return <div style={sx.s1}>
        <div style={sx.s2}>📸</div>
        <div style={sx.s3}>
          لا توجد حالة بعد
        </div>
        <div style={sx.s4}>
          أضف حالتك الأولى الآن
        </div>

        <button onClick={() => {
        onClose();
        onAddStory();
      }} style={sx.s5(C)}>
          ＋ إضافة حالة
        </button>

        <button onClick={onClose} style={sx.s6}>
          إغلاق
        </button>
      </div>;
  }
  const bg = story.bg || "1A4A2E";
  return <div style={sx.s7(bg)} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
      <div style={sx.s8}>
        {(user?.stories || []).map((_, i) => {
        const barSx = {
          s1: {
            flex: 1,
            height: 3,
            background: "rgba(255,255,255,0.3)",
            borderRadius: 2,
            overflow: "hidden"
          },
          s2: (i, storyIdx, progress) => ({
            height: "100%",
            borderRadius: 2,
            background: "white",
            width: i < storyIdx ? "100%" : i === storyIdx ? progress + "%" : "0%"
          })
        };
        return <div key={i} style={barSx.s1}>
            <div style={barSx.s2(i, storyIdx, progress)} />
          </div>;
      })}
      </div>

      <div style={sx.s9}>
        <div onClick={() => !user.isMe && onViewProfile && onViewProfile(user)} style={sx.s10(user)}>
          {user.init}
        </div>

        <div style={sx.s11} onClick={() => !user.isMe && onViewProfile && onViewProfile(user)}>
          <div style={sx.s12}>{user.name}</div>
          <div style={sx.s13}>
            {timeAgo(story.createdAt)}
          </div>
        </div>

        {user.isMe && <div style={sx.s14}>
            <div style={sx.s15}>
              👁 {story.views || 0}
            </div>

            <button onClick={() => {
          onClose();
          onAddStory();
        }} style={sx.s16}>
              ＋
            </button>

            <button onClick={handleDelete} disabled={deleting} style={sx.s17}>
              {deleting ? "..." : "🗑 حذف"}
            </button>
          </div>}

        <button onClick={onClose} style={sx.s18}>
          ✕
        </button>
      </div>

      <div style={sx.s19}>
        <div onClick={goPrev} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} onTouchStart={e => {
        e.stopPropagation();
        setPaused(true);
      }} onTouchEnd={e => {
        e.stopPropagation();
        setPaused(false);
      }} style={sx.s20} />

        <div onClick={goNext} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} onTouchStart={e => {
        e.stopPropagation();
        setPaused(true);
      }} onTouchEnd={e => {
        e.stopPropagation();
        setPaused(false);
      }} style={sx.s21} />
      </div>

      <div style={sx.s22}>
        <div style={sx.s23}>
          <div style={sx.s24(story)}>
            {story.text}
          </div>
        </div>
      </div>

      {!user.isMe && <div style={sx.s25}>
          {replySent ? <div style={sx.s26}>
              ✅ تم إرسال الرد
            </div> : <div style={S.gap8}>
              <input value={replyText} onChange={e => {
          e.stopPropagation();
          setReplyText(e.target.value);
        }} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()} placeholder="رد على الحالة..." style={sx.s27} />

              <button onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onClick={async e => {
          e.stopPropagation();
          if (!replyText.trim() || !onReply) return;
          await onReply(user, story, replyText.trim());
          setReplyText("");
          setReplySent(true);
          setTimeout(() => setReplySent(false), 2500);
        }} style={sx.s28(replyText, C)}>
                ➤
              </button>
            </div>}
        </div>}
    </div>;
}
function FollowButton({
  sellerId,
  isFollowing = () => false,
  onToggle,
  size = "md",
  DC
}) {
  const sx = followButtonStyles;
  if (!DC) DC = C;
  if (!sellerId) return null;
  const following = typeof isFollowing === "function" ? isFollowing(sellerId) : false;
  const sm = size === "sm";
  const isAdmin = sellerId === "37c6a844-36cd-4d0e-9ad4-1303d6a76508";
  if (isAdmin && following) return null;
  return <button onClick={e => {
    e.stopPropagation();
    onToggle(sellerId);
  }} style={sx.s1(sm, following, DC, C)}>
      {following ? "✓ تتابعه" : "＋ متابعة"}
    </button>;
}
const mergeFetchedStories = ({
  previous = [],
  incoming = [],
  userId,
  followIds = new Set()
}) => {
  const next = pruneStoriesCache(incoming);
  const prev = pruneStoriesCache(previous);

  if (!prev.length) return next;

  const prevMap = new Map(prev.map(item => [item.id, item]));
  next.forEach(item => {
    prevMap.set(item.id, item);
  });

  const merged = [];

  const me = prevMap.get(userId) || next.find(item => item.id === userId);
  if (me) merged.push(me);

  followIds.forEach(id => {
    if (!id || id === userId) return;
    const item = prevMap.get(id);
    if (item?.stories?.length) merged.push(item);
  });

  prev.forEach(item => {
    if (!item || item.id === userId || followIds.has(item.id)) return;
    if (item.stories?.length) merged.push(item);
  });

  next.forEach(item => {
    if (!item || merged.some(existing => existing.id === item.id)) return;
    if (item.id === userId || item.stories?.length) merged.push(item);
  });

  return pruneStoriesCache(merged);
};

function StoriesBar({
  follows = [],
  onView,
  onAdd,
  onProfile,
  onStoriesLoaded,
  DC,
  user,
  viewedIds = [],
  viewedUsers = {}
}) {
  const sx = storiesBarStyles;
  if (!DC) DC = C;
  const safeFollowIds = useMemo(() => new Set((follows || []).map(normalizeFollowId).filter(Boolean)), [follows]);
  const [sbStories, setSbStories] = useState(() => {
    try {
      const raw = localStorage.getItem(getStoriesCacheKey(user?.id));
      return pruneStoriesCache(raw ? JSON.parse(raw) : []);
    } catch {
      return [];
    }
  });
  const sbStoriesRef = useRef(sbStories);
  const [optimisticViewedIds, setOptimisticViewedIds] = useState(() => new Set());
  const [optimisticViewedUsers, setOptimisticViewedUsers] = useState({});

  useEffect(() => {
    sbStoriesRef.current = sbStories;
    window._liveStories = sbStories;
    if (onStoriesLoaded) onStoriesLoaded(sbStories);
  }, [sbStories, onStoriesLoaded]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStoriesCacheKey(user?.id));
      const cached = pruneStoriesCache(raw ? JSON.parse(raw) : []);
      setSbStories(cached);
    } catch {
      setSbStories([]);
    }
  }, [user?.id]);

  const loadStories = async () => {
    const followedIds = new Set(safeFollowIds);
    if (user?.id) followedIds.add(user.id);

    try {
      const data = await fetchStories([...followedIds], user?.id);
      const profMap = {};
      (data || []).forEach(st => {
        if (st?.profiles) profMap[st.user_id] = st.profiles;
      });

      const grouped = {};
      (data || []).forEach(st => {
        const uid = st.user_id;
        if (!uid || !followedIds.has(uid)) return;
        const prof = profMap[uid] || {};
        if (!grouped[uid]) {
          grouped[uid] = {
            id: uid,
            name: prof.name || "مستخدم",
            init: (prof.name || "م")[0],
            accountType: prof.account_type || "individual",
            isMe: uid === user?.id,
            stories: []
          };
        }
        grouped[uid].stories.push({
          id: st.id,
          type: st.type,
          text: st.text,
          bg: st.bg,
          createdAt: new Date(st.created_at).getTime(),
          expiresAt: getStoryExpiryMs(st),
          views: st.views || 0
        });
      });

      const incoming = pruneStoriesCache(Object.values(grouped));
      const result = mergeFetchedStories({
        previous: sbStoriesRef.current,
        incoming,
        userId: user?.id,
        followIds: safeFollowIds
      });

      try {
        localStorage.setItem(getStoriesCacheKey(user?.id), JSON.stringify(result));
      } catch {}

      setSbStories(result);
    } catch {
      setSbStories(pruneStoriesCache(sbStoriesRef.current));
    }
  };

  const followsKey = useMemo(() => (follows || []).map(normalizeFollowId).filter(Boolean).sort().join(","), [follows]);

  useEffect(() => {
    loadStories();
    window._reloadStories = loadStories;
    return () => {
      window._reloadStories = null;
    };
  }, [user?.id, followsKey]);

  useEffect(() => {
    setOptimisticViewedIds(new Set((viewedIds || []).map(id => normalizeStoryId(id)).filter(Boolean)));
  }, [viewedIds]);

  useEffect(() => {
    setOptimisticViewedUsers(viewedUsers || {});
  }, [viewedUsers]);

  const handleBubbleOpen = (storyUser) => {
    if (!storyUser?.stories?.length) return;

    const storyIds = storyUser.stories.map(story => normalizeStoryId(story?.id)).filter(Boolean);
    const marker = buildViewedUserMarker(storyUser);

    if (storyIds.length) {
      setOptimisticViewedIds(prev => {
        const next = new Set(prev);
        storyIds.forEach(id => next.add(id));
        return next;
      });
    }

    if (marker && storyUser?.id) {
      setOptimisticViewedUsers(prev => ({
        ...prev,
        [storyUser.id]: marker
      }));
    }
  };

  const combinedViewedIds = useMemo(() => {
    const merged = new Set((viewedIds || []).map(id => normalizeStoryId(id)).filter(Boolean));
    optimisticViewedIds.forEach(id => merged.add(id));
    return Array.from(merged);
  }, [viewedIds, optimisticViewedIds]);

  const combinedViewedUsers = useMemo(() => ({
    ...(viewedUsers || {}),
    ...(optimisticViewedUsers || {})
  }), [viewedUsers, optimisticViewedUsers]);

  const allStories = pruneStoriesCache(sbStories);
  const me = allStories.find(u => u.isMe);
  const followed = allStories.filter(u => !u.isMe && safeFollowIds.has(u.id) && u.stories.length > 0);
  const others = allStories.filter(u => !u.isMe && !safeFollowIds.has(u.id) && u.stories.length > 0);
  const allVisible = [...followed, ...others];
  if (!user) return null;
  return <div style={sx.s1(DC)}>
      <StoryBubble user={me || {
      id: user.id,
      name: user.name || "أنا",
      init: (user.name || "أ")[0],
      isMe: true,
      stories: []
    }} onView={onView} onAdd={onAdd} onProfile={onProfile} onOpenMark={handleBubbleOpen} DC={DC} viewedIds={combinedViewedIds} viewedUsers={combinedViewedUsers} />

      {allVisible.map(u => <StoryBubble key={u.id} user={u} onView={onView} onAdd={onAdd} onProfile={onProfile} onOpenMark={handleBubbleOpen} DC={DC} viewedIds={combinedViewedIds} viewedUsers={combinedViewedUsers} />)}

      {followed.length === 0 && safeFollowIds.size === 0 && <div style={sx.s2(DC)}>
          👆 تابع بائعين لترى حالاتهم هنا
        </div>}
    </div>;
}

export { StoryBubble, StoryViewer, FollowButton, StoriesBar };
