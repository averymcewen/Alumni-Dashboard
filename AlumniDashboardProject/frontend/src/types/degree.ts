export interface Degree {
    alumni_degree_id?: number;
    alumni_id: number;
    degree_type?: string;
    raw_degree_code?: string;
    program_id?: number;
    program_name?: string;
    department_id?: number;
    department_name?: string;
    survey_time_raw?: string;
    survey_term?: string;
    survey_year?: string;
    minor?: string;
    gpa?: string;
}

export interface currentDegree {
    alumni_id: number;
    program_name: string;
    department_name: string;
    graduation_term?: string;
}