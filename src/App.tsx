import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CreateAgentPage = lazy(() => import("./pages/CreateAgentPage"));
const AgentDetailPage = lazy(() => import("./pages/AgentDetailPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/create-agent" element={<ProtectedRoute><CreateAgentPage /></ProtectedRoute>} />
          <Route path="/agent/:id" element={<ProtectedRoute><AgentDetailPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </>
    </Suspense>
  );
}

export default App;