import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

export const apiService = {
    // Alumni
    getAllAlumni: async () => {
        const response = await API.get("/alumni");
        return response.data;
    },

    getAlumniById: async (id) => {
        const response = await API.get(`/alumni/${id}`);
        return response.data;
    },

    getAlumniStats: async (id) => {
        const res = await API.get(`/alumni/${id}/alumniProfile`);
        return res.data;
    },

    // Survey versions
    getSurveyVersions: async () => {
        const response = await API.get("/surveys/versions");
        return response.data;
    },

    getDashboardStats: async () => {
        const response = await API.get("/display/dashboardStats");
        return response.data;
    },

    getSurveyData: async () => {
        const response = await API.get("/surveys/surveyManager/getSurveys");
        return response.data;
    },

    getQuestionData: async (surveyID) => {
        const res = await API.get(
            `/surveys/surveyManager/getQuestions/${surveyID}`
        );
        return res.data;
    },

    getResponseData: async (surveyID) => {
        const res = await API.get(
            `/surveys/surveyManager/getSurveyResponses/${surveyID}`
        );
        return res.data;
    },

    getAlumniPageFromAttempt: async (alumniId) => {
        const res = await API.get(
            `/alumni/getAlumniFromAttempt/${alumniId}`
        );
        return res.data
    },

    getQuestionEdit: async (surveyVersionId, questionId) => {
        const res = await API.get(
            `/surveys/surveyManager/getQuestionEdit/${surveyVersionId}/${questionId}`
        );
        console.log("question edit returns: " + res.data);
        return res.data;

    },

    updateQuestionText: async (questionId, questionText) => {
        const res = await API.post(`/surveys/surveyManager/submitQuestionChanges/${questionId}`, {
            questionId: questionId,
            questionText: questionText
        }
        )

        console.log("Updated question successfully: " + res.data);

    },

    getEastInsights: async () => {
        const res = await API.get(`/display/eastInsights`);
        return res.data;
    },

    getGradPrograms: async () => {
        const res = await API.get(`/display/gradPrograms`);
        return res.data;
    },

    getDeptInfo: async (department_id) => {
        const res = await API.get(`/display/deptSpecific`, {
            params: {
                department_id
            }
        });

        return res.data;
    }


    // getViewSurveyResponseQuestions: async (surveyID) => {
    //     const res = await API.get(`/surveys/surveyManager/viewResponses/getQuestions/${surveyID}`
    //     );
    //     return res.data;
    // }
};