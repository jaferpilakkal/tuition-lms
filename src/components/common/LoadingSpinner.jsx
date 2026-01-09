import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css';

function LoadingSpinner({
    fullPage = false,
    size = 'medium',
    text = '',
    className = ''
}) {
    const sizeMap = {
        small: 20,
        medium: 32,
        large: 48
    };

    const spinnerClasses = [
        'loading-spinner',
        fullPage ? 'loading-spinner-fullpage' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={spinnerClasses}>
            <Loader2
                className="loading-spinner-icon"
                size={sizeMap[size]}
            />
            {text && <p className="loading-spinner-text">{text}</p>}
        </div>
    );
}

export default LoadingSpinner;
