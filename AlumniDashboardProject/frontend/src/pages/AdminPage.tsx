import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";

function AdminPage() {
    const [versions, setVersions] = useState<any[]>([]);
    const [questionsFile, setQuestionsFile] = useState<File | null>(null);
    const [responsesFile, setResponsesFile] = useState<File | null>(null);
    const [employFile, setEmployFile] = useState<File | null>(null);
    const [listFile, setlistFile] = useState<File | null>(null);
    const [surveyVersionId, setSurveyVersionId] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const [surveyVersionData, setSurveyVersionData] = useState({
        surveyName: "",
        version: "",
        surveyDate: ""
    });


    const [uploadingQuestions, setUploadingQuestions] = useState(false);
    const [uploadingResponses, setUploadingResponses] = useState(false);
    const [uploadingEmployment, setUploadingEmployment] = useState(false);
    const [uploadingEmploy, setUploadingEmploy] = useState(false);
    const [submittingSurveyVersion, setSubmittingSurveyVersion] = useState(false);

    const [uploadingList, setuploadingList] = useState(false);

    const [questionsError, setQuestionsError] = useState("");
    const [responsesError, setResponsesError] = useState("");
    const [employError, setEmployError] = useState("");
    const [listError, setlistError] = useState("");

    const [questionsSuccess, setQuestionsSuccess] = useState("");
    const [responsesSuccess, setResponsesSuccess] = useState("");
    const [employSuccess, setEmploySuccess] = useState("");
    const [listSuccess, setlistSuccess] = useState("");


    const [fromAdminPage, setFromAdminPage] = useState(true);

    useEffect(() => {
        const fetchSurveyVersions = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/surveys/versions");
                const data = await res.json();
                setVersions(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching survey versions:", err);
                setVersions([]);
            }
        };

        fetchSurveyVersions();
    }, []);

    const hasValidSurveyVersion = surveyVersionId !== "";

    const canUploadQuestions =
        !!questionsFile && hasValidSurveyVersion && !uploadingQuestions;

    const canUploadResponses =
        !!responsesFile && hasValidSurveyVersion && !uploadingResponses;

    const questionsValidationMessage = !surveyVersionId
        ? "Please select a survey version."
        : !questionsFile
            ? "Please choose a survey questions CSV file."
            : "";

    const responsesValidationMessage = !surveyVersionId
        ? "Please select a survey version."
        : !responsesFile
            ? "Please choose a responses CSV file."
            : "";

    // const handleSurveyVersionInputChange = (
    //     e: React.ChangeEvent<HTMLInputElement>
    // ) => {
    //     const { name, value } = e.target;

    //     setSurveyVersionData((prev) => ({
    //         ...prev,
    //         [name]: value
    //     }));

    //     setSurveyVersionError("");
    //     setSurveyVersionSuccess("");
    // };


    // const handleUploadQuestions = async (e: React.SubmitEvent) => {
    //     e.preventDefault();

    //     setQuestionsError("");
    //     setQuestionsSuccess("");

    //     if (!questionsFile) {
    //         setQuestionsError("Please choose a survey questions CSV file first.");
    //         return;
    //     }

    //     if (!surveyVersionId) {
    //         setQuestionsError("Please choose a survey version first.");
    //         return;
    //     }

    //     const formData = new FormData();
    //     formData.append("file", questionsFile);
    //     formData.append("surveyVersionId", surveyVersionId);

    //     try {
    //         setUploadingQuestions(true);

    //         const response = await fetch(
    //             "http://localhost:5000/api/import/admin/upload-questions",
    //             {
    //                 method: "POST",
    //                 body: formData
    //             }
    //         );

    //         const result = await response.json();

    //         if (!response.ok) {
    //             setQuestionsError(
    //                 result.error || "Upload failed with an unknown error."
    //             );
    //             return;
    //         }

    //         setQuestionsSuccess("Survey questions uploaded successfully.");
    //         setQuestionsFile(null);
    //     } catch (error) {
    //         console.error("Question upload error:", error);
    //         setQuestionsError(
    //             "Something went wrong while uploading the questions file. Please try again."
    //         );
    //     } finally {
    //         setUploadingQuestions(false);
    //     }
    // };

    // const handleUploadResponses = async (e: React.SubmitEvent) => {
    //     e.preventDefault();

    //     setResponsesError("");
    //     setResponsesSuccess("");

    //     if (!responsesFile) {
    //         setResponsesError("Please choose a responses CSV file first.");
    //         return;
    //     }

    //     if (!surveyVersionId) {
    //         setResponsesError("Please choose a survey version first.");
    //         return;
    //     }

    //     const formData = new FormData();
    //     formData.append("file", responsesFile);
    //     formData.append("surveyVersionId", surveyVersionId);
    //     formData.append("fromAdminPage", "true");

    //     try {
    //         setUploadingResponses(true);

    //         const response = await fetch(
    //             "http://localhost:5000/api/import/admin/upload-legacy-responses",
    //             {
    //                 method: "POST",
    //                 body: formData

    //             }
    //         );

    //         const result = await response.json();

    //         if (!response.ok) {
    //             setResponsesError(
    //                 result.error || "Upload failed with an unknown error."
    //             );
    //             return;
    //         }

    //         setResponsesSuccess("Responses uploaded successfully.");
    //         setResponsesFile(null);
    //     } catch (error) {
    //         console.error("Response upload error:", error);
    //         setResponsesError(
    //             "Something went wrong while uploading the responses file. Please try again."
    //         );
    //     } finally {
    //         setUploadingResponses(false);
    //     }
    // };


    const handleEmploymentUpload = async (e: React.SubmitEvent) => {
        e.preventDefault();

        setEmployError("");
        setEmploySuccess("");

        if (!employFile) {
            setEmployError("Please choose a responses CSV file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", employFile);

        try {
            setUploadingEmployment(true);

            const response = await fetch(
                "http://localhost:5000/api/import/admin/employment-upload",
                {
                    method: "POST",
                    body: formData
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setEmployError(
                    result.error || "Upload failed with an unknown error."
                );
                return;
            }

            setEmploySuccess("Employment data uploaded successfully.");
            setEmployError(null);
        } catch (error) {
            console.error("Employment data upload error:", error);
            setEmployError(
                "Something went wrong while uploading the responses file. Please try again."
            );
        } finally {
            setUploadingEmployment(false);
        }
    };



    const handleOriginalListUpload = async (e: React.SubmitEvent) => {
        e.preventDefault();

        setlistError("");
        setlistSuccess("");

        if (!listFile) {
            setlistError("Please choose a responses CSV file first.");
            return;
        }

        const formData = new FormData();
        formData.append("file", listFile);

        try {
            setuploadingList(true);

            const response = await fetch(
                "http://localhost:5000/api/import/admin/list-upload",
                {
                    method: "POST",
                    body: formData
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setlistError(
                    result.error || "List upload failed with an unknown error."
                );
                return;
            }

            setlistSuccess("List data uploaded successfully.");
            setlistError(null);
        } catch (error) {
            console.error("List data upload error:", error);
            setlistError(
                "Something went wrong while uploading the responses file. Please try again."
            );
        } finally {
            setuploadingList(false);
        }
    };



    return (<div>
        <PageHeader
            title="Admin Controls"
            description="THIS PAGE IS FOR ADMIN USE ONLY--FOR MANAGEMENT OF LEGACY DATA"
        />

        <div className="flex flex-col md:flex-row gap-12 mt-15 items-center ">
            {/* <div className="upload-question-container text-wrap shrink max-w-200 min-w-100">
                <h2 className="text-2xl">Upload Legacy Survey Questions</h2>
                <p className="mt-4 text-gray-500">
                    This takes in a list of LEGACY question data, header columns must match the following format: <br />
                    [ question_code,    question_text,  question_type]
                </p>

                <form onSubmit={handleUploadQuestions}>
                    <div style={{ marginTop: "1rem" }}>
                        <input
                            className="btn btn-primary flex items-center gap-2"
                            type="file"
                            accept=".csv"
                            onChange={(e) => {
                                setQuestionsFile(e.target.files?.[0] || null);
                                setQuestionsError("");
                                setQuestionsSuccess("");
                            }}
                        />
                    </div>

                    {questionsFile && (
                        <p className="text-sm text-gray-600 mt-2">
                            Selected file: {questionsFile.name}
                        </p>
                    )}

                    {!questionsError && !questionsSuccess && questionsValidationMessage && (
                        <p className="text-amber-600 mt-2">
                            {questionsValidationMessage}
                        </p>
                    )}

                    {questionsError && (
                        <p className="text-red-600 mt-2">{questionsError}</p>
                    )}

                    {questionsSuccess && (
                        <p className="text-green-600 mt-2">{questionsSuccess}</p>
                    )}

                    <button
                        className="btn btn-primary flex items-center gap-2"
                        type="submit"
                        style={{ marginTop: "1rem" }}
                        disabled={!canUploadQuestions}
                    >
                        {uploadingQuestions
                            ? "Uploading Questions..."
                            : "Upload Survey Questions"}
                    </button>
                </form>
            </div> */}
            {/* 
            <div className="survey-version-container mt-5 flex-initial ml-10">
                <div>
                    <div className="form-field-container">
                        <label className="text-xl">Survey Version: </label>
                        <select
                            value={surveyVersionId}
                            onChange={(e) => {
                                setSurveyVersionId(e.target.value);
                                setQuestionsError("");
                                setQuestionsSuccess("");
                            }}
                            className={`border rounded-md px-2 py-1 ${!surveyVersionId ? "border-red-500" : "border-gray-300"
                                }`}
                        >
                            <option value="">Select a survey</option>
                            {versions.length > 0 ? (
                                versions.map((v) => (
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

                        {!surveyVersionId && (
                            <p className="text-amber-600 mt-2 text-sm">
                                A survey version must be selected before uploading files.
                            </p>
                        )}
                    </div>
                </div>
            </div> */}


        </div>


        <div>
            {/* <div className="mt-15">
                <h2 className="text-2xl">Upload Legacy Response Data</h2>
                <p className="mt-4 text-gray-500">This response upload only accepts LEGACY CSV files containing ONE question_code header row</p>

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
            </div> */}
        </div>


        <div>


        </div>


        <div className="mt-15">
            <h2 className="text-2xl">Upload Employment Data</h2>
            <p className="mt-4 text-gray-500">Used to upload Employment CSV data</p>

            <form onSubmit={handleEmploymentUpload}>
                <div style={{ marginTop: "1rem" }}>
                    <input
                        className="btn btn-primary flex items-center gap-2"
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                            setEmployFile(e.target.files?.[0] || null);
                            setEmployError("");
                            setEmploySuccess("");
                        }}
                    />
                </div>

                {employError && (
                    <p className="text-red-600 mt-2">{employError}</p>
                )}

                {employSuccess && (
                    <p className="text-green-600 mt-2">{employSuccess}</p>
                )}


                <button
                    className="btn btn-primary flex items-center gap-2"
                    type="submit"
                    style={{ marginTop: "1rem" }}
                >
                    {uploadingEmploy
                        ? "Uploading Employment Data..."
                        : "Upload Employment Data"}
                </button>
            </form>
        </div>




        <div className="mt-15">
            <h2 className="text-2xl">Upload Alumni Original List</h2>
            <p className="mt-4 text-gray-500">Used to upload Original Alumni CSV data</p>

            <form onSubmit={handleOriginalListUpload}>
                <div style={{ marginTop: "1rem" }}>
                    <input
                        className="btn btn-primary flex items-center gap-2"
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                            setlistFile(e.target.files?.[0] || null);
                            setlistError("");
                            setlistSuccess("");
                        }}
                    />
                </div>

                {listError && (
                    <p className="text-red-600 mt-2">{listError}</p>
                )}

                {listSuccess && (
                    <p className="text-green-600 mt-2">{listSuccess}</p>
                )}


                <button
                    className="btn btn-primary flex items-center gap-2"
                    type="submit"
                    style={{ marginTop: "1rem" }}
                >
                    {uploadingList
                        ? "Uploading Alumni List Data..."
                        : "Upload Alumni List Data"}
                </button>
            </form>
        </div>



    </div>)
}


export default AdminPage;