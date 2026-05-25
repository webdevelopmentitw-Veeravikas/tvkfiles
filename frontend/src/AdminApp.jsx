import { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API = "http://localhost:4000/api";
const API_ORIGIN = API.replace(/\/api$/, "");

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#080a0f;--bg2:#0f1219;--bg3:#161b26;--bg4:#1e2433;
  --border:#252b3a;--border2:#323a4d;--border3:#3f4860;
  --text:#eef0f6;--text2:#9aa3b5;--text3:#636d82;--text4:#454e62;
  --accent:#f43f5e;--accent2:#fb7185;--accent3:#fda4af;
  --yellow:#fbbf24;--purple:#a855f7;--blue:#3b82f6;--green:#22c55e;--orange:#f97316;--cyan:#06b6d4;
  --red:#ef4444;
  --font:'Source Sans 3',system-ui,-apple-system,'Segoe UI',sans-serif;
  --font-ta:'Noto Sans Tamil','Source Sans 3',system-ui,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,monospace;
  --sidebar:252px;
  --radius:10px;
  --shadow:0 4px 24px rgba(0,0,0,0.35);
  --shadow-lg:0 12px 40px rgba(0,0,0,0.45);
}
html.lang-ta body{font-family:var(--font-ta)}
html.lang-en body{font-family:var(--font)}
body{background:var(--bg);color:var(--text);font-size:15px;line-height:1.65;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
a{color:inherit;text-decoration:none}
button{cursor:pointer;font-family:inherit}
html.lang-en input,html.lang-en select,html.lang-en textarea{font-family:var(--font)}
html.lang-ta input,html.lang-ta select,html.lang-ta textarea{font-family:var(--font-ta)}
h1,h2,h3,h4{font-family:inherit;font-weight:700;letter-spacing:-0.02em;line-height:1.2}
html.lang-ta h1,html.lang-ta h2,html.lang-ta h3,html.lang-ta h4{font-family:var(--font-ta);letter-spacing:0}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}

/* ── Layout ── */
.app-shell{display:flex;min-height:100vh}
.sidebar{
  width:var(--sidebar);background:var(--bg2);border-right:1px solid var(--border);
  display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:200;
  transition:transform 0.25s;
}
.sidebar-logo{
  padding:20px 16px 16px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;gap:10px;
}
.logo-badge{background:var(--accent);color:#fff;font-size:10px;font-family:var(--mono);
  padding:2px 7px;border-radius:3px;font-weight:700;letter-spacing:1px}
.logo-text{font-size:16px;font-weight:800;color:var(--accent);letter-spacing:-0.5px}
.sidebar-user{
  padding:12px 16px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;gap:10px;
}
.avatar{width:32px;height:32px;border-radius:50%;background:var(--accent);
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;flex-shrink:0}
.user-info{flex:1;min-width:0}
.user-name{font-size:13px;font-weight:700;truncate:true;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.user-role{font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:1px}
.sidebar-nav{flex:1;overflow-y:auto;padding:8px 0}
.nav-section{padding:8px 16px 4px;font-family:var(--mono);font-size:9px;color:var(--text4);text-transform:uppercase;letter-spacing:1.5px}
.nav-item{
  display:flex;align-items:center;gap:10px;padding:9px 16px;
  color:var(--text2);font-size:13px;font-weight:600;transition:all 0.15s;
  border-left:2px solid transparent;cursor:pointer;
}
.nav-item:hover{color:var(--text);background:var(--bg3)}
.nav-item.active{color:var(--accent);background:rgba(244,63,94,0.08);border-left-color:var(--accent)}
.nav-item .ni-icon{width:18px;text-align:center;font-size:15px}
.nav-item .ni-badge{
  margin-left:auto;background:var(--accent);color:#fff;
  font-family:var(--mono);font-size:9px;padding:1px 6px;border-radius:10px
}
.sidebar-footer{padding:12px 16px;border-top:1px solid var(--border)}
.logout-btn{
  width:100%;background:none;border:1px solid var(--border2);color:var(--text2);
  padding:8px;border-radius:var(--radius);font-size:12px;font-family:var(--mono);
  transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px
}
.logout-btn:hover{border-color:var(--accent);color:var(--accent)}

/* ── Main ── */
.main-area{margin-left:var(--sidebar);flex:1;display:flex;flex-direction:column;min-height:100vh}
.topbar{
  height:56px;background:var(--bg2);border-bottom:1px solid var(--border);
  display:flex;align-items:center;padding:0 24px;gap:16px;position:sticky;top:0;z-index:100
}
.topbar-title{font-size:16px;font-weight:800;letter-spacing:-0.3px;flex:1}
.topbar-actions{display:flex;gap:8px;align-items:center}
.page{padding:24px;flex:1}

/* ── Cards / Panels ── */
.panel{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
.panel-header{
  padding:14px 18px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;gap:12px
}
.panel-title{font-size:14px;font-weight:700;letter-spacing:-0.2px}
.panel-body{padding:18px}

/* ── Stats Row ── */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:24px}
.stat-card{
  background:linear-gradient(145deg,var(--bg2),var(--bg3));border:1px solid var(--border);
  border-radius:var(--radius);padding:16px;display:flex;flex-direction:column;gap:4px;
  transition:transform 0.2s,border-color 0.2s,box-shadow 0.2s
}
.stat-card:hover{transform:translateY(-2px);border-color:var(--border2);box-shadow:var(--shadow)}
.stat-num{font-size:28px;font-weight:800;letter-spacing:-1px;line-height:1}
.stat-lbl{font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:1px}
.stat-sub{font-family:var(--mono);font-size:11px;color:var(--text2);margin-top:2px}

/* ── Tables ── */
.table-wrap{overflow-x:auto;border-radius:var(--radius)}
table{width:100%;border-collapse:collapse}
thead tr{background:var(--bg3)}
th{padding:10px 14px;font-family:var(--mono);font-size:10px;color:var(--text3);text-align:left;text-transform:uppercase;letter-spacing:1px;font-weight:700;white-space:nowrap;border-bottom:1px solid var(--border)}
td{padding:11px 14px;border-bottom:1px solid var(--border);font-size:13px;vertical-align:middle}
tr:hover td{background:var(--bg3)}
tr:last-child td{border-bottom:none}
.td-mono{font-family:var(--mono);font-size:11px}
.td-truncate{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── Badges ── */
.badge{display:inline-flex;align-items:center;padding:3px 8px;border-radius:3px;font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:0.5px;white-space:nowrap}
.badge-green{background:rgba(34,197,94,0.12);color:var(--green);border:1px solid rgba(34,197,94,0.25)}
.badge-red{background:rgba(239,68,68,0.12);color:var(--red);border:1px solid rgba(239,68,68,0.25)}
.badge-yellow{background:rgba(251,191,36,0.12);color:var(--yellow);border:1px solid rgba(251,191,36,0.25)}
.badge-blue{background:rgba(59,130,246,0.12);color:var(--blue);border:1px solid rgba(59,130,246,0.25)}
.badge-purple{background:rgba(168,85,247,0.12);color:var(--purple);border:1px solid rgba(168,85,247,0.25)}
.badge-orange{background:rgba(249,115,22,0.12);color:var(--orange);border:1px solid rgba(249,115,22,0.25)}
.badge-gray{background:var(--bg3);color:var(--text2);border:1px solid var(--border)}
.badge-cyan{background:rgba(6,182,212,0.12);color:var(--cyan);border:1px solid rgba(6,182,212,0.25)}

/* ── Buttons ── */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--radius);font-size:12px;font-weight:700;border:1px solid transparent;transition:all 0.18s;white-space:nowrap;letter-spacing:0.2px}
.btn-primary{background:var(--accent);color:#fff;border-color:var(--accent)}
.btn-primary:hover{background:var(--accent2)}
.btn-secondary{background:var(--bg3);color:var(--text);border-color:var(--border2)}
.btn-secondary:hover{border-color:var(--border3);background:var(--bg4)}
.btn-danger{background:rgba(239,68,68,0.12);color:var(--red);border-color:rgba(239,68,68,0.3)}
.btn-danger:hover{background:var(--red);color:#fff}
.btn-success{background:rgba(34,197,94,0.12);color:var(--green);border-color:rgba(34,197,94,0.3)}
.btn-success:hover{background:var(--green);color:#000}
.btn-sm{padding:5px 10px;font-size:11px}
.btn-icon{padding:6px;background:none;border:1px solid var(--border);color:var(--text2);border-radius:var(--radius)}
.btn-icon:hover{border-color:var(--accent);color:var(--accent)}
.btn:disabled{opacity:0.4;cursor:not-allowed}

/* ── Forms ── */
.form-group{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.form-label{font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:1px}
.form-label span{color:var(--accent)}
.form-input,.form-select,.form-textarea{
  background:var(--bg3);border:1px solid var(--border2);color:var(--text);
  padding:9px 12px;border-radius:var(--radius);font-size:13px;outline:none;
  transition:border-color 0.2s;width:100%
}
.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--accent)}
.form-input::placeholder,.form-textarea::placeholder{color:var(--text4)}
.form-textarea{resize:vertical;min-height:100px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}

/* ── Upload Zone ── */
.upload-zone{
  border:2px dashed var(--border2);border-radius:var(--radius);
  padding:32px 20px;text-align:center;transition:all 0.2s;cursor:pointer;
  background:var(--bg3);
}
.upload-zone:hover,.upload-zone.drag-over{border-color:var(--accent);background:rgba(244,63,94,0.04)}
.upload-zone-icon{font-size:32px;margin-bottom:10px}
.upload-zone-text{font-size:14px;font-weight:700;margin-bottom:4px}
.upload-zone-sub{font-family:var(--mono);font-size:11px;color:var(--text3)}
.file-list{display:flex;flex-direction:column;gap:8px;margin-top:14px}
.file-item{
  background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);
  padding:10px 12px;display:flex;align-items:center;gap:10px
}
.file-icon{font-size:20px;flex-shrink:0}
.file-info{flex:1;min-width:0}
.file-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.file-meta{font-family:var(--mono);font-size:10px;color:var(--text3)}
.file-progress{height:3px;background:var(--border);border-radius:2px;margin-top:5px}
.file-progress-bar{height:100%;background:var(--accent);border-radius:2px;transition:width 0.3s}
.file-status{font-family:var(--mono);font-size:10px;font-weight:700}

/* ── Modal ── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:var(--bg2);border:1px solid var(--border2);border-radius:12px;width:100%;max-width:640px;max-height:88vh;overflow-y:auto;position:relative}
.modal-lg{max-width:820px}
.modal-header{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;background:var(--bg2);z-index:1}
.modal-title{font-size:15px;font-weight:800;letter-spacing:-0.3px}
.modal-close{background:var(--bg3);border:1px solid var(--border2);color:var(--text2);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0}
.modal-close:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
.modal-body{padding:20px 22px}
.modal-footer{padding:14px 22px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:8px}

/* ── Toast ── */
.toast-container{position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px}
.toast{background:var(--bg2);border:1px solid var(--border2);padding:10px 16px;border-radius:var(--radius);font-family:var(--mono);font-size:12px;display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,0.4);animation:toastIn 0.25s ease;min-width:260px}
.toast-success{border-color:rgba(34,197,94,0.4);color:var(--green)}
.toast-error{border-color:rgba(239,68,68,0.4);color:var(--red)}
.toast-info{border-color:rgba(59,130,246,0.4);color:var(--blue)}
@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* ── Login ── */
.login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:20px;position:relative;overflow:hidden}
.login-page::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% -5%,rgba(244,63,94,0.1),transparent);pointer-events:none}
.login-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:36px;width:100%;max-width:400px;position:relative}
.login-logo{display:flex;align-items:center;gap:10px;margin-bottom:28px}
.login-title{font-size:22px;font-weight:800;margin-bottom:6px;letter-spacing:-0.5px}
.login-sub{font-size:14px;color:var(--text2);margin-bottom:24px;line-height:1.5}
.login-error{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:var(--red);padding:10px 14px;border-radius:var(--radius);font-size:13px;margin-bottom:16px}

