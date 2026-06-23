import { NextResponse } from 'next/server'
import { getAllFolders, createFolder, deleteFolder } from '@/lib/db'

export async function GET() { return NextResponse.json(getAllFolders()) }
export async function POST(req: Request) {
  const { name, parentId } = await req.json()
  return NextResponse.json(createFolder(name, parentId))
}
