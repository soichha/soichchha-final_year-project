import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import LandingPage from './pages/LandingPage';

import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';
import CustomerLayout from './layouts/CustomerLayout';
import PublicLayout from './layouts/PublicLayout';

import AdminDashboard from './pages/AdminDashboard';
import AdminParcels from './pages/admin/Parcels';
import StaffMgmt from './pages/admin/StaffMgmt';
import CustomerMgmt from './pages/admin/CustomerMgmt';
import Analytics from './pages/admin/Analytics';
import FeedbackManagement from './pages/admin/FeedbackManagement';
import MLPrediction from './pages/admin/MLPrediction';
import DeliveryAccuracyReport from './pages/admin/DeliveryAccuracyReport';
import ActivityLog from './pages/admin/ActivityLog';

import CustomerHome from './pages/customer/Home';
import BookParcel from './pages/customer/BookParcel';
import TrackParcel from './pages/customer/TrackParcel';
import MyBookings from './pages/customer/MyBookings';
import PaymentSuccess from './pages/customer/PaymentSuccess';
import PaymentFailure from './pages/customer/PaymentFailure';

import StaffDashboard from './pages/StaffDashboard';
import AssignedParcels from './pages/staff/AssignedParcels';
import DeliveryHistory from './pages/staff/DeliveryHistory';
import StaffMyFeedback from './pages/staff/MyFeedback';

import Profile from './pages/shared/Profile';

const getUserRole = () => localStorage.getItem('userRole');
const isAuthenticated = () => !!localStorage.getItem('token');

const ProtectedRoute = ({ children, allowedRoles }) => {
    const role = getUserRole();
    const auth = isAuthenticated();

    if (!auth) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" />;

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>

                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/failure" element={<PaymentFailure />} />

                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="parcels" element={<AdminParcels />} />
                    <Route path="staff" element={<StaffMgmt />} />
                    <Route path="customers" element={<CustomerMgmt />} />
                    <Route path="feedback" element={<FeedbackManagement />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="ml-prediction" element={<MLPrediction />} />
                    <Route path="delivery-accuracy" element={<DeliveryAccuracyReport />} />
                    <Route path="activity-log" element={<ActivityLog />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="reports" element={<Navigate to="/admin/analytics" replace />} />
                    <Route path="intelligent-reports" element={<Navigate to="/admin/analytics" replace />} />
                    <Route path="ai-dashboard" element={<Navigate to="/admin/ml-prediction" replace />} />
                </Route>

                <Route path="/staff" element={
                    <ProtectedRoute allowedRoles={['staff']}>
                        <StaffLayout />
                    </ProtectedRoute>
                }>
                    <Route path="dashboard" element={<StaffDashboard />} />
                    <Route path="assigned" element={<AssignedParcels />} />
                    <Route path="history" element={<DeliveryHistory />} />
                    <Route path="feedback" element={<StaffMyFeedback />} />
                    <Route path="profile" element={<Profile />} />
                </Route>

                <Route path="/customer" element={
                    <ProtectedRoute allowedRoles={['client']}>
                        <CustomerLayout />
                    </ProtectedRoute>
                }>
                    <Route path="home" element={<CustomerHome />} />
                    <Route path="book" element={<BookParcel />} />
                    <Route path="track" element={<TrackParcel />} />
                    <Route path="bookings" element={<MyBookings />} />
                    <Route path="profile" element={<Profile />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
