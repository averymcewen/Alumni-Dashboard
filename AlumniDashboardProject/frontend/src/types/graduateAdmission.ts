export interface GraduateAdmission {
    admission_id: number;

    alumni_id: number;

    school_name: string;

    application_date?: string;
    decision_date?: string;

    accepted?: boolean;

    program?: string;
}