// app/documents/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  FileText, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Database, 
  Search,
  HardDrive,
  UploadCloud,
  X,
  FileUp
} from 'lucide-react';

export default function DocumentEmbeddingsPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Form States
  const [selectedFile, setSelectedFile] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Helper to fetch authorization header
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    return {
      'Authorization': `Bearer ${token}`,
    };
  };

  // Fetch Documents
  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/embed/`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch documents`);
      }

      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Something went wrong fetching embeddings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Handle File Selection (Max 10MB)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Only allow PDF files
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setUploadError('Only PDF files are accepted. Please upload a .pdf file.');
      setSelectedFile(null);
      return;
    }

    // Check size limit (10MB = 10 * 1024 * 1024 bytes)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the maximum allowed limit of 10 MB.');
      setSelectedFile(null);
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
  };

  // Upload Single Document
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a document to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (purpose) {
      formData.append('purpose', purpose);
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/embed/`, {
        method: 'POST',
        headers: getAuthHeaders(), // Don't manual set Content-Type header when sending FormData
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || `Upload failed with status ${response.status}`);
      }

      // Clear selection & refresh list
      setSelectedFile(null);
      setPurpose('');
      fetchDocuments();
    } catch (err) {
      setUploadError(err.message || 'Failed to embed document.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Document
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document embedding?')) return;

    setDeletingId(id);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/embed/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete document ${id}`);
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      alert(err.message || 'Error deleting document');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter documents based on search
  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.purpose && doc.purpose.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
            Processing
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <header className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 text-[#ea4335] rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                Gmail Knowledge Embeddings
              </h1>
              <p className="text-sm text-slate-500">
                Embed custom documents into your MySQL vector index
              </p>
            </div>
          </div>

          <button
            onClick={fetchDocuments}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-200 transition-all shadow-sm active:scale-95 disabled:opacity-50 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </header>

        {/* Upload Form Box */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileUp className="w-5 h-5 text-[#ea4335]" />
            <h2 className="font-semibold text-slate-900 text-base">Embed New Document</h2>
            <span className="text-xs text-slate-400 font-normal ml-auto">Max File Size: 10 MB</span>
          </div>

          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* File Selection Area */}
              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-[#ea4335]/50 transition-colors bg-slate-50/50 flex flex-col items-center justify-center text-center">
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept="application/pdf,.pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  disabled={isUploading}
                />
                
                {selectedFile ? (
                  <div className="flex items-center gap-2 text-slate-800 text-sm font-medium">
                    <FileText className="w-5 h-5 text-[#ea4335]" />
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-7 h-7 text-slate-400 mb-1" />
                    <p className="text-xs font-medium text-slate-700">Click or drag document to upload</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Accepts PDF files only.</p>
                  </>
                )}
              </div>

              {/* Purpose / Metadata Input */}
              <div className="flex flex-col justify-between space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Document Purpose / Context (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="E.g., Contains context regarding Q3 Gmail auto-responder rules..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ea4335]/20 focus:border-[#ea4335] resize-none"
                    disabled={isUploading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="w-full py-2.5 px-4 bg-[#ea4335] hover:bg-[#d93025] text-white font-medium text-sm rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Creating Vector Embeddings...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Start Embedding Process
                    </>
                  )}
                </button>
              </div>

            </div>
          </form>
        </section>

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by filename or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ea4335]/20 focus:border-[#ea4335] transition-all shadow-sm"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
            Total Files: <span className="text-slate-900 font-bold">{filteredDocs.length}</span>
          </div>
        </div>

        {/* Fetch Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Table Area */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-slate-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <HardDrive className="w-6 h-6" />
              </div>
              <p className="text-slate-600 font-medium">No embedded documents found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload a document above to create vector embeddings stored in MySQL.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-medium">
                  <tr>
                    <th className="py-3.5 px-6">Document</th>
                    <th className="py-3.5 px-4">Chunks</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors group">
                      
                      {/* Name & Purpose */}
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-50 text-[#ea4335] rounded-lg mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 tracking-tight">
                              {doc.filename}
                            </p>
                            {doc.purpose && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xs">
                                {doc.purpose}
                              </p>
                            )}
                            <span className="inline-block mt-1 text-[10px] font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                              {doc.file_type || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Chunk Count */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-mono">
                          {doc.chunk_count ?? 0} vector chunks
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <StatusBadge status={doc.status} />
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={deletingId === doc.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 disabled:opacity-50"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${deletingId === doc.id ? 'animate-bounce' : ''}`} />
                          {deletingId === doc.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}