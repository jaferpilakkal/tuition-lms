import { FileQuestion, BookOpen, Users, Calendar, ClipboardList } from 'lucide-react';
import Button from './Button';
import './EmptyState.css';

const iconMap = {
    'default': FileQuestion,
    'classes': BookOpen,
    'users': Users,
    'sessions': Calendar,
    'tasks': ClipboardList,
};

function EmptyState({
    icon = 'default',
    title = 'No data yet',
    description = '',
    actionLabel,
    onAction,
    className = ''
}) {
    const IconComponent = iconMap[icon] || iconMap['default'];

    return (
        <div className={`empty-state ${className}`}>
            <div className="empty-state-icon">
                <IconComponent size={48} strokeWidth={1.5} />
            </div>
            <h3 className="empty-state-title">{title}</h3>
            {description && (
                <p className="empty-state-description">{description}</p>
            )}
            {actionLabel && onAction && (
                <Button
                    variant="primary"
                    onClick={onAction}
                    className="empty-state-action"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

export default EmptyState;
