import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const scenarios = await prisma.forecastScenario.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch scenarios" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, isActive, items } = body;

    const scenario = await prisma.forecastScenario.create({
      data: {
        name,
        isActive: !!isActive,
        items: {
          create: (items || []).map((item: any) => ({
            name: item.name,
            amount: parseFloat(item.amount),
            type: item.type || 'expense',
            date: new Date(item.date),
            frequency: item.frequency || 'ONCE',
            endDate: item.endDate ? new Date(item.endDate) : null,
            annualRate: item.annualRate ? parseFloat(item.annualRate) : null,
          }))
        }
      },
      include: { items: true }
    });

    return NextResponse.json(scenario, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create scenario" }, { status: 500 });
  }
}
