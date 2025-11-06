# 📋 Task Management

<div align="center">

**A TypeScript console application for tracking time worked on specific tasks during a set time period.**

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-22+-green?logo=node.js)
![Biome](https://img.shields.io/badge/Biome-2.3.4-FF6B9D?logo=biome)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

</div>

## Table of Contents

- [Features](#features)
- [Usage](#usage)
  - [Quick Start](#-quick-start)
  - [Adding a Task](#-adding-a-task)
  - [Viewing Tasks](#-viewing-tasks)
  - [Generating Invoices](#-generating-invoices)
  - [Configuration](#-configuration)
- [Development](#development)
  - [Setup](#-setup)
  - [Building & Testing](#-building--testing)
  - [Linting & Formatting](#-linting--formatting)
  - [Project Structure](#-project-structure)
  - [Contributing](#-contributing)

## Features

<div align="center">

| Feature | Description |
|---------|-------------|
| 🎯 **Interactive CLI** | Arrow key navigation with emoji indicators |
| 🎨 **Colorized Output** | Color-coded displays with status indicators |
| 📅 **Auto Date/Time** | Automatic timestamp recording |
| ⚙️ **Configurable** | Customizable client rates and hour limits via JSON |
| 📊 **Billing Periods** | Automatic grouping by configurable invoice dates |
| 🚨 **Hour Limits** | Color-coded warnings when approaching limits |
| 💰 **Invoice Generation** | Automatic task merging and due date calculation |
| 💾 **JSON Storage** | Simple, portable data storage |

</div>

## Usage

### ⚡ Quick Start

```bash
pnpm dev
```

Or build first, then run:

```bash
pnpm build && pnpm start
```

### ➕ Adding a Task

1. **Select Activity Type** - Choose from configured types or enter custom
2. **Enter Ticket Number** (optional) - Press Enter to skip
3. **Enter Hours Worked** - Decimal values supported (e.g., 2.5)
4. **Select Client** - Choose from configured clients or enter custom

The application automatically adds today's date/time, calculates the rate based on your client configuration, and saves the entry.

### 📊 Viewing Tasks

1. Select a client (or "All Clients")
2. Select a billing period (if multiple exist)

**Billing Periods:** Tasks are automatically grouped into billing periods based on your configured invoice dates. Each period includes tasks from the previous invoice date (or start of month) up to the day before the current invoice date. Tasks on or after the last invoice date are billed on the first invoice date of the next month.

**Example with default settings** (`invoiceDates: [1, 15]`):
- Days 1-14 → Billed on 15th of same month
- Days 15-31 → Billed on 1st of next month

**Hour Limit Indicators** (if configured):
- 🟢 **Green** - Well below limit (>4 hours remaining)
- 🟡 **Yellow** - Getting close (2-4 hours remaining)
- 🔴 **Red** - Critical (≤2 hours remaining or limit exceeded)

### 💰 Generating Invoices

1. Select a client
2. Select a billing period

Invoices include client name, invoice date, due date (calculated from payment terms), billing period description, and line items. Tasks with the same activity type and ticket number are automatically merged into a single line item.

**Due Date Calculation:** Due dates are calculated as invoice date + payment terms (e.g., Net 15 = invoice date + 15 days).

### ⚙️ Configuration

Create a `config.json` file before first use:

```bash
cp config.example.json config.json
```

| Section | Description |
|---------|-------------|
| **clients** | Array of client objects with `client` (name), `rate` (hourly rate), and optional `hourLimit` (per billing period) |
| **activityTypes** | Array of activity type strings shown as options (custom types still allowed) |
| **defaultRate** | Hourly rate for clients not in your list |
| **invoiceDates** | Array of days when invoices are generated (e.g., `[1, 15]` for twice monthly, `[1]` for monthly) |
| **paymentTerms** | Number of days after invoice date when payment is due (e.g., `15` for Net 15, `30` for Net 30) |

> 🔒 **Privacy:** `config.json` is git-ignored.  
> 🤖 **Auto-creation:** If missing, the app creates one from the example template.

## Development

### 📦 Setup

```bash
pnpm install
```

### 🔨 Building & Testing

| Command | Description |
|--------|-------------|
| `pnpm build` | Build the project |
| `pnpm dev` | Build and run in one command |
| `pnpm start` | Run the built application |
| `pnpm watch` | Watch for changes and rebuild automatically |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |

The test suite focuses on calculation functions and config-dependent behavior, including billing period calculations with different invoice date configurations and payment terms.

### 🔍 Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for fast linting and formatting.

| Command | Description |
|--------|-------------|
| `pnpm lint` | Check for linting issues |
| `pnpm lint:fix` | Auto-fix linting issues |
| `pnpm format` | Format code |
| `pnpm format:check` | Check formatting without fixing |
| `pnpm check` | Run both lint and format check |
| `pnpm check:fix` | Auto-fix both lint and format issues |

**Pre-commit hooks:** Linting runs automatically before commits via [Husky](https://typicode.github.io/husky/). Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) format.

**CI/CD:** GitHub Actions validates PR titles, builds, lints, tests, and generates coverage reports. All checks must pass before merging.

### 📁 Project Structure

```
src/
├── index.ts              # Main entry point
├── billing/              # Billing period calculations
├── config/               # Configuration management
├── invoice/              # Invoice generation
├── prompts/              # CLI prompt functions
├── rates/                # Client rate utilities
├── storage/              # Data persistence (JSON)
├── types/                # TypeScript type definitions
└── view/                 # Task viewing and display

dist/                     # Compiled output (generated)
data/                     # Task data storage (git-ignored)
```

Tasks are stored in `data/tasks.json` as JSON arrays. Each task entry includes: `id`, `date`, `time`, `activityType`, `ticketNumber` (optional), `hoursWorked`, `client`, and `rate`.

### 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository and create a feature branch
2. Run `pnpm check` before committing
3. Write tests for new functionality
4. Update documentation as needed
5. Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `style:` for formatting changes
   - `refactor:` for code refactoring
   - `test:` for test changes
   - `chore:` for maintenance tasks
6. Submit a Pull Request - all CI checks must pass

**Pre-commit checks:** TypeScript compilation, linting and formatting (Biome)  
**CI checks:** PR title validation, build verification, linting, test suite execution, coverage reports
