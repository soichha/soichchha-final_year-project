import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Logo = ({ className = "" }) => {
    const role = localStorage.getItem('userRole');
    let redirectPath = "/";
    if (role === 'admin') redirectPath = "/admin/dashboard";
    else if (role === 'staff') redirectPath = "/staff/dashboard";
    else if (role === 'client') redirectPath = "/customer/home";

    return (
        <Link to={redirectPath} className={`brand-logo ${className}`}>
            <Truck className="brand-icon" size={28} />
            <span className="brand-text">QuickShip</span>
        </Link>
    );
};

export default Logo;
