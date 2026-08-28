import React, { useState, useEffect, useMemo } from 'react';
import { FileQuestion, PieChart, FileText, BarChart, ArrowRight, ScrollText, Maximize, Search, Filter, Download, User } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { apiService } from '../../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Survey } from '../types/survey';
import { Question } from '../types/question';

export const Surveys: React.FC = () => {
  const [activeTab, setActiveTab] = useState('surveys');
  const navigate = useNavigate();

  // Mock data for demonstration
  const surveyQuestions = [
    { id: 1, category: 'Employment', text: 'How satisfied are you with your current employment?', type: 'option', responseCount: 48 },
    { id: 2, category: 'Education', text: 'How well did your degree prepare you for your career?', type: 'option', responseCount: 52 },
    { id: 3, category: 'Feedback', text: 'What suggestions do you have for improving the program?', type: 'text', responseCount: 37 },
    { id: 4, category: 'Employment', text: 'What is your current salary range?', type: 'option', responseCount: 45 },
    { id: 5, category: 'Education', text: 'Rate the quality of faculty instruction', type: 'numeric', responseCount: 50 },
    { id: 6, category: 'Feedback', text: 'What resources would have been helpful during your studies?', type: 'text', responseCount: 33 },
  ];

  // Mock data for statistics
  const categoryResponseRates = [
    { category: 'Employment', rate: 85 },
    { category: 'Education', rate: 92 },
    { category: 'Feedback', rate: 64 },
    { category: 'Future Plans', rate: 71 },
  ];

  const questionTypeDistribution = [
    { type: 'Multiple Choice', count: 24 },
    { type: 'Text Response', count: 12 },
    { type: 'Rating Scale', count: 18 },
    { type: 'Yes/No', count: 6 },
  ];

  const [survey, setSurvey] = useState<Survey[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [selectedSurvey, setSelectedSurvey] = useState('')
  const [surveyIsSelected, setSurveyIsSelected] = useState(false);

  const [questionCategories, setQuestionCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [searchTerm, setSearchTerm] = useState("");


  const handleDropdownSelection = (e) => {
    setSelectedSurvey(e.target.value);
    setSelectedCategory("all");
    setSurveyIsSelected(true);
    if (!e.target.value) {
      setSurveyIsSelected(false);
    }
  }

  const handleViewResponses = (surveyVersionId: number) => {
    setSelectedSurvey(String(surveyVersionId));
    navigate(`/viewResponsesPage/${surveyVersionId}`);
  };

  useEffect(() => {
    const fetchSurveyDetails = async () => {
      const data = await apiService.getSurveyData();
      setSurvey(Array.isArray(data) ? data : []);
    };

    fetchSurveyDetails();
  }, []);


  const openQuestionEditor = (id) => {
    setActiveTab('questions');
    setSurveyIsSelected(true);
    setSelectedSurvey(id);
  }



  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedSurvey) return;

      try {
        const data = await apiService.getQuestionData(selectedSurvey);

        setQuestions(Array.isArray(data) ? data : []);
        const categories = [...new Set(
          data.map(question => question.question_category)
            .filter((question): question is string => !!question)
        )].sort();
        console.log(data);

        setQuestionCategories(categories);

        console.log(categories); // Logs the new array
      } catch (error) {
        console.error(error);
      }
    };

    fetchQuestions();
  }, [selectedSurvey]);

  const filteredQuestions = questions.filter((question) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch = question.question_text?.toLowerCase().includes(search) ||
      question.question_code?.toLowerCase().includes(search)

    const matchesCategory =
      selectedCategory === "all" ||
      question.question_category === selectedCategory;

    return matchesCategory && matchesSearch;
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const displayedQuestions = React.useMemo(() => {

    const questions = [...filteredQuestions];

    questions.sort((a, b) => b.respondents - a.respondents);

    return questions;
  }, [filteredQuestions]);

  const handleEdit = (questionId: number) => {
    navigate(
      `/getQuestionEdit?survey_version=${selectedSurvey}&question=${questionId}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Surveys</h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'surveys'
              ? 'border-weber-purple text-weber-purple-light'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            onClick={() => setActiveTab('surveys')}
          >
            Surveys
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'questions'
              ? 'border-weber-purple text-weber-purple-light'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            onClick={() => setActiveTab('questions')}
          >
            Questions
          </button>
        </nav>
      </div>

      {/* Surveys Tab */}
      {activeTab === 'surveys' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {survey.map((survey) => (
              <div
                key={survey.survey_id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center ">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{survey.survey_name} - {survey.version_name}</h3>
                    {/* <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(survey.created_at).toLocaleDateString()}
                    </p> */}
                  </div>
                  <div className="bg-weber-purple-light/15 p-3 rounded-full text-weber-purple">
                    <ScrollText size={20} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Responses</p>
                    <p className="text-xl font-semibold text-gray-800">{survey.responseCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completion Rate</p>
                    <p className="text-xl font-semibold text-gray-800">{survey.completion_rate}%</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                  <button
                    onClick={() => handleViewResponses(survey.survey_version_id)}
                    className="text-weber-purple-light hover:text-grey text-sm font-medium hover:text-shadow-lg/10">
                    View Responses
                  </button>
                  <button className="text-weber-purple-light hover:text-grey text-sm font-medium hover:text-shadow-lg/10"
                    onClick={() => openQuestionEditor(survey.survey_version_id)}
                  >
                    Edit Survey
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-6 text-black">
          {/* Drop Down to select Survey */}
          <div className="flex justify-between items-end border-b border-weber-purple/20 pb-5 text-weber-purple">
            <div className="flex flex-col ">
              <label className="pb-3" >Select a Survey:</label>
              <select className=" w-full max-w-xs overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-gray-300 shadow-sm min-w-25 focus:ring-weber-purple focus:border-weber-purple sm:text-sm max-w-50" id="surveys"
                value={selectedSurvey}
                onChange={handleDropdownSelection}>
                <option value=''>Select Survey</option>
                {survey.map((survey) => (
                  <option
                    key={survey.survey_id}
                    value={survey.survey_version_id}
                  >
                    {survey.survey_name} - {survey.version_name}
                  </option>
                ))}

              </select>
            </div>

            <div className="flex justify-between items-center ">
              <Filter size={16} />
              <select
                onChange={handleFilterChange}
                value={selectedCategory}
                className=" w-full max-w-xs overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-gray-300 shadow-sm min-w-25 focus:ring-weber-purple focus:border-weber-purple sm:text-sm max-w-50">
                <option value="all">All Question Categories</option>
                {questionCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center relative text-weber-purple">
              <div className="">
                <input
                  type="text"
                  placeholder="Search questions..."
                  disabled={!selectedSurvey}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-weber-purple-200 focus:border-weber-purpple-200 min-w-full sm:text-sm ${selectedSurvey ? "border-gray-500 " : "border-gray-300"}`}
                />
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 " size={16} />
              </div>
              {/* <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add Question
                </button> */}
            </div>
          </div>



          {surveyIsSelected && (
            <>


              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Question
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th> */}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Responses
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayedQuestions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            No questions found.
                          </td>
                        </tr>
                      ) :

                        (displayedQuestions.map((question) => (
                          <tr key={question.question_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {question.question_text}
                              </div>
                              <div className="text-xs font-medium text-gray-500 indent-2 mt-1">
                                {question.subquestion_text}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {question.question_category}
                              </span>
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {question.type === 'option' ? 'Multiple Choice' :
                              question.type === 'text' ? 'Text Response' : 'Numeric'}
                          </td> */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {question.respondents}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold text-center">
                              <button
                                onClick={() => handleEdit(question.question_id)}
                                className="text-gray-600 hover:text-purple-800 mr-3">
                                Edit
                              </button>

                            </td>
                          </tr>
                        )))}
                    </tbody>
                  </table>

                </div>
              </div>
            </>
          )}


        </div>
      )}
    </div>
  );
};