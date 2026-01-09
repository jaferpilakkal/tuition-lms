import { Loader2 } from 'lucide-react';
import './Button.css';

function Button({
    children,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    type = 'button',
    fullWidth = false,
    onClick,
    className = '',
    ...props
}) {
    const buttonClasses = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth ? 'btn-full-width' : '',
        loading ? 'btn-loading' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={buttonClasses}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading && <Loader2 className="btn-spinner" size={18} />}
            <span className={loading ? 'btn-text-loading' : ''}>
                {children}
            </span>
        </button>
    );
}

export default Button;
