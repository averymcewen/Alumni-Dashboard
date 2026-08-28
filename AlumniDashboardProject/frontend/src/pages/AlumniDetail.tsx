import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
    Pencil
} from 'lucide-react';
import { AlumniProfile } from '../types/';
import { apiService } from '../../services/api';
import {
    groupEmployment,
    groupInternships,
    groupSurveyQuestions
} from "../utils/alumniGrouping";



const AlumniDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [alumni, setAlumni] = useState<AlumniProfile | null>(null);

    useEffect(() => {
        const fetchAlumniDetails = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const data = await apiService.getAlumniById(Number(id));
                setAlumni({
                    ...data.alumni,
                    degrees: data.degrees,
                    currentDegree: data.currentDegree,
                    internships: data.internships,
                    employment: data.employment,
                    surveyAttempts: data.attempts,
                    surveyQuestions: data.surveyQuestionAnswers
                });
                console.log(alumni);

                const details = await apiService.getAlumniStats(Number(id));

                console.log("Details:" + details);

            } catch (error) {
                console.error('Error fetching alumni details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlumniDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-6 p-4">
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                <div className="h-40 bg-gray-200 rounded"></div>
                <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-28 bg-gray-200 rounded"></div>
                        <div className="h-28 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!alumni) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-gray-700">Alumni Not Found</h2>
                <p className="mt-2 text-gray-500">The alumni record you're looking for doesn't exist or has been removed.</p>
                <Link to="/alumni" className="mt-4 inline-block btn btn-primary">
                    Back to Alumni Directory
                </Link>
            </div>
        );
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const groupedEmployment = groupEmployment(alumni.employment);

    const groupedInternships = groupInternships(
        alumni.internships
    );


    const minors = alumni.degrees
        ?.filter(degree => degree.minor)
        .map(degree => degree.minor);

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <Link to="/alumni" className="inline-flex items-center text-weber-purple hover:text-weber-purple-light transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Directory
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="weber-gradient p-6 text-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center">
                            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center text-weber-purple text-2xl font-bold">
                                <User />
                            </div>
                            <div className="ml-4">
                                <h1 className="text-4xl font-bold text-shadow">{alumni.first_name} {alumni.last_name} {alumni.temp_name}</h1>
                                {(Number(alumni.alumni_duration) === 1 && <p className="text-gray-200 text-sm text-opacity-80">Alumni for {alumni.alumni_duration} year</p>) || (Number(alumni.alumni_duration) > 1 && <p className="text-gray-200 text-sm text-opacity-80">Alumni for {alumni.alumni_duration} years</p>) || (!alumni.alumni_duration && (null))}

                            </div>
                        </div>

                        <div className="mt-4 md:mt-0">
                            <span className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium dark-text">
                                <Link
                                    to={`/alumni/${alumni.alumni_id}/edit`}
                                    className="inline-flex items-center text-weber-purple hover:text-weber-purple-light transition-colors"
                                >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Edit Alumni Record
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                    <div className="col-span-1">
                        <div className="card h-full">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Information</h2>

                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <Mail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                                    <div>
                                        {alumni.email.includes("mail.weber.edu") && (
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">Weber Email</div>
                                                <a href={`mailto:${alumni.email}`} className="text-sm text-blue-600 hover:underline">{alumni.email}</a>
                                            </div>

                                        )}

                                        {alumni.alt_email && (
                                            <div className="mt-1">
                                                <div className="text-sm font-medium text-gray-900">Alternative Email</div>
                                                <a href={`mailto:${alumni.alt_email}`} className="text-sm text-blue-600 hover:underline">{alumni.alt_email}</a>
                                            </div>
                                        )}
                                    </div>
                                </li>

                                {alumni.phone && (
                                    <li className="flex items-start">
                                        <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">Phone</div>
                                            <a href={`tel:${alumni.phone}`} className="text-sm text-gray-700">{alumni.phone}</a>
                                            {alumni.alt_phone && (
                                                <div className="mt-1">
                                                    <div className="text-xs text-gray-500">Alternative</div>
                                                    <a href={`tel:${alumni.alt_phone}`} className="text-sm text-gray-700">{alumni.alt_phone}</a>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                )}

                                {alumni.linkedin_url && (
                                    <li className="flex items-start">
                                        <LinkIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">LinkedIn</div>
                                            <a href={alumni.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                View Profile
                                            </a>
                                        </div>
                                    </li>
                                )}

                                <li className="flex items-start">
                                    <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Graduation</div>
                                        <div className="text-sm text-gray-700">{formatDate(alumni.graduation_date)}</div>
                                    </div>
                                </li>

                                {alumni.currentDegree && (
                                    <li className="flex items-start">
                                        <Award className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">Department</div>
                                            <div className="text-sm text-gray-700">{alumni.currentDegree.department_name || 'Not specified'}</div>

                                        </div>
                                    </li>


                                ) &&

                                    <li className="flex items-start">
                                        <Award className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">Program</div>
                                            <div className="text-sm text-gray-700">{alumni.currentDegree.program_name || 'Not specified'}</div>

                                        </div>
                                    </li>}





                                {minors?.length > 0 && (
                                    <li className="flex items-start">
                                        <Award className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                Minor
                                            </div>
                                            <div className="text-sm text-gray-700">
                                                {minors.join(", ")}
                                            </div>
                                        </div>
                                    </li>
                                )}

                                {alumni.degrees && alumni.degrees.length > 0 && alumni.degrees[0].raw_degree_code && (
                                    <li className="flex items-start">
                                        <Award className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">Degree / Program Code</div>
                                            <div className="text-sm text-gray-700">{alumni.degrees[0].raw_degree_code || 'Not specified'}</div>


                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>




                    <div className="col-span-1 md:col-span-2">
                        <div className="space-y-6">

                            {alumni.degrees && alumni.degrees.length > 0 && (
                                <div className="card">
                                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">
                                        Degrees
                                    </h2>

                                    {alumni.degrees.map((degree, index) => (
                                        <div key={index} className="mb-4 flex justify-between">
                                            <div>
                                                <h3 className="font-medium text-gray-900">
                                                    {degree.department_name || "N/A"}
                                                </h3>

                                                <p className="text-sm text-gray-700">
                                                    {degree.program_name || "N/A"}
                                                </p>
                                            </div>

                                            <p className="text-sm text-gray-500">
                                                {degree.degree_type || "N/A"}

                                            </p>
                                            {!degree.program_name && !degree.department_name && (
                                                <div className="text-sm text-gray-700">
                                                    {degree.raw_degree_code}
                                                    <p className="text-sm text-gray-700">No degree information available.</p>

                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}



                            {alumni.employment && alumni.employment.length > 0 && (



                                <div className="card">
                                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Employment</h2>



                                    {alumni.employment.map((job, index) => (
                                        <div key={index} className="mb-4 last:mb-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center mt-2">
                                                        <h3 className="font-medium text-gray-900">
                                                            {job.employer_name || job.alt_employer_name}
                                                        </h3>

                                                        {job.is_current && (
                                                            <p> — Current Employer</p>
                                                        )}
                                                    </div>

                                                    {/* <p className="text-sm text-gray-700">
                                                        {job.positions.join(" • ")}
                                                    </p> */}
                                                </div>

                                                {/* {job.salaries.length > 0 && ( */}

                                                {job.salary && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {/* {job.salary.map((salary: number) => ( */}
                                                        <div
                                                            // key={salary}
                                                            className="chip bg-accent-gold text-gray-800"
                                                        >
                                                            $ {job.salary.toLocaleString()}
                                                        </div>
                                                        {/* ))} */}
                                                    </div>
                                                )}

                                            </div>

                                            {job.yrs_exp && (
                                                <div className="flex items-center mt-2">
                                                    <p className="text-sm text-gray-600">
                                                        {job.yrs_exp} years of experience
                                                    </p>
                                                </div>
                                            )}

                                            {job.city && (<div className="flex items-center mt-2">
                                                <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                                <span className="text-sm text-gray-600">
                                                    {
                                                        [
                                                            (job.city).charAt(0).toUpperCase() + job.city.slice(1).trim(),
                                                            job.state.trim(),
                                                            job.country,

                                                        ]
                                                            .filter(Boolean)
                                                            .join(", ") || "Location Not Specified"
                                                    }
                                                </span>
                                            </div>)}


                                            {/* {job.job_start_date && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    Started {formatDate(job.job_start_date)}
                                                </div>
                                            )} */}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* {alumni.graduateAdmissions && alumni.graduateAdmissions.length > 0 && (
                                <div className="card">
                                    <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Graduate Studies</h2>

                                    {alumni.graduateAdmissions.map((admission, index) => (
                                        <div key={index} className="mb-4 last:mb-0">
                                            <h3 className="font-medium text-gray-900">{admission.school_name}</h3>
                                            <p className="text-sm text-gray-700">{admission.program || 'Graduate Program'}</p>

                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className={`chip ${admission.accepted ? 'bg-success text-white' : 'bg-error text-white'
                                                    }`}>
                                                    {admission.accepted ? 'Accepted' : 'Not Accepted'}
                                                </span>

                                                {admission.application_date && (
                                                    <span className="chip bg-neutral-100">
                                                        Applied: {formatDate(admission.application_date)}
                                                    </span>
                                                )}

                                                {admission.decision_date && (
                                                    <span className="chip bg-neutral-100">
                                                        Decision: {formatDate(admission.decision_date)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )} */}



                            {alumni.internships && alumni.internships.length > 0 && (
                                <div className="card">
                                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">Internships</h2>

                                    {groupedInternships.map((internship, index) => (
                                        <div key={index} className="mb-4 last:mb-0">
                                            <h3 className="font-medium text-gray-900">{internship.intern_business}</h3>

                                            {internship.intern_city && (
                                                <div className="flex items-center mt-1">
                                                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                                    <span className="text-sm text-gray-600">{internship.intern_city}</span>
                                                </div>
                                            )}

                                            {Number(internship.for_credit) === 1 && (
                                                <div>
                                                    <p className="text-sm text-gray-700">For Credit Internship</p>
                                                </div>
                                            )}

                                            {Number(internship.not_for_credit) === 1 && (
                                                <div>
                                                    <p className="text-sm text-gray-700">Not For Credit</p>
                                                </div>
                                            )}

                                            {Number(internship.n_a) === 1 && (
                                                <div>
                                                    <p className="text-sm text-gray-700">Did not partcitipate in any internship</p>
                                                </div>
                                            )}

                                            {/* <div className="text-sm text-gray-600 mt-1">
                                                {internship.start_date && internship.end_date ? (
                                                    <>
                                                        {formatDate(internship.start_date)} - {formatDate(internship.end_date)}
                                                    </>
                                                ) : (
                                                    <>
                                                        {internship.start_date
                                                            ? `Started ${formatDate(internship.start_date)}`
                                                            : 'Dates not specified'}
                                                    </>
                                                )}
                                            </div> */}
                                        </div>
                                    ))}
                                </div>
                            )}


                        </div>

                    </div>




                    {alumni.surveyAttempts && alumni.surveyAttempts.length > 0 && (
                        <div className="card col-span-3">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b pb-2">
                                Survey Responses
                            </h2>

                            {alumni.surveyAttempts.map((survey) => {
                                // Get only the questions for this survey attempt
                                const attemptQuestions =
                                    alumni.surveyQuestions?.filter(
                                        (q) =>
                                            q.survey_attempt_id === survey.survey_attempt_id &&
                                            (q.value_text || q.option_text)
                                    ) ?? [];

                                // Group them by question text
                                const groupedQuestions = groupSurveyQuestions(
                                    attemptQuestions
                                );



                                return (
                                    <div
                                        key={survey.survey_attempt_id}
                                        className="mb-10 last:mb-0 border-b pb-10 last:border-none"
                                    >

                                        <h3 className="font-semibold text-gray-900 text-xl">
                                            {survey.version_name}
                                            {survey.survey_time && ` — ${survey.survey_time}`}
                                        </h3>

                                        <div className="mt-4 space-y-4">
                                            {Object.entries(groupedQuestions).map(
                                                ([questionText, answers]) => (
                                                    <div key={questionText}>
                                                        <h4 className="font-medium text-gray-800">
                                                            {questionText}
                                                        </h4>

                                                        <ul className="list-none list-inside mt-1 text-gray-700 ml-2">
                                                            {answers.map((answer, index) => (
                                                                <li key={index}>
                                                                    {answer.value_text ??
                                                                        answer.option_text ??
                                                                        "No response"}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )
                                            )}
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
            </div>


        </div>
    );
};

export default AlumniDetail;