"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { FilePreview } from "@/components/ui/file-preview";
import { ChangeEvent, useState, useCallback } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import * as xlsx from "xlsx";

type Step = "upload" | "review" | "translate" | "merge";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [TranslateFile, setTranslateFile] = useState<File | null>(null);
  const [table, setTable] = useState<xlsx.WorkBook | null>(null);
  const [proccededData, setProcessedData] = useState<any[][] | null>(null);
  const [headers, setHeaders] = useState<any[] | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<any[][] | null>(null);
  const [mergedFileBuffer, setMergedFileBuffer] = useState<ArrayBuffer | null>(
    null
  );

  const [currentStep, setCurrentStep] = useState<Step>("upload");

  const keepColumns = [3];

  const [textToIdMap, setTextToIdMap] = useState<Map<string, number>>(
    new Map()
  );

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: "array" });
        setTable(workbook);

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const allData = xlsx.utils.sheet_to_json(sheet, {
          header: 1,
        }) as any[][];
        setOriginalData(allData);

        processSheetData(workbook);
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  }

  function handleTranslatedFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && originalData) {
      const selectedFile = e.target.files[0];
      setTranslateFile(selectedFile);

      const fileType = selectedFile.name.split(".").pop()?.toLowerCase();

      const reader = new FileReader();

      reader.onload = (e) => {
        if (fileType === "txt") {
          const text = e.target?.result as string;

          const hasColumns = text.includes("\t");

          const translatedData: Array<{ id: string | number; text: string }> =
            [];

          if (hasColumns) {
            const rows = text
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line !== "");

            rows.forEach((row) => {
              const parts = row.split("\t");
              if (parts.length >= 2) {
                const id = parts[0];
                const translatedText = parts.slice(1).join("\t");
                translatedData.push({
                  id: id,
                  text: translatedText,
                });
              }
            });
          } else {
            const lines = text
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line !== "");

            const lineNumberRegex = /^(\d+)\s+(.+)$/;

            lines.forEach((line) => {
              const match = line.match(lineNumberRegex);
              if (match) {
                const id = match[1];
                const content = match[2];
                translatedData.push({
                  id: id,
                  text: content,
                });
              } else {
                if (translatedData.length > 0) {
                  const lastItem = translatedData[translatedData.length - 1];
                  lastItem.text += " " + line;
                }
              }
            });
          }

          const mergedData = [...originalData];

          const languageCodes = [
            "fr",
            "es",
            "de",
            "it",
            "ja",
            "zh",
            "ru",
            "pt",
            "nl",
            "ar",
          ];
          let detectedLang = "es";

          const fileName = selectedFile.name.toLowerCase();
          const foundLangCode = languageCodes.find((code) =>
            fileName.includes(code)
          );
          if (foundLangCode) {
            detectedLang = foundLangCode;
          }

          const headerRow = mergedData[0];

          let targetLangColIndex: number | null = null;

          targetLangColIndex = headerRow.findIndex(
            (header) =>
              header &&
              typeof header === "string" &&
              header.toLowerCase() === detectedLang.toLowerCase()
          );

          if (targetLangColIndex === -1 || targetLangColIndex === null) {
            `Adding column '${detectedLang}' to header row`;
            targetLangColIndex = headerRow.length;
            headerRow.push(detectedLang.toUpperCase());

            for (let i = 1; i < mergedData.length; i++) {
              mergedData[i][targetLangColIndex] = "";
            }
          }

          `Target language column is '${detectedLang}' at index ${targetLangColIndex}`;

          const idToTranslationMap = new Map<string | number, string>();
          translatedData.forEach((item) => {
            idToTranslationMap.set(item.id, item.text);
          });

          const originalTextsWithIds = new Map<string, number>();
          originalData.slice(1).forEach((row, index) => {
            if (row[keepColumns[0]]) {
              originalTextsWithIds.set(
                String(row[keepColumns[0]]).trim(),
                index + 1
              );
            }
          });

          let matchesFound = 0;
          if (translatedData.length > 0) {
            ("Trying to match by line number/ID");

            for (let i = 1; i < mergedData.length; i++) {
              const lineId = String(i);
              const translation = idToTranslationMap.get(lineId);

              if (translation) {
                mergedData[i][targetLangColIndex] = translation;
                matchesFound++;
              }
            }

            `Found ${matchesFound} translations by line number`;
          }

          const mergedWorkbook = xlsx.utils.book_new();
          const mergedSheet = xlsx.utils.aoa_to_sheet(mergedData);
          xlsx.utils.book_append_sheet(
            mergedWorkbook,
            mergedSheet,
            "Merged Content"
          );

          setTable(mergedWorkbook);

          processSheetData(mergedWorkbook);

          const mergedExcelBuffer = xlsx.write(mergedWorkbook, {
            bookType: "xlsx",
            type: "array",
          });

          setMergedFileBuffer(mergedExcelBuffer);
        } else if (fileType === "xlsx" || fileType === "xls") {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = xlsx.read(data, { type: "array" });

          setTranslationError(
            "Excel files not fully supported yet. Please use the text format."
          );
        } else {
          console.error("Unsupported file format");
          setTranslationError(
            "Unsupported file format. Please upload a .txt file with tab-separated values."
          );
        }
      };

      if (fileType === "txt") {
        reader.readAsText(selectedFile);
      } else {
        reader.readAsArrayBuffer(selectedFile);
      }
    } else {
      console.error(
        "Please upload an original file first before adding translations"
      );
      setTranslationError(
        "Please upload an original file first before adding translations"
      );
    }
  }

  function isMonthName(text: string): boolean {
    const englishMonths = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];

    const spanishMonths = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];

    const frenchMonths = [
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "août",
      "septembre",
      "octobre",
      "novembre",
      "décembre",
    ];

    const germanMonths = [
      "januar",
      "februar",
      "märz",
      "april",
      "mai",
      "juni",
      "juli",
      "august",
      "september",
      "oktober",
      "november",
      "dezember",
    ];

    const allMonths = [
      ...englishMonths,
      ...spanishMonths,
      ...frenchMonths,
      ...germanMonths,
    ];

    return allMonths.includes(text.toLowerCase());
  }

  function extractPattern(text: string): string {
    const pattern = text.replace(/[a-zA-Z\s]/g, "");
    return pattern;
  }

  function patternsMatch(pattern1: string, pattern2: string): boolean {
    if (pattern1.length === 0 && pattern2.length === 0) return true;

    const numbers1 = pattern1.match(/\d+/g) || ([] as string[]);
    const numbers2 = pattern2.match(/\d+/g) || ([] as string[]);

    if (numbers1.length > 0 && numbers2.length > 0) {
      return numbers1.some((n1) => numbers2.includes(n1));
    }

    const special1 = pattern1.match(/[^\w\s]/g) || ([] as string[]);
    const special2 = pattern2.match(/[^\w\s]/g) || ([] as string[]);

    if (special1.length > 0 && special2.length > 0) {
      return special1.some((s1) => special2.includes(s1));
    }

    return false;
  }

  function processSheetData(workbook: xlsx.WorkBook) {
    if (!workbook || !workbook.SheetNames.length) return;

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const allData = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (allData.length === 0) return;

    const allHeaders = allData[0];

    if (currentStep === "upload" || currentStep === "merge") {
      setHeaders(allHeaders);
      setProcessedData(allData.slice(1));
    } else {
      const filteredHeaders = keepColumns.map((index) => allHeaders[index]);
      const filteredData = allData
        .slice(1)
        .map((row) => keepColumns.map((index) => row[index]));

      setHeaders(filteredHeaders);
      setProcessedData(filteredData);
    }
  }

  const createSheetforTranslation = useCallback(() => {
    if (!originalData) return;

    const extractedTexts: Array<{ id: number; text: string }> = [];
    let nextId = 1;

    originalData.slice(1).forEach((row, rowIndex) => {
      const cellContent = row[keepColumns[0]];
      if (cellContent) {
        const text = String(cellContent).trim();
        if (text !== "") {
          extractedTexts.push({
            id: nextId,
            text: text,
          });
          nextId++;
        }
      }
    });

    const mapping = new Map<string, number>();
    extractedTexts.forEach((item) => {
      mapping.set(item.text, item.id);
    });
    setTextToIdMap(mapping);

    const textContent = extractedTexts
      .map((item) => `${item.id}\t${item.text}`)
      .join("\n");

    return new TextEncoder().encode(textContent);
  }, [originalData, keepColumns]);

  const downloadFile = useCallback(() => {
    const textBuffer = createSheetforTranslation();
    if (!textBuffer) return;

    const blob = new Blob([textBuffer], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "content_to_translate.txt";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [createSheetforTranslation]);

  const translateFile = useCallback(async () => {
    if (!proccededData || proccededData.length === 0) {
      ("No data to translate");
      return;
    }

    try {
      setIsTranslating(true);
      setTranslationError(null);

      const textBuffer = createSheetforTranslation();
      if (!textBuffer) return;

      const blob = new Blob([textBuffer], { type: "text/plain" });
      const fileToTranslate = new File([blob], "content_to_translate.txt", {
        type: "text/plain",
      });

      const formData = new FormData();
      formData.append("file", fileToTranslate);
      formData.append("sourceLanguage", "EN");
      formData.append("targetLanguage", "ES");

      const response = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Translation failed");
      }

      const translatedBlob = await response.blob();

      const url = window.URL.createObjectURL(translatedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "translated_content.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setTranslationError("DeepL API limits exceeded, use manual mode");
    } finally {
      setIsTranslating(false);
    }
  }, [proccededData, createSheetforTranslation]);

  const downloadMergedFile = useCallback(() => {
    if (!mergedFileBuffer) return;

    const blob = new Blob([mergedFileBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "translated_result.xlsx";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [mergedFileBuffer]);

  const goToNextStep = () => {
    switch (currentStep) {
      case "upload":
        setCurrentStep("review");
        break;
      case "review":
        setCurrentStep("translate");
        break;
      case "translate":
        setCurrentStep("merge");
        break;
      case "merge":
        break;
    }
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case "review":
        setCurrentStep("upload");
        break;
      case "translate":
        setCurrentStep("review");
        break;
      case "merge":
        setCurrentStep("translate");
        break;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "upload":
        return (
          <>
            <motion.h2
              className="text-xl font-semibold mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Step 1: Upload Original File
            </motion.h2>
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Label htmlFor="original-file" className="block mb-2">
                Upload Original File
              </Label>
              <FileDropzone
                onChange={(files) => {
                  if (files && files.length > 0) {
                    const selectedFile = files[0];
                    setFile(selectedFile);

                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const data = new Uint8Array(
                        e.target?.result as ArrayBuffer
                      );
                      const workbook = xlsx.read(data, { type: "array" });
                      setTable(workbook);

                      const sheetName = workbook.SheetNames[0];
                      const sheet = workbook.Sheets[sheetName];
                      const allData = xlsx.utils.sheet_to_json(sheet, {
                        header: 1,
                      }) as any[][];
                      setOriginalData(allData);

                      processSheetData(workbook);
                    };
                    reader.readAsArrayBuffer(selectedFile);
                  }
                }}
                accept={{
                  "application/vnd.ms-excel": [".xls"],
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    [".xlsx"],
                }}
              />
            </motion.div>

            <AnimatePresence>
              {originalData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6"
                >
                  <FilePreview
                    file={file!}
                    onRemove={() => {
                      setFile(null);
                      setOriginalData(null);
                      setTable(null);
                    }}
                  />
                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={goToNextStep}
                        className="mt-4 bg-primary hover:bg-primary/90 transition-all duration-300"
                      >
                        Continue to Review Data
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        );

      case "review":
        return (
          <>
            <motion.h2
              className="text-xl font-semibold mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Step 2: Review Column to be translated
            </motion.h2>
            <motion.p
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              Review the content that will be translated:
            </motion.p>

            {table && (
              <motion.div
                className="w-full overflow-auto mb-4 border border-white/5 rounded-lg backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-black/40">
                      {headers?.map((header, index) => (
                        <th
                          key={index}
                          className={`border-b border-white/10 p-3 font-bold text-left ${
                            header === "figma_text"
                              ? "text-emerald-400 bg-emerald-400/10 rounded-t-xl"
                              : "text-white"
                          }`}
                        >
                          {header === "figma_text" ? (
                            <div className="flex items-center gap-1">
                              <span className="text-lg">✨</span>
                              {header}
                              <span className="text-xs font-normal ml-1 bg-emerald-400/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                to translate
                              </span>
                            </div>
                          ) : (
                            header
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proccededData?.map((row, rowIndex) => (
                      <motion.tr
                        key={rowIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.1 + rowIndex * 0.05,
                        }}
                        className="hover:bg-black/40"
                      >
                        {row.map((cell, cellIndex) => {
                          const isFigmaText =
                            headers && headers[cellIndex] === "figma_text";
                          const isLastRow =
                            rowIndex === proccededData.length - 1;

                          return (
                            <td
                              key={cellIndex}
                              className={`border-t border-white/5 p-3 ${
                                isFigmaText
                                  ? `text-white bg-emerald-400/5 font-medium border-l border-r border-emerald-500/20 ${
                                      isLastRow ? "rounded-b-xl" : ""
                                    }`
                                  : "text-white/80"
                              }`}
                            >
                              {cell}
                            </td>
                          );
                        })}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            <motion.div
              className="flex gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Button
                onClick={goToPreviousStep}
                variant="outline"
                className="border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                Back
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={downloadFile}
                  disabled={!proccededData || proccededData.length === 0}
                  className="bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                >
                  Download Extracted Data
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={goToNextStep}
                  disabled={!proccededData || proccededData.length === 0}
                  className="bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                >
                  Continue to Translation
                </Button>
              </motion.div>
            </motion.div>
          </>
        );

      case "translate":
        return (
          <>
            <motion.h2
              className="text-xl font-semibold mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Step 3: Translation
            </motion.h2>
            <motion.p
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              You can either translate the file automatically or translate it
              manually and upload later.
            </motion.p>

            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={goToNextStep}
                  className="w-full bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                >
                  I'll translate the document manually
                </Button>
              </motion.div>

              <motion.p
                className="text-center text-white/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                - or -
              </motion.p>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 1 }}
                >
                  <Button
                    onClick={translateFile}
                    variant="outline"
                    disabled={
                      !proccededData ||
                      proccededData.length === 0 ||
                      isTranslating
                    }
                    className="w-full border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300"
                  >
                    {isTranslating ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Translating...
                      </span>
                    ) : (
                      "Try translate document automatically"
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {translationError && (
                <motion.p
                  className="text-red-500 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {translationError}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-6"
            >
              <Button
                onClick={goToPreviousStep}
                variant="ghost"
                className="hover:bg-black/30 transition-all duration-300"
              >
                Back to Review
              </Button>
            </motion.div>
          </>
        );

      case "merge":
        return (
          <>
            <motion.h2
              className="text-xl font-semibold mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Step 4: Upload Translated File
            </motion.h2>
            <motion.p
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              Upload your translated file (from deepL) to merge with the
              original document:
            </motion.p>

            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Label htmlFor="translated-file" className="block mb-2">
                Upload Translated File
              </Label>
              <FileDropzone
                onChange={(files) => {
                  if (files && files.length > 0 && originalData) {
                    const selectedFile = files[0];
                    setTranslateFile(selectedFile);

                    const fileType = selectedFile.name
                      .split(".")
                      .pop()
                      ?.toLowerCase();

                    const reader = new FileReader();

                    reader.onload = (e) => {
                      if (fileType === "txt") {
                        const text = e.target?.result as string;

                        const hasColumns = text.includes("\t");

                        const translatedData: Array<{
                          id: string | number;
                          text: string;
                        }> = [];

                        if (hasColumns) {
                          const rows = text
                            .split("\n")
                            .map((line) => line.trim())
                            .filter((line) => line !== "");

                          rows.forEach((row) => {
                            const parts = row.split("\t");
                            if (parts.length >= 2) {
                              const id = parts[0];
                              const translatedText = parts.slice(1).join("\t");
                              translatedData.push({
                                id: id,
                                text: translatedText,
                              });
                            }
                          });
                        } else {
                          const lines = text
                            .split("\n")
                            .map((line) => line.trim())
                            .filter((line) => line !== "");

                          const lineNumberRegex = /^(\d+)\s+(.+)$/;

                          lines.forEach((line) => {
                            const match = line.match(lineNumberRegex);
                            if (match) {
                              const id = match[1];
                              const content = match[2];
                              translatedData.push({
                                id: id,
                                text: content,
                              });
                            } else {
                              if (translatedData.length > 0) {
                                const lastItem =
                                  translatedData[translatedData.length - 1];
                                lastItem.text += " " + line;
                              }
                            }
                          });
                        }

                        const mergedData = [...originalData];

                        const languageCodes = [
                          "fr",
                          "es",
                          "de",
                          "it",
                          "ja",
                          "zh",
                          "ru",
                          "pt",
                          "nl",
                          "ar",
                        ];
                        let detectedLang = "es";

                        const fileName = selectedFile.name.toLowerCase();
                        const foundLangCode = languageCodes.find((code) =>
                          fileName.includes(code)
                        );
                        if (foundLangCode) {
                          detectedLang = foundLangCode;
                        }

                        const headerRow = mergedData[0];

                        let targetLangColIndex: number | null = null;

                        targetLangColIndex = headerRow.findIndex(
                          (header) =>
                            header &&
                            typeof header === "string" &&
                            header.toLowerCase() === detectedLang.toLowerCase()
                        );

                        if (
                          targetLangColIndex === -1 ||
                          targetLangColIndex === null
                        ) {
                          `Adding column '${detectedLang}' to header row`;
                          targetLangColIndex = headerRow.length;
                          headerRow.push(detectedLang.toUpperCase());

                          for (let i = 1; i < mergedData.length; i++) {
                            mergedData[i][targetLangColIndex] = "";
                          }
                        }

                        const idToTranslationMap = new Map<
                          string | number,
                          string
                        >();
                        translatedData.forEach((item) => {
                          idToTranslationMap.set(item.id, item.text);
                        });

                        const originalTextsWithIds = new Map<string, number>();
                        originalData.slice(1).forEach((row, index) => {
                          if (row[keepColumns[0]]) {
                            originalTextsWithIds.set(
                              String(row[keepColumns[0]]).trim(),
                              index + 1
                            );
                          }
                        });

                        let matchesFound = 0;
                        if (translatedData.length > 0) {
                          ("Trying to match by line number/ID");

                          for (let i = 1; i < mergedData.length; i++) {
                            const lineId = String(i);
                            const translation = idToTranslationMap.get(lineId);

                            if (translation) {
                              mergedData[i][targetLangColIndex] = translation;
                              matchesFound++;
                            }
                          }

                          `Found ${matchesFound} translations by line number`;
                        }

                        const mergedWorkbook = xlsx.utils.book_new();
                        const mergedSheet = xlsx.utils.aoa_to_sheet(mergedData);
                        xlsx.utils.book_append_sheet(
                          mergedWorkbook,
                          mergedSheet,
                          "Merged Content"
                        );

                        setTable(mergedWorkbook);

                        processSheetData(mergedWorkbook);

                        const mergedExcelBuffer = xlsx.write(mergedWorkbook, {
                          bookType: "xlsx",
                          type: "array",
                        });

                        setMergedFileBuffer(mergedExcelBuffer);
                      } else if (fileType === "xlsx" || fileType === "xls") {
                        const data = new Uint8Array(
                          e.target?.result as ArrayBuffer
                        );
                        const workbook = xlsx.read(data, { type: "array" });

                        setTranslationError(
                          "Excel files not fully supported yet. Please use the text format."
                        );
                      } else {
                        console.error("Unsupported file format");
                        setTranslationError(
                          "Unsupported file format. Please upload a .txt file with tab-separated values."
                        );
                      }
                    };

                    if (fileType === "txt") {
                      reader.readAsText(selectedFile);
                    } else {
                      reader.readAsArrayBuffer(selectedFile);
                    }
                  } else {
                    console.error(
                      "Please upload an original file first before adding translations"
                    );
                    setTranslationError(
                      "Please upload an original file first before adding translations"
                    );
                  }
                }}
                accept={{
                  "application/vnd.ms-excel": [".xls"],
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    [".xlsx"],
                  "text/plain": [".txt"],
                }}
              />
            </motion.div>

            <AnimatePresence>
              {translationError && (
                <motion.p
                  className="text-red-500 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {translationError}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {table && currentStep === "merge" && TranslateFile && (
                <motion.div
                  className="w-full overflow-auto mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.h3
                    className="font-semibold mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Merged Result:
                  </motion.h3>
                  <motion.div
                    className="border border-white/5 rounded-lg backdrop-blur-sm overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-black/40">
                          {headers?.map((header, index) => (
                            <th
                              key={index}
                              className={`border-b border-white/10 p-3 font-bold text-left ${
                                header === "figma_text"
                                  ? " "
                                  : typeof header === "string" &&
                                    /^[a-zA-Z]{2,3}$/.test(header) &&
                                    header.toLowerCase() !== "id"
                                  ? "text-emerald-400 bg-emerald-400/10 rounded-tl-lg w-[300px] min-w-[300px]"
                                  : "text-white"
                              }`}
                            >
                              {header === "figma_text" ? (
                                <div className="flex items-center gap-1">
                                  {header}
                                  <span className="text-xs font-normal ml-1 bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">
                                    Origin
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  {header}
                                  {typeof header === "string" &&
                                    /^[a-zA-Z]{2,3}$/.test(header) &&
                                    header.toLowerCase() !== "id" && (
                                      <span className="text-xs font-normal ml-1 text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-400/20">
                                        Translated content
                                      </span>
                                    )}
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {proccededData?.map((row, rowIndex) => (
                          <motion.tr
                            key={rowIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: 0.1 + rowIndex * 0.05,
                            }}
                            className="hover:bg-black/40"
                          >
                            {row.map((cell, cellIndex) => {
                              const isFigmaText =
                                headers && headers[cellIndex] === "figma_text";
                              const isTranslatedColumn =
                                headers &&
                                typeof headers[cellIndex] === "string" &&
                                /^[a-zA-Z]{2,3}$/.test(headers[cellIndex]) &&
                                headers[cellIndex].toLowerCase() !== "id";
                              const isLastRow =
                                rowIndex === proccededData.length - 1;

                              return (
                                <td
                                  key={cellIndex}
                                  className={`border-t border-white/5 p-3 ${
                                    isFigmaText
                                      ? `text-white/80 font-medium ${
                                          isLastRow ? "rounded-b-xl" : ""
                                        }`
                                      : isTranslatedColumn
                                      ? `text-white bg-emerald-400/5 font-medium border-l border-r border-emerald-500/20 w-[300px] min-w-[300px] ${
                                          isLastRow ? "rounded-b-xl" : ""
                                        }`
                                      : "text-white/80"
                                  }`}
                                >
                                  {cell}
                                </td>
                              );
                            })}
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="flex gap-4 mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Button
                onClick={goToPreviousStep}
                variant="outline"
                className="border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                Back
              </Button>
              {TranslateFile && (
                <Button
                  onClick={() => setCurrentStep("upload")}
                  variant="outline"
                  className="border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  Start Over
                </Button>
              )}
              {mergedFileBuffer && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={downloadMergedFile}
                    className="bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                  >
                    Download Merged File
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </>
        );
    }
  };

  const renderProgressBar = () => {
    const steps = [
      { key: "upload", label: "Upload" },
      { key: "review", label: "Review" },
      { key: "translate", label: "Translate" },
      { key: "merge", label: "Merge" },
    ];

    return (
      <motion.div
        className="w-full mb-10 max-w-xl mx-auto"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => {
            const isActive = currentStep === step.key;
            const isCompleted =
              steps.findIndex((s) => s.key === currentStep) > index;
            const canNavigate =
              index <= steps.findIndex((s) => s.key === currentStep) ||
              (index === steps.findIndex((s) => s.key === currentStep) + 1 &&
                (currentStep !== "upload" || originalData));

            return (
              <div key={step.key} className="flex items-center">
                {index > 0 && (
                  <div className="w-20 h-[2px] mx-1 relative">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? "100%" : "0%" }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                    <div className="absolute top-0 left-0 w-full h-full bg-muted" />
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <motion.button
                    onClick={() =>
                      canNavigate && setCurrentStep(step.key as Step)
                    }
                    disabled={!canNavigate}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border border-white/10 transition-all duration-300 backdrop-blur-sm ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : isCompleted
                        ? "bg-primary/20 text-white border-primary/50"
                        : "bg-black/30 text-white/60 hover:bg-black/40 hover:text-white/80"
                    } ${
                      canNavigate
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-50"
                    }`}
                    whileHover={canNavigate ? { scale: 1.05 } : {}}
                    whileTap={canNavigate ? { scale: 0.95 } : {}}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </motion.button>
                  <span
                    className={`text-sm mt-2 font-medium ${
                      isActive ? "text-white" : "text-white/60"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-background to-background/95 relative">
      <div className="max-w-4xl mx-auto space-y-8 pt-8 pb-16 relative z-10">
        <header className="text-center space-y-2">
          <div className="h-20 flex items-center justify-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              Translate
            </h1>
          </div>
          <p className="text-white/70">For use with CopyDoc inside Figma!</p>
        </header>

        {renderProgressBar()}

        <motion.div
          className="bg-black/50 rounded-xl border border-white/10 shadow-lg shadow-black/5 p-6 backdrop-blur-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {renderStepContent()}
        </motion.div>

        <footer className="text-center text-sm text-white/60">
          <div className="mt-8 backdrop-blur-sm border border-white/10 rounded-xl p-6 bg-black/50 shadow-lg shadow-black/5">
            <h3 className="text-xl font-semibold mb-6 text-white/90">
              How to use:
            </h3>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem
                value="instructions"
                className="border border-white/10 mb-4 rounded-xl overflow-hidden backdrop-blur-sm transition-all duration-300 data-[state=open]:shadow-lg "
              >
                <motion.div
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                  className="rounded-t-xl"
                >
                  <AccordionTrigger className="hover:no-underline text-white px-5 py-4 font-medium transition-all duration-300">
                    <motion.span
                      initial={{ opacity: 0.9 }}
                      whileHover={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      View detailed instructions
                    </motion.span>
                  </AccordionTrigger>
                </motion.div>
                <AccordionContent className="bg-black/30 border-t border-white/10 data-[state=open]:animate-accordionSlideDown data-[state=closed]:animate-accordionSlideUp">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-5 py-4"
                  >
                    <ol className="space-y-3 text-white/80 list-decimal pl-5 text-left">
                      <li>
                        Inside of CopyDoc, click{" "}
                        <span className="text-primary font-medium">
                          localise frames
                        </span>{" "}
                        and export as XLSX
                      </li>
                      <li>
                        Import this file into Translate using the uploader above
                      </li>
                      <li>
                        Translate should find the correct column, which should
                        be the one labeled{" "}
                        <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-sm">
                          figma_text
                        </span>
                      </li>
                      <li>Scroll to bottom and download the extracted data</li>
                      <li>
                        Translate the text document using any translation tool
                        that keeps the formatting the same (DeepL recommended)
                      </li>
                      <li>
                        Use the '
                        <span className="italic">
                          I'll translate the document manually
                        </span>
                        ' button and then import the translated text file back
                        into Translate
                      </li>
                      <li>
                        The end column that was created by CopyDoc should now be
                        filled in with the translated data!
                      </li>
                      <li>
                        Download the merged file and import it back into
                        CopyDoc, and your content will be localised!
                      </li>
                    </ol>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </footer>
      </div>
    </div>
  );
}
