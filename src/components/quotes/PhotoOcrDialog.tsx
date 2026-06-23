import { Check, RotateCcw, ScanText, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PhotoOcrDialogProps {
  open: boolean;
  file: File | null;
  onOpenChange: (open: boolean) => void;
  onTextExtracted: (text: string) => void;
}

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DragMode = "move" | "nw" | "ne" | "sw" | "se";

interface DragState {
  mode: DragMode;
  pointerId: number;
  startX: number;
  startY: number;
  startCrop: CropRect;
}

interface OcrProgress {
  status: string;
  progress: number;
}

interface OcrWorkerCache {
  lang: string;
  worker: Tesseract.Worker;
}

const INITIAL_CROP: CropRect = {
  x: 8,
  y: 18,
  width: 84,
  height: 46
};

const MIN_CROP_SIZE = 12;
const OCR_LANGUAGE = "tur";
const OCR_MAX_WIDTH = 2200;
const OCR_CONTRAST = 1.65;
const OCR_MIN_THRESHOLD = 120;
const OCR_MAX_THRESHOLD = 210;
const SHARPEN_KERNEL = [0, -1, 0, -1, 5, -1, 0, -1, 0];

let cachedWorker: OcrWorkerCache | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function createImage(url: string) {
  const image = new Image();
  image.decoding = "async";
  image.src = url;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Image could not be loaded."));
  });

  return image;
}

function applyContrast(value: number) {
  return clamp((value - 128) * OCR_CONTRAST + 128, 0, 255);
}

function getOtsuThreshold(histogram: number[], total: number) {
  const sum = histogram.reduce((accumulator, count, value) => accumulator + value * count, 0);
  let sumBackground = 0;
  let weightBackground = 0;
  let bestVariance = 0;
  let threshold = 160;

  for (let value = 0; value < histogram.length; value += 1) {
    weightBackground += histogram[value];
    if (weightBackground === 0) continue;

    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += value * histogram[value];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const betweenVariance =
      weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;

    if (betweenVariance > bestVariance) {
      bestVariance = betweenVariance;
      threshold = value;
    }
  }

  return clamp(threshold, OCR_MIN_THRESHOLD, OCR_MAX_THRESHOLD);
}

function applySharpen(imageData: ImageData) {
  const { width, height, data } = imageData;
  const source = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let value = 0;

      for (let kernelY = -1; kernelY <= 1; kernelY += 1) {
        for (let kernelX = -1; kernelX <= 1; kernelX += 1) {
          const pixelIndex = ((y + kernelY) * width + x + kernelX) * 4;
          const kernelIndex = (kernelY + 1) * 3 + kernelX + 1;
          value += source[pixelIndex] * SHARPEN_KERNEL[kernelIndex];
        }
      }

      const outputIndex = (y * width + x) * 4;
      const sharpened = clamp(value, 0, 255);
      data[outputIndex] = sharpened;
      data[outputIndex + 1] = sharpened;
      data[outputIndex + 2] = sharpened;
      data[outputIndex + 3] = 255;
    }
  }
}

function preprocessForOcr(context: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  const histogram = new Array<number>(256).fill(0);
  let pixelCount = 0;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const contrasted = applyContrast(gray);
    histogram[Math.round(contrasted)] += 1;
    pixelCount += 1;
  }

  const threshold = getOtsuThreshold(histogram, pixelCount);

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const contrasted = applyContrast(gray);
    const thresholded = contrasted < threshold ? 0 : 255;

    data[index] = thresholded;
    data[index + 1] = thresholded;
    data[index + 2] = thresholded;
    data[index + 3] = 255;
  }

  applySharpen(imageData);
  context.putImageData(imageData, 0, 0);
}

async function prepareImageForOcr(imageUrl: string, crop: CropRect) {
  const image = await createImage(imageUrl);
  const sourceX = Math.round((crop.x / 100) * image.naturalWidth);
  const sourceY = Math.round((crop.y / 100) * image.naturalHeight);
  const sourceWidth = Math.round((crop.width / 100) * image.naturalWidth);
  const sourceHeight = Math.round((crop.height / 100) * image.naturalHeight);
  const scale = clamp(OCR_MAX_WIDTH / sourceWidth, 1.5, 3);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image processing is not supported in this browser.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );
  preprocessForOcr(context, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Cropped image could not be prepared."));
      },
      "image/png",
      1
    );
  });
}

async function getOcrWorker(onProgress: (progress: OcrProgress) => void) {
  if (cachedWorker?.lang === OCR_LANGUAGE) {
    return cachedWorker.worker;
  }

  await cachedWorker?.worker.terminate();
  cachedWorker = null;

  const worker = await Tesseract.createWorker(OCR_LANGUAGE, 1, {
    logger: (message) => {
      onProgress({
        status: message.status,
        progress: message.progress
      });
    }
  });

  await worker.setParameters({
    preserve_interword_spaces: "1",
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    user_defined_dpi: "300"
  });

  cachedWorker = {
    lang: OCR_LANGUAGE,
    worker
  };

  return worker;
}

