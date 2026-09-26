import React, { useState, useEffect } from 'react';
import type { OriginalDocument } from '../types';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: OriginalDocument[];
  initialDocumentId?: string;
  category?: 'syllabus' | 'pyq' | 'notice' | string;
  onDeleteDocument?: (docId: string, docTitle: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documents,
  initialDocumentId,
  category = 'syllabus',
  onDeleteDocument,
}) => {
  const filteredDocs = documents.filter((d) => !category || d.type === category);
  const displayDocs = filteredDocs.length > 0 ? filteredDocs : documents;

  const [activeDocId, setActiveDocId] = useState<string>(
    initialDocumentId || (displayDocs[0]?.id ?? '')
  );

  useEffect(() => {
    if (initialDocumentId) {
      setActiveDocId(initialDocumentId);
    } else if (displayDocs[0]) {
      setActiveDocId(displayDocs[0].id);
    }
  }, [initialDocumentId, isOpen, displayDocs]);

  if (!isOpen) return null;

  const activeDoc = displayDocs.find((d) => d.id === activeDocId) || displayDocs[0];

  const isImage =
    Boolean(activeDoc?.file_url?.match(/\.(png|jpe?g|webp|gif|svg)$/i)) ||
    Boolean(activeDoc?.file_name?.match(/\.(png|jpe?g|webp|gif|svg)$/i));

  const isPdf =
    !isImage &&
    (Boolean(activeDoc?.file_url?.toLowerCase().endsWith('.pdf')) ||
      Boolean(activeDoc?.file_name?.toLowerCase().endsWith('.pdf')) ||
      (Boolean(activeDoc?.file_url) &&
        activeDoc!.file_url.startsWith('http') &&
        !activeDoc!.file_url.startsWith('#')));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(18, 25, 20, 0.72)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '95%',
          maxWidth: '1000px',
          height: '88vh',
          backgroundColor: '#ffffff',
          border: '1px solid #d4c9b8',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#1a231b',
        }}
      >
        {/* Top Accent Strip */}
        <div style={{ height: '4px', width: '100%', backgroundColor: '#284232' }} />

        {/* Modal Header */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid #e8e0d2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: '#faf8f5',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#eaf4eb',
                color: '#284232',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {isImage ? 'image' : isPdf ? 'picture_as_pdf' : 'description'}
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#181b18',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeDoc?.title || activeDoc?.file_name || 'Document Viewer'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#687865' }}>
                {activeDoc?.subject && `${activeDoc.subject} • `}
                {activeDoc?.semester && `Semester ${activeDoc.semester} • `}
                {activeDoc?.file_size || 'Official Document'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {activeDoc?.file_url && activeDoc.file_url !== '#' && (
              <a
                href={activeDoc.file_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: '1px solid #d4c9b8',
                  backgroundColor: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#284232',
                  textDecoration: 'none',
                }}
                title="Open in new tab"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  open_in_new
                </span>
                <span>Open in Tab</span>
              </a>
            )}

            {onDeleteDocument && activeDoc && (
              <button
                type="button"
                onClick={() => {
                  onDeleteDocument(activeDoc.id, activeDoc.title || activeDoc.file_name);
                  onClose();
                }}
                title="Delete this document"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '9999px',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#dc2626',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  delete
                </span>
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '4px 6px',
                fontSize: '20px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* Left doc list if multiple */}
          {displayDocs.length > 1 && (
            <div
              style={{
                width: '240px',
                borderRight: '1px solid #e8e0d2',
                backgroundColor: '#faf8f5',
                overflowY: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#687865',
                  textTransform: 'uppercase',
                  padding: '2px 4px 6px',
                }}
              >
                Available Documents ({displayDocs.length})
              </div>
              {displayDocs.map((doc) => {
                const isSelected = doc.id === activeDoc?.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: isSelected ? '1.5px solid #284232' : '1px solid #e8e0d2',
                      backgroundColor: isSelected ? '#eaf4eb' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '18px', color: isSelected ? '#284232' : '#889885' }}
                    >
                      {doc.type === 'pyq' ? 'quiz' : 'menu_book'}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '11.5px',
                          fontWeight: isSelected ? 700 : 500,
                          color: '#1a231b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {doc.title || doc.file_name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#687865' }}>
                        {doc.subject || doc.file_size}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Viewer Area */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#f7f5f0',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
              padding: '16px',
            }}
          >
            {isImage && activeDoc?.file_url && activeDoc.file_url !== '#' ? (
              <div
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  overflow: 'auto',
                }}
              >
                <img
                  src={activeDoc.file_url}
                  alt={activeDoc.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              </div>
            ) : isPdf && activeDoc?.file_url && activeDoc.file_url !== '#' ? (
              <iframe
                src={`${activeDoc.file_url}#toolbar=1&navpanes=0`}
                title={activeDoc.title}
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '24px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '12.5px',
                  lineHeight: 1.6,
                  color: '#283226',
                  whiteSpace: 'pre-wrap',
                  boxSizing: 'border-box',
                  border: '1px solid #e6ded2',
                }}
              >
                {activeDoc?.content_preview ||
                  `Document: ${activeDoc?.title || activeDoc?.file_name}\nType: ${activeDoc?.type}\nSubject: ${activeDoc?.subject}\n\nContent preview not available for this document format.`}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid #e8e0d2',
            backgroundColor: '#faf8f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#687865',
          }}
        >
          <span>{activeDoc?.file_name || 'Document'}</span>
          <span>
            {activeDoc?.uploaded_at
              ? `Uploaded on ${new Date(activeDoc.uploaded_at).toLocaleDateString()}`
              : 'Official Regulation Document'}
          </span>
        </div>
      </div>
    </div>
  );
};
