import { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Trash2 } from 'lucide-react';

const CustomerMgmt = () => {
    const [customers, setCustomers] = useState([]);

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/users/clients', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomers(res.data);
        } catch (err) {
            console.error("Failed to fetch customers");
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this customer? This may affect their existing orders.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/users/clients/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCustomers();
        } catch (err) {
            alert(err.response?.data?.error || 'Unable to delete this customer. Please try again.');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Customer Management</h1>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead className="admin-table-thead">
                        <tr>
                            <th className="admin-table-th">Name</th>
                            <th className="admin-table-th">Email</th>
                            <th className="admin-table-th">Joined On</th>
                            <th className="admin-table-th text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length === 0 && (
                            <tr><td colSpan={4} className="admin-table-td text-center text-slate-400">No customers found.</td></tr>
                        )}
                        {customers.map(c => (
                            <tr key={c.user_id} className="admin-table-tr-hover">
                                <td className="admin-table-td flex items-center gap-2">
                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600"><User size={16} /></div>
                                    <span className="font-medium text-slate-800">{c.full_name}</span>
                                </td>
                                <td className="admin-table-td">{c.email}</td>
                                <td className="admin-table-td text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                                <td className="admin-table-td text-center">
                                    <button onClick={() => handleDelete(c.user_id)} className="btn-admin-danger" title="Delete Client">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default CustomerMgmt;
