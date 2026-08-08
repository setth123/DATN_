import candidateService from "../services/candidate.service";
import applicationService from "../services/application.service";
import { useState, useEffect } from "react";
const ApplyModal = ({ job, onClose, onApplySuccess }) => {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [newResume, setNewResume] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    candidateService.getMe().then(
      (response) => {
        if (response.data.data.resumes) {
          setResumes(response.data.data.resumes || []); // Đảm bảo resumes là một mảng
        }
      },
      (error) => {
        console.error("Error fetching candidate profile", error);
        setError("Failed to load your saved CVs."); // Hiển thị lỗi nếu không tải được CV
      }
    );
  }, []);

  const handleFileChange = (e) => {
    setNewResume(e.target.files[0]);
    setSelectedResume("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!selectedResume && !newResume) {
      setError("Please select a CV or upload a new one.");
      setLoading(false);
      return;
    }

    try {
      if (newResume) {
        const formData = new FormData();
        formData.append("cv", newResume); // 'cv' là tên trường mà backend mong đợi cho file upload
        await applicationService.applyForJob(job._id, formData);
      } else if (selectedResume) {
        await applicationService.applyForJob(job._id, selectedResume);
      }

      setLoading(false);
      onApplySuccess("Application submitted successfully!");
      onClose();
    } catch (error) {
      setLoading(false);
      setError(
        error.response?.data?.message || "An error occurred while applying."
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-green-500 mb-4">
          Apply for {job.title}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-white mb-2"
              htmlFor="resume-select"
            >
              Choose a saved CV
            </label>
            <select
              id="resume-select"
              className="w-full p-2 bg-gray-700 text-white rounded"
              value={selectedResume}
              onChange={(e) => {
                setSelectedResume(e.target.value);
                setNewResume(null);
              }}
              disabled={!!newResume}
            >
              <option value="">
                Select a CV
              </option>
              {resumes.map((resume, index) => (
                <option key={resume.fileUrl} value={resume.fileUrl}> {/* Sử dụng fileUrl làm giá trị */}
                  {resume.fileName || `CV ${index + 1}`} {/* Sử dụng fileName để hiển thị */}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center my-2">
            <span className="text-gray-400">OR</span>
          </div>

          <div className="mb-4">
            <label
              className="block text-white mb-2"
              htmlFor="resume-upload"
            >
              Upload a new CV
            </label>
            <input
              id="resume-upload"
              type="file"
              className="w-full text-white"
              onChange={handleFileChange}
              disabled={!!selectedResume} // Vô hiệu hóa nếu đã chọn CV có sẵn
            />
            {newResume && (
              <span className="text-gray-400 text-sm">{newResume.name}</span>
            )}
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Apply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyModal;
