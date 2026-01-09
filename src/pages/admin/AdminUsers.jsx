import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Button, LoadingSpinner, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Plus, Edit2, UserCheck, UserX, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import './AdminUsers.css';

function AdminUsers() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'student'
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('role', { ascending: true })
                .order('name', { ascending: true });

            if (!error) setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredUsers = () => {
        if (filter === 'all') return users;
        return users.filter(u => u.role === filter);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setSaving(true);

            const { error } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    role: formData.role
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            toast.success('User updated successfully!');
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const toggleUserActive = async (userId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: !currentStatus })
                .eq('id', userId);

            if (error) throw error;

            toast.success(currentStatus ? 'User deactivated' : 'User activated');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update user status');
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'primary';
            case 'teacher': return 'warning';
            case 'student': return 'success';
            default: return 'secondary';
        }
    };

    const filteredUsers = getFilteredUsers();
    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        teachers: users.filter(u => u.role === 'teacher').length,
        students: users.filter(u => u.role === 'student').length
    };

    if (loading) {
        return <LoadingSpinner fullPage text="Loading users..." />;
    }

    return (
        <div className="admin-users">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="page-subtitle">{stats.total} total users</p>
                </div>
            </div>

            {/* Stats */}
            <div className="user-stats">
                <div className="stat-box" onClick={() => setFilter('all')}>
                    <span className="stat-number">{stats.total}</span>
                    <span className="stat-label">Total</span>
                </div>
                <div className="stat-box" onClick={() => setFilter('admin')}>
                    <span className="stat-number">{stats.admins}</span>
                    <span className="stat-label">Admins</span>
                </div>
                <div className="stat-box" onClick={() => setFilter('teacher')}>
                    <span className="stat-number">{stats.teachers}</span>
                    <span className="stat-label">Teachers</span>
                </div>
                <div className="stat-box" onClick={() => setFilter('student')}>
                    <span className="stat-number">{stats.students}</span>
                    <span className="stat-label">Students</span>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-tab ${filter === 'admin' ? 'active' : ''}`}
                    onClick={() => setFilter('admin')}
                >
                    Admins
                </button>
                <button
                    className={`filter-tab ${filter === 'teacher' ? 'active' : ''}`}
                    onClick={() => setFilter('teacher')}
                >
                    Teachers
                </button>
                <button
                    className={`filter-tab ${filter === 'student' ? 'active' : ''}`}
                    onClick={() => setFilter('student')}
                >
                    Students
                </button>
            </div>

            {/* User List */}
            {filteredUsers.length === 0 ? (
                <EmptyState
                    icon="users"
                    title="No users found"
                    description={filter !== 'all' ? `No ${filter}s in the system` : 'No users yet'}
                />
            ) : (
                <div className="user-list">
                    {filteredUsers.map((user) => (
                        <Card key={user.id} className={`user-card ${!user.is_active ? 'inactive' : ''}`}>
                            <div className="user-content">
                                <div className="user-info">
                                    <div className="user-header">
                                        <h3 className="user-name">{user.name}</h3>
                                        <Badge
                                            status={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            size="small"
                                            variant={getRoleBadgeColor(user.role)}
                                        />
                                    </div>
                                    <p className="user-email">
                                        <Mail size={14} />
                                        {user.email}
                                    </p>
                                    {!user.is_active && (
                                        <p className="inactive-label">Inactive</p>
                                    )}
                                </div>
                                <div className="user-actions">
                                    <Button
                                        variant="ghost"
                                        size="small"
                                        onClick={() => openEditModal(user)}
                                    >
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="small"
                                        onClick={() => toggleUserActive(user.id, user.is_active)}
                                    >
                                        {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Edit User</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    disabled
                                    className="disabled"
                                />
                                <p className="form-hint">Email cannot be changed</p>
                            </div>

                            <div className="form-group">
                                <label htmlFor="role">Role</label>
                                <select
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <Button variant="ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" loading={saving}>
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminUsers;
