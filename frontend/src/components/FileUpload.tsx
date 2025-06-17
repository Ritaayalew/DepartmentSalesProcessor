import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ processingTime: number; departmentCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('❌ Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setJobId(response.data.jobId);

      // 🔥 Start polling job status to wait for file completion
      pollJobStatus(response.data.jobId);

      // ✅ Reset file input & enable button after successful upload
      setTimeout(() => {
        setUploading(false);
        setFile(null);
      }, 2000); // Slight delay to allow UI update
    } catch (err) {
      setError('❌ Failed to upload file');
      setUploading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/status/${jobId}`);

        if (response.status === 200 && response.data.downloadLink) {
          setDownloadLink(response.data.downloadLink);
          setMetrics(response.data.metrics);
          setUploading(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('❌ Failed to check job status', err);
        setError('❌ Failed to check job status');
        setUploading(false);
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileChange} disabled={uploading} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? '⏳ Processing...' : '📂 Upload'}
      </button>

      {uploading && <p>⏳ Progress: Processing file...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {jobId && <p>🔍 Job ID: {jobId}</p>} {/* Display Job ID */}

      {downloadLink && (
        <div>
          <p>✅ Processing complete!</p>
          <a href={downloadLink} download>📥 Download Result</a>
          {metrics && (
            <p>📊 Processing Time: {metrics.processingTime}ms | Departments: {metrics.departmentCount}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;