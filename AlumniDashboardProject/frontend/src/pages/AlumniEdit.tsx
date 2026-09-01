import React, { useEffect, useState, useId } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlumniProfile } from '../types/';
import { apiService } from '../../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    User,
    Mail,
    Phone,
    Calendar,
    Award,
    Briefcase,
    GraduationCap,
    MapPin,
    LinkIcon,
    ArrowLeft,
    Pencil,
    Plus
} from 'lucide-react';
import PhoneInput from '../components/textBoxFormats/phone.js'


const AlumniEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [alumni, setAlumni] = useState<AlumniProfile | null>(null);
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const contentId = useId();

    useEffect(() => {
        const fetchAlumniDetails = async () => {
            if (!id) return;

            try {
                setLoading(true);

                const data = await apiService.getAlumniById(Number(id));

                if (!data.alumni.first_name) {
                    data.alumni.first_name = data.alumni.temp_name;
                }

                setAlumni({
                    ...data.alumni,
                    degrees: data.degrees,
                    currentDegree: data.currentDegree,
                    internships: data.internships,
                    employment: data.employment,
                });

            } catch (error) {
                console.error('Error fetching alumni details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlumniDetails();
    }, [id]);

    const handleBack = () => {
        navigate(`/alumni/${id}`);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!alumni) {
        return <div>Alumni not found.</div>;
    }

    const inputClass =
        "w-full px-3 py-2 border border-weber-purple-light-400 rounded-md focus:outline-none focus:ring-2 focus:ring-weber-purple-300";

    const labelClass = "block text-sm font-medium text-gray-700 mb-1";

    const placeholderDefault = "N/A";

    const sectionHeaderClass = "text-lg font-semibold mb-6 border-b pb-2 weber-purple-40";

    return (
        <div>
            <button
                onClick={handleBack}
                className="btn btn-primary flex items-center gap-2"
            >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Back To Alumni Page</span>
            </button>

            <div className="mt-4">
                <h1 className="text-2xl font-bold text-shadow">
                    Editing Record for: {alumni.first_name} {alumni?.last_name} {alumni.alumni_id}
                </h1>
            </div>

            <div className="mt-4">

                <div className="col-span-1">
                    <div className="space-y-6">
                        <div className="card p-6">
                            <h2 className={sectionHeaderClass}>
                                Identity Information
                            </h2>

                            <form className="grid grid-cols-2 md:grid-cols-6 gap-6">

                                <div className="col-span-2">
                                    <label className={labelClass}>
                                        First Name
                                    </label>

                                    <input
                                        type="text"
                                        defaultValue={alumni.first_name}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>
                                        Last Name
                                    </label>

                                    <input
                                        type="text"
                                        defaultValue={alumni.last_name}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>
                                        Email
                                    </label>

                                    <input
                                        type="text"
                                        disabled
                                        defaultValue={alumni.email}
                                        className={`${inputClass} "border-gray-300 disabled:bg-gray-50 disabled:text-gray-400`}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>
                                        Phone Number
                                    </label>

                                    <input
                                        placeholder={placeholderDefault}
                                        type="text"
                                        defaultValue={alumni?.phone}
                                        className={inputClass}
                                    />
                                </div>


                                <div className="col-span-2">
                                    <label className={labelClass}>
                                        Wildcat ID
                                    </label>

                                    <input
                                        type="text"
                                        defaultValue={alumni.wildcat_id}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>
                                        Graduation Date
                                    </label>

                                    <input
                                        type="text"
                                        placeholder={placeholderDefault}
                                        defaultValue={alumni?.graduation_date}
                                        className={inputClass}
                                    />
                                </div>

                            </form>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="card p-6">
                            <h2 className={sectionHeaderClass}>
                                Degrees Awarded
                            </h2>

                            {alumni.degrees ??.map((item) =>
                            (
                                <form >
                                    <div className="grid grid-cols-6 md:grid-cols-6 gap-6">
                                        <div className="col-span-3">
                                            <label className={labelClass}>
                                                Program Name
                                            </label>

                                            <input
                                                type="text"
                                                defaultValue={item.program_name || "N/A"}
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-3">

                                            <label className={labelClass}>
                                                Degree Type
                                            </label>

                                            <input
                                                type="text"
                                                defaultValue={item.degree_type || "N/A"}
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-3">

                                            <label className={labelClass}>
                                                Survey Term
                                            </label>

                                            <input
                                                type="text"
                                                defaultValue={item.survey_term || "N/A"}
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-3">

                                            <label className={labelClass}>
                                                Survey Year
                                            </label>

                                            <input
                                                type="text"
                                                defaultValue={item.survey_year || "N/A"}
                                                className={inputClass}
                                            />
                                        </div>


                                        <div className="col-span-3">

                                            <label className={labelClass}>
                                                GPA
                                            </label>

                                            <input
                                                type="text"
                                                defaultValue={item.gpa || "N/A"}
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-3 pb-10">

                                            <label className={labelClass}>
                                                Minor
                                            </label>

                                            <input
                                                type="text"
                                                defaultValue={item.minor || "N/A"}
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                </form>
                            ))}




                        </div>
                    </div>




                    <div className="space-y-6">
                        <div className="card p-6">
                            <h2 className={sectionHeaderClass}>
                                Employment Information
                            </h2>

                            <form className="grid grid-cols-2 md:grid-cols-6 gap-6">

                                <div className="col-span-2">
                                    <label className={labelClass}>
                                        Employer Name
                                    </label>

                                    <input
                                        type="text"
                                        defaultValue={alumni.employment[0]?.employer_name || "N/A"}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>
                                        Job Position
                                    </label>

                                    <input
                                        type="text"
                                        defaultValue={alumni.employment[0]?.job_position || "N/A"}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className={labelClass}>
                                        Salary
                                    </label>

                                    <input
                                        type="text"
                                        defaultValue={alumni.employment[0]?.salary || "N/A"}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2 md:col-span-3">
                                    <label className={labelClass}>
                                        Employer City
                                    </label>

                                    <input
                                        type="text"
                                        defaultValue={alumni.employment[0]?.city || "N/A"}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2 md:col-span-3">
                                    <label className={labelClass}>
                                        Employer Country
                                    </label>

                                    <input
                                        type="text"
                                        defaultValue={alumni.employment[0]?.country || "N/A"}
                                        className={inputClass}
                                    />
                                </div>


                                <div className="col-span-2 md:col-span-3">
                                    <label className={labelClass}>
                                        Employer State
                                    </label>

                                    <input
                                        type="text"
                                        defaultValue={alumni.employment[0]?.state || "N/A"}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="col-span-2 md:col-span-3">
                                    <label className={labelClass}>
                                        Years Experience
                                    </label>

                                    <input
                                        type="text"
                                        defaultValue={alumni.employment[0]?.yrs_exp || "N/A"}
                                        className={inputClass}
                                    />
                                </div>


                            </form>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="card p-6">
                            <h2 className={sectionHeaderClass}>
                                Internships
                            </h2>

                            {alumni.internships ??.map((item) =>
                            (
                                <form >
                                    <div className="grid grid-cols-6 md:grid-cols-6 gap-6">
                                        <div className="col-span-3">
                                            <label className={labelClass}>
                                                Internship Company
                                            </label>

                                            <input
                                                type="text"
                                                defaultValue={item.intern_business || "N/A"}
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-3">

                                            <label className={labelClass}>
                                                Degree Type
                                            </label>

                                            <input
                                                type="text"
                                                defaultValue={Number(item.for_credit) || Number(item.not_for_credit) || Number(item.n_a) || "N/A"}
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-3">

                                            <label className={labelClass}>
                                                Start Date
                                            </label>

                                            <input
                                                type="text"
                                                defaultValue={item.start_date || "N/A"}
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="col-span-3">

                                            <label className={labelClass}>
                                                End Date
                                            </label>

                                            <input
                                                type="text"
                                                defaultValue={item.end_date || "N/A"}
                                                className={inputClass}
                                            />
                                        </div>


                                        <div className="col-span-3">

                                            <label className={labelClass}>
                                                GPA
                                            </label>

                                            <input
                                                type="text"
                                                defaultValue={item.intern_city || "N/A"}
                                                className={inputClass}
                                            />
                                        </div>


                                    </div>
                                </form>
                            ))}




                        </div>
                    </div>



                    <div className="card p-6">
                        <button
                            type="button"
                            onClick={() => setIsOpen(prev => !prev)}
                            className="w-full flex items-center justify-between text-left"
                            aria-expanded={isOpen}
                            aria-controls={contentId}
                        >
                            <h2 className="text-lg font-semibold">
                                Additional Information
                            </h2>

                            <span
                                className={`text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-90" : ""
                                    }`}
                            >
                                <Plus size={30} />
                            </span>
                        </button>

                        <div
                            id={contentId}
                            className={`grid transition-all duration-300 ease-in-out ${isOpen
                                ? "grid-rows-[1fr] opacity-100 mt-6"
                                : "grid-rows-[0fr] opacity-0"
                                }`}
                            aria-hidden={!isOpen}
                        >
                            <div className="overflow-hidden">
                                <div className="border-t pt-6">
                                    test
                                </div>
                            </div>
                        </div>
                    </div>



                </div>
            </div>
        </div>
    );
};

export default AlumniEdit;
