
# 🧰 Apps Reworked — Cybersecurity, OSINT & Network Tools

This repository contains four reworked, browser-based security tools.
Each tool includes a **Python backend** and **HTML/CSS/JS frontend**, designed for OSINT, file forensics, network monitoring, and file exploration.

---

## 📁 Project Overview

```
apps_reworked/
│
├── explorer_rework/
├── forensic_file_analyzer/
├── network_monitor_rework/
└── osint_rework/
```

---

# 🔎 OSINT Rework

**Path:** `apps_reworked/osint_rework/`

A complete OSINT automation platform built with a modular backend and interactive dashboard.

### ✅ Features

* DNS lookup
* WHOIS lookup
* Port scanning
* Subdomain enumeration
* HTTP headers analysis
* Clean JavaScript-driven UI
* Central API (`backend/main.py`)

### 📦 Structure

```
osint_rework/
├── app.py
├── requirements.txt
├── backend/
│   ├── main.py
│   └── providers/
│       ├── dns_tools.py
│       ├── http_headers.py
│       ├── ports.py
│       ├── subdomains.py
│       └── whois_tools.py
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

### ▶️ Run

```bash
cd osint_rework
pip install -r requirements.txt
python app.py
```

---

# 🧪 Forensic File Analyzer

**Path:** `apps_reworked/forensic_file_analyzer/`

A digital forensic tool capable of analyzing PDFs, images, text files, and metadata.

### ✅ Features

* File metadata extraction
* PDF parsing and text extraction
* Image property analysis
* Text content extraction and cleaning
* Modular provider-based backend

### 📦 Structure

```
forensic_file_analyzer/
├── app.py
├── backend/
│   ├── main.py
│   └── providers/
│       ├── extractor.py
│       ├── file_info.py
│       ├── image_tools.py
│       ├── pdf_tools.py
│       └── text_tools.py
└── frontend/
    ├── index.html
    └── style.css
```

### ▶️ Run

```bash
cd forensic_file_analyzer
python app.py
```

---

# 🌐 Network Monitor Rework

**Path:** `apps_reworked/network_monitor_rework/`

A real-time network monitoring dashboard for inspecting live traffic information through a browser interface.

### ✅ Features

* Real-time network statistics
* Connection listing
* Interface monitoring
* Backend API delivering network data
* Lightweight and responsive UI

### 📦 Structure

```
network_monitor_rework/
├── app.py
├── backend/
│   └── main.py
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

### ▶️ Run

```bash
cd network_monitor_rework
python app.py
```

---

# 📁 Explorer Rework

**Path:** `apps_reworked/explorer_rework/`

A web-based file explorer for navigating directories via a simple backend API.

### ✅ Features

* View directories and files
* Clean interface
* Python backend for filesystem operations

### 📦 Structure

```
explorer_rework/
├── app.py
├── backend/
│   └── main.py
└── frontend/
    ├── index.html
    └── style.css
```

### ▶️ Run

```bash
cd explorer_rework
python app.py
```

---

# 🛠️ Technologies Used

### Backend

* Python 3
* Modular provider structure
* Network + file analysis libraries

### Frontend

* HTML5
* CSS3
* JavaScript (Vanilla)
* Responsive and minimalistic layouts

---

# ▶️ How to Run Any Tool

From the project folder of your choice:

```bash
python app.py
```

All applications start a **local web server** and open the UI in your browser.

---

# 📜 License

Free to use for educational and research purposes.

