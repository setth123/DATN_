import React, { createContext, useState, useContext } from 'react';

const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
  const [isInterviewWidgetOpen, setInterviewWidgetOpen] = useState(false);

  const openInterviewWidget = () => {
    setInterviewWidgetOpen(true);
  };

  const closeInterviewWidget = () => {
    setInterviewWidgetOpen(false);
  };

  return (
    <InterviewContext.Provider value={{ isInterviewWidgetOpen, openInterviewWidget, closeInterviewWidget }}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => useContext(InterviewContext);
