import React, { useState, useRef } from 'react';
import { FaCloudUploadAlt, FaFile, FaTimes, FaEye, FaSpinner, FaDownload } from 'react-icons/fa';
import { API_URL, ENDPOINTS } from '../config/api';
import './FileUpload.css';

const FileUpload = ({ 
  onFilesSelected, 
  onUploadComplete,
  multiple = false, 
  accept = "*/*", 
  maxSize = 10, // MB
  maxFiles = 5,
  label = "Upload Files",
  autoUpload = true,
  existingFiles = []
}) => {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState(existingFiles);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const token = localStorage.getItem('token');

  const validateFile = (file) => {
    const maxSizeBytes = maxSize * 1024 * 1024; // Convert MB to bytes
    
    if (file.size > maxSizeBytes) {
      return `File ${file.name} is too large. Maximum size is ${maxSize}MB.`;
    }
    
    return null;
  };

  const handleFiles = (selectedFiles) => {
    setError('');
    const fileArray = Array.from(selectedFiles);
    
    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(newFiles);
      onFilesSelected(newFiles);
      
      if (autoUpload) {
        uploadFiles(newFiles);
      }
    }
  };

  const uploadFiles = async (filesToUpload = files) => {
    if (filesToUpload.length === 0) return;

    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      
      if (multiple) {
        filesToUpload.forEach(file => {
          formData.append('files', file);
        });
      } else {
        formData.append('file', filesToUpload[0]);
      }

      const endpoint = multiple ? ENDPOINTS.FILES_UPLOAD_MULTIPLE : ENDPOINTS.FILES_UPLOAD;
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        const uploadedFileData = multiple ? result.files : [result.file];
        
        setUploadedFiles(prev => [...prev, ...uploadedFileData]);
        setFiles([]);
        
        if (onUploadComplete) {
          onUploadComplete(uploadedFileData);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const deleteFile = async (filename) => {
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.FILES_DELETE(filename)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(file => file.filename !== filename));
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete file');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    const type = file.type ? file.type.split('/')[0] : 'application';
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'application':
        return '📄';
      default:
        return '📁';
    }
  };

  const isImageFile = (file) => {
    const type = file.type ? file.type.split('/')[0] : '';
    return type === 'image';
  };

  return (
    <div className="file-upload-container">
      <label className="file-upload-label">{label}</label>
      
      <div
        className={`file-upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        
        <div className="upload-content">
          {uploading ? (
            <>
              <FaSpinner className="upload-icon spinning" />
              <p className="upload-text">Uploading files...</p>
            </>
          ) : (
            <>
              <FaCloudUploadAlt className="upload-icon" />
              <p className="upload-text">
                {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
              </p>
              <p className="upload-hint">
                {multiple ? `Up to ${maxFiles} files, max ${maxSize}MB each` : `Max ${maxSize}MB`}
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="upload-error">
          <FaTimes /> {error}
        </div>
      )}

      {/* Files to be uploaded */}
      {files.length > 0 && (
        <div className="file-list">
          <h4>Files to Upload ({files.length})</h4>
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-info">
                <span className="file-icon">{getFileIcon(file)}</span>
                <div className="file-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
              </div>
              <div className="file-actions">
                {isImageFile(file) && (
                  <button
                    type="button"
                    className="file-preview-btn"
                    onClick={() => window.open(URL.createObjectURL(file), '_blank')}
                    title="Preview file"
                  >
                    <FaEye />
                  </button>
                )}
                <button
                  type="button"
                  className="file-remove-btn"
                  onClick={() => removeFile(index)}
                  title="Remove file"
                  disabled={uploading}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ))}
          
          {!autoUpload && (
            <button
              className="upload-btn"
              onClick={() => uploadFiles()}
              disabled={uploading}
            >
              {uploading ? <FaSpinner className="spinner" /> : 'Upload Files'}
            </button>
          )}
        </div>
      )}

      {/* Uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4>Uploaded Files ({uploadedFiles.length})</h4>
          {uploadedFiles.map((file, index) => (
            <div key={file.filename || index} className="file-item uploaded">
              <div className="file-info">
                <span className="file-icon">{getFileIcon(file)}</span>
                <div className="file-details">
                  <span className="file-name">{file.originalName || file.filename}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  <span className="file-date">
                    {new Date(file.uploadedAt || file.created).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="file-actions">
                <a
                  href={`${API_URL}${file.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-download-btn"
                  title="Download file"
                >
                  <FaDownload />
                </a>
                <button
                  type="button"
                  className="file-remove-btn"
                  onClick={() => deleteFile(file.filename)}
                  title="Delete file"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 