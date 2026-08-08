import React from "react";
import { Link } from "react-router-dom";
import companyLogoPlaceholder from '../assets/company-logo-placeholder.svg';

const CompanyCard = ({ company }) => {
  return (
    <Link to={`/company/${company._id}`} className="block">
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg transition-shadow duration-300 hover:shadow-green-500/20 h-full flex flex-col items-center text-center">
        <img
          src={company.logoURL ? `http://localhost:4000/${company.logoURL}` : companyLogoPlaceholder}
          alt={`${company.name} Logo`}
          className="mb-4 h-20 w-20 rounded-full object-cover border-2 border-gray-600"
        />
        <h3 className="text-xl font-bold text-green-500 mb-2">
          {company.name}
        </h3>
        <p className="text-gray-400 text-sm">{company.mainOccupation}</p>
        {/* Optionally display number of jobs if available in company object */}
        {company.jobsCount && <p className="text-gray-400 text-sm mt-1">{company.jobsCount} jobs</p>}
      </div>
    </Link>
  );
};

export default CompanyCard;
