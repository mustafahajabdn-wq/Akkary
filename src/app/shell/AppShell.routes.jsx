// تعريف جميع مسارات التطبيق — أُخرجت من AppShell للحفاظ على وضوح الكود
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage.jsx";
import TermsPage from "../pages/TermsPage.jsx";
import HomePage from "../pages/HomePage.jsx";
import DetailPage from "../pages/DetailPage.jsx";
import SearchPage from "../pages/SearchPage.jsx";
import AddChoicePage from "../pages/AddChoicePage.jsx";
import WantPage from "../pages/WantPage.jsx";
import AddPage from "../pages/AddPage.jsx";
import FavsPage from "../pages/FavsPage.jsx";
import MessagesPage from "../pages/MessagesPage.jsx";
import ChatPage from "../pages/ChatPage.jsx";
import SellerProfilePage from "../pages/SellerProfilePage.jsx";
import ProfilePage from "../pages/ProfilePage.jsx";
import FollowingPage from "../pages/FollowingPage.jsx";
import MyListingsPage from "../pages/MyListingsPage.jsx";
import LoginHistoryPage from "../pages/LoginHistoryPage.jsx";
import SavedSearchesPage from "../pages/SavedSearchesPage.jsx";
import MapViewPage from "../pages/MapViewPage.jsx";
import NotificationsPage from "../pages/NotificationsPage.jsx";
import SettingsPage from "../pages/SettingsPage.jsx";
import HelpPage from "../pages/HelpPage.jsx";
import AboutPage from "../pages/AboutPage.jsx";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage.jsx";
import AdDetailPage from "../pages/AdDetailPage.jsx";
import FeaturedAdPage from "../pages/FeaturedAdPage.jsx";
import BlockedPage from "../pages/BlockedPage.jsx";
import SellerProfileDynamic from "../components/SellerProfileDynamic.jsx";
import PageLoader from "../../shared/components/ui/PageLoader.jsx";
import { ProfileAdminMenuBoundary } from "./adminBoundary.jsx";
import { legacyAdminRedirects } from "../../shared/constants/adminRoutes.js";
import { fetchMyListings } from "../services/userService.js";

