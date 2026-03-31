import React, { useState } from 'react';
import { X, User, Save, Loader2, Camera, Mail, ShieldCheck } from 'lucide-react';
import { auth } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { toast } from 'sonner';

interface ProfileModalProps {
  user: any;
  isDemo?: boolean;
  onClose: () => void;
  onUpdate?: (data: { displayName: string; photoURL: string }) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, isDemo, onClose, onUpdate }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      if (onUpdate) onUpdate({ displayName, photoURL });
      toast.success('Demo profile updated! ✨');
      onClose();
      return;
    }
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile(user, {
        displayName,
        photoURL
      });
      if (onUpdate) onUpdate({ displayName, photoURL });
      toast.success('Profile updated successfully! ✨');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
      <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="relative group mb-4">
            <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 overflow-hidden border-4 border-white shadow-lg">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={48} />
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-md text-gray-600 hover:text-emerald-600 transition-colors border border-gray-100">
              <Camera size={18} />
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <p className="text-gray-500 text-sm">Customize your gardener profile</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="Your name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
              Email Address
            </label>
            <div className="relative opacity-60">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                disabled
                value={user?.email || ''}
                className="w-full bg-gray-100 border-none rounded-2xl pl-12 pr-4 py-3 text-sm cursor-not-allowed"
              />
              <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 ml-1">Email cannot be changed for security reasons.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
              Profile Image URL
            </label>
            <div className="relative">
              <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="url" 
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
