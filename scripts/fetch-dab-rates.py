#!/usr/bin/env python3
"""Fetch the official Da Afghanistan Bank exchange-rate table for the static app."""
from datetime import datetime, timezone
from html.parser import HTMLParser
from html import unescape
from pathlib import Path
from urllib.request import Request, urlopen
import json
import re

SOURCE_URL = "https://dab.gov.af/exchange-rates"
OUTPUT = Path("public/rates/dab-latest.json")

CURRENCY_MAP = (
    ("USD", "دالر امریکایی", "USD"),
    ("EURO", "یورو", "EUR"),
    ("POUND", "پوند بریتانیا", "GBP"),
    ("SWISS", "فرانک سوئیس", "CHF"),
    ("INDIAN", "روپیه هند", "INR"),
    ("PAKISTAN", "روپیه پاکستان", "PKR"),
    ("IRAN", "تومان ایران", "IRT"),
    ("CNY", "یوان چین", "CNY"),
    ("UAE", "درهم امارات", "AED"),
    ("SAUDI", "ریال سعودی", "SAR"),
)

class TableParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.tables = []
        self.table = None
        self.row = None
        self.cell = None

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag == "table":
            if self.depth == 0:
                self.table = []
            self.depth += 1
        elif self.depth and tag == "tr":
            self.row = []
        elif self.depth and tag in ("td", "th"):
            self.cell = []

    def handle_data(self, data):
        if self.depth and self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if self.depth and tag in ("td", "th") and self.cell is not None:
            self.row.append(" ".join(" ".join(self.cell).split()))
            self.cell = None
        elif self.depth and tag == "tr" and self.row is not None:
            if self.row:
                self.table.append(self.row)
            self.row = None
        elif tag == "table" and self.depth:
            self.depth -= 1
            if self.depth == 0 and self.table is not None:
                self.tables.append(self.table)
                self.table = None

def parse_rates(html):
    parser = TableParser()
    parser.feed(html)
    current = None
    for table in parser.tables:
        if table and table[0]:
            header = unescape(table[0][0]).replace("\ufeff", "").strip().lower()
            if header == "currency":
                current = table
                break
    if not current:
        raise ValueError("Official rate table not found")

    rates = []
    for row in current[1:]:
        if len(row) < 5:
            continue
        label = unescape(row[0]).replace("\ufeff", "").strip().upper()
        match = next((item for item in CURRENCY_MAP if label.startswith(item[0])), None)
        if not match:
            continue
        try:
            values = [float(value.replace(",", "").strip()) for value in row[1:5]]
        except (TypeError, ValueError):
            continue
        rates.append({
            "code": match[2],
            "name": match[1],
            "cashSell": values[0],
            "cashBuy": values[1],
            "transferSell": values[2],
            "transferBuy": values[3],
        })
    if len(rates) < 8:
        raise ValueError("Official rate table is incomplete")

    date_match = re.search(r"Last updated\s*:\s*([^<\r\n]+)", html, re.IGNORECASE)
    return {
        "status": "ok",
        "sourceName": "Da Afghanistan Bank",
        "sourceUrl": SOURCE_URL,
        "baseCurrency": "AFN",
        "lastUpdated": unescape(date_match.group(1)).strip() if date_match else None,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "rates": rates,
        "message": "",
    }

def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    try:
        request = Request(SOURCE_URL, headers={"User-Agent": "HisabSarrafOfficialRates/1.0"})
        with urlopen(request, timeout=25) as response:
            html = response.read().decode("utf-8", "replace")
        payload = parse_rates(html)
        print("Official DAB rates parsed:", len(payload["rates"]), "currencies; date:", payload["lastUpdated"])
    except Exception as error:
        payload = {
            "status": "unavailable",
            "sourceName": "Da Afghanistan Bank",
            "sourceUrl": SOURCE_URL,
            "baseCurrency": "AFN",
            "lastUpdated": None,
            "fetchedAt": datetime.now(timezone.utc).isoformat(),
            "rates": [],
            "message": "دریافت یا خواندن جدول رسمی بانک مرکزی افغانستان ناموفق بود.",
        }
        print("Official DAB rates unavailable:", type(error).__name__, str(error))
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
