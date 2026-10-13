import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingMap from '../../components/BookingMap';
import { Truck, MapPin, X, Plane, Wallet, Banknote, Search, Loader2, CheckCircle2, Clock } from 'lucide-react';
import TrackingQRCode from '../../components/TrackingQRCode';
import { calculateDistance } from '../../utils/haversine';
import { calculateParcelCost, getCostBreakdown } from '../../utils/costCalculator';
import axios from 'axios';

let searchTimer;

const BookParcel = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const editData = location.state?.editData;

    const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
        defaultValues: {
            weight: editData?.weight || 1,
            deliveryMethod: editData?.delivery_type || 'Vehicle',
            priority: editData?.priority || 'Standard',
            paymentMethod: editData?.payment?.payment_method || 'COD',
            receiverName: editData?.receiver_name || '',
            receiverPhone: editData?.receiver_phone || '',
            description: editData?.description || ''
        }
    });

    const [points, setPoints] = useState({
        source: editData ? {
            lat: editData.sourceLocation?.latitude,
            lng: editData.sourceLocation?.longitude,
            name: editData.sourceLocation?.full_address || editData.sourceLocation?.city_or_area,
            city: editData.sourceLocation?.city_or_area,
            district: editData.sourceLocation?.district
        } : null,
        destination: editData ? {
            lat: editData.destinationLocation?.latitude,
            lng: editData.destinationLocation?.longitude,
            name: editData.destinationLocation?.full_address || editData.destinationLocation?.city_or_area,
            city: editData.destinationLocation?.city_or_area,
            district: editData.destinationLocation?.district
        } : null
    });
    const [distance, setDistance] = useState(0);
    const [cost, setCost] = useState(0);
    const [userName, setUserName] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [activeField, setActiveField] = useState(null);
    const [bookingResult, setBookingResult] = useState(null);

    const [searchQuery, setSearchQuery] = useState({ source: '', destination: '' });
    const [suggestions, setSuggestions] = useState({ source: [], destination: [] });
    const [isSearching, setIsSearching] = useState({ source: false, destination: false });

    const watchedWeight = watch('weight');
    const watchedDeliveryMethod = watch('deliveryMethod');
    const watchedPriority = watch('priority');
    const watchedPaymentMethod = watch('paymentMethod');

    useEffect(() => {
        setSearchQuery({
            source: points.source?.name || '',
            destination: points.destination?.name || ''
        });
    }, [points]);

    useEffect(() => {
        const name = localStorage.getItem('userName');
        setUserName(name || '');
    }, []);

    useEffect(() => {
        if (points.source && points.destination) {
            const dist = calculateDistance(
                points.source.lat, points.source.lng,
                points.destination.lat, points.destination.lng
            );
            setDistance(dist);
        } else {
            setDistance(0);
        }
    }, [points]);

    useEffect(() => {
        const calculated = calculateParcelCost(watchedWeight, distance, watchedDeliveryMethod);
        setCost(calculated);
    }, [distance, watchedWeight, watchedDeliveryMethod]);

    useEffect(() => {
        if (distance < 100 && watchedDeliveryMethod === 'Air') {
            setValue('deliveryMethod', 'Vehicle');
        }
    }, [distance, watchedDeliveryMethod, setValue]);

    const codCharge = watchedPaymentMethod === 'COD' ? 20 : 0;
    const finalTotal = cost + codCharge;

    const handleOpenMap = (field) => {
        setActiveField(field);
        setShowMap(true);
    };

    const handleLocationSelect = (locationResult) => {
        const newPoints = { ...points, [activeField]: locationResult };
        setPoints(newPoints);
        setSuggestions(prev => ({ ...prev, [activeField]: [] }));
        setShowMap(false);
    };

    const handleAddressSearch = (field, query) => {
        setSearchQuery(prev => ({ ...prev, [field]: query }));

        if (searchTimer) clearTimeout(searchTimer);

        if (!query || query.length < 3) {
            setSuggestions(prev => ({ ...prev, [field]: [] }));
            return;
        }

        setIsSearching(prev => ({ ...prev, [field]: true }));

        searchTimer = setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=np&addressdetails=1&limit=5`);
                const data = await response.json();

                const results = data.map(item => ({
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    city: item.address.city || item.address.town || item.address.village || item.address.suburb || 'Unknown',
                    district: item.address.state_district || item.address.county || item.address.state || 'Unknown',
                    name: item.display_name
                }));

                setSuggestions(prev => ({ ...prev, [field]: results }));
            } catch (err) {
                console.error("Geocoding search failed", err);
            } finally {
                setIsSearching(prev => ({ ...prev, [field]: false }));
            }
        }, 800);
    };

    const clearField = (field) => {
        setSearchQuery(prev => ({ ...prev, [field]: '' }));
        setPoints(prev => ({ ...prev, [field]: null }));
        setSuggestions(prev => ({ ...prev, [field]: [] }));
    };

    const onSubmit = async (data) => {
        if (!points.source || !points.destination) {
            alert("Please select source and destination addresses using the map.");
            return;
        }

        const payload = {
            receiverName: data.receiverName,
            receiverPhone: data.receiverPhone,
            description: data.description,
            weight: parseFloat(data.weight),
            deliveryMethod: data.deliveryMethod,
            priority: data.priority,
            paymentMethod: data.paymentMethod,
            senderId: localStorage.getItem('userId'),
            senderName: userName,
            source: points.source,
            destination: points.destination,
        };

        try {
            const token = localStorage.getItem('token');
            const url = editData
                ? `http://localhost:5000/api/parcels/${editData.parcel_id}`
                : 'http://localhost:5000/api/parcels';

            const method = editData ? 'put' : 'post';

            const response = await axios[method](url, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!editData && data.paymentMethod === 'eSewa') {
                const { parcel } = response.data;

                const initRes = await axios.post(
                    'http://localhost:5000/api/payments/initiate-esewa',
                    { parcelId: parcel.parcel_id },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const { formUrl, fields } = initRes.data;

                const form = document.createElement("form");
                form.setAttribute("method", "POST");
                form.setAttribute("action", formUrl);

                for (let key in fields) {
                    var hiddenField = document.createElement("input");
                    hiddenField.setAttribute("type", "hidden");
                    hiddenField.setAttribute("name", key);
                    hiddenField.setAttribute("value", fields[key]);
                    form.appendChild(hiddenField);
                }

                document.body.appendChild(form);
                form.submit();

            } else {
                if (editData) {
                    alert('Booking Updated Successfully!');
                    navigate('/customer/bookings');
                } else {
                    setBookingResult(response.data);
                    reset();
                    setPoints({ source: null, destination: null });
                    setDistance(0);
                }
            }

        } catch (err) {
            alert(err.response?.data?.error || 'Something went wrong. Please try again.');
            console.error(err);
        }
    };

    return (
        <div className="relative pb-12">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">
                {editData ? 'Edit Parcel Details' : 'Book New Parcel'}
            </h1>

            <div className="admin-grid lg:grid-cols-3">
                <div className="lg:col-span-2 admin-card !p-8">
                    <form id="booking-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sender & Route</p>

                        <div className="form-group relative">
                            <label className="form-label">Pickup Address (Search or Use Map)</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        className="form-input !pl-10 !pr-10"
                                        placeholder="Enter source address"
                                        value={searchQuery.source}
                                        onChange={(e) => handleAddressSearch('source', e.target.value)}
                                    />
                                    {(searchQuery.source || points.source) && (
                                        <button
                                            type="button"
                                            onClick={() => clearField('source')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleOpenMap('source')}
                                    className="px-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                    title="Open Map Picker"
                                >
                                    <MapPin size={20} />
                                </button>
                            </div>

                            {suggestions.source.length > 0 && (
                                <div className="absolute z-50 left-0 right-12 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                                    {suggestions.source.map((item, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setPoints(prev => ({ ...prev, source: item }));
                                                setSuggestions(prev => ({ ...prev, source: [] }));
                                                setSearchQuery(prev => ({ ...prev, source: item.name }));
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex flex-col gap-0.5"
                                        >
                                            <span className="text-sm font-medium text-slate-800 line-clamp-1">{item.name}</span>
                                            <span className="text-[10px] text-slate-500 italic uppercase tracking-wider">{item.city}, {item.district}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {isSearching.source && (
                                <div className="absolute right-14 top-[52px] animate-spin text-blue-600">
                                    <Loader2 size={16} />
                                </div>
                            )}

                            {points.source && <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1 font-medium leading-relaxed">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0"></span>
                                Verified: {points.source.name || `${points.source.city}, ${points.source.district}`}
                            </p>}
                        </div>

                        <div className="form-group relative">
                            <label className="form-label">Delivery Address (Search or Use Map)</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        className="form-input !pl-10 !pr-10"
                                        placeholder="Enter destination address"
                                        value={searchQuery.destination}
                                        onChange={(e) => handleAddressSearch('destination', e.target.value)}
                                    />
                                    {(searchQuery.destination || points.destination) && (
                                        <button
                                            type="button"
                                            onClick={() => clearField('destination')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleOpenMap('destination')}
                                    className="px-3 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors"
                                    title="Open Map Picker"
                                >
                                    <MapPin size={20} />
                                </button>
                            </div>

                            {suggestions.destination.length > 0 && (
                                <div className="absolute z-50 left-0 right-12 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
                                    {suggestions.destination.map((item, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setPoints(prev => ({ ...prev, destination: item }));
                                                setSuggestions(prev => ({ ...prev, destination: [] }));
                                                setSearchQuery(prev => ({ ...prev, destination: item.name }));
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-amber-50 border-b border-slate-50 last:border-0 flex flex-col gap-0.5"
                                        >
                                            <span className="text-sm font-medium text-slate-800 line-clamp-1">{item.name}</span>
                                            <span className="text-[10px] text-slate-500 italic uppercase tracking-wider">{item.city}, {item.district}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {isSearching.destination && (
                                <div className="absolute right-14 top-[52px] animate-spin text-amber-600">
                                    <Loader2 size={16} />
                                </div>
                            )}

                            {points.destination && <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1 font-medium leading-relaxed">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0"></span>
                                Verified: {points.destination.name || `${points.destination.city}, ${points.destination.district}`}
                            </p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Sender Name</label>
                            <input
                                value={userName}
                                readOnly
                                className="form-input !bg-slate-50 !text-slate-500 cursor-not-allowed"
                            />
                        </div>

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide pt-2">Receiver Details</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-group">
                                <label className="form-label">Receiver Name</label>
                                <input
                                    {...register('receiverName', {
                                        required: "Receiver Name is required",
                                        pattern: {
                                            value: /^[A-Za-z\s]+$/,
                                            message: "Name must contain only alphabets"
                                        }
                                    })}
                                    className="form-input"
                                    placeholder=""
                                />
                                {errors.receiverName && <p className="input-error">{errors.receiverName.message}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Receiver Phone</label>
                                <input
                                    {...register('receiverPhone', {
                                        required: "Receiver Phone is required",
                                        pattern: {
                                            value: /^(98|97)\d{8}$/,
                                            message: "Phone number must start with 98 or 97 and be 10 digits"
                                        }
                                    })}
                                    className="form-input"
                                    placeholder="98XXXXXXXX"
                                />
                                {errors.receiverPhone && <p className="input-error">{errors.receiverPhone.message}</p>}
                            </div>
                        </div>

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide pt-2">Parcel Details</p>
                        <div className="form-group">
                            <label className="form-label">Parcel Description</label>
                            <input
                                {...register('description', {
                                    required: "Description is required",
                                    maxLength: { value: 255, message: "Description must be 255 characters or fewer" }
                                })}
                                className="form-input"
                                placeholder="Item description..."
                            />
                            {errors.description && <p className="input-error">{errors.description.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Weight (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="form-input"
                                {...register('weight', {
                                    required: "Weight is required",
                                    min: { value: 0.1, message: "Weight cannot be zero. Minimum 0.1 kg required." }
                                })}
                            />
                            {errors.weight && <p className="input-error">{errors.weight.message}</p>}
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Delivery Details</p>
                            <label className="form-label mb-3">Delivery Method</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`selection-card ${watchedDeliveryMethod === 'Vehicle' ? 'selection-card-active' : ''}`}>
                                    <input
                                        type="radio"
                                        value="Vehicle"
                                        className="hidden"
                                        {...register('deliveryMethod')}
                                    />
                                    <Truck className={watchedDeliveryMethod === 'Vehicle' ? 'text-blue-600' : 'text-slate-400'} />
                                    <span className="font-semibold text-sm">By Road (Vehicle)</span>
                                </label>
                                <label
                                    className={`selection-card ${watchedDeliveryMethod === 'Air' ? 'selection-card-active' : ''} ${distance < 100 ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                                    title={distance < 100 ? "Available for distances over 100km" : "Ship via Air"}
                                >
                                    <input
                                        type="radio"
                                        value="Air"
                                        className="hidden"
                                        disabled={distance < 100}
                                        {...register('deliveryMethod')}
                                    />
                                    <Plane className={watchedDeliveryMethod === 'Air' ? 'text-blue-600' : 'text-slate-400'} />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm">By Air</span>
                                        {distance < 100 && <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Min 100km</span>}
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="form-label mb-3">Delivery Priority</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`selection-card ${watchedPriority === 'Standard' ? 'selection-card-active' : ''}`}>
                                    <input
                                        type="radio"
                                        value="Standard"
                                        className="hidden"
                                        {...register('priority')}
                                    />
                                    <span className="font-semibold text-sm">Standard</span>
                                </label>
                                <label className={`selection-card ${watchedPriority === 'Express' ? 'selection-card-active' : ''}`}>
                                    <input
                                        type="radio"
                                        value="Express"
                                        className="hidden"
                                        {...register('priority')}
                                    />
                                    <span className="font-semibold text-sm">Express</span>
                                </label>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">Express priority is handled and delivered faster than Standard.</p>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Payment</p>
                            <label className="form-label mb-3">Payment Method</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`selection-card ${watchedPaymentMethod === 'eSewa' ? 'selection-card-active-green' : ''}`}>
                                    <input
                                        type="radio"
                                        value="eSewa"
                                        className="hidden"
                                        {...register('paymentMethod')}
                                    />
                                    <Wallet className={watchedPaymentMethod === 'eSewa' ? 'text-green-600' : 'text-slate-400'} />
                                    <span className="font-semibold text-sm">eSewa Wallet</span>
                                </label>
                                <label className={`selection-card ${watchedPaymentMethod === 'COD' ? 'selection-card-active-green' : ''}`}>
                                    <input
                                        type="radio"
                                        value="COD"
                                        className="hidden"
                                        {...register('paymentMethod')}
                                    />
                                    <Banknote className={watchedPaymentMethod === 'COD' ? 'text-green-600' : 'text-slate-400'} />
                                    <span className="font-semibold text-sm">Cash on Delivery</span>
                                </label>
                            </div>
                        </div>

                    </form>
                </div>

                <div className="summary-panel">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Estimated Cost</h2>

                    {distance > 0 ? (
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Total Distance</span>
                                <span className="font-medium">{distance.toFixed(2)} km</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Total Weight</span>
                                <span className="font-medium">{watchedWeight} kg</span>
                            </div>

                            <hr className="border-dashed" />

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Base Charge</span>
                                    <span>Rs. {getCostBreakdown(watchedWeight, distance, watchedDeliveryMethod).baseCharge}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Weight Charge</span>
                                    <span>Rs. {getCostBreakdown(watchedWeight, distance, watchedDeliveryMethod).weightCharge}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Distance Charge</span>
                                    <span>Rs. {getCostBreakdown(watchedWeight, distance, watchedDeliveryMethod).distanceCharge}</span>
                                </div>
                                <div className="flex justify-between text-sm pt-1">
                                    <span className="text-slate-500">Delivery Charge</span>
                                    <span className="font-medium">Rs. {cost}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-sm bg-blue-50 p-2 rounded">
                                <span className="text-blue-600 font-medium">Est. Arrival</span>
                                <span className="text-blue-700 font-bold">
                                    Calculated after booking
                                </span>
                            </div>

                            {watchedPaymentMethod === 'COD' && (
                                <div className="flex justify-between text-sm text-amber-600">
                                    <span className="font-medium">COD Surcharge</span>
                                    <span className="font-medium">+ Rs. 20</span>
                                </div>
                            )}

                            <div className="border-t pt-4 flex justify-between text-2xl font-bold text-blue-600">
                                <span>Total Pay</span>
                                <span>Rs. {finalTotal}</span>
                            </div>

                            <button form="booking-form" type="submit" className={`btn-submit !py-3 !mt-4 ${watchedPaymentMethod === 'eSewa' ? '!bg-green-600 hover:!bg-green-700 shadow-green-200' : 'shadow-blue-200'}`}>
                                {editData ? 'Update Booking' : (watchedPaymentMethod === 'eSewa' ? 'Pay with eSewa' : 'Confirm & Book')}
                            </button>

                            <p className="text-xs text-center text-slate-400 mt-2">
                                * A detailed invoice with QR code will be available after booking.
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            <Truck size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Select location to calculate cost.</p>
                        </div>
                    )}
                </div>
            </div>

            {bookingResult && (
                <div className="modal-overlay">
                    <div className="modal-container max-w-md text-center">
                        <div className="modal-body space-y-4 !pt-8">
                            <CheckCircle2 size={48} className="mx-auto text-green-500" />
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Booking Confirmed!</h3>
                                <p className="text-sm text-slate-500 font-mono mt-1">{bookingResult.parcel.tracking_hash}</p>
                            </div>

                            {bookingResult.prediction && (
                                <div className="bg-blue-50 rounded-lg p-4 text-left">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 uppercase mb-1">
                                        <Clock size={12} /> Estimated Delivery Time
                                    </div>

                                    <p className="text-2xl font-bold text-blue-700">
                                        ~{bookingResult.prediction.hours} hours
                                    </p>

                                    <p className="text-sm font-semibold text-slate-700 mt-2">
                                        Estimated Arrival
                                    </p>

                                    <p className="text-sm text-blue-700 font-semibold">
                                        {bookingResult.parcel?.estimated_arrival || 'Not available'}
                                    </p>

                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Prediction source: {bookingResult.prediction.source}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-center pt-2">
                                <TrackingQRCode trackingHash={bookingResult.parcel.tracking_hash} size={120} />
                            </div>

                            <button
                                onClick={() => setBookingResult(null)}
                                className="btn-submit !mt-4"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showMap && (
                <div className="modal-overlay">
                    <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                        <div className="modal-header bg-slate-50">
                            <h3 className="font-bold text-lg">Select {activeField === 'source' ? 'Pickup' : 'Delivery'} Location</h3>
                            <button onClick={() => setShowMap(false)} className="p-2 hover:bg-slate-200 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 relative">
                            <BookingMap
                                existingPoints={points}
                                selectionMode={activeField}
                                onSelect={handleLocationSelect}
                            />
                        </div>
                        <div className="p-3 bg-blue-50 text-center text-sm text-blue-700">
                            Click on the map. Only locations in Nepal are accepted.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookParcel;
