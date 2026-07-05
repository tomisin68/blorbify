import { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase.js";
import AuthScreen from "./AuthScreen.jsx";
import OnboardingScreen from "./OnboardingScreen.jsx";
import Dashboard from "./Dashboard.jsx";
import Storefront from "./Storefront.jsx";
import PaymentSuccess from "./PaymentSuccess.jsx";
import LandingPage from "./LandingPage.jsx";

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0F1518", color: "#F6F8F1", fontFamily: "Raleway, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.15)", borderTopColor: "#AFFF00", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
        <div>Loading your workspace…</div>
      </div>
    </div>
  );
}

function StorefrontRoute() {
  const { storeSlug } = useParams();
  return <Storefront slug={storeSlug} />;
}

function AppShell() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const loadUserProfile = useCallback(async (user) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const profile = userSnap.exists() ? userSnap.data() : {};
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error("Failed to load user profile:", error);
      setUserProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      setCurrentUser(user);
      if (!user) {
        setUserProfile(null);
        setAuthLoading(false);
        return;
      }

      try {
        await loadUserProfile(user);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  const handleAuthSuccess = useCallback(async (user = auth.currentUser) => {
    if (!user) return;

    setAuthLoading(true);
    setCurrentUser(user);
    try {
      const profile = await loadUserProfile(user);
      navigate(profile?.onboardingCompleted ? "/dashboard" : "/onboarding");
    } finally {
      setAuthLoading(false);
    }
  }, [loadUserProfile, navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      navigate("/");
    }
  }, [navigate]);

  const handleOnboardingComplete = useCallback((onboardingData) => {
    setUserProfile((prev) => ({
      ...(prev || {}),
      ...(onboardingData || {}),
      onboardingCompleted: true,
      onboardingData: onboardingData || prev?.onboardingData,
    }));
    navigate("/dashboard");
  }, [navigate]);

  const onboardingCompleted = Boolean(userProfile?.onboardingCompleted);
  const needsEmailVerification = Boolean(currentUser) && userProfile?.emailVerified === false;
  const postAuthPath = needsEmailVerification ? "/verify-email" : onboardingCompleted ? "/dashboard" : "/onboarding";

  return (
    <Routes>
      <Route path="/payment/success" element={<PaymentSuccess />} />

      <Route
        path="/"
        element={
          authLoading ? (
            <LoadingScreen />
          ) : currentUser ? (
            <Navigate to={postAuthPath} replace />
          ) : (
            <LandingPage />
          )
        }
      />

      <Route
        path="/login"
        element={
          authLoading ? (
            <LoadingScreen />
          ) : currentUser ? (
            <Navigate to={postAuthPath} replace />
          ) : (
            <AuthScreen initialMode="login" onSuccess={handleAuthSuccess} />
          )
        }
      />

      <Route
        path="/signup"
        element={
          authLoading ? (
            <LoadingScreen />
          ) : currentUser ? (
            <Navigate to={postAuthPath} replace />
          ) : (
            <AuthScreen initialMode="signup" onSuccess={handleAuthSuccess} />
          )
        }
      />

      <Route
        path="/verify-email"
        element={
          authLoading ? (
            <LoadingScreen />
          ) : !currentUser ? (
            <Navigate to="/login" replace />
          ) : !needsEmailVerification ? (
            <Navigate to={onboardingCompleted ? "/dashboard" : "/onboarding"} replace />
          ) : (
            <AuthScreen
              initialMode="verify"
              verifyEmail={currentUser.email}
              onSuccess={handleAuthSuccess}
              onCancel={handleLogout}
            />
          )
        }
      />

      <Route
        path="/onboarding"
        element={
          authLoading ? (
            <LoadingScreen />
          ) : !currentUser ? (
            <Navigate to="/login" replace />
          ) : needsEmailVerification ? (
            <Navigate to="/verify-email" replace />
          ) : (
            <OnboardingScreen
              userId={currentUser.uid}
              userProfile={userProfile}
              onComplete={handleOnboardingComplete}
            />
          )
        }
      />

      {["/dashboard", "/dashboard/:tab", "/dashboard/orders/:orderId"].map((path) => (
        <Route
          key={path}
          path={path}
          element={
            authLoading ? (
              <LoadingScreen />
            ) : !currentUser ? (
              <Navigate to="/login" replace />
            ) : needsEmailVerification ? (
              <Navigate to="/verify-email" replace />
            ) : !onboardingCompleted ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Dashboard user={currentUser} userProfile={userProfile} onLogout={handleLogout} />
            )
          }
        />
      ))}

      <Route path="/:storeSlug" element={<StorefrontRoute />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
