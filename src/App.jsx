import { useState, useEffect, useRef } from "react";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dtvjnpad3";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "future_pressure";

const DEMO_RELEASES = [
  {
    id: "rel_001",
    artist: "Industrial Romantico",
    title: "L.F.R. (ITG35)",
    label: "Italo Ghetto Records",
    date: "2026-03-15",
    genre: "Industrial / Minimal Techno",
    soundcloudUrl: "https://soundcloud.com/italoghetto",
    spotifyUrl: "",
    artworkUrl: "",
    tracks: [], // array di { name, url }
    pdfUrl: "",
    description: "Una release che attraversa territori industriali con anima groove. Quattro tracks di pressione pura.",
  }
];

const StarLogoV2 = ({ size = 40, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M52 2 L56 44 L95 36 L59 52 L80 92 L50 59 L21 98 L44 56 L6 65 L43 48 L19 11 L51 44 Z" fill={color} />
  </svg>
);

const iStyle = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#ffffff", fontFamily: "'DM Mono', monospace", fontSize: 11,
  padding: "10px 14px", width: "100%", outline: "none", letterSpacing: "0.04em", transition: "border-color 0.2s",
};
const focusStyle = (e) => e.target.style.borderColor = "rgba(255,255,255,0.4)";
const blurStyle  = (e) => e.target.style.borderColor = "rgba(255,255,255,0.1)";

const SectionLabel = ({ children }) => (
  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>{children}</div>
);

const AssetBadge = ({ label }) => (
  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.12)", padding: "2px 8px", letterSpacing: "0.18em", textTransform: "uppercase" }}>{label}</span>
);

const StarRating = ({ value, onChange, readonly = false }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {[1,2,3,4,5].map(n => (
      <button key={n} onClick={() => !readonly && onChange(n)} style={{
        background: "none", border: "none", cursor: readonly ? "default" : "pointer",
        padding: 0, fontSize: 22, lineHeight: 1,
        color: n <= value ? "#ffffff" : "rgba(255,255,255,0.18)",
        transition: "color 0.15s, transform 0.15s",
        transform: !readonly && n <= value ? "scale(1.2)" : "scale(1)",
      }}>★</button>
    ))}
  </div>
);

