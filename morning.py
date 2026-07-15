import json
from datetime import datetime


data = {
    "date": str(datetime.now().date()),
    "leave_time": "07:35",
    "message": "通常より10分早め"
}


with open("morning.json", "w", encoding="utf-8") as f:
    json.dump(
        data,
        f,
        ensure_ascii=False,
        indent=2
    )