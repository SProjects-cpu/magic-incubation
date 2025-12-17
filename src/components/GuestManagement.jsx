import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

export default function GuestManagement() {
  const [guests, setGuests] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGuest, setNewGuest] = useState({ username: '', password: '', email: '' });
  const [showPasswords, setShowPasswords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      setLoading(true);
      setError(null);
      const guestData = await api.getGuests();
      setGuests(guestData);
    } catch (err) {
      console.error('Error loading guests:', err);
      setError(err.message || 'Failed to load guests');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    
    // Validate
    if (newGuest.username.toLowerCase() === 'admin') {
      alert('Cannot use "admin" as guest username');
      return;
    }

    if (newGuest.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const guest = await api.createGuest({
        username: newGuest.username,
        password: newGuest.password,
        email: newGuest.email || undefined
      });

      setGuests([...guests, guest.guest || guest]);
      setNewGuest({ username: '', password: '', email: '' });
      setShowAddForm(false);
      alert('Guest account created successfully!');
    } catch (err) {
      console.error('Error creating guest:', err);
      alert(err.message || 'Failed to create guest');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGuest = async (id) => {
    if (!confirm('Are you sure you want to delete this guest account?')) {
      return;
    }

    try {
      await api.deleteGuest(id);
      setGuests(guests.filter(g => g.id !== id));
    } catch (err) {
      console.error('Error deleting guest:', err);
      alert(err.message || 'Failed to delete guest');
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-magic-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading guests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Guest Accounts</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage view-only guest access
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 magic-gradient text-white px-4 py-2 rounded-xl font-semibold shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span>Add Guest</span>
        </motion.button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button 
            onClick={loadGuests}
            className="mt-2 text-sm text-red-700 dark:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Guest List */}
      <div className="space-y-3">
        {guests.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <UserPlus className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No guest accounts yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Click "Add Guest" to create one
            </p>
          </div>
        ) : (
          guests.map(guest => (
            <motion.div
              key={guest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{guest.name || guest.username}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span>Username: <span className="font-medium">{guest.username}</span></span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      guest.isActive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {guest.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Created: {new Date(guest.createdAt).toLocaleDateString()}
                    {guest.lastLogin && ` • Last login: ${new Date(guest.lastLogin).toLocaleDateString()}`}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDeleteGuest(guest.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Guest Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Add Guest Account
              </h3>

              <form onSubmit={handleAddGuest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={newGuest.username}
                    onChange={(e) => setNewGuest({ ...newGuest, username: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
                    placeholder="e.g., guest1"
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password * (min 6 characters)
                  </label>
                  <input
                    type="text"
                    value={newGuest.password}
                    onChange={(e) => setNewGuest({ ...newGuest, password: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
                    placeholder="Enter password (min 6 chars)"
                    required
                    minLength={6}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
                    placeholder="guest@example.com"
                    disabled={saving}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> Guest accounts have view-only access. They cannot add, edit, or delete any data.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddForm(false)}
                    disabled={saving}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={saving}
                    className="flex-1 magic-gradient text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Guest'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
