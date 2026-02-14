const fs = require('fs');
try {
    const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
    let version = null;

    // Try lockfile v2/v3 format
    if (lock.packages && lock.packages['node_modules/@angular/core']) {
        version = lock.packages['node_modules/@angular/core'].version;
    }
    // Try lockfile v1 format
    else if (lock.dependencies && lock.dependencies['@angular/core']) {
        version = lock.dependencies['@angular/core'].version;
    }

    console.log('INSTALLED_ANGULAR_VERSION=' + (version || 'NOT_FOUND'));
} catch (e) {
    console.error('Error reading package-lock.json:', e.message);
}
