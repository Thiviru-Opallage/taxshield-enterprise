"""AWS billing CSV parser.

AWS input is a CSV IMPORT, not a live API — Cost Explorer API calls cost
money per call and need a live account, which is wrong for a free demo.
Upload any billing export with columns:
    date, service, usage_type, cost_usd
(Header names are matched case-insensitively; extra columns are ignored.)
A realistic sample lives at data/aws_billing_sample.csv.
"""
import csv
import io
import uuid

RD_SERVICE_HINTS = ("sagemaker", "bedrock", "sageMaker".lower())


class CsvError(Exception):
    pass


def parse_csv(text: str) -> list[dict]:
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise CsvError("empty CSV")
    cols = {name.strip().lower(): name for name in reader.fieldnames}
    for needed in ("date", "service", "cost_usd"):
        if needed not in cols:
            raise CsvError(f"missing required column '{needed}' "
                           f"(found: {', '.join(cols)})")

    events = []
    for i, row in enumerate(reader):
        try:
            cost = float(str(row[cols["cost_usd"]]).replace("$", "").replace(",", ""))
        except (TypeError, ValueError):
            raise CsvError(f"row {i + 2}: cost_usd is not a number: "
                           f"{row.get(cols['cost_usd'])!r}")
        if cost < 0:
            raise CsvError(f"row {i + 2}: negative cost {cost}")
        usage = (row.get(cols.get("usage_type", ""), "") or "").strip()
        service = str(row[cols["service"]]).strip()
        events.append({
            "id": str(uuid.uuid4()),
            "source": "aws",
            "timestamp": str(row[cols["date"]]).strip() + "T00:00:00+00:00",
            "payload": {
                "service": service,
                "cost_usd": round(cost, 2),
                "usage_type": usage or None,
                "date": str(row[cols["date"]]).strip(),
            },
        })
    if not events:
        raise CsvError("CSV contained no data rows")
    return events
