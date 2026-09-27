import { useState, useRef } from 'react';
import { formatFileSize } from '../../utils/helpers';

export default function MediaModalViewer({ file, onClose }) {
  if (!file) return null;

  const isImage = file.type === 'IMAGE' || (file.fileUrl && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.fileUrl));
  const isPdf = file.type === 'PDF' || (file.fileUrl && /\.pdf$/i.test(file.fileUrl));

  // Zoom & Rotation State (para imágenes)
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName || 'archivo';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="media-modal-overlay" onClick={onClose}>
      <div className="media-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header Modal */}
        <div className="media-modal-header">
          <div className="media-modal-title">
            <span className="media-modal-icon">{isImage ? '🖼️' : isPdf ? '📄' : '📁'}</span>
            <div className="media-modal-text">
              <div className="media-filename">{file.fileName || (isImage ? 'Fotografía adjunta' : 'Documento PDF')}</div>
              {file.fileSize && (
                <div className="media-filesize">{formatFileSize(file.fileSize)}</div>
              )}
            </div>
          </div>

          {/* Controles de Imagen */}
          {isImage && (
            <div className="media-controls">
              <button className="media-btn" onClick={handleZoomIn} title="Acercar (Zoom In)">🔍+</button>
              <button className="media-btn" onClick={handleZoomOut} title="Alejar (Zoom Out)">🔍-</button>
              <button className="media-btn" onClick={handleRotate} title="Rotar 90°">🔄 Rotar</button>
              <button className="media-btn" onClick={handleReset} title="Restablecer">🎯 Reset</button>
              <span className="zoom-level-badge">{Math.round(zoom * 100)}%</span>
            </div>
          )}

          {/* Acciones principales */}
          <div className="media-actions">
            <button className="media-btn primary" onClick={handleDownload} title="Descargar archivo">
              ⬇️ Descargar
            </button>
            <a 
              href={file.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="media-btn secondary"
              title="Abrir en pestaña nueva"
            >
              ↗️ Abrir
            </a>
            <button className="media-btn close" onClick={onClose} title="Cerrar (Esc)">
              ✕
            </button>
          </div>
        </div>

        {/* Cuerpo del Visor */}
        <div 
          className="media-modal-body"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
        >
          {isImage && (
            <div className="image-viewer-stage">
              <img
                src={file.fileUrl}
                alt={file.fileName || 'Imagen adjunta'}
                className="media-view-image"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                }}
                draggable={false}
              />
            </div>
          )}

          {isPdf && (
            <div className="pdf-viewer-stage">
              <object
                data={file.fileUrl}
                type="application/pdf"
                width="100%"
                height="100%"
                className="pdf-object"
              >
                <div className="pdf-fallback-box">
                  <p>📄 Tu navegador no permite mostrar PDFs integrados directamente.</p>
                  <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ marginTop: 12 }}>
                    Abrir PDF en pestaña nueva
                  </a>
                </div>
              </object>
            </div>
          )}

          {!isImage && !isPdf && (
            <div className="generic-file-box">
              <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
              <h3>{file.fileName || 'Archivo adjunto'}</h3>
              <p style={{ marginTop: 6, color: 'var(--color-text-secondary)' }}>
                Este tipo de archivo no admite previsualización en pantalla.
              </p>
              <button className="btn-primary" onClick={handleDownload} style={{ marginTop: 16 }}>
                Descargar Archivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
