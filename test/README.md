Run `python3 -m pip install openpyxl==3.1.5` in a Python virtual environment,
then `npm test`. Set `PYTHON=/path/to/python` to use that environment.
Tests require Node.js 18 or later and npm registry access (or a populated cache).
`npm test` packs the library, installs the tarball in a fresh temporary directory,
runs the round-trip test, and extracts and runs every README JavaScript block.
Generated workbooks and scripts stay in the printed temporary directories.

`fixtures/styled-template.xlsx` is generated independently with openpyxl by
`workbook.py generate test/fixtures/styled-template.xlsx`. All values and metadata
are synthetic. Python inspection uses openpyxl, never the library under test.
The test checks exact round-trip results, including the documented theme-zero
fill loss and the conversion of indexed border colour to RGB. RGB comparisons
ignore the alpha prefix because the writer normalizes six digit RGB to ARGB.
No visual Excel rendering or custom theme palette preservation is asserted.
