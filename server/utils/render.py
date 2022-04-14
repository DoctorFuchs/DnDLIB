HEAD = [
    "name",
    "full_name"
]

INFORMATION_TAGS =  [
    "weight",
    "cost",
    "quantity",
    "abbreviation",
    "material",
    "range",
    "components",
    "duration",
    "concentration",
    "level",
    "casting_time",
    "ritual",
    "school",
    "subclass_flavor"
]

DESCRIPTIONS = [
    "desc",
    "higher_level"
]

BOTTOM = [
    "class",
    "subclasses",
    "race"
]

TAGS = [
    "equipment_category",
    "gear_category"
]

_BLOCKED = [
    "index",
    "url",
    "_id"
]

BLOCKED = HEAD + INFORMATION_TAGS + DESCRIPTIONS + BOTTOM + TAGS + _BLOCKED
