// src/components/dashboard/FileUpload.tsx
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

export default function FileUpload({ courseId }: { courseId: string }) {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const response = await fetch(`/api/upload?filename=${file.name}&courseId=${courseId}`, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      // Reset state and refresh the page to show the new document
      setFile(null);
      if(inputFileRef.current) {
        inputFileRef.current.value = "";
      }
      router.refresh();

    } catch (err: unknown) { 
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('An unknown error occurred');
  }
}
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-2 border-dashed rounded-lg">
      <div className="flex items-center space-x-4">
        <input
          ref={inputFileRef}
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
          accept=".pdf" // Restrict to PDF for now
        />
        <Button type="submit" disabled={!file || isUploading}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
      {file && <p className="text-sm text-muted-foreground mt-2">Selected: {file.name}</p>}
      {error && <p className="text-sm font-medium text-destructive mt-2">{error}</p>}
    </form>
  );
}