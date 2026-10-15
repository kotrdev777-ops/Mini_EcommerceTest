'use client';

import { useState } from 'react';

export type SalesPeriod = 'today' | 'week' | 'month' | 'day';

export function SalesFilter({ period, date }: { period: SalesPeriod; date: string }) {
  const [selected, setSelected] = useState(period);
  return <form className="sales-filter" action="/admin" method="get">
    <label htmlFor="sales-period">ช่วงเวลา</label>
    <select id="sales-period" name="period" value={selected} onChange={(event) => {
      setSelected(event.target.value as SalesPeriod);
      event.currentTarget.form?.requestSubmit();
    }}>
      <option value="today">วันนี้</option>
      <option value="week">1 สัปดาห์</option>
      <option value="month">1 เดือน</option>
      <option value="day">กำหนดวัน</option>
    </select>
    <label className={selected === 'day' ? 'sales-date' : 'sales-date is-hidden'} htmlFor="sales-date">วันที่</label>
    <input className={selected === 'day' ? 'sales-date' : 'sales-date is-hidden'} id="sales-date" name="date" type="date" defaultValue={date} onChange={(event) => event.currentTarget.form?.requestSubmit()}/>
  </form>;
}
