#!/usr/bin/env node

import { runAllTests } from './test-runner.js';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

// Load Angular projects from angular.json
const angularJsonPath = path.resolve(process.cwd(), 'angular.json');
if (!fs.existsSync(angularJsonPath)) {
    console.error('angular.json not found in the current directory.');
    process.exit(1);
}

const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
const allProjects = Object.keys(angularJson.projects);

// Get number of CPU cores
const numCPUs = os.cpus().length;
const defaultConcurrency = Math.max(1, Math.floor(numCPUs / 2));

// Parse CLI arguments using yargs
const argv = yargs(hideBin(process.argv))
    .option('concurrency', {
        alias: 'c',
        type: 'number',
        description: 'Number of concurrent test runners',
        default: defaultConcurrency,
    })
    .option('continueOnFailure', {
        alias: 'f',
        type: 'boolean',
        description: 'Continue running tests even if one fails',
        default: true,
    })
    .option('onlyProjects', {
        alias: 'o',
        type: 'string',
        description: 'Comma-separated list of projects to test',
    })
    .option('skipProjects', {
        alias: 's',
        type: 'string',
        description: 'Comma-separated list of projects to skip',
    })
    .help()
    .argv;

// Determine projects to test
let projects = allProjects;

if (argv.onlyProjects) {
    const onlyList = argv.onlyProjects.split(',').map(p => p.trim());
    if (onlyList.length === 1 && onlyList[0] === '') {
        projects = [];
    } else {
        projects = allProjects.filter(p => onlyList.includes(p));
    }
} else if (argv.skipProjects) {
    const skipList = argv.skipProjects.split(',').map(p => p.trim());
    projects = allProjects.filter(p => !skipList.includes(p));
}

// Check if concurrently is installed
try {
    execSync('npx concurrently -v');
} catch (e) {
    console.error('Error: concurrently is not installed. Run "npm install concurrently" to install it.');
    process.exit(1);
}

// Run tests
runAllTests(argv.concurrency, argv.continueOnFailure, projects);
