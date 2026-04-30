import React, { useEffect, useRef } from 'react';

/**
 * Simple Line Chart Component using Canvas API
 * Professional, clean, no external dependencies
 */
const LineChart = ({ data, color, label, height = 250 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data || data.length === 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const chartHeight = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, chartHeight);

        // Find min and max values
        const values = data.map(d => d.value);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values, 0);
        const range = maxValue - minValue || 1;

        // Calculate points
        const padding = 40;
        const chartWidth = width - padding * 2;
        const innerHeight = chartHeight - padding * 2;
        const stepX = chartWidth / (data.length - 1 || 1);

        const points = data.map((d, i) => ({
            x: padding + i * stepX,
            y: padding + innerHeight - ((d.value - minValue) / range) * innerHeight
        }));

        // Draw grid lines
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (innerHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, padding, 0, chartHeight - padding);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, chartHeight - padding);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, chartHeight - padding);
        ctx.closePath();
        ctx.fill();

        // Draw line
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // Draw points
        points.forEach((p, i) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';

        // X-axis labels
        data.forEach((d, i) => {
            if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
                ctx.fillText(d.label, points[i].x, chartHeight - 10);
            }
        });
// Y-axis labels
ctx.textAlign = 'right';
for (let i = 0; i <= 4; i++) {
    const value = minValue + (range / 4) * (4 - i);
    const y = padding + (innerHeight / 4) * i;

    const displayValue = range <= 5
        ? value.toFixed(1)
        : Math.round(value);

    ctx.fillText(displayValue, padding - 10, y + 4);
}
    }, [data, color]);

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={height}
            style={{ width: '100%', height: `${height}px` }}
        />
    );
};

export default LineChart;
