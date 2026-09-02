import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AlumniDirectory from './pages/AlumniDirectory';
import UploadPage from './pages/UploadPage';
import AlumniDetail from './pages/AlumniDetail';
import AlumniEdit from './pages/AlumniEdit';
import AdminPage from './pages/AdminPage';
import { Surveys } from './pages/Surveys';
import ViewSurveyResponsesPage from './pages/ViewSurveyResponsesPage';
import QuestionPage from './pages/QuestionEditing';
// import EmploymentData from './pages/EmploymentData';
// import GraduateStudies from './pages/GraduateStudies';
// import Internships from './pages/Internships';
// import MentorProgram from './pages/MentorProgram';
// import AlumniDetail from './pages/AlumniDetail';

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <Layout sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/alumni" element={<AlumniDirectory />} />
                {/* <Route path="/uploadCSV" element={<UploadPage />} /> */}
                <Route path="/alumni/:id" element={<AlumniDetail />} />
                <Route path="/alumni/:id/edit" element={<AlumniEdit />} />
                {/* <Route path="/adminpage" element={<AdminPage />} /> */}
                <Route path='/surveypage' element={<Surveys />} />
                <Route path='/viewResponsespage/:id' element={<ViewSurveyResponsesPage />} />
                <Route path="/getQuestionEdit" element={<QuestionPage />} />
            </Routes>
        </Layout>
    );
}

export default App;