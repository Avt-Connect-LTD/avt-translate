"use client";

import * as React from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface FileDropzoneProps {
  onChange: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function FileDropzone({
  onChange,
  accept = {
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "text/plain": [".txt"],
  },
  maxFiles = 1,
  maxSize = 5000000,
  className,
  disabled = false,
  children,
}: FileDropzoneProps) {
  const [rejectedFiles, setRejectedFiles] = React.useState<FileRejection[]>([]);

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (acceptedFiles?.length) {
        onChange(acceptedFiles);
      }
      setRejectedFiles(rejectedFiles);
    },
    [onChange]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept,
    maxFiles,
    maxSize,
    disabled,
    onDrop,
  });

  return (
    <div className="space-y-2 w-full">
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className={cn(
          "relative border rounded-xl p-8 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center",
          isDragActive
            ? "border-white/40 bg-black/60 backdrop-blur-md"
            : "border-white/10 bg-black/30 backdrop-blur-sm",
          isDragAccept ? "border-white/70" : "",
          isDragReject ? "border-destructive" : "",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...(getRootProps() as any)}
      >
        <input {...getInputProps()} />

        <div className="space-y-4 text-center">
          {children || (
            <>
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full border border-white/20 bg-black/50">
                <motion.svg
                  className="w-6 h-6 text-white"
                  animate={{ y: isDragActive ? [-1, 1, -1] : 0 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </motion.svg>
              </div>
              <div>
                <p className="text-sm text-white">
                  <span className="font-medium">Click to upload</span> or drag
                  and drop
                </p>
                <p className="mt-1 text-xs text-white/60">
                  {accept && Object.values(accept).flat().join(", ")}
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {rejectedFiles.length > 0 && (
          <motion.div
            className="text-destructive text-sm mt-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {rejectedFiles.map(({ file, errors }) => (
              <div key={file.name} className="mt-1">
                <p>
                  {file.name}: {errors.map((e) => e.message).join(", ")}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
