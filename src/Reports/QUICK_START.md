# 🚀 Quick Start Guide

Get started with Oxivo Management System in 5 minutes.

---

## ⚡ Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

---

## 📥 Installation

### Option 1: Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Option 2: Network Access (Other Devices)

```bash
# Start with network access
npm run dev -- --host
```

Access from any device on your network: `http://[YOUR-IP]:5173`

---

## 🎯 First Steps

### 1. Dashboard Overview
- Navigate to **Dashboard** (home icon)
- Explore 13 customizable widgets
- **Pin** your favorite widgets
- **Drag & drop** to reorder

### 2. Add Your First Customer
1. Click **Müşteri Yönetimi** (Customers)
2. Click **+ Yeni Müşteri** (New Customer)
3. Fill in basic info:
   - **Cari Adı** (Customer Name)
   - **Cari Hesap Kodu** (Account Code)
   - **Sektör** (Sector)
4. Click **Kaydet** (Save)

### 3. Import Existing Data
1. Go to any module (Customers, Bank/PF, etc.)
2. Click **Excel İçe Aktar** (Import Excel)
3. Select your `.xlsx` file
4. Review and confirm import

### 4. Explore Modules

| Module | Purpose |
|--------|---------|
| **🏠 Dashboard** | Analytics & widgets |
| **👥 Müşteri Yönetimi** | Customer CRM |
| **🏦 Banka/PF** | Bank & partner management |
| **📊 Raporlar** | Reports & analytics |
| **⚙️ Tanımlar** | Definitions & settings |
| **💰 Gelir** | Revenue management |

---

## 💾 Data Persistence

All data is stored in **localStorage**:
- ✅ Automatic saving (1.5s debounce)
- ✅ Version control & migration
- ✅ Offline-first approach
- ⚠️ Clear browser data = lose all data

**Backup Strategy:**
- Export to Excel regularly
- Use **Excel Dışa Aktar** in each module

---

## 🔥 Hot Tips

### Keyboard Shortcuts
- **Ctrl + S** - Save current form (if in edit mode)
- **ESC** - Close modal/dialog
- **Tab** - Navigate between fields

### Performance
- Dashboard widgets are **lazy-loaded**
- Use **pagination** for large datasets
- **Search** is debounced (300ms)

### Best Practices
1. **Regular Exports**: Export to Excel weekly
2. **Data Validation**: Use built-in validators
3. **Batch Operations**: Select multiple rows for bulk actions
4. **Activity Log**: Check activity log for audit trail

---

## 🐛 Troubleshooting

### App Not Loading?
1. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear browser cache
3. Check console for errors (F12)

### Data Not Saving?
1. Check auto-save indicator (top-right)
2. Verify localStorage is not full
3. Try manual save (Ctrl + S)

### Performance Issues?
1. Clear old data: Go to **Settings → Clear Cache**
2. Reduce visible widgets on dashboard
3. Use filters to limit displayed data

---

## 📚 Learn More

- **Full Documentation**: See [README.md](./README.md)
- **System Audit**: See [COMPREHENSIVE_SYSTEM_AUDIT_REPORT.md](./COMPREHENSIVE_SYSTEM_AUDIT_REPORT.md)
- **Recent Fixes**: See [SYSTEM_AUDIT_FIXES_APPLIED.md](./SYSTEM_AUDIT_FIXES_APPLIED.md)

---

## 🆘 Need Help?

**Common Questions:**

**Q: Where is my data stored?**  
A: All data is in browser localStorage (no server).

**Q: Can I use this offline?**  
A: Yes! It's a PWA-style app.

**Q: How do I backup my data?**  
A: Export to Excel from each module.

**Q: Can multiple users access this?**  
A: Currently single-user (per browser).

---

**🎉 You're ready to go! Start by exploring the Dashboard.**

**Version:** 3.0  
**Last Updated:** November 13, 2025
