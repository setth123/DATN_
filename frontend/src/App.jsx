import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import CandidatePage from "./pages/CandidatePage";
import CompanyInfoPage from "./pages/CompanyInfoPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CandidateForm from "./components/CandidateForm";
import CompanyForm from "./components/CompanyForm"
import JobDetailPage from "./pages/JobDetailPage";
import Header from "./components/Header";
import Footer from "./components/Footer";
import JobForm from "./components/JobForm";
import SearchResultsPage from "./pages/SearchResultsPage";
import { ChatProvider } from "./ChatContext";
import { InterviewProvider } from "./InterviewContext";
import ChatWidget from "./components/ChatWidget";
import AIInterviewWidget from "./components/AIInterviewWidget";
import { initSocket } from "./services/socket";
import authService from "./services/auth.service";

function App() {
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      initSocket();
    }
  }, []);

  return (
    <InterviewProvider>
      <ChatProvider>
        <Router>
          <div className="min-h-screen bg-gray-900 text-white">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route
                  path="/me"
                  element={
                    //<ProtectedRoute>
                      <CandidatePage isCurrentUser={true} />
                    //</ProtectedRoute>
                  }
                />
                <Route
                  path="/candidate/:candidateId"
                  element={
                    <CandidatePage isCurrentUser={false} />
                  }
                />
                <Route
                  path="/candidate/createOrEdit"
                  element={
                    //<ProtectedRoute>
                    <CandidateForm />
                    //</ProtectedRoute>
                  }
                />
                <Route
                  path="/company/me"
                  element={
                    //<ProtectedRoute>
                    <CompanyInfoPage isCurrentUser={true}/>
                    //</ProtectedRoute>
                  }
                />
                <Route
                  path="/company/:companyId"
                  element={
                    //<ProtectedRoute>
                    <CompanyInfoPage isCurrentUser={false}/>
                    //</ProtectedRoute>
                  }
                />
                <Route
                  path="/company/createOrEdit"
                  element={
                    //<ProtectedRoute>
                    <CompanyForm />
                    //</ProtectedRoute>
                  }
                />
                <Route
                  path="/company/create-job"
                  element={
                    //<ProtectedRoute>
                    <JobForm />
                    //</ProtectedRoute>
                  }
                />
                <Route
                  path="/job/edit/:jobId"
                  element={
                    //<ProtectedRoute>
                    <JobForm />
                    //</ProtectedRoute>
                  }
                />
                  <Route
                    path="/search" // Thay đổi route để chỉ khớp với /search
                    element={
                      <SearchResultsPage />
                    }
                  />
                <Route 
                  path="/jobs/:id"
                  element={
                    <JobDetailPage />
                  }
                />
              </Routes>
            </main>
            <Footer />
            <ChatWidget />
            <AIInterviewWidget />
          </div>
        </Router>
      </ChatProvider>
    </InterviewProvider>
  );
}

export default App;
