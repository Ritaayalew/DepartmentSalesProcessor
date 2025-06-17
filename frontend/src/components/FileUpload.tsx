import { useState, useEffect } from 'react';
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
      console.log('Selected file:', e.target.files[0].name);
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      console.log('No file selected');
      setError('❌ Please select a file');
      return;
    }

    console.log('Starting upload for file:', file.name);
    setUploading(true);
    setError(null);
    setJobId(null);
    setDownloadLink(null);
    setMetrics(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Upload response:', response.data);
      setJobId(response.data.jobId);
    } catch (err) {
      console.error('Upload error:', err);
      setError('❌ Failed to upload file');
      setUploading(false);
    }
  };

  useEffect(() => {
  if (!jobId) {
    console.log('No jobId, skipping polling');
    return;
  }

  console.log(`Starting polling for jobId: ${jobId}`);
  const maxPollTime = 180000; // 180 seconds
  const startTime = Date.now();

  const intervalId = setInterval(async () => {
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime > maxPollTime) {
      console.log(`Job ${jobId} timed out after ${elapsedTime}ms`);
      setError('❌ Job timed out');
      setUploading(false);
      setJobId(null);
      clearInterval(intervalId); // ✅ Stop polling
      return;
    }

    try {
      console.log(`Polling /status/${jobId} at ${elapsedTime}ms`);
      const response = await axios.get(`${API_URL}/status/${jobId}`);
      console.log('Status response:', response.data, 'HTTP status:', response.status);

      if (response.data.status === 'completed' && response.data.downloadLink) {
        console.log(`Job ${jobId} completed with downloadLink: ${response.data.downloadLink}`);
        setDownloadLink(response.data.downloadLink);
        setMetrics(response.data.metrics);
        setJobId(response.data.jobId);
        setUploading(false);
        clearInterval(intervalId); // ✅ Stop polling
      } else if (response.data.status === 'failed') {
        console.log(`Job failed: ${response.data.error || 'Unknown error'}`);
        setError(`❌ Job failed: ${response.data.error || 'Unknown error'}`);
        setUploading(false);
        setJobId(null);
        clearInterval(intervalId); // ✅ Stop polling
      } else {
        console.log('Job still processing...');
      }
    } catch (err) {
      console.error(`Failed to check job status for ${jobId}:`, err);
      setError('❌ Failed to check job status');
      setUploading(false);
      setJobId(null);
      clearInterval(intervalId); // ✅ Stop polling
    }
  }, 2000);

  return () => {
    console.log(`Stopping polling for jobId: ${jobId}`);
    clearInterval(intervalId);
  };
}, [jobId]);

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileChange} disabled={uploading} />
      <button onClick={handleUpload} disabled={uploading || !file}>
        {uploading ? '⏳ Processing...' : '📂 Upload'}
      </button>

      {uploading && <p>⏳ Progress: Processing...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {jobId && !downloadLink && <p>🔍 Job ID: {jobId}</p>}

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