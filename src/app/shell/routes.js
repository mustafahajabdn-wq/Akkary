// مسارات التطبيق العام + مفاتيح مسارات الإدارة من ملف shared آمن.
// لا يوجد هنا أي import من src/admin حتى تبقى الإدارة قابلة للإزالة.
import { matchPath } from "react-router-dom";
import { adminDynamicRoutes, adminRoutePaths } from "../../shared/constants/adminRoutes.js";

export const publicRoutePaths = {
  splash: "/",
  login: "/login",
  terms: "/terms",
  privacy: "/privacy",
  home: "/",
  detail: "/listing",
  search: "/search",
  addChoice: "/add-choice",
  want: "/wanted",
  add: "/add-listing",
  mediaUpload: "/media-upload",
  favs: "/favorites",
  messages: "/messages",
  chat: "/chat",
  sellerProfile: "/seller",
  profile: "/profile",
  following: "/following",
  myListings: "/my-listings",
  loginHistory: "/login-history",
  savedSearches: "/saved-searches",
  mapView: "/map",
  notifications: "/notifications",
  settings: "/settings",
  help: "/help",
  adDetail: "/ad",
  featuredAd: "/featured-ad",
  blocked: "/blocked",
};

export const pageToRoute = {
  ...publicRoutePaths,
  ...adminRoutePaths,
};

const routeToPage = Object.fromEntries(
  Object.entries(pageToRoute).map(([key, route]) => [route, key])
);

const dynamicRoutes = [
  { pattern: "/listing/:id", page: "detail" },
  { pattern: "/seller/:id", page: "sellerProfile" },
  { pattern: "/chat/:id", page: "chat" },
  { pattern: "/ad/:id", page: "adDetail" },
  ...adminDynamicRoutes,
];

export function getPageFromPath(pathname) {
  if (routeToPage[pathname]) return routeToPage[pathname];

  const match = dynamicRoutes.find(({ pattern }) =>
    matchPath(pattern, pathname)
  );

  return match?.page || "splash";
}
