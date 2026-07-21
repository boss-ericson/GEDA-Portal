import React, { useState, useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

function App() {
  const [date, setDate] = useState('2026-07-20');
  const fetchAttendance = async () => {
    console.log("fetchAttendance date is:", date);
  };
  useEffect(() => {
    fetchAttendance();
  }, [date]);
  return <div onClick={() => setDate('2026-07-21')}>Test</div>;
}
console.log(renderToStaticMarkup(<App />));
