import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, History, LogOut, UserCircle, Star } from 'lucide-react';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import ChatbotWidget from '../components/ChatbotWidget';

const StaffLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    const menuItems = [
        { path: '/staff/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/staff/assigned', icon: <CheckSquare size={20} />, label: 'Assigned Parcels' },
        { path: '/staff/history', icon: <History size={20} />, label: 'Delivery History' },
        { path: '/staff/feedback', icon: <Star size={20} />, label: 'My Feedback' },
    ];

    return (
        <div className="staff-layout">
            <aside className="staff-sidebar">
                <div className="p-6 border-b border-slate-700">
                    <Logo className="!text-white" />
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Staff Portal</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <Link to="/staff/profile" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white mb-2">
                        <UserCircle size={20} />
                        <span>Profile</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="staff-content">
                <div className="p-8 flex-1">
                    <Outlet />
                </div>
                <Footer />
            </main>
            <ChatbotWidget />
        </div>
    );
};

export default StaffLayout;
