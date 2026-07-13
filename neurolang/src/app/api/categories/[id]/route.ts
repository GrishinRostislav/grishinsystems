import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { isHidden } = await req.json();
    const updated = await prisma.category.update({
      where: { id },
      data: { isHidden },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    if (category.name === "General") {
      return NextResponse.json({ error: "Cannot delete default General category" }, { status: 400 });
    }

    // 1. Move all words in this category to "General"
    await prisma.word.updateMany({
      where: { category: category.name },
      data: { category: "General" },
    });

    // 2. Delete the category
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: `Category deleted, words moved to General.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
