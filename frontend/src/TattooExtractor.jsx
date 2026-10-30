import { useEffect, useRef, useState } from "react";

import { removeTattooBackground } from "./services/backgroundRemoval";
import { removeBackgroundWithApi } from "./services/cloudRemoval";

import "./TattooExtractor.css";

const STORAGE_KEY = "tattooyar.cloud-settings.v2";

const PROVIDERS = [
  { value: "gemini", label: "Google Gemini" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom", label: "سرویس سفارشی / Endpoint اختصاصی" },
];

function readSavedSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function cropImage(file, selection) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");

        const x = Math.round(selection.x * image.naturalWidth);
        const y = Math.round(selection.y * image.naturalHeight);

        const width = Math.round(
          selection.width * image.naturalWidth
        );

        const height = Math.round(
          selection.height * image.naturalHeight
        );

        if (width < 2 || height < 2) {
          throw new Error("کادر انتخاب‌شده خیلی کوچک است.");
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("ساخت بوم تصویر ناموفق بود.");
        }

        context.drawImage(
          image,
          x,
          y,
          width,
          height,
          0,
          0,
          width,
          height
        );

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);

            if (!blob) {
              reject(
                new Error("ساخت تصویر برش‌خورده ناموفق بود.")
              );
              return;
            }

            resolve(
              new File([blob], "tattoo-crop.png", {
                type: "image/png",
              })
            );
          },
          "image/png"
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("خواندن تصویر ناموفق بود."));
    };

    image.src = objectUrl;
  });
}

function getStatusLabel(state) {
  switch (state) {
    case "processing":
      return "در حال پردازش";

    case "done":
      return "پردازش‌شده";

    case "error":
      return "خطا در پردازش";

    default:
      return "پردازش‌نشده";
  }
}

