import { NextResponse } from 'next/server'
import { createWriteStream, mkdirSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// Parse pptx using Node's built-in zlib (pptx files are ZIP archives)
// Extracts slide titles and text content without any npm dependencies
async function parsePptx(buffer: Buffer): Promise<any[]> {
  const zlib = require('zlib')
  const entries: any[] = []

  // PPTX is a ZIP — find slide XML files by scanning for the local file header
  // signature (PK\x03\x04) and extracting slide text
  let pos = 0
  const slides: {name:string, content:string}[] = []

  while (pos < buffer.length - 4) {
    // Local file header signature
    if (buffer[pos]===0x50 && buffer[pos+1]===0x4B && buffer[pos+2]===0x03 && buffer[pos+3]===0x04) {
      const compression = buffer.readUInt16LE(pos + 8)
      const compressedSize = buffer.readUInt32LE(pos + 18)
      const fileNameLen = buffer.readUInt16LE(pos + 26)
      const extraLen = buffer.readUInt16LE(pos + 28)
      const fileName = buffer.slice(pos + 30, pos + 30 + fileNameLen).toString('utf8')
      const dataStart = pos + 30 + fileNameLen + extraLen
      const compressedData = buffer.slice(dataStart, dataStart + compressedSize)

      if (fileName.match(/ppt\/slides\/slide\d+\.xml$/)) {
        try {
          const xml = compression === 8
            ? zlib.inflateRawSync(compressedData).toString('utf8')
            : compressedData.toString('utf8')
          slides.push({ name: fileName, content: xml })
        } catch {}
      }
      pos = dataStart + compressedSize
    } else {
      pos++
    }
  }

  // Extract text from slide XML
  return slides.map((slide, i) => {
    const texts: string[] = []
    const tagMatches = slide.content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || []
    tagMatches.forEach(m => {
      const text = m.replace(/<[^>]+>/g, '').trim()
      if (text) texts.push(text)
    })
    const content = texts.slice(0, 1).join('') || `Slide ${i + 1}`
    const subContent = texts.slice(1, 4).join(' · ')
    return {
      id: `s${i + 1}`,
      type: 'text',
      content,
      subContent,
      background: { type: 'solid', color: '#0d0f14' },
      typography: {
        fontFamily: 'Georgia, serif',
        fontSize: 52,
        fontWeight: 700,
        color: '#e8e0d0',
        lineHeight: 1.3,
        letterSpacing: 0,
        shadow: '0 2px 8px rgba(0,0,0,0.8)',
        align: 'center'
      },
      layout: 'center',
      transition: 'fade',
      transitionDuration: 400,
    }
  })
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const slides = await parsePptx(buffer)

    if (slides.length === 0) {
      return NextResponse.json({ error: 'No slides found in file. Make sure it is a valid .pptx file.' }, { status: 400 })
    }

    return NextResponse.json({ slides, count: slides.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
