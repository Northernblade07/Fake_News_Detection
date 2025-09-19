// components/detect/Uploader.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X, Loader2, Globe, Type } from 'lucide-react';

type Mode = 'file' | 'text' | 'url';
type Payload =
  | { mode: 'file'; files: File[] }
  | { mode: 'text'; text: string }
  | { mode: 'url'; url: string };

export function Uploader({ onChange }: { onChange?: (p: Payload) => void }) {
  const [mode, setMode] = useState<Mode>('file');
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const picked = accepted.slice(0, 3);
    setFiles(picked);
    onChange?.({ mode: 'file', files: picked });
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'video/*': ['.mp4', '.mov', '.avi'],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
  });

  const handleAnalyze = async () => {
    setIsLoading(true);
    // Later: integrate Cloudinary Upload Widget or direct upload, persist public_id, then call backend analysis.
    // Placeholder delay
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex gap-2">
        <button onClick={() => setMode('file')}
          className={`rounded-md px-3 py-1 text-sm ${mode === 'file' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          File
        </button>
        <button onClick={() => setMode('text')}
          className={`rounded-md px-3 py-1 text-sm ${mode === 'text' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          Text
        </button>
        <button onClick={() => setMode('url')}
          className={`rounded-md px-3 py-1 text-sm ${mode === 'url' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          URL
        </button>
      </div>

      {mode === 'file' && (
        <>
          <div
            {...getRootProps()}
            className={`w-full cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-4">
              <UploadCloud className={`h-12 w-12 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-muted-foreground">
                <span className="text-primary">Click to upload</span> or drag and drop audio, video, PDF, or image
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-2 font-semibold">Selected files</h4>
              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-card p-3">
                    <div className="flex items-center gap-3">
                      <File className="h-5 w-5 text-primary" />
                      <span className="text-sm">{f.name}</span>
                    </div>
                    <button onClick={() => setFiles(prev => prev.filter(p => p.name !== f.name))}
                      className="text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'text' && (
        <div className="rounded-xl bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground"><Type className="h-4 w-4" /> Paste news text</div>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); onChange?.({ mode: 'text', text: e.target.value }); }}
            className="h-44 w-full rounded-lg bg-muted/40 p-3 text-sm outline-none ring-1 ring-muted focus:ring-primary"
            placeholder="Paste article text, transcript, or snippet..."
          />
        </div>
      )}

      {mode === 'url' && (
        <div className="rounded-xl bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /> Paste article/media URL</div>
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); onChange?.({ mode: 'url', url: e.target.value }); }}
            className="w-full rounded-lg bg-muted/40 p-3 text-sm outline-none ring-1 ring-muted focus:ring-primary"
            placeholder="https://..."
          />
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={isLoading || (mode === 'file' && files.length === 0)}
          className="flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Start Detection'}
        </button>
      </div>
    </div>
  );
}