export default function TattooExtractor({ onUseDesign }) {
  const saved = useRef(readSavedSettings()).current;

  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const [manualCrop, setManualCrop] = useState(false);
  const [selection, setSelection] = useState(null);
  const [dragging, setDragging] = useState(false);

  const pointerStart = useRef(null);

  const [showHelp, setShowHelp] = useState(false);
  const [showApi, setShowApi] = useState(false);

  const [provider, setProvider] = useState(
    saved.provider || "gemini"
  );

  const [endpoint, setEndpoint] = useState(
    saved.endpoint || ""
  );

  const [apiKey, setApiKey] = useState("");
  const [rememberSettings, setRememberSettings] = useState(false);

  const [mode, setMode] = useState("local");
  const [busy, setBusy] = useState(false);

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const activeItem =
    items.find((item) => item.id === activeId) || null;

  const pendingCount = items.filter(
    (item) => item.state !== "done" && item.state !== "processing"
  ).length;

  const processedCount = items.filter(
    (item) => item.state === "done"
  ).length;

  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateItem(id, updates) {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, ...updates }
          : item
      )
    );
  }

  function addFiles(fileList) {
    if (busy) return;

    const incoming = Array.from(fileList || []);
    const accepted = [];
    const rejected = [];

    incoming.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        rejected.push(`${file.name}: فایل تصویری نیست`);
      } else if (file.size > 15 * 1024 * 1024) {
        rejected.push(`${file.name}: بیشتر از ۱۵ مگابایت`);
      } else {
        accepted.push({
          id: makeId(),
          file,
          name: file.name,
          url: URL.createObjectURL(file),

          resultBlob: null,
          resultUrl: "",

          state: "pending",
          error: "",
          progress: "",
        });
      }
    });

    if (accepted.length) {
      setItems((previous) => [...previous, ...accepted]);

      setActiveId((current) => current || accepted[0].id);

      setSelection(null);
      setError("");

      setStatus(`${accepted.length} تصویر به فهرست اضافه شد.`);
    }

    if (rejected.length) {
      setError(rejected.join("؛ "));
    }
  }

  function removeItem(id) {
    if (busy) return;

    const item = items.find((entry) => entry.id === id);

    if (item?.url) URL.revokeObjectURL(item.url);
    if (item?.resultUrl) URL.revokeObjectURL(item.resultUrl);

    const remaining = items.filter(
      (entry) => entry.id !== id
    );

    setItems(remaining);

    if (activeId === id) {
      setActiveId(remaining[0]?.id || null);
    }

    setSelection(null);
  }

  function getPoint(event) {
    const rect = event.currentTarget.getBoundingClientRect();

    return {
      x: Math.min(
        1,
        Math.max(0, (event.clientX - rect.left) / rect.width)
      ),
      y: Math.min(
        1,
        Math.max(0, (event.clientY - rect.top) / rect.height)
      ),
    };
  }

  function handlePointerDown(event) {
    if (busy || !manualCrop || !activeItem) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const point = getPoint(event);

    pointerStart.current = point;

    setSelection({
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
    });

    setDragging(true);
  }

  function handlePointerMove(event) {
    if (busy || !dragging || !pointerStart.current) return;

    const point = getPoint(event);
    const start = pointerStart.current;

    setSelection({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
    });
  }

  function handlePointerUp() {
    if (!dragging) return;

    setDragging(false);
    pointerStart.current = null;

    setSelection((current) =>
      !current ||
        current.width < 0.02 ||
        current.height < 0.02
        ? null
        : current
    );
  }

  async function processItem(item, useCurrentSelection = false) {
    let inputFile = item.file;

    if (useCurrentSelection && manualCrop) {
      if (!selection) {
        throw new Error("ابتدا کادر طرح را روی تصویر بکش.");
      }

      inputFile = await cropImage(item.file, selection);
    }

    if (mode === "api") {
      if (provider !== "custom") {
        throw new Error(
          "این گزینه فعلاً فقط برای آزمایش رابط کاربری است. اتصال واقعی Gemini و OpenRouter هنوز پیاده‌سازی نشده است."
        );
      }

      if (!endpoint.trim()) {
        throw new Error("برای سرویس سفارشی، Endpoint را وارد کن.");
      }

      return removeBackgroundWithApi({
        file: inputFile,
        endpoint,
        apiKey,
        onProgress: (progress) => {
          if (progress?.key === "upload") {
            setStatus(`در حال ارسال ${item.name}…`);
            updateItem(item.id, {
              progress: "در حال ارسال تصویر به API…",
            });
          }
        },
      });
    }

    return removeTattooBackground(inputFile, (progress) => {
      if (progress?.key) {
        const current =
          typeof progress.current === "number"
            ? progress.current
            : null;

        const total =
          typeof progress.total === "number"
            ? progress.total
            : null;

        const percentage =
          current !== null && total
            ? Math.round((current / total) * 100)
            : null;

        const progressText =
          percentage !== null
            ? `${progress.key} — ${percentage}%`
            : progress.key;

        updateItem(item.id, {
          progress: progressText,
        });

        setStatus(`پردازش ${item.name}: ${progressText}`);
      }
    });
  }

  function validateOutput(blob) {
    if (!(blob instanceof Blob) || !blob.type.includes("image")) {
      throw new Error("خروجی سرویس، تصویر معتبر نیست.");
    }

    if (!blob.size) {
      throw new Error("فایل خروجی خالی است.");
    }
  }

  function saveProcessedResult(id, blob) {
    validateOutput(blob);

    const resultUrl = URL.createObjectURL(blob);

    setItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item;

        if (item.resultUrl) {
          URL.revokeObjectURL(item.resultUrl);
        }

        return {
          ...item,
          resultBlob: blob,
          resultUrl,
          state: "done",
          error: "",
          progress: "",
        };
      })
    );
  }

  async function processActive() {
    if (!activeItem || busy || activeItem.state === "done") return;

    setBusy(true);
    setError("");

    updateItem(activeItem.id, {
      state: "processing",
      error: "",
      progress: "در حال آماده‌سازی…",
    });

    setStatus(`در حال پردازش ${activeItem.name}…`);

    try {
      const blob = await processItem(activeItem, true);

      saveProcessedResult(activeItem.id, blob);

      setStatus(`پردازش ${activeItem.name} تمام شد.`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "پردازش ناموفق بود.";

      updateItem(activeItem.id, {
        state: "error",
        error: message,
        progress: "",
      });

      setError(message);
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function processAll() {
    if (busy || !items.length) return;

    if (manualCrop) {
      setError(
        "برای پردازش همه تصاویر، انتخاب دستی کادر را خاموش کن؛ کادر فعلی فقط برای یک تصویر است."
      );
      return;
    }

    // تصاویر موفق قبلی از لیست پردازش حذف می‌شوند.
    const queue = items.filter(
      (item) => item.state !== "done"
    );

    if (!queue.length) {
      setStatus("همه تصاویر قبلاً پردازش شده‌اند.");
      return;
    }

    setBusy(true);
    setError("");

    let successCount = 0;
    let failedCount = 0;

    for (let index = 0; index < queue.length; index += 1) {
      const item = queue[index];

      setStatus(
        `در حال پردازش ${item.name} (${index + 1} از ${queue.length})…`
      );

      updateItem(item.id, {
        state: "processing",
        error: "",
        progress: "در حال آماده‌سازی…",
      });

      try {
        const blob = await processItem(item, false);

        saveProcessedResult(item.id, blob);

        successCount += 1;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "پردازش ناموفق بود.";

        updateItem(item.id, {
          state: "error",
          error: message,
          progress: "",
        });

        failedCount += 1;
      }
    }

    setBusy(false);

    setStatus(
      `پردازش دسته‌ای تمام شد: ${successCount} موفق، ${failedCount} ناموفق.`
    );
  }

  function addItemToStudio(item) {
    if (!item || busy) return;

    // اگر خروجی وجود داشته باشد، خروجی پردازش‌شده استفاده می‌شود.
    // در غیر این صورت فایل اصلی وارد استودیو خواهد شد.
    const sourceBlob = item.resultBlob || item.file;

    const outputFile = new File(
      [sourceBlob],
      `tattooyar-${item.name.replace(/\.[^.]+$/, "")}.${item.resultBlob ? "png" : item.file.name.split(".").pop() || "png"
      }`,
      {
        type: sourceBlob.type || "image/png",
      }
    );

    onUseDesign?.(outputFile);

    setStatus(
      item.resultBlob
        ? `طرح پردازش‌شده «${item.name}» به استودیو اضافه شد.`
        : `تصویر اصلی «${item.name}» بدون پردازش به استودیو اضافه شد.`
    );
  }

  function addAllResultsToApp() {
    if (busy) return;

    if (!items.length) {
      setError("هیچ تصویری برای افزودن وجود ندارد.");
      return;
    }

    items.forEach((item) => {
      const sourceBlob = item.resultBlob || item.file;

      const outputFile = new File(
        [sourceBlob],
        `tattooyar-${item.name.replace(/\.[^.]+$/, "")}.${item.resultBlob ? "png" : item.file.name.split(".").pop() || "png"
        }`,
        {
          type: sourceBlob.type || "image/png",
        }
      );

      onUseDesign?.(outputFile);
    });

    setStatus(`${items.length} تصویر به استودیو اضافه شد.`);
  }

  function downloadResult(item) {
    if (!item?.resultUrl || busy) return;

    const link = document.createElement("a");

    link.href = item.resultUrl;
    link.download =
      `tattooyar-${item.name.replace(/\.[^.]+$/, "")}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function saveSettings() {
    if (busy) return;

    try {
      if (rememberSettings) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ provider, endpoint })
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }

      setStatus(
        rememberSettings
          ? "نام سرویس و Endpoint ذخیره شد. کلید API عمداً ذخیره نمی‌شود."
          : "تنظیمات ذخیره‌شده حذف شد."
      );

      setError("");
    } catch {
      setError("ذخیره تنظیمات ممکن نیست.");
    }
  }

  return (
    <section
      className={`tattoo-tool ${busy ? "is-busy" : ""}`}
      dir="rtl"
      aria-busy={busy}
    >
      <header className="tattoo-header">
        <div>
          <span className="tattoo-eyebrow">
            TATTOOYAR STUDIO
          </span>

          <h1>آماده‌سازی طرح تتو</h1>

          <p>
            چند تصویر اضافه کن، پس‌زمینه را حذف کن و طرح‌ها را وارد اپ کن.
          </p>
        </div>

        <button
          className="tattoo-icon-button"
          type="button"
          aria-label="راهنما"
          disabled={busy}
          onClick={() => setShowHelp((value) => !value)}
        >
          ?
        </button>
      </header>

      {showHelp && (
        <section className="tattoo-help">
          <strong>راهنمای سریع</strong>

          <ul>
            <li>
              می‌توانی چند تصویر را هم‌زمان انتخاب یا به کادر بکشی.
            </li>
            <li>
              برای پردازش دسته‌ای، انتخاب دستی کادر را خاموش کن.
            </li>
            <li>
              تصاویر پردازش‌شده دوباره در پردازش دسته‌ای پردازش نمی‌شوند.
            </li>
            <li>
              می‌توانی تصویر اصلی یا نسخه پردازش‌شده را به استودیو اضافه کنی.
            </li>
          </ul>
        </section>
      )}

      {/* بخش افزودن تصاویر */}
      <section className="tattoo-card">
        <div className="tattoo-section-heading">
          <div>
            <h2>۱. افزودن تصاویر</h2>
            <p>PNG، JPG یا WebP؛ هر فایل حداکثر ۱۵ مگابایت</p>
          </div>

          <span className="tattoo-count">
            {items.length} تصویر
          </span>
        </div>

        <label
          className={`tattoo-upload ${dragOver ? "is-dragover" : ""
            }`}
          onDragOver={(event) => {
            if (busy) return;
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            if (busy) return;
            event.preventDefault();
            setDragOver(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/*"
            disabled={busy}
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />

          <span className="tattoo-upload-symbol">＋</span>

          <strong>
            چند تصویر را انتخاب کن یا اینجا رها کن
          </strong>

          <span>
            انتخاب چند فایل با Ctrl یا Shift هم امکان‌پذیر است.
          </span>
        </label>

        {items.length > 0 && (
          <div className="tattoo-file-list">
            {items.map((item) => (
              <div
                key={item.id}
                className={`tattoo-file-row ${activeId === item.id ? "active" : ""
                  }`}
              >
                <button
                  type="button"
                  className="tattoo-file-select"
                  disabled={busy}
                  onClick={() => {
                    setActiveId(item.id);
                    setSelection(null);
                  }}
                >
                  <img
                    src={item.resultUrl || item.url}
                    alt=""
                  />

                  <span>
                    <strong>{item.name}</strong>

                    <small className={`status-${item.state}`}>
                      {getStatusLabel(item.state)}
                    </small>
                  </span>
                </button>

                <button
                  type="button"
                  className="tattoo-remove-file"
                  disabled={busy}
                  onClick={() => removeItem(item.id)}
                  aria-label={`حذف ${item.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {activeItem && (
          <>
            <div className="tattoo-active-title">
              <strong>تصویر انتخاب‌شده:</strong>{" "}
              {activeItem.name}
            </div>

            <label className="tattoo-checkbox-row">
              <input
                type="checkbox"
                checked={manualCrop}
                disabled={busy}
                onChange={(event) => {
                  setManualCrop(event.target.checked);
                  setSelection(null);
                  setError("");
                }}
              />

              <span>
                <strong>انتخاب دستی کادر</strong>

                <small>
                  کادر را روی تصویر بکش. برای پردازش همه تصاویر،
                  این گزینه را خاموش کن.
                </small>
              </span>
            </label>

            {manualCrop && (
              <p className="tattoo-instruction">
                با ماوس یا انگشت محدوده طرح را مشخص کن.
              </p>
            )}

            <div
              className={`tattoo-image-stage ${manualCrop ? "is-croppable" : ""
                }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <img
                src={activeItem.url}
                alt="تصویر اصلی طرح تتو"
                draggable="false"
              />

              {manualCrop && selection && (
                <div
                  className="tattoo-selection"
                  style={{
                    left: `${selection.x * 100}%`,
                    top: `${selection.y * 100}%`,
                    width: `${selection.width * 100}%`,
                    height: `${selection.height * 100}%`,
                  }}
                />
              )}
            </div>
          </>
        )}
      </section>

      {/* بخش روش پردازش */}
      <section className="tattoo-card">
        <div className="tattoo-section-heading">
          <div>
            <h2>۲. روش پردازش</h2>
            <p>پردازش محلی برای تست آماده است.</p>
          </div>
        </div>

        <div className="tattoo-mode-options">
          <label className={mode === "local" ? "selected" : ""}>
            <input
              type="radio"
              name="tattoo-mode"
              checked={mode === "local"}
              disabled={busy}
              onChange={() => setMode("local")}
            />

            <span>
              <strong>محلی</strong>
              <small>بدون API key؛ روی دستگاه</small>
            </span>
          </label>

          <label className={mode === "api" ? "selected" : ""}>
            <input
              type="radio"
              name="tattoo-mode"
              checked={mode === "api"}
              disabled={busy}
              onChange={() => {
                setMode("api");
                setShowApi(true);
              }}
            />

            <span>
              <strong>سرویس API</strong>
              <small>انتخاب سرویس برای نمونه اولیه</small>
            </span>
          </label>
        </div>

        {mode === "api" && (
          <div className="tattoo-api-panel">
            <label>
              سرویس

              <select
                value={provider}
                disabled={busy}
                onChange={(event) =>
                  setProvider(event.target.value)
                }
              >
                {PROVIDERS.map((entry) => (
                  <option
                    key={entry.value}
                    value={entry.value}
                  >
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              API Key

              <input
                type="password"
                value={apiKey}
                disabled={busy}
                onChange={(event) =>
                  setApiKey(event.target.value)
                }
                placeholder="برای تست رابط وارد کن؛ ذخیره نمی‌شود"
                autoComplete="off"
              />
            </label>

            {provider === "custom" && (
              <label>
                Endpoint سفارشی

                <input
                  type="url"
                  value={endpoint}
                  disabled={busy}
                  onChange={(event) =>
                    setEndpoint(event.target.value)
                  }
                  placeholder="https://your-service.example/remove-background"
                  dir="ltr"
                />
              </label>
            )}

            {provider !== "custom" && (
              <p className="tattoo-api-notice">
                حالت نمایشی: انتخاب {PROVIDERS.find(
                  (entry) => entry.value === provider
                )?.label} فعلاً فقط برای تست رابط است؛
                درخواست واقعی ارسال نمی‌شود تا آداپتور همان سرویس
                جداگانه پیاده‌سازی شود.
              </p>
            )}

            <label className="tattoo-checkbox-row compact">
              <input
                type="checkbox"
                checked={rememberSettings}
                disabled={busy}
                onChange={(event) =>
                  setRememberSettings(event.target.checked)
                }
              />

              <span>
                <strong>ذخیره نام سرویس و Endpoint</strong>
                <small>کلید API ذخیره نمی‌شود.</small>
              </span>
            </label>

            <button
              type="button"
              className="tattoo-secondary-button"
              disabled={busy}
              onClick={saveSettings}
            >
              ذخیره تنظیمات
            </button>
          </div>
        )}

        <div className="tattoo-actions">
          <button
            type="button"
            className="tattoo-primary-button"
            disabled={
              !activeItem ||
              busy ||
              activeItem.state === "done"
            }
            onClick={processActive}
          >
            {busy
              ? "در حال پردازش…"
              : activeItem?.state === "done"
                ? "این تصویر پردازش شده است"
                : "پردازش تصویر انتخاب‌شده"}
          </button>

          <button
            type="button"
            className="tattoo-secondary-button"
            disabled={!pendingCount || busy}
            onClick={processAll}
          >
            پردازش تصاویر باقی‌مانده ({pendingCount})
          </button>
        </div>

        {busy && (
          <p className="tattoo-status" aria-live="polite">
            پردازش در حال انجام است؛ لطفاً تا پایان آن صبر کن.
          </p>
        )}

        {status && (
          <p className="tattoo-status" aria-live="polite">
            {status}
          </p>
        )}

        {error && (
          <p className="tattoo-error" role="alert">
            {error}
          </p>
        )}
      </section>

      {/* بخش نتایج: تمام تصاویر، چه پردازش‌شده چه نشده */}
      {items.length > 0 && (
        <section className="tattoo-card tattoo-results-card">
          <div className="tattoo-section-heading">
            <div>
              <h2>۳. نتایج تصاویر</h2>
              <p>
                می‌توانی تصویر اصلی یا نسخه پردازش‌شده را به استودیو اضافه کنی.
              </p>
            </div>
          </div>

          <div className="tattoo-result-summary">
            <span>
              کل تصاویر: <strong>{items.length}</strong>
            </span>

            <span>
              پردازش‌شده: <strong>{processedCount}</strong>
            </span>

            <span>
              باقی‌مانده: <strong>{pendingCount}</strong>
            </span>
          </div>

          <div className="tattoo-result-grid">
            {items.map((item) => {
              const isProcessing = item.state === "processing";
              const isDone = item.state === "done";
              const isError = item.state === "error";

              const previewUrl =
                isDone && item.resultUrl
                  ? item.resultUrl
                  : item.url;

              return (
                <article
                  className={`tattoo-result-card ${isProcessing ? "is-processing" : ""
                    }`}
                  key={item.id}
                >
                  <div className="tattoo-result-preview">
                    <img
                      src={previewUrl}
                      alt={
                        isDone
                          ? `نتیجه پردازش ${item.name}`
                          : `تصویر اصلی ${item.name}`
                      }
                    />

                    {isProcessing && (
                      <div className="tattoo-processing-overlay">
                        <span className="tattoo-progress-ring" />

                        <strong>در حال پردازش</strong>

                        <small>
                          {item.progress || "لطفاً صبر کن…"}
                        </small>
                      </div>
                    )}
                  </div>

                  <p
                    className="tattoo-result-name"
                    title={item.name}
                  >
                    {item.name}
                  </p>

                  <span
                    className={`tattoo-result-status ${isDone
                      ? "done"
                      : isError
                        ? "error"
                        : isProcessing
                          ? "processing"
                          : "pending"
                      }`}
                  >
                    {getStatusLabel(item.state)}
                  </span>

                  {isError && (
                    <p className="tattoo-result-error">
                      {item.error}
                    </p>
                  )}

                  {isDone && (
                    <button
                      type="button"
                      className="tattoo-secondary-button"
                      disabled={busy}
                      onClick={() => downloadResult(item)}
                    >
                      دانلود PNG
                    </button>
                  )}

                  <button
                    type="button"
                    className="tattoo-primary-button"
                    disabled={busy || isProcessing}
                    onClick={() => addItemToStudio(item)}
                  >
                    {isDone
                      ? "افزودن به استودیو"
                      : "افزودن به استودیو"}
                  </button>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className="tattoo-primary-button tattoo-add-all"
            disabled={busy}
            onClick={addAllResultsToApp}
          >
            افزودن همه تصاویر به استودیو ({items.length})
          </button>
        </section>
      )}
    </section>
  );
}