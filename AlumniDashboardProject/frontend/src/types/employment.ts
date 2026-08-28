import { EmploymentQuestions } from './employmentSurveyQuestions';

export interface Employment {
    employment_id: number;
    alumni_id: number;
    salary?: number;
    job_position?: string;
    employer_name?: string;
    yrs_exp?: string;
    alt_employer_name?: string;
    country?: string;
    state?: string;
    city?: string;
    is_current?: boolean;

    employment_questions?: EmploymentQuestions;
}