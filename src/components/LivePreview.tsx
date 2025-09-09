import { useProjectStore } from "@/store/projectStore";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const InitializingPreview = () => (
  <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
    <p className="text-muted-foreground animate-pulse">Initializing live preview...</p>
  </div>
);

export const LivePreview = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const hasFiles = useProjectStore((state) => state.files.size > 0);
  const [previewReady, setPreviewReady] = useState(false);

  useEffect(() => {
    if (hasFiles && projectId) {
      // Start the preview server
      fetch(`http://localhost:3002/api/start-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      .then(() => {
        // Give it a moment to start
        setTimeout(() => setPreviewReady(true), 2000);
      })
      .catch(console.error);
    }
  }, [hasFiles, projectId]);

  if (!hasFiles || !previewReady) {
    return <InitializingPreview />;
  }

  // Use a simple port calculation based on project ID
  const port = 5174;
  const previewUrl = `http://localhost:${port}`;

  return (
    <iframe
      src={previewUrl}
      title={`Live Preview for project ${projectId}`}
      className="w-full h-full border-0"
      onError={() => console.error('Preview failed to load')}
    />
  );
};
