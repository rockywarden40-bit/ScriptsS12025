#!/usr/bin/env python3
"""
Personal Finance Tracker - single-file Tkinter app
Save as: finance_tracker.py
Run: python finance_tracker.py
"""

import csv
import datetime
import tkinter as tk
from tkinter import ttk, messagebox, filedialog, simpledialog

# ---------- Data model ----------
class Transaction:
    def __init__(self, date: datetime.date, amount: float, category: str, note: str):
        self.date = date
        self.amount = amount  # positive for income, negative for expense
        self.category = category
        self.note = note

    def to_row(self):
        return [self.date.isoformat(), f"{self.amount:.2f}", self.category, self.note]

    @staticmethod
    def from_row(row):
        # row: [date, amount, category, note]
        d = datetime.date.fromisoformat(row[0])
        a = float(row[1])
        return Transaction(d, a, row[2], row[3] if len(row) > 3 else "")


# ---------- Utility functions ----------
def parse_date(text: str):
    # Accepts yyyy-mm-dd or dd/mm/yyyy formats
    text = text.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.datetime.strptime(text, fmt).date()
        except Exception:
            pass
    raise ValueError("Date must be in YYYY-MM-DD or DD/MM/YYYY format")


# ---------- GUI App ----------
class FinanceTrackerApp:
    def __init__(self, root):
        self.root = root
        root.title("Personal Finance Tracker")
        root.geometry("900x600")

        # In-memory transactions
        self.transactions = []

        # Top frame: form to add transaction
        form = ttk.Frame(root, padding=8)
        form.pack(fill=tk.X)

        ttk.Label(form, text="Date (YYYY-MM-DD):").grid(row=0, column=0, sticky=tk.W)
        self.date_var = tk.StringVar(value=datetime.date.today().isoformat())
        ttk.Entry(form, textvariable=self.date_var, width=15).grid(row=0, column=1, padx=4)

        ttk.Label(form, text="Amount (use - for expense):").grid(row=0, column=2, sticky=tk.W)
        self.amount_var = tk.StringVar()
        ttk.Entry(form, textvariable=self.amount_var, width=12).grid(row=0, column=3, padx=4)

        ttk.Label(form, text="Category:").grid(row=0, column=4, sticky=tk.W)
        self.category_var = tk.StringVar(value="General")
        ttk.Entry(form, textvariable=self.category_var, width=16).grid(row=0, column=5, padx=4)

        ttk.Label(form, text="Note:").grid(row=0, column=6, sticky=tk.W)
        self.note_var = tk.StringVar()
        ttk.Entry(form, textvariable=self.note_var, width=20).grid(row=0, column=7, padx=4)

        ttk.Button(form, text="Add Transaction", command=self.add_transaction).grid(row=0, column=8, padx=6)

        # Middle frame: controls and summary
        mid = ttk.Frame(root, padding=6)
        mid.pack(fill=tk.X)

        ttk.Button(mid, text="Load CSV", command=self.load_csv).pack(side=tk.LEFT, padx=4)
        ttk.Button(mid, text="Save CSV", command=self.save_csv).pack(side=tk.LEFT, padx=4)
        ttk.Button(mid, text="Export View", command=self.export_view).pack(side=tk.LEFT, padx=4)
        ttk.Button(mid, text="Delete Selected", command=self.delete_selected).pack(side=tk.LEFT, padx=4)
        ttk.Button(mid, text="Clear All", command=self.clear_all).pack(side=tk.LEFT, padx=4)

        ttk.Label(mid, text="Search / Filter:").pack(side=tk.LEFT, padx=(20,4))
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *_: self.refresh_table())
        ttk.Entry(mid, textvariable=self.search_var, width=20).pack(side=tk.LEFT)

        ttk.Label(mid, text="Category Filter:").pack(side=tk.LEFT, padx=(12,4))
        self.cat_filter_var = tk.StringVar()
        self.cat_filter_var.trace_add("write", lambda *_: self.refresh_table())
        ttk.Entry(mid, textvariable=self.cat_filter_var, width=12).pack(side=tk.LEFT)

        ttk.Button(mid, text="Monthly Summary", command=self.show_monthly_summary).pack(side=tk.RIGHT, padx=4)

        # Bottom: table and summary labels
        bottom = ttk.Frame(root, padding=6)
        bottom.pack(fill=tk.BOTH, expand=True)

        cols = ("date", "amount", "category", "note", "balance")
        self.tree = ttk.Treeview(bottom, columns=cols, show="headings", selectmode="extended")
        self.tree.heading("date", text="Date", command=lambda: self.sort_by_col("date"))
        self.tree.heading("amount", text="Amount", command=lambda: self.sort_by_col("amount"))
        self.tree.heading("category", text="Category")
        self.tree.heading("note", text="Note")
        self.tree.heading("balance", text="Running Balance")

        self.tree.column("date", width=100, anchor=tk.CENTER)
        self.tree.column("amount", width=100, anchor=tk.E)
        self.tree.column("category", width=120)
        self.tree.column("note", width=300)
        self.tree.column("balance", width=120, anchor=tk.E)

        vsb = ttk.Scrollbar(bottom, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        vsb.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree.pack(fill=tk.BOTH, expand=True)

        # Summary footer
        footer = ttk.Frame(root, padding=6)
        footer.pack(fill=tk.X)
        self.total_income_var = tk.StringVar(value="0.00")
        self.total_expense_var = tk.StringVar(value="0.00")
        self.net_var = tk.StringVar(value="0.00")
        ttk.Label(footer, text="Total Income:").pack(side=tk.LEFT, padx=(0,4))
        ttk.Label(footer, textvariable=self.total_income_var).pack(side=tk.LEFT, padx=(0,12))
        ttk.Label(footer, text="Total Expense:").pack(side=tk.LEFT, padx=(0,4))
        ttk.Label(footer, textvariable=self.total_expense_var).pack(side=tk.LEFT, padx=(0,12))
        ttk.Label(footer, text="Net:").pack(side=tk.LEFT, padx=(0,4))
        ttk.Label(footer, textvariable=self.net_var).pack(side=tk.LEFT)

        # Load sample data for first-run demo
        self._sort_key = None
        self.load_sample_if_empty()

    # ---------- App behavior ----------
    def load_sample_if_empty(self):
        if not self.transactions:
            today = datetime.date.today()
            demo = [
                Transaction(today - datetime.timedelta(days=10), 2000.0, "Salary", "October salary"),
                Transaction(today - datetime.timedelta(days=9), -150.0, "Groceries", "Weekly shopping"),
                Transaction(today - datetime.timedelta(days=3), -50.0, "Transport", "Fuel"),
                Transaction(today, -300.0, "Bills", "Electricity"),
            ]
            self.transactions.extend(demo)
            self.refresh_table()

    def add_transaction(self):
        try:
            d = parse_date(self.date_var.get())
            a = float(self.amount_var.get())
            c = self.category_var.get().strip() or "General"
            n = self.note_var.get().strip()
        except Exception as e:
            messagebox.showerror("Invalid input", f"Error: {e}")
            return

        tx = Transaction(d, a, c, n)
        self.transactions.append(tx)
        self.clear_form()
        self.refresh_table()

    def clear_form(self):
        self.amount_var.set("")
        self.note_var.set("")
        # keep date and category for convenience

    def refresh_table(self):
        # Clear
        for item in self.tree.get_children():
            self.tree.delete(item)

        # Apply search/filter
        q = self.search_var.get().lower().strip()
        cat_f = self.cat_filter_var.get().lower().strip()
        filtered = []
        for t in self.transactions:
            text = f"{t.date.isoformat()} {t.amount} {t.category} {t.note}".lower()
            if q and q not in text:
                continue
            if cat_f and cat_f not in t.category.lower():
                continue
            filtered.append(t)

        # Optionally sort
        if self._sort_key:
            reverse = False
            key = self._sort_key
            if key == "date":
                filtered.sort(key=lambda x: x.date)
            elif key == "amount":
                filtered.sort(key=lambda x: x.amount, reverse=True)

        # Calculate running balance and insert
        balance = 0.0
        # Ensure chronological order for running balance
        filtered_sorted_by_date = sorted(filtered, key=lambda x: x.date)
        for t in filtered_sorted_by_date:
            balance += t.amount
            self.tree.insert("", tk.END, values=(t.date.isoformat(), f"{t.amount:.2f}", t.category, t.note, f"{balance:.2f}"))

        # Update totals (based on filtered view)
        income = sum(t.amount for t in filtered if t.amount > 0)
        expense = -sum(t.amount for t in filtered if t.amount < 0)
        net = income - expense
        self.total_income_var.set(f"{income:.2f}")
        self.total_expense_var.set(f"{expense:.2f}")
        self.net_var.set(f"{net:.2f}")

    def sort_by_col(self, col):
        self._sort_key = col
        self.refresh_table()

    def load_csv(self):
        path = filedialog.askopenfilename(title="Load transactions CSV", filetypes=[("CSV files", "*.csv"), ("All files", "*.*")])
        if not path:
            return
        try:
            with open(path, newline="", encoding="utf-8") as f:
                reader = csv.reader(f)
                loaded = []
                for row in reader:
                    if not row:
                        continue
                    try:
                        t = Transaction.from_row(row)
                        loaded.append(t)
                    except Exception:
                        # skip malformed lines
                        continue
            self.transactions = loaded
            self.refresh_table()
            messagebox.showinfo("Loaded", f"Loaded {len(loaded)} transactions from {path}")
        except Exception as e:
            messagebox.showerror("Error loading file", str(e))

    def save_csv(self):
        path = filedialog.asksaveasfilename(title="Save transactions CSV", defaultextension=".csv", filetypes=[("CSV files", "*.csv")])
        if not path:
            return
        try:
            with open(path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                for t in self.transactions:
                    writer.writerow(t.to_row())
            messagebox.showinfo("Saved", f"Saved {len(self.transactions)} transactions to {path}")
        except Exception as e:
            messagebox.showerror("Error saving file", str(e))

    def export_view(self):
        # Export currently visible transactions in the tree
        path = filedialog.asksaveasfilename(title="Export view to CSV", defaultextension=".csv", filetypes=[("CSV files", "*.csv")])
        if not path:
            return
        rows = []
        for iid in self.tree.get_children():
            vals = self.tree.item(iid)["values"]
            # date, amount, category, note, balance
            rows.append([vals[0], vals[1], vals[2], vals[3], vals[4]])
        try:
            with open(path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["date", "amount", "category", "note", "running_balance"])
                writer.writerows(rows)
            messagebox.showinfo("Exported", f"Exported {len(rows)} rows to {path}")
        except Exception as e:
            messagebox.showerror("Error exporting", str(e))

    def delete_selected(self):
        sel = self.tree.selection()
        if not sel:
            return
        # Get date+amount+category+note from selected items and remove first matching transaction(s)
        removed_count = 0
        for iid in sel:
            vals = self.tree.item(iid)["values"]
            if not vals: 
                continue
            d_s, a_s, cat, note = vals[0], vals[1], vals[2], vals[3]
            # find a matching transaction (first occurrence)
            for i, t in enumerate(self.transactions):
                if t.date.isoformat() == d_s and f"{t.amount:.2f}" == a_s and t.category == cat and t.note == note:
                    del self.transactions[i]
                    removed_count += 1
                    break
        if removed_count:
            messagebox.showinfo("Deleted", f"Deleted {removed_count} transactions")
            self.refresh_table()
        else:
            messagebox.showwarning("Not found", "Could not match selected rows to transactions")

    def clear_all(self):
        if messagebox.askyesno("Confirm", "Clear all transactions? This cannot be undone."):
            self.transactions.clear()
            self.refresh_table()

    def show_monthly_summary(self):
        # Ask month/year from user
        year = simpledialog.askinteger("Year", "Enter year (e.g. 2025):", parent=self.root, initialvalue=datetime.date.today().year)
        if year is None:
            return
        month = simpledialog.askinteger("Month", "Enter month (1-12):", parent=self.root, initialvalue=datetime.date.today().month, minvalue=1, maxvalue=12)
        if month is None:
            return
        # compute totals for that month
        income = 0.0
        expense = 0.0
        for t in self.transactions:
            if t.date.year == year and t.date.month == month:
                if t.amount >= 0:
                    income += t.amount
                else:
                    expense += -t.amount
        net = income - expense
        messagebox.showinfo("Monthly Summary", f"{datetime.date(year, month, 1).strftime('%B %Y')}\n\nIncome: ₹{income:.2f}\nExpenses: ₹{expense:.2f}\nNet: ₹{net:.2f}")

# ---------- Run ----------
def main():
    root = tk.Tk()
    app = FinanceTrackerApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
