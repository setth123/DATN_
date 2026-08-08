import React, { useState } from "react";
import candidateService from "../services/candidate.service";
import { useNavigate } from "react-router-dom";
import plusIcon from '../assets/plus.svg';
import trashIcon from '../assets/trash.svg';
import uploadIcon from '../assets/upload.svg';

const CandidateForm = () => {
  const candidateData = localStorage.getItem("candidate");
  const parsedCandidateData = candidateData ? JSON.parse(candidateData) : null;

  const [formData, setFormData] = useState({
    fullName: parsedCandidateData?.fullName || "",
    phone: parsedCandidateData?.phone || "",
    title: parsedCandidateData?.title || "",
    bio: parsedCandidateData?.bio || "",
    skills: parsedCandidateData?.skills || [],
    experiences:
      parsedCandidateData?.experiences && parsedCandidateData.experiences.length > 0
        ? parsedCandidateData.experiences
        : [{ company: "", position: "", startDate: "", endDate: "", description: "" }],
    education:
      parsedCandidateData?.education && parsedCandidateData.education.length > 0
        ? parsedCandidateData.education
        : [{ school: "", degree: "", startYear: "", endYear: "" }],
    isOpenToWork: parsedCandidateData?.isOpenToWork ?? true, // Default to true if not present
    resumes: parsedCandidateData?.resumes || [],
  });

  const [newResumes, setNewResumes] = useState([]);
  const [deletedResumes, setDeletedResumes] = useState([]);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setNewResumes([...newResumes, ...e.target.files]);
  };

  const handleDeleteExistingResume = (resumeToDelete) => {
    setFormData({
      ...formData,
      resumes: formData.resumes.filter((resume) => resume.fileUrl !== resumeToDelete.fileUrl),
    });
    setDeletedResumes([...deletedResumes, resumeToDelete]);
  };

  const handleRemoveNewResume = (fileToRemove) => {
    setNewResumes(newResumes.filter((file) => file !== fileToRemove));
  };

  const handleDynamicChange = (e, index, section) => {
    const { name, value } = e.target;
    const list = [...formData[section]];
    list[index][name] = value;
    setFormData({ ...formData, [section]: list });
  };

  const addDynamicField = (section) => {
    let newItem;
    if (section === "skills") {
      newItem = { name: "", level: "Cơ bản" };
    } else if (section === "experiences") {
      newItem = { company: "", position: "", startDate: "", endDate: "", description: "" };
    } else {
      // education
      newItem = { school: "", degree: "", startYear: "", endYear: "" };
    }
    setFormData({ ...formData, [section]: [...formData[section], newItem] });
  };

  const removeDynamicField = (index, section) => {
    const list = [...formData[section]];
    list.splice(index, 1);
    setFormData({ ...formData, [section]: list });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const data = new FormData();

      // Append all non-file and non-array data
      Object.keys(formData).forEach((key) => {
        if (key !== "resumes" && !Array.isArray(formData[key])) {
          data.append(key, formData[key]);
        }
      });
      
      // Append arrays as JSON strings
      data.append("skills", JSON.stringify(formData.skills));
      data.append("experiences", JSON.stringify(formData.experiences));
      data.append("education", JSON.stringify(formData.education));
      
      // Append new files
      newResumes.forEach((file) => {
        data.append("resumes", file);
      });

      // Append deleted resumes JSON string
      if (deletedResumes.length > 0) {
        data.append("deletedResumes", JSON.stringify(deletedResumes));
      }

      const response = await candidateService.createOrEdit(data);
      setSuccess("Cập nhật thông tin ứng viên thành công!");
      localStorage.setItem("candidateProfile", JSON.stringify(response.data.data));
      navigate("/me");
    } catch (error) {
      setError(error.response?.data?.message || "An error occurred.");
    }
  };

  const inputStyle =
    "w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500";
  const labelStyle = "block font-bold mb-1 text-white";
  const buttonStyle =
    "rounded-lg bg-green-600 px-4 py-2 font-bold text-white transition duration-300 hover:bg-green-700";
  const removeButtonStyle =
    "rounded-lg bg-red-600 px-3 py-1 font-bold text-white transition duration-300 hover:bg-red-700";
  const addButtonStyle =
    "rounded-lg bg-blue-600 px-4 py-2 font-bold text-white transition duration-300 hover:bg-blue-700 mt-2";
  const sectionTitleStyle = "text-xl font-bold text-green-500 mt-6 mb-4";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-center text-green-500">
            Cập nhật hồ sơ ứng viên
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
                            <label htmlFor="fullName" className={labelStyle}>Họ tên đầy đủ *</label>
                            <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className={inputStyle} required />
                        </div>
                        <div>
                            <label htmlFor="phone" className={labelStyle}>Số điện thoại *</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={inputStyle} required />
                        </div>
                        <div>
                            <label htmlFor="title" className={labelStyle}>Vị trí hiện tại *</label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} className={inputStyle} required />
                        </div>
                        <div>
                            <label htmlFor="bio" className={labelStyle}>Giới thiệu bản thân *</label>
                            <textarea name="bio" value={formData.bio} onChange={handleInputChange} className={inputStyle} rows="4" required />
                        </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isOpenToWork"
                id="isOpenToWork"
                checked={formData.isOpenToWork}
                onChange={handleInputChange}
                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-600 rounded"
              />
              <label htmlFor="isOpenToWork" className="ml-2 block text-white">Sẵn sàng làm việc</label>
            </div>
            <div>
              <label htmlFor="cv" className={labelStyle}>
                Quản lý CV
              </label>
              
              <div className="space-y-2">
                {formData.resumes.map((resume, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
                    <a
                      href={`http://localhost:4000/${resume.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:underline"
                    >
                      {resume.fileName}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingResume(resume)}
                      className={`${removeButtonStyle} flex items-center`}
                    >
                      <img src={trashIcon} alt="Remove" className="h-4 w-4 mr-1" />
                      Xóa
                    </button>
                  </div>
                ))}
              </div>

              
              <div className="mt-2 space-y-2">
                {newResumes.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewResume(file)}
                      className={`${removeButtonStyle} flex items-center`}
                    >
                      <img src={trashIcon} alt="Remove" className="h-4 w-4 mr-1" />
                      Xóa
                    </button>
                  </div>
                ))}
              </div>

              
              <div className="mt-4">
                <label htmlFor="cv-upload" className={labelStyle}>Tải lên CV mới</label>
                <div className="relative">
                <input
                  id="cv-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className={`${inputStyle} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200`}
                />
                <img src={uploadIcon} alt="Upload" className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              </div>
            </div>

            
            <div className="border-t border-gray-700 pt-4">
                            <h3 className={sectionTitleStyle}>Kỹ năng</h3>
                            {formData.skills.map((skill, index) => (
                                <div key={index} className="flex items-center space-x-4 mb-4 p-4 bg-gray-700 rounded-lg">
                                    <input type="text" name="name" placeholder="Tên kỹ năng" value={skill.name} onChange={e => handleDynamicChange(e, index, "skills")} className={inputStyle} />
                                    <select name="level" value={skill.level} onChange={e => handleDynamicChange(e, index, "skills")} className={inputStyle}>
                                        {["Cơ bản", "Trung bình", "Khá", "Thành thạo", "Chuyên gia"].map(level => <option key={level} value={level}>{level}</option>)}
                                    </select>
                                    <button type="button" onClick={() => removeDynamicField(index, "skills")} className={`${removeButtonStyle} flex items-center`}><img src={trashIcon} alt="Remove" className="h-4 w-20 mr-1" />Xóa</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addDynamicField("skills")} className={`${addButtonStyle} flex items-center`}><img src={plusIcon} alt="Add" className="h-4 w-4 mr-2" />Thêm kỹ năng</button>
                        </div>

                        
                        <div className="border-t border-gray-700 pt-4">
                            <h3 className={sectionTitleStyle}>Kinh nghiệm làm việc</h3>
                            {formData.experiences.map((exp, index) => (
                                <div key={index} className="space-y-4 mb-4 p-4 bg-gray-700 rounded-lg">
                                    <input type="text" name="company" placeholder="Công ty" value={exp.company} onChange={e => handleDynamicChange(e, index, "experiences")} className={inputStyle} />
                                    <input type="text" name="position" placeholder="Vị trí" value={exp.position} onChange={e => handleDynamicChange(e, index, "experiences")} className={inputStyle} />
                                    <div className="flex space-x-4">
                                        <input type="date" name="startDate" value={exp.startDate} onChange={e => handleDynamicChange(e, index, "experiences")} className={inputStyle} />
                                        <input type="date" name="endDate" value={exp.endDate} onChange={e => handleDynamicChange(e, index, "experiences")} className={inputStyle} />
                                    </div>
                                    <textarea name="description" placeholder="Mô tả công việc" value={exp.description} onChange={e => handleDynamicChange(e, index, "experiences")} className={inputStyle} rows="3" />
                                    <button type="button" onClick={() => removeDynamicField(index, "experiences")} className={removeButtonStyle}>Xóa kinh nghiệm</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addDynamicField("experiences")} className={addButtonStyle}>Thêm kinh nghiệm</button>
                        </div>

                        
                        <div className="border-t border-gray-700 pt-4">
                            <h3 className={sectionTitleStyle}>Học vấn</h3>
                            {formData.education.map((edu, index) => (
                                <div key={index} className="space-y-4 mb-4 p-4 bg-gray-700 rounded-lg">
                                    <input type="text" name="school" placeholder="Trường học" value={edu.school} onChange={e => handleDynamicChange(e, index, "education")} className={inputStyle} />
                                    <input type="text" name="degree" placeholder="Bằng cấp" value={edu.degree} onChange={e => handleDynamicChange(e, index, "education")} className={inputStyle} />
                                    <div className="flex space-x-4">
                                        <input type="number" name="startYear" placeholder="Năm bắt đầu" value={edu.startYear} onChange={e => handleDynamicChange(e, index, "education")} className={inputStyle} />
                                        <input type="number" name="endYear" placeholder="Năm kết thúc" value={edu.endYear} onChange={e => handleDynamicChange(e, index, "education")} className={inputStyle} />
                                    </div>
                                    <button type="button" onClick={() => removeDynamicField(index, "education")} className={removeButtonStyle}>Xóa học vấn</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addDynamicField("education")} className={addButtonStyle}>Thêm học vấn</button>
                        </div>

            {error && <p className="text-red-500 text-center">{error}</p>}
            {success && <p className="text-green-500 text-center">{success}</p>}
            <button type="submit" className={`${buttonStyle} w-full`}>
              Cập nhật hồ sơ
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CandidateForm;
