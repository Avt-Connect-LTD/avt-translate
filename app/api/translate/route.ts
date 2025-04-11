import { NextResponse } from "next/server";
import * as deepl from "deepl-node";
import { SourceLanguageCode, TargetLanguageCode } from "deepl-node";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const translator = new deepl.Translator(process.env.DEEPL_API || "", {
  appInfo: { appName: "AVT-Translate", appVersion: "1.0" },
});

function logFileDetails(message: string, filePath: string) {
  try {
    const stats = fs.statSync(filePath);
    console.log(`${message}: ${filePath}, size: ${stats.size} bytes`);
  } catch (error) {
    console.log(`${message}: ${filePath}, error: ${error}`);
  }
}

export async function POST(request: Request) {
  let inputFilePath = "";
  let outputFilePath = "";

  try {
    console.log("Starting document translation process...");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    console.log(
      `File received: ${file.name}, size: ${file.size}, type: ${file.type}`
    );

    let sourceLanguage = (formData.get("sourceLanguage") as string) || "DE";
    let targetLanguage = (formData.get("targetLanguage") as string) || "EN-US";

    sourceLanguage = sourceLanguage.toUpperCase();
    targetLanguage = targetLanguage.toUpperCase();

    if (targetLanguage === "EN") {
      targetLanguage = "EN-US";
    }

    console.log(`Translation request: ${sourceLanguage} → ${targetLanguage}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uniqueId = Date.now().toString();
    const tempDir = os.tmpdir();
    inputFilePath = path.join(tempDir, `input_${uniqueId}_${file.name}`);
    outputFilePath = path.join(tempDir, `output_${uniqueId}_${file.name}`);

    fs.writeFileSync(inputFilePath, buffer);
    logFileDetails("Input file written", inputFilePath);

    try {
      console.log(
        `Starting translation from ${sourceLanguage} to ${targetLanguage}...`
      );

      await translator.translateDocument(
        inputFilePath,
        outputFilePath,
        sourceLanguage as SourceLanguageCode,
        targetLanguage as TargetLanguageCode,
        { formality: "less" } 
      );

      console.log("Translation completed successfully");
      logFileDetails("Output file created", outputFilePath);

      if (!fs.existsSync(outputFilePath)) {
        throw new Error("Translation failed: output file not found");
      }

      const translatedContent = fs.readFileSync(outputFilePath);
      console.log(`Translated content size: ${translatedContent.length} bytes`);

      const inputStats = fs.statSync(inputFilePath);
      const outputStats = fs.statSync(outputFilePath);
      console.log(
        `Original size: ${inputStats.size} bytes, Translated size: ${outputStats.size} bytes`
      );

      if (inputStats.size === outputStats.size) {
        console.warn(
          "WARNING: Input and output files are the same size. This might indicate no translation occurred."
        );
      }

      try {
        fs.unlinkSync(inputFilePath);
        fs.unlinkSync(outputFilePath);
        console.log("Temporary files cleaned up successfully");
      } catch (cleanupError) {
        console.error("Error cleaning up temp files:", cleanupError);
      }

      return new NextResponse(translatedContent, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="translated_${file.name}"`,
        },
      });
    } catch (error: any) {
      console.error("Translation error:", error);

      try {
        if (fs.existsSync(inputFilePath)) fs.unlinkSync(inputFilePath);
        if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
      } catch (cleanupError) {
        console.error("Error cleaning up temp files:", cleanupError);
      }

      if (error.documentHandle) {
        const handle = error.documentHandle;
        console.log(
          `Document ID: ${handle.documentId}, Document key: ${handle.documentKey}`
        );

        return NextResponse.json(
          {
            success: false,
            message: "Document processing error",
            documentId: handle.documentId,
            documentKey: handle.documentKey,
          },
          { status: 500 }
        );
      }

      throw error;
    }
  } catch (error: any) {
    console.error("Error in API route:", error);

    try {
      if (inputFilePath && fs.existsSync(inputFilePath))
        fs.unlinkSync(inputFilePath);
      if (outputFilePath && fs.existsSync(outputFilePath))
        fs.unlinkSync(outputFilePath);
    } catch (cleanupError) {
      console.error("Final cleanup error:", cleanupError);
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Translation failed",
        details:
          typeof error === "object"
            ? JSON.stringify(error, Object.getOwnPropertyNames(error))
            : String(error),
      },
      { status: 500 }
    );
  }
}
