import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  fetchPatients, 
  createPatient, 
  updatePatient, 
  deletePatient 
} from '../store/slices/patientSlice';
import { 
  Plus, 
  Search, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle,
  Loader2,
  Calendar,
  Phone,
  UserCheck
} from 'lucide-react';

const Patients: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const { items: patients, loading, error } = useAppSelector((state) => state.patients);
  const { user } = useAppSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [medId, setMedId] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  const openAddModal = () => {
    setEditingPatientId(null);
    setFirstName('');
    setLastName('');
    setMedId('');
    setDob('');
    setGender('female');
    setPhone('');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingPatientId(p.id);
    setFirstName(p.first_name);
    setLastName(p.last_name);
    setMedId(p.medical_identifier);
    setDob(p.date_of_birth.substring(0, 10)); // Format date for input
    setGender(p.gender);
    setPhone(p.phone || '');
    setNotes(p.notes || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      first_name: firstName,
      last_name: lastName,
      medical_identifier: medId,
      date_of_birth: dob,
      gender,
      phone: phone || undefined,
      notes: notes || undefined,
    };

    if (editingPatientId) {
      await dispatch(updatePatient({ id: editingPatientId, data }));
    } else {
      await dispatch(createPatient(data));
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this patient? This action is permanent and deletes all associated prediction records.')) {
      dispatch(deletePatient(id));
    }
  };

  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const identifier = p.medical_identifier.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || identifier.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Patients</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Find patient records and open details to launch clinical predictions.</p>
        </div>
        {user?.role !== 'patient' && (
          <button
            onClick={openAddModal}
            className="clinical-button-primary self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            New Patient
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="clinical-card flex p-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            placeholder="Search patient name or medical ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clinical-input pl-10"
          />
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="clinical-empty">
          No patients found matching your search.
        </div>
      ) : (
        <div className="clinical-table">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Medical Identifier</th>
                  <th className="px-6 py-4">Date of Birth</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 dark:divide-slate-800/70 dark:text-slate-300">
                {filteredPatients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-950 dark:text-white">
                      {patient.first_name} {patient.last_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {patient.medical_identifier}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(patient.date_of_birth).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {patient.gender}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {patient.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(patient)}
                          className="p-2 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Edit patient"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Delete patient"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/10"
                        >
                          Details
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Patient Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingPatientId ? 'Edit Patient Profile' : 'New Patient'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* First name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {/* Last name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Medical ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Medical Identifier</label>
                <input
                  type="text"
                  required
                  value={medId}
                  onChange={(e) => setMedId(e.target.value)}
                  placeholder="e.g. PAT-982-X"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* DOB */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Date of Birth</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gender</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <UserCheck className="h-4 w-4" />
                    </span>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 appearance-none"
                    >
                      <option value="female" className="bg-slate-900">Female</option>
                      <option value="male" className="bg-slate-900">Male</option>
                      <option value="other" className="bg-slate-900">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Clinical Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Chronic conditions, allergies, or diagnostic reminders..."
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm shadow shadow-indigo-600/10 transition-colors"
                >
                  {editingPatientId ? 'Save Changes' : 'Create Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
