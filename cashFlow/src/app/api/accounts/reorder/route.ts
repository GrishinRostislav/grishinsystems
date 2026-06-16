import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Process updates sequentially in a transaction to ensure atomicity
    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.account.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder accounts:", error);
    return NextResponse.json({ error: "Failed to reorder accounts" }, { status: 500 });
  }
}
