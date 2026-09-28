import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getAdminStats,
  getAdminUsers,
  getAdminRestaurants,
  approveRestaurant,
  toggleFeaturedRestaurant,
  getAdminOrders,
  updateAdminOrderStatus,
} from '../services/adminService';
import toast from 'react-hot-toast';
import { FaUsers, FaStore, FaClipboardList, FaRupeeSign } from 'react-icons/fa';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

const ROLE_BADGES = {
  USER: 'bg-muted text-foreground dark:text-muted-foreground',
  RESTAURANT_OWNER: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
  </div>
);

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);

  const [users, setUsers] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);

  const [restaurants, setRestaurants] = useState(null);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);

  const [orders, setOrders] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [approvingId, setApprovingId] = useState(null);
  const [featuringId, setFeaturingId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('userData');
    if (!stored) { navigate('/'); return; }
    const user = JSON.parse(stored);
    if (user.role !== 'ADMIN') {
      toast.error('Admin access required');
      navigate('/home');
      return;
    }
    loadStats();
    loadTab('users');
  }, []);

  const loadStats = async () => {
    try {
      const res = await getAdminStats();
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load stats');
    }
  };

  const loadTab = async (tab) => {
    if (tab === 'users' && users === null) {
      setUsersLoading(true);
      try {
        const res = await getAdminUsers();
        setUsers(res.data.users || []);
      } catch { toast.error('Failed to load users'); }
      finally { setUsersLoading(false); }
    } else if (tab === 'restaurants' && restaurants === null) {
      setRestaurantsLoading(true);
      try {
        const res = await getAdminRestaurants();
        setRestaurants(res.data.restaurants || []);
      } catch { toast.error('Failed to load restaurants'); }
      finally { setRestaurantsLoading(false); }
    } else if (tab === 'orders' && orders === null) {
      setOrdersLoading(true);
      try {
        const res = await getAdminOrders();
        setOrders(res.data.orders || []);
      } catch { toast.error('Failed to load orders'); }
      finally { setOrdersLoading(false); }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    loadTab(tab);
  };

  const handleApprove = async (id, approved) => {
    setApprovingId(id);
    try {
      await approveRestaurant(id, approved);
      toast.success(approved ? 'Restaurant approved' : 'Restaurant rejected');
      setRestaurants((prev) =>
        prev.map((r) => r.id === id ? { ...r, isApproved: approved } : r)
      );
    } catch { toast.error('Failed to update restaurant'); }
    finally { setApprovingId(null); }
  };

  const handleFeatured = async (id, featured) => {
    setFeaturingId(id);
    try {
      await toggleFeaturedRestaurant(id, featured);
      toast.success(featured ? 'Restaurant featured on home' : 'Removed from featured');
      setRestaurants((prev) =>
        prev.map((r) => r.id === id ? { ...r, isFeatured: featured } : r)
      );
    } catch { toast.error('Failed to update featured status'); }
    finally { setFeaturingId(null); }
  };

  const handleStatusChange = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    try {
      await updateAdminOrderStatus(orderId, status);
      toast.success('Order status updated');
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status } : o)
      );
    } catch { toast.error('Failed to update order status'); }
    finally { setUpdatingOrderId(null); }
  };

  const tabs = [
    { key: 'users', label: 'Users', icon: <FaUsers /> },
    { key: 'restaurants', label: 'Restaurants', icon: <FaStore /> },
    { key: 'orders', label: 'Orders', icon: <FaClipboardList /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <Link to="/home" className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 text-sm">
            ← Back to App
          </Link>
          <h1 className="text-2xl font-bold text-foreground">🛡️ Admin Panel</h1>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-500 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Users</p>
                <p className="text-3xl font-bold mt-1">{stats?.users ?? '—'}</p>
              </div>
              <FaUsers className="text-4xl text-blue-200 opacity-70" />
            </div>
          </div>
          <div className="bg-primary/50 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary/80 text-xs font-medium uppercase tracking-wide">Restaurants</p>
                <p className="text-3xl font-bold mt-1">{stats?.restaurants ?? '—'}</p>
              </div>
              <FaStore className="text-4xl text-primary/70 opacity-70" />
            </div>
          </div>
          <div className="bg-purple-500 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">Orders</p>
                <p className="text-3xl font-bold mt-1">{stats?.orders ?? '—'}</p>
              </div>
              <FaClipboardList className="text-4xl text-purple-200 opacity-70" />
            </div>
          </div>
          <div className="bg-green-500 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium uppercase tracking-wide">Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  ₹{stats ? (stats.revenue / 100).toLocaleString('en-IN') : '—'}
                </p>
              </div>
              <FaRupeeSign className="text-4xl text-green-200 opacity-70" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              {usersLoading ? <Spinner /> : !users ? null : users.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No users found</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Name</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Email</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Role</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Phone</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-muted">
                        <td className="px-6 py-4 font-medium text-foreground">{u.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ROLE_BADGES[u.role] || ROLE_BADGES.USER}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{u.phone || '—'}</td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {new Date(u.createdAt).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Restaurants Tab */}
          {activeTab === 'restaurants' && (
            <div className="overflow-x-auto">
              {restaurantsLoading ? <Spinner /> : !restaurants ? null : restaurants.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No restaurants found</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Name</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">City</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Owner</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Orders</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Approved</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Featured</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Open</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {restaurants.map((r) => (
                      <tr key={r.id} className="hover:bg-muted">
                        <td className="px-6 py-4 font-medium text-foreground">{r.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{r.city}</td>
                        <td className="px-6 py-4 text-muted-foreground">{r.owner?.name || '—'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{r._count?.orders || 0}</td>
                        <td className="px-6 py-4">
                          {r.isApproved ? (
                            <span className="text-green-600 font-semibold text-xs">✓ Approved</span>
                          ) : (
                            <span className="text-yellow-600 font-semibold text-xs">⏳ Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {r.isFeatured ? (
                            <span className="text-amber-600 font-semibold text-xs">⭐ Featured</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.isOpen ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-muted text-muted-foreground dark:text-muted-foreground'}`}>
                            {r.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex flex-wrap items-center gap-2">
                          {!r.isApproved ? (
                            <button
                              onClick={() => handleApprove(r.id, true)}
                              disabled={approvingId === r.id}
                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApprove(r.id, false)}
                              disabled={approvingId === r.id}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                          {r.isApproved && (
                            <button
                              onClick={() => handleFeatured(r.id, !r.isFeatured)}
                              disabled={featuringId === r.id}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                                r.isFeatured
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  : 'bg-primary/10 text-primary hover:bg-primary/20'
                              }`}
                            >
                              {r.isFeatured ? 'Unfeature' : 'Feature'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="overflow-x-auto">
              {ordersLoading ? <Spinner /> : !orders ? null : orders.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No orders found</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Order ID</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Customer</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Restaurant</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Items</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Total</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left px-6 py-3 text-muted-foreground font-medium">Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-muted">
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-foreground">{o.user?.name || '—'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{o.restaurant?.name || '—'}</td>
                        <td className="px-6 py-4 text-muted-foreground max-w-[160px] truncate">
                          {o.items?.map((i) => `${i.menuItem?.name} ×${i.quantity}`).join(', ')}
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          ₹{(o.totalAmount / 100).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            o.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : o.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : o.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : o.status === 'PREPARING' ? 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary/70'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            disabled={updatingOrderId === o.id}
                            className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card text-foreground focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
