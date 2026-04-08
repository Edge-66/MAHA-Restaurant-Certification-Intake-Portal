'use client';

import { useCallback, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

async function cropToFile(imageSrc: string, crop: Area, sourceType: string, sourceName: string): Promise<File> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize canvas.');

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, sourceType.startsWith('image/') ? sourceType : 'image/jpeg', 0.95);
  });
  if (!blob) throw new Error('Could not crop image.');

  return new File([blob], sourceName, { type: blob.type });
}

export function useImageCropper() {
  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [fileType, setFileType] = useState('image/jpeg');
  const [fileName, setFileName] = useState('cropped-image.jpg');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(4 / 3);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const resolverRef = useRef<((file: File | null) => void) | null>(null);

  const requestCrop = useCallback(async (file: File, options?: { aspect?: number }): Promise<File | null> => {
    const src = URL.createObjectURL(file);
    setImageSrc(src);
    setFileType(file.type || 'image/jpeg');
    setFileName(file.name || 'cropped-image.jpg');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspect(options?.aspect ?? 4 / 3);
    setOpen(true);
    return await new Promise<File | null>((resolve) => {
      resolverRef.current = (result) => {
        URL.revokeObjectURL(src);
        resolve(result);
      };
    });
  }, []);

  const closeWith = useCallback((file: File | null) => {
    setOpen(false);
    const resolver = resolverRef.current;
    resolverRef.current = null;
    resolver?.(file);
  }, []);

  const onConfirm = useCallback(async () => {
    if (!croppedPixels) {
      closeWith(null);
      return;
    }
    try {
      const cropped = await cropToFile(imageSrc, croppedPixels, fileType, fileName);
      closeWith(cropped);
    } catch {
      closeWith(null);
    }
  }, [closeWith, croppedPixels, fileName, fileType, imageSrc]);

  const modal = open ? (
    <div className="fixed inset-0 z-[90] bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl overflow-hidden">
        <div className="p-4 border-b border-stone-200">
          <h3 className="text-base font-semibold text-stone-900">Crop image</h3>
          <p className="text-xs text-stone-500 mt-1">Adjust and confirm before upload.</p>
        </div>

        <div className="relative h-[420px] bg-stone-950">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedAreaPixels) => setCroppedPixels(croppedAreaPixels)}
          />
        </div>

        <div className="p-4 border-t border-stone-200">
          <label className="block text-xs text-stone-600 mb-1">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch(imageSrc);
                  const blob = await res.blob();
                  const original = new File([blob], fileName, { type: fileType || blob.type });
                  closeWith(original);
                } catch {
                  closeWith(null);
                }
              }}
              className="px-3 py-2 rounded-lg text-sm border border-stone-300 hover:bg-stone-50"
            >
              Use original image
            </button>
            <button
              type="button"
              onClick={() => closeWith(null)}
              className="px-3 py-2 rounded-lg text-sm border border-stone-300 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void onConfirm()}
              className="px-3 py-2 rounded-lg text-sm bg-[#2d6a4f] text-white hover:bg-[#1b4332]"
            >
              Use cropped image
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return { requestCrop, cropperModal: modal };
}
