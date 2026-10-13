import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [errorEvent, setErrorEvent] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', data);

            const { token, role, id, name } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', role);
            localStorage.setItem('userId', id);
            localStorage.setItem('userName', name);

            let targetPath = '/customer/home';
            if (role === 'admin') targetPath = '/admin/dashboard';
            if (role === 'staff') targetPath = '/staff/dashboard';

            navigate(targetPath);
        } catch (err) {
            setErrorEvent('Invalid credentials');
        }
    };

    return (
        <div className="auth-container">
            <div className="flex justify-center mb-6">
                <Logo />
            </div>
            <h2 className="auth-title">Login</h2>
            <p className="auth-subtitle">Access your QuickShip account</p>

            {errorEvent && <div className="auth-error">{errorEvent}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="form-group">
                    <label className="form-label mb-1">Email Address</label>
                    <input
                        {...register('email', {
                            required: "Email is required",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email address"
                            }
                        })}
                        className="form-input"
                        placeholder="you@example.com"
                    />
                    {errors.email && <p className="input-error">{errors.email.message}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label mb-1">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            {...register('password', { required: true })}
                            className="form-input pr-10"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>
                    </div>
                    <p className="text-right mt-1">
                        <Link to="/forgot-password" className="auth-link text-sm">Forgot password?</Link>
                    </p>
                </div>

                <button type="submit" className="btn-submit mt-2">
                    Sign In
                </button>
            </form>

            <p className="auth-footer">
                Don&apos;t have an account? <Link to="/signup" className="auth-link">Create Account</Link>
            </p>
        </div>
    );
};

export default Login;
