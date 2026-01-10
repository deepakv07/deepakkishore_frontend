import fs from 'fs';
try {
    const content = fs.readFileSync('server/.env', 'utf8');
    let report = 'File length: ' + content.length + '\n';
    const lines = content.split(/\r?\n/);
    lines.forEach(line => {
        if (!line.trim() || line.startsWith('#')) return;
        const parts = line.split('=');
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (key.startsWith('VITE_')) {
            const isPlaceholder = val.includes('your-google-client-id') || val.includes('your-google-client-secret');
            report += `${key}: Len=${val.length}, IsPlaceholder=${isPlaceholder}, Start=${val.substring(0, 5)}...\n`;
        } else {
            report += `Other Key: ${key}\n`;
        }
    });
    fs.writeFileSync('env_report.txt', report);
} catch (e) {
    fs.writeFileSync('env_report.txt', 'Error: ' + e.message);
}
