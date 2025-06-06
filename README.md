# OrgMapper

**OrgMapper** is a Next.js app for visualizing your organization's structure from a CSV file, with interactive treemaps, advanced filtering, and export options.

---

## Features

- **CSV Upload & Mapping:** Upload a CSV and map columns for Username, Manager, Location, Level, Employee Type, and (optionally) Team/Project.
- **Required/Optional Mapping:** All fields except Team/Project are required for mapping.
- **Interactive Treemap:** Visualizes employees per location under each manager, with color-coded sections and manager/location labels.
- **Multi-Select Filters:** Filter by Level, Employee Type, Team/Project (if mapped), and more.
- **Special Filters:**
  - Employees campus ≠ Manager campus (toggle)
  - Show employee count in location boxes (toggle)
- **Export Options:** Download the current chart as PNG or as a standalone HTML file (with interactive tooltips).
- **Responsive UI:** Modern, user-friendly interface with clear required/optional indicators.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the app

```bash
npm run dev
```

The app will be available at [http://localhost:9002](http://localhost:9002).

---

## Usage

1. **Upload a CSV file** with your organization's data.
2. **Map the columns** to the required fields (Username, Manager, Location, Level, Employee Type). Team/Project is optional.
3. **Apply Mappings** to process the data.
4. **Explore the treemap:**
   - Click on managers or locations to filter.
   - Use the left panel to filter by Level, Employee Type, Team/Project, or use the special toggles.
   - Collapse the left panel for a full-width view.
5. **Export** the current view as PNG or HTML.

---

## CSV Format

Your CSV should have columns for at least:
- Username (the unique identifier for each employee)
- Manager (the username of the manager)
- Location
- Level
- Employee Type

Optionally:
- Team/Project

You will map these columns after uploading.

---

## Environment Variables

If you use Genkit/Google AI features, set the following in your environment:

```
GEMINI_API_KEY=your_key_here
# or
GOOGLE_API_KEY=your_key_here
```

---

## Development

- Built with Next.js, React, ECharts, and Tailwind CSS.
- All mapping and filtering logic is robust to missing/optional fields.
- The codebase is modular and easy to extend.

---

## License

MIT
