import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const { uid, role, isSuperAdmin } = await req.json();
    if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 });
    
    await adminAuth.setCustomUserClaims(uid, { role, isSuperAdmin });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
