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
    audioUrl: "",
    pdfUrl: "",
    description: "Una release che attraversa territori industriali con anima groove. Quattro tracce di pressione pura.",
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

// ─── AUDIO PLAYER ─────────────────────────────────────────────────────────────
const AudioPlayer = ({ url }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };
  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    const ct = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setCurrentTime(ct); setProgress((ct / dur) * 100);
  };
  const onLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
  const onEnded = () => setPlaying(false);
  const seek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * (audioRef.current.duration || 0);
  };
  const fmt = (s) => { if (!s || isNaN(s)) return "0:00"; return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`; };

  return (
    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px 18px", marginBottom: 6 }}>
      <audio ref={audioRef} src={url} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata} onEnded={onEnded} preload="metadata" />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={toggle} style={{ width: 38, height: 38, borderRadius: "50%", background: "#ffffff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "opacity 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <span style={{ color: "#1d52b8", fontSize: 13, lineHeight: 1, marginLeft: playing ? 0 : 2 }}>{playing ? "⏸" : "▶"}</span>
        </button>
        <div style={{ flex: 1 }}>
          <div onClick={seek} style={{ height: 4, background: "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#ffffff", borderRadius: 2, transition: "width 0.1s linear" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.35)" }}>{fmt(currentTime)}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.35)" }}>{fmt(duration)}</span>
          </div>
        </div>
      </div>
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

const UploadField = ({ label, accept, resourceType, onUploaded, uploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try { onUploaded(await uploadToCloudinary(file, resourceType)); }
    catch { setError("Upload fallito. Controlla Cloud Name e Upload Preset."); }
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
        onMouseLeave={e => !uploaded && (e.currentTarget.style.background = "transparent")}
      >
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: uploaded ? "rgba(120,220,120,0.8)" : "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>
            {uploading ? "Caricamento..." : uploaded ? `✓ ${label} caricato` : `↑ Carica ${label}`}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 3, letterSpacing: "0.1em" }}>{accept}</div>
        </div>
        {uploading && <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
      </div>
      {error && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,80,80,0.8)", marginTop: 6, letterSpacing: "0.1em" }}>{error}</div>}
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

        {/* PLAYER — sempre visibile */}
        {release.audioUrl && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Ascolta in anteprima</SectionLabel>
            <AudioPlayer url={release.audioUrl} />
          </div>
        )}

        {/* STREAMING LINKS */}
        {(release.soundcloudUrl || release.spotifyUrl) && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Streaming</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {release.soundcloudUrl && <DownloadRow label="SoundCloud" sub={release.soundcloudUrl} icon="→" href={release.soundcloudUrl} />}
              {release.spotifyUrl && <DownloadRow label="Spotify" sub={release.spotifyUrl} icon="→" href={release.spotifyUrl} />}
            </div>
          </div>
        )}

        {/* DOWNLOAD — gated */}
        {(release.audioUrl || release.pdfUrl || release.artworkUrl) && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <SectionLabel>Download</SectionLabel>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", color: submitted ? "rgba(120,220,120,0.7)" : "rgba(255,255,255,0.25)" }}>
                {submitted ? "✓ Sbloccato" : "Richiede feedback"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {release.audioUrl && (submitted ? <DownloadRow label="Download Audio" sub="MP3 / WAV" icon="↓" href={release.audioUrl} /> : <LockedRow label="Download Audio" sub="MP3 / WAV" />)}
              {release.pdfUrl && (submitted ? <DownloadRow label="Press Kit PDF" sub="Biografia + info release" icon="↓" href={release.pdfUrl} /> : <LockedRow label="Press Kit PDF" sub="Biografia + info release" />)}
              {release.artworkUrl && (submitted ? <DownloadRow label="Artwork" sub="Alta risoluzione" icon="↓" href={release.artworkUrl} /> : <LockedRow label="Artwork" sub="Alta risoluzione" />)}
            </div>
          </div>
        )}

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
              <SectionLabel>Il tuo feedback — sblocca i download</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input placeholder="Nome / testata (opzionale)" value={name} onChange={e => setName(e.target.value)} style={iStyle} onFocus={focusStyle} onBlur={blurStyle} />
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Rating *</div>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <textarea placeholder="Il tuo commento sulla release... *" value={comment} onChange={e => setComment(e.target.value)} rows={4} style={{ ...iStyle, resize: "vertical" }} onFocus={focusStyle} onBlur={blurStyle} />
                <button onClick={handleSubmit} disabled={!rating || !comment.trim()} style={{
                  background: rating && comment.trim() ? "#ffffff" : "rgba(255,255,255,0.06)",
                  border: "none", color: rating && comment.trim() ? "#1d52b8" : "rgba(255,255,255,0.2)",
                  fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em",
                  textTransform: "uppercase", padding: "13px 20px",
                  cursor: rating && comment.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.2s", fontWeight: 700,
                }}>{rating && comment.trim() ? "Invia e sblocca download →" : "Compila per sbloccare"}</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 6 }}>✓ Grazie per il feedback</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>I download sono ora disponibili qui sopra.</div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ─── ADMIN MODAL ──────────────────────────────────────────────────────────────
const AdminModal = ({ onClose, onAddRelease }) => {
  const [form, setForm] = useState({ artist: "", title: "", label: "", genre: "", date: "", description: "", soundcloudUrl: "", spotifyUrl: "", audioUrl: "", pdfUrl: "", artworkUrl: "" });
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "44px 32px 40px" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 28px" }}>Nuova Release</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[["artist","Artista *"],["title","Titolo *"],["label","Label"],["genre","Genere"],["soundcloudUrl","Link SoundCloud"],["spotifyUrl","Link Spotify"]].map(([k,ph]) => (
            <input key={k} placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} style={iStyle} onFocus={focusStyle} onBlur={blurStyle} />
          ))}
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={iStyle} onFocus={focusStyle} onBlur={blurStyle} />
          <textarea placeholder="Descrizione" value={form.description} onChange={e => set("description", e.target.value)} rows={3} style={{ ...iStyle, resize: "vertical" }} onFocus={focusStyle} onBlur={blurStyle} />

          <div style={{ marginTop: 8 }}>
            <SectionLabel>File — carica su Cloudinary</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <UploadField label="Audio" accept="audio/mp3,audio/wav,audio/*" resourceType="video" uploaded={!!form.audioUrl} onUploaded={url => set("audioUrl", url)} />
              <UploadField label="Press Kit PDF" accept="application/pdf" resourceType="raw" uploaded={!!form.pdfUrl} onUploaded={url => set("pdfUrl", url)} />
              <UploadField label="Artwork" accept="image/*" resourceType="image" uploaded={!!form.artworkUrl} onUploaded={url => set("artworkUrl", url)} />
            </div>
          </div>

          {!saved ? (
            <button onClick={() => { if (!form.artist || !form.title) return; onAddRelease({ ...form, id: `rel_${Date.now()}` }); setSaved(true); }} style={{ background: "#ffffff", border: "none", color: "#1d52b8", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer", marginTop: 8, fontWeight: 700 }}>
              Pubblica Release
            </button>
          ) : (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(120,220,120,0.8)", letterSpacing: "0.15em" }}>✓ Release pubblicata.</div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ─── RELEASE CARD ─────────────────────────────────────────────────────────────
const ReleaseCard = ({ release, feedbacks, onOpen }) => {
  const relFb = feedbacks.filter(f => f.releaseId === release.id);
  const avg = relFb.length ? (relFb.reduce((s, f) => s + f.rating, 0) / relFb.length).toFixed(1) : null;
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
        {release.audioUrl && <AssetBadge label="Audio" />}
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
        const r = await window.storage.get("fp4_releases");
        const f = await window.storage.get("fp4_feedbacks");
        setReleases(r ? JSON.parse(r.value) : DEMO_RELEASES);
        setFeedbacks(f ? JSON.parse(f.value) : []);
      } catch { setReleases(DEMO_RELEASES); setFeedbacks([]); }
      setLoading(false);
    };
    load();
  }, []);

  const saveReleases = async (d) => { try { await window.storage.set("fp4_releases", JSON.stringify(d)); } catch {} };
  const saveFeedbacks = async (d) => { try { await window.storage.set("fp4_feedbacks", JSON.stringify(d)); } catch {} };
  const addRelease = (rel) => { const n = [rel, ...releases]; setReleases(n); saveReleases(n); setShowAdmin(false); };
  const addFeedback = (fb) => { const n = [...feedbacks, fb]; setFeedbacks(n); saveFeedbacks(n); };
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
          Ascolta in anteprima, lascia il tuo feedback<br />e sblocca i download.
        </p>
        <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.15)", margin: "36px auto 0" }} />
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 100px" }}>
        {releases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.25em" }}>NESSUNA RELEASE CARICATA</div>
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
      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} onAddRelease={addRelease} />}

      {adminPrompt && (
        <Modal onClose={() => { setAdminPrompt(false); setAdminKey(""); setAdminError(false); }}>
          <div style={{ padding: "44px 32px 36px" }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", margin: "0 0 24px" }}>Accesso Admin</h2>
            <input type="password" placeholder="Password" value={adminKey} onChange={e => { setAdminKey(e.target.value); setAdminError(false); }} onKeyDown={e => e.key === "Enter" && handleAdminUnlock()} style={{ ...iStyle, borderColor: adminError ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.1)" }} onFocus={focusStyle} onBlur={blurStyle} />
            {adminError && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,80,80,0.8)", marginTop: 8, letterSpacing: "0.1em" }}>Password errata.</div>}
            <button onClick={handleAdminUnlock} style={{ marginTop: 14, background: "#fff", border: "none", color: "#1d52b8", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", padding: "11px 20px", cursor: "pointer", width: "100%", fontWeight: 700 }}>Entra</button>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 12, letterSpacing: "0.1em" }}>Password demo: futurepressure</div>
          </div>
        </Modal>
      )}
    </div>
  );
}