export default function AppRoutes({
  common,
  user,
  setUser,
  setPage,
  showInstall,
  install,
  dismissInstall,
  detail,
  setDetail,
  detailPrevPage,
  setDetailPrevPage,
  openDetail,
  cacheDetail,
  chat,
  setChat,
  seller,
  setSeller,
  selectedAd,
  setSelectedAd,
  targetUser,
  favs,
  toggleFav,
  follows,
  toggleFollow,
  isFollowing,
  dark,
  setDark,
  setLang,
  sbListings,
  hasMoreListings,
  loadMoreListings,
  loadingMore,
  loadListings,
  reloadListingsRef,
  myListings,
  setMyListings,
  unreadNotifs,
  setUnreadNotifs,
  isOffline,
  shamcash,
  updateShamcash,
  setShowDeniedNotif,
  AdminApp,
  Protected,
}) {
  return (
    <Routes>
      <Route path="/home" element={<Navigate to="/" replace />} />

      <Route path="/login" element={<LoginPage {...common} setUser={setUser} />} />

      <Route path="/terms" element={<TermsPage {...common} />} />

      <Route path="/privacy" element={<PrivacyPolicyPage {...common} />} />

      <Route
        path="/"
        element={
          <HomePage
            {...common}
            showInstall={showInstall}
            onInstall={install}
            onDismissInstall={dismissInstall}
            setSelectedAd={setSelectedAd}
            setDetail={setDetail}
            setDetailPrevPage={setDetailPrevPage}
            openDetail={openDetail}
            setSeller={setSeller}
            favs={favs}
            toggleFav={toggleFav}
            follows={follows}
            toggleFollow={toggleFollow}
            isFollowing={isFollowing}
            dark={dark}
            setDark={setDark}
            sbListings={sbListings}
            hasMoreListings={hasMoreListings}
            loadMoreListings={loadMoreListings}
            loadListings={loadListings}
            loadingMore={loadingMore}
            unreadNotifs={unreadNotifs}
            setUnreadNotifs={setUnreadNotifs}
            isOffline={isOffline}
          />
        }
      />

      <Route
        path="/listing/:id"
        element={
          <DetailPage
            {...common}
            cacheDetail={cacheDetail}
            item={detail}
            prevPage={detailPrevPage}
            setChat={setChat}
            favs={favs}
            toggleFav={toggleFav}
            setSeller={setSeller}
            follows={follows}
            toggleFollow={toggleFollow}
            isFollowing={isFollowing}
          />
        }
      />

      <Route
        path="/listing"
        element={
          <DetailPage
            {...common}
            cacheDetail={cacheDetail}
            item={detail}
            prevPage={detailPrevPage}
            setChat={setChat}
            favs={favs}
            toggleFav={toggleFav}
            setSeller={setSeller}
            follows={follows}
            toggleFollow={toggleFollow}
            isFollowing={isFollowing}
          />
        }
      />

      <Route
        path="/search"
        element={
          <SearchPage
            {...common}
            setDetail={setDetail}
            setDetailPrevPage={setDetailPrevPage}
            openDetail={openDetail}
            favs={favs}
            toggleFav={toggleFav}
          />
        }
      />

      <Route
        path="/real-estate/:city"
        element={
          <SearchPage
            {...common}
            setDetail={setDetail}
            setDetailPrevPage={setDetailPrevPage}
            openDetail={openDetail}
            favs={favs}
            toggleFav={toggleFav}
          />
        }
      />

      <Route
        path="/real-estate/:city/:district"
        element={
          <SearchPage
            {...common}
            setDetail={setDetail}
            setDetailPrevPage={setDetailPrevPage}
            openDetail={openDetail}
            favs={favs}
            toggleFav={toggleFav}
          />
        }
      />

      <Route path="/add-choice" element={<Protected element={<AddChoicePage setPage={setPage} user={user} />} />} />

      <Route path="/wanted" element={<Protected element={<WantPage {...common} />} />} />

      <Route
        path="/add-listing"
        element={
          <Protected
            element={
              <AddPage
                {...common}
                onPublished={() => {
                  reloadListingsRef.current();

                  if (user?.id) {
                    fetchMyListings(user.id).then((listings) => {
                      if (listings.length) setMyListings(listings);
                    });
                  }
                }}
              />
            }
          />
        }
      />

      <Route
        path="/favorites"
        element={
          <Protected
            element={
              <FavsPage
                {...common}
                favs={favs}
                setDetail={setDetail}
                setDetailPrevPage={setDetailPrevPage}
                openDetail={openDetail}
                toggleFav={toggleFav}
                allListings={sbListings}
              />
            }
          />
        }
      />

      <Route
        path="/messages"
        element={<Protected element={<MessagesPage {...common} setChat={setChat} setSeller={setSeller} />} />}
      />

      <Route
        path="/chat"
        element={<Protected element={<ChatPage {...common} conv={chat} setSeller={setSeller} />} />}
      />

      <Route
        path="/chat/:id"
        element={<Protected element={<ChatPage {...common} conv={chat} setSeller={setSeller} />} />}
      />

      <Route
        path="/seller/:userId"
        element={
          <SellerProfileDynamic
            common={common}
            sbListings={sbListings}
            setChat={setChat}
            favs={favs}
            toggleFav={toggleFav}
            follows={follows}
            toggleFollow={toggleFollow}
            isFollowing={isFollowing}
          />
        }
      />

      <Route
        path="/seller"
        element={
          <SellerProfilePage
            {...common}
            seller={seller}
            setChat={setChat}
            setDetailPrevPage={setDetailPrevPage}
            prevPage={seller?.prevPage}
            setDetail={setDetail}
            favs={favs}
            toggleFav={toggleFav}
            follows={follows}
            toggleFollow={toggleFollow}
            isFollowing={isFollowing}
            sbListings={sbListings}
          />
        }
      />

      <Route
        path="/profile"
        element={
          <Protected
            element={
              <ProfilePage
                {...common}
                setPage={(page) => setPage(page === "splash" ? "help" : page)}
                onShowDeniedNotif={() => setShowDeniedNotif(true)}
                dark={dark}
                setDark={setDark}
                follows={follows}
                toggleFollow={toggleFollow}
                isFollowing={isFollowing}
                shamcash={shamcash}
                setUser={setUser}
                myListings={myListings}
                favs={favs}
                onSignOut={loadListings}
                renderAdminMenu={(props) => <ProfileAdminMenuBoundary {...props} />}
              />
            }
          />
        }
      />

      <Route
        path="/following"
        element={<Protected element={<FollowingPage {...common} follows={follows} toggleFollow={toggleFollow} />} />}
      />

      <Route
        path="/my-listings"
        element={
          <Protected
            element={
              <MyListingsPage
                {...common}
                myListings={myListings}
                setMyListings={setMyListings}
                setDetail={setDetail}
                setDetailPrevPage={setDetailPrevPage}
                openDetail={openDetail}
              />
            }
          />
        }
      />

      <Route path="/login-history" element={<Protected element={<LoginHistoryPage {...common} />} />} />

      <Route path="/saved-searches" element={<Protected element={<SavedSearchesPage {...common} />} />} />

      <Route
        path="/map"
        element={
          <MapViewPage
            {...common}
            setDetail={setDetail}
            setDetailPrevPage={setDetailPrevPage}
            openDetail={openDetail}
            sbListings={sbListings}
          />
        }
      />

      <Route
        path="/notifications"
        element={
          <Protected
            element={
              <NotificationsPage
                {...common}
                setChat={setChat}
                setUnreadNotifs={setUnreadNotifs}
                setDetail={setDetail}
                setDetailPrevPage={setDetailPrevPage}
                openDetail={openDetail}
              />
            }
          />
        }
      />

      <Route path="/ad" element={<AdDetailPage {...common} ad={selectedAd} prevPage="home" setSeller={setSeller} />} />

      <Route path="/ad/:id" element={<AdDetailPage {...common} ad={selectedAd} prevPage="home" setSeller={setSeller} />} />

      <Route
        path="/settings"
        element={
          <Protected
            element={
              <SettingsPage
                {...common}
                dark={dark}
                setDark={setDark}
                setLang={setLang}
                shamcash={shamcash}
                setShamcash={updateShamcash}
                setUser={setUser}
              />
            }
          />
        }
      />

      <Route path="/help" element={<HelpPage {...common} />} />

      <Route path="/about" element={<AboutPage {...common} />} />

      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<PageLoader />}>
            <AdminApp
              common={common}
              targetUser={targetUser}
              setDetail={setDetail}
              setDetailPrevPage={setDetailPrevPage}
              openDetail={openDetail}
              reloadListingsRef={reloadListingsRef}
            />
          </Suspense>
        }
      />

      {legacyAdminRedirects.map(({ from, to }) => (
        <Route key={from} path={from} element={<Navigate to={to} replace />} />
      ))}

      <Route path="/featured-ad" element={<Protected element={<FeaturedAdPage {...common} />} />} />

      <Route path="/blocked" element={<Protected element={<BlockedPage {...common} />} />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
