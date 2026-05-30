import { useState } from "react";
import { motion } from "framer-motion";
import useAuthStore from "../../stores/authStore";
import { showToast } from "../common/Toast";
import { FiX, FiUser, FiSave } from "react-icons/fi";

export default function ProfileModal({ onClose }) {
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    const success = await updateProfile({ display_name: displayName.trim() });
    setSaving(false);
    if (success) {
      showToast("Profile updated!", "success");
      onClose();
    } else {
      showToast("Failed to update profile", "error");
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-card profile-modal"
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3><FiUser /> Edit Profile</h3>
          <button className="modal-close-btn" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {displayName?.[0]?.toUpperCase() || "U"}
            </div>
          </div>

          <div className="modal-field">
            <label>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              autoFocus
              maxLength={50}
            />
          </div>

          <div className="modal-field">
            <label>Email</label>
            <input
              type="text"
              value={profile?.email || ""}
              disabled
              className="input-disabled"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-submit" disabled={saving || !displayName.trim()}>
              <FiSave /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
