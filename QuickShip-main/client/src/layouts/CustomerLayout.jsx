import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, UserCircle } from 'lucide-react';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import ChatbotWidget from '../components/ChatbotWidget';

const CustomerLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    return (
        <div className="customer-layout app-container">
            <header className="navbar">
                <div className="navbar-container">
                    <Logo />

                    <div className="hidden md:flex items-center space-x-1">
                        <Link to="/customer/home" className={`px-4 py-2 rounded-full text-sm font-medium transition ${location.pathname === '/customer/home' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}>
                            Home
                        </Link>
                        <Link to="/customer/book" className={`px-4 py-2 rounded-full text-sm font-medium transition ${location.pathname === '/customer/book' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}>
                            Book Parcel
                        </Link>
                        <Link to="/customer/track" className={`px-4 py-2 rounded-full text-sm font-medium transition ${location.pathname === '/customer/track' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}>
                            Track
                        </Link>
                        <Link to="/customer/bookings" className={`px-4 py-2 rounded-full text-sm font-medium transition ${location.pathname === '/customer/bookings' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}>
                            My Bookings
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link to="/customer/profile" aria-label="Profile" title="Profile" className="text-slate-500 hover:text-blue-600"><UserCircle size={24} /></Link>
                        <button onClick={handleLogout} aria-label="Logout" title="Logout" className="text-red-400 hover:text-red-600"><LogOut size={20} /></button>
                    </div>
                </div>
            </header>

            <main className="main-content !pt-24">
                <Outlet />
            </main>

            <Footer />
            <ChatbotWidget />
        </div>
    );
};

export default CustomerLayout;
