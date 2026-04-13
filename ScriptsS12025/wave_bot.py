import pynput
from pynput.mouse import Listener as MouseListener
from pynput.keyboard import Controller as KeyboardController, Key

keyboard = KeyboardController()

# Press space when mouse is clicked
def on_click(x, y, button, pressed):
    if pressed:
        try:
            keyboard.press(Key.space)
        except:
            pass
    else:
        try:
            keyboard.release(Key.space)
        except:
            pass

# Start listening for mouse clicks
with MouseListener(on_click=on_click) as listener:
    listener.join()
