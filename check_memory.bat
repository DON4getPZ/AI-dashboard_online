@echo off
chcp 65001 >nul
echo ================================================================================
echo System Memory Check
echo ================================================================================
echo.

echo [1] Python Version and Architecture
python --version
python -c "import struct; print('Architecture: ' + str(struct.calcsize('P') * 8) + '-bit')"
echo.

echo [2] Available System Memory
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /format:list
echo.

echo [3] Python Memory Limit Check
python -c "import sys; print('Max size:', sys.maxsize); print('64-bit Python:', sys.maxsize > 2**32)"
echo.

echo [4] Installed Libraries Check
echo Checking critical libraries...
python -c "import pandas; print('pandas:', pandas.__version__)" 2>nul || echo pandas: NOT INSTALLED
python -c "import numpy; print('numpy:', numpy.__version__)" 2>nul || echo numpy: NOT INSTALLED
python -c "from prophet import Prophet; print('prophet: installed')" 2>nul || echo prophet: NOT INSTALLED
python -c "import cmdstanpy; print('cmdstanpy:', cmdstanpy.__version__)" 2>nul || echo cmdstanpy: NOT INSTALLED
echo.

echo [5] Recommendations
echo.
echo If you see "32-bit Python":
echo    - 32-bit Python has ~2GB memory limit
echo    - Consider installing 64-bit Python from https://www.python.org/
echo.
echo If memory is limited (less than 4GB):
echo    - Use process_lite.bat instead of full processing
echo    - Close other applications before running
echo.
echo If Prophet/cmdstanpy not installed:
echo    - Processing will use simple forecasting
echo    - Install with: pip install prophet cmdstanpy
echo.
pause
