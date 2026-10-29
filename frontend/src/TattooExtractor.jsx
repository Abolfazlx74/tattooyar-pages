
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
              return reject(
                new Error("ساخت تصویر برش‌خورده ناموفق بود.")
              );
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

function makeId() {
  return `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
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

  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(fileList) {
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
        });
      }
    });

    if (accepted.length) {
      setItems((previous) => [...previous, ...accepted]);

      setActiveId(
        (current) => current || accepted[0].id
      );

      setSelection(null);
      setError("");
      setStatus(`${accepted.length} تصویر به فهرست اضافه شد.`);
    }

    if (rejected.length) {
      setError(rejected.join("؛ "));
    }
  }

  function removeItem(id) {
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
    if (!manualCrop || !activeItem) return;

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
    if (!dragging || !pointerStart.current) return;

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

  async function processItem(
    item,
    useCurrentSelection = false
  ) {
    let inputFile = item.file;

    if (useCurrentSelection && manualCrop) {
      if (!selection) {
        throw new Error(
          "ابتدا کادر طرح را روی تصویر بکش."
        );
      }

      inputFile = await cropImage(item.file, selection);
    }

    if (mode === "api") {
      if (provider !== "custom") {
        throw new Error(
          "این گزینه فعلاً فقط برای آزمایش رابط کاربری است. اتصال واقعی Gemini و OpenRouter در مرحله بعد اضافه می‌شود."
        );
      }

      if (!endpoint.trim()) {
        throw new Error(
          "برای سرویس سفارشی، Endpoint را وارد کن."
        );
      }

      return removeBackgroundWithApi({
        file: inputFile,
        endpoint,
        apiKey,
        onProgress: (progress) => {
          if (progress?.key === "upload") {
            setStatus(`در حال ارسال ${item.name}…`);
          }
        },
      });
    }

    return removeTattooBackground(inputFile, (progress) => {
      if (progress?.key) {
        setStatus(
          `پردازش ${item.name}: ${progress.key}`
        );
      }
    });
  }

  async function processActive() {
    if (!activeItem || busy) return;

    setBusy(true);
    setError("");
    setStatus(`در حال پردازش ${activeItem.name}…`);

    try {
      const blob = await processItem(activeItem, true);

      if (!(blob instanceof Blob) || !blob.type.includes("image")) {
        throw new Error("خروجی سرویس، تصویر معتبر نیست.");
      }

      const resultUrl = URL.createObjectURL(blob);

      setItems((previous) =>
        previous.map((item) =>
          item.id === activeItem.id
            ? {
                ...item,
                resultBlob: blob,
                resultUrl,
                state: "done",
                error: "",
              }
            : item
        )
      );

      setStatus(`پردازش ${activeItem.name} تمام شد.`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "پردازش ناموفق بود.";

      setError(message);

      setItems((previous) =>
        previous.map((item) =>
          item.id === activeItem.id
            ? {
                ...item,
                state: "error",
                error: message,
              }
            : item
        )
      );

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

    setBusy(true);
    setError("");

    let successCount = 0;

    for (const item of items) {
      setStatus(`در حال پردازش ${item.name}…`);

      try {
        const blob = await processItem(item, false);

        if (!(blob instanceof Blob) || !blob.type.includes("image")) {
          throw new Error("خروجی سرویس، تصویر معتبر نیست.");
        }

        const resultUrl = URL.createObjectURL(blob);

        setItems((previous) =>
          previous.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  resultBlob: blob,
                  resultUrl,
                  state: "done",
                  error: "",
                }
              : entry
          )
        );

        successCount += 1;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "پردازش ناموفق بود.";

        setItems((previous) =>
          previous.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  state: "error",
                  error: message,
                }
              : entry
          )
        );
      }
    }

    setBusy(false);

    setStatus(
      `پردازش دسته‌ای تمام شد: ${successCount} از ${items.length} تصویر موفق بود.`
    );
  }

  function addResultToApp(item) {
    if (!item?.resultBlob) return;

    const outputFile = new File(
      [item.resultBlob],
      `tattooyar-${item.name.replace(/\.[^.]+$/, "")}.png`,
      { type: "image/png" }
    );

    onUseDesign?.(outputFile);

    setStatus(`طرح «${item.name}» به اپ اضافه شد.`);
  }

  function addAllResultsToApp() {
    const ready = items.filter((item) => item.resultBlob);

    if (!ready.length) {
      setError(
        "هنوز هیچ تصویر پردازش‌شده‌ای برای افزودن وجود ندارد."
      );
      return;
    }

    ready.forEach(addResultToApp);

    setStatus(`${ready.length} طرح به اپ اضافه شد.`);
  }

  function downloadResult(item) {
    if (!item?.resultUrl) return;

    const link = document.createElement("a");

    link.href = item.resultUrl;
    link.download =
      `tattooyar-${item.name.replace(/\.[^.]+$/, "")}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function saveSettings() {
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
    <section className="tattoo-tool" dir="rtl">
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
          onClick={() => setShowHelp((v) => !v)}
        >
          ?
        </button>
      </header>

      {showHelp && (
        <section className="tattoo-help">
          <strong>راهنمای سریع</strong>

          <ul>
            <li>
              می‌توانی چند تصویر را هم‌زمان انتخاب یا به کادر بکشانی.
            </li>
            <li>
              برای پردازش دسته‌ای، انتخاب دستی کادر را خاموش کن.
            </li>
            <li>
              بعد از پردازش، یک طرح یا همه طرح‌های آماده را به اپ اضافه کن.
            </li>
          </ul>
        </section>
      )}

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
          className={`tattoo-upload${dragOver ? " is-dragover" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/*"
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
                className={`tattoo-file-row ${
                  activeId === item.id ? "active" : ""
                }`}
              >
                <button
                  type="button"
                  className="tattoo-file-select"
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

                    <small>
                      {item.state === "done"
                        ? "پردازش‌شده"
                        : item.state === "error"
                          ? "خطا در پردازش"
                          : "در انتظار پردازش"}
                    </small>
                  </span>
                </button>

                <button
                  type="button"
                  className="tattoo-remove-file"
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
              className={`tattoo-image-stage ${
                manualCrop ? "is-croppable" : ""
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
                حالت نمایشی: انتخاب{" "}
                {PROVIDERS.find(
                  (p) => p.value === provider
                )?.label}{" "}
                فعلاً فقط برای تست رابط است؛ درخواست واقعی ارسال
                نمی‌شود تا آداپتور همان سرویس جداگانه پیاده‌سازی شود.
              </p>
            )}

            <label className="tattoo-checkbox-row compact">
              <input
                type="checkbox"
                checked={rememberSettings}
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
            disabled={!activeItem || busy}
            onClick={processActive}
          >
            {busy
              ? "در حال پردازش…"
              : "پردازش تصویر انتخاب‌شده"}
          </button>

          <button
            type="button"
            className="tattoo-secondary-button"
            disabled={!items.length || busy}
            onClick={processAll}
          >
            پردازش همه تصاویر
          </button>
        </div>

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

      {items.some((item) => item.resultBlob) && (
        <section className="tattoo-card">
          <div className="tattoo-section-heading">
            <div>
              <h2>۳. نتایج</h2>
              <p>
                هر طرح آماده را جداگانه یا همه را با هم به اپ اضافه کن.
              </p>
            </div>
          </div>

          <div className="tattoo-result-grid">
            {items
              .filter((item) => item.resultBlob)
              .map((item) => (
                <article
                  className="tattoo-result-card"
                  key={item.id}
                >
                  <img
                    src={item.resultUrl}
                    alt={`نتیجه ${item.name}`}
                  />

                  <p title={item.name}>{item.name}</p>

                  <button
                    type="button"
                    className="tattoo-secondary-button"
                    onClick={() => downloadResult(item)}
                  >
                    دانلود PNG
                  </button>

                  <button
                    type="button"
                    className="tattoo-primary-button"
                    onClick={() => addResultToApp(item)}
                  >
                    افزودن به اپ
                  </button>
                </article>
              ))}
          </div>

          <button
            type="button"
            className="tattoo-primary-button tattoo-add-all"
            onClick={addAllResultsToApp}
          >
            افزودن همه طرح‌های آماده به اپ (
            {items.filter((item) => item.resultBlob).length})
          </button>
        </section>
      )}
    </section>
  );
}
