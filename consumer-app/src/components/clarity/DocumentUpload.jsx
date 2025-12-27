/**
 * DocumentUpload - File upload modal interface
 * Supports file selection and camera capture
 */
import React, { useState, useRef } from 'react';
import './DocumentUpload.css';

function DocumentUpload({ onUpload, onClose }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSelect = (file) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload an image (JPEG, PNG, WebP) or PDF file.');
      return;
    }
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Please upload a file under 10MB.');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile && onUpload) {
      onUpload(selectedFile);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
    };
    input.click();
  };

  const handleOverlayClick = (e) => {
    // Close when clicking the overlay background
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className="upload-modal-overlay" onClick={handleOverlayClick}>
      <div className="upload-modal">
        {/* Close button */}
        <button className="close-modal" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 style={{
          fontFamily: 'Urbanist, sans-serif',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '1rem',
          paddingRight: '2rem'
        }}>
          Upload a Document
        </h2>

        <div className="document-upload">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="file-input-hidden"
          />

          {/* Drop zone */}
          <div 
            className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={triggerFileInput}
          >
            <div className="dropzone-content">
              {selectedFile ? (
                <>
                  <span className="upload-icon">✅</span>
                  <p className="upload-text">{selectedFile.name}</p>
                  <p className="upload-hint">Tap to change file</p>
                </>
              ) : (
                <>
                  <span className="upload-icon">📄</span>
                  <p className="upload-text">Tap to upload or drag & drop</p>
                  <p className="upload-hint">JPEG, PNG, or PDF up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="upload-actions">
            <button className="upload-action-btn file-btn" onClick={triggerFileInput}>
              <span className="btn-icon">📁</span>
              Choose File
            </button>
            <button className="upload-action-btn camera-btn" onClick={triggerCamera}>
              <span className="btn-icon">📷</span>
              Take Photo
            </button>
          </div>

          {/* Analyze button - shows when file selected */}
          {selectedFile && (
            <button className="analyze-btn" onClick={handleUpload}>
              Analyze Document
            </button>
          )}

          {/* Privacy note */}
          <p className="upload-privacy">
            <span className="lock-icon">🔒</span>
            Documents are processed securely and deleted immediately after analysis
          </p>
        </div>
      </div>
    </div>
  );
}

export default DocumentUpload;
