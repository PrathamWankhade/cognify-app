// src/components/dashboard/FileUpload.tsx
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { useSession } from 'next-auth/react'; // Import useSession to get the user ID

export default function FileUpload({ courseId }: { courseId: string }) {
  const { data: session } = useSession(); // Get session data on the client
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(''); // Clear error when a new file is selected
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    
    // We need the user's ID for the metadata header.
    if (!session?.user?.id) {
        setError('You must be logged in to upload files.');
        return;
    }

    setIsUploading(true);
    setError('');

    try {
      // The API endpoint needs the filename and courseId as query parameters.
      const url = `/api/upload?filename=${encodeURIComponent(file.name)}&courseId=${courseId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        body: file,
        headers: {
          // This is the new, correct way to pass metadata.
          // Vercel Blob automatically reads headers prefixed with 'x-metadata-'.
          'x-metadata-courseId': courseId,
          'x-metadata-userId': session.user.id,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`File upload failed: ${errorBody}`);
      }

      // Reset the form state on successful upload.
      setFile(null);
      if(inputFileRef.current) {
        inputFileRef.current.value = "";
      }
      
      // Refresh the server component data to show the newly uploaded document.
      router.refresh();

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during upload.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-2 border-dashed rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
        <input
          ref={inputFileRef}
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100 cursor-pointer"
          accept=".pdf,.md,.txt" // Allow a few more file types
        />
        <Button type="submit" disabled={!file || isUploading} className="w-full sm:w-auto">
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </div>
      {file && <p className="text-sm text-muted-foreground mt-2">Selected: {file.name}</p>}
      {error && <p className="text-sm font-medium text-destructive mt-2">{error}</p>}
    </form>
  );
}