import sys, io, json, traceback

def _no_input(*args, **kwargs):
    raise RuntimeError("input() is disabled in the sandbox terminal")

def run_user(code):
    """Run player code with real Python. Returns a JSON string: {ok, out, err}."""
    buf = io.StringIO()
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout = buf
    sys.stderr = buf
    ok, err = True, ""
    try:
        scope = {"__name__": "__main__", "input": _no_input}
        exec(compile(code, "main.py", "exec"), scope)
    except BaseException as e:
        ok = False
        tb = e.__traceback__.tb_next if e.__traceback__ else None
        err = "".join(traceback.format_exception(type(e), e, tb)).rstrip()
    finally:
        sys.stdout, sys.stderr = old_out, old_err
    return json.dumps({"ok": ok, "out": buf.getvalue(), "err": err})
