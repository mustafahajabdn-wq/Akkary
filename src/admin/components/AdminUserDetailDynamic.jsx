import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AdminUserDetail from "../pages/AdminUserDetail.jsx";
import PageLoader from "../../shared/components/ui/PageLoader.jsx";
import { fetchAdminProfileById } from "../services/adminService.js";

export default function AdminUserDetailDynamic(props) {
  const { userId } = useParams();
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetchAdminProfileById(userId)
      .then((data) => { if (data) setTargetUser(data); })
      .catch(console.error);
  }, [userId]);

  if (!targetUser) return <PageLoader />;

  return <AdminUserDetail {...props} targetUser={targetUser} />;
}
