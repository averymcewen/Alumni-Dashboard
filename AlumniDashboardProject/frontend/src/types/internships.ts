export interface Internship {
    internship_id: number;
    alumni_id: number;
    intern_business?: string;
    intern_city?: string;
    for_credit?: boolean;
    not_for_credit?: boolean;
    n_a?: boolean;
    start_date?: string;
    end_date?: string;
}