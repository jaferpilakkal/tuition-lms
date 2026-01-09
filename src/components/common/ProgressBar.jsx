import './ProgressBar.css';

function ProgressBar({
    percentage = 0,
    color = 'primary',
    size = 'medium',
    showLabel = true,
    className = ''
}) {
    // Clamp percentage between 0 and 100
    const clampedPercentage = Math.min(100, Math.max(0, percentage));

    const progressBarClasses = [
        'progress-bar',
        `progress-bar-${size}`,
        className
    ].filter(Boolean).join(' ');

    const fillClasses = [
        'progress-bar-fill',
        `progress-bar-fill-${color}`
    ].join(' ');

    return (
        <div className={progressBarClasses}>
            <div className="progress-bar-track">
                <div
                    className={fillClasses}
                    style={{ width: `${clampedPercentage}%` }}
                />
            </div>
            {showLabel && (
                <span className="progress-bar-label">
                    {Math.round(clampedPercentage)}%
                </span>
            )}
        </div>
    );
}

export default ProgressBar;
