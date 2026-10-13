import { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Mail, Phone, Save, Edit2, Lock } from 'lucide-react';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/users/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
            setFormData({
                full_name: res.data.full_name,
                email: res.data.email,
                phone: res.data.phone || '',
                password: '',
                confirmPassword: ''
            });
            setLoading(false);
        } catch (err) {
            console.error("Profile fetch failed");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        if (formData.password || formData.confirmPassword) {
            if (!formData.password) {
                return setMessage({ text: 'New password is required to change it', type: 'error' });
            }
            if (!formData.confirmPassword) {
                return setMessage({ text: 'Please confirm your new password', type: 'error' });
            }
            if (formData.password.length < 6) {
                return setMessage({ text: 'Password must be at least 6 characters long', type: 'error' });
            }
            if (formData.password !== formData.confirmPassword) {
                return setMessage({ text: 'Passwords do not match', type: 'error' });
            }
        }

        try {
            const token = localStorage.getItem('token');
            const dataToSend = { ...formData };
            if (!dataToSend.password) {
                delete dataToSend.password;
                delete dataToSend.confirmPassword;
            }

            await axios.put('http://localhost:5000/api/users/profile', dataToSend, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            setIsEditing(false);
            fetchProfile();
            localStorage.setItem('userName', formData.full_name);
        } catch (err) {
            setMessage({ text: err.response?.data?.error || 'Update failed', type: 'error' });
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
    if (!user) return <div className="p-8 text-center text-red-500">Failed to load profile.</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-12 mb-6">
                        <div className="w-24 h-24 bg-white rounded-2xl shadow-md flex items-center justify-center border-4 border-white">
                            <User size={48} className="text-blue-600" />
                        </div>
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-lg mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <input
                                        disabled={!isEditing}
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className={`w-full border p-2 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${!isEditing ? 'bg-slate-50' : 'bg-white font-medium text-slate-900 border-blue-500'}`}
                                        required
                                    />
                                    <User size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <input
                                    disabled
                                    value={user.role?.toUpperCase()}
                                    className="w-full border p-2 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <input
                                        disabled={!isEditing}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full border p-2 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${!isEditing ? 'bg-slate-50' : 'bg-white font-medium text-slate-900 border-blue-500'}`}
                                        type="email"
                                        required
                                    />
                                    <Mail size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <div className="relative">
                                    <input
                                        disabled={!isEditing}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className={`w-full border p-2 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${!isEditing ? 'bg-slate-50' : 'bg-white font-medium text-slate-900 border-blue-500'}`}
                                        placeholder="Add phone number"
                                    />
                                    <Phone size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        disabled={!isEditing}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`w-full border p-2 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${!isEditing ? 'bg-slate-50' : 'bg-white font-medium text-slate-900 border-blue-500'}`}
                                        type="password"
                                        placeholder="Enter new password"
                                    />
                                    <Lock size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        disabled={!isEditing}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className={`w-full border p-2 pl-10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${!isEditing ? 'bg-slate-50' : 'bg-white font-medium text-slate-900 border-blue-500'}`}
                                        type="password"
                                        placeholder="Confirm new password"
                                    />
                                    <Lock size={18} className="absolute left-3 top-2.5 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            {!isEditing ? (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                    <Edit2 size={18} /> Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setIsEditing(false); fetchProfile(); }}
                                        className="px-6 py-2 border rounded-lg hover:bg-slate-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-100"
                                    >
                                        <Save size={18} /> Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
