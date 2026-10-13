import { useEffect, useState } from 'react';
import axios from 'axios';
import { UserPlus, User, Eye, EyeOff, Edit, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

const StaffMgmt = () => {
    const [staffList, setStaffList] = useState([]);
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
    const [showForm, setShowForm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const [editStaff, setEditStaff] = useState(null); 

    const password = watch('password');

    const fetchStaff = async () => {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/users/staff', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setStaffList(res.data);
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const onAddStaff = async (data) => {
        try {
            const token = localStorage.getItem('token');
            const { confirm_password, name, ...rest } = data;
            const payload = { ...rest, full_name: name };

            await axios.post('http://localhost:5000/api/users/staff', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Staff Created!');
            setShowForm(false);
            reset();
            setServerError('');
            fetchStaff();
        } catch (err) {
            setServerError(err.response?.data?.error || 'Unable to create this staff account. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this staff member? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/users/staff/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStaff();
        } catch (err) {
            alert(err.response?.data?.error || 'Unable to delete this staff member. Please try again.');
        }
    };

    const handleUpdate = async (data) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/users/staff/${editStaff.user_id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Staff Updated!');
            setEditStaff(null);
            fetchStaff();
        } catch (err) {
            alert(err.response?.data?.error || 'Unable to update this staff member. Please try again.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Staff Management</h1>
                <button onClick={() => { setShowForm(!showForm); setServerError(''); }} className="btn-admin-primary">
                    <UserPlus size={20} /> {showForm ? 'Close Form' : 'Register New Staff'}
                </button>
            </div>

            {showForm && (
                <div className="admin-card mb-6 max-w-lg">
                    <h3 className="text-lg font-bold mb-4 text-slate-800">Register New Staff</h3>
                    {serverError && <p className="auth-error">{serverError}</p>}

                    <form onSubmit={handleSubmit(onAddStaff)} className="space-y-4">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                {...register('name', {
                                    required: "Full Name is required",
                                    pattern: { value: /^[A-Za-z\s]+$/, message: "Name must contain only alphabets" }
                                })}
                                placeholder="Full Name"
                                className="form-input"
                            />
                            {errors.name && <p className="input-error">{errors.name.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                {...register('phone', {
                                    required: "Phone is required",
                                    pattern: { value: /^(98|97)\d{8}$/, message: "Must start with 98/97 and be 10 digits" }
                                })}
                                placeholder="98XXXXXXXX"
                                className="form-input"
                            />
                            {errors.phone && <p className="input-error">{errors.phone.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                {...register('email', {
                                    required: "Email is required",
                                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email" }
                                })}
                                placeholder="staff@quickship.com"
                                className="form-input"
                                type="email"
                            />
                            {errors.email && <p className="input-error">{errors.email.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...register('password', {
                                        required: "Password is required",
                                        minLength: { value: 8, message: "Min 8 characters" },
                                        pattern: {
                                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                                            message: "Must include Upper, Lower, Number & Special Char"
                                        }
                                    })}
                                    placeholder="••••••••"
                                    className="form-input"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="input-error">{errors.password.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    {...register('confirm_password', {
                                        required: "Please confirm password",
                                        validate: (val) => val === password || "Passwords do not match"
                                    })}
                                    placeholder="••••••••"
                                    className="form-input"
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirm_password && <p className="input-error">{errors.confirm_password.message}</p>}
                        </div>

                        <button className="btn-submit !mt-6">
                            Create Staff Account
                        </button>
                    </form>
                </div>
            )}

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead className="admin-table-thead">
                        <tr>
                            <th className="admin-table-th">Name</th>
                            <th className="admin-table-th">Phone</th>
                            <th className="admin-table-th">Email</th>
                            <th className="admin-table-th">Joined On</th>
                            <th className="admin-table-th text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {staffList.map(staff => (
                            <tr key={staff.user_id} className="admin-table-tr-hover">
                                <td className="admin-table-td font-medium flex items-center gap-3">
                                    <div className="bg-blue-50 p-2 rounded-full text-blue-600"><User size={16} /></div>
                                    {staff.full_name}
                                </td>
                                <td className="admin-table-td">{staff.phone || 'N/A'}</td>
                                <td className="admin-table-td">{staff.email}</td>
                                <td className="admin-table-td text-slate-400">{new Date(staff.createdAt).toLocaleDateString()}</td>
                                <td className="admin-table-td flex justify-center gap-2">
                                    <button onClick={() => setEditStaff(staff)} className="btn-admin-edit">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(staff.user_id)} className="btn-admin-danger">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editStaff && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="text-xl font-bold text-slate-800">Edit Staff Member</h3>
                            <button onClick={() => setEditStaff(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleUpdate(Object.fromEntries(formData));
                        }} className="modal-body space-y-4">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input name="full_name" defaultValue={editStaff.full_name} className="form-input" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input name="email" defaultValue={editStaff.email} className="form-input" type="email" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input name="phone" defaultValue={editStaff.phone} className="form-input" required />
                            </div>
                            <button className="btn-submit !mt-6">
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffMgmt;

