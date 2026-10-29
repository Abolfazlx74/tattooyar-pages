export async function removeBackgroundWithApi({
    file,
    endpoint,
    apiKey,
    onProgress,
  }) {
    if (!endpoint.trim()) {
      throw new Error("آدرس API را وارد کنید.");
    }
  
    if (!apiKey.trim()) {
      throw new Error("کلید API را وارد کنید.");
    }
  
    const url = new URL(endpoint);
  
    if (!["https:", "http:"].includes(url.protocol)) {
      throw new Error("آدرس API معتبر نیست.");
    }
  
    if (
      url.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(url.hostname)
    ) {
      throw new Error("برای API راه دور باید از HTTPS استفاده کنید.");
    }
  
    const formData = new FormData();
    formData.append("image", file, file.name || "tattoo.png");
  
    onProgress?.({ key: "upload", current: 0, total: 1 });
  
    const response = await fetch(url.href, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/png",
      },
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error(`خطای API: HTTP ${response.status}`);
    }
  
    const contentType = response.headers.get("content-type") || "";
  
    if (!contentType.includes("image/")) {
      throw new Error(
        "API تصویر برنگرداند. قرارداد پاسخ سرویس را بررسی کنید."
      );
    }
  
    const blob = await response.blob();
  
    if (!blob.size) {
      throw new Error("API فایل خالی برگرداند.");
    }
  
    onProgress?.({ key: "complete", current: 1, total: 1 });
  
    return blob;
  }