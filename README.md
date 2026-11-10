# Money Tracker 💸

A lightweight, clean, and responsive personal money tracker built using vanilla **HTML5**, **CSS3**, and **JavaScript**.

No backend, no server, and no database setup required. All data is automatically saved in your browser using `localStorage`, keeping your expenses persistent across refreshes.

---

## ✨ Features

- **Summary Dashboard**: View total number of expenses and total money spent at a glance.
- **Add Expense**: Record what you spent on, the amount, and the date (defaults to today).
- **Edit Expenses**: Update existing expense details with a dedicated editing state.
- **Delete with Confirmation**: Safeguard against accidental deletions with a confirmation prompt.
- **Instant Search**: Filter expenses in real-time by description, amount, or date.
- **Empty State**: Friendly welcoming message when the tracker is empty, plus 1-click sample data loading.
- **Export to CSV**: Easily download all your expenses to a `.csv` file.
- **Mobile-First Responsive Design**: Works seamlessly on mobile phones, tablets, and desktops.
- **100% Offline & Private**: Zero external dependencies, fonts, or CDNs. Your data stays entirely in your browser.

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser:

```bash
# On Windows PowerShell
Start-Process index.html

# On macOS
open index.html

# On Linux
xdg-open index.html
```

---

## 📁 File Structure

```text
├── index.html       # App markup & structure
├── style.css        # Clean responsive styles & variables
├── script.js        # State, CRUD operations, & localStorage logic
└── README.md        # Documentation
```

---

## 🛠️ Built With

- **HTML5**
- **CSS3** (CSS Variables, Flexbox, CSS Grid)
- **Vanilla JavaScript** (ES6+, LocalStorage API)

---

## 📄 License

MIT License. Free to use and modify!
