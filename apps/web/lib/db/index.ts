import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), '../../data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
const DB_PATH = path.join(DATA_DIR, 'churchos.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  setupSchema(_db)
  seedIfEmpty(_db)
  return _db
}

function setupSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      org_id TEXT DEFAULT 'default',
      title TEXT NOT NULL,
      author TEXT,
      ccli_number TEXT,
      key TEXT,
      tempo INTEGER,
      tags TEXT DEFAULT '[]',
      sections TEXT DEFAULT '[]',
      default_arrangement TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS slide_decks (
      id TEXT PRIMARY KEY,
      org_id TEXT DEFAULT 'default',
      title TEXT NOT NULL,
      slides TEXT DEFAULT '[]',
      thumbnail_url TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      site_id TEXT DEFAULT 'site-1',
      title TEXT NOT NULL,
      scheduled_at TEXT,
      status TEXT DEFAULT 'draft',
      created_by TEXT DEFAULT 'local-user',
      items TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      org_id TEXT DEFAULT 'default',
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      url TEXT NOT NULL,
      size_bytes INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      folder_path TEXT DEFAULT '/',
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_templates (
      id TEXT PRIMARY KEY,
      org_id TEXT DEFAULT 'default',
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      items TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS song_history (
      id TEXT PRIMARY KEY,
      song_id TEXT NOT NULL,
      service_id TEXT,
      service_title TEXT,
      used_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scripture_collections (
      id TEXT PRIMARY KEY,
      org_id TEXT DEFAULT 'default',
      name TEXT NOT NULL,
      passages TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS output_profiles (
      id TEXT PRIMARY KEY,
      org_id TEXT DEFAULT 'default',
      name TEXT NOT NULL,
      config TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_folders (
      id TEXT PRIMARY KEY,
      org_id TEXT DEFAULT 'default',
      name TEXT NOT NULL,
      parent_id TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      org_id TEXT DEFAULT 'default',
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      config TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS volunteers (
      id TEXT PRIMARY KEY,
      org_id TEXT DEFAULT 'default',
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      roles TEXT DEFAULT '[]',
      availability TEXT DEFAULT '{}',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS volunteer_assignments (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      volunteer_id TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      org_id TEXT DEFAULT 'default',
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'viewer',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_media_folder ON media_items(folder_path);
    CREATE INDEX IF NOT EXISTS idx_volunteers_org ON volunteers(org_id);

    CREATE TABLE IF NOT EXISTS stream_configs (
      id TEXT PRIMARY KEY,
      org_id TEXT DEFAULT 'default',
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      rtmp_url TEXT,
      stream_key TEXT,
      is_active INTEGER DEFAULT 0,
      config TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS congregation_sessions (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      code TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prayer_requests (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      name TEXT,
      request TEXT NOT NULL,
      is_public INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS polls (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT DEFAULT '[]',
      responses TEXT DEFAULT '{}',
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'local-user',
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      detail TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, created_at);
    CREATE INDEX IF NOT EXISTS idx_congregation_code ON congregation_sessions(code);
    CREATE INDEX IF NOT EXISTS idx_song_history_song ON song_history(song_id);
    CREATE INDEX IF NOT EXISTS idx_templates_org ON service_templates(org_id);
    CREATE INDEX IF NOT EXISTS idx_songs_org ON songs(org_id);
    CREATE INDEX IF NOT EXISTS idx_services_site ON services(site_id);
  `)
}

export function now() { return new Date().toISOString() }
export function makeId() { return Math.random().toString(36).slice(2,10) + Date.now().toString(36) }
export function J(v: unknown) { return JSON.stringify(v) }
export function P(v: unknown) { try { return JSON.parse(v as string) } catch { return v } }

function seedIfEmpty(db: Database.Database) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM songs').get() as { c: number }).c
  if (count > 0) return

  const t = now()
  const ins = db.prepare(`
    INSERT INTO songs (id,org_id,title,author,ccli_number,key,tempo,tags,sections,default_arrangement,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `)

  ins.run('song-1','default','Amazing Grace','John Newton','11019','G',72,
    J(['hymn','classic']),
    J([
      {id:'v1',type:'verse',label:'Verse 1',lines:['Amazing grace! How sweet the sound','That saved a wretch like me!','I once was lost, but now am found,','Was blind, but now I see.']},
      {id:'v2',type:'verse',label:'Verse 2',lines:["'Twas grace that taught my heart to fear,",'And grace my fears relieved;','How precious did that grace appear','The hour I first believed.']},
      {id:'v3',type:'verse',label:'Verse 3',lines:['Through many dangers, toils and snares,','I have already come;',"'Tis grace that brought me safe thus far,",'And grace will lead me home.']},
      {id:'c1',type:'chorus',label:'Chorus',lines:['Praise God, praise God,','From whom all blessings flow,','Praise Him all creatures here below,','Praise Him above ye heavenly host.']}
    ]),
    J(['v1','c1','v2','c1','v3','c1']),t,t)

  ins.run('song-2','default','How Great Thou Art','Carl Boberg','','Bb',68,
    J(['hymn','worship']),
    J([
      {id:'v1',type:'verse',label:'Verse 1',lines:['O Lord my God, when I in awesome wonder','Consider all the worlds Thy hands have made,','I see the stars, I hear the rolling thunder,','Thy power throughout the universe displayed.']},
      {id:'c1',type:'chorus',label:'Chorus',lines:['Then sings my soul, my Saviour God, to Thee:','How great Thou art! How great Thou art!','Then sings my soul, my Saviour God, to Thee:','How great Thou art! How great Thou art!']},
      {id:'v2',type:'verse',label:'Verse 2',lines:['When through the woods and forest glades I wander','And hear the birds sing sweetly in the trees,','When I look down from lofty mountain grandeur','And see the brook and feel the gentle breeze.']}
    ]),
    J(['v1','c1','v2','c1']),t,t)

  ins.run('song-3','default','Blessed Assurance','Fanny Crosby','22324','D',76,
    J(['hymn']),
    J([
      {id:'v1',type:'verse',label:'Verse 1',lines:['Blessed assurance, Jesus is mine!','Oh, what a foretaste of glory divine!','Heir of salvation, purchase of God,','Born of His Spirit, washed in His blood.']},
      {id:'c1',type:'chorus',label:'Chorus',lines:['This is my story, this is my song,','Praising my Saviour all the day long;','This is my story, this is my song,','Praising my Saviour all the day long.']}
    ]),
    J(['v1','c1']),t,t)

  ins.run('song-4','default','10,000 Reasons','Matt Redman','6016351','G',73,
    J(['contemporary','worship']),
    J([
      {id:'c1',type:'chorus',label:'Chorus',lines:['Bless the Lord, O my soul, O my soul,','Worship His holy name.','Sing like never before, O my soul,','I worship Your holy name.']},
      {id:'v1',type:'verse',label:'Verse 1',lines:['The sun comes up, it is a new day dawning,','It is time to sing Your song again.','Whatever may pass and whatever lies before me,','Let me be singing when the evening comes.']}
    ]),
    J(['c1','v1','c1']),t,t)

  ins.run('song-5','default','Great Is Thy Faithfulness','Thomas Chisholm','18723','Eb',70,
    J(['hymn']),
    J([
      {id:'v1',type:'verse',label:'Verse 1',lines:['Great is Thy faithfulness, O God my Father,','There is no shadow of turning with Thee;','Thou changest not, Thy compassions they fail not,','As Thou hast been, Thou forever will be.']},
      {id:'c1',type:'chorus',label:'Chorus',lines:['Great is Thy faithfulness! Great is Thy faithfulness!','Morning by morning new mercies I see.','All I have needed Thy hand hath provided;','Great is Thy faithfulness, Lord, unto me!']}
    ]),
    J(['v1','c1']),t,t)

  // Seed a slide deck
  const insDeck = db.prepare(`
    INSERT INTO slide_decks (id,org_id,title,slides,tags,created_at,updated_at) VALUES (?,?,?,?,?,?,?)
  `)
  insDeck.run('deck-1','default','Welcome & Announcements',
    J([
      {id:'s1',type:'announcement',content:'Welcome to\nSunday Service',subContent:'We are glad you are here',
        background:{type:'gradient',gradient:{from:'#1a1c24',to:'#0d0f14',angle:135}},
        typography:{fontFamily:'Georgia, serif',fontSize:64,fontWeight:700,color:'#c8a96e',lineHeight:1.2,letterSpacing:0,shadow:'0 2px 12px rgba(0,0,0,0.8)',align:'center'},
        layout:'center',transition:'fade',transitionDuration:500},
      {id:'s2',type:'announcement',content:'Notices',subContent:'Please silence your mobile phones\nToilets are located in the foyer',
        background:{type:'solid',color:'#0d0f14'},
        typography:{fontFamily:'Georgia, serif',fontSize:48,fontWeight:400,color:'#e8e0d0',lineHeight:1.4,letterSpacing:0,shadow:'0 1px 6px rgba(0,0,0,0.6)',align:'center'},
        layout:'center',transition:'fade',transitionDuration:400},
      {id:'s3',type:'blank',content:'',background:{type:'solid',color:'#000000'},
        typography:{fontFamily:'Georgia, serif',fontSize:48,fontWeight:400,color:'#ffffff',lineHeight:1.4,letterSpacing:0,align:'center'},
        layout:'center',transition:'cut',transitionDuration:0}
    ]),
    J(['welcome']),t,t)

  insDeck.run('deck-2','default','Sermon: The Good Shepherd',
    J([
      {id:'s1',type:'text',content:'The Good Shepherd',subContent:'John 10:1-18',
        background:{type:'gradient',gradient:{from:'#1a3a2a',to:'#0d1a14',angle:160}},
        typography:{fontFamily:'Georgia, serif',fontSize:72,fontWeight:700,color:'#c8e8b0',lineHeight:1.2,letterSpacing:0,shadow:'0 2px 12px rgba(0,0,0,0.8)',align:'center'},
        layout:'center',transition:'fade',transitionDuration:600},
      {id:'s2',type:'scripture',content:'"I am the good shepherd. The good shepherd lays down his life for the sheep."',subContent:'John 10:11',
        background:{type:'solid',color:'#0d0f14'},
        typography:{fontFamily:'Georgia, serif',fontSize:44,fontWeight:400,color:'#ffffff',lineHeight:1.5,letterSpacing:0,shadow:'0 1px 8px rgba(0,0,0,0.7)',align:'center'},
        layout:'center',transition:'fade',transitionDuration:500},
      {id:'s3',type:'text',content:'Three Marks of the Good Shepherd',subContent:'',
        background:{type:'solid',color:'#111318'},
        typography:{fontFamily:'Georgia, serif',fontSize:56,fontWeight:700,color:'#c8a96e',lineHeight:1.3,letterSpacing:0,shadow:'0 2px 8px rgba(0,0,0,0.6)',align:'center'},
        layout:'center',transition:'fade',transitionDuration:400},
      {id:'s4',type:'text',content:'1. He knows His sheep',subContent:'John 10:14 — "I know my sheep and my sheep know me"',
        background:{type:'solid',color:'#111318'},
        typography:{fontFamily:'Georgia, serif',fontSize:52,fontWeight:400,color:'#e8e0d0',lineHeight:1.4,letterSpacing:0,shadow:'0 1px 6px rgba(0,0,0,0.5)',align:'center'},
        layout:'center',transition:'slide-left',transitionDuration:400},
      {id:'s5',type:'text',content:'2. He leads His sheep',subContent:'Psalm 23:2 — "He leads me beside quiet waters"',
        background:{type:'solid',color:'#111318'},
        typography:{fontFamily:'Georgia, serif',fontSize:52,fontWeight:400,color:'#e8e0d0',lineHeight:1.4,letterSpacing:0,shadow:'0 1px 6px rgba(0,0,0,0.5)',align:'center'},
        layout:'center',transition:'slide-left',transitionDuration:400},
      {id:'s6',type:'text',content:'3. He lays down His life',subContent:'John 10:11 — Ultimate sacrifice and love',
        background:{type:'solid',color:'#111318'},
        typography:{fontFamily:'Georgia, serif',fontSize:52,fontWeight:400,color:'#e8e0d0',lineHeight:1.4,letterSpacing:0,shadow:'0 1px 6px rgba(0,0,0,0.5)',align:'center'},
        layout:'center',transition:'slide-left',transitionDuration:400}
    ]),
    J(['sermon']),t,t)

  // Seed a service
  const insSvc = db.prepare(`
    INSERT INTO services (id,site_id,title,scheduled_at,status,created_by,items,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `)
  const nextSunday = new Date()
  nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7 || 7)
  nextSunday.setHours(10,0,0,0)

  insSvc.run('svc-1','site-1','Sunday Morning Service',nextSunday.toISOString(),'draft','local-user',
    J([
      {id:'i1',type:'slide_deck',reference_id:'deck-1',label:'Welcome & Notices',position:0,config:{}},
      {id:'i2',type:'song',reference_id:'song-1',label:'Amazing Grace',position:1,config:{}},
      {id:'i3',type:'scripture',reference_id:null,label:'John 3:16-18',position:2,config:{book:'John',chapter:3,verseStart:16,verseEnd:18}},
      {id:'i4',type:'song',reference_id:'song-2',label:'How Great Thou Art',position:3,config:{}},
      {id:'i5',type:'slide_deck',reference_id:'deck-2',label:'Sermon Slides',position:4,config:{}},
      {id:'i6',type:'song',reference_id:'song-3',label:'Blessed Assurance',position:5,config:{}},
      {id:'i7',type:'announcement',reference_id:null,label:'Closing Announcements',position:6,config:{}}
    ]),
    t,t)

  const wed = new Date()
  wed.setDate(wed.getDate() + (3 - wed.getDay() + 7) % 7 || 7)
  wed.setHours(19,0,0,0)

  insSvc.run('svc-2','site-1','Wednesday Prayer Meeting',wed.toISOString(),'draft','local-user',
    J([
      {id:'i1',type:'song',reference_id:'song-4',label:'10,000 Reasons',position:0,config:{}},
      {id:'i2',type:'scripture',reference_id:null,label:'Psalm 23',position:1,config:{book:'Psalms',chapter:23,verseStart:1,verseEnd:6}},
      {id:'i3',type:'song',reference_id:'song-5',label:'Great Is Thy Faithfulness',position:2,config:{}}
    ]),
    t,t)
}

// ── CRUD helpers ─────────────────────────────────────────────────────────────

export function getAllSongs() {
  const db = getDb()
  return (db.prepare('SELECT * FROM songs ORDER BY title').all() as any[]).map(r => ({
    ...r, tags: P(r.tags), sections: P(r.sections), default_arrangement: P(r.default_arrangement)
  }))
}

export function getSongById(id: string) {
  const db = getDb()
  const r = db.prepare('SELECT * FROM songs WHERE id=?').get(id) as any
  if (!r) return null
  return { ...r, tags: P(r.tags), sections: P(r.sections), default_arrangement: P(r.default_arrangement) }
}

export function upsertSong(song: any) {
  const db = getDb()
  const t = now()
  const id = song.id || makeId()
  db.prepare(`
    INSERT INTO songs (id,org_id,title,author,ccli_number,key,tempo,tags,sections,default_arrangement,created_at,updated_at)
    VALUES (@id,@org_id,@title,@author,@ccli_number,@key,@tempo,@tags,@sections,@default_arrangement,@created_at,@updated_at)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, author=excluded.author, ccli_number=excluded.ccli_number,
      key=excluded.key, tempo=excluded.tempo, tags=excluded.tags,
      sections=excluded.sections, default_arrangement=excluded.default_arrangement, updated_at=excluded.updated_at
  `).run({ ...song, id, org_id: song.org_id||'default', tags: J(song.tags||[]),
    sections: J(song.sections||[]), default_arrangement: J(song.default_arrangement||[]),
    created_at: song.created_at||t, updated_at: t })
  return getSongById(id)
}

export function deleteSong(id: string) {
  getDb().prepare('DELETE FROM songs WHERE id=?').run(id)
}

export function getAllSlideDecks() {
  const db = getDb()
  return (db.prepare('SELECT * FROM slide_decks ORDER BY title').all() as any[]).map(r => ({
    ...r, tags: P(r.tags), slides: P(r.slides)
  }))
}

export function getSlideDeckById(id: string) {
  const db = getDb()
  const r = db.prepare('SELECT * FROM slide_decks WHERE id=?').get(id) as any
  if (!r) return null
  return { ...r, tags: P(r.tags), slides: P(r.slides) }
}

export function upsertSlideDeck(deck: any) {
  const db = getDb()
  const t = now()
  const id = deck.id || makeId()
  db.prepare(`
    INSERT INTO slide_decks (id,org_id,title,slides,thumbnail_url,tags,created_at,updated_at)
    VALUES (@id,@org_id,@title,@slides,@thumbnail_url,@tags,@created_at,@updated_at)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, slides=excluded.slides,
      thumbnail_url=excluded.thumbnail_url, tags=excluded.tags, updated_at=excluded.updated_at
  `).run({ ...deck, id, org_id: deck.org_id||'default', slides: J(deck.slides||[]),
    tags: J(deck.tags||[]), thumbnail_url: deck.thumbnail_url||null,
    created_at: deck.created_at||t, updated_at: t })
  return getSlideDeckById(id)
}

export function deleteSlideDeck(id: string) {
  getDb().prepare('DELETE FROM slide_decks WHERE id=?').run(id)
}

export function getAllServices() {
  const db = getDb()
  return (db.prepare('SELECT * FROM services ORDER BY scheduled_at DESC').all() as any[]).map(r => ({
    ...r, items: P(r.items)
  }))
}

export function getServiceById(id: string) {
  const db = getDb()
  const r = db.prepare('SELECT * FROM services WHERE id=?').get(id) as any
  if (!r) return null
  return { ...r, items: P(r.items) }
}

export function upsertService(svc: any) {
  const db = getDb()
  const t = now()
  const id = svc.id || makeId()
  db.prepare(`
    INSERT INTO services (id,site_id,title,scheduled_at,status,created_by,items,created_at,updated_at)
    VALUES (@id,@site_id,@title,@scheduled_at,@status,@created_by,@items,@created_at,@updated_at)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, scheduled_at=excluded.scheduled_at, status=excluded.status,
      items=excluded.items, updated_at=excluded.updated_at
  `).run({ ...svc, id, site_id: svc.site_id||'site-1', items: J(svc.items||[]),
    created_by: svc.created_by||'local-user',
    created_at: svc.created_at||t, updated_at: t })
  return getServiceById(id)
}

export function deleteService(id: string) {
  getDb().prepare('DELETE FROM services WHERE id=?').run(id)
}

export function getAllMedia() {
  const db = getDb()
  return (db.prepare('SELECT * FROM media_items ORDER BY created_at DESC').all() as any[]).map(r => ({
    ...r, tags: P(r.tags), metadata: P(r.metadata)
  }))
}

// ── Service Templates ─────────────────────────────────────────────────────────

export function getAllTemplates() {
  const db = getDb()
  return (db.prepare('SELECT * FROM service_templates ORDER BY name').all() as any[]).map(r => ({
    ...r, items: P(r.items), tags: P(r.tags)
  }))
}
export function getTemplateById(id: string) {
  const db = getDb()
  const r = db.prepare('SELECT * FROM service_templates WHERE id=?').get(id) as any
  if (!r) return null
  return { ...r, items: P(r.items), tags: P(r.tags) }
}
export function upsertTemplate(tmpl: any) {
  const db = getDb()
  const t = now()
  const id = tmpl.id || makeId()
  db.prepare(`
    INSERT INTO service_templates (id,org_id,name,description,items,tags,created_at,updated_at)
    VALUES (@id,@org_id,@name,@description,@items,@tags,@created_at,@updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, description=excluded.description,
      items=excluded.items, tags=excluded.tags, updated_at=excluded.updated_at
  `).run({ ...tmpl, id, org_id: tmpl.org_id||'default',
    items: J(tmpl.items||[]), tags: J(tmpl.tags||[]),
    description: tmpl.description||'',
    created_at: tmpl.created_at||t, updated_at: t })
  return getTemplateById(id)
}
export function deleteTemplate(id: string) {
  getDb().prepare('DELETE FROM service_templates WHERE id=?').run(id)
}

// ── Song History ──────────────────────────────────────────────────────────────

export function logSongUsage(songId: string, serviceId: string, serviceTitle: string) {
  const db = getDb()
  db.prepare(`INSERT INTO song_history (id,song_id,service_id,service_title,used_at) VALUES (?,?,?,?,?)`)
    .run(makeId(), songId, serviceId, serviceTitle, now())
}
export function getSongHistory(songId: string) {
  return (getDb().prepare('SELECT * FROM song_history WHERE song_id=? ORDER BY used_at DESC LIMIT 20').all(songId) as any[])
}
export function getAllSongHistory() {
  return (getDb().prepare('SELECT * FROM song_history ORDER BY used_at DESC LIMIT 100').all() as any[])
}

// ── Scripture Collections ─────────────────────────────────────────────────────

export function getAllCollections() {
  const db = getDb()
  return (db.prepare('SELECT * FROM scripture_collections ORDER BY name').all() as any[]).map(r => ({
    ...r, passages: P(r.passages)
  }))
}
export function upsertCollection(col: any) {
  const db = getDb()
  const t = now()
  const id = col.id || makeId()
  db.prepare(`
    INSERT INTO scripture_collections (id,org_id,name,passages,created_at,updated_at)
    VALUES (@id,@org_id,@name,@passages,@created_at,@updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, passages=excluded.passages, updated_at=excluded.updated_at
  `).run({ ...col, id, org_id: col.org_id||'default',
    passages: J(col.passages||[]),
    created_at: col.created_at||t, updated_at: t })
  return getDb().prepare('SELECT * FROM scripture_collections WHERE id=?').get(id)
}
export function deleteCollection(id: string) {
  getDb().prepare('DELETE FROM scripture_collections WHERE id=?').run(id)
}

// ── Output Profiles ───────────────────────────────────────────────────────────

export function getAllOutputProfiles() {
  return (getDb().prepare('SELECT * FROM output_profiles ORDER BY name').all() as any[]).map(r => ({
    ...r, config: P(r.config)
  }))
}
export function upsertOutputProfile(profile: any) {
  const db = getDb()
  const t = now()
  const id = profile.id || makeId()
  db.prepare(`
    INSERT INTO output_profiles (id,org_id,name,config,created_at,updated_at)
    VALUES (@id,@org_id,@name,@config,@created_at,@updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, config=excluded.config, updated_at=excluded.updated_at
  `).run({ ...profile, id, org_id: profile.org_id||'default',
    config: J(profile.config||{}),
    created_at: profile.created_at||t, updated_at: t })
  return getDb().prepare('SELECT * FROM output_profiles WHERE id=?').get(id)
}
export function deleteOutputProfile(id: string) {
  getDb().prepare('DELETE FROM output_profiles WHERE id=?').run(id)
}

// ── Media Folders ─────────────────────────────────────────────────────────────

export function getAllFolders() {
  return getDb().prepare('SELECT * FROM media_folders ORDER BY name').all() as any[]
}
export function createFolder(name: string, parentId?: string) {
  const db = getDb(); const id = makeId(); const t = now()
  db.prepare('INSERT INTO media_folders (id,org_id,name,parent_id,created_at) VALUES (?,?,?,?,?)')
    .run(id, 'default', name, parentId || null, t)
  return db.prepare('SELECT * FROM media_folders WHERE id=?').get(id)
}
export function deleteFolder(id: string) {
  getDb().prepare('DELETE FROM media_folders WHERE id=?').run(id)
}
export function moveMediaToFolder(mediaId: string, folderPath: string) {
  const db = getDb()
  db.prepare('UPDATE media_items SET folder_path=? WHERE id=?').run(folderPath, mediaId)
}

// ── Themes ────────────────────────────────────────────────────────────────────

export function getAllThemes() {
  return (getDb().prepare('SELECT * FROM themes ORDER BY name').all() as any[]).map(r => ({
    ...r, config: P(r.config), is_active: !!r.is_active
  }))
}
export function getActiveTheme() {
  const r = getDb().prepare('SELECT * FROM themes WHERE is_active=1 LIMIT 1').get() as any
  return r ? { ...r, config: P(r.config), is_active: true } : null
}
export function upsertTheme(theme: any) {
  const db = getDb(); const t = now(); const id = theme.id || makeId()
  db.prepare(`
    INSERT INTO themes (id,org_id,name,is_active,config,created_at,updated_at)
    VALUES (@id,@org_id,@name,@is_active,@config,@created_at,@updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, is_active=excluded.is_active, config=excluded.config, updated_at=excluded.updated_at
  `).run({ ...theme, id, org_id:'default', config: J(theme.config||{}),
    is_active: theme.is_active ? 1 : 0, created_at: theme.created_at||t, updated_at: t })
  return db.prepare('SELECT * FROM themes WHERE id=?').get(id)
}
export function setActiveTheme(id: string) {
  const db = getDb()
  db.prepare('UPDATE themes SET is_active=0').run()
  db.prepare('UPDATE themes SET is_active=1 WHERE id=?').run(id)
}
export function deleteTheme(id: string) {
  getDb().prepare('DELETE FROM themes WHERE id=?').run(id)
}

// ── Volunteers ────────────────────────────────────────────────────────────────

export function getAllVolunteers() {
  return (getDb().prepare('SELECT * FROM volunteers ORDER BY name').all() as any[]).map(r => ({
    ...r, roles: P(r.roles), availability: P(r.availability)
  }))
}
export function upsertVolunteer(vol: any) {
  const db = getDb(); const t = now(); const id = vol.id || makeId()
  db.prepare(`
    INSERT INTO volunteers (id,org_id,name,email,phone,roles,availability,notes,created_at,updated_at)
    VALUES (@id,@org_id,@name,@email,@phone,@roles,@availability,@notes,@created_at,@updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, email=excluded.email, phone=excluded.phone,
      roles=excluded.roles, availability=excluded.availability, notes=excluded.notes, updated_at=excluded.updated_at
  `).run({ ...vol, id, org_id:'default', roles: J(vol.roles||[]),
    availability: J(vol.availability||{}), notes: vol.notes||'',
    email: vol.email||'', phone: vol.phone||'',
    created_at: vol.created_at||t, updated_at: t })
  return db.prepare('SELECT * FROM volunteers WHERE id=?').get(id)
}
export function deleteVolunteer(id: string) {
  getDb().prepare('DELETE FROM volunteers WHERE id=?').run(id)
}
export function getAssignmentsForService(serviceId: string) {
  return getDb().prepare('SELECT * FROM volunteer_assignments WHERE service_id=?').all(serviceId) as any[]
}
export function upsertAssignment(a: any) {
  const db = getDb(); const id = a.id || makeId(); const t = now()
  db.prepare(`INSERT INTO volunteer_assignments (id,service_id,volunteer_id,role,status,created_at)
    VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status`)
    .run(id, a.service_id, a.volunteer_id, a.role, a.status||'pending', t)
  return db.prepare('SELECT * FROM volunteer_assignments WHERE id=?').get(id)
}
export function deleteAssignment(id: string) {
  getDb().prepare('DELETE FROM volunteer_assignments WHERE id=?').run(id)
}

// ── Aliases for AI routes (do not duplicate above functions) ─────────────────

export const getAllDecks = getAllSlideDecks

export function createService(svc: any) {
  return upsertService(svc)
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export function logAudit(action: string, entity: string, entityId: string, detail: any = {}, userId = 'local-user') {
  const db = getDb()
  db.prepare('INSERT INTO audit_log (id,user_id,action,entity,entity_id,detail,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(makeId(), userId, action, entity, entityId, J(detail), now())
}

export function getAuditLog(limit = 100, entity?: string) {
  const db = getDb()
  if (entity) {
    return db.prepare('SELECT * FROM audit_log WHERE entity=? ORDER BY created_at DESC LIMIT ?').all(entity, limit) as any[]
  }
  return db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?').all(limit) as any[]
}
