import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, FileText, AlertCircle, CheckCircle2, Loader2, Mail,
  RefreshCcw, Send, Sidebar as SidebarIcon, Edit3, BarChart3,
  Download, Eye, EyeOff, LogIn, LogOut, Users, FileSpreadsheet,
  Clock, Filter, FilePlus
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

// --- TYPES ---
interface SelectOption { value: string; label: string; }
interface UploadResponse { success: boolean; message: string; file_id?: string; hash?: string; }
interface DashboardUser { email: string; password: string; }
interface DashboardRecord { id: string; email: string; date: string; time: string; file_type: string; file_name: string; document_type: string; batch: string; branch: string; semester: string; }
interface DraftEmailResponse { success: boolean; email_body: string; email_subject: string; message?: string; generation_time?: number; }
interface StudentUploadResponse { success: boolean; message: string; file_id?: string; hash?: string; }


// --- CONSTANTS ---
const BATCH_OPTIONS: SelectOption[] = [ { value: '2022-26', label: '2022-2026' }, { value: '2023-27', label: '2023-2027' }, { value: '2024-28', label: '2024-2028' }, { value: '2025-29', label: '2025-29' }, ];
const BRANCH_OPTIONS: SelectOption[] = [ { value: 'computer_engineering', label: 'Computer Engineering' }, { value: 'information_technology', label: 'Information Technology' }, { value: 'mechanical_engineering', label: 'Mechanical Engineering' }, { value: 'electrical_communication', label: 'Electrical & Communication' }, { value: 'electrical_engineering', label: 'Electrical Engineering' }, ];
const DOCUMENT_TYPES: SelectOption[] = [ { value: 'ExamForm', label: 'Exam Form' }, { value: 'FeesNotice', label: 'Fees Notice' }, { value: 'ExamTimetable', label: 'Exam Time Table' }, { value: 'Circular', label: 'Circular' }, { value: 'EventInformation', label: 'Event Information' }, { value: 'ClassTimeTable', label: 'Class Time Table' }, { value: 'SeminarInformation', label: 'Seminar Information' }, { value: 'GeneralNotice', label: 'General Notice' }, { value: 'GeneralInformation', label: 'General Information' }, ];
const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({ value: (i + 1).toString(), label: `Semester ${i + 1}`, }));
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// --- HELPER COMPONENTS ---
interface SelectProps { id: string; value: string; onChange: (value: string) => void; options: SelectOption[]; placeholder: string; required?: boolean; }
const CustomSelect: React.FC<SelectProps> = ({ id, value, onChange, options, placeholder, required }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-500 mb-1">
      {placeholder} {required && <span className="text-red-500">*</span>}
    </label>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all duration-200">
      <option value="">Choose a {placeholder.toLowerCase()}</option>
      {options.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
    </select>
  </div>
);

const FileUploader: React.FC<{ selectedFile: File | null; onFileChange: (file: File | null) => void; acceptAll?: boolean; }> = ({ selectedFile, onFileChange, acceptAll = false }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileAction = (files: FileList | null) => {
        const file = files?.[0] || null;
        if (file && file.size > MAX_FILE_SIZE) { alert('File size exceeds 50MB limit.'); return; }
        onFileChange(file);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); handleFileAction(e.dataTransfer.files); };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
                Upload Document <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500" onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" onChange={(e) => handleFileAction(e.target.files)} accept={acceptAll ? '*' : '.pdf,.doc,.docx,.jpg,.jpeg,.png'} className="hidden" />
                <Upload className="mx-auto h-12 w-12 text-slate-400 transition-transform duration-300 group-hover:scale-110" />
                <p className="mt-2 text-sm text-slate-600">
                    {selectedFile ? (<span className="font-medium text-green-600">Selected: {selectedFile.name}</span>) : (<><span className="font-medium text-indigo-600">Click to upload</span> or drag and drop</>)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                    {acceptAll ? 'Any file format' : 'PDF, DOC, JPG, etc.'} (Max 50MB)
                </p>
            </div>
        </div>
    );
};

