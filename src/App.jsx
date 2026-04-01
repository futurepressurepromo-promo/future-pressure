import { useState, useEffect, useRef } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://xetnmzzdlvahhfoxeone.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "sb_publishable_5VEkozv-u4aJoTQKe7gssQ_ZcUqVZzL";

const sb = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const dbGetReleases = () => sb("releases?order=created_at.desc");
const dbGetFeedbacks = () => sb("feedbacks?order=created_at.desc");
const dbAddRelease = (r) => sb("releases", { method: "POST", body: JSON.stringify({
  id: r.id, artist: r.artist, title: r.title, label: r.label, genre: r.genre,
  date: r.date, description: r.description, soundcloud_url: r.soundcloudUrl,
  spotify_url: r.spotifyUrl, artwork_url: r.artworkUrl, pdf_url: r.pdfUrl, tracks: r.tracks,
}) });
const dbDeleteRelease = (id) => sb(`releases?id=eq.${id}`, { method: "DELETE", prefer: "" });
const dbAddFeedback = (f) => sb("feedbacks", { method: "POST", body: JSON.stringify({
  release_id: f.releaseId, name: f.name, rating: f.rating, comment: f.comment,
}) });

const mapRelease = (r) => ({
  id: r.id, artist: r.artist, title: r.title, label: r.label, genre: r.genre,
  date: r.date, description: r.description, soundcloudUrl: r.soundcloud_url,
  spotifyUrl: r.spotify_url, artworkUrl: r.artwork_url, pdfUrl: r.pdf_url,
  tracks: r.tracks || [],
});
const mapFeedback = (f) => ({
  id: f.id, releaseId: f.release_id, name: f.name, rating: f.rating,
  comment: f.comment, date: f.created_at,
});

// ─── CLOUDINARY ───────────────────────────────────────────────────────────────
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dtvjnpad3";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "future_pressure";

const uploadFile = async (file, resourceType) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", "future_pressure");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  return (await res.json()).secure_url;
};

// ─── STAR LOGO ────────────────────────────────────────────────────────────────
const StarLogo = ({ size = 40, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M52 2 L56 44 L95 36 L59 52 L80 92 L50 59 L21 98 L44 56 L6 65 L43 48 L19 11 L51 44 Z" fill={color} />
  </svg>
);

const iStyle = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#ffffff", fontFamily: "'DM Mono', monospace", fontSize: 11,
  padding: "10px 14px", width: "100%", outline: "none", letterSpacing: "0.04em", transition: "border-color 0.2s",
};
const onFocus = (e) => e.target.style.borderColor = "rgba(255,255,255,0.4)";
const onBlur  = (e) => e.target.style.borderColor = "rgba(255,255,255,0.1)";

const Label = ({ children }) => (
  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>{children}</div>
);

