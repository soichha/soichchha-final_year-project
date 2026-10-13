import { Link } from 'react-router-dom';
import { PackagePlus, Search, ClipboardList } from 'lucide-react';

const CustomerHome = () => {
    const userName = localStorage.getItem('userName') || 'Client';

    return (
        <div className="space-y-8">
            <div className="customer-hero">
                <h1 className="text-3xl font-bold mb-2">Welcome Back, {userName}!</h1>
                <p className="text-blue-100 max-w-xl">
                    Ready to send a parcel? Book in a few steps and get an instant cost and delivery-time estimate.
                </p>
                <Link to="/customer/book" className="inline-block mt-6 bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition">
                    Book Now
                </Link>
            </div>

            <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
            <div className="admin-grid lg:grid-cols-3">
                <Link to="/customer/book" className="customer-card group">
                    <div className="customer-action-icon bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                        <PackagePlus size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">Book Parcel</h3>
                    <p className="text-slate-500 text-sm mt-1">Schedule a pickup and delivery.</p>
                </Link>

                <Link to="/customer/track" className="customer-card group">
                    <div className="customer-action-icon bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white">
                        <Search size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">Track Parcel</h3>
                    <p className="text-slate-500 text-sm mt-1">Check the current status of your parcel.</p>
                </Link>

                <Link to="/customer/bookings" className="customer-card group">
                    <div className="customer-action-icon bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white">
                        <ClipboardList size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">My Bookings</h3>
                    <p className="text-slate-500 text-sm mt-1">View history and download receipts.</p>
                </Link>
            </div>

        </div>
    );
};

export default CustomerHome;