// --- DASHBOARD COMPONENTS ---
const DashboardLogin: React.FC<{ onLogin: (user: DashboardUser) => void; isLoading: boolean; error: string; }> = ({ onLogin, isLoading, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            onLogin({ email, password });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-6">
                    <BarChart3 className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
                    <p className="text-slate-500">Enter your credentials to access</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                            placeholder="admin@college.edu"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10 transition-all duration-200"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 transform"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Logging in...
                            </>
                        ) : (
                            <>
                                <LogIn className="h-4 w-4" />
                                Login
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

const AnalyticsDashboard: React.FC<{ user: DashboardUser; onLogout: () => void; refreshTrigger?: number; }> = ({ user, onLogout, refreshTrigger = 0 }) => {
    const [records, setRecords] = useState<DashboardRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterBatch, setFilterBatch] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterType, setFilterType] = useState('');
    const [stats, setStats] = useState({
        totalFiles: 0,
        todayUploads: 0,
        weeklyUploads: 0
    });

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/records`, {
                headers: {
                    'Authorization': `Bearer ${user.email}:${user.password}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setRecords(data.records || []);
                setStats({
                    totalFiles: data.stats?.total_files || 0,
                    todayUploads: data.stats?.today_uploads || 0,
                    weeklyUploads: data.stats?.weekly_uploads || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user.email, user.password]);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchDashboardData();
        }
    }, [refreshTrigger, fetchDashboardData]);

    const handleDownloadSpreadsheet = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/export`, {
                headers: { 'Authorization': `Bearer ${user.email}:${user.password}` }
            });
            if (response.ok) {
                const data = await response.json();
                const blob = new Blob([data.csv_data], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = data.filename || `dashboard_export.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                alert('Failed to download spreadsheet.');
            }
        } catch (error) {
            alert('An error occurred while downloading the spreadsheet.');
        }
    };

    const filteredRecords = records.filter(record => {
        const batchMatch = !filterBatch || record.batch === filterBatch;
        const branchMatch = !filterBranch || record.branch === filterBranch;
        const semesterMatch = !filterSemester || record.semester === `Semester ${filterSemester}`;
        const typeMatch = !filterType || record.document_type === filterType;
        return batchMatch && branchMatch && semesterMatch && typeMatch;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-8 w-8 text-indigo-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={fetchDashboardData} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-200 transform active:scale-95" title="Refresh Data">
                                <RefreshCcw className="h-4 w-4" /> Refresh
                            </button>
                            <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-all duration-200">
                                <LogOut className="h-4 w-4" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-in-out">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Files</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalFiles}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-full">
                                <FileText className="h-8 w-8 text-blue-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-in-out">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Today's Uploads</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayUploads}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-full">
                                <Clock className="h-8 w-8 text-green-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-in-out">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Weekly Uploads</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.weeklyUploads}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-full">
                                <Users className="h-8 w-8 text-purple-500" />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Filters:</span>
                            </div>
                            <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all duration-200">
                                <option value="">All Branches</option>
                                {BRANCH_OPTIONS.map(branch => (<option key={branch.value} value={branch.value}>{branch.label}</option>))}
                            </select>
                            <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all duration-200">
                                <option value="">All Semesters</option>
                                {SEMESTER_OPTIONS.map(semester => (<option key={semester.value} value={semester.value}>{semester.label}</option>))}
                            </select>
                            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all duration-200">
                                <option value="">All Document Types</option>
                                {DOCUMENT_TYPES.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}
                            </select>
                            <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all duration-200">
                                <option value="">All Batches</option>
                                {BATCH_OPTIONS.map(batch => (<option key={batch.value} value={batch.value}>{batch.label}</option>))}
                            </select>
                        </div>
                        <button onClick={handleDownloadSpreadsheet} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 text-sm font-medium transform active:scale-95">
                            <Download className="h-4 w-4" /> Download CSV ({filteredRecords.length} records)
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Records</h2>
                        <p className="text-sm text-gray-600">Showing {filteredRecords.length} of {records.length} records</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Info</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Info</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-indigo-50 transition-colors duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{record.date}</div>
                                            <div className="text-xs">{record.time}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="font-medium truncate max-w-48" title={record.file_name}>{record.file_name}</div>
                                            <div className="text-xs text-gray-500">{record.file_type}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {record.document_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="font-medium">{record.batch}</div>
                                            <div className="text-xs">{record.branch}</div>
                                            <div className="text-xs">{record.semester}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredRecords.length === 0 && (
                        <div className="text-center py-12">
                            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">No records found matching your filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- PAGE COMPONENTS ---
const DocumentUpload: React.FC<{ onUploadSuccess?: () => void }> = ({ onUploadSuccess }) => {
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
        type: null,
        message: '',
    });

    const isFormValid = !!selectedFile && !!title && !!documentType && !!selectedBatch && !!selectedBranch && !!selectedSemester;

    const handleUpload = async () => {
        if (!isFormValid) {
            setUploadStatus({ type: 'error', message: 'Please fill in all required fields and select a file.' });
            return;
        }
        setIsUploading(true);
        setUploadStatus({ type: null, message: '' });
        const formData = new FormData();
        if (selectedFile) formData.append('file', selectedFile);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('document_type', documentType);
        formData.append('batch', selectedBatch);
        formData.append('branch', selectedBranch);
        formData.append('semester', selectedSemester);

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload`, { method: 'POST', body: formData });
            const result: UploadResponse = await response.json();
            if (response.ok && result.success) {
                setUploadStatus({ type: 'success', message: result.message || 'File uploaded successfully!' });
                resetForm();
                if (onUploadSuccess) { onUploadSuccess(); }
            } else {
                setUploadStatus({ type: 'error', message: result.message || 'Upload failed. Please try again.' });
            }
        } catch (error) {
            setUploadStatus({ type: 'error', message: 'Network error. Please check your connection.' });
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setSelectedBatch(''); setSelectedBranch(''); setSelectedSemester(''); setTitle('');
        setDescription(''); setSelectedFile(null); setDocumentType(''); setUploadStatus({ type: null, message: '' });
    };

    return (
        <div className="space-y-8">
            <header className="text-center animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <FileText className="h-8 w-8 text-indigo-600" />
                    <h1 className="text-3xl font-bold text-slate-900">
                        Admin Document Upload
                    </h1>
                </div>
                <p className="text-slate-500">
                    Upload and manage official academic documents with specific classifications.
                </p>
            </header>

            <main className="space-y-6 max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <section>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">
                        Academic Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <CustomSelect id="batch-select" value={selectedBatch} onChange={setSelectedBatch} options={BATCH_OPTIONS} placeholder="Batch" required />
                        <CustomSelect id="branch-select" value={selectedBranch} onChange={setSelectedBranch} options={BRANCH_OPTIONS} placeholder="Branch" required />
                        <CustomSelect id="semester-select" value={selectedSemester} onChange={setSelectedSemester} options={SEMESTER_OPTIONS} placeholder="Semester" required />
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">
                        Document Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-1">
                            <label htmlFor="document-title" className="block text-sm font-medium text-slate-500 mb-1">
                                Document Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="document-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Mid-Term Exam Schedule"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 transition-all duration-200"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <CustomSelect id="document-type-select" value={documentType} onChange={setDocumentType} options={DOCUMENT_TYPES} placeholder="Document Type" required />
                        </div>
                    </div>
                    <div className="mt-6">
                        <label htmlFor="document-description" className="block text-sm font-medium text-slate-500 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            id="document-description"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide additional details or notes about the document..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 transition-all duration-200"
                        />
                    </div>
                    <div className="mt-6">
                        <FileUploader selectedFile={selectedFile} onFileChange={setSelectedFile} />
                    </div>
                </section>

                {uploadStatus.type && (
                    <div
                        className={`flex items-center gap-3 p-3 rounded-md text-sm animate-in fade-in slide-in-from-bottom-4 duration-500 ${uploadStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
                            }`} >
                        {uploadStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        <span>{uploadStatus.message}</span>
                    </div>
                )}

                <footer className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={resetForm}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-slate-600 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 transform active:scale-95"
                    >
                        <RefreshCcw className="h-4 w-4" /> Reset
                    </button>
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!isFormValid || isUploading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg transform active:scale-95"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5" />
                                Upload Document
                            </>
                        )}
                    </button>
                </footer>
            </main>
        </div>
    );
};


const EmailDrafter: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [subject, setSubject] = useState('');

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt to generate the email.');
            return;
        }
        setIsGenerating(true);
        setError('');
        setGeneratedEmail('');
        setSubject('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/draft-email`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }),
            });
            if (!response.ok) { throw new Error('Failed to generate email from the server.'); }
            const data: DraftEmailResponse = await response.json();
            if (data.success) {
                setGeneratedEmail(data.email_body);
                setSubject(data.email_subject || '');
            } else {
                throw new Error(data.message || 'An unknown error occurred.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCompose = () => {
        if (!generatedEmail && !subject) {
            alert("Please generate an email first.");
            return;
        }
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(generatedEmail)}`;
        window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="space-y-8">
            <header className="text-center animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Edit3 className="h-8 w-8 text-indigo-600" />
                    <h1 className="text-3xl font-bold text-slate-900">
                        AI Email Drafter
                    </h1>
                </div>
                <p className="text-slate-500">
                    Generate professional emails instantly from a simple prompt.
                </p>
            </header>

            <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-lg shadow-md space-y-6 animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
                    <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                        1. Describe Your Email
                    </h2>
                    <div>
                        <label htmlFor="email-prompt" className="block text-sm font-medium text-slate-500 mb-1">
                            Prompt Template
                        </label>
                        <textarea
                            id="email-prompt"
                            rows={8}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Write a circular to all final year Computer Engineering students about an upcoming seminar on 'Quantum Computing' by Dr. Anya Sharma on September 15th at 10 AM in the main auditorium. Mention that attendance is mandatory."
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 transition-all duration-200"
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg transform active:scale-95"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Generating...
                            </>
                        ) : "Generate Email"}
                    </button>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                <div className="bg-white p-8 rounded-lg shadow-md space-y-6 animate-in fade-in duration-500" style={{ animationDelay: '200ms' }}>
                    <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                        2. Review and Edit
                    </h2>
                    <div>
                        <label htmlFor="email-subject" className="block text-sm font-medium text-slate-500 mb-1">
                            Email Subject
                        </label>
                        <input
                            type="text"
                            id="email-subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="AI will generate subject line..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 transition-all duration-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="generated-email" className="block text-sm font-medium text-slate-500 mb-1">
                            Generated Email
                        </label>
                        <textarea
                            id="generated-email"
                            rows={8}
                            value={generatedEmail}
                            onChange={(e) => setGeneratedEmail(e.target.value)}
                            placeholder="AI-generated email will appear here. You can edit it as needed."
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 transition-all duration-200"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCompose}
                            disabled={!generatedEmail || !subject}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-indigo-500 text-white font-semibold rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg transform active:scale-95"
                        >
                            <Mail className="h-5 w-5" />
                            Compose in Gmail
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- SIMPLIFIED: Student/Visitor Upload Component ---
const StudentVisitorUpload: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

    const isFormValid = !!selectedFile;

    const resetForm = () => {
        setSelectedFile(null);
        setUploadStatus({ type: null, message: '' });
    };

    const handleUpload = async () => {
        if (!isFormValid) {
            setUploadStatus({ type: 'error', message: 'Please select a file to upload.' });
            return;
        }
        setIsUploading(true);
        setUploadStatus({ type: null, message: '' });

        const formData = new FormData();
        if (selectedFile) formData.append('file', selectedFile);

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload-student-document`, {
                method: 'POST',
                body: formData,
            });
            const result: StudentUploadResponse = await response.json();
            if (response.ok && result.success) {
                setUploadStatus({ type: 'success', message: result.message || 'File uploaded successfully!' });
                resetForm();
            } else {
                setUploadStatus({ type: 'error', message: result.message || 'Upload failed. Please try again.' });
            }
        } catch (error) {
            setUploadStatus({ type: 'error', message: 'A network error occurred. Please check your connection.' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-8">
            <header className="text-center animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Users className="h-8 w-8 text-indigo-600" />
                    <h1 className="text-3xl font-bold text-slate-900">Student & Visitor Document Upload</h1>
                </div>
                <p className="text-slate-500">
                    Upload any relevant document. The system will automatically categorize and index it.
                </p>
            </header>

            <main className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md space-y-6">
                <FileUploader selectedFile={selectedFile} onFileChange={setSelectedFile} acceptAll={true} />

                {uploadStatus.type && (
                    <div className={`flex items-center gap-3 p-3 rounded-md text-sm animate-in fade-in slide-in-from-bottom-4 duration-500 ${uploadStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                        {uploadStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        <span>{uploadStatus.message}</span>
                    </div>
                )}
                
                <footer className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button type="button" onClick={resetForm} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-slate-600 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 transform active:scale-95">
                        <RefreshCcw className="h-4 w-4" /> Reset
                    </button>
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!isFormValid || isUploading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg transform active:scale-95"
                    >
                        {isUploading ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> Uploading...</>
                        ) : (
                            <><FilePlus className="h-5 w-5" /> Upload for Indexing</>
                        )}
                    </button>
                </footer>
            </main>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const AdminDashboard: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<'upload' | 'email' | 'dashboard' | 'student_upload'>('upload');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [dashboardUser, setDashboardUser] = useState<DashboardUser | null>(() => {
        const stored = sessionStorage.getItem('dashboardUser');
        return stored ? JSON.parse(stored) : null;
    });
    const [dashboardLoginLoading, setDashboardLoginLoading] = useState(false);
    const [dashboardLoginError, setDashboardLoginError] = useState('');
    const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

    const handleDashboardLogin = async (user: DashboardUser) => {
        setDashboardLoginLoading(true); setDashboardLoginError('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user), });
            if (response.ok) {
                const data = await response.json();
                if (data.success) { sessionStorage.setItem('dashboardUser', JSON.stringify(user)); sessionStorage.setItem('dashboardToken', data.token); setDashboardUser(user); setCurrentPage('dashboard'); } else { setDashboardLoginError(data.message || 'Invalid credentials'); }
            } else { setDashboardLoginError('Invalid email or password'); }
        } catch (error) { setDashboardLoginError('Login failed. Please try again.'); } finally { setDashboardLoginLoading(false); }
    };

    const handleDashboardLogout = () => { sessionStorage.removeItem('dashboardUser'); sessionStorage.removeItem('dashboardToken'); setDashboardUser(null); setCurrentPage('upload'); setDashboardLoginError(''); };
    const handleUploadSuccess = () => { setDashboardRefreshTrigger(prev => prev + 1); };

    if (currentPage === 'dashboard' && !dashboardUser) { return (<DashboardLogin onLogin={handleDashboardLogin} isLoading={dashboardLoginLoading} error={dashboardLoginError} />); }
    if (currentPage === 'dashboard' && dashboardUser) { return (<AnalyticsDashboard user={dashboardUser} onLogout={handleDashboardLogout} refreshTrigger={dashboardRefreshTrigger} />); }

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans antialiased">
            <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
                <div className="p-4 border-b border-slate-200 flex items-center gap-3 h-16">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-slate-100 transition-colors"><SidebarIcon className="h-5 w-5 text-slate-600" /></button>
                    {isSidebarOpen && (<div className="animate-in fade-in duration-300"><h1 className="font-bold text-slate-900">LDRP-ITR</h1><p className="text-xs text-slate-500">Management System</p></div>)}
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setCurrentPage('upload')} className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-left transition-all duration-200 ${currentPage === 'upload' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'} ${isSidebarOpen ? '' : 'justify-center'}`}><Upload className="h-5 w-5 flex-shrink-0" />{isSidebarOpen && <span className="truncate">Admin Document Upload</span>}</button>
                    <button onClick={() => setCurrentPage('student_upload')} className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-left transition-all duration-200 ${currentPage === 'student_upload' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'} ${isSidebarOpen ? '' : 'justify-center'}`}><Users className="h-5 w-5 flex-shrink-0" />{isSidebarOpen && <span className="truncate">Student/Visitor Upload</span>}</button>
                    <button onClick={() => setCurrentPage('email')} className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-left transition-all duration-200 ${currentPage === 'email' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'} ${isSidebarOpen ? '' : 'justify-center'}`}><Edit3 className="h-5 w-5 flex-shrink-0" />{isSidebarOpen && <span className="truncate">Email Drafter</span>}</button>
                    <button onClick={() => setCurrentPage('dashboard')} className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md text-left transition-all duration-200 ${currentPage === 'dashboard' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'} ${isSidebarOpen ? '' : 'justify-center'}`}><BarChart3 className="h-5 w-5 flex-shrink-0" />{isSidebarOpen && <span className="truncate">Analytics</span>}</button>
                </nav>
                {isSidebarOpen && (<div className="p-4 border-t border-slate-200 animate-in fade-in duration-300"><p className="text-xs text-slate-500 text-center">College Management Portal v3.4.1</p></div>)}
            </div>
            <div className="flex-1 p-8 overflow-auto">
                <div key={currentPage} className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                    {currentPage === 'upload' && <DocumentUpload onUploadSuccess={handleUploadSuccess} />}
                    {currentPage === 'student_upload' && <StudentVisitorUpload />}
                    {currentPage === 'email' && <EmailDrafter />}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;