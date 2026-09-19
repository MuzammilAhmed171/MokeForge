import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LogoMark, IcCheck, IcSettings, IcLogout, IcArrowL } from '../icons';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile({ name });
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <header className="border-b border-line2 bg-panel/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="icon-btn">
              <IcArrowL size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <LogoMark size={32} />
              <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-disp)' }}>Profile</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn">
            <IcLogout size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Profile Section */}
        <div className="card p-8 mb-6">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-acc/20 flex items-center justify-center text-acc text-3xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input text-2xl font-bold mb-2"
                  style={{ fontFamily: 'var(--font-disp)' }}
                  autoFocus
                />
              ) : (
                <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)' }}>
                  {user?.name}
                </h1>
              )}
              <p className="text-lg mb-2" style={{ color: 'var(--color-mut)' }}>
                {user?.email}
              </p>
              <div className="flex items-center gap-2">
                {user?.emailVerified ? (
                  <>
                    <IcCheck size={16} />
                    <span className="text-sm" style={{ color: 'var(--color-acc2)' }}>Email verified</span>
                  </>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--color-gold)' }}>Email not verified</span>
                )}
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="flex gap-3">
              <button onClick={handleSave} className="btn btn-acc">
                <IcCheck size={16} />
                Save Changes
              </button>
              <button onClick={() => setIsEditing(false)} className="btn">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="btn">
              <IcSettings size={16} />
              Edit Profile
            </button>
          )}

          {saved && (
            <div className="mt-4 p-3 rounded-lg border border-acc2/30 bg-acc2/10 text-acc2 text-sm anim-fade-in">
              Profile updated successfully!
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="card p-8 mb-6">
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-disp)' }}>
            Account Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--color-dim)' }}>
                User ID
              </label>
              <p className="text-sm font-mono" style={{ color: 'var(--color-mut)' }}>
                {user?.id}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--color-dim)' }}>
                Member Since
              </label>
              <p className="text-sm" style={{ color: 'var(--color-mut)' }}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--color-dim)' }}>
                Email Status
              </label>
              <p className="text-sm" style={{ color: user?.emailVerified ? 'var(--color-acc2)' : 'var(--color-gold)' }}>
                {user?.emailVerified ? 'Verified' : 'Not Verified'}
              </p>
            </div>
          </div>
        </div>

          {/* Security */}
          <div className="card p-8 mb-6">
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-disp)' }}>
              Security
            </h2>
            
            <div className="space-y-4">
              <button 
                onClick={() => navigate('/forgot-password')}
                className="btn w-full justify-between"
              >
                <span>Change Password</span>
                <IcSettings size={16} />
              </button>
              
              <button 
                className="btn w-full justify-between opacity-50 cursor-not-allowed"
                disabled
              >
                <span>Two-Factor Authentication</span>
                <span className="text-xs px-2 py-1 rounded bg-gold/20 text-gold">Coming Soon</span>
              </button>
            </div>
          </div>
        {/* Danger Zone */}
        <div className="card p-8" style={{ borderColor: 'var(--color-danger)', borderWidth: '1px' }}>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-disp)', color: 'var(--color-danger)' }}>
            Danger Zone
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-mut)' }}>
            Once you delete your account, there is no going back. Please be certain.
          </p>
          
          <button className="btn" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
            Delete Account
          </button>
          <span className="text-xs ml-3" style={{ color: 'var(--color-dim)' }}>
            (Coming Soon)
          </span>
        </div>
      </main>
    </div>
  );
}
