# 📋 Task Management

<div align="center">

**A TypeScript console application for tracking time worked on specific tasks during a set time period.**

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-22+-green?logo=node.js)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

</div>

## Table of Contents

- [Features](#features)
- [Usage](#usage)
  - [Quick Start](#-quick-start)
  - [Using the Application](#-using-the-application)
  - [Adding a Task](#-adding-a-task)
  - [Viewing Tasks](#-viewing-tasks)
  - [Generating Invoices](#-generating-invoices)
  - [Configuration](#-configuration)
- [Development](#development)
  - [Setup](#-setup)
  - [Building the Project](#-building-the-project)
  - [Project Structure](#-project-structure)
  - [Data Format](#-data-format)
  - [Contributing](#-contributing)

## Features

<div align="center">

| Feature | Description |
|---------|-------------|
| 🎯 **Interactive CLI** | Arrow key navigation with emoji indicators for intuitive selection |
| 🎨 **Colorized Output** | Beautiful color-coded displays for better readability and status indicators |
| 📅 **Auto Date/Time** | Automatic timestamp recording for each task entry |
| ⚙️ **Configurable** | Fully customizable client rates and hour limits via JSON config |
| 📊 **Billing Windows** | 15-day rolling billing periods with automatic grouping |
| 🚨 **Hour Limits** | Color-coded warnings when approaching or exceeding limits |
| 💰 **Invoice Generation** | Automatic task merging and due date calculation |
| 💾 **JSON Storage** | Simple, portable data storage in JSON format |

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

### 📱 Using the Application

When you run the application, you'll see a main menu:

| Menu Option | Description |
|-------------|-------------|
| ➕ Add New Task | Log a new work session |
| 📊 View Tasks by Client | View all tasks organized by client and billing period |
| 💰 Generate Invoice | Generate an invoice for a specific client and billing period |
| 👋 Exit | Close the application |

Navigate with arrow keys ↑↓ and press Enter to select.

### ➕ Adding a Task

**Step-by-step process:**

1. **Select Activity Type** 📝
   - Choose from your configured activity types
   - Or enter a custom value

2. **Enter Ticket Number** 🎫 *(Optional)*
   - Press Enter to skip if not applicable

3. **Enter Hours Worked** ⏱️
   - Decimal values supported (e.g., 2.5, 0.75)

4. **Select Client** 👤
   - Choose from your configured clients
   - Or enter a custom client name

> 💡 **Automatic features:** The application automatically adds today's date and time, calculates the rate based on your client configuration, and saves the entry.

### 📊 Viewing Tasks

1. Select a client (or view all clients)
2. Select a billing period (if multiple exist)

**📅 Billing Periods:**

The application uses configurable billing windows based on your invoice dates. Tasks are automatically grouped into billing periods based on when they occur in the month.

**How it works:**
- Tasks are grouped by the invoice date they fall into
- Each invoice date creates a billing period that includes all tasks from the previous invoice date (or start of month) up to the day before the current invoice date
- Tasks on or after the last invoice date of the month are billed on the first invoice date of the next month

**Example with default settings** (invoice dates: [1, 15]):

| Period | Billing Date |
|--------|--------------|
| Days 1-14 | Billed on 15th of same month |
| Days 15-31 | Billed on 1st of next month |

**Custom invoice dates:**
You can configure any invoice dates in your `config.json`. For example:
- `[1, 15]` - Twice monthly (1st and 15th)
- `[1]` - Monthly (1st of each month)
- `[1, 10, 20]` - Three times per month

Each table shows date, time, activity type, ticket number, hours worked, rate, and total amount. Summary totals are displayed for each billing period and client.

**🚨 Hour Limit Indicators:**

If you've configured hour limits, you'll see color-coded warnings:

| Status | Color | Meaning |
|--------|-------|---------|
| 🟢 | **Green** | Well below limit |
| 🟠 | **Orange/Yellow** | Getting close to limit |
| 🔴 | **Red** | Critical - near or over limit |

### 💰 Generating Invoices

1. Select a client
2. Select a billing period

**📄 Invoice Contents:**

| Field | Description |
|-------|-------------|
| Client | Client name |
| Invoice Date | Billing date for the selected period |
| Due Date | Automatically calculated based on invoice date |
| Billing Period | Period description |
| Service | Activity type |
| Description | Ticket number (if provided) |
| Rate | Hourly rate |
| Hours | Hours worked (merged entries by activity) |
| Amount | Rate × Hours |
| Total Hours | Sum of all hours |
| Total Amount | Sum of all amounts |

**📅 Due Date Calculation:**

Due dates are automatically calculated based on your configured payment terms. The payment terms specify how many days after the invoice date payment is due.

**Payment Terms Explained:**
- **Net 15**: Payment due 15 days after invoice date
- **Net 30**: Payment due 30 days after invoice date
- **Net 90**: Payment due 90 days after invoice date

**Example with default settings** (payment terms: 15 days / Net 15):

| Invoice Date | Due Date | Calculation |
|--------------|----------|-------------|
| January 1st | January 16th | Invoice date + 15 days |
| January 15th | January 30th | Invoice date + 15 days |
| February 1st | February 16th | Invoice date + 15 days |

**Custom payment terms:**
You can set any payment terms in your `config.json`:
- `15` for Net 15 (15 days to pay)
- `30` for Net 30 (30 days to pay)
- `90` for Net 90 (90 days to pay)
- Any other number for custom terms

> 💡 **Auto-merging:** Tasks with the same activity type and ticket ID are automatically combined into a single line item.

### ⚙️ Configuration

Before first use, create a `config.json` file:

```bash
cp config.example.json config.json
```

| Section | Purpose |
|---------|---------|
| **👥 Clients** | Define clients with hourly rates and optional hour limits per billing period |
| **📋 Activity Types** | Configure activity types that appear as options (custom types still allowed) |
| **💵 Default Rate** | Set hourly rate for clients not in your list |
| **📅 Invoice Dates** | Array of days when invoices are generated each month. Tasks are grouped into billing periods based on these dates. Examples: `[1, 15]` for twice monthly, `[1]` for monthly, `[1, 10, 20]` for three times per month |
| **📄 Payment Terms** | Number of days after invoice date when payment is due. Common values: `15` (Net 15), `30` (Net 30), `90` (Net 90). The due date is calculated as invoice date + payment terms |

> 🔒 **Privacy:** The `config.json` file is git-ignored to keep your personal configuration private.  
> 🤖 **Auto-creation:** If you run the app without a config file, it will automatically create one from the example template.

## Development

### 📦 Setup

```bash
pnpm install
```

### 🔨 Building the Project

| Command | Description |
|--------|-------------|
| `pnpm build` | Build the project |
| `pnpm watch` | Watch for changes and rebuild automatically |
| `pnpm clean` | Clean build artifacts |
| `pnpm dev` | Build and run in one command |

### 🧪 Testing

| Command | Description |
|--------|-------------|
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:ui` | Run tests with UI |
| `pnpm test:coverage` | Run tests with coverage report |

The test suite focuses on calculation functions and config-dependent behavior, including billing period calculations with different invoice date configurations and payment terms (Net 15, Net 30, Net 90).

### 📁 Project Structure

```
task-management/
├── 📂 src/
│   ├── index.ts          # Main entry point
│   ├── config.ts         # Configuration loader
│   ├── storage.ts        # Data persistence
│   ├── rates.ts          # Client rate utilities
│   ├── view.ts           # Task viewing functions
│   ├── invoice.ts        # Invoice generation
│   ├── 📂 types/         # Type definitions
│   └── 📂 prompts/       # CLI prompt functions
│       ├── index.ts
│       ├── utils.ts
│       ├── task.ts
│       └── menu.ts
│
├── 📂 dist/              # Compiled output
├── 📂 data/              # Task data storage
│   └── tasks.json
│
├── config.json           # Your config (git-ignored)
├── config.example.json   # Example template
└── package.json
```

### 💾 Data Format

Tasks are stored in `data/tasks.json` as JSON arrays. Each task entry includes:

- **id** - Unique identifier
- **date** - Task date (YYYY-MM-DD)
- **time** - Task time (HH:MM:SS)
- **activityType** - Type of work performed
- **ticketNumber** - Optional ticket/issue ID
- **hoursWorked** - Hours worked (decimal)
- **client** - Client name
- **rate** - Hourly rate

### 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
