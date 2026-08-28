export interface Response {
    survey_attempt_id: number;
    first_name: string;
    last_name: string;
    temp_name: string;
    alumni_id: number;

    responses: {
        [questionId: number]: string | null;
        answer: string;
    };
}