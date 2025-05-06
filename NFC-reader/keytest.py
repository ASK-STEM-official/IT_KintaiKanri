import os
import time

time.sleep(3)  # 入力先ウィンドウを切り替える猶予

# キーボードで「Hello, world!」と入力し、Enterを押す
os.system("ydotool type 'Hello, world!'")
os.system("ydotool key 28")  # Enterキー（keycode 28）
