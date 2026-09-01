import React, { useEffect, useState, } from 'react';
import { apiService } from '../../services/api';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { ArrowLeft, SquareArrowOutUpRight } from 'lucide-react';
import { Question } from '../types/question';
import { Response } from '../types/responses';
import DynamicDataTable from '../components/DynamicDataTable';
import { Alumni } from '../types/alumni';


const ViewSurveyResponsesPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
    const [selectedAlumni, setSelectedAlumni] = useState({ alumni_id: 0, first_name: "", last_name: "" });

    const [surveyQuestions, setSurveyQuestions] = useState<Question[]>([]);
    const [responses, setResponses] = useState<Response[]>([]);
    const [responseQuestionsForTable, setResponsequestions] = useState<string[]>([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortingMode, setSortingMode] = useState("all");




    useEffect(() => {
        const fetchSurveyQuestions = async () => {
            const data = await apiService.getQuestionData(id);
            console.log({ id });
            setSurveyQuestions(Array.isArray(data) ? data : []);
            console.log(surveyQuestions);
        };

        const getResponseData = async () => {
            setLoading(true);
            const data = await apiService.getResponseData(id);
            console.log("API Response:", data);
            setResponses(Array.isArray(data) ? data : []);
            const questionSet = new Set<string>();

            data.forEach(response => {
                Object.keys(response.responses ?? {}).forEach(question => {
                    questionSet.add(question);
                });
            });

            setResponsequestions([...questionSet]);


            setLoading(false);
            console.log(data);
            console.log(data[0]);
            console.log(data[0]?.responses);
            console.log(Object.keys(data[0]?.responses ?? {}));
        };

        getResponseData();
        console.log("Retreived response data");
        fetchSurveyQuestions();
        console.log("Retreieved survey questions");


    }, [id, sortingMode]);



    const handleBack = () => {
        navigate(`/surveypage`);
    };

    const viewAlumniPage = () => {
        navigate(`/alumni/${selectedAlumni.alumni_id}`);
    }


    const handleRowClick = (row: Response) => {
        setSelectedRowId(row.survey_attempt_id);
        setSelectedAlumni({ alumni_id: row.alumni_id, first_name: row.first_name, last_name: row.last_name });
    };

    const answeredQuestions = [];

    responses.forEach(answers => {
        Object.entries(answers.responses ?? {}).forEach(([question, answer]) => {
            if (
                answer !== null &&
                answer !== undefined &&
                String(answer).trim() !== ""
            ) {
                answeredQuestions.push(question);
            }
            else {
            }
        });
    });

    const searchedResponses = responses.filter((r) => {
        const search = searchTerm.toLowerCase();

        return (
            r.first_name?.toLowerCase().includes(search) ||
            r.last_name?.toLowerCase().includes(search)

        );
    });

    const handleSortModeChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        setSortingMode(e.target.value);
    };


    const displayedResponses = React.useMemo(() => {

        const rows = [...searchedResponses];

        switch (sortingMode) {

            case "alphabet-f":
                rows.sort((a, b) =>
                    a.first_name.localeCompare(b.first_name)
                );
                break;

            case "alphabet-l":
                rows.sort((a, b) =>
                    a.last_name.localeCompare(b.last_name)
                );
                break;

            case "most":
                rows.sort((a, b) => {

                    const countA = Object.values(a.responses ?? {})
                        .filter(value => value != null && value !== "")
                        .length;

                    const countB = Object.values(b.responses ?? {})
                        .filter(value => value != null && value !== "")
                        .length;

                    return countB - countA;
                });
                break;

            default:
                break;
        }

        return rows;

    }, [searchedResponses, sortingMode]);




    const columns = [
        {
            id: "first_name",
            header: "First Name",
            value: (row) => row.first_name,
        },
        {
            id: "last_name",
            header: "Last Name",
            value: (row) => row.last_name,
        },

        ...responseQuestionsForTable?.map(question => ({
            id: question,
            header: question,
            value: (row) => row.responses[question]
        }))
    ];

    console.log(columns);
    console.log(columns[2]?.value(responses[0]));

    return (
        <div>
            <div>
                <button
                    onClick={handleBack}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    <span>Back To Surveys</span>
                </button>

                <div className="flex justify-around items-center pt-6 ">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search for Alumni..."
                            disabled={!responses}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-full`}
                        />
                        {/* <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /> */}
                    </div>
                    <div className="flex justify-around items-center">
                        <h2>Filters:</h2>
                        <div className="pl-5">
                            <select
                                name="response_filters"
                                onChange={handleSortModeChange}
                                className=" w-full max-w-xs overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-gray-300 shadow-sm min-w-40 focus:ring-weber-purple focus:border-weber-purple sm:text-sm"
                            >
                                <option value="all">All Responses</option>

                                <option value="alphabet-f">Alphabetical by First A-Z</option>
                                <option value="alphabet-l">Alphabetical by Last A-Z</option>
                                <option value="most">Most Questions Answered</option>

                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    {selectedRowId && (
                        <div className="flex flex-row justify-start gap-4 items-center">
                            <h2>Selected Alumni: </h2>
                            <div className="">
                                <button
                                    className="flex flex-row justify-between gap-2 items-center hover:cursor-pointer text-weber-purple-200 "
                                    onClick={viewAlumniPage}>
                                    <span>{selectedAlumni.first_name} {selectedAlumni.last_name}</span>
                                    <SquareArrowOutUpRight size={16} />

                                </button>
                            </div>
                        </div>)}
                </div>


            </div>

            <div className="pt-5">
                <DynamicDataTable
                    columns={columns}
                    data={displayedResponses}
                    loading={loading}
                    emptyMessage="No responses found."
                    sortConfig={null}
                    getRowId={(row) => row.survey_attempt_id}
                    onSort={() => { }}
                    selectedRowId={selectedRowId}
                    onRowClick={handleRowClick}
                />
            </div>



        </div>
    )
};

export default ViewSurveyResponsesPage;