"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, Loader2, X } from "lucide-react";

interface Props {
  onUploadComplete?: (skills: string[]) => void;
}

export function ResumeUpload({ onUploadComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf")) {
      setError("Only PDF files are supported");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5MB)");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/job-search/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadedFile(data.fileName);
      setExtractedSkills(data.skills || []);
      onUploadComplete?.(data.skills || []);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setExtractedSkills([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-blue-400" />
        Resume for AI Matching
      </h3>

      {uploadedFile ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm text-green-400 font-medium">{uploadedFile}</span>
            </div>
            <button onClick={clearUpload} className="text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {extractedSkills.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Extracted Skills:</p>
              <div className="flex flex-wrap gap-1.5">
                {extractedSkills.slice(0, 10).map(skill => (
                  <span key={skill} className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                    {skill}
                  </span>
                ))}
                {extractedSkills.length > 10 && (
                  <span className="text-xs text-gray-500">+{extractedSkills.length - 10} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${isDragging 
              ? "border-blue-500 bg-blue-500/10" 
              : "border-gray-600 hover:border-gray-500 hover:bg-gray-700/30"
            }
          `}
        >
          <input 
            ref={inputRef}
            type="file" 
            accept=".pdf" 
            onChange={handleChange} 
            className="hidden" 
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
              <p className="text-sm text-gray-400">Extracting skills...</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                Drop your resume or <span className="text-blue-400">browse</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF only, max 5MB</p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}
