import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useSearchParams, Link, useNavigate, data } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Question } from "../types/question";
import { Survey } from "../types/survey";
import { ArrowLeft, SquareArrowOutUpRight } from 'lucide-react';

const QuestionPage: React.FC = () => {
    const [searchParams] = useSearchParams();

    const survey_version_id = searchParams.get("survey_version");
    const question_id = searchParams.get("question");

    const navigate = useNavigate();

    const [question, setQuestionData] = useState<Question>();
    const [survey, setSurvey] = useState<Survey>();

    const [formData, setFormData] = useState({
        questionCode: "",
        questionText: "",
    });

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            await apiService.updateQuestionText(
                question_id,
                formData.questionText
            );

            console.log("Successfully updated question!");
        } catch (err) {
            console.error(err);
        }
    };


    const handleChange = (event) => {
        const { name, value } = event.target; // Destructure name and value attributes

        setFormData((prevData) => ({
            ...prevData,          // Spread existing state fields to prevent overwriting them
            [name]: value        // Use computed property name to update the specific key
        }));
    };

    const handleBack = () => {
        navigate(`/surveypage`);
    };

    useEffect(() => {
        console.log("Survey ver: " + survey_version_id + "and questionId" + question_id);

        const fetchQuestion = async () => {
            try {
                const data = await apiService.getQuestionEdit(survey_version_id, question_id);

                setQuestionData(data.question);
                setSurvey(data.survey);



            } catch (error) {
                console.error(error);
                console.log("Failed to load question for: question_id :" + question);
            };
        }

        fetchQuestion();
    }, []);

    useEffect(() => {
        if (!question) return;

        setFormData({
            questionCode: question.question_code ?? "",
            questionText: question.question_text ?? "",
        });

    }, [question]);

    const dataChanged =
        question &&
        (
            formData.questionCode !== (question.question_code ?? "") ||
            formData.questionText !== (question.question_text ?? "")
        );

    return (
        <div>

            <button
                onClick={handleBack}
                className="btn btn-primary flex items-center gap-2"
            >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Back To Surveys</span>
            </button>

            <h1 className="text-2xl font-bold text-gray-800 pt-10">Editing Question: "{question?.question_text}"</h1>

            <div className="pt-5">
                <h2 className="text-xl font-bold text-gray-800">Belongs to: </h2>
                <form>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6 pt-5">
                        <input
                            className="py-2 pl-10 pr-4 border border-gray-400  rounded-lg text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 min-w-full col-span-4 disabled bg-gray-200"
                            readOnly
                            value={survey?.version_name ?? ""} />
                        <input
                            className="w-full py-2 pl-10 pr-4 border border-gray-400  rounded-lg text-gray-400  focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 min-w-full col-span-2 disabled bg-gray-200"
                            readOnly
                            value={survey ? `Version ID: ${survey.survey_version_id}` : ""} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 pt-6">Question Details: </h2>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6 pt-5">
                        <input
                            className="py-2 pl-10 pr-4 border rounded-lg text-gray-400 border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 min-w-full col-span-2 disabled bg-gray-200"
                            readOnly
                            value={formData.questionCode ?? ""}
                            type="text"
                            name="questionCode"
                            onChange={handleChange} />

                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6 pt-5">
                        <textarea
                            className="w-full py-2 pl-10 pr-4 border border-gray-500 rounded-lg text-gray-600  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 min-w-full col-span-6 md:text-wrap-none resize-none h-24 max-h-[200px] min-h-[200px]"
                            value={formData.questionText ?? ""}
                            name="questionText"
                            onChange={handleChange} />
                    </div>
                    <div className="grid md:grid-cols-6 pt-5">
                        <div className="md:col-start-6 md:grid md:grid-cols-1 text-center">
                            {dataChanged &&
                                <div className="pb-5"><p>You have unsaved changes.</p></div>}
                            <button
                                className={`rounded-lg p-2 border border-gray-500 ${dataChanged
                                    ? "border-gray-500 font-semibold"
                                    : "border-gray-300"
                                    }`}
                                type="submit" disabled={!dataChanged}
                                onClick={handleSubmit}>Save Changes</button>
                        </div>
                    </div>

                </form>
            </div>

        </div>
    )
}

export default QuestionPage;