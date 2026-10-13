import { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ value = 0, onChange, size = 20, readOnly = false }) => {
    const [hover, setHover] = useState(0);
    const interactive = !readOnly && typeof onChange === 'function';

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hover || value);
                return (
                    <Star
                        key={star}
                        size={size}
                        className={`${filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} ${interactive ? 'cursor-pointer transition-transform hover:scale-110' : ''}`}
                        onMouseEnter={() => interactive && setHover(star)}
                        onMouseLeave={() => interactive && setHover(0)}
                        onClick={() => interactive && onChange(star)}
                    />
                );
            })}
        </div>
    );
};

export default StarRating;
