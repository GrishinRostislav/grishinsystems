import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deckId = searchParams.get('deckId');
    const dueOnly = searchParams.get('dueOnly') === 'true';

    if (!deckId) {
      return NextResponse.json({ error: 'deckId is required' }, { status: 400 });
    }

    const now = new Date();

    const whereClause: any = {
      userId: user.id,
      deckId,
    };

    if (dueOnly) {
      whereClause.nextReview = {
        lte: now,
      };
    }

    const words = await prisma.word.findMany({
      where: whereClause,
      orderBy: [
        { nextReview: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ words });
  } catch (error) {
    console.error('Error fetching words:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, translation, context, deckId } = await req.json();

    if (!text || !text.trim() || !translation || !translation.trim() || !deckId) {
      return NextResponse.json({ error: 'Text, translation, and deckId are required' }, { status: 400 });
    }

    // Verify deck belongs to the user
    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId: user.id },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found or access denied' }, { status: 404 });
    }

    const word = await prisma.word.create({
      data: {
        text: text.trim(),
        translation: translation.trim(),
        context: context?.trim() || null,
        userId: user.id,
        deckId,
        // Initialize FSRS scheduler parameters
        state: 0,
        difficulty: 0.0,
        stability: 0.0,
        retrievability: 0.0,
        elapsedDays: 0,
        scheduledDays: 0,
        nextReview: new Date(), // Review immediately
      },
    });

    return NextResponse.json({ word });
  } catch (error) {
    console.error('Error creating word:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
