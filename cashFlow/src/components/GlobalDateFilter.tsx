import React, { useEffect, useState } from "react";

function getLocalYMD(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type GlobalDateFilterProps = {
  onDatesChange: (startDate: string, endDate: string) => void;
};

function computeDates(val: string): { startStr: string, endStr: string } {
  const now = new Date();
  let endStr = getLocalYMD(now);
  let startStr = getLocalYMD(now);

  if (val === "week") {
    now.setDate(now.getDate() - 7);
    startStr = getLocalYMD(now);
  } else if (val === "month") {
    now.setDate(now.getDate() - 30);
    startStr = getLocalYMD(now);
  } else if (val === "year") {
    now.setDate(now.getDate() - 365);
    startStr = getLocalYMD(now);
  } else if (val === "this_week") {
    const day = now.getDay() || 7; 
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    startStr = getLocalYMD(start);
    endStr = getLocalYMD(end);
  } else if (val === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    startStr = getLocalYMD(start);
    endStr = getLocalYMD(end);
  } else if (val === "this_year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    startStr = getLocalYMD(start);
    endStr = getLocalYMD(end);
  } else if (val === "all") {
    startStr = getLocalYMD(new Date(0));
  }
  
  return { startStr, endStr };
}

export default function GlobalDateFilter({ onDatesChange }: GlobalDateFilterProps) {
  const [interval, setIntervalState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("global_date_interval") || "month";
    }
    return "month";
  });

  const [startDate, setStartDate] = useState(() => {
    const intv = typeof window !== "undefined" ? (localStorage.getItem("global_date_interval") || "month") : "month";
    if (intv === "custom" && typeof window !== "undefined") {
      const stored = localStorage.getItem("global_start_date");
      if (stored) return stored;
    }
    return computeDates(intv).startStr;
  });

  const [endDate, setEndDate] = useState(() => {
    const intv = typeof window !== "undefined" ? (localStorage.getItem("global_date_interval") || "month") : "month";
    if (intv === "custom" && typeof window !== "undefined") {
      const stored = localStorage.getItem("global_end_date");
      if (stored) return stored;
    }
    return computeDates(intv).endStr;
  });

  useEffect(() => {
    // Notify parent immediately
    onDatesChange(startDate, endDate);
  }, [startDate, endDate]);

  const handleIntervalChange = (val: string) => {
    setIntervalState(val);
    if (typeof window !== "undefined") localStorage.setItem("global_date_interval", val);
    if (val !== "custom") {
      const { startStr, endStr } = computeDates(val);
      setEndDate(endStr);
      if (typeof window !== "undefined") localStorage.setItem("global_end_date", endStr);
      setStartDate(startStr);
      if (typeof window !== "undefined") localStorage.setItem("global_start_date", startStr);
    }
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (typeof window !== "undefined") localStorage.setItem("global_start_date", val);
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (typeof window !== "undefined") localStorage.setItem("global_end_date", val);
  };

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      {interval === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>From</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => handleStartDateChange(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', cursor: 'pointer' }}
            />
          </div>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>To</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => handleEndDateChange(e.target.value)}
              min={startDate}
              style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', cursor: 'pointer' }}
            />
          </div>
        </div>
      )}
      <select 
        value={interval} 
        onChange={(e) => handleIntervalChange(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white' }}
      >
        <option value="month">Past 30 Days</option>
        <option value="week">Past 7 Days</option>
        <option value="year">Past 365 Days</option>
        <option value="this_month">This Month</option>
        <option value="this_week">This Week</option>
        <option value="this_year">This Year</option>
        <option value="all">All Time</option>
        <option value="custom">Custom Dates</option>
      </select>
    </div>
  );
}
