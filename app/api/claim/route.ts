import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fullName = formData.get('fullName') as string;
    const age = formData.get('age') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const file = formData.get('photo') as File;
    const walletAddress = formData.get('userWallet') as string || null;

    if (!fullName || !phoneNumber || !file) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    // 1. Sécurisation absolue du dossier d'upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (dirError: any) {
      console.error("Erreur création dossier:", dirError);
      return NextResponse.json({ error: `Erreur dossier: ${dirError.message}` }, { status: 500 });
    }

    const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const filePath = join(uploadDir, uniqueFilename);
    const photoUrl = `/uploads/${uniqueFilename}`;

    try {
      await writeFile(filePath, buffer);
    } catch (fileError: any) {
      console.error("Erreur écriture fichier:", fileError);
      return NextResponse.json({ error: `Erreur fichier: ${fileError.message}` }, { status: 500 });
    }

    // 2. Création dans la base de données sans Prisma
    try {
      const connection = await mysql.createConnection(process.env.DATABASE_URL as string);
      const id = crypto.randomUUID();

      await connection.execute(
        `INSERT INTO EcoAction (id, fullName, age, phoneNumber, photoUrl, walletAddress, status, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW(3))`,
        [id, fullName, age, phoneNumber, photoUrl, walletAddress]
      );

      await connection.end();
      
      return NextResponse.json({ success: true, action: { id, fullName, status: 'PENDING' } });
    } catch (dbError: any) {
      console.error("Erreur base de données mysql2:", dbError);
      
      if (dbError?.code === "ER_DUP_ENTRY") {
        return NextResponse.json(
          { error: "Ce numéro de téléphone est déjà enregistré." },
          { status: 409 }
        );
      }
      
      return NextResponse.json({ error: `Erreur base de données: ${dbError.message}` }, { status: 500 });
    }

  } catch (globalError: any) {
    console.error("Erreur globale API:", globalError);
    return NextResponse.json({ error: globalError.message || "Erreur interne du serveur" }, { status: 500 });
  }
}
