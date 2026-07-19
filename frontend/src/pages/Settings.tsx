import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { 
  User as UserIcon, 
  Lock, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  Camera, 
  Save, 
  ShieldAlert, 
  Loader2,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react';

interface RecurringTemplate {
  _id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  isRecurring: boolean;
  recurringFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
}

export const Settings: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs state: 'profile' | 'security' | 'recurring'
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'recurring'>('profile');

  // Profile states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePicBase64, setProfilePicBase64] = useState(user?.profilePicture || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Recurring templates state
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [recurringLoading, setRecurringLoading] = useState(false);

  // Delete account modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setProfilePicBase64(user.profilePicture || '');
    }
  }, [user]);

  // Load recurring templates when tab changes to 'recurring'
  useEffect(() => {
    if (activeTab === 'recurring') {
      fetchRecurringTemplates();
    }
  }, [activeTab]);

  const fetchRecurringTemplates = async () => {
    setRecurringLoading(true);
    try {
      // Get only recurring templates by passing isRecurring=true
      const response = await API.get('/expenses?isRecurring=true');
      setRecurringTemplates(response.data);
    } catch (err: any) {
      console.error('Error fetching recurring templates:', err);
      showToast('Failed to load recurring schedules.', 'error');
    } finally {
      setRecurringLoading(false);
    }
  };

  // Avatar Photo Handler
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image using HTML Canvas
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 180;
        const MAX_HEIGHT = 180;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
        setProfilePicBase64(compressedBase64);
        showToast('Photo uploaded! Click "Save Changes" to apply.', 'info');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Name and email fields cannot be empty.', 'error');
      return;
    }

    setProfileLoading(true);
    try {
      await API.put('/auth/profile', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        profilePicture: profilePicBase64
      });
      await refreshUser();
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to update profile details.';
      showToast(msg, 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('All password fields are required.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      await API.put('/auth/password', { currentPassword, newPassword });
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to update password.';
      showToast(msg, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const cancelRecurringSchedule = async (id: string) => {
    try {
      // Set isRecurring to false on the template
      await API.put(`/expenses/${id}`, { isRecurring: false });
      showToast('Recurring schedule cancelled.', 'success');
      fetchRecurringTemplates();
    } catch (err: any) {
      console.error('Error cancelling recurring template:', err);
      showToast('Failed to cancel schedule.', 'error');
    }
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.toLowerCase() !== 'delete my account') {
      showToast('Please type the exact phrase to confirm.', 'error');
      return;
    }

    setDeleteLoading(true);
    try {
      await API.delete('/auth/account');
      showToast('Your account was successfully deleted. Goodbye!', 'info');
      logout();
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete account. Please try again.', 'error');
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="text-sm text-app-text-muted mt-1">
          Customize your profile info, secure your credentials, and govern automated recurring logs.
        </p>
      </div>

      {/* Main Settings Grid */}
      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Navigation Sidebar Tabs */}
        <div className="glass-card rounded-2xl p-3 md:col-span-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 w-full text-left ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-brand-primary/15 to-brand-secondary/5 text-brand-primary border-l-4 border-brand-primary'
                : 'text-app-text-muted hover:bg-app-bg hover:text-app-text'
            }`}
          >
            <UserIcon className="h-4.5 w-4.5" />
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 w-full text-left ${
              activeTab === 'security'
                ? 'bg-gradient-to-r from-brand-primary/15 to-brand-secondary/5 text-brand-primary border-l-4 border-brand-primary'
                : 'text-app-text-muted hover:bg-app-bg hover:text-app-text'
            }`}
          >
            <Lock className="h-4.5 w-4.5" />
            Security & Password
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 w-full text-left ${
              activeTab === 'recurring'
                ? 'bg-gradient-to-r from-brand-primary/15 to-brand-secondary/5 text-brand-primary border-l-4 border-brand-primary'
                : 'text-app-text-muted hover:bg-app-bg hover:text-app-text'
            }`}
          >
            <RefreshCw className="h-4.5 w-4.5" />
            Recurring Payments
          </button>
        </div>

        {/* Content Box */}
        <div className="glass-card rounded-2xl p-6 md:col-span-8">
          
          {/* Tab 1: Profile Editing */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Edit Profile</h2>
                <p className="text-xs text-app-text-muted mt-0.5">Manage your identity and display avatar.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {/* Photo Upload Zone */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 border border-app-border bg-app-bg/25 rounded-2xl">
                  <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                    {profilePicBase64 ? (
                      <img
                        src={profilePicBase64}
                        alt="Profile avatar preview"
                        className="h-20 w-20 rounded-2xl object-cover border-2 border-brand-primary/30 group-hover:opacity-75 transition-all"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-2xl border-2 border-dashed border-brand-primary/30 group-hover:bg-brand-primary/15 transition-all">
                        {name ? name.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/45 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <button
                      type="button"
                      onClick={handlePhotoClick}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-app-card border border-app-border text-app-text hover:bg-app-bg transition-colors"
                    >
                      Choose New Picture
                    </button>
                    <p className="text-[10px] text-app-text-muted">
                      JPG, JPEG or PNG formats. Pictures are processed locally.
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pname" className="text-xs font-bold text-app-text-muted uppercase block mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="pname"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="pemail" className="text-xs font-bold text-app-text-muted uppercase block mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="pemail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-opacity disabled:opacity-50 min-w-[120px] justify-center"
                  >
                    {profileLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Security & Passwords */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Security Settings</h2>
                <p className="text-xs text-app-text-muted mt-0.5">Protect your authentication tokens and log in sessions.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="currpass" className="text-xs font-bold text-app-text-muted uppercase block mb-1.5">
                    Current Password
                  </label>
                  <input
                    id="currpass"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="newpass" className="text-xs font-bold text-app-text-muted uppercase block mb-1.5">
                      New Password
                    </label>
                    <input
                      id="newpass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="confpass" className="text-xs font-bold text-app-text-muted uppercase block mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      id="confpass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-opacity disabled:opacity-50 min-w-[120px] justify-center"
                  >
                    {passwordLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Danger Zone Section */}
              <div className="border-t border-app-border pt-6 mt-6">
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <ShieldAlert className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-rose-500">Danger Zone</h3>
                      <p className="text-xs text-app-text-muted leading-relaxed">
                        Permanently destroy your profile and all transaction history from our database logs. This operation is irrevocable.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end sm:justify-start sm:pl-9.5">
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="rounded-xl border border-rose-500 bg-transparent px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      Delete My Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Recurring Payments */}
          {activeTab === 'recurring' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Recurring Expenses & Income</h2>
                <p className="text-xs text-app-text-muted mt-0.5">Govern templates configured to spawn transactions automatically.</p>
              </div>

              {recurringLoading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                </div>
              ) : recurringTemplates.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-app-border rounded-2xl space-y-3.5 bg-app-bg/10">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-app-bg border border-app-border text-app-text-muted">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold">No Active Schedules</h3>
                    <p className="text-xs text-app-text-muted max-w-xs mx-auto">
                      Schedules will appear here after checking "Make Recurring" in the transaction editor.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-app-border rounded-2xl overflow-hidden divide-y divide-app-border bg-app-bg/5">
                  {recurringTemplates.map((template) => {
                    const isIncome = template.type === 'income';
                    return (
                      <div key={template._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-app-bg/25 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                            isIncome 
                              ? 'bg-emerald-500/10 text-emerald-500' 
                              : 'bg-indigo-500/10 text-brand-primary'
                          }`}>
                            {isIncome ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-app-text-muted uppercase tracking-wider block">
                              {template.category} • {template.paymentMethod}
                            </span>
                            <span className="text-sm font-bold text-app-text block">
                              {template.description}
                            </span>
                            <span className="text-[10px] text-app-text-muted block mt-0.5 font-medium">
                              Next Run: {new Date(template.nextDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-app-border/40 sm:border-0 pt-2 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <span className={`text-base font-extrabold ${isIncome ? 'text-emerald-500' : 'text-app-text'}`}>
                              {isIncome ? '+' : '-'}${template.amount.toFixed(2)}
                            </span>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-primary mt-0.5 bg-brand-primary/10 px-2 py-0.5 rounded-full text-center">
                              {template.recurringFrequency}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => cancelRecurringSchedule(template._id)}
                            className="rounded-lg p-2 text-app-text-muted hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                            title="Cancel Schedule"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative z-10 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <h3 className="text-lg font-bold text-rose-500 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Delete SpendWise Account
              </h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-bg hover:text-app-text transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <p className="text-xs text-app-text-muted leading-relaxed">
              This action will completely wipe your account and all associated transaction files. To verify, please type <span className="font-semibold text-app-text">delete my account</span> in the input below:
            </p>

            <form onSubmit={handleDeleteAccountSubmit} className="space-y-4">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete my account"
                className="w-full rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-rose-500 transition-colors"
                required
              />

              <div className="flex gap-3 justify-end border-t border-app-border pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-app-border hover:bg-app-bg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading || confirmText.toLowerCase() !== 'delete my account'}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deleteLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Delete Permanently'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
