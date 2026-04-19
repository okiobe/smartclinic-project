import { createBrowserRouter, Navigate } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import PortalLayout from "../layouts/PortalLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";

import Home from "../pages/public/Accueil";
import Login from "../pages/public/Connexion";
import Booking from "../pages/public/Reservation";
import Register from "../pages/public/Register";

import PatientDashboard from "../pages/patient/TableauDeBord";
import PatientAppointments from "../pages/patient/RendezVous";
import PatientMedicalRecord from "../pages/patient/DossierMedical";
import PatientProfile from "../pages/patient/Profil";

import PractitionerDashboard from "../pages/praticien/TableauDeBord";
import PractitionerSchedule from "../pages/praticien/Agenda";
import PractitionerToday from "../pages/praticien/RendezVousJour";
import PractitionerAvailability from "../pages/praticien/Disponibilites";

import AdminDashboard from "../pages/admin/TableauDeBord";
import AdminServices from "../pages/admin/Services";
import AdminPractitioners from "../pages/admin/Praticiens";
import AdminPractitionerAvailabilities from "../pages/admin/PraticienDisponibilites";
import AdminPatients from "../pages/admin/Patients";
import AdminSettings from "../pages/admin/Parametres";
import PlanningPersonnel from "../pages/admin/PlanningPersonnel";
import AdminAudit from "../pages/admin/Audit";

import Forbidden403 from "../pages/system/Forbidden403";
import NotFound404 from "../pages/system/NotFound404";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <Home /> },
      {
        path: "/booking",
        element: (
          <ProtectedRoute roles={["PATIENT"]}>
            <Booking />
          </ProtectedRoute>
        ),
      },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },

  {
    element: <PortalLayout />,
    children: [
      {
        path: "/patient",
        element: (
          <ProtectedRoute roles={["PATIENT"]}>
            <Navigate to="/patient/dashboard" replace />
          </ProtectedRoute>
        ),
      },
      {
        path: "/patient/dashboard",
        element: (
          <ProtectedRoute roles={["PATIENT"]}>
            <PatientDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/patient/appointments",
        element: (
          <ProtectedRoute roles={["PATIENT"]}>
            <PatientAppointments />
          </ProtectedRoute>
        ),
      },
      {
        path: "/patient/medical-record",
        element: (
          <ProtectedRoute roles={["PATIENT"]}>
            <PatientMedicalRecord />
          </ProtectedRoute>
        ),
      },
      {
        path: "/patient/profile",
        element: (
          <ProtectedRoute roles={["PATIENT"]}>
            <PatientProfile />
          </ProtectedRoute>
        ),
      },

      {
        path: "/practitioner",
        element: (
          <ProtectedRoute roles={["PRACTITIONER"]}>
            <Navigate to="/practitioner/dashboard" replace />
          </ProtectedRoute>
        ),
      },
      {
        path: "/practitioner/dashboard",
        element: (
          <ProtectedRoute roles={["PRACTITIONER"]}>
            <PractitionerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/practitioner/schedule",
        element: (
          <ProtectedRoute roles={["PRACTITIONER"]}>
            <PractitionerSchedule />
          </ProtectedRoute>
        ),
      },
      {
        path: "/practitioner/today",
        element: (
          <ProtectedRoute roles={["PRACTITIONER"]}>
            <PractitionerToday />
          </ProtectedRoute>
        ),
      },
      {
        path: "/practitioner/availability",
        element: (
          <ProtectedRoute roles={["PRACTITIONER"]}>
            <PractitionerAvailability />
          </ProtectedRoute>
        ),
      },

      {
        path: "/admin",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/dashboard",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/services",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminServices />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/practitioners",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminPractitioners />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/practitioners/:id/availabilities",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminPractitionerAvailabilities />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/patients",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminPatients />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/staff-planning",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <PlanningPersonnel />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/audit",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminAudit />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/settings",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminSettings />
          </ProtectedRoute>
        ),
      },
    ],
  },

  { path: "/403", element: <Forbidden403 /> },
  { path: "*", element: <NotFound404 /> },
]);
