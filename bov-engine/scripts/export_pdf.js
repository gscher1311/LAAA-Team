/**
 * BOV PDF Export — Uses Puppeteer to generate a pixel-perfect PDF from a BOV HTML file.
 *
 * Usage:
 *   node export_pdf.js <input.html> [--output <path.pdf>] [--format letter|A4]
 *
 * Examples:
 *   node scripts/export_pdf.js output/2341-beach-bov.html
 *   node scripts/export_pdf.js output/2341-beach-bov.html --output "2341 Beach BOV.pdf"
 *   node scripts/export_pdf.js output/2341-beach-bov.html --format A4
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function exportPDF(inputPath, outputPath, format = 'letter') {
    const absoluteInput = path.resolve(inputPath);

    if (!fs.existsSync(absoluteInput)) {
        console.error(`ERROR: File not found: ${absoluteInput}`);
        process.exit(1);
    }

    // Default output path
    if (!outputPath) {
        const parsed = path.parse(absoluteInput);
        outputPath = path.join(parsed.dir, `${parsed.name}.pdf`);
    }

    console.log(`Input:  ${absoluteInput}`);
    console.log(`Output: ${path.resolve(outputPath)}`);
    console.log(`Format: ${format}`);
    console.log('');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set viewport to a standard desktop width
        await page.setViewport({ width: 1200, height: 800 });

        // Load the HTML file
        const fileUrl = `file:///${absoluteInput.replace(/\\/g, '/')}`;
        console.log(`Loading: ${fileUrl}`);
        await page.goto(fileUrl, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Wait for maps to render (Leaflet tiles)
        console.log('Waiting for maps to render...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Generate PDF
        console.log('Generating PDF...');
        await page.pdf({
            path: outputPath,
            format: format === 'A4' ? 'A4' : 'Letter',
            printBackground: true,
            margin: {
                top: '0.5in',
                right: '0.5in',
                bottom: '0.5in',
                left: '0.5in'
            },
            preferCSSPageSize: true
        });

        const stats = fs.statSync(outputPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`\nPDF generated successfully!`);
        console.log(`  File: ${path.resolve(outputPath)}`);
        console.log(`  Size: ${sizeMB} MB`);

    } finally {
        await browser.close();
    }
}

// Parse arguments
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: node export_pdf.js <input.html> [--output <path.pdf>] [--format letter|A4]');
    process.exit(1);
}

const inputFile = args[0];
let outputFile = null;
let format = 'letter';

for (let i = 1; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
        outputFile = args[++i];
    } else if (args[i] === '--format' || args[i] === '-f') {
        format = args[++i];
    }
}

exportPDF(inputFile, outputFile, format).catch(err => {
    console.error('Export failed:', err.message);
    process.exit(1);
});
