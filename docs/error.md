================================================================================
Running SEGMENT ANALYSIS
================================================================================

This may use 2-4 GB of memory. Continue? (Y/N): y

[1/10] Processing main data...
14:14:00 - cmdstanpy - INFO - Chain [1] start processing
14:14:00 - cmdstanpy - INFO - Chain [1] done processing
14:14:00 - cmdstanpy - INFO - Chain [1] start processing
14:14:00 - cmdstanpy - INFO - Chain [1] done processing
14:14:02 - cmdstanpy - INFO - Chain [1] start processing
14:14:02 - cmdstanpy - INFO - Chain [1] done processing
14:14:02 - cmdstanpy - INFO - Chain [1] start processing
14:14:02 - cmdstanpy - INFO - Chain [1] done processing
14:14:02 - cmdstanpy - INFO - Chain [1] start processing
14:14:02 - cmdstanpy - INFO - Chain [1] done processing
Traceback (most recent call last):
  File "C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\scripts\process_marketing_data.py", line 1357, in main
    visualize_analysis(df, forecast_data)
    ~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\Desktop\marketing-dashboard_new - 복사본\scripts\process_marketing_data.py", line 719, in visualize_analysis
    plt.savefig(timeseries_file, dpi=300, bbox_inches='tight')
    ~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\matplotlib\pyplot.py", line 1250, in savefig
    res = fig.savefig(*args, **kwargs)  # type: ignore[func-returns-value]
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\matplotlib\figure.py", line 3490, in savefig
    self.canvas.print_figure(fname, **kwargs)
    ~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\matplotlib\backend_bases.py", line 2149, in print_figure
    renderer = _get_renderer(
        self.figure,
        functools.partial(
            print_method, orientation=orientation)
    )
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\matplotlib\backend_bases.py", line 1574, in _get_renderer
    print_method(io.BytesIO())
    ~~~~~~~~~~~~^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\matplotlib\backend_bases.py", line 2042, in <lambda>
    print_method = functools.wraps(meth)(lambda *args, **kwargs: meth(
                                                                 ~~~~^
        *args, **{k: v for k, v in kwargs.items() if k not in skip}))
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\matplotlib\backends\backend_agg.py", line 481, in print_png
    self._print_pil(filename_or_obj, "png", pil_kwargs, metadata)
    ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\matplotlib\backends\backend_agg.py", line 429, in _print_pil
    FigureCanvasAgg.draw(self)
    ~~~~~~~~~~~~~~~~~~~~^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\matplotlib\backends\backend_agg.py", line 377, in draw
    self.renderer = self.get_renderer()
                    ~~~~~~~~~~~~~~~~~^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\matplotlib\backends\backend_agg.py", line 392, in get_renderer
    self.renderer = RendererAgg(w, h, self.figure.dpi)
                    ~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\matplotlib\backends\backend_agg.py", line 69, in __init__
    self._renderer = _RendererAgg(int(width), int(height), dpi)
                     ~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
MemoryError: bad allocation