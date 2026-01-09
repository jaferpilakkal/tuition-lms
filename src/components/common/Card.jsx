import './Card.css';

function Card({
    title,
    subtitle,
    children,
    onClick,
    accent,
    className = '',
    headerAction
}) {
    const cardClasses = [
        'card',
        onClick ? 'card-clickable' : '',
        accent ? `card-accent-${accent}` : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={cardClasses} onClick={onClick}>
            {(title || headerAction) && (
                <div className="card-header">
                    <div className="card-header-text">
                        {title && <h3 className="card-title">{title}</h3>}
                        {subtitle && <p className="card-subtitle">{subtitle}</p>}
                    </div>
                    {headerAction && <div className="card-header-action">{headerAction}</div>}
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
        </div>
    );
}

export default Card;
