import { Employment, Internship } from "../types";

import { SurveyQuestionAnswers } from "../types/surveyQuestionAnswers";

export function groupEmployment(employment: Employment[] = []) {
    return Object.values(
        employment.reduce((groups, job) => {
            const key =
                (job.employer_name || job.alt_employer_name || "")
                    .trim()
                    .toLowerCase();

            if (!groups[key]) {
                groups[key] = {
                    employer_name: job.employer_name,
                    alt_employer_name: job.alt_employer_name,
                    city: job.city,
                    state: job.state,
                    country: job.country,
                    positions: [],
                    salaries: [],
                    years_experience: [],
                    is_current: false,
                    jobs: []
                };
            }

            groups[key].jobs.push(job);

            if (
                job.job_position &&
                !groups[key].positions.includes(job.job_position)
            ) {
                groups[key].positions.push(job.job_position);
            }

            if (
                job.salary &&
                !groups[key].salaries.includes(job.salary)
            ) {
                groups[key].salaries.push(job.salary);
            }

            if (
                job.yrs_exp &&
                !groups[key].years_experience.includes(job.yrs_exp)
            ) {
                groups[key].years_experience.push(job.yrs_exp);
            }

            groups[key].is_current ||= job.is_current;

            return groups;
        }, {} as Record<string, any>)
    );
}

export function groupInternships(internships: Internship[] = []) {
    return Object.values(
        internships.reduce((groups, internship) => {
            const key = [
                internship.intern_business?.trim()?.toLowerCase()
            ].join("|");

            if (!groups[key]) {
                groups[key] = {
                    ...internship,
                    internships: []
                };
            }

            groups[key].internships.push(internship);

            groups[key].for_credit ||= internship.for_credit;
            groups[key].not_for_credit ||= internship.not_for_credit;
            groups[key].n_a ||= internship.n_a;

            return groups;
        }, {} as Record<string, any>)
    );
}

export function groupSurveyQuestions(
    questions: SurveyQuestionAnswers[] = []
) {
    return questions.reduce((groups, question) => {
        const key = question.question_text.trim();

        if (!groups[key]) {
            groups[key] = [];
        }

        const answer =
            question.value_text ??
            question.option_text ??
            "";

        const alreadyExists = groups[key].some(existing => {
            const existingAnswer =
                existing.value_text ??
                existing.option_text ??
                "";

            return existingAnswer === answer;
        });

        if (!alreadyExists) {
            groups[key].push(question);
        }


        return groups;
    }, {} as Record<string, SurveyQuestionAnswers[]>);
}