const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const buildDir = path.join(__dirname, '../dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(buildDir)) {
	fs.mkdirSync(buildDir, { recursive: true });
}

// Copy all files from src to dist
exec('cp -r src/* dist/', (error) => {
	if (error) {
		console.error('Error copying files:', error);
		process.exit(1);
	}

	// Compile TypeScript files
	exec('find dist -name "*.ts" -exec tsc {} --allowJs --checkJs false --noEmit false --outDir dist --target ES2020 --module CommonJS --esModuleInterop true \\;',
		(error) => {
			if (error) {
				console.error('Error compiling TypeScript:', error);
				process.exit(1);
			}

			// Remove TypeScript files
			exec('find dist -name "*.ts" -delete');
		}
	);
});