// ─── SINGLE TRACK PLAYER ──────────────────────────────────────────────────────
const TrackPlayer = ({ track, index, isPlaying, onPlay }) => {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setProgress(0); setCurrentTime(0);
    }
    if (isPlaying && audioRef.current) {
      audioRef.current.play();
    }
  }, [isPlaying]);

  const toggle = () => onPlay(isPlaying ? null : index);
  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    const ct = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setCurrentTime(ct); setProgress((ct / dur) * 100);
  };
  const onLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
  const onEnded = () => { onPlay(null); setProgress(0); setCurrentTime(0); };
  const seek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * (audioRef.current.duration || 0);
  };
  const fmt = (s) => { if (!s || isNaN(s)) return "0:00"; return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`; };

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px", marginBottom: 4, transition: "border-color 0.2s" }}>
      <audio ref={audioRef} src={track.url} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata} onEnded={onEnded} preload="metadata" />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* track number */}
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", width: 16, textAlign: "center", flexShrink: 0 }}>{String(index + 1).padStart(2,"0")}</span>

        {/* play button */}
        <button onClick={toggle} style={{ width: 32, height: 32, borderRadius: "50%", background: isPlaying ? "#ffffff" : "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
          <span style={{ color: isPlaying ? "#1d52b8" : "#fff", fontSize: 11, marginLeft: isPlaying ? 0 : 2 }}>{isPlaying ? "⏸" : "▶"}</span>
        </button>

        {/* track name + progress */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#fff", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.name}</div>
          <div onClick={seek} style={{ height: 3, background: "rgba(255,255,255,0.1)", cursor: "pointer", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#fff", borderRadius: 2, transition: "width 0.1s linear" }} />
          </div>
        </div>

        {/* time */}
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", flexShrink: 0, minWidth: 36, textAlign: "right" }}>
          {isPlaying ? fmt(currentTime) : fmt(duration)}
        </span>
      </div>
    </div>
  );
};

// ─── TRACKLIST PLAYER ─────────────────────────────────────────────────────────
const TracklistPlayer = ({ tracks }) => {
  const [playingIndex, setPlayingIndex] = useState(null);
  if (!tracks || tracks.length === 0) return null;
  return (
    <div>
      {tracks.map((track, i) => (
        <TrackPlayer
          key={i}
          track={track}
          index={i}
          isPlaying={playingIndex === i}
          onPlay={setPlayingIndex}
        />
      ))}
    </div>
  );
};

// ─── CLOUDINARY UPLOAD ────────────────────────────────────────────────────────
const uploadToCloudinary = async (file, resourceType = "auto") => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", "future_pressure");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload fallito");
  return (await res.json()).secure_url;
};

// ─── MULTI TRACK UPLOAD ───────────────────────────────────────────────────────
const MultiTrackUpload = ({ tracks, onTracksChange }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true); setError("");
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const url = await uploadToCloudinary(file, "video");
          return { name: file.name.replace(/\.[^/.]+$/, ""), url };
        })
      );
      onTracksChange([...tracks, ...uploaded]);
    } catch {
      setError("Upload failed. Check Cloud Name and Upload Preset.");
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeTrack = (i) => onTracksChange(tracks.filter((_, idx) => idx !== i));

  return (
    <div>
      <input ref={inputRef} type="file" accept="audio/*" multiple onChange={handleFiles} style={{ display: "none" }} />

      {/* tracks già caricate */}
      {tracks.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {tracks.map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(120,220,120,0.2)", padding: "8px 12px", marginBottom: 4, background: "rgba(120,220,120,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{String(i+1).padStart(2,"0")}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(120,220,120,0.8)" }}>✓ {t.name}</span>
              </div>
              <button onClick={() => removeTrack(i)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* upload button */}
      <div onClick={() => !uploading && inputRef.current?.click()} style={{
        border: "1px dashed rgba(255,255,255,0.15)", padding: "16px", cursor: uploading ? "wait" : "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        transition: "all 0.2s", background: "transparent",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>
            {uploading ? "Caricamento tracks..." : `↑ Upload tracks audio (puoi selezionarne più di una)`}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>MP3 / WAV — multiple selection supported</div>
        </div>
        {uploading && <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
      </div>
      {error && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,80,80,0.8)", marginTop: 6 }}>{error}</div>}
    </div>
  );
};

// ─── SINGLE FILE UPLOAD ───────────────────────────────────────────────────────
const UploadField = ({ label, accept, resourceType, onUploaded, uploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try { onUploaded(await uploadToCloudinary(file, resourceType)); }
    catch { setError("Upload failed."); }
    setUploading(false);
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} onChange={handle} style={{ display: "none" }} />
      <div onClick={() => !uploading && inputRef.current?.click()} style={{
        border: `1px dashed ${uploaded ? "rgba(120,220,120,0.4)" : "rgba(255,255,255,0.15)"}`,
        padding: "14px 16px", cursor: uploading ? "wait" : "pointer",
        background: uploaded ? "rgba(120,220,120,0.04)" : "transparent",
        display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s",
      }}
        onMouseEnter={e => !uploaded && (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
        onMouseLeave={e => !uploaded && (e.currentTarget.style.background = uploaded ? "rgba(120,220,120,0.04)" : "transparent")}
      >
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: uploaded ? "rgba(120,220,120,0.8)" : "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>
            {uploading ? "Uploading..." : uploaded ? `✓ ${label} uploaded` : `↑ Upload ${label}`}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>{accept}</div>
        </div>
        {uploading && <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
      </div>
      {error && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,80,80,0.8)", marginTop: 6 }}>{error}</div>}
    </div>
  );
};

const Modal = ({ onClose, children }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(8,20,60,0.93)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20, backdropFilter: "blur(6px)" }}>
    <div style={{ background: "#0e1e5e", border: "1px solid rgba(255,255,255,0.12)", width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 18, lineHeight: 1, transition: "color 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.color = "#fff"}
        onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
      >✕</button>
      {children}
    </div>
  </div>
);

const LockedRow = ({ label, sub }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.05)", padding: "13px 16px", opacity: 0.3, cursor: "not-allowed" }}>
    <div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#fff" }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{sub}</div>
    </div>
    <span style={{ fontSize: 13 }}>🔒</span>
  </div>
);

const DownloadRow = ({ label, sub, icon, href }) => {
  const inner = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.08)", padding: "13px 16px", transition: "border-color 0.2s, background 0.2s", cursor: "pointer", background: "transparent" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "transparent"; }}
    >
      <div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#fff" }}>{label}</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{sub}</div>
      </div>
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>{icon}</span>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" download style={{ textDecoration: "none" }}>{inner}</a> : inner;
};

// ─── RELEASE MODAL ────────────────────────────────────────────────────────────
const ReleaseModal = ({ release, feedbacks, onClose, onFeedback }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const relFeedbacks = feedbacks.filter(f => f.releaseId === release.id);
  const hasTracks = release.tracks && release.tracks.length > 0;
  const hasDownloads = hasTracks || release.pdfUrl || release.artworkUrl;

  const handleSubmit = () => {
    if (!rating || !comment.trim()) return;
    onFeedback({ releaseId: release.id, rating, comment, name: name || "Anonimo", date: new Date().toISOString() });
    setSubmitted(true);
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "44px 32px 40px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 10 }}>{release.label}</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.01em" }}>{release.title}</h2>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>{release.artist}</div>

        {release.description && (
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.9, marginBottom: 28, borderLeft: "2px solid rgba(255,255,255,0.15)", paddingLeft: 16 }}>{release.description}</p>
        )}

        {/* TRACKLIST — sempre visibile */}
        {hasTracks && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Tracklist — {release.tracks.length} tracks</SectionLabel>
            <TracklistPlayer tracks={release.tracks} />
          </div>
        )}

        {/* STREAMING */}
        {(release.soundcloudUrl || release.spotifyUrl) && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Streaming</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {release.soundcloudUrl && <DownloadRow label="SoundCloud" sub={release.soundcloudUrl} icon="→" href={release.soundcloudUrl} />}
              {release.spotifyUrl && <DownloadRow label="Spotify" sub={release.spotifyUrl} icon="→" href={release.spotifyUrl} />}
            </div>
          </div>
        )}

        {/* DOWNLOAD gated */}
        {hasDownloads && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <SectionLabel>Download</SectionLabel>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", color: submitted ? "rgba(120,220,120,0.7)" : "rgba(255,255,255,0.25)" }}>
                {submitted ? "✓ Unlocked" : "Requires feedback"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {hasTracks && release.tracks.map((t, i) => (
                submitted
                  ? <DownloadRow key={i} label={t.name} sub="Download audio" icon="↓" href={t.url} />
                  : <LockedRow key={i} label={t.name} sub="Download audio" />
              ))}
              {release.pdfUrl && (submitted ? <DownloadRow label="Press Kit PDF" sub="Biography + release info" icon="↓" href={release.pdfUrl} /> : <LockedRow label="Press Kit PDF" sub="Biography + release info" />)}
              {release.artworkUrl && (submitted ? <DownloadRow label="Artwork" sub="High resolution" icon="↓" href={release.artworkUrl} /> : <LockedRow label="Artwork" sub="High resolution" />)}
            </div>
          </div>
        )}

        {/* FEEDBACK */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 28 }}>
          {relFeedbacks.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Feedback ({relFeedbacks.length})</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {relFeedbacks.map((f, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{f.name}</span>
                      <StarRating value={f.rating} readonly />
                    </div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: 0 }}>{f.comment}</p>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>{new Date(f.date).toLocaleDateString("it-IT")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!submitted ? (
            <div>
              <SectionLabel>Your feedback — unlock downloads</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input placeholder="Name / publication (optional)" value={name} onChange={e => setName(e.target.value)} style={iStyle} onFocus={focusStyle} onBlur={blurStyle} />
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Rating *</div>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <textarea placeholder="Your comment on the release... *" value={comment} onChange={e => setComment(e.target.value)} rows={4} style={{ ...iStyle, resize: "vertical" }} onFocus={focusStyle} onBlur={blurStyle} />
                <button onClick={handleSubmit} disabled={!rating || !comment.trim()} style={{
                  background: rating && comment.trim() ? "#ffffff" : "rgba(255,255,255,0.06)",
                  border: "none", color: rating && comment.trim() ? "#1d52b8" : "rgba(255,255,255,0.2)",
                  fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em",
                  textTransform: "uppercase", padding: "13px 20px",
                  cursor: rating && comment.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.2s", fontWeight: 700,
                }}>{rating && comment.trim() ? "Submit and unlock downloads →" : "Fill in to unlock"}</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 6 }}>✓ Thank you for your feedback</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>Downloads are now available above.</div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ─── ADMIN MODAL ──────────────────────────────────────────────────────────────
const AdminModal = ({ onClose, onAddRelease, onDeleteRelease, releases, feedbacks }) => {
  const [tab, setTab] = useState("new");
  const [form, setForm] = useState({ artist: "", title: "", label: "", genre: "", date: "", description: "", soundcloudUrl: "", spotifyUrl: "", tracks: [], pdfUrl: "", artworkUrl: "" });
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{
      background: "none", border: "none", borderBottom: `2px solid ${tab === id ? "#fff" : "transparent"}`,
      color: tab === id ? "#fff" : "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace",
      fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", padding: "8px 0",
      cursor: "pointer", marginRight: 24, transition: "all 0.2s",
    }}>{label}</button>
  );

  const getReleaseTitle = (id) => releases.find(r => r.id === id)?.title || id;
  const totalFeedbacks = feedbacks.length;
  const avgGlobal = totalFeedbacks
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / totalFeedbacks).toFixed(1)
    : "—";

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "44px 32px 40px" }}>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 28 }}>
          {tabBtn("new", "New Release")}
          {tabBtn("releases", `Releases (${releases.length})`)}
          {tabBtn("feedback", `Feedback (${totalFeedbacks})`)}
        </div>

        {/* ── TAB: NUOVA RELEASE ── */}
        {tab === "new" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["artist","Artist *"],["title","Title *"],["label","Label"],["genre","Genre"],["soundcloudUrl","SoundCloud Link"],["spotifyUrl","Spotify Link"]].map(([k,ph]) => (
              <input key={k} placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} style={iStyle} onFocus={focusStyle} onBlur={blurStyle} />
            ))}
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={iStyle} onFocus={focusStyle} onBlur={blurStyle} />
            <textarea placeholder="Description" value={form.description} onChange={e => set("description", e.target.value)} rows={3} style={{ ...iStyle, resize: "vertical" }} onFocus={focusStyle} onBlur={blurStyle} />
            <div style={{ marginTop: 8 }}>
              <SectionLabel>Audio Tracks</SectionLabel>
              <MultiTrackUpload tracks={form.tracks} onTracksChange={v => set("tracks", v)} />
            </div>
            <div style={{ marginTop: 4 }}>
              <SectionLabel>Other files</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <UploadField label="Press Kit PDF" accept="application/pdf" resourceType="raw" uploaded={!!form.pdfUrl} onUploaded={url => set("pdfUrl", url)} />
                <UploadField label="Artwork" accept="image/*" resourceType="image" uploaded={!!form.artworkUrl} onUploaded={url => set("artworkUrl", url)} />
              </div>
            </div>
            {!saved ? (
              <button onClick={() => { if (!form.artist || !form.title) return; onAddRelease({ ...form, id: `rel_${Date.now()}` }); setSaved(true); }} style={{ background: "#ffffff", border: "none", color: "#1d52b8", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer", marginTop: 8, fontWeight: 700 }}>
                Publish Release
              </button>
            ) : (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(120,220,120,0.8)", letterSpacing: "0.15em" }}>✓ Release published.</div>
            )}
          </div>
        )}

        {/* ── TAB: RELEASE ── */}
        {tab === "releases" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {releases.length === 0 ? (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "40px 0" }}>No releases uploaded yet.</div>
            ) : releases.map(r => (
              <div key={r.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 2 }}>{r.title}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>{r.artist} — {r.label}</div>
                  {r.tracks && r.tracks.length > 0 && (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>{r.tracks.length} tracks</div>
                  )}
                </div>
                {confirmDelete === r.id ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,80,80,0.8)" }}>Are you sure?</span>
                    <button onClick={() => { onDeleteRelease(r.id); setConfirmDelete(null); }} style={{ background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.4)", color: "rgba(255,80,80,0.9)", fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "4px 10px", cursor: "pointer", letterSpacing: "0.1em" }}>Delete</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "4px 10px", cursor: "pointer", letterSpacing: "0.1em" }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(r.id)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.2)", color: "rgba(255,80,80,0.5)", fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "5px 12px", cursor: "pointer", letterSpacing: "0.1em", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,80,80,0.6)"; e.currentTarget.style.color = "rgba(255,80,80,0.9)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,80,80,0.2)"; e.currentTarget.style.color = "rgba(255,80,80,0.5)"; }}
                  >Delete</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: FEEDBACK ── */}
        {tab === "feedback" && (
          <div>
            <div style={{ display: "flex", gap: 2, marginBottom: 24 }}>
              {[["Total feedback", totalFeedbacks], ["Avg rating", avgGlobal], ["Active releases", releases.length]].map(([label, val]) => (
                <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px 14px" }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: "#fff", marginBottom: 4 }}>{val}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>{label}</div>
                </div>
              ))}
            </div>
            {feedbacks.length === 0 ? (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "40px 0" }}>No feedback received yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...feedbacks].reverse().map((f, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#fff", background: "rgba(255,255,255,0.08)", padding: "2px 8px" }}>{getReleaseTitle(f.releaseId)}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.2)" }}>{new Date(f.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{f.name}</span>
                      <StarRating value={f.rating} readonly />
                    </div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: 0 }}>{f.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── RELEASE CARD ─────────────────────────────────────────────────────────────
const ReleaseCard = ({ release, feedbacks, onOpen }) => {
  const relFb = feedbacks.filter(f => f.releaseId === release.id);
  const avg = relFb.length ? (relFb.reduce((s, f) => s + f.rating, 0) / relFb.length).toFixed(1) : null;
  const trackCount = release.tracks ? release.tracks.length : 0;

  return (
    <div onClick={() => onOpen(release)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "28px 26px", cursor: "pointer", transition: "border-color 0.25s, background 0.25s, transform 0.25s", position: "relative" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ flex: 1, paddingRight: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 7 }}>{release.label}</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: "-0.01em", marginBottom: 4 }}>{release.title}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{release.artist}</div>
        </div>
        {avg && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: "#fff", lineHeight: 1 }}>{avg}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", marginTop: 3 }}>{relFb.length} fb</div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        {release.genre && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#fff", background: "rgba(255,255,255,0.1)", padding: "3px 10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{release.genre}</span>}
        {release.date && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{new Date(release.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}</span>}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {trackCount > 0 && <AssetBadge label={`${trackCount} tracks`} />}
        {release.pdfUrl && <AssetBadge label="Press Kit" />}
        {release.artworkUrl && <AssetBadge label="Artwork" />}
        {release.soundcloudUrl && <AssetBadge label="SoundCloud" />}
        {release.spotifyUrl && <AssetBadge label="Spotify" />}
      </div>
      <div style={{ position: "absolute", bottom: 20, right: 22, fontFamily: "'DM Mono', monospace", fontSize: 18, color: "rgba(255,255,255,0.15)" }}>→</div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [releases, setReleases] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeRelease, setActiveRelease] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPrompt, setAdminPrompt] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await window.storage.get("fp5_releases");
        const f = await window.storage.get("fp5_feedbacks");
        setReleases(r ? JSON.parse(r.value) : DEMO_RELEASES);
        setFeedbacks(f ? JSON.parse(f.value) : []);
      } catch { setReleases(DEMO_RELEASES); setFeedbacks([]); }
      setLoading(false);
    };
    load();
  }, []);

  const saveReleases = async (d) => { try { await window.storage.set("fp5_releases", JSON.stringify(d)); } catch {} };
  const saveFeedbacks = async (d) => { try { await window.storage.set("fp5_feedbacks", JSON.stringify(d)); } catch {} };
  const addRelease = (rel) => { const n = [rel, ...releases]; setReleases(n); saveReleases(n); setShowAdmin(false); };
  const addFeedback = (fb) => { const n = [...feedbacks, fb]; setFeedbacks(n); saveFeedbacks(n); };
  const deleteRelease = (id) => { const n = releases.filter(r => r.id !== id); setReleases(n); saveReleases(n); };
  const handleAdminUnlock = () => {
    if (adminKey === "futurepressure") { setAdminUnlocked(true); setAdminPrompt(false); setShowAdmin(true); setAdminError(false); }
    else { setAdminError(true); setAdminKey(""); }
  };

  if (loading) return (
    <div style={{ background: "#0e1e5e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <StarLogoV2 size={56} />
    </div>
  );

  return (
    <div style={{ background: "#0e2060", minHeight: "100vh", fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0e2060; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.3); }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(14,32,96,0.95)", backdropFilter: "blur(10px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <StarLogoV2 size={34} />
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase" }}>Future Pressure</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.25em", textTransform: "uppercase", marginTop: 1 }}>Promo Portal</div>
          </div>
        </div>
        <button onClick={() => adminUnlocked ? setShowAdmin(true) : setAdminPrompt(true)}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", padding: "8px 16px", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1d52b8"; e.currentTarget.style.borderColor = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
        >+ Aggiungi</button>
      </nav>

      <div style={{ padding: "72px 32px 52px", maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.03, pointerEvents: "none" }}><StarLogoV2 size={320} /></div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.45em", textTransform: "uppercase", marginBottom: 18 }}>Underground Electronic Music</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(32px, 6vw, 58px)", color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.05, margin: "0 0 20px" }}>Promo Releases</h1>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", lineHeight: 2.2, maxWidth: 420, margin: "0 auto" }}>
          Preview, lascia il tuo feedback<br />e sblocca i download.
        </p>
        <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.15)", margin: "36px auto 0" }} />
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 100px" }}>
        {releases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.25em" }}>NO RELEASES UPLOADED YET</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 2 }}>
            {releases.map(r => <ReleaseCard key={r.id} release={r} feedbacks={feedbacks} onOpen={setActiveRelease} />)}
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StarLogoV2 size={18} color="rgba(255,255,255,0.25)" />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.25em", textTransform: "uppercase" }}>Future Pressure © 2026</span>
        </div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em" }}>Press & Promo Agency</span>
      </div>

      {activeRelease && <ReleaseModal release={activeRelease} feedbacks={feedbacks} onClose={() => setActiveRelease(null)} onFeedback={addFeedback} />}
      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} onAddRelease={addRelease} onDeleteRelease={deleteRelease} releases={releases} feedbacks={feedbacks} />}

      {adminPrompt && (
        <Modal onClose={() => { setAdminPrompt(false); setAdminKey(""); setAdminError(false); }}>
          <div style={{ padding: "44px 32px 36px" }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", margin: "0 0 24px" }}>Admin Access</h2>
            <input type="password" placeholder="Password" value={adminKey} onChange={e => { setAdminKey(e.target.value); setAdminError(false); }} onKeyDown={e => e.key === "Enter" && handleAdminUnlock()} style={{ ...iStyle, borderColor: adminError ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.1)" }} onFocus={focusStyle} onBlur={blurStyle} />
            {adminError && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,80,80,0.8)", marginTop: 8 }}>Wrong password.</div>}
            <button onClick={handleAdminUnlock} style={{ marginTop: 14, background: "#fff", border: "none", color: "#1d52b8", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", padding: "11px 20px", cursor: "pointer", width: "100%", fontWeight: 700 }}>Entra</button>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 12 }}>Demo password: futurepressure</div>
          </div>
        </Modal>
      )}
    </div>
  );
}
