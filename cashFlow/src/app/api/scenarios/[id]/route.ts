import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, isActive, items } = body;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // We can do a full replace of items if they are provided,
    // or just update isActive if only isActive is passed (for toggling).
    if (name === undefined && items === undefined && isActive !== undefined) {
      // Toggle case
      if (isActive) {
        // Automatically align any item dates in the past to start from today
        const existingItems = await prisma.scenarioItem.findMany({ where: { scenarioId: id } });
        for (const item of existingItems) {
          if (new Date(item.date) < startOfToday) {
            await prisma.scenarioItem.update({
              where: { id: item.id },
              data: { date: new Date() }
            });
          }
        }
      }

      const updated = await prisma.forecastScenario.update({
        where: { id },
        data: { isActive: !!isActive },
        include: { items: true }
      });
      return NextResponse.json(updated);
    }

    // Full update case
    // First delete existing items
    await prisma.scenarioItem.deleteMany({
      where: { scenarioId: id }
    });

    const updated = await prisma.forecastScenario.update({
      where: { id },
      data: {
        name,
        isActive: !!isActive,
        items: {
          create: (items || []).map((item: any) => {
            let itemDate = new Date(item.date);
            if (isActive && itemDate < startOfToday) {
              itemDate = new Date();
            }
            return {
              name: item.name,
              amount: parseFloat(item.amount),
              type: item.type || 'expense',
              date: itemDate,
              frequency: item.frequency || 'ONCE',
              interval: item.interval ? parseInt(item.interval) : 1,
              daysOfWeek: Array.isArray(item.daysOfWeek) ? item.daysOfWeek : [],
              monthsOfYear: Array.isArray(item.monthsOfYear) ? item.monthsOfYear : [],
              endDate: item.endDate ? new Date(item.endDate) : null,
              annualRate: item.annualRate ? parseFloat(item.annualRate) : null,
            };
          })
        }
      },
      include: { items: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update scenario" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    await prisma.forecastScenario.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete scenario" }, { status: 500 });
  }
}
