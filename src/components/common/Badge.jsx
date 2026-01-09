import './Badge.css';

const statusConfig = {
    // Attendance statuses
    'Present': { variant: 'success', label: 'Present' },
    'Absent': { variant: 'danger', label: 'Absent' },

    // Task statuses
    'Assigned': { variant: 'warning', label: 'Assigned' },
    'Submitted': { variant: 'primary', label: 'Submitted' },
    'Reviewed': { variant: 'primary', label: 'Reviewed' },
    'Completed': { variant: 'success', label: 'Completed' },
    'Overdue': { variant: 'danger', label: 'Overdue' },

    // General statuses
    'Active': { variant: 'success', label: 'Active' },
    'Inactive': { variant: 'neutral', label: 'Inactive' },
    'Pending': { variant: 'warning', label: 'Pending' },
};

function Badge({
    status,
    variant,
    label,
    size = 'medium',
    className = ''
}) {
    // Use statusConfig if status is provided, otherwise use direct props
    const config = status ? statusConfig[status] : null;
    const badgeVariant = variant || config?.variant || 'neutral';
    const badgeLabel = label || config?.label || status || '';

    const badgeClasses = [
        'badge',
        `badge-${badgeVariant}`,
        `badge-${size}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <span className={badgeClasses}>
            {badgeLabel}
        </span>
    );
}

export default Badge;
