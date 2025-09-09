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
  const [previewPort, setPreviewPort] = useState<number | null>(null);

  useEffect(() => {
    if (hasFiles && projectId) {
      // Start the preview server and get the port
      fetch(`http://localhost:3002/api/start-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.port) {
          setTimeout(() => setPreviewPort(data.port), 2000);
        }
      })
      .catch(console.error);
    }
  }, [hasFiles, projectId]);

  if (!hasFiles || !previewPort) {
    return <InitializingPreview />;
  }

  const previewUrl = `http://localhost:${previewPort}`;

  return (
    <iframe
      src={previewUrl}
      title={`Live Preview for project ${projectId}`}
      className="w-full h-full border-0"
      onError={() => console.error('Preview failed to load')}
    />
  );
};
