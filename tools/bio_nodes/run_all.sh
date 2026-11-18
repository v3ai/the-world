#!/bin/sh
# Regenerate the biology content graph, then validate and write the report.
cd "$(dirname "$0")" && python3 finalize.py && python3 validate.py && python3 report.py
