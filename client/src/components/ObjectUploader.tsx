import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
  uploadType?: 'gif' | 'flashcard' | 'general';
}

/**
 * Enhanced file upload component for GIFs, flashcards, and other media.
 * 
 * Features:
 * - Support for multiple file types (GIF, video, JSON, CSV)
 * - Drag and drop interface
 * - Progress tracking and preview
 * - Bulk upload capabilities
 * - File validation and error handling
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum files allowed (default: 5)
 * @param props.maxFileSize - Maximum file size in bytes (default: 50MB)
 * @param props.allowedFileTypes - Allowed MIME types
 * @param props.onGetUploadParameters - Function to get presigned URLs
 * @param props.onComplete - Callback when upload completes
 * @param props.uploadType - Type of upload for better UX
 * @param props.buttonClassName - Custom button styling
 * @param props.children - Button content
 */
export function ObjectUploader({
  maxNumberOfFiles = 5,
  maxFileSize = 52428800, // 50MB default
  allowedFileTypes,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  uploadType = 'general'
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);

  // Set default file types based on upload type
  const getDefaultFileTypes = () => {
    switch (uploadType) {
      case 'gif':
        return ['.gif', '.mp4', '.webm', 'image/gif', 'video/mp4', 'video/webm'];
      case 'flashcard':
        return ['.json', '.csv', 'application/json', 'text/csv'];
      default:
        return undefined; // Allow all types
    }
  };

  const restrictions = {
    maxNumberOfFiles,
    maxFileSize,
    allowedFileTypes: allowedFileTypes || getDefaultFileTypes(),
  };

  const [uppy] = useState(() =>
    new Uppy({
      restrictions,
      autoProceed: false,
      allowMultipleUploadBatches: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        console.log("Upload complete:", result);
        onComplete?.(result);
        setShowModal(false);
      })
      .on("error", (error) => {
        console.error("Upload error:", error);
      })
  );

  // Get upload type specific messages
  const getUploadMessages = () => {
    switch (uploadType) {
      case 'gif':
        return {
          title: 'Upload GIFs & Videos',
          note: 'Upload GIF animations or video files for your flashcards',
          restrictions: 'Supports: GIF, MP4, WebM • Max 50MB per file'
        };
      case 'flashcard':
        return {
          title: 'Import Flashcard Sets',
          note: 'Upload JSON or CSV files containing flashcard data',
          restrictions: 'Supports: JSON, CSV • Max 50MB per file'
        };
      default:
        return {
          title: 'Upload Files',
          note: 'Upload your files to cloud storage',
          restrictions: `Max ${maxNumberOfFiles} files • ${Math.round(maxFileSize / 1048576)}MB per file`
        };
    }
  };

  const messages = getUploadMessages();

  return (
    <div>
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        variant={uploadType === 'gif' ? 'default' : 'outline'}
      >
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note={messages.note}
        height={500}
        width={750}
        showProgressDetails={true}
        showRemoveButtonAfterComplete={true}
        browserBackButtonClose={true}
        closeModalOnClickOutside={true}
        doneButtonHandler={() => setShowModal(false)}
        theme="light"
        locale={{
          strings: {
            // Customize upload messages
            dropPasteFiles: `Drop files here or %{browse}`,
            browse: 'browse',
            uploadComplete: 'Upload complete!',
            uploadFailed: 'Upload failed',
            addingMoreFiles: 'Adding more files',
            addMoreFiles: 'Add more files',
            dashboardTitle: messages.title,
            dashboardWindowTitle: `WordWave - ${messages.title}`,
            status: 'Status',
            statusUploading: 'Uploading...',
            statusProcessing: 'Processing...',
            statusUploadComplete: 'Upload complete',
            statusUploadRetry: 'Retry upload',
            statusUploadPaused: 'Upload paused',
            statusLocalDiskErrorTryAgain: 'Try again',
            poweredBy: 'Powered by WordWave',
            save: 'Save',
            cancel: 'Cancel',
            done: 'Done',
            removeFile: 'Remove file',
            editFile: 'Edit file',
            editing: 'Editing %{file}',
            finishEditingFile: 'Finish editing file',
            saveChanges: 'Save changes',
            myDevice: 'My Device',
            dropHint: 'Drop your files here',
            uploadXFiles: {
              0: 'Upload %{smart_count} file',
              1: 'Upload %{smart_count} files'
            },
            uploadXNewFiles: {
              0: 'Upload +%{smart_count} file',
              1: 'Upload +%{smart_count} files'
            },
            folderAdded: {
              0: 'Added %{smart_count} file from %{folder}',
              1: 'Added %{smart_count} files from %{folder}'
            }
          }
        }}
        metaFields={[
          {
            id: 'name',
            name: 'File Name',
            placeholder: 'Enter a descriptive name'
          },
          {
            id: 'description',
            name: 'Description',
            placeholder: 'Describe this file (optional)'
          }
        ]}
      />
      
      {/* Upload restrictions info */}
      <div className="mt-2 text-xs text-muted-foreground">
        {messages.restrictions}
      </div>
    </div>
  );
}