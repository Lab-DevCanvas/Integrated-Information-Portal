"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { resizeImageToDataUrl } from "@/lib/avatar";
import { Avatar } from "./Avatar";

interface Props {
  value?: string;
  onChange: (dataUrl: string) => void;
  size?: "sm" | "md" | "lg";
}

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export function AvatarUpload({ value, onChange, size = "lg" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있어요.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("8MB 이하의 이미지를 사용해주세요.");
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file, 256);
      onChange(dataUrl);
    } catch {
      setError("이미지를 처리하지 못했어요. 다른 파일로 시도해주세요.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar src={value} size={size} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="프로필 이미지 변경"
          className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-indigo-600 shadow ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-indigo-400 dark:ring-slate-700 dark:hover:bg-slate-700"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="max-w-[10rem] text-center text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