const Badge = ({ label }) => (
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

const TrackPlayer = ({ track, index, isPlaying, onPlay }) => {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else { audioRef.current.pause(); audioRef.current.currentTime = 0; setProgress(0); setCurrentTime(0); }
  }, [isPlaying]);

  const fmt = (s) => !s || isNaN(s) ? "0:00" : `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px", marginBottom: 4 }}>
      <audio ref={audioRef} src={track.url}
        onTimeUpdate={() => { if (!audioRef.current) return; const ct = audioRef.current.currentTime; setCurrentTime(ct); setProgress((ct / (audioRef.current.duration || 1)) * 100); }}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => { onPlay(null); setProgress(0); setCurrentTime(0); }}
        preload="metadata"
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", width: 16, textAlign: "center", flexShrink: 0 }}>{String(index+1).padStart(2,"0")}</span>
        <button onClick={() => onPlay(isPlaying ? null : index)} style={{ width: 32, height: 32, borderRadius: "50%", background: isPlaying ? "#fff" : "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
          <span style={{ color: isPlaying ? "#1d52b8" : "#fff", fontSize: 11, marginLeft: isPlaying ? 0 : 2 }}>{isPlaying ? "⏸" : "▶"}</span>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#fff", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.name}</div>
          <div onClick={(e) => { if (!audioRef.current) return; const r = e.currentTarget.getBoundingClientRect(); audioRef.current.currentTime = ((e.clientX - r.left) / r.width) * (audioRef.current.duration || 0); }} style={{ height: 3, background: "rgba(255,255,255,0.1)", cursor: "pointer", borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#fff", borderRadius: 2, transition: "width 0.1s linear" }} />
          </div>
        </div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", flexShrink: 0, minWidth: 36, textAlign: "right" }}>{isPlaying ? fmt(currentTime) : fmt(duration)}</span>
      </div>
    </div>
  );
};

const Tracklist = ({ tracks }) => {
  const [playing, setPlaying] = useState(null);
  if (!tracks || tracks.length === 0) return null;
  return <div>{tracks.map((t, i) => <TrackPlayer key={i} track={t} index={i} isPlaying={playing === i} onPlay={setPlaying} />)}</div>;
};

const MultiTrackUpload = ({ tracks, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);

  const handle = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true); setError("");
    try {
      const uploaded = await Promise.all(files.map(async f => ({ name: f.name.replace(/\.[^/.]+$/, ""), url: await uploadFile(f, "video") })));
      onChange([...tracks, ...uploaded]);
    } catch { setError("Upload failed. Check Cloud Name and Upload Preset."); }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div>
      <input ref={ref} type="file" accept="audio/*" multiple onChange={handle} style={{ display: "none" }} />
      {tracks.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {tracks.map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(120,220,120,0.2)", padding: "8px 12px", marginBottom: 4, background: "rgba(120,220,120,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{String(i+1).padStart(2,"0")}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(120,220,120,0.8)" }}>✓ {t.name}</span>
              </div>
              <button onClick={() => onChange(tracks.filter((_,idx) => idx !== i))} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div onClick={() => !uploading && ref.current?.click()} style={{ border: "1px dashed rgba(255,255,255,0.15)", padding: "16px", cursor: uploading ? "wait" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
            {uploading ? "Uploading tracks..." : "↑ Upload audio tracks (you can select multiple)"}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>MP3 / WAV — multiple selection supported</div>
        </div>
        {uploading && <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
      </div>
      {error && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,80,80,0.8)", marginTop: 6 }}>{error}</div>}
    </div>
  );
};

const FileUpload = ({ label, accept, resourceType, url, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);
  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try { onUploaded(await uploadFile(file, resourceType)); }
    catch { setError("Upload failed."); }
    setUploading(false);
  };
  return (
    <div>
      <input ref={ref} type="file" accept={accept} onChange={handle} style={{ display: "none" }} />
      <div onClick={() => !uploading && ref.current?.click()} style={{ border: `1px dashed ${url ? "rgba(120,220,120,0.4)" : "rgba(255,255,255,0.15)"}`, padding: "14px 16px", cursor: uploading ? "wait" : "pointer", background: url ? "rgba(120,220,120,0.04)" : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}
        onMouseEnter={e => !url && (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
        onMouseLeave={e => e.currentTarget.style.background = url ? "rgba(120,220,120,0.04)" : "transparent"}
      >
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: url ? "rgba(120,220,120,0.8)" : "rgba(255,255,255,0.6)" }}>
            {uploading ? "Uploading..." : url ? `✓ ${label} uploaded` : `↑ Upload ${label}`}
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
      <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 18, lineHeight: 1, zIndex: 10 }}
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
    <span>🔒</span>
  </div>
);

const LinkRow = ({ label, sub, icon, href, download = false }) => {
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
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" download={download} style={{ textDecoration: "none" }}>{inner}</a> : inner;
};

const ReleaseModal = ({ release, feedbacks, onClose, onFeedback }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const relFb = feedbacks.filter(f => f.releaseId === release.id);
  const hasTracks = release.tracks && release.tracks.length > 0;
  const hasDownloads = hasTracks || release.pdfUrl || release.artworkUrl;

  const submit = async () => {
    if (!rating || !comment.trim()) return;
    setSaving(true);
    await onFeedback({ releaseId: release.id, name: name || "Anonymous", rating, comment });
    setSaving(false);
    setSubmitted(true);
  };

  return (
    <Modal onClose={onClose}>
      {release.artworkUrl ? (
        <div style={{ position: "relative", width: "100%", paddingTop: "40%", overflow: "hidden" }}>
          <img src={release.artworkUrl} alt={release.title} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, #0e1e5e 100%)" }} />
          <div style={{ position: "absolute", bottom: 20, left: 32 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 6 }}>{release.label}</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, color: "#fff", margin: "0 0 4px" }}>{release.title}</h2>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{release.artist}</div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "44px 32px 0" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 10 }}>{release.label}</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "#fff", margin: "0 0 6px" }}>{release.title}</h2>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{release.artist}</div>
        </div>
      )}

      <div style={{ padding: "24px 32px 40px" }}>
        {release.description && (
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.9, marginBottom: 28, borderLeft: "2px solid rgba(255,255,255,0.15)", paddingLeft: 16 }}>{release.description}</p>
        )}

        {hasTracks && (
          <div style={{ marginBottom: 28 }}>
            <Label>Tracklist — {release.tracks.length} tracks</Label>
            <Tracklist tracks={release.tracks} />
          </div>
        )}

        {(release.soundcloudUrl || release.spotifyUrl) && (
          <div style={{ marginBottom: 28 }}>
            <Label>Streaming</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {release.soundcloudUrl && <LinkRow label="SoundCloud" sub={release.soundcloudUrl} icon="→" href={release.soundcloudUrl} />}
              {release.spotifyUrl && <LinkRow label="Spotify" sub={release.spotifyUrl} icon="→" href={release.spotifyUrl} />}
            </div>
          </div>
        )}

        {hasDownloads && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Label>Downloads</Label>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", color: submitted ? "rgba(120,220,120,0.7)" : "rgba(255,255,255,0.25)" }}>
                {submitted ? "✓ Unlocked" : "Requires feedback"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {hasTracks && release.tracks.map((t, i) =>
                submitted ? <LinkRow key={i} label={t.name} sub="Download audio" icon="↓" href={t.url} download /> : <LockedRow key={i} label={t.name} sub="Download audio" />
              )}
              {release.pdfUrl && (submitted ? <LinkRow label="Press Kit PDF" sub="Biography + release info" icon="↓" href={release.pdfUrl} download /> : <LockedRow label="Press Kit PDF" sub="Biography + release info" />)}
              {release.artworkUrl && (submitted ? <LinkRow label="Artwork" sub="High resolution" icon="↓" href={release.artworkUrl} download /> : <LockedRow label="Artwork" sub="High resolution" />)}
            </div>
          </div>
        )}

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 28 }}>
          {relFb.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Label>Feedback ({relFb.length})</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {relFb.map((f, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{f.name}</span>
                      <StarRating value={f.rating} readonly />
                    </div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: 0 }}>{f.comment}</p>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>{new Date(f.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!submitted ? (
            <div>
              <Label>Your feedback — unlock downloads</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input placeholder="Name / publication (optional)" value={name} onChange={e => setName(e.target.value)} style={iStyle} onFocus={onFocus} onBlur={onBlur} />
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Rating *</div>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <textarea placeholder="Your comment on the release... *" value={comment} onChange={e => setComment(e.target.value)} rows={4} style={{ ...iStyle, resize: "vertical" }} onFocus={onFocus} onBlur={onBlur} />
                <button onClick={submit} disabled={!rating || !comment.trim() || saving} style={{
                  background: rating && comment.trim() && !saving ? "#ffffff" : "rgba(255,255,255,0.06)",
                  border: "none", color: rating && comment.trim() && !saving ? "#1d52b8" : "rgba(255,255,255,0.2)",
                  fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em",
                  textTransform: "uppercase", padding: "13px 20px",
                  cursor: rating && comment.trim() && !saving ? "pointer" : "not-allowed",
                  transition: "all 0.2s", fontWeight: 700,
                }}>{saving ? "Saving..." : rating && comment.trim() ? "Submit and unlock downloads →" : "Fill in to unlock"}</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 6 }}>✓ Thank you for your feedback</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Downloads are now available above.</div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const AdminModal = ({ onClose, onAddRelease, onDeleteRelease, releases, feedbacks }) => {
  const [tab, setTab] = useState("new");
  const [form, setForm] = useState({ artist: "", title: "", label: "", genre: "", date: "", description: "", soundcloudUrl: "", spotifyUrl: "", tracks: [], pdfUrl: "", artworkUrl: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [openRelease, setOpenRelease] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const totalFb = feedbacks.length;
  const avgRating = totalFb ? (feedbacks.reduce((s, f) => s + f.rating, 0) / totalFb).toFixed(1) : "—";

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      background: "none", border: "none", borderBottom: `2px solid ${tab === id ? "#fff" : "transparent"}`,
      color: tab === id ? "#fff" : "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace",
      fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", padding: "8px 0",
      cursor: "pointer", marginRight: 24, transition: "all 0.2s",
    }}>{label}</button>
  );

  const publish = async () => {
    if (!form.artist || !form.title) return;
    setSaving(true);
    await onAddRelease({ ...form, id: `rel_${Date.now()}` });
    setSaving(false);
    setSaved(true);
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "44px 32px 40px" }}>
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 28 }}>
          <TabBtn id="new" label="New Release" />
          <TabBtn id="releases" label={`Releases (${releases.length})`} />
          <TabBtn id="feedback" label={`Feedback (${totalFb})`} />
        </div>

        {tab === "new" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["artist","Artist *"],["title","Title *"],["label","Label"],["genre","Genre"],["soundcloudUrl","SoundCloud Link"],["spotifyUrl","Spotify Link"]].map(([k,ph]) => (
              <input key={k} placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} style={iStyle} onFocus={onFocus} onBlur={onBlur} />
            ))}
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={iStyle} onFocus={onFocus} onBlur={onBlur} />
            <textarea placeholder="Description" value={form.description} onChange={e => set("description", e.target.value)} rows={3} style={{ ...iStyle, resize: "vertical" }} onFocus={onFocus} onBlur={onBlur} />
            <div style={{ marginTop: 8 }}>
              <Label>Audio Tracks</Label>
              <MultiTrackUpload tracks={form.tracks} onChange={v => set("tracks", v)} />
            </div>
            <div style={{ marginTop: 4 }}>
              <Label>Other Files</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <FileUpload label="Artwork (cover)" accept="image/*" resourceType="image" url={form.artworkUrl} onUploaded={url => set("artworkUrl", url)} />
                <FileUpload label="Press Kit PDF" accept="application/pdf" resourceType="raw" url={form.pdfUrl} onUploaded={url => set("pdfUrl", url)} />
              </div>
            </div>
            {!saved ? (
              <button onClick={publish} disabled={saving} style={{ background: saving ? "rgba(255,255,255,0.1)" : "#fff", border: "none", color: saving ? "rgba(255,255,255,0.3)" : "#1d52b8", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", padding: "12px 20px", cursor: saving ? "wait" : "pointer", marginTop: 8, fontWeight: 700 }}>
                {saving ? "Publishing..." : "Publish Release"}
              </button>
            ) : (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(120,220,120,0.8)" }}>✓ Release published and live for everyone.</div>
            )}
          </div>
        )}

        {tab === "releases" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {releases.length === 0 ? (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "40px 0" }}>No releases uploaded yet.</div>
            ) : releases.map(r => (
              <div key={r.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {r.artworkUrl && <img src={r.artworkUrl} alt={r.title} style={{ width: 40, height: 40, objectFit: "cover", flexShrink: 0 }} />}
                    <div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 2 }}>{r.title}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{r.artist} — {r.label}</div>
                      {r.tracks && r.tracks.length > 0 && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{r.tracks.length} tracks</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {confirmDelete === r.id ? (
                      <>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,80,80,0.8)" }}>Sure?</span>
                        <button onClick={async () => { await onDeleteRelease(r.id); setConfirmDelete(null); }} style={{ background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.4)", color: "rgba(255,80,80,0.9)", fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "4px 10px", cursor: "pointer" }}>Delete</button>
                        <button onClick={() => setConfirmDelete(null)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "4px 10px", cursor: "pointer" }}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDelete(r.id)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.25)", color: "rgba(255,80,80,0.6)", fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "5px 12px", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,80,80,0.7)"; e.currentTarget.style.color = "rgba(255,80,80,1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,80,80,0.25)"; e.currentTarget.style.color = "rgba(255,80,80,0.6)"; }}
                      >Delete</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "feedback" && (
          <div>
            <div style={{ display: "flex", gap: 2, marginBottom: 28 }}>
              {[["Total feedback", totalFb], ["Avg rating", avgRating], ["Active releases", releases.length]].map(([label, val]) => (
                <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px 14px" }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: "#fff", marginBottom: 4 }}>{val}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>{label}</div>
                </div>
              ))}
            </div>

            {releases.length === 0 ? (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "40px 0" }}>No releases yet.</div>
            ) : releases.map(r => {
              const rFb = feedbacks.filter(f => f.releaseId === r.id);
              const rAvg = rFb.length ? (rFb.reduce((s, f) => s + f.rating, 0) / rFb.length).toFixed(1) : null;
              const isOpen = openRelease === r.id;
              return (
                <div key={r.id} style={{ marginBottom: 8 }}>
                  <div onClick={() => setOpenRelease(isOpen ? null : r.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "12px 16px", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {r.artworkUrl && <img src={r.artworkUrl} alt={r.title} style={{ width: 32, height: 32, objectFit: "cover" }} />}
                      <div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>{r.title}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{r.artist}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ textAlign: "right" }}>
                        {rAvg && <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>{rAvg}</div>}
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)" }}>{rFb.length} feedback</div>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderTop: "none" }}>
                      {rFb.length === 0 ? (
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "24px 0" }}>No feedback yet for this release.</div>
                      ) : [...rFb].reverse().map((f, i) => (
                        <div key={i} style={{ padding: "16px", borderBottom: i < rFb.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{f.name}</span>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.2)", marginLeft: 10 }}>{new Date(f.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            </div>
                            <StarRating value={f.rating} readonly />
                          </div>
                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, margin: 0 }}>{f.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

const ReleaseCard = ({ release, feedbacks, onOpen }) => {
  const relFb = feedbacks.filter(f => f.releaseId === release.id);
  const avg = relFb.length ? (relFb.reduce((s, f) => s + f.rating, 0) / relFb.length).toFixed(1) : null;
  const trackCount = release.tracks ? release.tracks.length : 0;

  return (
    <div onClick={() => onOpen(release)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", transition: "all 0.25s", position: "relative", overflow: "hidden" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {release.artworkUrl ? (
        <div style={{ width: "100%", paddingTop: "56%", position: "relative", overflow: "hidden" }}>
          <img src={release.artworkUrl} alt={release.title} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(14,32,96,0.9) 100%)" }} />
          {avg && (
            <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(14,32,96,0.85)", border: "1px solid rgba(255,255,255,0.15)", padding: "6px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", lineHeight: 1 }}>{avg}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{relFb.length} fb</div>
            </div>
          )}
        </div>
      ) : avg ? (
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", lineHeight: 1, textAlign: "right" }}>{avg}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: "rgba(255,255,255,0.3)", textAlign: "right" }}>{relFb.length} fb</div>
        </div>
      ) : null}

      <div style={{ padding: "18px 22px 22px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 }}>{release.label}</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 3 }}>{release.title}</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 14 }}>{release.artist}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          {release.genre && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#fff", background: "rgba(255,255,255,0.1)", padding: "3px 10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{release.genre}</span>}
          {release.date && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{new Date(release.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {trackCount > 0 && <Badge label={`${trackCount} tracks`} />}
          {release.pdfUrl && <Badge label="Press Kit" />}
          {release.soundcloudUrl && <Badge label="SoundCloud" />}
          {release.spotifyUrl && <Badge label="Spotify" />}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 18, right: 18, fontFamily: "'DM Mono', monospace", fontSize: 16, color: "rgba(255,255,255,0.15)" }}>→</div>
    </div>
  );
};

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
        const [r, f] = await Promise.all([dbGetReleases(), dbGetFeedbacks()]);
        setReleases(r.map(mapRelease));
        setFeedbacks(f.map(mapFeedback));
      } catch (e) { console.error("Load error:", e); }
      setLoading(false);
    };
    load();
  }, []);

  const addRelease = async (rel) => {
    await dbAddRelease(rel);
    const r = await dbGetReleases();
    setReleases(r.map(mapRelease));
  };

  const deleteRelease = async (id) => {
    await dbDeleteRelease(id);
    setReleases(prev => prev.filter(r => r.id !== id));
  };

  const addFeedback = async (fb) => {
    await dbAddFeedback(fb);
    const f = await dbGetFeedbacks();
    setFeedbacks(f.map(mapFeedback));
  };

  const unlock = () => {
    if (adminKey === "FP#xQ9!mZ4@press") {
      setAdminUnlocked(true); setAdminPrompt(false); setShowAdmin(true); setAdminError(false);
    } else {
      setAdminError(true); setAdminKey("");
    }
  };

  if (loading) return (
    <div style={{ background: "#0e1e5e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <StarLogo size={56} />
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
          <StarLogo size={34} />
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase" }}>Future Pressure</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.25em", textTransform: "uppercase", marginTop: 1 }}>Promo Portal</div>
          </div>
        </div>
        <button onClick={() => adminUnlocked ? setShowAdmin(true) : setAdminPrompt(true)}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", padding: "8px 16px", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1d52b8"; e.currentTarget.style.borderColor = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
        >+ Add</button>
      </nav>

      <div style={{ padding: "72px 32px 52px", maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.03, pointerEvents: "none" }}><StarLogo size={320} /></div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.45em", textTransform: "uppercase", marginBottom: 18 }}>Underground Electronic Music</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(32px, 6vw, 58px)", color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.05, margin: "0 0 20px" }}>Promo Releases</h1>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", lineHeight: 2.2, maxWidth: 420, margin: "0 auto" }}>
          Listen to the preview, leave your feedback<br />and unlock the downloads.
        </p>
        <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.15)", margin: "36px auto 0" }} />
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 100px" }}>
        {releases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.25em" }}>NO RELEASES UPLOADED YET</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
            {releases.map(r => <ReleaseCard key={r.id} release={r} feedbacks={feedbacks} onOpen={setActiveRelease} />)}
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StarLogo size={18} color="rgba(255,255,255,0.25)" />
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
            <input
              type="password"
              placeholder="Password"
              value={adminKey}
              onChange={e => { setAdminKey(e.target.value); setAdminError(false); }}
              onKeyDown={e => e.key === "Enter" && unlock()}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              style={{ ...iStyle, borderColor: adminError ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.1)" }}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            {adminError && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,80,80,0.8)", marginTop: 8 }}>Wrong password.</div>}
            <button onClick={unlock} style={{ marginTop: 14, background: "#fff", border: "none", color: "#1d52b8", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", padding: "11px 20px", cursor: "pointer", width: "100%", fontWeight: 700 }}>Enter</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
