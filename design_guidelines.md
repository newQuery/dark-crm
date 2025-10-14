{
  "project_name": "nQCrm",
  "brand_attributes": ["sleek", "futuristic", "professional", "high-contrast", "confident"],
  "branding_assets": {
    "logo_horizontal": "https://customer-assets.emergentagent.com/job_nextcrm-hub/artifacts/0kh97peq_1.png",
    "logo_icon": "https://customer-assets.emergentagent.com/job_nextcrm-hub/artifacts/fk0c1ji5_5.png"
  },
  "color_system": {
    "primary": "#00C676",
    "primary_accent": "#39FF8E",
    "bg": {
      "base": "#0B0F10",
      "elevated": "#0E1417",
      "muted": "#0A0F12"
    },
    "fg": {
      "primary": "#E8F2EC",
      "secondary": "#B8C4BE",
      "tertiary": "#8FA19A"
    },
    "borders": {
      "default": "#152125",
      "muted": "#0F1B1E",
      "glow": "#0EE78A"
    },
    "state": {
      "success": "#39FF8E",
      "warning": "#FFC861",
      "error": "#FF5C5C",
      "info": "#47C7FF"
    },
    "charts": {
      "revenue_bar": "#00C676",
      "revenue_bar_alt": "#1DE19A",
      "payments_line": "#39FF8E",
      "axis": "#94A3A8",
      "grid": "#1A262A",
      "tooltip_bg": "#0E1417",
      "tooltip_fg": "#E8F2EC"
    }
  },
  "gradients": {
    "rules": {
      "max_viewport_coverage": "20%",
      "no_dark_saturated_pairs": true,
      "no_gradients_on_text_blocks": true,
      "no_gradients_on_small_ui": true
    },
    "usage": [
      "hero/login screen backdrop",
      "section separators",
      "decorative overlays only (not content cards)"
    ],
    "tokens": {
      "accent_radial_soft": "radial-gradient(60% 60% at 80% 20%, rgba(0,198,118,0.18) 0%, rgba(12,17,20,0) 60%)",
      "accent_diagonal": "linear-gradient(135deg, rgba(0,198,118,0.14) 0%, rgba(57,255,142,0.10) 45%, rgba(12,17,20,0) 100%)"
    }
  },
  "typography": {
    "fonts": {
      "heading": "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      "body": "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      "code": "Roboto Mono, ui-monospace, SFMono-Regular, Menlo"
    },
    "scales": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl",
      "h2": "text-base md:text-lg",
      "body": "text-sm md:text-base",
      "small": "text-xs"
    },
    "weights": {"regular": 400, "medium": 500, "semibold": 600, "bold": 700},
    "tracking": {"tight": "tracking-tight", "wide": "tracking-wide"},
    "usage": [
      "Use Space Grotesk for page titles and metric numerals",
      "Use Inter for body, tables, forms"
    ]
  },
  "css_tokens": {
    "root": ":root {\n  --bg-base: #0B0F10;\n  --bg-elevated: #0E1417;\n  --bg-muted: #0A0F12;\n  --fg-primary: #E8F2EC;\n  --fg-secondary: #B8C4BE;\n  --fg-tertiary: #8FA19A;\n  --border-default: #152125;\n  --border-muted: #0F1B1E;\n  --primary: #00C676;\n  --primary-accent: #39FF8E;\n  --ring: #0EE78A;\n  --success: #39FF8E;\n  --warning: #FFC861;\n  --error: #FF5C5C;\n  --info: #47C7FF;\n  --chart-revenue: #00C676;\n  --chart-revenue-alt: #1DE19A;\n  --chart-payments: #39FF8E;\n  --chart-axis: #94A3A8;\n  --chart-grid: #1A262A;\n  --tooltip-bg: #0E1417;\n  --tooltip-fg: #E8F2EC;\n  --radius-sm: 6px;\n  --radius-md: 10px;\n  --radius-lg: 14px;\n  --shadow-soft: 0 4px 20px rgba(0,0,0,0.35);\n  --shadow-glow: 0 0 0 1px rgba(14, 231, 138, 0.2), 0 8px 30px rgba(14, 231, 138, 0.08);\n  --focus-ring: 0 0 0 3px rgba(14,231,138,0.35);\n}",
    "dark": ".dark {\n  /* same as :root for dark-first project; tokens allow future light mode */\n}"
  },
  "layout": {
    "grid": {
      "container": "max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8",
      "cols_desktop": 12,
      "cols_tablet": 8,
      "cols_mobile": 4,
      "gap": "gap-4 md:gap-6"
    },
    "sidebar": {
      "width": 280,
      "width_collapsed": 76,
      "behavior": [
        "Desktop: fixed left, scroll with page",
        "Tablet: collapsible to icon-only",
        "Mobile: hidden behind sheet/drawer"
      ]
    },
    "cards": {
      "class": "bg-[color:var(--bg-elevated)] border border-[color:var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] transition-shadow duration-200"
    }
  },
  "visual_personality": {
    "style_mix": [
      "Swiss grid discipline",
      "Futuristic neon accents",
      "Subtle glassmorphism on elevated surfaces"
    ],
    "do_nots": [
      "No purple/pink gradients",
      "Do not exceed 20% viewport gradient coverage",
      "Avoid center-aligning long-form content"
    ]
  },
  "components": {
    "use_shadcn": true,
    "list": [
      {
        "name": "SidebarNav",
        "path": "./components/ui/navigation-menu.js",
        "alt_impl": "./components/layout/Sidebar.js",
        "behavior": "Collapsible. Active item gets left border in --primary; on hover: background tone up. data-testid on toggles and nav-links.",
        "classes": "h-full bg-[color:var(--bg-muted)] border-r border-[color:var(--border-default)]"
      },
      {
        "name": "Topbar",
        "path": "./components/layout/Topbar.js",
        "behavior": "Contains global search (Command dialog), quick add (Dialog), user menu (DropdownMenu)",
        "classes": "sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/30 border-b border-[color:var(--border-default)]"
      },
      {
        "name": "StatCard",
        "path": "./components/ui/card.js",
        "behavior": "Shows KPI with icon chip. On hover: translate-y-[1px], subtle glow. data-testid on value and delta.",
        "classes": "p-4 md:p-6 grid gap-2"
      },
      {
        "name": "ChartCard",
        "path": "./components/ui/card.js",
        "behavior": "Wraps Recharts with dark theme axes, custom tooltip.",
        "classes": "p-4 md:p-6"
      },
      {
        "name": "DataTable",
        "path": "./components/ui/table.js",
        "behavior": "Sortable headers, sticky top, zebra rows via even:bg-white/0 odd:bg-white/[0.01]",
        "classes": "text-sm"
      },
      {
        "name": "FormDialog",
        "path": "./components/ui/dialog.js",
        "behavior": "Create/Edit for Projects, Clients, Invoices. data-testid on submit/cancel.",
        "classes": "sm:max-w-lg"
      },
      {
        "name": "DatePicker",
        "path": "./components/ui/calendar.js",
        "behavior": "Shadcn Calendar for invoice due dates and payments filters.",
        "classes": ""
      },
      {
        "name": "Toast",
        "path": "./components/ui/sonner.js",
        "behavior": "Success/error toasts for CRUD operations.",
        "classes": ""
      }
    ]
  },
  "pages": {
    "dashboard": {
      "layout": [
        "Top row: 4 StatCards (Revenue, Active Projects, Clients, MRR)",
        "Middle: 2-column grid -> Revenue BarChart, Payments LineChart",
        "Bottom: Recent Activity (Timeline list)"
      ],
      "data_testids": [
        "revenue-bar-chart",
        "payments-line-chart",
        "recent-activity-list"
      ]
    },
    "projects": {
      "layout": [
        "Header with Create Project button (Dialog)",
        "Filters: status, client, date",
        "Table of projects with status badges"
      ],
      "data_testids": ["create-project-button", "projects-table"]
    },
    "clients": {
      "layout": [
        "Header with Add Client (Sheet)",
        "Search input + filters",
        "Client list table"
      ],
      "data_testids": ["add-client-button", "clients-search-input", "clients-table"]
    },
    "invoices": {
      "layout": [
        "Header with New Invoice (Dialog)",
        "Tabs: All, Paid, Pending, Overdue",
        "Table with status badge and due date"
      ],
      "data_testids": ["new-invoice-button", "invoices-table"]
    },
    "payments": {
      "layout": [
        "Stripe transactions list with date range filter",
        "Payout summary cards"
      ],
      "data_testids": ["payments-date-range", "payments-table"]
    }
  },
  "buttons": {
    "style": "professional_corporate",
    "tokens": {
      "--btn-radius": "10px",
      "--btn-shadow": "var(--shadow-soft)",
      "--btn-motion": "transition-colors duration-200"
    },
    "variants": {
      "primary": "bg-[color:var(--primary)] text-black hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]",
      "secondary": "bg-[color:var(--bg-elevated)] text-[color:var(--fg-primary)] border border-[color:var(--border-default)] hover:border-[color:var(--primary)]",
      "ghost": "bg-transparent text-[color:var(--fg-secondary)] hover:text-[color:var(--fg-primary)] hover:bg-white/5"
    },
    "sizes": {
      "sm": "px-3 py-1.5 text-sm",
      "md": "px-4 py-2 text-sm",
      "lg": "px-5 py-2.5 text-base"
    }
  },
  "micro_interactions": {
    "rules": [
      "No universal transition-all. Use specific transitions on color/opacity/box-shadow",
      "Hover: elevate cards with shadow-glow and subtle y-translate",
      "Active: scale 0.98 for press on buttons",
      "Charts: fade-in + slight y-rise on mount (Framer Motion)"
    ],
    "examples": {
      "card": "transition-shadow duration-200 will-change:box-shadow",
      "nav_item": "relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-7 before:w-[3px] before:rounded-full before:bg-transparent aria-[current=true]:before:bg-[color:var(--primary)]"
    }
  },
  "data_viz": {
    "library": "recharts",
    "patterns": [
      "BarChart for monthly revenue with rounded bars and 8px radius",
      "LineChart for payments with monotone curve and gradient stroke"
    ],
    "js_examples": {
      "RevenueBarChart.js": "import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';\nexport const RevenueBarChart = ({ data = [] }) => {\n  return (\n    <div className=\"h-64 w-full\" data-testid=\"revenue-bar-chart\">\n      <ResponsiveContainer width=\"100%\" height=\"100%\">\n        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>\n          <CartesianGrid stroke=\"var(--chart-grid)\" strokeDasharray=\"3 3\" />\n          <XAxis dataKey=\"month\" stroke=\"var(--chart-axis)\" tickLine={false} axisLine={false} />\n          <YAxis stroke=\"var(--chart-axis)\" tickLine={false} axisLine={false} />\n          <Tooltip contentStyle={{ background: 'var(--tooltip-bg)', color: 'var(--tooltip-fg)', border: '1px solid var(--border-default)' }} />\n          <Bar dataKey=\"revenue\" fill=\"var(--chart-revenue)\" radius={[8,8,0,0]} />\n        </BarChart>\n      </ResponsiveContainer>\n    </div>\n  );\n};",
      "PaymentsLineChart.js": "import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';\nexport const PaymentsLineChart = ({ data = [] }) => {\n  return (\n    <div className=\"h-64 w-full\" data-testid=\"payments-line-chart\">\n      <ResponsiveContainer width=\"100%\" height=\"100%\">\n        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>\n          <defs>\n            <linearGradient id=\"paymentStroke\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">\n              <stop offset=\"0%\" stopColor=\"var(--chart-payments)\" stopOpacity=\"1\" />\n              <stop offset=\"100%\" stopColor=\"var(--chart-payments)\" stopOpacity=\"0.2\" />\n            </linearGradient>\n          </defs>\n          <CartesianGrid stroke=\"var(--chart-grid)\" strokeDasharray=\"3 3\" />\n          <XAxis dataKey=\"month\" stroke=\"var(--chart-axis)\" tickLine={false} axisLine={false} />\n          <YAxis stroke=\"var(--chart-axis)\" tickLine={false} axisLine={false} />\n          <Tooltip contentStyle={{ background: 'var(--tooltip-bg)', color: 'var(--tooltip-fg)', border: '1px solid var(--border-default)' }} />\n          <Line type=\"monotone\" dataKey=\"amount\" stroke=\"url(#paymentStroke)\" strokeWidth={2.4} dot={false} activeDot={{ r: 4, fill: 'var(--chart-payments)' }} />\n        </LineChart>\n      </ResponsiveContainer>\n    </div>\n  );\n};"
    }
  },
  "icons": {
    "library": "lucide-react",
    "examples": {
      "imports": "import { LayoutDashboard, FolderKanban, Users2, FileText, CreditCard, Settings } from 'lucide-react';"
    }
  },
  "accessibility": {
    "contrast": "All text meets WCAG AA (contrast on dark bg >= 4.5:1)",
    "focus": "Use outline-none focus-visible:ring-2 ring-[color:var(--ring)]",
    "keyboard": "All menus, dialogs, and forms operable via keyboard",
    "reduced_motion": "Respect prefers-reduced-motion: reduce animation durations and disable non-essential transitions",
    "aria": "Provide aria-labels for icons and data-testid attributes for test stability"
  },
  "testing_attributes": {
    "rule": "Every interactive or critical info element must include a stable data-testid attribute (kebab-case)",
    "examples": [
      "sidebar-toggle-button",
      "global-search-input",
      "create-project-submit-button",
      "clients-search-input",
      "invoice-status-badge-paid",
      "stripe-transaction-row-<id>"
    ]
  },
  "libraries": {
    "install": [
      "npm i recharts framer-motion lucide-react sonner",
      "npm i -D @fontsource/space-grotesk @fontsource/inter"
    ],
    "usage_notes": [
      "Recharts has no built-in dark theme; pass CSS variable colors",
      "Use framer-motion for page/card/tooltip entrance animations",
      "Use sonner Toaster for success/error confirmations"
    ]
  },
  "component_path": {
    "button": "./components/ui/button.js",
    "input": "./components/ui/input.js",
    "select": "./components/ui/select.js",
    "dialog": "./components/ui/dialog.js",
    "dropdown_menu": "./components/ui/dropdown-menu.js",
    "calendar": "./components/ui/calendar.js",
    "table": "./components/ui/table.js",
    "badge": "./components/ui/badge.js",
    "separator": "./components/ui/separator.js",
    "skeleton": "./components/ui/skeleton.js",
    "toast": "./components/ui/sonner.js"
  },
  "js_scaffolds": {
    "AppShell.js": "import { useState } from 'react';\nimport { LayoutDashboard, FolderKanban, Users2, FileText, CreditCard, Settings } from 'lucide-react';\nimport { Toaster } from './components/ui/sonner.js';\n\nexport default function AppShell({ children }) {\n  const [collapsed, setCollapsed] = useState(false);\n  return (\n    <div className=\"min-h-screen bg-[color:var(--bg-base)] text-[color:var(--fg-primary)]\">\n      <aside className=\"fixed left-0 top-0 h-full border-r border-[color:var(--border-default)] bg-[color:var(--bg-muted)] transition-[width] duration-200\" style={{ width: collapsed ? 76 : 280 }} aria-label=\"Sidebar\">\n        <button className=\"m-3 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10\" data-testid=\"sidebar-toggle-button\" onClick={() => setCollapsed(v => !v)}>Toggle</button>\n        <nav className=\"mt-4 space-y-1\">\n          {[[LayoutDashboard,'Dashboard'],[FolderKanban,'Projects'],[Users2,'Clients'],[FileText,'Invoices'],[CreditCard,'Payments'],[Settings,'Settings']].map(([Icon,label]) => (\n            <a key={label} href=\"#\" className=\"group flex items-center gap-3 px-3 py-2 text-[color:var(--fg-secondary)] hover:text-[color:var(--fg-primary)] hover:bg-white/5 rounded-md\" data-testid={`nav-${label.toLowerCase()}-link`}>\n              <Icon size={18} className=\"text-[color:var(--fg-tertiary)] group-hover:text-[color:var(--primary)]\" />\n              {!collapsed && <span className=\"text-sm\">{label}</span>}\n            </a>\n          ))}\n        </nav>\n      </aside>\n      <main className=\"pl-[76px] md:pl-[280px]\">\n        {children}\n      </main>\n      <Toaster position=\"top-right\" richColors />\n    </div>\n  );\n}",
    "sonner.js": "export { Toaster, toast } from 'sonner';"
  },
  "motion": {
    "library": "framer-motion",
    "variants": {
      "card_enter": "{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.24 } } }",
      "stagger_container": "{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }"
    }
  },
  "forms": {
    "patterns": [
      "Label above inputs, 8px gap",
      "Use Select, Dialog, Calendar from shadcn/ui only",
      "Show inline validation errors with aria-live=polite and data-testid='form-error-<field>'"
    ]
  },
  "tables": {
    "row_height": 56,
    "zebra": true,
    "hover": "hover:bg-white/5",
    "selected_state": "aria-selected:bg-[color:var(--primary)]/10"
  },
  "empty_states": {
    "style": "subtle",
    "message_class": "text-[color:var(--fg-secondary)]",
    "icon_tone": "text-[color:var(--fg-tertiary)]"
  },
  "image_urls": [
    {
      "url": "https://images.unsplash.com/photo-1649300610544-9a9a1c315d0e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGRhcmslMjBncmVlbiUyMGZ1dHVyaXN0aWMlMjBncmFkaWVudCUyMHRleHR1cmV8ZW58MHx8fHwxNzYwNDY3MTI1fDA&ixlib=rb-4.1.0&q=85",
      "category": "decorative-overlay",
      "where": "login/hero background overlay (opacity 0.15)",
      "description": "Black and green wavy lines for subtle neon energy"
    },
    {
      "url": "https://images.unsplash.com/photo-1636011497948-13d7aaa84f31?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMGRhcmslMjBncmVlbiUyMGZ1dHVyaXN0aWMlMjBncmFkaWVudCUyMHRleHR1cmV8ZW58MHx8fHwxNzYwNDY3MTI1fDA&ixlib=rb-4.1.0&q=85",
      "category": "section-separator",
      "where": "dashboard top banner strip (mask-image: linear-gradient)",
      "description": "Close-up green/black texture for depth"
    },
    {
      "url": "https://images.pexels.com/photos/10461971/pexels-photo-10461971.jpeg",
      "category": "empty-state",
      "where": "empty states illustration background (contain, 12% opacity)",
      "description": "Abstract green futuristic gradient"
    }
  ],
  "instructions_to_main_agent": [
    "Create tokens in index.css using css_tokens.root. Ensure the app root has class 'dark' (dark-first)",
    "Install libraries per 'libraries.install'",
    "Place logos in top-left of sidebar (icon for collapsed)",
    "Implement pages per 'pages' with data-testid attributes on all interactive elements",
    "Use shadcn/ui components from component_path and avoid raw HTML widgets for dropdowns, calendars, toasts",
    "Style charts using CSS variables from color_system.charts",
    "Respect gradient rules; use accent_radial_soft overlay sections only",
    "Ensure responsiveness: sidebar collapses at <= 1024px; use Drawer/Sheet on mobile",
    "Run accessibility checks for focus states and keyboard navigation"
  ]
}


<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
