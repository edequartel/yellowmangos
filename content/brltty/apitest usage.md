# 🧩 Using `apitest.exe` with BRLTTY (Windows)

`apitest.exe` is a developer test tool included with **BRLTTY**.  
It connects to the BRLTTY service and lets you send and receive Braille commands manually.

---

## ⚙️ Requirements
- BRLTTY installed and working  
  *(e.g. `C:\Program Files\BRLTTY\bin\brltty.exe`)*
- Your Braille display connected and recognized by BRLTTY  
- `apitest.exe` located in the same folder as BRLTTY

---

## 🧠 1. Start BRLTTY

Open **Command Prompt** as Administrator and run:
```cmd
cd "C:\Program Files\BRLTTY\bin"
brltty.exe -b auto -d auto -t auto
```

Leave this window open — it runs the BRLTTY daemon.

---

## 🧩 2. Open another Command Prompt and start `apitest.exe`

```cmd
cd "C:\Program Files\BRLTTY\bin"
apitest.exe
```

If the API is active, you’ll see something like:
```
BRLTTY API Test
Connected to BRLTTY API.
Enter command (help for list):
>
```

---

## 💬 3. Try some example commands

| Command | Description |
|----------|-------------|
| `help` | Show available commands |
| `write Hello world!` | Write text to the Braille display |
| `dots 0x28` | Manually set Braille dots (hex pattern) |
| `cursor 3` | Move cursor to cell 3 |
| `key` | Wait for a key press on the display |
| `quit` | Exit the program |

You’ll see output confirming what was sent or received.

---

## 🧾 4. Optional parameters

You can specify host or port manually:

```cmd
apitest.exe --host localhost --port 4101 --verbose
```

Default connection:
- Host: `localhost`
- Port: `4101` (BRLTTY API port)

---

## 🔍 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot connect to BRLTTY API` | Ensure `brltty.exe` is running. |
| `Display not responding` | Check USB driver (WinUSB / Zadig). |
| `No output` | Try `brltty.exe -l all` to view logs. |

---

## ✅ Summary

`apitest.exe` is a small interactive program to:
- verify the **BRLTTY API** connection,  
- test **text output** and **key input** on your Braille display,  
- debug new drivers or display connections.

Use it as a quick diagnostic tool before building or integrating your own BRLTTY client.

---