
import React, { useState } from 'react';
import { TeamMember } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface TeamManagementProps {
  members: TeamMember[];
  onAddMember: (member: TeamMember) => void;
  onUpdateMember: (member: TeamMember) => void;
  onDeleteMember: (id: string) => void;
}

const INITIAL_MEMBER_FORM = {
  name: '',
  role: '',
  skills: '',
  avatar: ''
};

export const TeamManagement: React.FC<TeamManagementProps> = ({ members, onAddMember, onUpdateMember, onDeleteMember }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_MEMBER_FORM);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(INITIAL_MEMBER_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      role: member.role,
      skills: member.skills.join(', '),
      avatar: member.avatar
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.role) return;

    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
    const avatarUrl = formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`;

    const memberData: TeamMember = {
      id: editingId || crypto.randomUUID(),
      name: formData.name,
      role: formData.role,
      skills: skillsArray,
      avatar: avatarUrl
    };

    if (editingId) {
      onUpdateMember(memberData);
    } else {
      onAddMember(memberData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, member: TeamMember) => {
    e.stopPropagation();
    setMemberToDelete(member);
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      try {
        onDeleteMember(memberToDelete.id);
      } catch (e) {
        console.error("Error deleting member", e);
        alert("Failed to delete team member.");
      }
      setMemberToDelete(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Team Directory</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your team members, roles, and skill sets.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {members.map(member => (
          <div key={member.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center text-center relative group hover:shadow-md transition-shadow">
            
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                onClick={() => openEditModal(member)} 
                className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white dark:bg-slate-700 rounded-full shadow-sm border border-slate-100 dark:border-slate-600"
                aria-label={`Edit ${member.name}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button 
                onClick={(e) => handleDeleteClick(e, member)}
                className="p-1.5 text-slate-400 hover:text-red-600 bg-white dark:bg-slate-700 rounded-full shadow-sm border border-slate-100 dark:border-slate-600"
                aria-label={`Delete ${member.name}`}
              >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>

            <img 
              src={member.avatar} 
              alt={member.name} 
              className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-slate-700 border-2 border-white dark:border-slate-600 shadow-sm mb-4 object-cover"
            />
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">{member.name}</h3>
            <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm mb-4">{member.role}</p>
            
            <div className="flex flex-wrap gap-2 justify-center mt-auto">
              {member.skills.map((skill, idx) => (
                <span key={idx} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-md font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <p>No team members found. Add one to get started.</p>
          </div>
        )}
      </div>

      <DeleteConfirmModal 
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={confirmDelete}
        title="Remove Team Member?"
        message="This will remove the member from your team and all their assigned tasks. This action cannot be undone."
        itemName={memberToDelete?.name}
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-member-title">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                <h3 id="modal-member-title" className="text-white font-bold text-lg">{editingId ? 'Edit Member' : 'Add New Member'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-indigo-200 hover:text-white" aria-label="Close modal">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="p-6 space-y-4">
               {/* Form fields remain unchanged */}
               <div>
                  <label htmlFor="member-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input 
                    id="member-name"
                    type="text" 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
               </div>
               <div>
                  <label htmlFor="member-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role / Job Title</label>
                  <input 
                    id="member-role"
                    type="text" 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Senior Developer"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  />
               </div>
               <div>
                  <label htmlFor="member-skills" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Skills (comma separated)</label>
                  <input 
                    id="member-skills"
                    type="text" 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. React, Node.js, Design"
                    value={formData.skills}
                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  />
               </div>
               <div>
                  <label htmlFor="member-avatar" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Avatar URL (Optional)</label>
                  <input 
                    id="member-avatar"
                    type="text" 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Leave blank to auto-generate"
                    value={formData.avatar}
                    onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                  />
               </div>

               <div className="pt-4 flex justify-end gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.role}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50"
                  >
                    {editingId ? 'Save Changes' : 'Add Member'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
