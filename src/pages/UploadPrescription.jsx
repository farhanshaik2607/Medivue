import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, Image as ImageIcon, Check, FileText } from 'lucide-react';
import './UploadPrescription.css';

export default function UploadPrescription() {
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [uploaded, setUploaded] = useState(false);

    const handleUpload = () => {
        setUploaded(true);
        setTimeout(() => navigate('/cart'), 1500);
    };

    return (
        <div className="page-plain up-page">
            <div className="up-header">
                <button className="md-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <h1 className="up-title">Upload Prescription</h1>
            </div>

            {uploaded ? (
                <div className="order-success animate-scale-in" style={{ minHeight: 'calc(100vh - 56px)' }}>
                    <div className="os-icon">✅</div>
                    <h2 className="heading-lg">Uploaded!</h2>
                    <p className="text-sm" style={{ color: 'var(--gray-500)' }}>Your prescription has been uploaded. Redirecting to cart...</p>
                </div>
            ) : (
                <div className="up-content">
                    <div className="up-info-card">
                        <FileText size={20} color="var(--primary)" />
                        <div>
                            <h3>Why upload a prescription?</h3>
                            <p>Our pharmacist will verify your prescription and prepare your order faster. Required for medicines marked with <span className="tag tag-rx" style={{ display: 'inline' }}>Rx</span></p>
                        </div>
                    </div>

                    <div className="up-upload-area">
                        <div className="up-drop-zone">
                            <Upload size={32} color="var(--primary)" />
                            <h3>Upload Prescription</h3>
                            <p>Drag & drop or tap to upload</p>
                            <p className="up-formats">JPG, PNG, PDF · Max 10MB</p>
                            <input type="file" className="up-file-input" accept="image/*,.pdf" multiple
                                onChange={e => setFiles(Array.from(e.target.files))} id="prescription-upload-input" />
                        </div>

                        <div className="up-options">
                            <button className="up-option-btn">
                                <Camera size={20} />
                                <span>Camera</span>
                            </button>
                            <button className="up-option-btn">
                                <ImageIcon size={20} />
                                <span>Gallery</span>
                            </button>
                        </div>
                    </div>

                    {files.length > 0 && (
                        <div className="up-files">
                            <h4>Selected Files</h4>
                            {files.map((f, i) => (
                                <div key={i} className="up-file-item">
                                    <FileText size={16} color="var(--primary)" />
                                    <span className="up-file-name">{f.name}</span>
                                    <Check size={14} color="var(--success)" />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="up-past">
                        <h4>Past Prescriptions</h4>
                        <div className="up-past-item">
                            <span>📄</span>
                            <div>
                                <span className="up-past-name">Prescription - Dr. Sharma</span>
                                <span className="up-past-date">Feb 28, 2026</span>
                            </div>
                            <button className="btn btn-sm btn-outline">Use</button>
                        </div>
                    </div>

                    <button className="btn btn-primary btn-lg btn-block" style={{ margin: '16px' }}
                        onClick={handleUpload} disabled={files.length === 0}>
                        {files.length > 0 ? `Upload ${files.length} File${files.length > 1 ? 's' : ''}` : 'Select a file to upload'}
                    </button>
                </div>
            )}
        </div>
    );
}
