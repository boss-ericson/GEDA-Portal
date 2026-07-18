import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { School, Student, AcademicRecord } from '../types';

export default function AnalyticsCenter({ school, students, isOffline }: { school: School, students: Student[], isOffline: boolean }) {
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchAllRecords = async () => {
      if (isOffline) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/academic-records?schoolId=${school.id}`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllRecords();
  }, [school.id, isOffline]);

  return (
    <div className="p-4 md:p-6 space-y-6" ref={containerRef}>
      <header className="mb-6">
        <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">School Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Overview of academic performance and enrollment trends</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-pulse text-slate-400">Loading analytics data...</div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnrollmentGrowthChart students={students} />
          <PerformanceTrendsChart records={records} />
          <div className="lg:col-span-2">
            <SubjectScoreDistributionChart records={records} />
          </div>
        </div>
      )}
    </div>
  );
}

function EnrollmentGrowthChart({ students }: { students: Student[] }) {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chartRef.current || students.length === 0) return;

    // Process data: count students by admission year
    // Assuming createdAt contains the year, or we can use admissionNo
    const dataByYear = d3.rollups(
      students,
      v => v.length,
      d => new Date(d.createdAt).getFullYear().toString()
    ).map(([year, count]) => ({ year, count })).sort((a, b) => a.year.localeCompare(b.year));

    if (dataByYear.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(dataByYear.map(d => d.year))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(dataByYear, d => d.count) || 10])
      .nice()
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("class", "text-xs font-mono text-slate-500 dark:text-slate-400");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("class", "text-xs font-mono text-slate-500 dark:text-slate-400");

    g.selectAll(".bar")
      .data(dataByYear)
      .enter().append("rect")
      .attr("class", "fill-amber-500")
      .attr("x", d => x(d.year)!)
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.count))
      .attr("rx", 4);
      
  }, [students]);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4">Enrollment Growth</h3>
      <div className="w-full overflow-hidden">
        <svg ref={chartRef} className="w-full h-auto"></svg>
      </div>
    </div>
  );
}

function PerformanceTrendsChart({ records }: { records: AcademicRecord[] }) {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chartRef.current || records.length === 0) return;

    // Process data: average score by term
    const getTermKey = (r: AcademicRecord) => `${r.academicYear} ${r.academicTerm}`;
    
    const termData = d3.rollups(
      records,
      v => {
        let totalScore = 0;
        let count = 0;
        v.forEach(r => {
          r.scores.forEach(s => {
            const cat1 = s.cat1 || 0;
            const cat2 = s.cat2 || 0;
            const gw = s.groupWork || 0;
            const pw = s.projectWork || 0;
            const ex = s.exam || 0;
            totalScore += (cat1 + cat2 + gw + pw + ex);
            count++;
          });
        });
        return count > 0 ? totalScore / count : 0;
      },
      d => getTermKey(d)
    ).map(([term, avgScore]) => ({ term, avgScore })).sort((a, b) => a.term.localeCompare(b.term));

    if (termData.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint()
      .domain(termData.map(d => d.term))
      .range([0, width])
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("class", "text-[10px] font-mono text-slate-500 dark:text-slate-400")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("class", "text-xs font-mono text-slate-500 dark:text-slate-400");

    const line = d3.line<any>()
      .x(d => x(d.term)!)
      .y(d => y(d.avgScore))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(termData)
      .attr("fill", "none")
      .attr("stroke", "#d97706") // brand-green-600 logic
      .attr("stroke-width", 3)
      .attr("d", line);

    g.selectAll(".dot")
      .data(termData)
      .enter().append("circle")
      .attr("class", "fill-amber-500")
      .attr("cx", d => x(d.term)!)
      .attr("cy", d => y(d.avgScore))
      .attr("r", 5)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
      
  }, [records]);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4">Performance Trends over Terms</h3>
      <div className="w-full overflow-hidden">
        <svg ref={chartRef} className="w-full h-auto"></svg>
      </div>
    </div>
  );
}

function SubjectScoreDistributionChart({ records }: { records: AcademicRecord[] }) {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chartRef.current || records.length === 0) return;

    // Process data: average score by subject
    const subjectScores: Record<string, { total: number, count: number }> = {};
    
    records.forEach(r => {
      r.scores.forEach(s => {
        const total = (s.cat1 || 0) + (s.cat2 || 0) + (s.groupWork || 0) + (s.projectWork || 0) + (s.exam || 0);
        if (!subjectScores[s.subject]) {
          subjectScores[s.subject] = { total: 0, count: 0 };
        }
        subjectScores[s.subject].total += total;
        subjectScores[s.subject].count++;
      });
    });

    const data = Object.entries(subjectScores)
      .map(([subject, { total, count }]) => ({ subject, avgScore: total / count }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10); // top 10 subjects

    if (data.length === 0) return;

    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.subject))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("class", "text-[10px] font-mono text-slate-500 dark:text-slate-400")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-25)");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("class", "text-xs font-mono text-slate-500 dark:text-slate-400");

    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "fill-amber-400 hover:fill-amber-500 transition-colors cursor-pointer")
      .attr("x", d => x(d.subject)!)
      .attr("y", d => y(d.avgScore))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.avgScore))
      .attr("rx", 4);
      
    // Add text labels
    g.selectAll(".label")
      .data(data)
      .enter().append("text")
      .attr("class", "text-[10px] font-bold text-slate-600 dark:text-slate-400")
      .attr("x", d => x(d.subject)! + x.bandwidth() / 2)
      .attr("y", d => y(d.avgScore) - 5)
      .attr("text-anchor", "middle")
      .text(d => d.avgScore.toFixed(1));

  }, [records]);

  return (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4">Subject-wise Aggregate Score Distributions</h3>
      <div className="w-full overflow-hidden">
        <svg ref={chartRef} className="w-full h-auto"></svg>
      </div>
    </div>
  );
}
