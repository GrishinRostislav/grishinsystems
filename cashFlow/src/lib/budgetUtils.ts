import { prisma } from "@/lib/prisma";

export function getCurrentPeriodDates(period: string, budgetStartDate: Date, budgetEndDate: Date | null) {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  if (period === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === 'yearly') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    start = new Date(budgetStartDate);
    end = budgetEndDate ? new Date(budgetEndDate) : new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

export function addFrequency(date: Date, freq: string): Date {
  const next = new Date(date);
  switch (freq) {
    case 'DAILY': next.setDate(next.getDate() + 1); break;
    case 'WEEKLY': next.setDate(next.getDate() + 7); break;
    case 'BIWEEKLY': next.setDate(next.getDate() + 14); break;
    case 'MONTHLY': next.setMonth(next.getMonth() + 1); break;
    case 'YEARLY': next.setFullYear(next.getFullYear() + 1); break;
  }
  return next;
}

export async function getCategoryDescendantIds(rootIds: string[]) {
  const allCategories = await prisma.category.findMany({ select: { id: true, parentId: true } });
  
  const childrenMap = new Map<string, string[]>();
  for (const cat of allCategories) {
    if (cat.parentId) {
      if (!childrenMap.has(cat.parentId)) childrenMap.set(cat.parentId, []);
      childrenMap.get(cat.parentId)!.push(cat.id);
    }
  }

  const result = new Set<string>(rootIds);
  const queue = [...rootIds];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childrenMap.get(current) || [];
    for (const child of children) {
      if (!result.has(child)) {
        result.add(child);
        queue.push(child);
      }
    }
  }
  return Array.from(result);
}
