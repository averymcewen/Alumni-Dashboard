import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { apiService } from "#/services/api";

function UploadPage() {
    const [versions, setVersions] = useState<any[]>([]);
    const [questionsFile, setQuestionsFile] = useState<File | null>(null);
    const [responsesFile, setResponsesFile] = useState<File | null>(null);
    const [survey_version_id, setsurvey_version_id] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [fromAdminPage, setFromAdminPage] = useState(true);

    const [surveyVersionData, setSurveyVersionData] = useState({
        survey_version_id: "",
        survey_name: "",
        version_name: "",
        term_label: ""
    });


    const [uploadingQuestions, setUploadingQuestions] = useState(false);
    const [uploadingResponses, setUploadingResponses] = useState(false);
    const [submittingSurveyVersion, setSubmittingSurveyVersion] = useState(false);

    const [questionsError, setQuestionsError] = useState("");
    const [responsesError, setResponsesError] = useState("");
    const [surveyVersionError, setSurveyVersionError] = useState("");

    const [questionsSuccess, setQuestionsSuccess] = useState("");
    const [responsesSuccess, setResponsesSuccess] = useState("");
    const [surveyVersionSuccess, setSurveyVersionSuccess] = useState("");

    useEffect(() => {
        const fetchSurveyVersions = async () => {
            try {
                const data = await apiService.getSurveyVersions();
                setVersions(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching survey versions:", err);
                setVersions([]);
            }
        };

        fetchSurveyVersions();
    }, [submittingSurveyVersion]);

    const hasValidSurveyVersion = survey_version_id !== "";


    const canUploadResponses =
        !!responsesFile && hasValidSurveyVersion && !uploadingResponses;

    const responsesValidationMessage = !survey_version_id
        ? "Please select a survey version."
        : !responsesFile
            ? "Please choose a responses CSV file."
            : "";

    const handleSurveyVersionInputChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setSurveyVersionData((prev) => ({
            ...prev,
            [name]: value
        }));

        setSurveyVersionError("");
        setSurveyVersionSuccess("");
    };



    const handleUploadResponses = async (e: React.FormEvent) => {
        e.preventDefault();

        setResponsesError("");
        setResponsesSuccess("");

        if (!responsesFile) {
            setResponsesError("Please choose a responses CSV file first.");
            return;
        }

        if (!survey_version_id) {
            setResponsesError("Please choose a survey version first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", responsesFile);
        formData.append("survey_version_id", survey_version_id);

        try {
            setUploadingResponses(true);

            const data = await apiService.uploadResponseData(formData);

            setResponsesSuccess("Responses uploaded successfully.");
            setResponsesFile(null);
        } catch (error) {
            console.error("Response upload error:", error);
            setResponsesError(
                "Something went wrong while uploading the responses file. Please try again."
            );
        } finally {
            setUploadingResponses(false);
        }
    };

    const handleSubmitSurveyVersion = async (e: React.FormEvent) => {
        e.preventDefault();

        setSurveyVersionError("");
        setSurveyVersionSuccess("");

        const { survey_name, version_name, term_label } = surveyVersionData;

        if (!survey_name.trim() || !version_name.trim() || !term_label.trim()) {
            setSurveyVersionError("Please fill out all survey version fields.");
            return;
        }

        try {
            setSubmittingSurveyVersion(true);

            const response = await apiService.submitSurveyVersion(surveyVersionData);

            setSurveyVersionSuccess("Survey version submitted successfully.")


            setIsOpen(false);
        } catch (error) {
            console.error("Survey version submit error:", error);
            setSurveyVersionError(
                "Something went wrong while creating the survey version. Please try again."
            );
        } finally {
            setSubmittingSurveyVersion(false);
        }
    };

    return (
        <div className="layout">
            <div className="content">
                <PageHeader
                    title="Upload CSV Data"
                    description="Admin page for uploading survey questions and responses, and creating new survey versions"
                />


                <div className="dropdown-container pt-15" style={{ position: "relative" }}>
                    <div className="flex justify-start items-center ">
                        <h2 className="text-2xl pr-20">Create/Add New Survey</h2>

                        <button
                            className="btn btn-primary flex items-center gap-2"
                            onClick={() => {
                                setIsOpen(!isOpen);
                                setSurveyVersionError("");
                                setSurveyVersionSuccess("");
                            }}
                            type="button"
                        >
                            {isOpen ? "Close Survey Form" : "Create New Survey Version"}
                        </button>
                    </div>

                    {surveyVersionSuccess && (
                        <p className="text-green-600 mt-2 mb-3">{surveyVersionSuccess}</p>
                    )}

                    {isOpen && (
                        <div>
                            <p className="mt-5 mb-5">
                                Note: If you are adding a new version for an existing survey,
                                please ensure the survey name matches the existing survey name.

                                A NEW VERSION would be considered a survey that has additional questions, or questions have been REMOVED.
                                If there is only modifications to a question, please use the Survey Management page to modify accordingly.
                            </p>

                            <form onSubmit={handleSubmitSurveyVersion}>
                                <div className="flex flex-col justify-between md:flex-row md:justify-around gap-4">
                                    <div className="form-field-container">
                                        <label>New Survey Name: </label>
                                        <input
                                            className="border-solid border-black border-1 rounded-md"
                                            type="text"
                                            name="survey_name"
                                            value={surveyVersionData.survey_name}
                                            onChange={handleSurveyVersionInputChange}
                                        />
                                    </div>

                                    <div className="form-field-container">
                                        <label>Version: </label>
                                        <input
                                            className="border-solid border-black border-1 rounded-md"
                                            type="text"
                                            name="version"
                                            value={surveyVersionData.version_name}
                                            onChange={handleSurveyVersionInputChange}
                                        />
                                    </div>

                                    <div className="form-field-container">
                                        <label>Survey Date (i.e. Fall 2023): </label>
                                        <input
                                            className="border-solid border-black border-1 rounded-md"
                                            type="text"
                                            name="term_label"
                                            value={surveyVersionData.term_label}
                                            onChange={handleSurveyVersionInputChange}
                                        />
                                    </div>
                                </div>

                                {surveyVersionError && (
                                    <p className="text-red-600 mt-3">{surveyVersionError}</p>
                                )}

                                <div className="flex md: flex-row flex-col justify-center">
                                    <button
                                        className="btn btn-primary flex items-center gap-2"
                                        type="submit"
                                        style={{ marginTop: "1rem" }}
                                        disabled={submittingSurveyVersion}
                                    >
                                        {submittingSurveyVersion
                                            ? "Submitting..."
                                            : "Submit Survey Version"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-12 mt-10 items-center ">
                    <div className="mt-15 text-wrap shrink max-w-200 min-w-100">
                        <h2 className="text-2xl">Upload Response Data</h2>
                        <p className="mt-4 text-gray-500">This upload takes a CSV of alumni responses. The CSV must contain the two header rows that contain the questions exported from Qualtrics.</p>

                        <form onSubmit={handleUploadResponses}>
                            <div style={{ marginTop: "1rem" }}>
                                <input
                                    className="btn btn-primary flex items-center gap-2"
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => {
                                        setResponsesFile(e.target.files?.[0] || null);
                                        setResponsesError("");
                                        setResponsesSuccess("");
                                    }}
                                />
                            </div>

                            {responsesFile && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Selected file: {responsesFile.name}
                                </p>
                            )}

                            {!responsesError && !responsesSuccess && responsesValidationMessage && (
                                <p className="text-amber-600 mt-2">
                                    {responsesValidationMessage}
                                </p>
                            )}

                            {responsesError && (
                                <p className="text-red-600 mt-2">{responsesError}</p>
                            )}

                            {responsesSuccess && (
                                <p className="text-green-600 mt-2">{responsesSuccess}</p>
                            )}

                            <button
                                className="btn btn-primary flex items-center gap-2"
                                type="submit"
                                style={{ marginTop: "1rem" }}
                                disabled={!canUploadResponses}
                            >
                                {uploadingResponses
                                    ? "Uploading Responses..."
                                    : "Upload Responses"}
                            </button>
                        </form>
                    </div>


                    <div className="survey-version-container">
                        <div>
                            <div className="form-field-container md:flex-row flex-col">
                                <label className="text-xl">Survey Version: </label>
                                <select
                                    value={survey_version_id}
                                    onChange={(e) => {
                                        setsurvey_version_id(e.target.value);
                                        setQuestionsError("");
                                        setResponsesError("");
                                        setQuestionsSuccess("");
                                        setResponsesSuccess("");
                                    }}
                                    className={`border rounded-md px-2 py-1 ${!survey_version_id ? "border-red-500" : "border-gray-300"
                                        }`}
                                >
                                    <option value="">Select a survey</option>
                                    {versions?.length > 0 ? (
                                        versions?.map((v) => (
                                            <option
                                                key={v.survey_version_id}
                                                value={String(v.survey_version_id)}
                                            >
                                                {v.survey_name} - {v.version_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">No survey versions found</option>
                                    )}
                                </select>

                                {!survey_version_id && (
                                    <p className="text-amber-600 mt-2 text-sm">
                                        A survey version must be selected before uploading files.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UploadPage;