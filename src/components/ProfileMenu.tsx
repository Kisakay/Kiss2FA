import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Save, Camera, Key, Copy, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, changeUserPassword, deleteUserAccount, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'danger'>('general');
  const [name, setName] = useState(user?.name || '');
  const [logo, setLogo] = useState<string | null>(user?.logo || null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginIdCopied, setLoginIdCopied] = useState(false);
  
  const [generalMessage, setGeneralMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dangerMessage, setDangerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // État pour la boîte de dialogue de confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setLogo(user.logo || null);
    }
  }, [user]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('general');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setDeletePassword('');
      setGeneralMessage(null);
      setSecurityMessage(null);
      setDangerMessage(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogo(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralMessage(null);
    
    try {
      const result = await updateProfile({ name, logo: logo || undefined });
      
      if (result.success) {
        setGeneralMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        setGeneralMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      setGeneralMessage({ type: 'error', text: 'An error occurred while updating profile' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSecurityMessage(null);
    
    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'New passwords do not match' });
      setIsLoading(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await changeUserPassword(currentPassword, newPassword);
      
      if (result.success) {
        setSecurityMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setSecurityMessage({ type: 'error', text: result.error || 'Failed to change password' });
      }
    } catch (error) {
      setSecurityMessage({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyLoginId = () => {
    if (user?.loginId) {
      navigator.clipboard.writeText(user.loginId);
      setLoginIdCopied(true);
      setTimeout(() => setLoginIdCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium border-b-2 min-w-[100px] ${
              activeTab === 'general'
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium border-b-2 min-w-[100px] ${
              activeTab === 'security'
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent'
            }`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium border-b-2 min-w-[100px] ${
              activeTab === 'danger'
                ? 'text-red-600 dark:text-red-400 border-red-600 dark:border-red-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent'
            }`}
            onClick={() => setActiveTab('danger')}
          >
            Danger Zone
          </button>
        </div>
        
        <div className="p-4">
          {activeTab === 'general' && (
            <form onSubmit={handleProfileUpdate}>
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  {logo ? (
                    <img 
                      src={logo} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                      {name ? name.charAt(0).toUpperCase() : 'V'}
                    </div>
                  )}
                  <label 
                    htmlFor="logo-upload" 
                    className="absolute bottom-0 right-0 bg-gray-100 dark:bg-gray-700 p-2 rounded-full cursor-pointer border-2 border-white dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Camera className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    <input 
                      id="logo-upload" 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>
                </div>
                
                <div className="flex items-center mb-2 w-full max-w-xs">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono text-sm overflow-x-auto truncate">
                    {user?.loginId || 'No ID'}
                  </div>
                  <button 
                    type="button"
                    onClick={copyLoginId}
                    className="ml-2 p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    {loginIdCopied ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This is your unique login ID. Keep it safe.
                </p>
              </div>
              
              {generalMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  generalMessage.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}>
                  {generalMessage.text}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vault Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter vault name"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange}>
              {securityMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  securityMessage.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}>
                  {securityMessage.text}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter current password"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="newPassword" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter new password"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Password must be at least 6 characters long
                </p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Confirm new password"
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Changing...' : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          
          {activeTab === 'danger' && (
            <div>
              {dangerMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  dangerMessage.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}>
                  {dangerMessage.text}
                </div>
              )}
              
              <div className="mb-6 p-4 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="flex items-start">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      Deleting your account is permanent. All your data, including your vault entries, will be permanently deleted.
                      This action cannot be undone.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Boîte de dialogue de confirmation */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                      <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Confirm Account Deletion</h3>
                    </div>
                    
                    <div className="p-4">
                      <p className="mb-4 text-gray-700 dark:text-gray-300">
                        Please enter your password to confirm that you want to permanently delete your account.
                      </p>
                      
                      <div className="mb-4">
                        <label htmlFor="deletePassword" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Password
                        </label>
                        <input
                          type="password"
                          id="deletePassword"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeletePassword('');
                          }}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!deletePassword) {
                              setDangerMessage({ type: 'error', text: 'Password is required' });
                              return;
                            }
                            
                            setIsLoading(true);
                            setDangerMessage(null);
                            
                            try {
                              const result = await deleteUserAccount(deletePassword);
                              
                              if (result.success) {
                                // Compte supprimé avec succès, fermer le modal et rediriger
                                onClose();
                                await logout();
                                // La redirection se fera automatiquement via le contexte d'authentification
                              } else {
                                setDangerMessage({ type: 'error', text: result.error || 'Failed to delete account' });
                                setShowDeleteConfirm(false);
                              }
                            } catch (error) {
                              setDangerMessage({ type: 'error', text: 'An error occurred while deleting account' });
                              setShowDeleteConfirm(false);
                            } finally {
                              setIsLoading(false);
                              setDeletePassword('');
                            }
                          }}
                          disabled={isLoading || !deletePassword}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Deleting...' : 'Delete My Account'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileMenu;
