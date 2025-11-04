# 🧩 Getting BRLTTY Running on Windows

BRLTTY is a background service that connects your computer to a **Braille display**.  
It translates screen text into Braille and provides an API for other software (like screen readers or `apitest.exe`).

---

## ⚙️ 1. Download and Install BRLTTY

1. Go to the official site:  
   👉 [https://brltty.app](https://brltty.app)
2. Choose **Windows version** (ZIP or installer).
3. Extract or install it to:  
   `C:\Program Files\BRLTTY\`

After installation, the main files will be in:
```
C:\Program Files\BRLTTY\bin\
```

---

## 🧠 2. Connect Your Braille Display

- Plug in your **USB** or **Bluetooth** Braille display.  
- Windows Device Manager should show it (e.g. under *Ports* or *USB Devices*).  
- If not recognized, install a **WinUSB** driver using **Zadig**:
  1. Open Zadig → select your Braille device.  
  2. Choose *WinUSB (libusb)* → click *Install Driver*.

---

## 🧰 3. Open Command Prompt as Administrator

Press:
```
Win + X → Terminal (Admin)
```

Then navigate to the BRLTTY folder:
```cmd
cd "C:\Program Files\BRLTTY\bin"
```

---

## ▶️ 4. Start BRLTTY Manually

Use this command:
```cmd
brltty.exe -b auto -d auto -t auto
```

### Explanation:
| Option | Meaning |
|---------|----------|
| `-b auto` | Auto-detect Braille driver |
| `-d auto` | Auto-detect device |
| `-t auto` | Auto-detect text table |

If successful, you’ll see output like:
```
BRLTTY starting...
Braille display detected: Focus 40 Blue
```

Your Braille display should now show output (like "BRLTTY").

---

## 🧩 5. Verify It’s Running

You can check the BRLTTY service with:
```cmd
tasklist | find "brltty.exe"
```

Or look for **BRLTTY** in Windows Task Manager → *Processes* tab.

---

## 🧾 6. Optional: Install as a Windows Service

To run automatically at startup:
```cmd
brltty.exe -i service
```

To uninstall later:
```cmd
brltty.exe -r service
```

---

## 🔍 7. View Logs

Logs are saved in:
```
C:\Program Files\BRLTTY\log\
```

Or specify your own log file:
```cmd
brltty.exe -l all -L brltty.log
```

---

## ✅ 8. Test Connection

Once BRLTTY is running, you can test communication using:
```cmd
apitest.exe
```

If it connects successfully:
```
Connected to BRLTTY API.
```

You’re ready to send Braille commands and verify display input/output.

---

## 🧩 Summary

**Checklist:**
1. Install BRLTTY  
2. Connect Braille display  
3. Install WinUSB driver (if needed)  
4. Start BRLTTY (`brltty.exe -b auto -d auto -t auto`)  
5. Verify it’s running  
6. Use `apitest.exe` to test communication  

Once it’s running, BRLTTY can serve any application (like NVDA or custom C/Qt apps) via its **BRLAPI** interface.

---