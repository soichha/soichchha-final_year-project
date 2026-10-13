import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';

const ForgotPassword = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const onSubmitEmail = async (data) => {
        setErrorMsg('');
        setSubmitting(true);
        try {
            await axios.post('http://localhost:5000/api/auth/verify-account', { email: data.email });
            setEmail(data.email);
            setStep(2);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const onSubmitPassword = async (data) => {
        setErrorMsg('');
        setSubmitting(true);
        try {
            await axios.post('http://localhost:5000/api/auth/reset-password', {
                email,
                password: data.password,
                confirmPassword: data.confirmPassword
            });
            setSuccessMsg('Password has been reset successfully. Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="flex justify-center mb-6">
                <Logo />
            </div>
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">
                {step === 1
                    ? "Enter your registered email address to continue."
                    : "Choose a new password for your account."}
            </p>

            {errorMsg && <div className="auth-error">{errorMsg}</div>}
            {successMsg && <div className="auth-error !bg-green-50 !text-green-700 !border-green-200">{successMsg}</div>}

            {!successMsg && step === 1 && (
                <form onSubmit={handleSubmit(onSubmitEmail)} className="space-y-5">
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

                    <button type="submit" disabled={submitting} className="btn-submit mt-2">
                        {submitting ? 'Checking...' : 'Continue'}
                    </button>
                </form>
            )}

            {!successMsg && step === 2 && (
                <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-5">
                    <div className="form-group">
                        <label className="form-label mb-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                {...register('password', {
                                    required: "Password is required",
                                    minLength: { value: 6, message: "Password must be at least 6 characters" }
                                })}
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
                        {errors.password && <p className="input-error">{errors.password.message}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label mb-1">Confirm Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            {...register('confirmPassword', {
                                required: "Please confirm your password",
                                validate: (value) => value === watch('password') || "Passwords do not match"
                            })}
                            className="form-input"
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && <p className="input-error">{errors.confirmPassword.message}</p>}
                    </div>

                    <button type="submit" disabled={submitting} className="btn-submit mt-2">
                        {submitting ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            )}

            <p className="auth-footer">
                Remembered your password? <Link to="/login" className="auth-link">Back to Login</Link>
            </p>
        </div>
    );
};

export default ForgotPassword;