function getProgressLabel(progress: OcrProgress | null) {
  if (!progress) return "Preparing OCR...";

  const label = progress.status.replace(/_/g, " ");
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function getProgressPercent(progress: OcrProgress | null) {
  if (!progress) return 4;
  return clamp(Math.round(progress.progress * 100), 4, 100);
}

export function PhotoOcrDialog({
  open,
  file,
  onOpenChange,
  onTextExtracted
}: PhotoOcrDialogProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const cancelledRef = useRef(false);
  const [crop, setCrop] = useState<CropRect>(INITIAL_CROP);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<OcrProgress | null>(null);

  const imageUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!open) {
      setCrop(INITIAL_CROP);
      setBusy(false);
      setProgress(null);
      dragRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  function startDrag(event: React.PointerEvent<HTMLButtonElement | HTMLDivElement>, mode: DragMode) {
    if (busy || !frameRef.current) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: crop
    };
  }

  function updateDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame || drag.pointerId !== event.pointerId) return;

    const bounds = frame.getBoundingClientRect();
    const deltaX = ((event.clientX - drag.startX) / bounds.width) * 100;
    const deltaY = ((event.clientY - drag.startY) / bounds.height) * 100;
    const start = drag.startCrop;

    setCrop(() => {
      if (drag.mode === "move") {
        return {
          ...start,
          x: clamp(start.x + deltaX, 0, 100 - start.width),
          y: clamp(start.y + deltaY, 0, 100 - start.height)
        };
      }

      let left = start.x;
      let top = start.y;
      let right = start.x + start.width;
      let bottom = start.y + start.height;

      if (drag.mode.includes("w")) left = clamp(start.x + deltaX, 0, right - MIN_CROP_SIZE);
      if (drag.mode.includes("e")) right = clamp(start.x + start.width + deltaX, left + MIN_CROP_SIZE, 100);
      if (drag.mode.includes("n")) top = clamp(start.y + deltaY, 0, bottom - MIN_CROP_SIZE);
      if (drag.mode.includes("s")) bottom = clamp(start.y + start.height + deltaY, top + MIN_CROP_SIZE, 100);

      return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
      };
    });
  }

  function stopDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
  }

  async function handleExtractText() {
    if (!imageUrl) return;

    setBusy(true);
    setProgress(null);
    cancelledRef.current = false;

    try {
      const preparedImage = await prepareImageForOcr(imageUrl, crop);
      if (cancelledRef.current) return;

      const worker = await getOcrWorker(setProgress);
      if (cancelledRef.current) return;

      const result = await worker.recognize(preparedImage);
      if (cancelledRef.current) return;

      const text = normalizeText(result.data.text);

      if (!text) {
        toast.error("No text was found. Try a sharper photo or a tighter crop.");
        return;
      }

      onTextExtracted(text);
      onOpenChange(false);
      toast.success("Text extracted. Review it before saving.");
    } catch (error) {
      if (!cancelledRef.current) {
        toast.error(error instanceof Error ? error.message : "Text could not be extracted.");
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function handleCancelOcr() {
    cancelledRef.current = true;
    await cachedWorker?.worker.terminate();
    cachedWorker = null;
    setBusy(false);
    setProgress(null);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !busy && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[94vh] overflow-y-auto p-4 sm:max-w-3xl sm:p-6">
        <DialogHeader>
          <DialogTitle>Add from photo</DialogTitle>
          <DialogDescription>Crop the quote area, then extract text locally in this browser.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-md border bg-muted p-2 text-center">
            {imageUrl ? (
              <div
                ref={frameRef}
                className={cn(
                  "relative mx-auto inline-block max-h-[58vh] max-w-full touch-none select-none overflow-hidden rounded-md bg-black",
                  busy && "opacity-70"
                )}
                onPointerMove={updateDrag}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
              >
                <img
                  src={imageUrl}
                  alt=""
                  className="block max-h-[58vh] max-w-full object-contain"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-black/35" />
                <div
                  className="absolute cursor-move border-2 border-white bg-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.2)]"
                  style={{
                    left: `${crop.x}%`,
                    top: `${crop.y}%`,
                    width: `${crop.width}%`,
                    height: `${crop.height}%`
                  }}
                  onPointerDown={(event) => startDrag(event, "move")}
                >
                  {(["nw", "ne", "sw", "se"] as const).map((handle) => (
                    <button
                      key={handle}
                      type="button"
                      aria-label={`Resize ${handle}`}
                      className={cn(
                        "absolute h-7 w-7 rounded-full border-2 border-white bg-primary shadow-soft",
                        handle === "nw" && "-left-4 -top-4 cursor-nwse-resize",
                        handle === "ne" && "-right-4 -top-4 cursor-nesw-resize",
                        handle === "sw" && "-bottom-4 -left-4 cursor-nesw-resize",
                        handle === "se" && "-bottom-4 -right-4 cursor-nwse-resize"
                      )}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        startDrag(event, handle);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">
                No photo selected.
              </div>
            )}
          </div>

          {busy && (
            <div className="rounded-md border bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">{getProgressLabel(progress)}</span>
                <span className="text-muted-foreground">{getProgressPercent(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${getProgressPercent(progress)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {busy ? (
            <Button type="button" variant="outline" onClick={handleCancelOcr}>
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel OCR
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setCrop(INITIAL_CROP)}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset crop
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" aria-hidden="true" />
                Close
              </Button>
              <Button type="button" onClick={handleExtractText} disabled={!imageUrl}>
                <ScanText className="h-4 w-4" aria-hidden="true" />
                Extract text
              </Button>
            </>
          )}
        </DialogFooter>
        {!busy && (
          <div className="flex items-start gap-2 rounded-md bg-accent p-3 text-xs leading-5 text-accent-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Images stay on this device. Extracted text opens in the quote form before saving.</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
