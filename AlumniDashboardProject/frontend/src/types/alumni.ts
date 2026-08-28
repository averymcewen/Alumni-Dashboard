import { Degree, currentDegree } from './degree';
import { Internship } from './internships';
import { Employment } from './employment';
import { GraduateAdmission } from './graduateAdmission';
import { SurveyAttempts } from './surveyAttempts';
import { SurveyQuestionAnswers } from './surveyQuestionAnswers';

export interface Alumni {
    alumni_id: number;
    wildcat_id: string;
    first_name: string;
    last_name: string;
    temp_name?: string;
    email: string;
    alt_email?: string;
    phone?: string;
    alt_phone?: string;
    linkedin_url?: string;
    graduation_date?: string;
    college?: string;
    company_rep_authorized?: boolean;
    program_name?: string;
    department_name?: string;
    degree_type?: string;
    alumni_duration?: string;
    employer_name?: string;
    alt_employer_name?: string;
    salary?: string;
}

export interface AlumniProfile extends Alumni {
    degrees?: Degree[];
    currentDegree?: currentDegree;
    internships?: Internship[];
    employment?: Employment[];
    graduateAdmissions?: GraduateAdmission[];
    surveyAttempts?: SurveyAttempts[];
    surveyQuestions?: SurveyQuestionAnswers[];
}