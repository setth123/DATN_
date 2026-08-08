import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import companyService from '../services/company.service';
import vnSubdivisions from '../utils/VNRegions';

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);


const CompanyForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        website: '',
        email: '',
        description: '',
        TIN: '',
        companyType: '',
        mainOccupation: '',
        foundedYear: '',
        logoURL: '',
    });
    const [logoFile, setLogoFile] = useState(null);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [detailedAddress, setDetailedAddress] = useState('');

    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    useEffect(() => {
        const companyData = localStorage.getItem('companyProfile');
        if (companyData) {
            const company = JSON.parse(companyData).company;
            setFormData({
                name: company.name || '',
                website: company.website || '',
                email: company.email || '',
                description: company.description || '',
                TIN: company.TIN || '',
                companyType: company.companyType || '',
                mainOccupation: company.mainOccupation || '',
                foundedYear: company.foundedYear || '',
                logoURL: company.logoURL || '',
            });

            if (company.location) {
                const parts = company.location.split(',').map(part => part.trim());
                if (parts.length === 3) {
                    setDetailedAddress(parts[0]);
                    setSelectedWard(parts[1]);
                    setSelectedProvince(parts[2]);
                }
            }
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setLogoFile(e.target.files[0]);
            setFormData(prev => ({ ...prev, logoURL: URL.createObjectURL(e.target.files[0]) }));
        }
    };

    const handleProvinceChange = (e) => {
        setSelectedProvince(e.target.value);
        setSelectedWard(''); // Reset ward on province change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fullLocation = [detailedAddress, selectedWard, selectedProvince].filter(Boolean).join(', ');

        const submissionData = new FormData();
        Object.keys(formData).forEach(key => {
            if (key !== 'logoURL') {
                submissionData.append(key, formData[key]);
            }
        });
        submissionData.append('location', fullLocation);
        if (logoFile) {
            submissionData.append('logo', logoFile);
        }
        
        try {
            const response = await companyService.createOrUpdateCompany(submissionData);
            localStorage.setItem('companyProfile', JSON.stringify(response.data.data));
            navigate('/company/me');
        } catch (error) {
            console.error("Failed to update company profile", error);
        }
    };
    
    const inputStyle = "w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500";
    const labelStyle = "block font-bold mb-1 text-white";
    const buttonStyle = "rounded-lg bg-green-600 px-4 py-2 font-bold text-white transition duration-300 hover:bg-green-700";
    
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
                    <h2 className="text-3xl font-bold mb-6 text-center text-green-500">Cập nhật thông tin công ty</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className={labelStyle}>Tên công ty *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div>
                                <label htmlFor="email" className={labelStyle}>Email liên hệ *</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div>
                                <label htmlFor="website" className={labelStyle}>Website</label>
                                <input type="text" name="website" value={formData.website} onChange={handleChange} className={inputStyle} />
                            </div>
                            <div>
                                <label htmlFor="TIN" className={labelStyle}>Mã số thuế *</label>
                                <input type="text" name="TIN" value={formData.TIN} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div>
                                <label htmlFor="companyType" className={labelStyle}>Loại hình công ty *</label>
                                <input type="text" name="companyType" placeholder="Product, Outsourcing, Startup,..." value={formData.companyType} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div>
                                <label htmlFor="mainOccupation" className={labelStyle}>Lĩnh vực chính *</label>
                                <input type="text" name="mainOccupation" value={formData.mainOccupation} onChange={handleChange} className={inputStyle} required />
                            </div>
                            <div>
                                <label htmlFor="foundedYear" className={labelStyle}>Năm thành lập *</label>
                                <input type="number" name="foundedYear" value={formData.foundedYear} onChange={handleChange} className={inputStyle} required />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className={labelStyle}>Mô tả công ty *</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} className={inputStyle} rows="4" required />
                        </div>

                        <div>
                            <label className={labelStyle}>Logo công ty</label>
                            <div className="mt-2 flex items-center gap-4">
                                {formData.logoURL && (
                                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600">
                                        <img src={formData.logoURL.startsWith('blob:') ? formData.logoURL : `http://localhost:4000/${formData.logoURL}`} alt="Company Logo" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                                            <PencilIcon />
                                        </button>
                                    </div>
                                )}
                                <input type="file" name="logo" ref={fileInputRef} onChange={handleFileChange} className={`${inputStyle} ${formData.logoURL ? 'hidden' : ''}`} accept="image/*" />
                                {!formData.logoURL && <button type="button" onClick={() => fileInputRef.current.click()} className={buttonStyle}>Tải lên logo</button>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="province" className={labelStyle}>Tỉnh/Thành phố *</label>
                                <select id="province" value={selectedProvince} onChange={handleProvinceChange} className={inputStyle} required>
                                    <option value="">Chọn Tỉnh/Thành</option>
                                    {Object.keys(vnSubdivisions).map(province => (
                                        <option key={province} value={province}>{province}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="ward" className={labelStyle}>Phường/Xã *</label>
                                <select id="ward" value={selectedWard} onChange={e => setSelectedWard(e.target.value)} className={inputStyle} disabled={!selectedProvince} required>
                                    <option value="">Chọn Phường/Xã</option>
                                    {selectedProvince && vnSubdivisions[selectedProvince].map(ward => (
                                        <option key={ward} value={ward}>{ward}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <label htmlFor="detailedAddress" className={labelStyle}>Địa chỉ chi tiết *</label>
                                <input type="text" id="detailedAddress" value={detailedAddress} onChange={e => setDetailedAddress(e.target.value)} className={inputStyle} placeholder="Số nhà, tên đường,..." required />
                            </div>
                        </div>

                        <button type="submit" className={`${buttonStyle} w-full`}>Cập nhật thông tin</button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CompanyForm;
