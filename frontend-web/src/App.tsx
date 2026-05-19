import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CourseCreatePage from "./pages/CourseCreatePage";
import ExerciseDetailPage from "./pages/ExerciseDetailPage";
import ExerciseCreatePage from "./pages/ExerciseCreatePage";
import SubmissionsPage from "./pages/SubmissionsPage";
import GradingPage from "./pages/GradingPage";
import MyResultsPage from "./pages/MyResultsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import PendingGradesPage from "./pages/PendingGradesPage";

export default function App() {
  return (
    // AuthProvider must be inside BrowserRouter so Clerk's useAuth hooks work
    // (ClerkProvider is already above BrowserRouter in main.tsx)
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login/*" element={<LoginPage />} />
          <Route path="/register/*" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/new" element={<CourseCreatePage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route
                path="/courses/:courseId/exercises/new"
                element={<ExerciseCreatePage />}
              />
              <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
              <Route
                path="/exercises/:exerciseId/submissions"
                element={<SubmissionsPage />}
              />
              <Route path="/submissions/:id/grade" element={<GradingPage />} />
              <Route
                path="/submissions/pending"
                element={<PendingGradesPage />}
              />
              <Route path="/results" element={<MyResultsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
