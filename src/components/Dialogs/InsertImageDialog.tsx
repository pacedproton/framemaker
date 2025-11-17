import React, { useState, useRef } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { Image as ImageIcon, X, Upload, Link } from 'lucide-react';

interface InsertImageDialogProps {
  onInsert: (url: string, alt?: string) => void;
}

const InsertImageDialog: React.FC<InsertImageDialogProps> = ({ onInsert }) => {
  const { showInsertImageDialog, toggleInsertImageDialog } = useDocumentStore();
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!showInsertImageDialog) return null;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreviewUrl(dataUrl);
        setImageUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setPreviewUrl(url);
  };

  const handleInsert = () => {
    if (!imageUrl) return;
    onInsert(imageUrl, altText);
    toggleInsertImageDialog();
    resetForm();
  };

  const resetForm = () => {
    setImageUrl('');
    setAltText('');
    setCaption('');
    setPreviewUrl('');
    setMode('url');
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog insert-image-dialog">
        <div className="dialog-header">
          <h2>
            <ImageIcon size={20} />
            Insert Image
          </h2>
          <button className="close-button" onClick={toggleInsertImageDialog}>
            <X size={20} />
          </button>
        </div>

        <div className="dialog-content">
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === 'url' ? 'active' : ''}`}
              onClick={() => setMode('url')}
            >
              <Link size={16} />
              URL
            </button>
            <button
              className={`mode-tab ${mode === 'upload' ? 'active' : ''}`}
              onClick={() => setMode('upload')}
            >
              <Upload size={16} />
              Upload
            </button>
          </div>

          {mode === 'url' && (
            <div className="form-group">
              <label>Image URL</label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
            </div>
          )}

          {mode === 'upload' && (
            <div className="upload-area">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} />
                <span>Click to upload or drag and drop</span>
                <span className="upload-hint">PNG, JPG, GIF up to 10MB</span>
              </button>
            </div>
          )}

          <div className="form-group">
            <label>Alt Text (for accessibility)</label>
            <input
              type="text"
              placeholder="Describe the image"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Caption (optional)</label>
            <input
              type="text"
              placeholder="Image caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {previewUrl && (
            <div className="image-preview">
              <h4>Preview</h4>
              <div className="preview-container">
                <img src={previewUrl} alt={altText || 'Preview'} />
              </div>
              {caption && <div className="preview-caption">{caption}</div>}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button
            className="cancel-button"
            onClick={() => {
              toggleInsertImageDialog();
              resetForm();
            }}
          >
            Cancel
          </button>
          <button
            className="primary-button"
            onClick={handleInsert}
            disabled={!imageUrl}
          >
            Insert Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsertImageDialog;