/* ── Pagination ── */
.pagination{display:flex;align-items:center;gap:6px;margin-top:16px;justify-content:flex-end}
.page-btn{background:var(--bg3);border:1px solid var(--border2);color:var(--text2);width:30px;height:30px;border-radius:var(--radius);font-family:var(--mono);font-size:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s}
.page-btn:hover{border-color:var(--accent);color:var(--accent)}
.page-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}
.page-btn:disabled{opacity:0.3;cursor:not-allowed}

/* ── Toolbar ── */
.toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.search-field{position:relative;flex:1;min-width:180px}
.search-field-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text3);font-size:13px;pointer-events:none}
.search-field input{padding-left:32px}

/* ── Confirm ── */
.confirm-msg{font-family:var(--mono);font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:4px}

/* ── Role colors ── */
.role-superadmin{color:#f43f5e}
.role-admin{color:#f97316}
.role-moderator{color:#3b82f6}
.role-viewer{color:#22c55e}

/* ── Severity ── */
.sev-critical{color:#ef4444}
.sev-high{color:#f97316}
.sev-medium{color:#eab308}
.sev-low{color:#22c55e}

/* ── Misc ── */
.divider{height:1px;background:var(--border);margin:16px 0}
.text-mono{font-family:var(--mono);font-size:11px;color:var(--text2)}
.text-muted{color:var(--text3)}
.gap-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.spinner-wrap{display:flex;align-items:center;justify-content:center;padding:40px;color:var(--text3);font-family:var(--mono);font-size:12px;gap:10px}
.spinner{width:16px;height:16px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;animation:spin 0.7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.empty-state{text-align:center;padding:48px 20px;color:var(--text3);font-family:var(--mono);font-size:12px}
.empty-state-icon{font-size:36px;margin-bottom:10px}

/* ── Political Incident Layout ── */
.political-app{min-height:100vh;background:var(--bg);position:relative}
.political-app::before{
  content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px);
  background-size:48px 48px;mask-image:linear-gradient(to bottom,black 0%,transparent 85%)
}
.pol-masthead{
  position:sticky;top:0;z-index:200;
  background:rgba(8,10,15,0.88);backdrop-filter:blur(16px) saturate(1.2);
  border-bottom:1px solid var(--border)
}
.pol-masthead-accent{height:3px;background:linear-gradient(90deg,var(--accent),#f97316 35%,var(--purple) 70%,var(--blue))}
.pol-masthead-inner{
  max-width:1280px;margin:0 auto;
  display:flex;align-items:center;justify-content:space-between;
  padding:14px clamp(16px,4vw,28px);gap:16px
}
.pol-brand{display:flex;align-items:center;gap:14px}
.pol-brand-mark{
  width:42px;height:42px;border-radius:10px;
  background:linear-gradient(135deg,var(--accent),#be123c);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--mono);font-size:11px;font-weight:800;color:#fff;
  box-shadow:0 4px 16px rgba(244,63,94,0.35)
}
.pol-brand-title{font-size:20px;font-weight:700;letter-spacing:-0.02em;line-height:1.1}
html.lang-ta .pol-brand-title{letter-spacing:0}
.pol-brand-title span{color:var(--accent)}
.pol-brand-tag{font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:3px;letter-spacing:0.4px}
.pol-hero{
  position:relative;z-index:1;
  padding:clamp(28px,5vw,48px) clamp(16px,4vw,28px) clamp(24px,4vw,36px);
  border-bottom:1px solid var(--border);overflow:hidden
}
.pol-hero::after{
  content:'';position:absolute;top:-40%;right:-10%;width:55%;height:140%;
  background:radial-gradient(ellipse,rgba(244,63,94,0.12),transparent 65%);
  pointer-events:none
}
.pol-hero-inner{max-width:1280px;margin:0 auto;position:relative;z-index:1}
.pol-live-pill{
  display:inline-flex;align-items:center;gap:8px;
  font-family:var(--mono);font-size:10px;font-weight:700;
  letter-spacing:1.5px;text-transform:uppercase;color:var(--accent);
  padding:6px 14px;border-radius:999px;
  border:1px solid rgba(244,63,94,0.3);background:rgba(244,63,94,0.08);
  margin-bottom:18px
}
.pol-live-dot{width:7px;height:7px;border-radius:50%;background:var(--accent);animation:polPulse 2s ease infinite}
@keyframes polPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
.pol-hero h1{font-size:clamp(28px,5vw,48px);font-weight:800;letter-spacing:-0.03em;line-height:1.08;margin-bottom:14px;max-width:780px}
html.lang-ta .pol-hero h1{letter-spacing:0;font-weight:700}
.pol-hero h1 em{font-style:normal;color:var(--accent);font-weight:800}
html.lang-ta .pol-hero h1 em{font-weight:700}
.pol-hero-lead{font-size:clamp(14px,2vw,16px);color:var(--text2);line-height:1.75;max-width:620px;margin-bottom:28px;font-weight:400}
.pol-dash{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));
  gap:1px;background:var(--border);border:1px solid var(--border);
  border-radius:14px;overflow:hidden;box-shadow:var(--shadow)
}
.pol-dash-cell{
  background:linear-gradient(180deg,var(--bg2),var(--bg3));
  padding:18px 16px;display:flex;flex-direction:column;gap:6px;
  transition:background 0.2s
}
.pol-dash-cell:hover{background:var(--bg4)}
.pol-dash-num{font-size:32px;font-weight:800;letter-spacing:-1px;line-height:1}
.pol-dash-lbl{font-family:var(--mono);font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:1px}
.pol-dash-icon{font-size:18px;opacity:0.85}
.pol-layout{
  position:relative;z-index:1;max-width:1280px;margin:0 auto;
  display:grid;grid-template-columns:260px 1fr;gap:28px;
  padding:28px clamp(16px,4vw,28px) 48px
}
.pol-sidebar{position:sticky;top:88px;align-self:start;display:flex;flex-direction:column;gap:20px}
.pol-panel{background:var(--bg2);border:1px solid var(--border);border-radius:14px;overflow:hidden}
.pol-panel-head{
  padding:12px 16px;border-bottom:1px solid var(--border);
  font-family:var(--mono);font-size:9px;font-weight:700;
  text-transform:uppercase;letter-spacing:1.2px;color:var(--text3);
  background:rgba(0,0,0,0.2)
}
.pol-panel-body{padding:14px 16px}
.pol-cat-row{
  display:flex;align-items:center;gap:10px;padding:8px 0;
  border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;
  transition:opacity 0.15s
}
.pol-cat-row:last-child{border-bottom:none}
.pol-cat-row:hover{opacity:0.85}
.pol-cat-row.active .pol-cat-name{color:var(--text)}
.pol-cat-bar{flex:1;height:4px;background:var(--bg4);border-radius:2px;overflow:hidden}
.pol-cat-fill{height:100%;border-radius:2px;transition:width 0.4s}
.pol-cat-name{font-size:12px;font-weight:600;color:var(--text2);min-width:90px}
.pol-cat-count{font-family:var(--mono);font-size:11px;color:var(--text3);min-width:24px;text-align:right}
.pol-feed-head{
  display:flex;align-items:center;justify-content:space-between;
  gap:12px;margin-bottom:20px;flex-wrap:wrap
}
.pol-feed-title{font-size:18px;font-weight:800;letter-spacing:-0.3px}
.pol-feed-title span{color:var(--text3);font-weight:600;font-size:14px;margin-left:8px}
.pol-search-bar{
  display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap
}
.pol-search-bar .pub-search-wrap{flex:1;min-width:220px}
.pol-featured{
  display:grid;grid-template-columns:1.2fr 1fr;gap:0;
  background:var(--bg2);border:1px solid var(--border);border-radius:16px;
  overflow:hidden;margin-bottom:24px;cursor:pointer;
  transition:transform 0.25s,box-shadow 0.25s,border-color 0.25s;
  box-shadow:var(--shadow)
}
.pol-featured:hover{transform:translateY(-2px);box-shadow:var(--shadow-lg);border-color:rgba(244,63,94,0.3)}
.pol-featured-img-wrap{position:relative;min-height:280px;background:var(--bg4)}
.pol-featured-img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}
.pol-featured-img-wrap::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(to right,transparent 40%,var(--bg2) 95%)
}
.pol-featured-badge{
  position:absolute;top:16px;left:16px;z-index:2;
  font-family:var(--mono);font-size:9px;font-weight:700;
  text-transform:uppercase;letter-spacing:1px;
  padding:5px 10px;border-radius:6px;background:rgba(0,0,0,0.65);
  color:var(--yellow);border:1px solid rgba(251,191,36,0.3)
}
.pol-featured-body{padding:28px 24px;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:1}
.pol-featured-cat{font-family:var(--mono);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.pol-featured-title{font-size:clamp(18px,2.5vw,24px);font-weight:700;line-height:1.3;letter-spacing:-0.02em;margin-bottom:12px}
html.lang-ta .pol-featured-title{letter-spacing:0}
.pol-featured-desc{font-size:14px;color:var(--text2);line-height:1.7;margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-weight:400}
.pol-featured-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-family:var(--mono);font-size:10px;color:var(--text3)}
.pol-featured-cta{
  margin-top:18px;display:inline-flex;align-items:center;gap:6px;
  font-size:12px;font-weight:700;color:var(--accent)
}
.pol-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:18px}
.pol-card{
  position:relative;background:var(--bg2);border:1px solid var(--border);
  border-radius:14px;overflow:hidden;cursor:pointer;
  transition:transform 0.22s,box-shadow 0.22s,border-color 0.22s;
  display:flex;flex-direction:column
}
.pol-card::before{
  content:'';position:absolute;left:0;top:0;bottom:0;width:4px;z-index:2;
  background:var(--cat-accent,var(--accent))
}
.pol-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:var(--border2)}
.pol-card-img{width:100%;height:150px;object-fit:cover;background:var(--bg4)}
.pol-card-body{padding:16px 16px 16px 20px;flex:1;display:flex;flex-direction:column}
.pol-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:10px}
.pol-card-cat{font-family:var(--mono);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
.pol-card-sev{font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;background:var(--bg4);border:1px solid var(--border)}
.pol-card-title{font-size:16px;font-weight:600;line-height:1.35;letter-spacing:-0.01em;margin-bottom:8px;flex:1}
html.lang-ta .pol-card-title{letter-spacing:0;font-weight:600}
.pol-card-desc{font-size:13px;color:var(--text2);line-height:1.65;-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden;margin-bottom:12px;font-weight:400}
.pol-card-foot{
  padding:10px 16px 12px 20px;border-top:1px solid var(--border);
  display:flex;justify-content:space-between;align-items:center;gap:8px;
  background:rgba(0,0,0,0.15)
}
.pol-card-meta{font-family:var(--mono);font-size:10px;color:var(--text3)}
.pol-card-status{font-family:var(--mono);font-size:9px;padding:3px 8px;border-radius:4px;border:1px solid var(--border)}
.pol-card-source{
  margin:0 16px 10px 20px;padding:6px 10px;border-radius:6px;
  font-family:var(--mono);font-size:10px;font-weight:700;
  background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);
  color:var(--blue);display:inline-flex;align-items:center;gap:4px;
  max-width:calc(100% - 36px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap
}
.pol-card-source:hover{color:var(--accent);border-color:rgba(244,63,94,0.3)}
.pol-card-tags{padding:0 16px 8px 20px;display:flex;flex-wrap:wrap;gap:4px}
.pol-card-tag{font-family:var(--mono);font-size:9px;padding:2px 7px;border-radius:3px;background:var(--bg4);border:1px solid var(--border);color:var(--text3)}
.pol-footer{
  border-top:1px solid var(--border);padding:20px clamp(16px,4vw,28px);
  text-align:center;font-family:var(--mono);font-size:10px;color:var(--text4);
  position:relative;z-index:1
}
.dossier-modal{max-width:900px!important;border-radius:16px!important;overflow:hidden}
.dossier-header{
  padding:24px 28px;border-bottom:1px solid var(--border);
  background:linear-gradient(135deg,var(--bg3),var(--bg2));position:relative
}
.dossier-ribbon{
  position:absolute;top:0;left:0;right:0;height:4px;
  background:var(--cat-accent,var(--accent))
}
.dossier-cat{font-family:var(--mono);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px}
.dossier-title{font-size:clamp(18px,3vw,24px);font-weight:700;line-height:1.3;letter-spacing:-0.02em;padding-right:40px}
html.lang-ta .dossier-title{letter-spacing:0}
.dossier-meta-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.dossier-pill{
  font-family:var(--mono);font-size:10px;padding:4px 10px;border-radius:6px;
  background:var(--bg4);border:1px solid var(--border);color:var(--text2)
}
.dossier-body{padding:24px 28px}
.dossier-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:20px 0}
.dossier-field{background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px 14px}
.dossier-field-lbl{font-family:var(--mono);font-size:8px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.dossier-field-val{font-size:13px;font-weight:600}
.lang-toggle{display:inline-flex;align-items:center;gap:0;background:var(--bg3);border:1px solid var(--border2);border-radius:999px;padding:3px}
.lang-btn{background:transparent;border:none;color:var(--text3);padding:6px 14px;font-size:11px;font-weight:700;border-radius:999px;transition:all 0.2s;min-width:52px}
html.lang-en .lang-btn{font-family:var(--font);font-weight:600}
html.lang-ta .lang-btn{font-family:var(--font-ta);font-weight:600}
.lang-btn:hover{color:var(--text2)}
.lang-btn.active{background:var(--accent);color:#fff;box-shadow:0 2px 8px rgba(244,63,94,0.35)}
.pub-search-wrap{position:relative;flex:1;min-width:200px}
.pub-search-wrap .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}
.pub-search-wrap input{padding-left:38px!important;background:var(--bg3)!important;border-radius:10px!important}
.filter-chip{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid var(--border2);background:var(--bg3);color:var(--text2);transition:all 0.18s;cursor:pointer}
.filter-chip:hover{border-color:var(--border3);color:var(--text)}
.filter-chip.active{color:#fff;box-shadow:0 2px 10px rgba(0,0,0,0.25)}
.incident-image{width:100%;max-height:360px;object-fit:cover;border-radius:12px;border:1px solid var(--border);display:block}
.incident-images{display:flex;flex-direction:column;gap:12px;margin-bottom:20px}
.source-link{display:inline-flex;align-items:center;gap:6px;color:var(--blue);font-family:var(--mono);font-size:12px;word-break:break-all}
.source-link:hover{color:var(--accent)}
.attachment-list{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.attachment-item{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:10px;font-size:12px;transition:border-color 0.15s}
.attachment-item:hover{border-color:var(--border3)}

@media(max-width:960px){
  .pol-layout{grid-template-columns:1fr}
  .pol-sidebar{position:static;display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .pol-featured{grid-template-columns:1fr}
  .pol-featured-img-wrap{min-height:200px}
  .pol-featured-img-wrap::after{background:linear-gradient(to top,var(--bg2),transparent 60%)}
}
@media(max-width:640px){
  .pol-sidebar{grid-template-columns:1fr}
  .pol-dash{grid-template-columns:repeat(2,1fr)}
}

@media(max-width:768px){
  .sidebar{transform:translateX(-100%)}
  .sidebar.open{transform:translateX(0)}
  .main-area{margin-left:0}
  .form-row,.form-row-3{grid-template-columns:1fr}
  .stats-grid{grid-template-columns:1fr 1fr}
}
`;

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const CATEGORY_DEFS = [
  { id: "all", icon: "⬛", color: "#6b7280" },
  { id: "corruption", icon: "💰", color: "#ef4444" },
  { id: "crime", icon: "🚨", color: "#f97316" },
  { id: "broken-promise", icon: "📜", color: "#a855f7" },
  { id: "admin-failure", icon: "🏛️", color: "#3b82f6" },
  { id: "honour-killing", icon: "🕯️", color: "#be123c" },
  { id: "loss-investments", icon: "📉", color: "#ca8a04" },
  { id: "insta-cards", icon: "📱", color: "#db2777" },
];
const SEVERITY_COLORS = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" };
const SEVERITY_KEYS = ["critical", "high", "medium", "low"];
const STATUS_KEYS = ["under-investigation", "unresolved", "fir-filed", "partially-resolved", "nhrc-notice", "resolved"];
const DISTRICT_KEYS = ["all", "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Vellore", "Thanjavur", "Tiruvarur", "Statewide"];

const TRANSLATIONS = {
  en: {
    cat_all: "All", cat_corruption: "Corruption", cat_crime: "Crime", cat_broken_promise: "Broken Promises", cat_admin_failure: "Admin Failure",
    cat_honour_killing: "Honour Killing", cat_loss_investments: "Investment Loss", cat_insta_cards: "Instagram Cards",
    status_under_investigation: "Under Investigation", status_unresolved: "Unresolved", status_fir_filed: "FIR Filed",
    status_partially_resolved: "Partially Resolved", status_nhrc_notice: "NHRC Notice", status_resolved: "Resolved",
    district_all: "All Districts", district_Statewide: "Statewide",
    livePublicTracker: "Live Public Tracker",
    heroTitle: "Tracking TVK", heroAccent: "Corruption & Crimes",
    heroSub: "Public-interest documentation of corruption, crime, broken promises, honour killings, investment fraud, Instagram scams, and administrative failures.",
    statTotalFiles: "Total Files", statCorruption: "Corruption", statCrime: "Crime", statBrokenPromises: "Broken Promises", statCritical: "Critical",
    searchIncidents: "Search incidents…", showingOf: "Showing", of: "of", incidents: "incidents",
    loadingIncidents: "Loading incidents…", noIncidentsMatch: "No incidents match your filters.",
    district: "District", date: "Date", severity: "Severity", status: "Status", source: "Source",
    sourceLink: "Source Link", attachments: "Attachments", uploadImages: "Incident Images & Files",
    uploadImagesSub: "Images, PDFs, videos · Max 20MB · Up to 5 files", viewSource: "View source article", openAttachment: "Open attachment",
    adminLogin: "Admin Login", adminPanel: "Admin Panel",
    navPostNews: "Post News", navViewSite: "View Site", pagePostNews: "Post News", pagePublicSite: "Public Site",
    viewPublicSite: "View Public Site", admin: "Admin",
    loginTitle: "Admin Login", loginSub: "Sign in to post and manage news", username: "Username", password: "Password",
    signIn: "Sign In", signingIn: "Signing in…", fillBothFields: "Please fill in both fields",
    adminAccessOnly: "Admin access only. Public users can view posts without logging in.",
    postNews: "Post News", editNews: "Edit News", publishNews: "Publish News", saveChanges: "Save Changes",
    cancel: "Cancel", saving: "Saving…", title: "Title", category: "Category", description: "Description",
    titlePlaceholder: "Clear, factual incident title", descPlaceholder: "Detailed neutral factual description of the incident",
    sourcePlaceholder: "The Hindu, Times of India…", tags: "Tags (comma-separated)", tagsPlaceholder: "sand-mining, cadre, Chennai",
    titleDescRequired: "Title and description required", incidentUpdated: "Incident updated", incidentCreated: "Incident created",
    allStatus: "All Status", published: "Published", draft: "Draft", newsPosts: "News Posts",
    loading: "Loading…", noIncidentsFound: "No incidents found", live: "Live", unpublish: "Unpublish", publish: "Publish",
    deleteIncident: "Delete Incident", deleteConfirm: "This will permanently delete the incident and all attached files. This cannot be undone.",
    confirmDelete: "Confirm Delete", confirm: "Confirm", page: "Page",
    unpublished: "Unpublished", incidentDeleted: "Incident deleted",
    actions: "Actions", edit: "Edit", fileRemoved: "File removed", pendingUpload: "Pending",
    sev_critical: "Critical", sev_high: "High", sev_medium: "Medium", sev_low: "Low",
    siteTagline: "Public accountability tracker",     filterCategory: "Category", filterDistrict: "District",
    langEnglish: "English", langTamil: "Tamil",
    latestReports: "Latest Reports", featuredReport: "Featured Investigation",
    accountabilityIndex: "Accountability Index", readReport: "Read full report",
    investigationDossier: "Investigation Dossier", allCategories: "All categories",
    district_Chennai: "Chennai", district_Coimbatore: "Coimbatore", district_Madurai: "Madurai",
    district_Tiruchirappalli: "Tiruchirappalli", district_Salem: "Salem", district_Vellore: "Vellore",
    district_Thanjavur: "Thanjavur", district_Tiruvarur: "Tiruvarur",
  },
  ta: {
    cat_all: "அனைத்தும்", cat_corruption: "ஊழல்", cat_crime: "குற்றம்", cat_broken_promise: "முறிந்த வாக்குறுதிகள்", cat_admin_failure: "நிர்வாக தோல்வி",
    cat_honour_killing: "கொள்கைக் கொலை", cat_loss_investments: "முதலீட்டு நஷ்டம்", cat_insta_cards: "இன்ஸ்டா கார்ட் மோசடி",
    status_under_investigation: "விசாரணையில்", status_unresolved: "தீர்க்கப்படாதது", status_fir_filed: "FIR பதிவு",
    status_partially_resolved: "பகுதியாக தீர்க்கப்பட்டது", status_nhrc_notice: "NHRC அறிவிப்பு", status_resolved: "தீர்க்கப்பட்டது",
    district_all: "அனைத்து மாவட்டங்கள்", district_Statewide: "முழு மாநிலம்",
    livePublicTracker: "நேரடி பொதுப் பதிவு",
    heroTitle: "தவெக", heroAccent: "ஊழல் & குற்றங்களை கண்காணித்தல்",
    heroSub: "ஊழல், குற்றம், முறிந்த வாக்குறுதிகள், கொள்கைக் கொலை, முதலீட்டு மோசடி, இன்ஸ்டா கார்ட் மோசடி மற்றும் நிர்வாக தோல்விகளின் பொதுநல ஆவணப்படுத்தல்.",
    statTotalFiles: "மொத்த கோப்புகள்", statCorruption: "ஊழல்", statCrime: "குற்றம்", statBrokenPromises: "முறிந்த வாக்குறுதிகள்", statCritical: "முக்கிய",
    searchIncidents: "சம்பவங்களை தேடு…", showingOf: "காட்டப்படுவது", of: "இல்", incidents: "சம்பவங்கள்",
    loadingIncidents: "சம்பவங்கள் ஏற்றப்படுகின்றன…", noIncidentsMatch: "உங்கள் வடிகட்டிகளுக்கு பொருந்தும் சம்பவங்கள் இல்லை.",
    district: "மாவட்டம்", date: "தேதி", severity: "தீவிரம்", status: "நிலை", source: "ஆதாரம்",
    sourceLink: "ஆதார இணைப்பு", attachments: "இணைப்புகள்", uploadImages: "சம்பவ படங்கள் & கோப்புகள்",
    uploadImagesSub: "படங்கள், PDF, வீடியோ · அதிகபட்சம் 20MB · 5 கோப்புகள் வரை", viewSource: "ஆதார கட்டுரை பார்", openAttachment: "இணைப்பை திற",
    adminLogin: "நிர்வாக உள்நுழைவு", adminPanel: "நிர்வாக தளம்",
    navPostNews: "செய்தி பதிவு", navViewSite: "தளம் பார்", pagePostNews: "செய்தி பதிவு", pagePublicSite: "பொது தளம்",
    viewPublicSite: "பொது தளம் பார்", admin: "நிர்வாகி",
    loginTitle: "நிர்வாக உள்நுழைவு", loginSub: "செய்தி பதிவு மற்றும் நிர்வகிக்க உள்நுழையுங்கள்", username: "பயனர்பெயர்", password: "கடவுச்சொல்",
    signIn: "உள்நுழை", signingIn: "உள்நுழைகிறது…", fillBothFields: "இரண்டு புலங்களையும் நிரப்பவும்",
    adminAccessOnly: "நிர்வாக அணுகல் மட்டும். பொது பயனர்கள் உள்நுழையாமல் பதிவுகளை பார்க்கலாம்.",
    postNews: "செய்தி பதிவு", editNews: "செய்தி திருத்து", publishNews: "செய்தி வெளியிடு", saveChanges: "மாற்றங்களை சேமி",
    cancel: "ரத்து", saving: "சேமிக்கிறது…", title: "தலைப்பு", category: "வகை", description: "விளக்கம்",
    titlePlaceholder: "தெளிவான, உண்மை சம்பவ தலைப்பு", descPlaceholder: "சம்பவத்தின் விரிவான நடுநிலை விளக்கம்",
    sourcePlaceholder: "தி இந்து, டைம்ஸ் ஆஃப் இந்தியா…", tags: "குறிச்சொற்கள் (கமாவால் பிரிக்க)", tagsPlaceholder: "மணல்-சுரண்டல், cadre, சென்னை",
    titleDescRequired: "தலைப்பு மற்றும் விளக்கம் தேவை", incidentUpdated: "சம்பவம் புதுப்பிக்கப்பட்டது", incidentCreated: "சம்பவம் உருவாக்கப்பட்டது",
    allStatus: "அனைத்து நிலை", published: "வெளியிடப்பட்டது", draft: "வரைவு", newsPosts: "செய்தி பதிவுகள்",
    loading: "ஏற்றுகிறது…", noIncidentsFound: "சம்பவங்கள் இல்லை", live: "நேரலை", unpublish: "நீக்கு", publish: "வெளியிடு",
    deleteIncident: "சம்பவம் நீக்கு", deleteConfirm: "இது சம்பவத்தையும் இணைக்கப்பட்ட கோப்புகளையும் நிரந்தரமாக நீக்கும். இதை மீள முடியாது.",
    confirmDelete: "நீக்க உறுதி", confirm: "உறுதி", page: "பக்கம்",
    unpublished: "வெளியீடு நீக்கப்பட்டது", incidentDeleted: "சம்பவம் நீக்கப்பட்டது",
    actions: "செயல்கள்", edit: "திருத்து", fileRemoved: "கோப்பு நீக்கப்பட்டது", pendingUpload: "நிலுவையில்",
    sev_critical: "முக்கிய", sev_high: "உயர்", sev_medium: "நடுத்தர", sev_low: "குறைந்த",
    siteTagline: "பொது பொறுப்புக்கான பதிவு",     filterCategory: "வகை", filterDistrict: "மாவட்டம்",
    langEnglish: "English", langTamil: "தமிழ்",
    latestReports: "சமீபத்திய அறிக்கைகள்", featuredReport: "முக்கிய விசாரணை",
    accountabilityIndex: "பொறுப்புக்கான குறியீடு", readReport: "முழு அறிக்கை பார்",
    investigationDossier: "விசாரணை ஆவணம்", allCategories: "அனைத்து வகைகள்",
    district_Chennai: "சென்னை", district_Coimbatore: "கோயம்புத்தூர்", district_Madurai: "மதுரை",
    district_Tiruchirappalli: "திருச்சி", district_Salem: "சேலம்", district_Vellore: "வேலூர்",
    district_Thanjavur: "\u0BA4\u0B9E\u0B9A\u0BBE\u0BB5\u0BB0\u0BCD", district_Tiruvarur: "\u0BA4\u0BBF\u0BB0\u0BC1\u0BB5\u0BB0\u0BC2\u0BB0\u0BCD",
  },
};

const LanguageContext = createContext(null);

function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("tvk_lang") || "en");
  useEffect(() => {
    localStorage.setItem("tvk_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.classList.remove("lang-en", "lang-ta");
    document.documentElement.classList.add(`lang-${lang}`);
  }, [lang]);
  const t = useCallback((key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key, [lang]);
  const categories = useMemo(() => CATEGORY_DEFS.map(c => ({ ...c, label: t(`cat_${c.id.replace(/-/g, "_")}`) })), [t]);
  const statusMap = useMemo(() => Object.fromEntries(STATUS_KEYS.map(k => [k, t(`status_${k.replace(/-/g, "_")}`)])), [t]);
  const severityMap = useMemo(() => Object.fromEntries(SEVERITY_KEYS.map(k => [k, t(`sev_${k}`)])), [t]);
  const districtLabel = useCallback((key) => {
    if (key === "all") return t("district_all");
    if (key === "Statewide") return t("district_Statewide");
    const label = t(`district_${key}`);
    return label === `district_${key}` ? key : label;
  }, [t]);
  const value = useMemo(() => ({ lang, setLang, t, categories, statusMap, severityMap, districtLabel }), [lang, setLang, t, categories, statusMap, severityMap, districtLabel]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button type="button" className={`lang-btn${lang === "en" ? " active" : ""}`} onClick={() => setLang("en")}>{t("langEnglish")}</button>
      <button type="button" className={`lang-btn${lang === "ta" ? " active" : ""}`} onClick={() => setLang("ta")}>{t("langTamil")}</button>
    </div>
  );
}

function formatDate(d, lang = "en") {
  const locale = lang === "ta" ? "ta-IN" : "en-IN";
  return d ? new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "—";
}
function formatSize(b) { if (b > 1048576) return (b / 1048576).toFixed(1) + " MB"; if (b > 1024) return (b / 1024).toFixed(1) + " KB"; return b + " B"; }
function fileIcon(mime) { if (!mime) return "📎"; if (mime.startsWith("image/")) return "🖼️"; if (mime === "application/pdf") return "📄"; if (mime.startsWith("video/")) return "🎬"; if (mime.includes("word")) return "📝"; return "📎"; }
function catColor(id) { return CATEGORY_DEFS.find(c => c.id === id)?.color || "#6b7280"; }
function catLabel(id, categories) { return categories.find(c => c.id === id)?.label || id; }

// ─── API HELPERS ─────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem("tvk_token"); }
async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers };
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(err.error || "Request failed"); }
  return res.json();
}

async function uploadIncidentFiles(incidentId, fileList) {
  if (!fileList?.length) return [];
  const fd = new FormData();
  fd.append("incident_id", incidentId);
  Array.from(fileList).forEach(f => fd.append("files", f));
  const token = getToken();
  const res = await fetch(`${API}/files/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Upload failed");
  }
  return res.json();
}

function AuthImage({ fileId, alt, className, style }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let objectUrl;
    let cancelled = false;
    (async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API}/files/${fileId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setSrc(objectUrl);
      } catch {}
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);
  if (!src) return <div className={className} style={{ ...style, background: "var(--bg3)" }} />;
  return <img src={src} alt={alt} className={className} style={style} />;
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, success: m => add(m, "success"), error: m => add(m, "error"), info: m => add(m, "info") };
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── CONFIRM MODAL ───────────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel, danger }) {
  const { t } = useLanguage();
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">{title}</span><button className="modal-close" onClick={onCancel}>✕</button></div>
        <div className="modal-body"><p className="confirm-msg">{message}</p></div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>{t("cancel")}</button>
          <button className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>{danger ? `⚠ ${t("confirmDelete")}` : t("confirm")}</button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin, onClose }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  const handleSubmit = async () => {
    if (!form.username || !form.password) { setError(t("fillBothFields")); return; }
    setLoading(true); setError("");
    try {
      const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(form) });
      if (!["admin", "superadmin"].includes(data.user?.role)) {
        localStorage.removeItem("tvk_token");
        setError(t("adminAccessOnly"));
        setLoading(false);
        return;
      }
      localStorage.setItem("tvk_token", data.accessToken);
      onLogin(data.user);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <>
      <div className="login-page" onClick={onClose}>
        <div className="login-card" onClick={e => e.stopPropagation()}>
          {onClose && <button className="modal-close" style={{ position: "absolute", top: 14, right: 14 }} onClick={onClose}>✕</button>}
          <div className="login-logo">
            <span className="logo-badge">TVK</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: "var(--accent)" }}>#TVKFiles</span>
            <div style={{ marginLeft: "auto" }}><LanguageToggle /></div>
          </div>
          <div className="login-title">{t("loginTitle")}</div>
          <div className="login-sub">{t("loginSub")}</div>
          {error && <div className="login-error">⚠ {error}</div>}
          <div className="form-group">
            <label className="form-label">{t("username")}</label>
            <input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="admin" autoFocus onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div className="form-group">
            <label className="form-label">{t("password")}</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••••" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 6, justifyContent: "center" }} disabled={loading} onClick={handleSubmit}>
            {loading ? <><span className="spinner" /> {t("signingIn")}</> : `🔐 ${t("signIn")}`}
          </button>
        </div>
        <ToastContainer toasts={toast.toasts} />
      </div>
    </>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: "incidents", labelKey: "navPostNews", icon: "📰", roles: ["admin", "superadmin"] },
  { id: "public", labelKey: "navViewSite", icon: "🌐", roles: ["admin", "superadmin"] },
];

