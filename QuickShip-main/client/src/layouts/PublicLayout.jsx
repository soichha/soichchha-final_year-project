import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';  
import Footer from '../components/Footer';

const PublicLayout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 pt-24">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;
