// Image Insertion Dialog
import React, { useState } from 'react';

interface ImageDialogProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (imageUrl: string, altText: string) => void;
}

export const ImageDialog: React.FC<ImageDialogProps> = ({ visible, onClose, onInsert }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [previewError, setPreviewError] = useState(false);

  const handleInsert = () => {
    if (imageUrl.trim()) {
      onInsert(imageUrl.trim(), altText.trim());
      // Reset for next use
      setImageUrl('');
      setAltText('');
      setPreviewError(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setPreviewError(false);
  };

  if (!visible) return null;

  return (
    <div className="fm-dialog-overlay">
      <div className="fm-dialog image-dialog">
        <div className="dialog-title">Insert Image</div>

        <div className="dialog-content">
          <div className="property-row">
            <label>Image URL:</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/image.png"
              style={{ flex: 1 }}
            />
          </div>

          <div className="property-row">
            <label>Alt Text:</label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Description of the image"
              style={{ flex: 1 }}
            />
          </div>

          <div className="image-preview-section">
            <div className="section-label">Preview:</div>
            <div
              className="image-preview-box"
              style={{
                width: '100%',
                height: 150,
                border: '1px inset #ffffff',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {imageUrl ? (
                previewError ? (
                  <span style={{ color: '#ef4444', fontSize: 11 }}>Unable to load image</span>
                ) : (
                  <img
                    src={imageUrl}
                    alt={altText || 'Preview'}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={() => setPreviewError(true)}
                  />
                )
              ) : (
                <span style={{ color: '#808080', fontSize: 11 }}>Enter image URL above</span>
              )}
            </div>
          </div>

          <div className="sample-images">
            <div className="section-label">Sample Images:</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button
                onClick={() =>
                  handleUrlChange(
                    'https://via.placeholder.com/400x300/3b82f6/ffffff?text=Sample+Image'
                  )
                }
                style={{ fontSize: 10, padding: '2px 6px' }}
              >
                Placeholder 1
              </button>
              <button
                onClick={() =>
                  handleUrlChange(
                    'https://via.placeholder.com/400x300/ef4444/ffffff?text=Red+Box'
                  )
                }
                style={{ fontSize: 10, padding: '2px 6px' }}
              >
                Placeholder 2
              </button>
              <button
                onClick={() =>
                  handleUrlChange(
                    'https://via.placeholder.com/400x300/10b981/ffffff?text=Green+Box'
                  )
                }
                style={{ fontSize: 10, padding: '2px 6px' }}
              >
                Placeholder 3
              </button>
            </div>
          </div>
        </div>

        <div className="dialog-buttons">
          <button onClick={handleInsert} disabled={!imageUrl.trim()}>
            Insert
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
