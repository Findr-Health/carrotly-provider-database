/**
 * DocumentUpload - File upload interface
 * Supports file selection and camera capture
 */

import React, { useState } from 'react';
import './DocumentUpload.css';

function DocumentUpload({ onFileSelect, fileInputRef }) {
  const [isDragging, setIsDragging] = useState(false);

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

    onFileSelect(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerCamera = () => {
    // Create a temporary input with capture attribute
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

  return (
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
        className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={triggerFileInput}
      >
        <div className="dropzone-content">
          <span className="upload-icon">📄</span>
          <p className="upload-text">
            Tap to upload or drag & drop
          </p>
          <p className="upload-hint">
            JPEG, PNG, or PDF up to 10MB
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="upload-actions">
        <button className="upload-btn file-btn" onClick={triggerFileInput}>
          <span className="btn-icon">📁</span>
          Choose File
        </button>
        <button className="upload-btn camera-btn" onClick={triggerCamera}>
          <span className="btn-icon">📷</span>
          Take Photo
        </button>
      </div>

      {/* Privacy note */}
      <p className="upload-privacy">
        <span className="lock-icon">🔒</span>
        Documents are processed securely and deleted immediately after analysis
      </p>
    </div>
  );
}

export default DocumentUpload;
