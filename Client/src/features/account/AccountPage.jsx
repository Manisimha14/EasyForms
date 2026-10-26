import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Banner } from '../../components/ui/Banner';
import { User, Lock, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function AccountPage() {
  const { user, updateUser, changePassword, deleteAccount } = useAuth();
  const navigate = useNavigate();

  // Name state
  const [name, setName] = useState(user?.name || '');
  const [nameLoading, setNameLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setNameLoading(true);
    try {
      await updateUser(name.trim());
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update name');
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password changed. All other sessions have been signed out.');
    } catch (err) {
      if (err.status === 401) {
        setPasswordError('Current password is incorrect.');
      } else {
        setPasswordError(err.message || 'Failed to update password.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setDeleteLoading(true);

    try {
      await deleteAccount(deletePassword);
      toast.success('Your account has been deleted.');
      navigate('/register', { replace: true });
    } catch (err) {
      if (err.status === 401) {
        setDeleteError('Incorrect password. Account deletion aborted.');
      } else {
        setDeleteError(err.message || 'Failed to delete account.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details and security preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Card */}
        <Card>
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Personal Profile
              </h2>
              <p className="text-xs text-slate-500">
                Update how your name appears on your account
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateName} className="space-y-4 max-w-md">
            <Input
              label="Email address"
              id="account-email"
              value={user?.email || ''}
              disabled
              description="Email address cannot be changed."
            />

            <Input
              label="Full Name"
              id="account-name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={nameLoading}
            >
              Save Profile
            </Button>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card>
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Change Password
              </h2>
              <p className="text-xs text-slate-500">
                Changing your password signs out all other active sessions
              </p>
            </div>
          </div>

          {passwordError && (
            <Banner type="error" className="mb-4 max-w-md">
              {passwordError}
            </Banner>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              id="curr-pass"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <Input
              label="New Password"
              id="new-pass"
              type="password"
              required
              placeholder="Minimum 8 characters with letter & number"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="secondary"
              isLoading={passwordLoading}
            >
              Update Password
            </Button>
          </form>
        </Card>

        {/* Danger Zone: Delete Account */}
        <Card className="border-rose-200 bg-rose-50/20">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-rose-100">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-rose-900">
                Danger Zone
              </h2>
              <p className="text-xs text-rose-600">
                Permanent actions that cannot be undone
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-4 max-w-lg leading-relaxed">
            Deleting your account will immediately remove all your created forms,
            question schemas, submitted responses, and analytics permanently.
          </p>

          <Button
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete Account
          </Button>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account Permanently"
        description="Are you absolutely sure? This action cannot be reversed."
      >
        <div className="space-y-4">
          <Banner type="warning">
            All your forms and responses will be permanently deleted from the database.
          </Banner>

          {deleteError && <Banner type="error">{deleteError}</Banner>}

          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <Input
              label="Confirm your password to proceed"
              id="del-password"
              type="password"
              required
              placeholder="Enter your current password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                isLoading={deleteLoading}
              >
                Permanently Delete
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
}
