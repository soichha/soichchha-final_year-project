import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';

const Signup = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const password = watch('password');

    const onSubmit = async (data) => {
        const { confirm_password, name, ...rest } = data;
        const payload = { ...rest, full_name: name };

        try {
            await axios.post('http://localhost:5000/api/auth/signup', payload);
            alert('Account created! Please login.');
            navigate('/login');
        } catch (err) {
            setServerError(err.response?.data?.message || 'Could not create your account. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            <div className="flex justify-center mb-6">
                <Logo />
            </div>
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Join the QuickShip delivery network</p>

            {serverError && <div className="auth-error">{serverError}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="form-group">
                    <label className="form-label mb-1">Full Name</label>
                    <input
                        {...register('name', {
                            required: "Full Name is required",
                            maxLength: { value: 255, message: "Name cannot exceed 255 characters" },
                            pattern: {
                                value: /^[A-Za-z\s]+$/,
                                message: "Name must contain only alphabets"
                            }
                        })}
                        className="form-input"
                        placeholder=""
                    />
                    {errors.name && <p className="input-error">{errors.name.message}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label mb-1">Phone Number</label>
                    <input
                        {...register('phone', {
                            required: "Phone is required",
                            pattern: {
                                value: /^(98|97)\d{8}$/,
                                message: "Phone number must start with 98 or 97 and be 10 digits"
                            }
                        })}
                        className="form-input"
                        placeholder="9812345678"
                    />
                    {errors.phone && <p className="input-error">{errors.phone.message}</p>}
                </div>

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
                            {...register('password', {
                                required: "Password is required",
                                minLength: { value: 8, message: "Password must be at least 8 characters" },
                                pattern: {
                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                                    message: "Password must contain uppercase, lowercase, number and special character"
                                }
                            })}
                            className="form-input pr-10"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {errors.password && <p className="input-error">{errors.password.message}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label mb-1">Confirm Password</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            {...register('confirm_password', {
                                required: "Please confirm your password",
                                validate: (val) => val === password || "Passwords do not match"
                            })}
                            className="form-input pr-10"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {errors.confirm_password && <p className="input-error">{errors.confirm_password.message}</p>}
                </div>

                <button type="submit" className="btn-submit mt-2">
                    Create Account
                </button>
            </form>

            <p className="auth-footer">
                Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
            </p>
        </div>
    );
};

export default Signup;