const ROLE_LEVEL = { viewer: 1, moderator: 2, admin: 3, superadmin: 4 };

function Sidebar({ user, active, setActive }) {
  const { t } = useLanguage();
  const level = ROLE_LEVEL[user.role] || 0;
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-badge">TVK</span>
        <span className="logo-text">#TVKFiles</span>
      </div>
      <div className="sidebar-user">
        <div className="avatar">{user.username[0].toUpperCase()}</div>
        <div className="user-info">
          <div className="user-name">{user.username}</div>
          <div className={`user-role role-${user.role}`}>{t("admin")}</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map((item) => {
          const minLevel = Math.min(...item.roles.map(r => ROLE_LEVEL[r]));
          if (level < minLevel) return null;
          return (
            <div key={item.id} className={`nav-item${active === item.id ? " active" : ""}`} onClick={() => setActive(item.id)}>
              <span className="ni-icon">{item.icon}</span>
              <span>{t(item.labelKey)}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ toast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch("/admin/dashboard").then(setData).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /> Loading dashboard…</div>;
  if (!data) return null;
  const { stats, categoryBreakdown, severityBreakdown, recentIncidents, recentActivity } = data;

  const roleBadge = r => {
    const cls = { superadmin: "badge-red", admin: "badge-orange", moderator: "badge-blue", viewer: "badge-green" };
    return <span className={`badge ${cls[r] || "badge-gray"}`}>{r}</span>;
  };

  return (
    <div>
      <div className="stats-grid">
        {[
          ["📂", stats.totalIncidents, "Total Incidents", null],
          ["✅", stats.publishedIncidents, "Published", "#22c55e"],
          ["⏳", stats.pendingIncidents, "Pending Review", "#fbbf24"],
          ["🚨", stats.totalUsers, "Users", "#3b82f6"],
          ["🗂️", stats.totalFiles, "Files Uploaded", "#a855f7"],
          ["🔍", stats.totalAuditLogs, "Audit Events", "#06b6d4"],
        ].map(([icon, num, lbl, color]) => (
          <div className="stat-card" key={lbl}>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div className="stat-num" style={color ? { color } : {}}>{num}</div>
            <div className="stat-lbl">{lbl}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">By Category</span></div>
          <div className="panel-body">
            {Object.entries(categoryBreakdown).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, flex: 1, color: catColor(k) }}>{catLabel(k)}</span>
                <div style={{ flex: 2, height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${stats.totalIncidents ? (v / stats.totalIncidents) * 100 : 0}%`, background: catColor(k), borderRadius: 3, transition: "width 0.5s" }} />
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", minWidth: 20, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">By Severity</span></div>
          <div className="panel-body">
            {Object.entries(severityBreakdown).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span className={`sev-${k}`} style={{ fontFamily: "var(--mono)", fontSize: 12, flex: 1, textTransform: "capitalize" }}>{k}</span>
                <div style={{ flex: 2, height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${stats.totalIncidents ? (v / stats.totalIncidents) * 100 : 0}%`, background: SEVERITY_COLORS[k], borderRadius: 3, transition: "width 0.5s" }} />
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", minWidth: 20, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Recent Incidents</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Cat</th><th>Status</th></tr></thead>
              <tbody>
                {recentIncidents.map(i => (
                  <tr key={i.id}>
                    <td className="td-truncate" style={{ maxWidth: 160 }}>{i.title}</td>
                    <td><span style={{ color: catColor(i.category), fontFamily: "var(--mono)", fontSize: 10 }}>{catLabel(i.category)}</span></td>
                    <td><span className={`badge ${i.is_published ? "badge-green" : "badge-yellow"}`}>{i.is_published ? "Live" : "Draft"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">Recent Activity</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Action</th><th>Time</th></tr></thead>
              <tbody>
                {recentActivity.map((l, i) => (
                  <tr key={i}>
                    <td className="td-mono">{l.username}</td>
                    <td><span className="badge badge-cyan td-mono">{l.action}</span></td>
                    <td className="td-mono text-muted">{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INCIDENT FORM MODAL ─────────────────────────────────────────────────────
function IncidentFormModal({ incident, onClose, onSaved, toast }) {
  const { t, categories, statusMap, severityMap } = useLanguage();
  const isEdit = !!incident?.id;
  const fileInputRef = useRef();
  const [form, setForm] = useState({
    title: incident?.title || "",
    description: incident?.description || "",
    category: incident?.category || "corruption",
    date: incident?.date || new Date().toISOString().slice(0, 10),
    district: incident?.district || "Chennai",
    source: incident?.source || "",
    source_url: incident?.source_url || "",
    tags: Array.isArray(incident?.tags) ? incident.tags.join(", ") : (incident?.tags || ""),
    severity: incident?.severity || "medium",
    status: incident?.status || "unresolved",
  });
  const [saving, setSaving] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!incident?.id) return;
    apiFetch(`/files?incident_id=${incident.id}`)
      .then(data => setAttachedFiles(data.files || []))
      .catch(e => toast.error(e.message));
  }, [incident?.id]);

  const removePending = (idx) => setPendingFiles(f => f.filter((_, i) => i !== idx));

  const deleteAttached = async (fileId) => {
    try {
      await apiFetch(`/files/${fileId}`, { method: "DELETE" });
      setAttachedFiles(f => f.filter(x => x.id !== fileId));
      toast.success(t("fileRemoved"));
    } catch (e) { toast.error(e.message); }
  };

  const save = async () => {
    if (!form.title || !form.description) { toast.error(t("titleDescRequired")); return; }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(",").map(tg => tg.trim()).filter(Boolean) };
      let incidentId = incident?.id;
      if (isEdit) {
        await apiFetch(`/incidents/${incident.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success(t("incidentUpdated"));
      } else {
        const data = await apiFetch("/incidents", { method: "POST", body: JSON.stringify(payload) });
        incidentId = data.id;
        toast.success(t("incidentCreated"));
      }
      if (pendingFiles.length && incidentId) {
        await uploadIncidentFiles(incidentId, pendingFiles);
        setPendingFiles([]);
      }
      onSaved();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? `✏️ ${t("editNews")}` : `➕ ${t("postNews")}`}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">{t("title")} <span>*</span></label>
            <input className="form-input" value={form.title} onChange={set("title")} placeholder={t("titlePlaceholder")} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("category")} <span>*</span></label>
              <select className="form-select" value={form.category} onChange={set("category")}>
                {categories.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t("district")}</label>
              <select className="form-select" value={form.district} onChange={set("district")}>
                {DISTRICT_KEYS.filter(d => d !== "all").map(d => <option key={d} value={d}>{d === "Statewide" ? t("district_Statewide") : d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t("description")} <span>*</span></label>
            <textarea className="form-textarea" rows={4} value={form.description} onChange={set("description")} placeholder={t("descPlaceholder")} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("severity")}</label>
              <select className="form-select" value={form.severity} onChange={set("severity")}>
                {SEVERITY_KEYS.map(s => <option key={s} value={s}>{severityMap[s]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t("status")}</label>
              <select className="form-select" value={form.status} onChange={set("status")}>
                {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t("date")}</label>
              <input className="form-input" type="date" value={form.date} onChange={set("date")} />
            </div>
            <div className="form-group">
              <label className="form-label">{t("source")}</label>
              <input className="form-input" value={form.source} onChange={set("source")} placeholder={t("sourcePlaceholder")} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t("sourceLink")}</label>
            <input className="form-input" type="url" value={form.source_url} onChange={set("source_url")} placeholder="https://…" />
          </div>
          <div className="form-group">
            <label className="form-label">{t("tags")}</label>
            <input className="form-input" value={form.tags} onChange={set("tags")} placeholder={t("tagsPlaceholder")} />
          </div>
          <div className="form-group">
            <label className="form-label">{t("uploadImages")}</label>
            <div
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-zone-icon">🖼️</div>
              <div className="upload-zone-text">{t("uploadImages")}</div>
              <div className="upload-zone-sub">{t("uploadImagesSub")}</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              accept="image/*,.pdf,.doc,.docx,.mp4,.webm,.txt"
              onChange={e => { setPendingFiles(f => [...f, ...Array.from(e.target.files || [])]); e.target.value = ""; }}
            />
            {(attachedFiles.length > 0 || pendingFiles.length > 0) && (
              <div className="file-list">
                {attachedFiles.map(f => (
                  <div className="file-item" key={f.id}>
                    {f.mime_type?.startsWith("image/") ? (
                      <AuthImage fileId={f.id} alt={f.original_name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
                    ) : (
                      <span className="file-icon">{fileIcon(f.mime_type)}</span>
                    )}
                    <div className="file-info">
                      <div className="file-name">{f.original_name}</div>
                      <div className="file-meta">{formatSize(f.size)}</div>
                    </div>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteAttached(f.id)}>🗑</button>
                  </div>
                ))}
                {pendingFiles.map((f, i) => (
                  <div className="file-item" key={`pending-${i}`}>
                    <span className="file-icon">{f.type?.startsWith("image/") ? "🖼️" : fileIcon(f.type)}</span>
                    <div className="file-info">
                      <div className="file-name">{f.name}</div>
                      <div className="file-meta">{formatSize(f.size)} · {t("pendingUpload")}</div>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => removePending(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>{t("cancel")}</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
            {saving ? <><span className="spinner" /> {t("saving")}</> : (isEdit ? `💾 ${t("saveChanges")}` : `✅ ${t("publishNews")}`)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── INCIDENTS PAGE ──────────────────────────────────────────────────────────
function IncidentsPage({ user, toast }) {
  const { t, categories, statusMap, severityMap, lang } = useLanguage();
  const [incidents, setIncidents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pubFilter, setPubFilter] = useState("");
  const [modal, setModal] = useState(null); // null | "create" | incident obj
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, ...(pubFilter !== "" ? { published: pubFilter } : {}) });
      const data = await apiFetch(`/incidents/admin/all?${params}`);
      setIncidents(data.incidents || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [page, pubFilter]);

  useEffect(() => { load(); }, [load]);

  const togglePublish = async (inc) => {
    try {
      await apiFetch(`/incidents/${inc.id}/publish`, { method: "PATCH", body: JSON.stringify({ published: !inc.is_published }) });
      toast.success(inc.is_published ? t("unpublished") : t("published"));
      load();
    } catch (e) { toast.error(e.message); }
  };

  const deleteInc = async (id) => {
    try {
      await apiFetch(`/incidents/${id}`, { method: "DELETE" });
      toast.success(t("incidentDeleted"));
      load();
    } catch (e) { toast.error(e.message); }
    setConfirm(null);
  };

  const filtered = incidents.filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="toolbar">
        <div className="search-field">
          <span className="search-field-icon">🔍</span>
          <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchIncidents")} />
        </div>
        <select className="form-select" style={{ width: "auto" }} value={pubFilter} onChange={e => { setPubFilter(e.target.value); setPage(1); }}>
          <option value="">{t("allStatus")}</option>
          <option value="true">{t("published")}</option>
          <option value="false">{t("draft")}</option>
        </select>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-primary" onClick={() => setModal("create")}>➕ {t("postNews")}</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">{t("newsPosts")} ({total})</span>
          <span className="text-mono">{pages > 1 ? `${t("page")} ${page} ${t("of")} ${pages}` : ""}</span>
        </div>
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /> {t("loading")}</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("title")}</th><th>{t("category")}</th><th>{t("district")}</th><th>{t("severity")}</th><th>{t("status")}</th><th>{t("published")}</th><th>{t("date")}</th><th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">📭</div>{t("noIncidentsFound")}</div></td></tr>}
                {filtered.map(inc => (
                  <tr key={inc.id}>
                    <td style={{ maxWidth: 200 }} className="td-truncate">{inc.title}</td>
                    <td><span style={{ color: catColor(inc.category), fontFamily: "var(--mono)", fontSize: 11 }}>{catLabel(inc.category, categories)}</span></td>
                    <td className="td-mono">{inc.district}</td>
                    <td><span className={`sev-${inc.severity}`} style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700 }}>{severityMap[inc.severity] || inc.severity}</span></td>
                    <td><span className="badge badge-gray td-mono">{statusMap[inc.status] || inc.status}</span></td>
                    <td>
                      <span className={`badge ${inc.is_published ? "badge-green" : "badge-yellow"}`}>{inc.is_published ? t("live") : t("draft")}</span>
                    </td>
                    <td className="td-mono">{formatDate(inc.date, lang)}</td>
                    <td>
                      <div className="gap-row">
                        <button className="btn btn-icon btn-sm" title={t("edit")} onClick={() => setModal(inc)}>✏️</button>
                        <button className={`btn btn-sm ${inc.is_published ? "btn-secondary" : "btn-success"}`} onClick={() => togglePublish(inc)}>
                          {inc.is_published ? t("unpublish") : t("publish")}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(inc.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {(modal === "create" || (modal && modal !== "create")) && (
        <IncidentFormModal
          incident={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
          toast={toast}
        />
      )}
      {confirm && (
        <ConfirmModal
          title={t("deleteIncident")}
          message={t("deleteConfirm")}
          danger
          onConfirm={() => deleteInc(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── FILE MANAGER ─────────────────────────────────────────────────────────────
function FileManagerPage({ toast }) {
  const [files, setFiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState([]); // local upload queue display
  const [dragOver, setDragOver] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const fileInputRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/files");
      setFiles(data.files || []);
      setTotal(data.total || 0);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFiles = async (fileList) => {
    const arr = Array.from(fileList);
    if (!arr.length) return;
    const MAX = 20 * 1024 * 1024;
    for (const f of arr) {
      if (f.size > MAX) { toast.error(`${f.name} exceeds 20MB limit`); return; }
    }

    setUploads(arr.map(f => ({ name: f.name, size: f.size, progress: 0, status: "uploading" })));
    setUploading(true);

    try {
      const fd = new FormData();
      arr.forEach(f => fd.append("files", f));

      const token = getToken();
      const res = await fetch(`${API}/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const data = await res.json();
      setUploads(prev => prev.map(u => ({ ...u, progress: 100, status: "done" })));
      toast.success(`${data.files.length} file(s) uploaded`);
      setTimeout(() => setUploads([]), 2000);
      load();
    } catch (e) {
      toast.error(e.message);
      setUploads(prev => prev.map(u => ({ ...u, status: "error" })));
    }
    setUploading(false);
  };

  const deleteFile = async (id) => {
    try {
      await apiFetch(`/files/${id}`, { method: "DELETE" });
      toast.success("File deleted");
      load();
    } catch (e) { toast.error(e.message); }
    setConfirm(null);
  };

  return (
    <div>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header"><span className="panel-title">📤 Upload Files</span></div>
        <div className="panel-body">
          <div
            className={`upload-zone${dragOver ? " drag-over" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-zone-icon">📁</div>
            <div className="upload-zone-text">Drop files here or click to browse</div>
            <div className="upload-zone-sub">Images, PDFs, Videos, Word docs · Max 20MB · Up to 5 files at once</div>
          </div>
          <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} accept="image/*,.pdf,.doc,.docx,.mp4,.webm,.txt" />
          {uploads.length > 0 && (
            <div className="file-list">
              {uploads.map((f, i) => (
                <div className="file-item" key={i}>
                  <span className="file-icon">📎</span>
                  <div className="file-info">
                    <div className="file-name">{f.name}</div>
                    <div className="file-meta">{formatSize(f.size)}</div>
                    <div className="file-progress"><div className="file-progress-bar" style={{ width: `${f.progress}%` }} /></div>
                  </div>
                  <span className={`file-status ${f.status === "done" ? "sev-low" : f.status === "error" ? "sev-critical" : ""}`}>
                    {f.status === "uploading" ? <span className="spinner" /> : f.status === "done" ? "✓" : "✕"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">🗂️ Uploaded Files ({total})</span>
          <button className="btn btn-secondary btn-sm" onClick={load}>↻ Refresh</button>
        </div>
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /> Loading…</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded By</th><th>Linked Incident</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {files.length === 0 && <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🗂️</div>No files yet</div></td></tr>}
                {files.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{fileIcon(f.mime_type)}</span>
                        <span className="td-truncate" style={{ maxWidth: 180 }}>{f.original_name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-gray">{f.mime_type?.split("/")[1] || f.mime_type}</span></td>
                    <td className="td-mono">{formatSize(f.size)}</td>
                    <td className="td-mono">{f.uploader_name || "—"}</td>
                    <td className="td-mono">{f.incident_id ? <span className="badge badge-blue">{f.incident_id.slice(0, 8)}…</span> : <span className="text-muted">—</span>}</td>
                    <td className="td-mono">{formatDate(f.created_at)}</td>
                    <td>
                      <div className="gap-row">
                        <a href={`${API}/files/${f.id}`} target="_blank" rel="noopener noreferrer">
                          <button className="btn btn-icon btn-sm">👁</button>
                        </a>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(f.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmModal
          title="Delete File"
          message="This will permanently delete the file from disk and the database."
          danger
          onConfirm={() => deleteFile(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── USERS PAGE ──────────────────────────────────────────────────────────────
function UsersPage({ user: currentUser, toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "create" | user
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", role: "viewer" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    apiFetch("/admin/users").then(d => { setUsers(d.users || []); setLoading(false); }).catch(e => { toast.error(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const createUser = async () => {
    if (!form.username || !form.password) { toast.error("Username and password required"); return; }
    setSaving(true);
    try {
      await apiFetch("/admin/users", { method: "POST", body: JSON.stringify(form) });
      toast.success("User created");
      setModal(null);
      setForm({ username: "", password: "", role: "viewer" });
      load();
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  const toggleActive = async (u) => {
    try {
      await apiFetch(`/admin/users/${u.id}`, { method: "PUT", body: JSON.stringify({ is_active: !u.is_active }) });
      toast.success(u.is_active ? "User suspended" : "User activated");
      load();
    } catch (e) { toast.error(e.message); }
  };

  const unlockUser = async (id) => {
    try {
      await apiFetch(`/admin/users/${id}/unlock`, { method: "POST" });
      toast.success("Account unlocked");
      load();
    } catch (e) { toast.error(e.message); }
  };

  const deleteUser = async (id) => {
    try {
      await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
      toast.success("User deleted");
      load();
    } catch (e) { toast.error(e.message); }
    setConfirm(null);
  };

  const roleBadgeClass = { superadmin: "badge-red", admin: "badge-orange", moderator: "badge-blue", viewer: "badge-green" };

  return (
    <div>
      <div className="toolbar">
        <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={() => setModal("create")}>➕ Add User</button>
      </div>
      <div className="panel">
        <div className="panel-header"><span className="panel-title">👥 Users ({users.length})</span></div>
        {loading ? <div className="spinner-wrap"><div className="spinner" /> Loading…</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Username</th><th>Role</th><th>Status</th><th>Last Login</th><th>Login Attempts</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.username} {u.id === currentUser.id && <span className="badge badge-cyan" style={{ marginLeft: 4 }}>You</span>}</td>
                    <td><span className={`badge ${roleBadgeClass[u.role] || "badge-gray"}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.is_active ? "badge-green" : "badge-red"}`}>{u.is_active ? "Active" : "Suspended"}</span></td>
                    <td className="td-mono">{formatDate(u.last_login)}</td>
                    <td>
                      {u.login_attempts > 0 ? (
                        <span className="badge badge-yellow">{u.login_attempts} failed</span>
                      ) : <span className="text-muted td-mono">0</span>}
                      {u.locked_until && new Date(u.locked_until) > new Date() && (
                        <span className="badge badge-red" style={{ marginLeft: 4 }}>LOCKED</span>
                      )}
                    </td>
                    <td className="td-mono">{formatDate(u.created_at)}</td>
                    <td>
                      <div className="gap-row">
                        {u.locked_until && <button className="btn btn-secondary btn-sm" onClick={() => unlockUser(u.id)}>🔓 Unlock</button>}
                        {u.id !== currentUser.id && (
                          <>
                            <button className={`btn btn-sm ${u.is_active ? "btn-danger" : "btn-success"}`} onClick={() => toggleActive(u)}>
                              {u.is_active ? "Suspend" : "Activate"}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setConfirm(u.id)}>🗑</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === "create" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">➕ Create User</span><button className="modal-close" onClick={() => setModal(null)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Username <span>*</span></label><input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="username" /></div>
              <div className="form-group"><label className="form-label">Password <span>*</span> (min 10 chars)</label><input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••••••" /></div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {["viewer", "moderator", "admin", "superadmin"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={createUser} disabled={saving}>{saving ? <><span className="spinner" /> Creating…</> : "✅ Create"}</button>
            </div>
          </div>
        </div>
      )}
      {confirm && <ConfirmModal title="Delete User" message="This will permanently delete the user and revoke all their sessions." danger onConfirm={() => deleteUser(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── AUDIT LOG PAGE ──────────────────────────────────────────────────────────
function AuditLogPage({ toast }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30, ...(username ? { username } : {}) });
      const data = await apiFetch(`/admin/audit?${params}`);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [page, username]);

  useEffect(() => { load(); }, [load]);

  const actionColor = a => {
    if (a.includes("DELETE")) return "badge-red";
    if (a.includes("CREATE") || a.includes("LOGIN")) return "badge-green";
    if (a.includes("UPDATE") || a.includes("PUBLISH")) return "badge-blue";
    if (a.includes("UNLOCK") || a.includes("DOWNLOAD")) return "badge-yellow";
    if (a.includes("UNAUTHORIZED")) return "badge-red";
    return "badge-gray";
  };

  return (
    <div>
      <div className="toolbar">
        <div className="search-field" style={{ maxWidth: 240 }}>
          <span className="search-field-icon">👤</span>
          <input className="form-input" value={username} onChange={e => { setUsername(e.target.value); setPage(1); }} placeholder="Filter by username…" />
        </div>
        <span className="text-mono" style={{ marginLeft: "auto" }}>{total} events total</span>
      </div>
      <div className="panel">
        <div className="panel-header"><span className="panel-title">🔍 Audit Log</span></div>
        {loading ? <div className="spinner-wrap"><div className="spinner" /> Loading…</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Target</th><th>Details</th><th>IP</th></tr></thead>
              <tbody>
                {logs.length === 0 && <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📋</div>No audit events</div></td></tr>}
                {logs.map(l => (
                  <tr key={l.id}>
                    <td className="td-mono" style={{ whiteSpace: "nowrap" }}>{new Date(l.created_at).toLocaleString("en-IN", { hour12: false })}</td>
                    <td className="td-mono" style={{ fontWeight: 700 }}>{l.username}</td>
                    <td><span className={`badge ${actionColor(l.action)}`}>{l.action}</span></td>
                    <td className="td-mono">{l.target_type ? `${l.target_type}` : "—"}</td>
                    <td className="td-truncate td-mono" style={{ maxWidth: 160 }}>{l.details || "—"}</td>
                    <td className="td-mono text-muted">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SESSIONS PAGE ───────────────────────────────────────────────────────────
function SessionsPage({ toast }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    apiFetch("/admin/sessions").then(d => { setSessions(d.sessions || []); setLoading(false); }).catch(e => { toast.error(e.message); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const revoke = async (userId) => {
    try {
      await apiFetch(`/admin/sessions/${userId}`, { method: "DELETE" });
      toast.success("Sessions revoked");
      load();
    } catch (e) { toast.error(e.message); }
    setConfirm(null);
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-header"><span className="panel-title">🔐 Active Sessions</span><button className="btn btn-secondary btn-sm" onClick={load}>↻ Refresh</button></div>
        {loading ? <div className="spinner-wrap"><div className="spinner" /> Loading…</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>IP</th><th>User Agent</th><th>Created</th><th>Expires</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {sessions.length === 0 && <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🔐</div>No sessions</div></td></tr>}
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>{s.username}</td>
                    <td className="td-mono">{s.ip}</td>
                    <td className="td-truncate td-mono" style={{ maxWidth: 140 }}>{s.user_agent}</td>
                    <td className="td-mono">{formatDate(s.created_at)}</td>
                    <td className="td-mono">{formatDate(s.expires_at)}</td>
                    <td>
                      {s.is_revoked ? <span className="badge badge-red">Revoked</span>
                        : new Date(s.expires_at) < new Date() ? <span className="badge badge-yellow">Expired</span>
                        : <span className="badge badge-green">Active</span>}
                    </td>
                    <td>
                      {!s.is_revoked && <button className="btn btn-danger btn-sm" onClick={() => setConfirm(s.user_id)}>Revoke All</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {confirm && <ConfirmModal title="Revoke Sessions" message="This will immediately sign out the user from all devices." danger onConfirm={() => revoke(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── BACKUP PAGE ──────────────────────────────────────────────────────────────
function BackupPage({ toast }) {
  const [loading, setLoading] = useState({});

  const download = async (path, filename, key) => {
    setLoading(l => ({ ...l, [key]: true }));
    try {
      const token = getToken();
      const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${filename} downloaded`);
    } catch (e) { toast.error(e.message); }
    setLoading(l => ({ ...l, [key]: false }));
  };

  const exportJSON = async (table) => {
    await download(`/backup/export-json?table=${table}`, `${table}_export_${Date.now()}.json`, table);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">💾 Full Database Backup</span></div>
          <div className="panel-body">
            <p className="text-mono" style={{ marginBottom: 16, lineHeight: 1.7 }}>
              Downloads a complete ZIP archive containing the MySQL SQL dump, all uploaded files, and a full JSON data export. Store securely.
            </p>
            <button className="btn btn-primary" disabled={loading.zip} onClick={() => download("/backup/full-zip", `tvkfiles_backup_${Date.now()}.zip`, "zip")}>
              {loading.zip ? <><span className="spinner" /> Generating ZIP…</> : "📦 Download Full ZIP Backup"}
            </button>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><span className="panel-title">🗄️ MySQL Database</span></div>
          <div className="panel-body">
            <p className="text-mono" style={{ marginBottom: 16, lineHeight: 1.7 }}>
              Download a SQL dump of the MySQL database. Import it via phpMyAdmin or the MySQL CLI to restore.
            </p>
            <button className="btn btn-secondary" disabled={loading.db} onClick={() => download("/backup/db", `tvkfiles_${Date.now()}.sql`, "db")}>
              {loading.db ? <><span className="spinner" /> Downloading…</> : "🗄️ Download SQL Dump"}
            </button>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header"><span className="panel-title">📤 JSON Exports</span></div>
        <div className="panel-body">
          <p className="text-mono" style={{ marginBottom: 16 }}>Export individual tables as JSON for analysis or migration.</p>
          <div className="gap-row">
            {["incidents", "files", "audit_log"].map(t => (
              <button key={t} className="btn btn-secondary" disabled={loading[t]} onClick={() => exportJSON(t)}>
                {loading[t] ? <span className="spinner" /> : "⬇"} Export {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header"><span className="panel-title">📋 Backup Guidelines</span></div>
        <div className="panel-body">
          <div className="text-mono" style={{ lineHeight: 2, color: "var(--text2)" }}>
            <div>✅ Run full ZIP backups before any major data changes</div>
            <div>✅ Store backups in a separate location (not on the same server)</div>
            <div>✅ Encrypt backup ZIPs before uploading to cloud storage</div>
            <div>✅ Test database restores periodically by importing the SQLite file</div>
            <div>✅ Audit logs are included in both the ZIP and JSON exports</div>
            <div>⚠️ ZIP includes all uploaded evidence files — may be large</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ user, toast }) {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const changePassword = async () => {
    if (!form.current_password || !form.new_password) { toast.error("All fields required"); return; }
    if (form.new_password !== form.confirm_password) { toast.error("New passwords don't match"); return; }
    if (form.new_password.length < 10) { toast.error("Password must be at least 10 characters"); return; }
    setSaving(true);
    try {
      await apiFetch("/auth/change-password", { method: "POST", body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }) });
      toast.success("Password changed. Please log in again.");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => { localStorage.removeItem("tvk_token"); window.location.reload(); }, 2000);
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <div className="panel">
        <div className="panel-header"><span className="panel-title">⚙️ Account Settings</span></div>
        <div className="panel-body">
          <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>Logged in as</div>
            <div style={{ fontWeight: 700 }}>{user.username}</div>
            <div className={`role-${user.role}`} style={{ fontFamily: "var(--mono)", fontSize: 11, marginTop: 2 }}>{user.role}</div>
          </div>
          <div className="divider" />
          <div style={{ fontWeight: 700, marginBottom: 14 }}>Change Password</div>
          <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={form.current_password} onChange={set("current_password")} placeholder="••••••••••" /></div>
          <div className="form-group"><label className="form-label">New Password (min 10 chars)</label><input className="form-input" type="password" value={form.new_password} onChange={set("new_password")} placeholder="••••••••••••" /></div>
          <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-input" type="password" value={form.confirm_password} onChange={set("confirm_password")} placeholder="••••••••••••" /></div>
          <button className="btn btn-primary" onClick={changePassword} disabled={saving}>
            {saving ? <><span className="spinner" /> Changing…</> : "🔐 Change Password"}
          </button>
          <div className="text-mono" style={{ marginTop: 10, color: "var(--text3)" }}>After changing, all active sessions will be revoked and you'll need to log in again.</div>
        </div>
      </div>
    </div>
  );
}

function mediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

const DUMMY_IMAGE_SEEDS = {
  corruption: "tvk-corruption",
  crime: "tvk-crime",
  "broken-promise": "tvk-promise",
  "admin-failure": "tvk-admin",
  "honour-killing": "tvk-honour",
  "loss-investments": "tvk-investment",
  "insta-cards": "tvk-insta",
};

function getDummyImageUrl(inc) {
  const seed = inc?.id ? `${DUMMY_IMAGE_SEEDS[inc.category] || "tvk"}-${inc.id.slice(0, 8)}` : "tvk-default";
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/360`;
}

function getIncidentCoverUrl(inc) {
  if (inc?.cover_image_url) return mediaUrl(inc.cover_image_url);
  return getDummyImageUrl(inc);
}

// ─── PUBLIC TRACKER VIEW ─────────────────────────────────────────────────────
function PublicTrackerView({ toast, embedded }) {
  const { t, categories, statusMap, severityMap, districtLabel, lang } = useLanguage();
  const [incidents, setIncidents] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [district, setDistrict] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, ...(category !== "all" ? { category } : {}), ...(district !== "all" ? { district } : {}), ...(search ? { search } : {}) });
      const [incData, statsData] = await Promise.all([apiFetch(`/incidents?${params}`), apiFetch("/incidents/stats")]);
      setIncidents(incData.incidents || []);
      setTotal(incData.total || 0);
      setStats(statsData);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  }, [page, category, district, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setDetailLoading(true);
    apiFetch(`/incidents/${selectedId}`)
      .then(setDetail)
      .catch(e => toast.error(e.message))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const statCards = [
    ["📂", stats.total, t("statTotalFiles"), "var(--text)"],
    ["💰", stats.corruption, t("statCorruption"), "#ef4444"],
    ["🚨", stats.crime, t("statCrime"), "#f97316"],
    ["📜", stats["broken-promise"], t("statBrokenPromises"), "#a855f7"],
    ["⚡", stats.critical, t("statCritical"), "#ef4444"],
  ];
  const catStats = categories.filter(c => c.id !== "all").map(c => ({ ...c, count: stats[c.id] || 0 }));
  const maxCat = Math.max(...catStats.map(c => c.count), 1);
  const featured = incidents.length > 0
    ? [...incidents].sort((a, b) => SEVERITY_KEYS.indexOf(a.severity) - SEVERITY_KEYS.indexOf(b.severity))[0]
    : null;
  const gridIncidents = featured ? incidents.filter(i => i.id !== featured.id) : incidents;

  const renderPolCard = (inc, isFeatured = false) => {
    const color = catColor(inc.category);
    if (isFeatured) {
  return (
        <div key={inc.id} className="pol-featured" style={{ "--cat-accent": color }} onClick={() => setSelectedId(inc.id)}>
          <div className="pol-featured-img-wrap">
            <img src={getIncidentCoverUrl(inc)} alt="" className="pol-featured-img" loading="lazy" />
            <span className="pol-featured-badge">★ {t("featuredReport")}</span>
        </div>
          <div className="pol-featured-body">
            <div className="pol-featured-cat" style={{ color }}>{catLabel(inc.category, categories)}</div>
            <h2 className="pol-featured-title">{inc.title}</h2>
            <p className="pol-featured-desc">{inc.description}</p>
            <div className="pol-featured-meta">
              <span>{districtLabel(inc.district) || inc.district}</span><span>·</span>
              <span>{formatDate(inc.date, lang)}</span><span>·</span>
              <span style={{ color: SEVERITY_COLORS[inc.severity] }}>{severityMap[inc.severity]}</span>
            </div>
            <div className="pol-featured-cta">{t("readReport")} →</div>
          </div>
        </div>
      );
    }
    return (
      <article key={inc.id} className="pol-card" style={{ "--cat-accent": color }} onClick={() => setSelectedId(inc.id)}>
        <img src={getIncidentCoverUrl(inc)} alt="" className="pol-card-img" loading="lazy" />
        <div className="pol-card-body">
          <div className="pol-card-top">
            <span className="pol-card-cat" style={{ color }}>{catLabel(inc.category, categories)}</span>
            <span className="pol-card-sev" style={{ color: SEVERITY_COLORS[inc.severity] }}>{severityMap[inc.severity]}</span>
          </div>
          <h3 className="pol-card-title">{inc.title}</h3>
          <p className="pol-card-desc">{inc.description}</p>
        </div>
        {(inc.source_url || inc.source) && (
          inc.source_url ? (
            <a href={inc.source_url} target="_blank" rel="noopener noreferrer" className="pol-card-source" onClick={e => e.stopPropagation()}>🔗 {inc.source || t("viewSource")}</a>
          ) : (
            <span className="pol-card-source" style={{ cursor: "default", opacity: 0.7 }}>📰 {inc.source}</span>
          )
        )}
        {(inc.tags || []).length > 0 && (
          <div className="pol-card-tags">{inc.tags.slice(0, 3).map(tag => <span key={tag} className="pol-card-tag">#{tag}</span>)}</div>
        )}
        <div className="pol-card-foot">
          <span className="pol-card-meta">{districtLabel(inc.district) || inc.district} · {formatDate(inc.date, lang)}</span>
          <span className="pol-card-status" style={{ color: SEVERITY_COLORS[inc.severity] }}>{statusMap[inc.status]}</span>
        </div>
      </article>
    );
  };

  return (
    <div className="political-app">
      {!embedded && (
        <header className="pol-masthead">
          <div className="pol-masthead-accent" />
          <div className="pol-masthead-inner">
            <div className="pol-brand">
              <span className="pol-brand-mark">TVK</span>
              <div>
                <div className="pol-brand-title">#TVKFiles</div>
                <div className="pol-brand-tag">{t("siteTagline")}</div>
      </div>
              </div>
            <LanguageToggle />
          </div>
        </header>
      )}

      <section className="pol-hero">
        <div className="pol-hero-inner">
          <div className="pol-live-pill"><span className="pol-live-dot" /> {t("livePublicTracker")}</div>
          <h1>{t("heroTitle")} <em>{t("heroAccent")}</em></h1>
          <p className="pol-hero-lead">{t("heroSub")}</p>
          <div className="pol-dash">
            {statCards.map(([icon, num, lbl, color]) => (
              <div className="pol-dash-cell" key={lbl}>
                <div className="pol-dash-icon">{icon}</div>
                <div className="pol-dash-num" style={{ color }}>{num ?? "…"}</div>
                <div className="pol-dash-lbl">{lbl}</div>
        </div>
            ))}
      </div>
        </div>
      </section>

      <div className="pol-layout">
        <aside className="pol-sidebar">
          <div className="pol-panel">
            <div className="pol-panel-head">{t("accountabilityIndex")}</div>
            <div className="pol-panel-body">
              {catStats.map(c => (
                <div key={c.id} className={`pol-cat-row${category === c.id ? " active" : ""}`} onClick={() => { setCategory(c.id); setPage(1); }} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && (setCategory(c.id), setPage(1))}>
                  <span className="pol-cat-name">{c.icon} {c.label}</span>
                  <div className="pol-cat-bar"><div className="pol-cat-fill" style={{ width: `${(c.count / maxCat) * 100}%`, background: c.color }} /></div>
                  <span className="pol-cat-count">{c.count}</span>
        </div>
              ))}
            </div>
          </div>
          <div className="pol-panel">
            <div className="pol-panel-head">{t("filterDistrict")}</div>
            <div className="pol-panel-body">
              <select className="form-select" style={{ width: "100%" }} value={district} onChange={e => { setDistrict(e.target.value); setPage(1); }}>
                {DISTRICT_KEYS.map(d => <option key={d} value={d}>{districtLabel(d)}</option>)}
        </select>
            </div>
          </div>
        </aside>

        <div>
          <div className="pol-search-bar">
            <div className="pub-search-wrap">
              <span className="search-icon">🔍</span>
              <input className="form-input" placeholder={t("searchIncidents")} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`filter-chip${category === c.id ? " active" : ""}`}
                  style={category === c.id ? { background: c.color, borderColor: c.color } : {}}
                  onClick={() => { setCategory(c.id); setPage(1); }}
                >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

          <div className="pol-feed-head">
            <div className="pol-feed-title">
              {t("latestReports")}
              <span>{t("showingOf")} {incidents.length} {t("of")} {total} {t("incidents")}</span>
        </div>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /> {t("loadingIncidents")}</div>
          ) : (
            <>
              {incidents.length === 0 && (
                <div className="empty-state"><div className="empty-state-icon">🔎</div>{t("noIncidentsMatch")}</div>
              )}
              {featured && page === 1 && !search && category === "all" && renderPolCard(featured, true)}
              <div className="pol-grid">
                {gridIncidents.map(inc => renderPolCard(inc))}
            </div>
            {total > 12 && (
                <div className="pagination" style={{ marginTop: 24 }}>
                <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: Math.min(Math.ceil(total / 12), 7) }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {!embedded && (
        <footer className="pol-footer">#TVKFiles · {t("siteTagline")}</footer>
      )}

      {selectedId && (
        <div className="modal-overlay" onClick={() => setSelectedId(null)}>
          <div className="modal modal-lg dossier-modal" style={{ "--cat-accent": detail ? catColor(detail.category) : "var(--accent)" }} onClick={e => e.stopPropagation()}>
            {detailLoading || !detail ? (
              <div className="dossier-body"><div className="spinner-wrap"><div className="spinner" /> {t("loading")}</div></div>
            ) : (
              <>
                <div className="dossier-header">
                  <div className="dossier-ribbon" />
                  <button className="modal-close" style={{ position: "absolute", top: 20, right: 20 }} onClick={() => setSelectedId(null)}>✕</button>
                  <div className="dossier-cat" style={{ color: catColor(detail.category) }}>{t("investigationDossier")} · {catLabel(detail.category, categories)}</div>
                  <div className="dossier-title">{detail.title}</div>
                  <div className="dossier-meta-row">
                    <span className="dossier-pill">{districtLabel(detail.district) || detail.district}</span>
                    <span className="dossier-pill">{formatDate(detail.date, lang)}</span>
                    <span className="dossier-pill" style={{ color: SEVERITY_COLORS[detail.severity] }}>{severityMap[detail.severity]}</span>
                    <span className="dossier-pill">{statusMap[detail.status]}</span>
              </div>
            </div>
                <div className="dossier-body">
                  <div className="incident-images">
                  {((detail.files || []).filter(f => f.is_image).length > 0
                    ? detail.files.filter(f => f.is_image)
                    : [{ id: "dummy", url: getDummyImageUrl(detail), original_name: "cover", is_image: true }]
                  ).map(f => (
                    <img key={f.id} src={f.id === "dummy" ? f.url : mediaUrl(f.url)} alt={f.original_name} className="incident-image" loading="lazy" />
                  ))}
                  </div>
                  <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.75, marginBottom: 4 }}>{detail.description}</p>
                  <div className="dossier-grid">
                    {[[t("district"), districtLabel(detail.district) || detail.district], [t("date"), formatDate(detail.date, lang)], [t("severity"), severityMap[detail.severity]], [t("status"), statusMap[detail.status]]].map(([k, v]) => (
                      <div key={k} className="dossier-field">
                        <div className="dossier-field-lbl">{k}</div>
                        <div className="dossier-field-val" style={{ color: k === t("severity") ? SEVERITY_COLORS[detail.severity] : "var(--text)" }}>{v || "—"}</div>
                  </div>
                ))}
                    <div className="dossier-field" style={{ gridColumn: "1 / -1" }}>
                      <div className="dossier-field-lbl">{t("source")}</div>
                      {detail.source_url ? (
                        <a href={detail.source_url} target="_blank" rel="noopener noreferrer" className="source-link" onClick={e => e.stopPropagation()}>
                          🔗 {detail.source || t("viewSource")} — {detail.source_url.replace(/^https?:\/\//, "").slice(0, 48)}{detail.source_url.length > 56 ? "…" : ""}
                        </a>
                      ) : (
                        <div className="dossier-field-val">{detail.source || "—"}</div>
                      )}
              </div>
                  </div>
                  {(detail.files || []).filter(f => !f.is_image).length > 0 && (
                    <div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{t("attachments")}</div>
                      <div className="attachment-list">
                        {detail.files.filter(f => !f.is_image).map(f => (
                          <a key={f.id} href={mediaUrl(f.url)} target="_blank" rel="noopener noreferrer" className="attachment-item" onClick={e => e.stopPropagation()}>
                            <span>{fileIcon(f.mime_type)}</span>
                            <span style={{ flex: 1, fontWeight: 600 }}>{f.original_name}</span>
                            <span className="text-mono">{formatSize(f.size)} · {t("openAttachment")}</span>
                          </a>
                        ))}
                      </div>
                </div>
              )}
                  {detail.tags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 16 }}>
                      {detail.tags.map(tag => <span key={tag} className="pol-card-tag">#{tag}</span>)}
            </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP SHELL ──────────────────────────────────────────────────────────
function AdminShell({ user, onViewSite }) {
  const [active, setActive] = useState("incidents");
  const toast = useToast();
  const { t, lang } = useLanguage();

  const PAGE_TITLES = { incidents: t("pagePostNews"), public: t("pagePublicSite") };

  const renderPage = () => {
    switch (active) {
      case "incidents": return <IncidentsPage user={user} toast={toast} />;
      case "public": return <PublicTrackerView toast={toast} embedded />;
      default: return <IncidentsPage user={user} toast={toast} />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar user={user} active={active} setActive={setActive} />
      <div className="main-area">
        <div className="topbar">
          <span className="topbar-title">{PAGE_TITLES[active] || active}</span>
          <div className="topbar-actions">
            <LanguageToggle />
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>{new Date().toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN")}</span>
            <button className="btn btn-secondary btn-sm" onClick={onViewSite}>🌐 {t("viewPublicSite")}</button>
          </div>
        </div>
        <div className="page">{renderPage()}</div>
      </div>
      <ToastContainer toasts={toast.toasts} />
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const ADMIN_PORTAL_KEY = (import.meta.env.VITE_ADMIN_PORTAL_KEY || "").trim().replace(/^#/, "");

function getAdminHash() {
  if (!ADMIN_PORTAL_KEY || ADMIN_PORTAL_KEY.length < 24 || !/^[a-zA-Z0-9_-]+$/.test(ADMIN_PORTAL_KEY)) {
    return null;
  }
  return `#${ADMIN_PORTAL_KEY}`;
}

function isAdminRoute() {
  const hash = getAdminHash();
  return hash !== null && window.location.hash === hash;
}

function leaveAdminRoute() {
  const hash = getAdminHash();
  if (hash && window.location.hash === hash) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

function enterAdminRoute() {
  const hash = getAdminHash();
  if (hash && window.location.hash !== hash) {
    window.location.hash = hash;
  }
}

function AppContent() {
  const [user, setUser] = useState(() => {
    try {
      const t = localStorage.getItem("tvk_token");
      if (!t) return null;
      const payload = JSON.parse(atob(t.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) { localStorage.removeItem("tvk_token"); return null; }
      const u = { id: payload.userId, username: payload.username, role: payload.role };
      if (!["admin", "superadmin"].includes(u.role)) {
        localStorage.removeItem("tvk_token");
        return null;
      }
      return u;
    } catch { return null; }
  });
  const [adminRoute, setAdminRoute] = useState(isAdminRoute);
  const toast = useToast();

  useEffect(() => {
    const sync = () => setAdminRoute(isAdminRoute());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const isAdmin = user && ["admin", "superadmin"].includes(user.role);

  if (adminRoute) {
    if (isAdmin) {
    return (
      <>
        <style>{styles}</style>
        <AdminShell
          user={user}
            onViewSite={() => { leaveAdminRoute(); setAdminRoute(false); }}
        />
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
        <LoginPage
          onLogin={(u) => { setUser(u); enterAdminRoute(); setAdminRoute(true); }}
          onClose={() => { leaveAdminRoute(); setAdminRoute(false); }}
        />
      <ToastContainer toasts={toast.toasts} />
    </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <PublicTrackerView toast={toast} />
      <ToastContainer toasts={toast.toasts} />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
