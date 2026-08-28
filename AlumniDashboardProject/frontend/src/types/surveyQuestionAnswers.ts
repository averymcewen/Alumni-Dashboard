export interface SurveyQuestionAnswers {
    survey_attempt_id: number;
    alumniId: number;
    surveyVersionId: number;
    option_text: string;
    value_text: string;
    questionCode: string;
    question_text: string;
    version_name: string;
}