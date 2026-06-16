import React, { useEffect, useState } from "react";

type GlobalDateFilterProps = {
  onDatesChange: (startDate: string, endDate: string) => void;
};

export default function GlobalDateFilter({ onDatesChange }: GlobalDateFilterProps) {
  const [interval, setIntervalState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("global_date_interval") || "year";
    }
    return "year";
  });

  const [startDate, setStartDate] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("global_start_date");
      if (stored) return stored;
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });

  const [endDate, setEndDate] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("global_end_date");
      if (stored) return stored;
    }
    return new Date().toISOString().slice(0, 10);
  });

  useEffect(() => {
    // Notify parent immediately
    onDatesChange(startDate, endDate);
  }, [startDate, endDate]);

  const handleIntervalChange = (val: string) => {
    setIntervalState(val);
    if (typeof window !== "undefined") localStorage.setItem("global_date_interval", val);
    
    const now = new Date();
    const endStr = now.toISOString().slice(0, 10);
    setEndDate(endStr);
    if (typeof window !== "undefined") localStorage.setItem("global_end_date", endStr);
    
    let startStr = startDate;
    if (val === "week") {
      now.setDate(now.getDate() - 7);
      startStr = now.toISOString().slice(0, 10);
    } else if (val === "month") {
      now.setMonth(now.getMonth() - 1);
      startStr = now.toISOString().slice(0, 10);
    } else if (val === "year") {
      now.setFullYear(now.getFullYear() - 1);
      startStr = now.toISOString().slice(0, 10);
    } else if (val === "all") {
      startStr = new Date(0).toISOString().slice(0, 10);
    }

    if (val !== "custom") {
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
        <option value="week">Past Week</option>
        <option value="month">Past Month</option>
        <option value="year">Past Year</option>
        <option value="all">All Time</option>
        <option value="custom">Custom Dates</option>
      </select>
    </div>
  );
}
