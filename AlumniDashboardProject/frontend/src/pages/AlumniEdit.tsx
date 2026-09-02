import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Degree, Employment, Internship } from '../types/';
import { apiService } from '../../services/api';
import { ArrowLeft, Plus } from 'lucide-react';
import CollapsibleSection from '../components/CollapsibleSection';

// Local editable versions of each sub-record. `_key` is a client-only id
// used for React keys and for matching an item back to its row when the
// user edits or removes it -- it's stripped out before anything is sent
// to the backend. Items that already exist in the database keep their
// real *_id field; brand new items (added via the "+" buttons) simply
// don't have one yet, which is how the backend tells INSERT from UPDATE.
type EditableDegree = Partial<Degree> & { _key: string };
type EditableEmployment = Partial<Employment> & { _key: string };
type EditableInternship = Partial<Internship> & { _key: string };

interface EditableAlumni {
    alumni_id?: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    wildcat_id: string;
    graduation_date: string;
    degrees: EditableDegree[];
    employment: EditableEmployment[];
    internships: EditableInternship[];
}

const genKey = () =>
    (crypto as any)?.randomUUID?.() ?? Math.random().toString(36).slice(2);

const emptyAlumni: EditableAlumni = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    wildcat_id: '',
    graduation_date: '',
    degrees: [],
    employment: [],
    internships: [],
};

const inputClass =
    'w-full px-3 py-2 border border-weber-purple-light-400 rounded-md focus:outline-none focus:ring-2 focus:ring-weber-purple-300';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const sectionHeaderClass = 'text-lg font-semibold mb-6 border-b pb-2 weber-purple-40';

const AlumniEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Editing "/alumni/new/edit" creates a brand new record instead of
    // loading one -- no route changes needed, "new" just isn't a real id.
    const isNew = !id || id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [alumni, setAlumni] = useState<EditableAlumni>(emptyAlumni);

    const [deletedDegreeIds, setDeletedDegreeIds] = useState<number[]>([]);
    const [deletedEmploymentIds, setDeletedEmploymentIds] = useState<number[]>([]);
    const [deletedInternshipIds, setDeletedInternshipIds] = useState<number[]>([]);

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        if (isNew) return;

        const fetchAlumniDetails = async () => {
            try {
                setLoading(true);

                const data = await apiService.getAlumniById(Number(id));
                const a = data.alumni;

                setAlumni({
                    alumni_id: a.alumni_id,
                    first_name: a.first_name || a.temp_name || '',
                    last_name: a.last_name || '',
                    email: a.email || '',
                    phone: a.phone || '',
                    wildcat_id: a.wildcat_id || '',
                    graduation_date: a.graduation_date || '',
                    degrees: (data.degrees || []).map((d: Degree) => ({ ...d, _key: genKey() })),
                    employment: (data.employment || []).map((e: Employment) => ({ ...e, _key: genKey() })),
                    internships: (data.internships || []).map((i: Internship) => ({ ...i, _key: genKey() })),
                });
            } catch (error) {
                console.error('Error fetching alumni details:', error);
                setSaveError('Could not load this alumni record.');
            } finally {
                setLoading(false);
            }
        };

        fetchAlumniDetails();
    }, [id, isNew]);

    const handleBack = () => {
        if (isNew) navigate('/alumni');
        else navigate(`/alumni/${id}`);
    };

    const updateField = (field: keyof EditableAlumni, value: string) => {
        setAlumni((prev) => ({ ...prev, [field]: value }));
    };

    type Section = 'degrees' | 'employment' | 'internships';

    const updateArrayItem = (section: Section, key: string, field: string, value: any) => {
        setAlumni((prev) => ({
            ...prev,
            [section]: (prev[section] as any[]).map((item) =>
                item._key === key ? { ...item, [field]: value } : item
            ),
        }));
    };

    const addItem = (section: Section) => {
        setAlumni((prev) => ({
            ...prev,
            [section]: [...(prev[section] as any[]), { _key: genKey() }],
        }));
    };

    const removeItem = (section: Section, key: string, idField: string) => {
        setAlumni((prev) => {
            const items = prev[section] as any[];
            const item = items.find((i) => i._key === key);

            // Only track it as "deleted" if it already existed in the DB.
            // A newly-added-but-unsaved item just disappears from state.
            if (item?.[idField] != null) {
                if (section === 'degrees') setDeletedDegreeIds((ids) => [...ids, item[idField]]);
                if (section === 'employment') setDeletedEmploymentIds((ids) => [...ids, item[idField]]);
                if (section === 'internships') setDeletedInternshipIds((ids) => [...ids, item[idField]]);
            }

            return { ...prev, [section]: items.filter((i) => i._key !== key) };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError('');

        if (!alumni.email.trim()) {
            setSaveError('Email is required.');
            return;
        }

        const stripKey = <T extends { _key: string }>({ _key, ...rest }: T) => rest;

        const payload = {
            first_name: alumni.first_name || null,
            last_name: alumni.last_name || null,
            email: alumni.email,
            phone: alumni.phone || null,
            wildcat_id: alumni.wildcat_id || null,
            graduation_date: alumni.graduation_date || null,
            degrees: alumni.degrees.map(stripKey),
            employment: alumni.employment.map(stripKey),
            internships: alumni.internships.map(stripKey),
            deletedDegreeIds,
            deletedEmploymentIds,
            deletedInternshipIds,
        };

        try {
            setSaving(true);

            if (isNew) {
                const result = await apiService.createAlumniRecord(payload);
                navigate(`/alumni/${result.alumni_id}`);
            } else {
                await apiService.updateAlumniRecord(Number(id), payload);
                navigate(`/alumni/${id}`);
            }
        } catch (error: any) {
            console.error('Error saving alumni record:', error);
            setSaveError(
                error?.response?.data?.error ||
                'Something went wrong while saving. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <button onClick={handleBack} className="btn btn-primary flex items-center gap-2" type="button">
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>{isNew ? 'Back To Alumni Page' : 'Back To Alumni Page'}</span>
            </button>

            <div className="mt-4">
                <h1 className="text-2xl font-bold text-shadow">
                    {isNew
                        ? 'Create New Alumni Record'
                        : `Editing Record for: ${alumni.first_name} ${alumni.last_name} ${alumni.alumni_id ?? ''}`}
                </h1>
            </div>

            {saveError && (
                <p className="text-red-600 mt-3 border border-red-200 bg-red-50 rounded-md px-3 py-2">
                    {saveError}
                </p>
            )}

            <form onSubmit={handleSubmit} className="mt-4">
                <div className="col-span-1">
                    <div className="space-y-6">
                        <div className="card p-6">
                            <h2 className={sectionHeaderClass}>Identity Information</h2>

                            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                                <div className="col-span-2">
                                    <label className={labelClass}>First Name</label>
                                    <input
                                        type="text"
                                        value={alumni.first_name}
                                        onChange={(e) => updateField('first_name', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>Last Name</label>
                                    <input
                                        type="text"
                                        value={alumni.last_name}
                                        onChange={(e) => updateField('last_name', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={alumni.email}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>Phone Number</label>
                                    <input
                                        placeholder="N/A"
                                        type="text"
                                        value={alumni.phone}
                                        onChange={(e) => updateField('phone', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>Wildcat ID</label>
                                    <input
                                        type="text"
                                        value={alumni.wildcat_id}
                                        onChange={(e) => updateField('wildcat_id', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>Graduation Date</label>
                                    <input
                                        type="text"
                                        placeholder="N/A"
                                        value={alumni.graduation_date}
                                        onChange={(e) => updateField('graduation_date', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Degrees */}
                    <div className="space-y-6 mt-6">
                        <div className="card p-6">
                            <h2 className={sectionHeaderClass}>Degrees Awarded</h2>

                            {alumni.degrees.map((item) => (
                                <CollapsibleSection
                                    key={item._key}
                                    title={
                                        item.program_name || item.degree_type
                                            ? `${item.program_name || 'Untitled Program'}${item.degree_type ? ' — ' + item.degree_type : ''
                                            }`
                                            : 'New Degree'
                                    }
                                    defaultOpen={!item.alumni_degree_id}
                                    onRemove={() => removeItem('degrees', item._key, 'alumni_degree_id')}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                                        <div className="col-span-2 md:col-span-3">
                                            <label className={labelClass}>Program Name</label>
                                            <input
                                                type="text"
                                                value={item.program_name || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('degrees', item._key, 'program_name', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2 md:col-span-3">
                                            <label className={labelClass}>Department Name</label>
                                            <input
                                                type="text"
                                                value={item.department_name || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('degrees', item._key, 'department_name', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className={labelClass}>Degree Type</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. BS, MS"
                                                value={item.degree_type || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('degrees', item._key, 'degree_type', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className={labelClass}>Survey Term</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Fall"
                                                value={item.survey_term || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('degrees', item._key, 'survey_term', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className={labelClass}>Survey Year</label>
                                            <input
                                                type="text"
                                                value={item.survey_year || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('degrees', item._key, 'survey_year', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2 md:col-span-3">
                                            <label className={labelClass}>GPA</label>
                                            <input
                                                type="text"
                                                value={item.gpa || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('degrees', item._key, 'gpa', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2 md:col-span-3">
                                            <label className={labelClass}>Minor</label>
                                            <input
                                                type="text"
                                                value={item.minor || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('degrees', item._key, 'minor', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                </CollapsibleSection>
                            ))}

                            <button
                                type="button"
                                onClick={() => addItem('degrees')}
                                className="btn btn-secondary flex items-center gap-2 mt-2"
                            >
                                <Plus size={16} />
                                <span>Add Degree</span>
                            </button>
                        </div>
                    </div>

                    {/* Employment */}
                    <div className="space-y-6 mt-6">
                        <div className="card p-6">
                            <h2 className={sectionHeaderClass}>Employment Information</h2>

                            {alumni.employment.map((item) => (
                                <CollapsibleSection
                                    key={item._key}
                                    title={
                                        item.employer_name || item.job_position
                                            ? `${item.job_position || 'Untitled Role'}${item.employer_name ? ' — ' + item.employer_name : ''
                                            }`
                                            : 'New Employment Record'
                                    }
                                    defaultOpen={!item.employment_id}
                                    onRemove={() => removeItem('employment', item._key, 'employment_id')}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                                        <div className="col-span-2">
                                            <label className={labelClass}>Employer Name</label>
                                            <input
                                                type="text"
                                                value={item.employer_name || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('employment', item._key, 'employer_name', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className={labelClass}>Job Position</label>
                                            <input
                                                type="text"
                                                value={item.job_position || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('employment', item._key, 'job_position', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className={labelClass}>Salary</label>
                                            <input
                                                type="text"
                                                value={item.salary ?? ''}
                                                onChange={(e) =>
                                                    updateArrayItem('employment', item._key, 'salary', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2 md:col-span-2">
                                            <label className={labelClass}>City</label>
                                            <input
                                                type="text"
                                                value={item.city || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('employment', item._key, 'city', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2 md:col-span-2">
                                            <label className={labelClass}>State</label>
                                            <input
                                                type="text"
                                                value={item.state || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('employment', item._key, 'state', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2 md:col-span-2">
                                            <label className={labelClass}>Country</label>
                                            <input
                                                type="text"
                                                value={item.country || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('employment', item._key, 'country', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2 md:col-span-3">
                                            <label className={labelClass}>Years Experience</label>
                                            <input
                                                type="text"
                                                value={item.yrs_exp || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('employment', item._key, 'yrs_exp', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2 md:col-span-3 flex items-end pb-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={!!item.is_current}
                                                    onChange={(e) =>
                                                        updateArrayItem('employment', item._key, 'is_current', e.target.checked)
                                                    }
                                                />
                                                Current Job
                                            </label>
                                        </div>
                                    </div>
                                </CollapsibleSection>
                            ))}

                            <button
                                type="button"
                                onClick={() => addItem('employment')}
                                className="btn btn-secondary flex items-center gap-2 mt-2"
                            >
                                <Plus size={16} />
                                <span>Add Employment Record</span>
                            </button>
                        </div>
                    </div>

                    {/* Internships */}
                    <div className="space-y-6 mt-6">
                        <div className="card p-6">
                            <h2 className={sectionHeaderClass}>Internships</h2>

                            {alumni.internships.map((item) => (
                                <CollapsibleSection
                                    key={item._key}
                                    title={item.intern_business || 'New Internship'}
                                    defaultOpen={!item.internship_id}
                                    onRemove={() => removeItem('internships', item._key, 'internship_id')}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                                        <div className="col-span-2 md:col-span-3">
                                            <label className={labelClass}>Internship Company</label>
                                            <input
                                                type="text"
                                                value={item.intern_business || ''}
                                                onChange={(e) =>
                                                    updateArrayItem(
                                                        'internships',
                                                        item._key,
                                                        'intern_business',
                                                        e.target.value
                                                    )
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2 md:col-span-3">
                                            <label className={labelClass}>City</label>
                                            <input
                                                type="text"
                                                value={item.intern_city || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('internships', item._key, 'intern_city', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className={labelClass}>Start Date</label>
                                            <input
                                                type="text"
                                                value={item.start_date || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('internships', item._key, 'start_date', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className={labelClass}>End Date</label>
                                            <input
                                                type="text"
                                                value={item.end_date || ''}
                                                onChange={(e) =>
                                                    updateArrayItem('internships', item._key, 'end_date', e.target.value)
                                                }
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-2 flex items-end pb-2">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={!!item.for_credit}
                                                    onChange={(e) =>
                                                        updateArrayItem(
                                                            'internships',
                                                            item._key,
                                                            'for_credit',
                                                            e.target.checked
                                                        )
                                                    }
                                                />
                                                For Credit
                                            </label>
                                        </div>
                                    </div>
                                </CollapsibleSection>
                            ))}

                            <button
                                type="button"
                                onClick={() => addItem('internships')}
                                className="btn btn-secondary flex items-center gap-2 mt-2"
                            >
                                <Plus size={16} />
                                <span>Add Internship</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 mb-10">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="btn btn-secondary"

                        >
                            Cancel
                        </button>

                        <button type="submit" className="btn btn-primary" disabled>
                            {saving ? 'Saving...' : isNew ? 'Create Record' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AlumniEdit;