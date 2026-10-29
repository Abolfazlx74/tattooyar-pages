import { removeBackground } from "@imgly/background-removal";

export async function removeTattooBackground(file, onProgress) {
  if (!(file instanceof Blob) || !file.type.startsWith("image/")) {
    throw new Error("یک فایل تصویر معتبر انتخاب کنید.");
  }

  const output = await removeBackground(file, {
    model: "medium",
    output: {
      format: "image/png",
      quality: 1,
    },
    progress: (key, current, total) => {
      onProgress?.({ key, current, total });
    },
  });

  if (!(output instanceof Blob) || output.size === 0) {
    throw new Error("خروجی مدل خالی است.");
  }

  return output;
}