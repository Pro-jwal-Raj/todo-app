import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useGroupStore from "../../stores/groupStore";
import useAuthStore from "../../stores/authStore";
import { showToast } from "../common/Toast";
import {
  FiPlus,
  FiUsers,
  FiCopy,
  FiLogOut,
  FiTrash2,
  FiUserPlus,
  FiBriefcase,
  FiHome,
  FiBook,
  FiGrid,
} from "react-icons/fi";
import GroupChat from "./GroupChat";

const GROUP_TYPE_ICONS = {
  business: <FiBriefcase />,
  family: <FiHome />,
  students: <FiBook />,
  custom: <FiGrid />,
};

const GROUP_TYPE_LABELS = {
  business: "Business",
  family: "Family",
  students: "Students",
  custom: "Custom",
};

export default function GroupsPanel() {
  const groups = useGroupStore((s) => s.groups);
  const activeGroup = useGroupStore((s) => s.activeGroup);
  const members = useGroupStore((s) => s.members);
  const fetchGroups = useGroupStore((s) => s.fetchGroups);
  const fetchMembers = useGroupStore((s) => s.fetchMembers);
  const createGroup = useGroupStore((s) => s.createGroup);
  const joinGroup = useGroupStore((s) => s.joinGroup);
  const leaveGroup = useGroupStore((s) => s.leaveGroup);
  const deleteGroup = useGroupStore((s) => s.deleteGroup);
  const setActiveGroup = useGroupStore((s) => s.setActiveGroup);

  const user = useAuthStore((s) => s.user);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("custom");
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (activeGroup) {
      fetchMembers(activeGroup.id);
    }
  }, [activeGroup]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const result = await createGroup(newName, newDesc, newType);
      if (result.group) {
        showToast(`Group "${result.group.name}" created!`, "success");
        setShowCreate(false);
        setNewName("");
        setNewDesc("");
        setNewType("custom");
      } else {
        showToast(result.error || "Failed to create group", "error");
      }
    } catch (err) {
      showToast("Failed to create group: " + (err.message || "Unknown error"), "error");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim() || joining) return;
    setJoining(true);
    try {
      const result = await joinGroup(inviteCode);
      if (result.success) {
        showToast(`Joined "${result.groupName}"!`, "success");
        setShowJoin(false);
        setInviteCode("");
      } else {
        showToast(result.error || "Failed to join group", "error");
      }
    } catch (err) {
      showToast("Failed to join group: " + (err.message || "Unknown error"), "error");
    } finally {
      setJoining(false);
    }
  };

  const handleCopyInvite = (code) => {
    navigator.clipboard.writeText(code);
    showToast("Invite code copied!", "success");
  };

  const handleLeave = async (groupId, groupName) => {
    if (confirm(`Leave "${groupName}"? You'll lose access to shared tasks.`)) {
      await leaveGroup(groupId);
      showToast(`Left "${groupName}"`, "info");
    }
  };

  const handleDelete = async (groupId, groupName) => {
    if (confirm(`Delete "${groupName}"? This will remove all members and shared tasks.`)) {
      await deleteGroup(groupId);
      showToast(`Deleted "${groupName}"`, "error");
    }
  };

  const currentMembers = activeGroup ? members[activeGroup.id] || [] : [];

  return (
    <div className="groups-panel">
      <div className="groups-header">
        <h2><FiUsers /> Groups</h2>
        <div className="groups-actions">
          <motion.button
            className="group-action-btn create"
            onClick={() => setShowCreate(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus /> Create
          </motion.button>
          <motion.button
            className="group-action-btn join"
            onClick={() => setShowJoin(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiUserPlus /> Join
          </motion.button>
        </div>
      </div>

      {/* Group selector */}
      <div className="groups-list">
        <button
          className={`group-item ${!activeGroup ? "active" : ""}`}
          onClick={() => setActiveGroup(null)}
        >
          <span className="group-icon">👤</span>
          <span className="group-name">Personal Tasks</span>
        </button>

        {groups.map((group) => (
          <button
            key={group.id}
            className={`group-item ${activeGroup?.id === group.id ? "active" : ""}`}
            onClick={() => setActiveGroup(group)}
          >
            <span className="group-icon">{GROUP_TYPE_ICONS[group.type]}</span>
            <span className="group-name">{group.name}</span>
            <span className="group-role-badge">{group.myRole}</span>
          </button>
        ))}
      </div>

      {/* Active group details */}
      {activeGroup && (
        <motion.div
          className="group-details"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="group-detail-header">
            <div>
              <h3>{activeGroup.name}</h3>
              <span className="group-type-label">
                {GROUP_TYPE_ICONS[activeGroup.type]} {GROUP_TYPE_LABELS[activeGroup.type]}
              </span>
            </div>
            <div className="group-detail-actions">
              <button
                className="invite-code-btn"
                onClick={() => handleCopyInvite(activeGroup.invite_code)}
                title="Copy invite code"
              >
                <FiCopy /> {activeGroup.invite_code}
              </button>
              {activeGroup.myRole === "owner" ? (
                <button
                  className="group-danger-btn"
                  onClick={() => handleDelete(activeGroup.id, activeGroup.name)}
                >
                  <FiTrash2 /> Delete
                </button>
              ) : (
                <button
                  className="group-danger-btn"
                  onClick={() => handleLeave(activeGroup.id, activeGroup.name)}
                >
                  <FiLogOut /> Leave
                </button>
              )}
            </div>
          </div>

          <div className="group-members-section">
            <h4>Members ({currentMembers.length})</h4>
            <div className="members-list">
              {currentMembers.map((member) => (
                <div key={member.id} className="member-item">
                  <div className="member-avatar">
                    {member.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="member-info">
                    <span className="member-name">
                      {member.display_name}
                      {member.id === user?.id && " (You)"}
                    </span>
                    <span className="member-role">{member.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group Chat */}
          <GroupChat groupId={activeGroup.id} groupName={activeGroup.name} />
        </motion.div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              className="modal-card"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Create Group</h3>
              <form onSubmit={handleCreate}>
                <div className="modal-field">
                  <label>Group Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Marketing Team"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="modal-field">
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="What's this group for?"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label>Type</label>
                  <div className="group-type-selector">
                    {Object.entries(GROUP_TYPE_LABELS).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        className={`type-option ${newType === type ? "active" : ""}`}
                        onClick={() => setNewType(type)}
                      >
                        {GROUP_TYPE_ICONS[type]} {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-cancel" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Group"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Modal */}
      <AnimatePresence>
        {showJoin && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowJoin(false)}
          >
            <motion.div
              className="modal-card"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Join Group</h3>
              <p className="modal-desc">Enter the invite code shared by a group admin.</p>
              <form onSubmit={handleJoin}>
                <div className="modal-field">
                  <label>Invite Code</label>
                  <input
                    type="text"
                    placeholder="e.g. a3f2b1c9d0e8"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-cancel" onClick={() => setShowJoin(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-submit" disabled={joining}>
                    {joining ? "Joining..." : "Join Group"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
